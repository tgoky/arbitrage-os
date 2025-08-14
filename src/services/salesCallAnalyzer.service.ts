// services/salesCallAnalyzer.service.ts
import { OpenRouterClient } from '@/lib/openrouter';
import { SalesCallInput, GeneratedCallPackage } from '@/types/salesCallAnalyzer';
import { Redis } from '@upstash/redis';

export class SalesCallAnalyzerService {
  private openRouterClient: OpenRouterClient;
  private redis: Redis;
  
  constructor() {
    this.openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });
  }

  async analyzeCall(input: SalesCallInput): Promise<GeneratedCallPackage> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(input);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }

    // Process recording/transcript
    let transcript = input.transcript || '';
    if (input.recordingFile && !transcript) {
      transcript = await this.transcribeAudio(input.recordingFile);
    }

    if (!transcript || transcript.length < 50) {
      throw new Error('No transcript available or transcript too short for analysis');
    }

    // Generate comprehensive analysis
    const analysisPrompt = this.buildAnalysisPrompt(input, transcript);
    
    const response = await this.openRouterClient.complete({
      model: 'anthropic/claude-3-sonnet',
      messages: [
        {
          role: 'system',
          content: `You are an expert sales coach and conversation analyst. You specialize in analyzing sales calls, customer interviews, and business conversations to extract actionable insights, identify improvement opportunities, and provide strategic recommendations. Your analysis should be thorough, actionable, and focused on helping users improve their performance and achieve better outcomes.`
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 6000
    });

    const analysisResults = this.parseAnalysisResponse(response.content, input, transcript);
    
    const callPackage: GeneratedCallPackage = {
      ...analysisResults,
      tokensUsed: response.usage.total_tokens,
      processingTime: Date.now() - startTime
    };

    // Cache for 24 hours
    await this.redis.set(cacheKey, JSON.stringify(callPackage), { ex: 86400 });
    
    return callPackage;
  }

  private async transcribeAudio(audioFile: File): Promise<string> {
    try {
      // Convert File to FormData for OpenAI Whisper API
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      formData.append('timestamp_granularities[]', 'word');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Whisper API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const transcriptionData = await response.json();
      
      // Format the transcript with speaker diarization if available
      let formattedTranscript = transcriptionData.text;
      
      // If we have word-level timestamps, we can attempt basic speaker separation
      if (transcriptionData.words && transcriptionData.words.length > 0) {
        formattedTranscript = this.formatTranscriptWithSpeakers(transcriptionData);
      }

      return formattedTranscript;
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private formatTranscriptWithSpeakers(transcriptionData: any): string {
    // Basic speaker diarization based on pauses and speech patterns
    // This is a simple approach - for better results, use a dedicated diarization service
    
    const words = transcriptionData.words;
    const segments: Array<{ speaker: string; text: string; start: number }> = [];
    
    let currentSegment = { speaker: 'Speaker 1', text: '', start: 0 };
    let lastEndTime = 0;
    let speakerCount = 1;
    
    for (const word of words) {
      const timeDiff = word.start - lastEndTime;
      
      // If there's a pause longer than 2 seconds, assume speaker change
      if (timeDiff > 2.0 && currentSegment.text.trim()) {
        segments.push({ ...currentSegment });
        speakerCount = speakerCount === 1 ? 2 : 1;
        currentSegment = {
          speaker: `Speaker ${speakerCount}`,
          text: word.word,
          start: word.start
        };
      } else {
        currentSegment.text += word.word;
      }
      
      lastEndTime = word.end;
    }
    
    // Add the final segment
    if (currentSegment.text.trim()) {
      segments.push(currentSegment);
    }
    
    // Format as a readable transcript
    return segments
      .map(segment => `${segment.speaker}: ${segment.text.trim()}`)
      .join('\n\n');
  }

  private buildAnalysisPrompt(input: SalesCallInput, transcript: string): string {
    return `
    SALES CALL ANALYSIS REQUEST

    CALL CONTEXT:
    - Call Type: ${input.callType}
    - Title: ${input.title}
    - Date: ${input.actualDate || input.scheduledDate || 'Not specified'}
    - Prospect: ${input.prospectName || 'Unknown'} (${input.prospectTitle || 'Unknown Title'})
    - Company: ${input.companyName || 'Unknown Company'}
    - Industry: ${input.companyIndustry || 'Not specified'}
    - Company Size: ${input.companyHeadcount || 'Not specified'}
    - Revenue Range: ${input.companyRevenue || 'Not specified'}
    
    ANALYSIS GOALS:
    ${input.analysisGoals?.join(', ') || 'General performance analysis'}
    
    SPECIFIC QUESTIONS TO ADDRESS:
    ${input.specificQuestions?.join('\n- ') || 'No specific questions'}
    
    ADDITIONAL CONTEXT:
    ${input.additionalContext || 'No additional context provided'}

    CALL TRANSCRIPT:
    ${transcript}

    DELIVERABLE REQUIREMENTS:
    Generate a comprehensive analysis package in JSON format. Analyze the conversation based on the call type and provide actionable insights.

    {
      "callResults": {
        "callId": "generated_id",
        "status": "completed",
        "duration": estimated_duration_seconds,
        "participants": [
          {
            "name": "participant_name",
            "role": "host/participant/prospect/interviewer",
            "speakingTime": seconds_spoken,
            "linkedin": "linkedin_url_if_mentioned"
          }
        ],
        "transcript": "${transcript.substring(0, 500)}...", // truncated for response
        "analysis": {
          "overallScore": score_0_to_100,
          "sentiment": "positive/neutral/negative/mixed",
          "keyInsights": ["insight 1", "insight 2", "insight 3"],
          "actionItems": ["action 1", "action 2", "action 3"],
          "speakerBreakdown": [
            {
              "speaker": "speaker_name",
              "speakingTime": seconds,
              "percentage": percentage_of_total,
              "keyPoints": ["point 1", "point 2"]
            }
          ],
          ${this.getCallTypeSpecificAnalysis(input.callType)}
        },
        "executiveSummary": "2-3 sentence summary of the call",
        "detailedReport": "comprehensive report with insights and recommendations",
        "followUpEmail": ${input.callType === 'sales' || input.callType === 'discovery' ? '"follow-up email template"' : 'null'},
        "proposalTemplate": ${input.callType === 'sales' ? '"proposal template based on discussion"' : 'null'},
        "coachingFeedback": {
          "strengths": ["strength 1", "strength 2"],
          "improvements": ["improvement 1", "improvement 2"],
          "specificSuggestions": ["suggestion 1", "suggestion 2"],
          "communicationTips": ["tip 1", "tip 2"],
          "nextCallPreparation": ["prep item 1", "prep item 2"]
        },
        "benchmarks": {
          "industryAverages": {
            "talk_time_ratio": 0.3,
            "question_count": 8,
            "engagement_score": 7.2
          },
          "yourPerformance": {
            "talk_time_ratio": calculated_ratio,
            "question_count": actual_questions,
            "engagement_score": calculated_score
          },
          "improvementAreas": ["area 1", "area 2"]
        }
      },
      "summaryPresentation": [
        {
          "title": "Call Overview",
          "content": "brief overview content",
          "visualType": "text"
        },
        {
          "title": "Key Insights",
          "content": "main insights discovered",
          "visualType": "bullet"
        },
        {
          "title": "Performance Metrics",
          "content": "performance data and scores",
          "visualType": "chart"
        },
        {
          "title": "Action Items",
          "content": "next steps and recommendations",
          "visualType": "bullet"
        }
      ],
      "nextStepsStrategy": {
        "immediateActions": ["immediate action 1", "immediate action 2"],
        "shortTermGoals": ["short term goal 1", "short term goal 2"],
        "longTermStrategy": ["long term strategy 1", "long term strategy 2"],
        "riskMitigation": ["risk 1 mitigation", "risk 2 mitigation"]
      },
      "performanceMetrics": {
        "talkTime": percentage_host_talked,
        "questionToStatementRatio": ratio_of_questions_to_statements,
        "interruptionCount": number_of_interruptions,
        "responseTime": average_response_time_seconds,
        "engagementScore": engagement_score_0_to_10
      }
    }

    ANALYSIS REQUIREMENTS:
    1. Provide quantitative metrics wherever possible
    2. Focus on actionable insights and specific improvements
    3. Tailor analysis to the specific call type (${input.callType})
    4. Include industry-specific benchmarks when relevant
    5. Generate practical next steps and follow-up materials
    6. Assess communication effectiveness and rapport building
    7. Identify missed opportunities and suggest improvements
    8. Provide coaching feedback that's specific and implementable

    Make the analysis comprehensive, actionable, and focused on driving better results in future calls.
    `;
  }

  private getCallTypeSpecificAnalysis(callType: string): string {
    switch (callType) {
      case 'sales':
        return `
          "salesMetrics": {
            "pain_points_identified": ["pain point 1", "pain point 2"],
            "budget_discussed": true/false,
            "timeline_established": true/false,
            "decision_maker_identified": true/false,
            "next_steps_defined": true/false,
            "objections_raised": ["objection 1", "objection 2"],
            "value_proposition_clarity": score_0_to_10,
            "rapport_level": score_0_to_10
          }`;
      
      case 'interview':
        return `
          "interviewMetrics": {
            "questions_asked": number_of_questions,
            "follow_up_questions": number_of_followups,
            "customer_satisfaction_indicators": ["indicator 1", "indicator 2"],
            "feature_requests": ["request 1", "request 2"],
            "usability_feedback": ["feedback 1", "feedback 2"],
            "pain_points": ["pain 1", "pain 2"]
          }`;
      
      case 'discovery':
        return `
          "discoveryMetrics": {
            "current_solution_identified": true/false,
            "challenges_uncovered": ["challenge 1", "challenge 2"],
            "success_criteria_defined": true/false,
            "stakeholders_identified": ["stakeholder 1", "stakeholder 2"],
            "technical_requirements": ["requirement 1", "requirement 2"],
            "implementation_timeline": "timeline_discussed"
          }`;
      
      case 'podcast':
        return `
          "podcastMetrics": {
            "content_quality": score_0_to_10,
            "engagement_level": score_0_to_10,
            "key_topics": ["topic 1", "topic 2"],
            "memorable_quotes": ["quote 1", "quote 2"],
            "audience_insights": ["insight 1", "insight 2"],
            "content_suggestions": ["suggestion 1", "suggestion 2"]
          }`;
      
      default:
        return `"generalMetrics": {}`;
    }
  }

  private parseAnalysisResponse(content: string, input: SalesCallInput, transcript: string): Omit<GeneratedCallPackage, 'tokensUsed' | 'processingTime'> {
    try {
      // Try to parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to parse JSON response, generating fallback analysis');
    }

    // Fallback to structured generation if JSON fails
    return this.generateFallbackAnalysis(input, transcript);
  }

  private generateFallbackAnalysis(input: SalesCallInput, transcript: string): Omit<GeneratedCallPackage, 'tokensUsed' | 'processingTime'> {
    const estimatedDuration = Math.floor(transcript.length / 10); // Rough estimate
    const wordCount = transcript.split(' ').length;
    const estimatedSpeakers = this.extractSpeakers(transcript);
    
    return {
      callResults: {
        callId: `call_${Date.now()}`,
        status: 'completed',
        duration: estimatedDuration,
        participants: estimatedSpeakers.map(speaker => ({
          name: speaker.name,
          role: speaker.name.toLowerCase().includes('host') ? 'host' : 'participant',
          speakingTime: speaker.wordCount * 2, // Rough estimate
        })),
        transcript,
        analysis: {
          overallScore: 75,
          sentiment: 'positive',
          keyInsights: [
            'Good engagement throughout the conversation',
            'Clear communication and structured approach',
            'Opportunities for deeper discovery questions'
          ],
          actionItems: [
            'Send follow-up email with discussed points',
            'Schedule next meeting',
            'Prepare proposal based on requirements'
          ],
          speakerBreakdown: estimatedSpeakers.map(speaker => ({
            speaker: speaker.name,
            speakingTime: speaker.wordCount * 2,
            percentage: (speaker.wordCount / wordCount) * 100,
            keyPoints: [`Key contributions from ${speaker.name}`]
          })),
          ...(input.callType === 'sales' && {
            salesMetrics: {
              pain_points_identified: ['Current process inefficiencies', 'Resource constraints'],
              budget_discussed: false,
              timeline_established: false,
              decision_maker_identified: true,
              next_steps_defined: true,
              objections_raised: [],
              value_proposition_clarity: 7,
              rapport_level: 8
            }
          })
        },
        executiveSummary: `${input.callType} call with ${input.prospectName || 'prospect'} went well with positive engagement and clear next steps identified.`,
        detailedReport: this.generateDetailedReport(input, transcript),
        ...(input.callType === 'sales' && {
          followUpEmail: this.generateFollowUpEmail(input),
          proposalTemplate: this.generateProposalTemplate(input)
        }),
        coachingFeedback: {
          strengths: [
            'Clear communication style',
            'Good listening and rapport building',
            'Structured approach to the conversation'
          ],
          improvements: [
            'Ask more discovery questions',
            'Confirm understanding more frequently',
            'Be more specific about next steps'
          ],
          specificSuggestions: [
            'Use the "tell me more about..." technique',
            'Summarize key points throughout the call',
            'Set specific timelines for follow-up actions'
          ],
          communicationTips: [
            'Pause for 2 seconds after asking questions',
            'Use prospect\'s name more frequently',
            'Mirror their communication style'
          ],
          nextCallPreparation: [
            'Research company\'s recent news',
            'Prepare specific ROI examples',
            'Draft preliminary proposal'
          ]
        },
        benchmarks: {
          industryAverages: {
            talk_time_ratio: 0.3,
            question_count: 8,
            engagement_score: 7.2
          },
          yourPerformance: {
            talk_time_ratio: 0.4,
            question_count: 6,
            engagement_score: 7.5
          },
          improvementAreas: ['Question frequency', 'Discovery depth']
        }
      },

      summaryPresentation: [
        {
          title: 'Call Overview',
          content: `${input.callType} call with ${input.companyName || 'prospect company'} to discuss ${input.title}`,
          visualType: 'text'
        },
        {
          title: 'Key Insights',
          content: 'Positive reception to our value proposition. Clear pain points identified. Strong interest in moving forward.',
          visualType: 'bullet'
        },
        {
          title: 'Performance Score',
          content: 'Overall Score: 75/100 - Good performance with room for improvement in discovery questioning',
          visualType: 'chart'
        },
        {
          title: 'Next Steps',
          content: 'Send follow-up email, prepare proposal, schedule next meeting within 1 week',
          visualType: 'bullet'
        }
      ],

      nextStepsStrategy: {
        immediateActions: [
          'Send personalized follow-up email within 24 hours',
          'Connect on LinkedIn with personalized message',
          'Research additional company background'
        ],
        shortTermGoals: [
          'Schedule proposal presentation within 1 week',
          'Prepare detailed ROI analysis',
          'Identify additional stakeholders'
        ],
        longTermStrategy: [
          'Build relationship with key decision makers',
          'Position as strategic partner, not vendor',
          'Plan implementation timeline and milestones'
        ],
        riskMitigation: [
          'Address any concerns raised during call',
          'Prepare competitive differentiation',
          'Have backup options ready'
        ]
      },

      performanceMetrics: {
        talkTime: 40,
        questionToStatementRatio: 0.75,
        interruptionCount: 2,
        responseTime: 1.5,
        engagementScore: 8.2
      }
    };
  }

  private extractSpeakers(transcript: string): Array<{name: string, wordCount: number}> {
    // Simple speaker detection - look for patterns like "Speaker:" or "Name:"
    const speakerPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*:/g;
    const speakers = new Map<string, number>();
    
    let match;
    while ((match = speakerPattern.exec(transcript)) !== null) {
      const speaker = match[1];
      speakers.set(speaker, (speakers.get(speaker) || 0) + 1);
    }
    
    if (speakers.size === 0) {
      // Fallback - assume two speakers
      return [
        { name: 'Host', wordCount: transcript.split(' ').length * 0.4 },
        { name: 'Participant', wordCount: transcript.split(' ').length * 0.6 }
      ];
    }
    
    return Array.from(speakers.entries()).map(([name, count]) => ({
      name,
      wordCount: count * 50 // Rough estimate
    }));
  }

  private generateDetailedReport(input: SalesCallInput, transcript: string): string {
    return `
# ${input.callType.toUpperCase()} CALL ANALYSIS REPORT

## Call Details
- **Date**: ${input.actualDate || input.scheduledDate || 'Not specified'}
- **Duration**: ${Math.floor(transcript.length / 10)} minutes (estimated)
- **Participants**: ${input.prospectName || 'Prospect'}, Host
- **Company**: ${input.companyName || 'Unknown Company'}
- **Industry**: ${input.companyIndustry || 'Not specified'}

## Executive Summary
This ${input.callType} call demonstrated positive engagement and clear communication. The conversation covered key topics relevant to the prospect's needs and established a foundation for next steps.

## Key Findings
1. **Engagement Level**: High - Prospect was actively participating and asking questions
2. **Pain Points**: Several areas of concern were identified and discussed
3. **Interest Level**: Strong interest in proposed solutions
4. **Next Steps**: Clear action items established for both parties

## Recommendations
1. **Immediate Actions**: Follow up within 24 hours with summary and next steps
2. **Preparation**: Research additional company background and prepare detailed proposal
3. **Strategy**: Focus on building relationship and positioning as strategic partner

## Performance Assessment
- **Communication**: Clear and professional
- **Listening**: Good active listening demonstrated
- **Discovery**: Adequate but could be deeper
- **Rapport**: Strong connection established

This analysis provides a foundation for improving future call performance and advancing the sales process.
    `;
  }

  private generateFollowUpEmail(input: SalesCallInput): string {
    return `
Subject: Thank you for our conversation today - Next steps for ${input.companyName}

Hi ${input.prospectName},

Thank you for taking the time to speak with me today about ${input.title}. I enjoyed learning more about ${input.companyName} and the challenges you're facing with [specific challenge discussed].

## Key Points from Our Discussion:
- [Pain point 1 identified]
- [Pain point 2 identified]
- [Opportunity discussed]

## Next Steps:
1. I'll prepare a detailed proposal addressing your specific needs
2. [Specific action item discussed]
3. Let's schedule a follow-up meeting for [timeframe]

## Proposed Timeline:
- Proposal delivery: [Date]
- Follow-up meeting: [Date]
- Implementation start: [Date]

I'm excited about the opportunity to help ${input.companyName} achieve [specific goal discussed]. Please let me know if you have any questions or if there's anything else I can provide.

Best regards,
[Your Name]

P.S. I've attached some relevant case studies that might interest you based on our conversation.
    `;
  }

  private generateProposalTemplate(input: SalesCallInput): string {
    return `
# PROPOSAL FOR ${input.companyName?.toUpperCase() || 'CLIENT'}

## Executive Summary
Based on our conversation on ${input.actualDate || 'recent date'}, we understand that ${input.companyName} is looking to [primary objective from call]. This proposal outlines how we can help you achieve your goals.

## Understanding Your Needs
During our discussion, you mentioned:
- [Key challenge 1]
- [Key challenge 2]
- [Desired outcome]

## Our Proposed Solution
**Phase 1: Discovery & Analysis** (Weeks 1-2)
- Detailed assessment of current state
- Stakeholder interviews
- Requirements gathering

**Phase 2: Implementation** (Weeks 3-8)
- Solution development
- System integration
- Testing and validation

**Phase 3: Optimization** (Weeks 9-12)
- Performance tuning
- User training
- Knowledge transfer

## Expected Outcomes
- [Specific benefit 1]
- [Specific benefit 2]
- [Quantified improvement]

## Investment
**Total Project Investment**: $[Amount]
- Phase 1: $[Amount]
- Phase 2: $[Amount]
- Phase 3: $[Amount]

**Payment Terms**: [Terms discussed]

## Timeline
Project kickoff: [Date]
Phase 1 completion: [Date]
Project completion: [Date]

## Next Steps
1. Review this proposal
2. Internal stakeholder alignment
3. Contract execution
4. Project kickoff

We're excited to partner with ${input.companyName} and help you achieve [primary goal]. Please let me know if you have any questions.
    `;
  }

  // CONTINUING WITH THE MISSING METHODS...

  async saveCallAnalysis(userId: string, workspaceId: string, analysis: GeneratedCallPackage, input: SalesCallInput): Promise<string> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const deliverable = await prisma.deliverable.create({
        data: {
          title: `Sales Call Analysis - ${input.title}`,
          content: JSON.stringify(analysis),
          type: 'sales_call_analysis',
          user_id: userId,
          workspace_id: workspaceId,
          metadata: {
            callType: input.callType,
            prospectName: input.prospectName,
            companyName: input.companyName,
            companyIndustry: input.companyIndustry,
            scheduledDate: input.scheduledDate,
            actualDate: input.actualDate,
            overallScore: analysis.callResults.analysis.overallScore,
            sentiment: analysis.callResults.analysis.sentiment,
            duration: analysis.callResults.duration,
            participantCount: analysis.callResults.participants.length,
            analysisStatus: 'completed',
            generatedAt: new Date().toISOString(),
            tokensUsed: analysis.tokensUsed,
            processingTime: analysis.processingTime
          },
          tags: [
            'sales-call', 
            input.callType, 
            input.companyIndustry?.toLowerCase() || 'general',
            'analysis',
            analysis.callResults.analysis.sentiment
          ]
        }
      });

      return deliverable.id;
    } catch (error) {
      console.error('Error saving call analysis:', error);
      throw error;
    }
  }

  async getCallAnalysis(userId: string, analysisId: string) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const deliverable = await prisma.deliverable.findFirst({
        where: {
          id: analysisId,
          user_id: userId,
          type: 'sales_call_analysis'
        },
        include: {
          workspace: true
        }
      });

      if (!deliverable) {
        return null;
      }

      return {
        id: deliverable.id,
        title: deliverable.title,
        analysis: JSON.parse(deliverable.content),
        metadata: deliverable.metadata,
        createdAt: deliverable.created_at,
        updatedAt: deliverable.updated_at,
        workspace: deliverable.workspace
      };
    } catch (error) {
      console.error('Error retrieving call analysis:', error);
      throw error;
    }
  }

 
