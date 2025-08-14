// app/api/sales-call-analyzer/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { rateLimit } from '../../../../lib/rateLimit';
import { logUsage } from '@/lib/usage';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data for file upload
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Check file size (max 25MB - Whisper limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    // Check file type - Whisper supported formats
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/mp4', 'audio/m4a', 
      'audio/webm', 'audio/flac', 'audio/ogg', 'video/mp4', 'video/mpeg',
      'video/mov', 'video/avi', 'video/wmv', 'video/flv'
    ];
    
    const isValidType = allowedTypes.includes(audioFile.type) || 
                       audioFile.name.match(/\.(mp3|wav|mp4|m4a|webm|flac|ogg|mpeg|mov|avi|wmv|flv)$/i);
    
    if (!isValidType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please use MP3, WAV, MP4, M4A, WEBM, FLAC, OGG, or video formats.' },
        { status: 400 }
      );
    }

    // Rate limiting for transcription - 10 per hour (more generous for production)
    const rateLimitResult = await rateLimit(`transcribe:${user.id}`, 10, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many transcription requests. Please try again later.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const startTime = Date.now();

    try {
      // Create FormData for OpenAI Whisper API
      const whisperFormData = new FormData();
      whisperFormData.append('file', audioFile);
      whisperFormData.append('model', 'whisper-1');
      whisperFormData.append('response_format', 'verbose_json');
      whisperFormData.append('timestamp_granularities[]', 'word');
      whisperFormData.append('timestamp_granularities[]', 'segment');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: whisperFormData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Whisper API error:', errorData);
        
        if (response.status === 429) {
          return NextResponse.json(
            { error: 'Transcription service rate limit exceeded. Please try again later.' },
            { status: 429 }
          );
        }
        
        throw new Error(`Whisper API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const transcriptionData = await response.json();
      const processingTime = Date.now() - startTime;

      // Format transcript with basic speaker detection
      const formattedTranscript = formatTranscriptWithSpeakers(transcriptionData);
      
      // Extract useful metadata
      const segments = transcriptionData.segments || [];
      const words = transcriptionData.words || [];
      const duration = transcriptionData.duration || 0;
      
      // Estimate speakers and their speaking time
      const speakerStats = estimateSpeakerStats(segments, duration);

      // Log usage for billing/analytics
      await logUsage({
        userId: user.id,
        feature: 'audio_transcription',
        tokens: Math.ceil(duration * 10), // Rough token estimate based on duration
        timestamp: new Date(),
        metadata: {
          filename: audioFile.name,
          fileSize: audioFile.size,
          fileType: audioFile.type,
          duration: duration,
          wordCount: words.length,
          segmentCount: segments.length,
          processingTime,
          whisperModel: 'whisper-1'
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          transcript: formattedTranscript,
          rawTranscript: transcriptionData.text,
          confidence: calculateAverageConfidence(words),
          duration: duration,
          wordCount: words.length,
          segmentCount: segments.length,
          speakers: speakerStats,
          language: transcriptionData.language || 'en',
          segments: segments.map((seg: any) => ({
            text: seg.text,
            start: seg.start,
            end: seg.end,
            confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : null
          }))
        },
        meta: {
          processingTime,
          service: 'openai-whisper',
          model: 'whisper-1',
          remaining: rateLimitResult.limit - rateLimitResult.count
        }
      });

    } catch (transcriptionError) {
      console.error('Transcription processing error:', transcriptionError);
      
      // Provide helpful error messages
      if (transcriptionError instanceof Error) {
        if (transcriptionError.message.includes('rate limit')) {
          return NextResponse.json(
            { error: 'Transcription service temporarily unavailable. Please try again in a few minutes.' },
            { status: 429 }
          );
        }
        
        if (transcriptionError.message.includes('file format')) {
          return NextResponse.json(
            { error: 'Invalid audio format. Please convert to MP3, WAV, or MP4 and try again.' },
            { status: 400 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to transcribe audio. Please check the file format and try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Transcription Error:', error);
    return NextResponse.json(
      { error: 'Failed to process transcription request. Please try again.' },
      { status: 500 }
    );
  }
}

// Helper functions for transcription processing
function formatTranscriptWithSpeakers(transcriptionData: any): string {
  const segments = transcriptionData.segments || [];
  
  if (segments.length === 0) {
    return transcriptionData.text || '';
  }
  
  // Simple speaker diarization based on pauses and speaking patterns
  const speakerSegments: Array<{ speaker: string; text: string; start: number }> = [];
  let currentSpeaker = 1;
  let lastEndTime = 0;
  
  for (const segment of segments) {
    const timeDiff = segment.start - lastEndTime;
    
    // If there's a pause longer than 3 seconds, assume speaker change
    if (timeDiff > 3.0 && speakerSegments.length > 0) {
      currentSpeaker = currentSpeaker === 1 ? 2 : 1;
    }
    
    speakerSegments.push({
      speaker: `Speaker ${currentSpeaker}`,
      text: segment.text.trim(),
      start: segment.start
    });
    
    lastEndTime = segment.end;
  }
  
  // Group consecutive segments from the same speaker
  const groupedSegments: Array<{ speaker: string; text: string }> = [];
  let currentGroup = { speaker: '', text: '' };
  
  for (const segment of speakerSegments) {
    if (currentGroup.speaker === segment.speaker) {
      currentGroup.text += ' ' + segment.text;
    } else {
      if (currentGroup.text) {
        groupedSegments.push({ ...currentGroup });
      }
      currentGroup = { speaker: segment.speaker, text: segment.text };
    }
  }
  
  // Add the final group
  if (currentGroup.text) {
    groupedSegments.push(currentGroup);
  }
  
  // Format as readable transcript
  return groupedSegments
    .map(group => `${group.speaker}: ${group.text.trim()}`)
    .join('\n\n');
}

function estimateSpeakerStats(segments: any[], totalDuration: number) {
  if (segments.length === 0) {
    return [{ name: 'Speaker 1', speakingTime: totalDuration, percentage: 100 }];
  }
  
  const speakerTimes: Record<string, number> = {};
  let currentSpeaker = 1;
  let lastEndTime = 0;
  
  for (const segment of segments) {
    const timeDiff = segment.start - lastEndTime;
    
    // Speaker change detection (same logic as formatting)
    if (timeDiff > 3.0 && Object.keys(speakerTimes).length > 0) {
      currentSpeaker = currentSpeaker === 1 ? 2 : 1;
    }
    
    const speakerName = `Speaker ${currentSpeaker}`;
    const duration = segment.end - segment.start;
    
    speakerTimes[speakerName] = (speakerTimes[speakerName] || 0) + duration;
    lastEndTime = segment.end;
  }
  
  const totalSpeakingTime = Object.values(speakerTimes).reduce((sum, time) => sum + time, 0);
  
  return Object.entries(speakerTimes).map(([name, time]) => ({
    name,
    speakingTime: Math.round(time),
    percentage: Math.round((time / totalSpeakingTime) * 100)
  }));
}

function calculateAverageConfidence(words: any[]): number {
  if (!words || words.length === 0) return 0.95; // Default high confidence if no word-level data
  
  // Whisper doesn't provide confidence scores directly, but we can estimate from probability
  const confidenceScores = words
    .filter(word => word.probability !== undefined)
    .map(word => word.probability);
    
  if (confidenceScores.length === 0) return 0.95;
  
  const avgConfidence = confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length;
  return Math.round(avgConfidence * 100) / 100;
}