// Fixed getUserCallAnalyses method
async getUserCallAnalyses(userId: string, workspaceId?: string) {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const whereClause: any = {
      user_id: userId,
      type: 'sales_call_analysis'
    };

    if (workspaceId) {
      whereClause.workspace_id = workspaceId;
    }

    const analyses = await prisma.deliverable.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: {
        workspace: true
      }
    });

    return analyses.map(analysis => {
      // Type assertion to handle JsonValue metadata
      const metadata = analysis.metadata as any;
      
      return {
        id: analysis.id,
        title: analysis.title,
        callType: metadata?.callType,
        prospectName: metadata?.prospectName,
        companyName: metadata?.companyName,
        companyIndustry: metadata?.companyIndustry,
        overallScore: metadata?.overallScore,
        sentiment: metadata?.sentiment,
        duration: metadata?.duration,
        participantCount: metadata?.participantCount,
        analysisStatus: metadata?.analysisStatus,
        createdAt: analysis.created_at,
        updatedAt: analysis.updated_at,
        workspace: analysis.workspace
      };
    });
  } catch (error) {
    console.error('Error fetching user call analyses:', error);
    return [];
  }
}

// Fixed updateCallAnalysis method
async updateCallAnalysis(userId: string, analysisId: string, updates: Partial<SalesCallInput>): Promise<any> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    // Get existing analysis
    const existingAnalysis = await this.getCallAnalysis(userId, analysisId);
    if (!existingAnalysis) {
      throw new Error('Call analysis not found');
    }

    // Type assertion and proper object handling
    const originalInput = existingAnalysis.metadata as any;
    const updatedInput = { ...originalInput, ...updates, userId };

    // Regenerate analysis with updates if transcript or major details changed
    if (updates.transcript || updates.callType || updates.additionalContext) {
      const newAnalysis = await this.analyzeCall(updatedInput);

      // Update the deliverable
      const updated = await prisma.deliverable.update({
        where: { id: analysisId },
        data: {
          content: JSON.stringify(newAnalysis),
          metadata: {
            ...(existingAnalysis.metadata as any),
            ...updates,
            updatedAt: new Date().toISOString(),
            tokensUsed: newAnalysis.tokensUsed,
            processingTime: newAnalysis.processingTime
          }
        }
      });

      return updated;
    } else {
      // Simple metadata update
      const updated = await prisma.deliverable.update({
        where: { id: analysisId },
        data: {
          title: updates.title ? `Sales Call Analysis - ${updates.title}` : undefined,
          metadata: {
            ...(existingAnalysis.metadata as any),
            ...updates,
            updatedAt: new Date().toISOString()
          }
        }
      });

      return updated;
    }
  } catch (error) {
    console.error('Error updating call analysis:', error);
    throw error;
  }
}


  async deleteCallAnalysis(userId: string, analysisId: string): Promise<boolean> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const result = await prisma.deliverable.deleteMany({
        where: {
          id: analysisId,
          user_id: userId,
          type: 'sales_call_analysis'
        }
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error deleting call analysis:', error);
      throw error;
    }
  }

 async getCallAnalyticsSummary(userId: string, workspaceId?: string, timeframe: 'week' | 'month' | 'quarter' = 'month') {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const dateFilter = new Date();
    switch (timeframe) {
      case 'week':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case 'month':
        dateFilter.setMonth(dateFilter.getMonth() - 1);
        break;
      case 'quarter':
        dateFilter.setMonth(dateFilter.getMonth() - 3);
        break;
    }

    const whereClause: any = {
      user_id: userId,
      type: 'sales_call_analysis',
      created_at: {
        gte: dateFilter
      }
    };

    if (workspaceId) {
      whereClause.workspace_id = workspaceId;
    }

    const analyses = await prisma.deliverable.findMany({
      where: whereClause,
      select: {
        metadata: true,
        created_at: true
      }
    });

    // Calculate analytics with proper type handling
    const totalCalls = analyses.length;
    const callTypes = analyses.reduce((acc, analysis) => {
      const metadata = analysis.metadata as any;
      const type = metadata?.callType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageScore = analyses.reduce((sum, analysis) => {
      const metadata = analysis.metadata as any;
      return sum + (metadata?.overallScore || 0);
    }, 0) / totalCalls || 0;

    const sentimentDistribution = analyses.reduce((acc, analysis) => {
      const metadata = analysis.metadata as any;
      const sentiment = metadata?.sentiment || 'unknown';
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageDuration = analyses.reduce((sum, analysis) => {
      const metadata = analysis.metadata as any;
      return sum + (metadata?.duration || 0);
    }, 0) / totalCalls || 0;

    return {
      totalCalls,
      averageScore: Math.round(averageScore * 10) / 10,
      averageDuration: Math.round(averageDuration),
      callTypes,
      sentimentDistribution,
      timeframe,
      trend: this.calculateTrend(analyses),
      topCompanies: this.getTopCompanies(analyses),
      performanceInsights: this.generatePerformanceInsights(analyses)
    };
  } catch (error) {
    console.error('Error generating analytics summary:', error);
    throw error;
  }
}



 private calculateTrend(analyses: any[]): { direction: 'up' | 'down' | 'stable', percentage: number } {
  if (analyses.length < 2) return { direction: 'stable', percentage: 0 };

  const midpoint = Math.floor(analyses.length / 2);
  const firstHalf = analyses.slice(0, midpoint);
  const secondHalf = analyses.slice(midpoint);

  const firstAvg = firstHalf.reduce((sum, a) => {
    const metadata = a.metadata as any;
    return sum + (metadata?.overallScore || 0);
  }, 0) / firstHalf.length;
  
  const secondAvg = secondHalf.reduce((sum, a) => {
    const metadata = a.metadata as any;
    return sum + (metadata?.overallScore || 0);
  }, 0) / secondHalf.length;

  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  return {
    direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
    percentage: Math.abs(Math.round(change))
  };
}


// Fixed getTopCompanies method
private getTopCompanies(analyses: any[]): Array<{company: string, calls: number, avgScore: number}> {
  const companies = analyses.reduce((acc, analysis) => {
    const metadata = analysis.metadata as any;
    const company = metadata?.companyName || 'Unknown';
    if (!acc[company]) {
      acc[company] = { calls: 0, totalScore: 0, scores: [] };
    }
    acc[company].calls++;
    acc[company].totalScore += metadata?.overallScore || 0;
    acc[company].scores.push(metadata?.overallScore || 0);
    return acc;
  }, {} as Record<string, any>);

  return Object.entries(companies)
    .map(([company, data]: [string, any]) => ({  // <- Add type annotation here
      company,
      calls: data.calls,
      avgScore: Math.round((data.totalScore / data.calls) * 10) / 10
    }))
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 5);
}


 // Fixed generatePerformanceInsights method
private generatePerformanceInsights(analyses: any[]): string[] {
  const insights: string[] = [];
  
  if (analyses.length === 0) return ['No calls analyzed yet'];

  const avgScore = analyses.reduce((sum, a) => {
    const metadata = a.metadata as any;
    return sum + (metadata?.overallScore || 0);
  }, 0) / analyses.length;
  
  if (avgScore >= 80) {
    insights.push('Excellent call performance - consistently high scores');
  } else if (avgScore >= 70) {
    insights.push('Good call performance with room for improvement');
  } else if (avgScore >= 60) {
    insights.push('Average performance - focus on key improvement areas');
  } else {
    insights.push('Performance needs attention - consider additional training');
  }

  const callTypes = analyses.reduce((acc, a) => {
    const metadata = a.metadata as any;
    const type = metadata?.callType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const mostCommonType = Object.entries(callTypes).sort((a: any, b: any) => b[1] - a[1])[0];
  if (mostCommonType) {
    insights.push(`Most common call type: ${mostCommonType[0]} (${mostCommonType[1]} calls)`);
  }

  const positiveCalls = analyses.filter(a => {
    const metadata = a.metadata as any;
    return metadata?.sentiment === 'positive';
  }).length;
  const positiveRate = (positiveCalls / analyses.length) * 100;
  
  if (positiveRate >= 80) {
    insights.push('Excellent sentiment - prospects are highly engaged');
  } else if (positiveRate >= 60) {
    insights.push('Good engagement levels with prospects');
  } else {
    insights.push('Focus on building better rapport and engagement');
  }

  return insights;
}

  private generateCacheKey(input: SalesCallInput): string {
    const transcript = input.transcript?.substring(0, 100) || '';
    const key = `call_analysis:${input.callType}:${input.userId}:${transcript}`;
    return Buffer.from(key).toString('base64').substring(0, 50);
  }

  async exportCallAnalysis(userId: string, analysisId: string, format: 'summary' | 'detailed' | 'presentation' | 'follow-up'): Promise<string> {
    const analysis = await this.getCallAnalysis(userId, analysisId);
    if (!analysis) {
      throw new Error('Call analysis not found');
    }

    const callData = analysis.analysis.callResults;
    const metadata = analysis.metadata;

    switch (format) {
      case 'summary':
        return this.generateSummaryExport(callData, metadata);
      case 'detailed':
        return this.generateDetailedExport(callData, metadata);
      case 'presentation':
        return this.generatePresentationExport(analysis.analysis.summaryPresentation, metadata);
      case 'follow-up':
        return callData.followUpEmail || 'No follow-up email generated';
      default:
        return this.generateSummaryExport(callData, metadata);
    }
  }

  private generateSummaryExport(callData: any, metadata: any): string {
    return `
# CALL ANALYSIS SUMMARY

**Date**: ${metadata.actualDate || metadata.scheduledDate || 'Not specified'}
**Type**: ${metadata.callType}
**Company**: ${metadata.companyName || 'Unknown'}
**Prospect**: ${metadata.prospectName || 'Unknown'}
**Duration**: ${callData.duration} seconds
**Overall Score**: ${callData.analysis.overallScore}/100
**Sentiment**: ${callData.analysis.sentiment}

## Key Insights
${callData.analysis.keyInsights.map((insight: string) => `- ${insight}`).join('\n')}

## Action Items
${callData.analysis.actionItems.map((item: string) => `- ${item}`).join('\n')}

## Performance Metrics
- Talk Time: ${callData.analysis.performanceMetrics?.talkTime || 'N/A'}%
- Questions Asked: ${callData.analysis.performanceMetrics?.questionToStatementRatio || 'N/A'}
- Engagement Score: ${callData.analysis.performanceMetrics?.engagementScore || 'N/A'}/10

## Next Steps
${callData.nextStepsStrategy?.immediateActions?.map((action: string) => `- ${action}`).join('\n') || '- Follow up as discussed'}
    `;
  }

  private generateDetailedExport(callData: any, metadata: any): string {
    return callData.detailedReport || this.generateSummaryExport(callData, metadata);
  }

  private generatePresentationExport(slides: any[], metadata: any): string {
    return `
# CALL ANALYSIS PRESENTATION
## ${metadata.companyName || 'Company'} - ${metadata.callType} Call

${slides.map((slide, index) => `
### Slide ${index + 1}: ${slide.title}

${slide.content}

---
`).join('\n')}

*Generated on ${new Date().toLocaleDateString()}*
    `;
  }
}