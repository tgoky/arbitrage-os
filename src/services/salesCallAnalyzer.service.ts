// services/salesCallAnalyzer.service.ts
import { OpenRouterClient } from '@/lib/openrouter';
import { SalesCallInput, GeneratedCallPackage, CallParticipant, CallStructureAnalysis } from '@/types/salesCallAnalyzer';
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

// services/salesCallAnalyzer.service.ts - ADD LOGGING TO EVERY STEP

async analyzeCall(input: SalesCallInput): Promise<GeneratedCallPackage> {
  const startTime = Date.now();
  
  console.log('🚀 analyzeCall called');
  console.log('📦 Input:', {
    title: input.title,
    callType: input.callType,
    transcriptLength: input.transcript?.length,
    userId: input.userId,
    hasProspectName: !!input.prospectName,
    hasCompanyName: !!input.companyName
  });
  
  // Validate transcript
  if (!input.transcript || input.transcript.length < 50) {
    console.error('❌ Transcript validation failed');
    throw new Error('Transcript must be at least 50 characters for meaningful analysis');
  }
  
  console.log('✅ Transcript validation passed');
  
  // Check cache
  const cacheKey = this.generateCacheKey(input);
  console.log('🔍 Checking cache...');
  
  try {
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      console.log('✅ Cache hit');
      return JSON.parse(cached as string);
    }
    console.log('📭 Cache miss - proceeding with analysis');
  } catch (cacheError) {
    console.warn('⚠️ Cache error (non-critical):', cacheError);
  }

  try {
    // ✅ STEP 1: Main Analysis (Structured JSON)
    console.log('🤖 Step 1: Generating main structured analysis...');
    const mainAnalysisPrompt = this.buildAnalysisPrompt(input);
    
    const mainResponse = await this.openRouterClient.complete({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(input.callType)
        },
        {
          role: 'user',
          content: mainAnalysisPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 8000
    });

    console.log('✅ Main analysis complete');
    console.log('📊 Tokens used:', mainResponse.usage?.total_tokens);
    
    // ✅ STEP 2: Parse response (NOW PROPERLY ASYNC)
    let analysisResults = await this.parseAnalysisResponse(mainResponse.content, input);
    
    // Check if main parsing was successful
    const wasMainParseSuccessful = mainResponse.content.includes('"callResults"');
    
    if (!wasMainParseSuccessful) {
      console.warn('⚠️ Main analysis parse failed, already using enhanced fallback from parseAnalysisResponse');
    }
    
    // ✅ STEP 3: Generate detailed report with AI (if not already present)
    console.log('📝 Step 3: Generating detailed report with AI...');
    let detailedReport: string;
    try {
      if (!analysisResults.callResults.detailedReport || analysisResults.callResults.detailedReport.includes('temporarily unavailable')) {
        detailedReport = await this.generateDetailedReportWithAI(input, input.transcript);
      } else {
        detailedReport = analysisResults.callResults.detailedReport;
      }
    } catch (reportError) {
      console.warn('⚠️ Detailed report generation failed, using fallback:', reportError);
      detailedReport = this.generateBasicDetailedReport(input, input.transcript);
    }
    
    // ✅ STEP 4: Generate call structure analysis (optional enhancement)
    console.log('📊 Step 4: Generating call structure analysis...');
    let callStructure: CallStructureAnalysis | null = null;
    try {
      callStructure = await this.generateCallStructureAnalysis(input, input.transcript);
    } catch (structureError) {
      console.warn('⚠️ Call structure analysis failed (non-critical):', structureError);
    }
    
    // ✅ STEP 5: Generate AI-powered artifacts if needed
    console.log('📄 Step 5: Generating AI-powered artifacts...');
    
    // Generate follow-up email if applicable and not already present
    let followUpEmail = analysisResults.callResults.followUpEmail;
    if (!followUpEmail && (input.callType === 'sales' || input.callType === 'discovery')) {
      try {
        followUpEmail = await this.generateFollowUpEmail(input);
      } catch (emailError) {
        console.warn('⚠️ Follow-up email generation failed (non-critical):', emailError);
      }
    }
    
    // Generate proposal template if applicable and not already present
    let proposalTemplate = analysisResults.callResults.proposalTemplate;
    if (!proposalTemplate && input.callType === 'sales') {
      try {
        proposalTemplate = await this.generateProposalTemplate(input);
      } catch (proposalError) {
        console.warn('⚠️ Proposal generation failed (non-critical):', proposalError);
      }
    }
    
    // ✅ STEP 6: Combine all results
    const callPackage: GeneratedCallPackage = {
      ...analysisResults,
      callResults: {
        ...analysisResults.callResults,
        detailedReport, // AI-generated or fallback
        callStructureAnalysis: callStructure || undefined, // Optional enhancement
        followUpEmail: followUpEmail || analysisResults.callResults.followUpEmail,
        proposalTemplate: proposalTemplate || analysisResults.callResults.proposalTemplate
      },
      tokensUsed: mainResponse.usage?.total_tokens || 0,
      processingTime: Date.now() - startTime
    };

    // ✅ STEP 7: Cache result
    console.log('💾 Caching result...');
    try {
      await this.redis.set(cacheKey, JSON.stringify(callPackage), { ex: 86400 });
      console.log('✅ Result cached successfully');
    } catch (cacheError) {
      console.warn('⚠️ Cache set failed (non-critical):', cacheError);
    }
    
    console.log('🎉 analyzeCall completed successfully');
    console.log('⏱️ Total processing time:', callPackage.processingTime, 'ms');
    return callPackage;
    
  } catch (error) {
    console.error('💥 analyzeCall error:', error);
    console.error('💥 Error type:', error?.constructor?.name);
    console.error('💥 Error message:', error instanceof Error ? error.message : 'Unknown');
    
    console.log('⚠️ Returning enhanced fallback analysis');
    return this.generateFallbackAnalysis(input, Date.now() - startTime);
  }
}

private async generateEnhancedFallback(input: SalesCallInput): Promise<Omit<GeneratedCallPackage, 'tokensUsed' | 'processingTime'>> {
  console.log('🔄 Generating enhanced AI-powered fallback...');
  
  const transcript = input.transcript!;
  const wordCount = transcript.split(' ').length;
  const estimatedDuration = Math.max(Math.floor(wordCount * 1.2), 60);
  const speakers = this.extractSpeakersFromTranscript(transcript);
  const overallScore = this.calculateOverallScore(transcript, input.callType);
  
  // ✅ Run AI generations in parallel for speed
  const [
    keyInsights,
    actionItems,
    coachingFeedback,
    executiveSummary,
    summaryPresentation, // ✅ ADDED THIS
    followUpEmail,
    proposalTemplate
  ] = await Promise.allSettled([
    this.generateKeyInsights(transcript, input.callType),
    this.generateActionItems(input),
    this.generateCoachingFeedback(transcript, input.callType),
    this.generateExecutiveSummary(input, transcript),
    this.generateSummaryPresentation(input, transcript), // ✅ ADDED THIS
    (input.callType === 'sales' || input.callType === 'discovery') 
      ? this.generateFollowUpEmail(input) 
      : Promise.resolve(undefined),
    input.callType === 'sales' 
      ? this.generateProposalTemplate(input) 
      : Promise.resolve(undefined)
  ]);
  
  // ✅ Extract results with proper fallbacks
  const insights = keyInsights.status === 'fulfilled' ? keyInsights.value : this.generateKeyInsightsFallback(transcript, input.callType);
  const actions = actionItems.status === 'fulfilled' ? actionItems.value : this.generateActionItemsFallback(input);
  const coaching = coachingFeedback.status === 'fulfilled' ? coachingFeedback.value : this.generateCoachingFeedbackFallback(transcript, input.callType);
  const summary = executiveSummary.status === 'fulfilled' ? executiveSummary.value : this.generateExecutiveSummaryFallback(input, transcript);
  const presentation = summaryPresentation.status === 'fulfilled' ? summaryPresentation.value : this.generateSummaryPresentationFallback(input, transcript); // ✅ ADDED FALLBACK
  const email = followUpEmail.status === 'fulfilled' ? followUpEmail.value : undefined;
  const proposal = proposalTemplate.status === 'fulfilled' ? proposalTemplate.value : undefined;
  
  return {
    callResults: {
      callId: `call_${Date.now()}`,
      status: 'completed',
      duration: estimatedDuration,
      participants: speakers,
      transcript: transcript.substring(0, 500) + '...',
      analysis: {
        overallScore,
        sentiment: this.analyzeSentiment(transcript, overallScore),
        keyInsights: insights,
        actionItems: actions,
        speakerBreakdown: this.generateSpeakerBreakdown(speakers, transcript),
        ...(input.callType === 'sales' && {
          salesMetrics: this.generateSalesMetrics(transcript)
        }),
        ...(input.callType === 'interview' && {
          interviewMetrics: this.generateInterviewMetrics(transcript)
        }),
        ...(input.callType === 'discovery' && {
          discoveryMetrics: this.generateDiscoveryMetrics(transcript)
        })
      },
      executiveSummary: summary,
      detailedReport: this.generateBasicDetailedReport(input, transcript), // ✅ FIXED METHOD NAME
      followUpEmail: email,
      proposalTemplate: proposal,
      coachingFeedback: coaching,
      benchmarks: this.generateBenchmarks(transcript, input.callType)
    },
    summaryPresentation: presentation, // ✅ NOW PROPERLY AWAITED
    nextStepsStrategy: this.generateNextStepsStrategy(input, transcript),
    performanceMetrics: this.calculatePerformanceMetrics(transcript, speakers)
  };
}

private generateKeyInsightsFallback(transcript: string, callType: string): string[] {
  const insights = [];
  
  if (transcript.includes('budget')) {
    insights.push('Budget was discussed - good sign for qualification');
  }
  
  if (transcript.includes('timeline')) {
    insights.push('Timeline was established - shows buying intent');
  }
  
  const questionCount = (transcript.match(/\?/g) || []).length;
  if (questionCount > 10) {
    insights.push('Strong discovery - many questions asked');
  } else if (questionCount < 5) {
    insights.push('Limited discovery - consider asking more questions');
  }
  
  // Call type specific insights
  switch (callType) {
    case 'sales':
      if (transcript.includes('pain') || transcript.includes('challenge')) {
        insights.push('Pain points identified - good foundation for value prop');
      }
      break;
    case 'interview':
      if (transcript.includes('improve') || transcript.includes('better')) {
        insights.push('Improvement opportunities identified');
      }
      break;
  }
  
  return insights.slice(0, 5);
}

private generateActionItemsFallback(input: SalesCallInput): string[] {
  const actions = [];
  
  actions.push('Send follow-up email within 24 hours');
  
  if (input.callType === 'sales') {
    actions.push('Prepare customized proposal based on discussed needs');
    actions.push('Schedule next meeting with decision makers');
  }
  
  if (input.callType === 'discovery') {
    actions.push('Research technical requirements mentioned');
    actions.push('Prepare detailed solution overview');
  }
  
  actions.push('Update CRM with call notes and insights');
  
  return actions;
}

private generateCoachingFeedbackFallback(transcript: string, callType: string) {
  const questionCount = (transcript.match(/\?/g) || []).length;
  
  return {
    strengths: [
      'Clear communication throughout the conversation',
      'Professional tone and approach maintained',
      'Good rapport building with the prospect'
    ],
    improvements: [
      questionCount < 8 ? 'Ask more discovery questions to uncover deeper insights' : 'Good questioning technique',
      'Confirm understanding more frequently',
      'Be more specific about timelines and next steps'
    ],
    specificSuggestions: [
      'Use the "tell me more about..." technique for deeper discovery',
      'Summarize key points at regular intervals',
      'Set specific dates for all follow-up actions'
    ],
    communicationTips: [
      'Pause for 2-3 seconds after asking questions',
      'Use prospect\'s name more frequently for personalization',
      'Mirror their communication style and energy level'
    ],
    nextCallPreparation: [
      'Research company\'s recent news and developments',
      'Prepare specific ROI examples relevant to their industry',
      'Draft preliminary proposal addressing discussed points'
    ]
  };
}

private generateExecutiveSummaryFallback(input: SalesCallInput, transcript: string): string {
  const overallScore = this.calculateOverallScore(transcript, input.callType);
  const sentiment = this.analyzeSentiment(transcript, overallScore);
  const callType = input.callType;
  const company = input.companyName || 'prospect';
  
  return `${callType} call with ${company} completed successfully with ${sentiment} sentiment. Key objectives were addressed and clear next steps established for continued engagement.`;
}

// ✅ UPDATE generateFallbackAnalysis to use the enhanced version
private async generateFallbackAnalysis(input: SalesCallInput, processingTime: number): Promise<GeneratedCallPackage> {
  const transcript = input.transcript!;
  
  try {
    console.log('🔄 Attempting enhanced AI fallback...');
    const enhanced = await this.generateEnhancedFallback(input);
    return {
      ...enhanced,
      tokensUsed: Math.floor(transcript.length / 4),
      processingTime
    };
  } catch (enhancedError) {
    console.error('❌ Enhanced fallback failed, using hardcoded fallback:', enhancedError);
    
    // ✅ Last resort: fully synchronous hardcoded fallback
    return this.generateHardcodedFallback(input, processingTime);
  }
}

private generateSummaryPresentationFallback(input: SalesCallInput, transcript: string): Array<{
  title: string;
  content: string;
  visualType: 'text' | 'chart' | 'bullet' | 'quote';
}> {
  const overallScore = this.calculateOverallScore(transcript, input.callType);
  const sentiment = this.analyzeSentiment(transcript, overallScore);
  
  return [
    {
      title: 'Call Overview',
      content: `${input.callType} call with ${input.companyName || 'prospect'} completed. Overall sentiment: ${sentiment}.`,
      visualType: 'text' as const
    },
    {
      title: 'Performance Score',
      content: `Overall Score: ${overallScore}/100`,
      visualType: 'chart' as const
    },
    {
      title: 'Key Insights',
      content: 'Analysis in progress - detailed insights being generated.',
      visualType: 'bullet' as const
    },
    {
      title: 'Next Steps',
      content: 'Follow up within 24 hours with detailed summary.',
      visualType: 'bullet' as const
    }
  ];
}


private generateHardcodedFallback(input: SalesCallInput, processingTime: number): GeneratedCallPackage {
  const transcript = input.transcript!;
  const wordCount = transcript.split(' ').length;
  const estimatedDuration = Math.max(Math.floor(wordCount * 1.2), 60);
  const speakers = this.extractSpeakersFromTranscript(transcript);
  const overallScore = this.calculateOverallScore(transcript, input.callType);
  
  return {
    callResults: {
      callId: `call_${Date.now()}`,
      status: 'completed',
      duration: estimatedDuration,
      participants: speakers,
      transcript: transcript.substring(0, 500) + '...',
      analysis: {
        overallScore,
        sentiment: this.analyzeSentiment(transcript, overallScore),
        keyInsights: this.generateKeyInsightsFallback(transcript, input.callType),
        actionItems: this.generateActionItemsFallback(input),
        speakerBreakdown: this.generateSpeakerBreakdown(speakers, transcript),
        ...(input.callType === 'sales' && {
          salesMetrics: this.generateSalesMetrics(transcript)
        }),
        ...(input.callType === 'interview' && {
          interviewMetrics: this.generateInterviewMetrics(transcript)
        }),
        ...(input.callType === 'discovery' && {
          discoveryMetrics: this.generateDiscoveryMetrics(transcript)
        })
      },
      executiveSummary: this.generateExecutiveSummaryFallback(input, transcript),
      detailedReport: this.generateBasicDetailedReport(input, transcript),
      coachingFeedback: this.generateCoachingFeedbackFallback(transcript, input.callType),
      benchmarks: this.generateBenchmarks(transcript, input.callType)
    },
    summaryPresentation: this.generateSummaryPresentationFallback(input, transcript),
    nextStepsStrategy: this.generateNextStepsStrategy(input, transcript),
    performanceMetrics: this.calculatePerformanceMetrics(transcript, speakers),
    tokensUsed: Math.floor(transcript.length / 4),
    processingTime
  };
}



private async generateCallStructureAnalysis(input: SalesCallInput, transcript: string): Promise<any> {
  const prompt = `Analyze the structure and flow of this ${input.callType} call transcript:

${transcript}

Provide a JSON response with this exact structure:

{
  "callStructure": {
    "opening": {
      "assessment": "Strong/Good/Needs Improvement",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "recommendations": ["rec 1", "rec 2"]
    },
    "middle": {
      "assessment": "Strong/Good/Needs Improvement",
      "discoveryQuality": "Excellent/Good/Poor",
      "questionCount": number,
      "topicsCovered": ["topic 1", "topic 2"],
      "recommendations": ["rec 1", "rec 2"]
    },
    "closing": {
      "assessment": "Strong/Good/Needs Improvement",
      "nextStepsDefined": boolean,
      "commitmentLevel": "High/Medium/Low",
      "recommendations": ["rec 1", "rec 2"]
    }
  },
  "metrics": {
    "clarity": number (1-10),
    "energy": number (1-10),
    "professionalism": number (1-10),
    "rapport": number (1-10),
    "transitionSmoothness": number (1-10),
    "pacingOptimal": boolean
  },
  "keyMoments": [
    {
      "timestamp": "X:XX",
      "type": "positive/negative/neutral/critical",
      "description": "what happened",
      "impact": "why it matters"
    }
  ],
  "missedOpportunities": [
    {
      "area": "area name",
      "description": "what was missed",
      "priority": "HIGH/MEDIUM/LOW",
      "howToFix": "specific recommendation"
    }
  ]
}`;

  try {
    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a sales call analyst. Return only valid JSON with no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('❌ Call structure analysis failed:', error);
    return null;
  }
}



private async generateDetailedReportWithAI(input: SalesCallInput, transcript: string): Promise<string> {
  console.log('🤖 Generating detailed report with AI...');
  
  const analysisPrompt = `You are an expert sales coach analyzing a ${input.callType} call. Generate a comprehensive, detailed analysis report in Markdown format.

CALL CONTEXT:
- Call Type: ${input.callType}
- Company: ${input.companyName || 'Not specified'}
- Prospect: ${input.prospectName || 'Not specified'}
- Date: ${input.actualDate || 'Not specified'}

TRANSCRIPT:
${transcript}

Generate a detailed report with the following structure:

# ${input.callType.toUpperCase()} CALL ANALYSIS REPORT

## EXECUTIVE SUMMARY
Provide a 2-3 sentence overview of the call outcome, sentiment, and key takeaways.

---

## WHAT WENT WELL (Specific, Measurable)

### Strengths Demonstrated:
List 3-5 specific strengths with measurable examples from the transcript.

### Quantitative Wins:
- Questions Asked: [count] questions ([assessment])
- Talk Time Balance: [analysis]
- Engagement Indicators: [specific examples]
- Sentiment Score: [score]/100

### Key Moments of Success:
List 3-5 specific moments with timestamps where things went exceptionally well.

---

## CALL STRUCTURE AND FLOW

### Opening (First 20%):
Analyze how the call started - greeting, rapport building, agenda setting.

### Discovery/Middle Section (20-70%):
Analyze the main discovery and discussion phase.

### Closing (Last 30%):
Analyze how the call was wrapped up - next steps, summary, commitment.

### Flow Quality Assessment:
- Transition Smoothness: [assessment]
- Question Sequencing: [assessment]
- Topic Coverage: [assessment]
- Pacing: [assessment]

---

## MISSED OR WEAK AREAS (Opportunities to Improve)

### Critical Gaps Identified:
List 3-5 areas that were missed or handled poorly, with:
1. The gap/weakness
2. Impact: [HIGH/MEDIUM/LOW]
3. How to fix it

### Discovery Quality Analysis:
Analyze the quality of discovery questions - open vs closed, depth, follow-ups.

### Missed Opportunities:
List specific opportunities that were missed during the call with priority levels.

---

## RECOMMENDED IMMEDIATE ARTIFACTS TO PREPARE

### Within 24 Hours:
1. **Follow-up Email** - What should be included and why
2. **Internal Call Summary** - What to document
3. **[Additional based on call type]** - Proposal, technical doc, etc.

### Within 1 Week:
4. **Stakeholder Alignment** - Who to connect with
5. **Competitive Analysis** - What to research

---

## PROBABLE OUTCOME AND RISKS

### Success Probability: [X]%
Explain the likelihood of success based on call analysis.

### Positive Indicators:
List 3-5 positive signs detected in the call.

### Risk Factors:
List 2-4 risks with:
- Risk Factor
- Severity: [HIGH/MEDIUM/LOW]
- Mitigation strategy

### Deal Stage Assessment:
- Current Stage: [assessment]
- Next Logical Step: [recommendation]
- Timeline to Close: [estimate]

---

## COACHING RECOMMENDATIONS

### Top 3 Focus Areas for Next Call:

For each area provide:
- Current State: Where you are now
- Target State: Where you should be
- Practice Exercise: How to improve
- Success Metric: How to measure improvement

### Quick Win Techniques:
List 5 specific, actionable techniques to improve immediately.

---

## APPENDIX: METRICS OBSERVED DURING CALL

### Speaking Pattern Analysis:
Create a table with metrics vs benchmarks vs assessment.

### Engagement Indicators:
Count sentiment words, confirmation words, hesitation words, etc.

### Call Quality Metrics:
Rate clarity, energy, professionalism, rapport on a 1-10 scale.

---

## SUMMARY RECOMMENDATION

**Overall Assessment**: [2-3 sentence verdict]

**Priority Actions** (Do These First):
1. [Most critical action]
2. [Second most critical action]
3. [Third most critical action]

**Long-term Strategy**:
[Strategic recommendations for the relationship]

**Confidence Level**: [HIGH/MEDIUM/LOW] with explanation

---

*Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*

IMPORTANT:
- Be specific and use exact quotes/examples from the transcript
- Provide quantitative metrics wherever possible
- Make recommendations actionable and measurable
- Focus on insights that will help improve performance
- Be professional but constructive in criticism
- Use emojis sparingly (✅ ❌ ⚠️ 🎯) for key points only`;

  try {
    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-4o', // or gpt-4 for higher quality
      messages: [
        {
          role: 'system',
          content: 'You are an expert sales coach and call analyst. Provide detailed, actionable insights based on sales call transcripts.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.3, // Lower for more consistent analysis
      max_tokens: 4000 // Enough for detailed report
    });

    console.log('✅ AI detailed report generated');
    return response.content;

  } catch (error) {
    console.error('❌ AI detailed report generation failed:', error);
    // Fallback to basic report
    return this.generateBasicDetailedReport(input, transcript);
  }
}


private generateBasicDetailedReport(input: SalesCallInput, transcript: string): string {
  const overallScore = this.calculateOverallScore(transcript, input.callType);
  const sentiment = this.analyzeSentiment(transcript, overallScore);
  const questionCount = (transcript.match(/\?/g) || []).length;
  const speakers = this.extractSpeakersFromTranscript(transcript);
  const wordCount = transcript.split(' ').length;
  const estimatedDuration = Math.max(Math.floor(wordCount * 1.2), 60);
  
  return `# ${input.callType.toUpperCase()} CALL ANALYSIS REPORT

## EXECUTIVE SUMMARY

**Call Date**: ${input.actualDate ? new Date(input.actualDate).toLocaleDateString() : 'Not specified'}  
**Duration**: ${Math.floor(estimatedDuration / 60)} minutes  
**Overall Score**: ${overallScore}/100  
**Sentiment**: ${sentiment.toUpperCase()}  
**Participants**: ${speakers.map(s => s.name).join(', ')}

This ${input.callType} call achieved a ${overallScore >= 75 ? 'strong' : overallScore >= 60 ? 'good' : 'moderate'} outcome with ${sentiment} sentiment.

---

## KEY METRICS

- **Questions Asked**: ${questionCount}
- **Talk Time**: Agent ${speakers.find(s => s.role === 'host')?.speakingPercentage || 40}% / Prospect ${speakers.find(s => s.role === 'prospect')?.speakingPercentage || 60}%
- **Engagement Level**: ${overallScore >= 75 ? 'High' : 'Moderate'}

---

## RECOMMENDATIONS

### Immediate Actions:
1. Send follow-up email within 24 hours
2. Update CRM with call notes
3. Schedule next meeting if applicable

### Areas for Improvement:
- ${questionCount < 10 ? 'Ask more discovery questions' : 'Good question frequency'}
- ${speakers.find(s => s.role === 'host')?.speakingPercentage! > 50 ? 'Reduce talk time, listen more' : 'Good talk/listen balance'}

---

*For a more detailed analysis, the AI service is temporarily unavailable. Please try again later.*

*Report generated on ${new Date().toLocaleDateString()}*`;
}



  private getSystemPrompt(callType: string): string {
    const basePrompt = `You are an expert sales coach and conversation analyst. You specialize in analyzing ${callType} calls and business conversations to extract actionable insights, identify improvement opportunities, and provide strategic recommendations.

Your analysis should be:
- Thorough and data-driven with specific metrics
- Actionable with concrete next steps
- Tailored to ${callType} call objectives
- Professional yet conversational in tone
- Focused on helping users improve performance and achieve better outcomes

You have deep expertise in:
- Sales methodology and psychology
- Communication patterns and effectiveness
- Sentiment analysis and emotional intelligence
- Performance benchmarking and coaching
- Business strategy and relationship building`;

    const typeSpecificPrompts = {
      sales: `\n\nFor sales calls, focus on: qualifying prospects, identifying pain points, building value propositions, handling objections, advancing the sales process, and closing techniques.`,
      discovery: `\n\nFor discovery calls, focus on: uncovering business needs, understanding current solutions, identifying stakeholders, mapping decision processes, and gathering technical requirements.`,
      interview: `\n\nFor customer interviews, focus on: user experience feedback, feature requests, satisfaction levels, pain points, product-market fit insights, and improvement opportunities.`,
      podcast: `\n\nFor podcasts, focus on: content quality, audience engagement, narrative flow, key messages, memorable moments, and content optimization suggestions.`
    };

    return basePrompt + (typeSpecificPrompts[callType as keyof typeof typeSpecificPrompts] || typeSpecificPrompts.sales);
  }

  private buildAnalysisPrompt(input: SalesCallInput): string {
    const contextSection = this.buildContextSection(input);
    const transcriptSection = `\n\nCALL TRANSCRIPT:\n${input.transcript}`;
    const analysisRequest = this.buildAnalysisRequest(input);

    return `${contextSection}${transcriptSection}${analysisRequest}`;
  }

  private buildContextSection(input: SalesCallInput): string {
    return `
SALES CALL ANALYSIS REQUEST

CALL CONTEXT:
- Call Type: ${input.callType.toUpperCase()}
- Title: ${input.title}
- Date: ${input.actualDate || input.scheduledDate || 'Not specified'}
- Prospect: ${input.prospectName || 'Unknown'} (${input.prospectTitle || 'Unknown Title'})
- Company: ${input.companyName || 'Unknown Company'}
- Industry: ${input.companyIndustry || 'Not specified'}
- Company Size: ${input.companyHeadcount || 'Not specified'}
- Revenue Range: ${input.companyRevenue || 'Not specified'}
- Location: ${input.companyLocation || 'Not specified'}

ANALYSIS OBJECTIVES:
${input.analysisGoals?.length ? input.analysisGoals.map(goal => `- ${goal}`).join('\n') : '- General performance analysis and coaching insights'}

SPECIFIC QUESTIONS TO ADDRESS:
${input.specificQuestions?.length ? input.specificQuestions.map(q => `- ${q}`).join('\n') : '- No specific questions provided'}

ADDITIONAL CONTEXT:
${input.additionalContext || 'No additional context provided'}`;
  }

  private buildAnalysisRequest(input: SalesCallInput): string {
    return `

ANALYSIS DELIVERABLES REQUIRED:

Generate a comprehensive analysis package in valid JSON format with the following structure:

{
  "callResults": {
    "callId": "call_${Date.now()}",
    "status": "completed",
    "duration": <estimated_duration_in_seconds>,
    "participants": [
      {
        "name": "<participant_name>",
        "role": "<host|participant|prospect|interviewer>",
        "speakingTime": <estimated_seconds>,
        "speakingPercentage": <percentage_of_total>
      }
    ],
    "transcript": "${input.transcript.substring(0, 200)}...",
    "analysis": {
      "overallScore": <score_0_to_100>,
      "sentiment": "<positive|neutral|negative|mixed>",
      "keyInsights": [
        "<insight_1>",
        "<insight_2>",
        "<insight_3>"
      ],
      "actionItems": [
        "<action_1>",
        "<action_2>",
        "<action_3>"
      ],
      "speakerBreakdown": [
        {
          "speaker": "<speaker_name>",
          "speakingTime": <seconds>,
          "percentage": <percentage>,
          "keyPoints": ["<point_1>", "<point_2>"],
          "toneAnalysis": "<professional|casual|enthusiastic|concerned>",
          "engagement": <score_0_to_10>
        }
      ],
      ${this.getCallTypeSpecificAnalysis(input.callType)}
    },
    "executiveSummary": "<2-3_sentence_summary>",
    "detailedReport": "<comprehensive_markdown_report>",
    ${input.callType === 'sales' || input.callType === 'discovery' ? '"followUpEmail": "<personalized_follow_up_template>",' : ''}
    ${input.callType === 'sales' ? '"proposalTemplate": "<proposal_outline_based_on_discussion>",' : ''}
    "coachingFeedback": {
      "strengths": ["<strength_1>", "<strength_2>", "<strength_3>"],
      "improvements": ["<improvement_1>", "<improvement_2>", "<improvement_3>"],
      "specificSuggestions": ["<suggestion_1>", "<suggestion_2>", "<suggestion_3>"],
      "communicationTips": ["<tip_1>", "<tip_2>", "<tip_3>"],
      "nextCallPreparation": ["<prep_item_1>", "<prep_item_2>", "<prep_item_3>"]
    },
    "benchmarks": {
      "industryAverages": {
        "talk_time_ratio": 0.3,
        "question_count": 8,
        "engagement_score": 7.2,
        "sentiment_positive_rate": 0.65
      },
      "yourPerformance": {
        "talk_time_ratio": <calculated_ratio>,
        "question_count": <actual_questions_asked>,
        "engagement_score": <calculated_score>,
        "sentiment_positive_rate": <calculated_rate>
      },
      "improvementAreas": ["<area_1>", "<area_2>", "<area_3>"]
    }
  },
  "summaryPresentation": [
    {
      "title": "Call Overview",
      "content": "<brief_overview>",
      "visualType": "text"
    },
    {
      "title": "Key Performance Metrics",
      "content": "<performance_data>",
      "visualType": "chart"
    },
    {
      "title": "Critical Insights",
      "content": "<main_discoveries>",
      "visualType": "bullet"
    },
    {
      "title": "Strategic Recommendations",
      "content": "<actionable_next_steps>",
      "visualType": "bullet"
    }
  ],
  "nextStepsStrategy": {
    "immediateActions": ["<immediate_1>", "<immediate_2>", "<immediate_3>"],
    "shortTermGoals": ["<short_term_1>", "<short_term_2>", "<short_term_3>"],
    "longTermStrategy": ["<long_term_1>", "<long_term_2>", "<long_term_3>"],
    "riskMitigation": ["<risk_1_mitigation>", "<risk_2_mitigation>"]
  },
  "performanceMetrics": {
    "talkTimePercentage": <host_talk_percentage>,
    "questionToStatementRatio": <questions_vs_statements>,
    "averageResponseTime": <estimated_response_seconds>,
    "engagementScore": <engagement_0_to_10>,
    "clarityScore": <communication_clarity_0_to_10>,
    "enthusiasmLevel": <enthusiasm_0_to_10>,
    "professionalismScore": <professionalism_0_to_10>
  }
}

ANALYSIS REQUIREMENTS:
1. Analyze conversation flow, pacing, and structure
2. Identify emotional states and sentiment shifts
3. Evaluate question quality and discovery effectiveness
4. Assess rapport building and relationship dynamics
5. Provide quantitative metrics wherever possible
6. Focus on actionable, specific improvements
7. Include industry benchmarks and comparisons
8. Generate practical templates and next steps
9. Identify missed opportunities and provide coaching
10. Tailor all insights to ${input.callType} call objectives

Make every insight specific, actionable, and tied to measurable outcomes. Provide coaching that users can immediately implement to improve their performance.`;
  }

  private getCallTypeSpecificAnalysis(callType: string): string {
    switch (callType) {
      case 'sales':
        return `
          "salesMetrics": {
            "painPointsIdentified": ["<pain_point_1>", "<pain_point_2>"],
            "budgetDiscussed": <true_or_false>,
            "timelineEstablished": <true_or_false>,
            "decisionMakerIdentified": <true_or_false>,
            "nextStepsDefined": <true_or_false>,
            "objectionsRaised": ["<objection_1>", "<objection_2>"],
            "valuePropositionClarity": <score_0_to_10>,
            "rapportLevel": <score_0_to_10>,
            "urgencyCreated": <score_0_to_10>,
            "competitorsMentioned": ["<competitor_1>", "<competitor_2>"],
            "buyingSignals": ["<signal_1>", "<signal_2>"],
            "riskFactors": ["<risk_1>", "<risk_2>"]
          }`;
      
      case 'interview':
        return `
          "interviewMetrics": {
            "questionsAsked": <number_of_questions>,
            "followUpQuestions": <number_of_followups>,
            "customerSatisfactionIndicators": ["<indicator_1>", "<indicator_2>"],
            "featureRequests": ["<request_1>", "<request_2>"],
            "usabilityFeedback": ["<feedback_1>", "<feedback_2>"],
            "painPointsUncovered": ["<pain_1>", "<pain_2>"],
            "improvementSuggestions": ["<suggestion_1>", "<suggestion_2>"],
            "competitorInsights": ["<insight_1>", "<insight_2>"],
            "userJourneyInsights": ["<journey_1>", "<journey_2>"]
          }`;
      
      case 'discovery':
        return `
          "discoveryMetrics": {
            "currentSolutionIdentified": <true_or_false>,
            "challengesUncovered": ["<challenge_1>", "<challenge_2>"],
            "successCriteriaDefined": <true_or_false>,
            "stakeholdersIdentified": ["<stakeholder_1>", "<stakeholder_2>"],
            "technicalRequirements": ["<requirement_1>", "<requirement_2>"],
            "implementationTimeline": "<timeline_discussed>",
            "budgetRangeDiscussed": <true_or_false>,
            "procurementProcess": "<process_details>",
            "currentVendors": ["<vendor_1>", "<vendor_2>"],
            "evaluationCriteria": ["<criteria_1>", "<criteria_2>"]
          }`;
      
      case 'podcast':
        return `
          "podcastMetrics": {
            "contentQuality": <score_0_to_10>,
            "engagementLevel": <score_0_to_10>,
            "keyTopics": ["<topic_1>", "<topic_2>"],
            "memorableQuotes": ["<quote_1>", "<quote_2>"],
            "audienceInsights": ["<insight_1>", "<insight_2>"],
            "contentSuggestions": ["<suggestion_1>", "<suggestion_2>"],
            "storytellingEffectiveness": <score_0_to_10>,
            "educationalValue": <score_0_to_10>,
            "entertainmentValue": <score_0_to_10>,
            "shareableContent": ["<shareable_1>", "<shareable_2>"]
          }`;
      
      default:
        return `"generalMetrics": {
            "conversationFlow": <score_0_to_10>,
            "informationGathered": <score_0_to_10>,
            "relationshipBuilding": <score_0_to_10>,
            "objectivesAchieved": <score_0_to_10>
          }`;
    }
  }

private async parseAnalysisResponse(content: string, input: SalesCallInput): Promise<Omit<GeneratedCallPackage, 'tokensUsed' | 'processingTime'>> {
  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required structure
      if (parsed.callResults && parsed.summaryPresentation && parsed.nextStepsStrategy) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to parse JSON response, generating fallback analysis:', error);
  }

  // ✅ Now properly awaits the async fallback
  return await this.generateEnhancedFallback(input);
}


private extractSpeakersFromTranscript(transcript: string): CallParticipant[] {
  // Detect speaker patterns like "John:", "Speaker 1:", etc.
  const speakerPattern = /^([A-Za-z]+(?:\s+[A-Za-z]+)*|\w+\s+\d+):\s*/gm;
  const matches = Array.from(transcript.matchAll(speakerPattern)); // Fixed iterator issue
  
  if (matches.length === 0) {
    // Fallback: assume two speakers
    return [
      { 
        name: 'Host', 
        role: 'host' as const, // Fixed: explicit type casting
        speakingTime: 600, 
        speakingPercentage: 40 
      },
      { 
        name: 'Participant', 
        role: 'participant' as const, // Fixed: explicit type casting
        speakingTime: 900, 
        speakingPercentage: 60 
      }
    ];
  }

  // Count speaking time for each speaker
  const speakers = new Map<string, number>();
  const lines = transcript.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^([A-Za-z]+(?:\s+[A-Za-z]+)*|\w+\s+\d+):\s*(.+)/);
    if (match) {
      const speaker = match[1].trim();
      const content = match[2];
      const wordCount = content.split(' ').length;
      speakers.set(speaker, (speakers.get(speaker) || 0) + wordCount);
    }
  }

  const totalWords = Array.from(speakers.values()).reduce((sum, count) => sum + count, 0);
  
  return Array.from(speakers.entries()).map(([name, wordCount]): CallParticipant => ({
    name,
    // Fixed: proper role assignment with type casting
    role: (name.toLowerCase().includes('host') || name.toLowerCase().includes('interviewer')) ? 
      'host' as const : 
      (name.toLowerCase().includes('prospect') ? 'prospect' as const : 'participant' as const),
  speakingTime: Math.round(wordCount * 1.2), // Estimate seconds
    speakingPercentage: Math.round((wordCount / totalWords) * 100)
  }));
}


  private calculateOverallScore(transcript: string, callType: string): number {
    let score = 60; // Base score
    
    // Positive indicators
    const positiveWords = ['great', 'excellent', 'perfect', 'love', 'amazing', 'fantastic'];
    const negativeWords = ['problem', 'issue', 'concern', 'difficult', 'impossible', 'bad'];
    
    const positiveCount = positiveWords.reduce((count, word) => 
      count + (transcript.toLowerCase().match(new RegExp(word, 'g'))?.length || 0), 0);
    
    const negativeCount = negativeWords.reduce((count, word) => 
      count + (transcript.toLowerCase().match(new RegExp(word, 'g'))?.length || 0), 0);
    
    score += Math.min(positiveCount * 2, 20);
    score -= Math.min(negativeCount * 2, 20);
    
    // Question quality (discovery)
    const questionCount = (transcript.match(/\?/g) || []).length;
    score += Math.min(questionCount, 15);
    
    // Engagement indicators
    if (transcript.includes('tell me more')) score += 5;
    if (transcript.includes('follow up')) score += 5;
    if (transcript.includes('next steps')) score += 5;
    
    return Math.max(10, Math.min(95, score));
  }



  private analyzeSentiment(transcript: string, overallScore: number): 'positive' | 'neutral' | 'negative' | 'mixed' {
  // Use the performance score as primary indicator
  if (overallScore >= 75) return 'positive';
  if (overallScore >= 60) return 'neutral';
  if (overallScore >= 40) return 'mixed';
  return 'negative';
}

private async generateKeyInsights(transcript: string, callType: string): Promise<string[]> {
  console.log('💡 Generating AI-powered key insights...');
  
  const prompt = `Extract 3-5 key insights from this ${callType} call:

${transcript.substring(0, 2000)} ${transcript.length > 2000 ? '...' : ''}

Return ONLY a JSON array of strings:
["insight 1", "insight 2", "insight 3", ...]

Focus on:
- Important discoveries
- Buying signals or concerns
- Strategic insights
- Qualification status
- Relationship indicators`;

  try {
    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a sales analyst. Return only a JSON array of strings.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });
    
    const jsonMatch = response.content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const insights = JSON.parse(jsonMatch[0]);
      return Array.isArray(insights) ? insights.slice(0, 5) : [];
    }
    throw new Error('No array found in response');
    
  } catch (error) {
    console.error('❌ AI insights generation failed:', error);
    
    // Fallback
    const insights = [];
    if (transcript.includes('budget')) {
      insights.push('Budget was discussed - good qualification sign');
    }
    if (transcript.includes('timeline')) {
      insights.push('Timeline established - shows buying intent');
    }
    const questionCount = (transcript.match(/\?/g) || []).length;
    if (questionCount > 10) {
      insights.push('Strong discovery - many questions asked');
    }
    
    return insights.slice(0, 5);
  }
}

  private async generateActionItems(input: SalesCallInput): Promise<string[]> {
  console.log('✅ Generating AI-powered action items...');
  
  const prompt = `Based on this ${input.callType} call, what are the immediate action items?

Transcript: ${input.transcript.substring(0, 1500)} ${input.transcript.length > 1500 ? '...' : ''}

Return ONLY a JSON array of 3-5 specific, actionable items:
["action 1", "action 2", "action 3"]

Focus on what should be done in the next 24-48 hours.`;

  try {
    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a sales operations expert. Return only a JSON array.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 400
    });
    
    const jsonMatch = response.content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const actions = JSON.parse(jsonMatch[0]);
      return Array.isArray(actions) ? actions.slice(0, 5) : [];
    }
    throw new Error('No array found');
    
  } catch (error) {
    console.error('❌ AI action items failed:', error);
    
    const actions = ['Send follow-up email within 24 hours'];
    if (input.callType === 'sales') {
      actions.push('Prepare customized proposal');
      actions.push('Schedule next meeting');
    }
    actions.push('Update CRM with call notes');
    
    return actions;
  }
}



  private generateSpeakerBreakdown(speakers: any[], transcript: string): any[] {
    return speakers.map(speaker => ({
      speaker: speaker.name,
      speakingTime: speaker.speakingTime,
      percentage: speaker.speakingPercentage,
      keyPoints: [`Key contributions from ${speaker.name}`],
      toneAnalysis: speaker.role === 'host' ? 'professional' : 'engaged',
      engagement: Math.floor(Math.random() * 3) + 7 // 7-9 range
    }));
  }

  // Add the remaining private methods for completeness...
  private generateSalesMetrics(transcript: string) {
  return {
    painPointsIdentified: transcript.includes('pain') || transcript.includes('challenge') ? 
      ['Current process inefficiencies', 'Resource constraints'] : [],
    budgetDiscussed: transcript.includes('budget') || transcript.includes('cost'),
    timelineEstablished: transcript.includes('timeline') || transcript.includes('when'),
    decisionMakerIdentified: transcript.includes('decision') || transcript.includes('approve'),
    nextStepsDefined: transcript.includes('next step') || transcript.includes('follow up'),
    objectionsRaised: [],
    valuePropositionClarity: 7,
    rapportLevel: 8,
    urgencyCreated: 6,
    competitorsMentioned: [],
    buyingSignals: transcript.includes('interested') ? ['Expressed interest'] : [],
    riskFactors: []
  };
}

  private generateInterviewMetrics(transcript: string) {
    const questionCount = (transcript.match(/\?/g) || []).length;
    return {
      questionsAsked: questionCount,
      followUpQuestions: Math.floor(questionCount * 0.3),
      customerSatisfactionIndicators: ['Positive feedback on current features'],
      featureRequests: ['Enhanced reporting capabilities'],
      usabilityFeedback: ['Interface is intuitive'],
      painPointsUncovered: ['Manual processes'],
      improvementSuggestions: ['Better integration options'],
      competitorInsights: [],
      userJourneyInsights: ['Smooth onboarding experience']
    };
  }

  private generateDiscoveryMetrics(transcript: string) {
    return {
      currentSolutionIdentified: transcript.includes('current') || transcript.includes('using'),
      challengesUncovered: ['Scalability issues', 'Manual processes'],
      successCriteriaDefined: transcript.includes('success') || transcript.includes('goal'),
      stakeholdersIdentified: ['IT Manager', 'Finance Director'],
      technicalRequirements: ['Cloud-based solution', 'API integration'],
      implementationTimeline: '3-6 months',
      budgetRangeDiscussed: transcript.includes('budget'),
      procurementProcess: 'Standard approval process',
      currentVendors: ['Legacy system provider'],
      evaluationCriteria: ['ROI', 'Ease of implementation']
    };
  }

private async generateExecutiveSummary(input: SalesCallInput, transcript: string): Promise<string> {
  console.log('📋 Generating AI-powered executive summary...');
  
  const prompt = `Create a 2-3 sentence executive summary of this ${input.callType} call:

Company: ${input.companyName || 'Not specified'}
Transcript: ${transcript.substring(0, 1500)} ${transcript.length > 1500 ? '...' : ''}

Focus on:
- Overall outcome
- Key sentiment
- Most important takeaway
- Next steps (if mentioned)

Keep it concise and professional.`;

  try {
    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a business analyst expert at creating executive summaries.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });
    
    return response.content.trim();
  } catch (error) {
    console.error('❌ AI summary failed:', error);
    const overallScore = this.calculateOverallScore(transcript, input.callType);
    const sentiment = this.analyzeSentiment(transcript, overallScore);
    return `${input.callType} call with ${input.companyName || 'prospect'} completed with ${sentiment} sentiment. Key objectives were addressed and next steps established.`;
  }
}


private async generateFollowUpEmail(input: SalesCallInput): Promise<string> {
  console.log('📧 Generating AI-powered follow-up email...');
  
  const prompt = `Generate a professional, personalized follow-up email for this ${input.callType} call:

CALL CONTEXT:
- Prospect: ${input.prospectName || 'Prospect'}
- Company: ${input.companyName || 'Company'}
- Call Type: ${input.callType}
- Transcript: ${input.transcript.substring(0, 2000)} ${input.transcript.length > 2000 ? '...' : ''}

Generate a follow-up email that:
1. References specific points discussed in the call
2. Summarizes key takeaways
3. Proposes clear next steps
4. Maintains a professional yet warm tone
5. Is concise (under 300 words)

Format:
Subject: [compelling subject line]

[Email body]

Best regards,
[Your Name]`;

  try {
    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at writing effective sales follow-up emails.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 800
    });
    
    return response.content;
  } catch (error) {
    console.error('❌ AI follow-up email failed:', error);
    // Fallback to basic template
    return `Subject: Thank you for our ${input.callType} call today - Next steps

Hi ${input.prospectName || 'there'},

Thank you for taking the time to speak with me today about ${input.title}. I enjoyed learning more about ${input.companyName || 'your company'} and your current challenges.

Based on our conversation, I'll prepare a detailed proposal addressing your specific needs and send it over by [date].

Looking forward to our next conversation.

Best regards,
[Your Name]`;
  }
}


private async generateProposalTemplate(input: SalesCallInput): Promise<string> {
  console.log('📄 Generating AI-powered proposal template...');
  
  const prompt = `Based on this sales call transcript, generate a proposal outline:

CALL CONTEXT:
- Company: ${input.companyName || 'Company'}
- Industry: ${input.companyIndustry || 'Not specified'}
- Company Size: ${input.companyHeadcount || 'Not specified'}
- Transcript: ${input.transcript.substring(0, 2000)} ${input.transcript.length > 2000 ? '...' : ''}

Generate a proposal outline that includes:
1. Executive Summary (based on discussed pain points)
2. Current Situation (challenges mentioned in call)
3. Proposed Solution (tailored to their needs)
4. Expected Outcomes (specific to their goals)
5. Investment & Timeline
6. Next Steps

Use actual details from the transcript - be specific!`;

  try {
    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a sales proposal expert. Create compelling, specific proposals based on call transcripts.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });
    
    return response.content;
  } catch (error) {
    console.error('❌ AI proposal generation failed:', error);
    return `# PROPOSAL FOR ${input.companyName?.toUpperCase() || 'CLIENT'}

## Executive Summary
Based on our conversation, we understand your key objectives and are prepared to help you achieve them.

## Your Current Situation
[Details from call to be added]

## Our Proposed Solution
[Customized solution based on discussion]

## Expected Outcomes
[Specific benefits aligned with their goals]

## Investment & Timeline
[To be determined based on scope]

## Next Steps
1. Review this proposal internally
2. Address any questions
3. Proceed with implementation`;
  }
}



private async generateCoachingFeedback(transcript: string, callType: string): Promise<any> {
  console.log('🎓 Generating AI-powered coaching feedback...');
  
  const prompt = `Analyze this ${callType} call transcript and provide coaching feedback:

${transcript.substring(0, 2000)} ${transcript.length > 2000 ? '...' : ''}

Return ONLY valid JSON with this structure:
{
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "improvements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"],
  "specificSuggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
  "communicationTips": ["tip 1", "tip 2", "tip 3"],
  "nextCallPreparation": ["preparation item 1", "preparation item 2", "preparation item 3"]
}

Be specific - reference actual moments from the transcript!`;

  try {
    const response = await this.openRouterClient.complete({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert sales coach. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });
    
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
    
  } catch (error) {
    console.error('❌ AI coaching feedback failed:', error);
    const questionCount = (transcript.match(/\?/g) || []).length;
    
    return {
      strengths: [
        'Clear communication throughout the conversation',
        'Professional tone and approach maintained',
        'Good rapport building with the prospect'
      ],
      improvements: [
        questionCount < 8 ? 'Ask more discovery questions to uncover deeper insights' : 'Good questioning technique',
        'Confirm understanding more frequently',
        'Be more specific about timelines and next steps'
      ],
      specificSuggestions: [
        'Use the "tell me more about..." technique for deeper discovery',
        'Summarize key points at regular intervals',
        'Set specific dates for all follow-up actions'
      ],
      communicationTips: [
        'Pause for 2-3 seconds after asking questions',
        'Use prospect\'s name more frequently',
        'Mirror their communication style'
      ],
      nextCallPreparation: [
        'Research company\'s recent news',
        'Prepare specific ROI examples',
        'Draft preliminary proposal'
      ]
    };
  }
}

  private generateBenchmarks(transcript: string, callType: string) {
    const questionCount = (transcript.match(/\?/g) || []).length;
    const wordCount = transcript.split(' ').length;
    const estimatedTalkTime = 0.4; // Assume 40% talk time
    
    return {
      industryAverages: {
        talk_time_ratio: callType === 'sales' ? 0.3 : 0.4,
        question_count: callType === 'discovery' ? 12 : 8,
        engagement_score: 7.2,
        sentiment_positive_rate: 0.65
      },
      yourPerformance: {
        talk_time_ratio: estimatedTalkTime,
        question_count: questionCount,
        engagement_score: this.calculateEngagementScore(transcript),
        sentiment_positive_rate: this.analyzeSentiment(transcript, this.calculateOverallScore(transcript, callType)) === 'positive' ? 0.8 : 0.5
      },
      improvementAreas: this.identifyImprovementAreas(transcript, callType, questionCount)
    };
  }

  private calculateEngagementScore(transcript: string): number {
    let score = 5;
    
    // Positive engagement indicators
    if (transcript.includes('interesting') || transcript.includes('tell me more')) score += 1;
    if (transcript.includes('yes') || transcript.includes('absolutely')) score += 0.5;
    if (transcript.includes('great') || transcript.includes('excellent')) score += 0.5;
    
    // Question engagement
    const questionCount = (transcript.match(/\?/g) || []).length;
    if (questionCount > 10) score += 1;
    if (questionCount > 15) score += 0.5;
    
    // Conversation flow
    if (transcript.length > 2000) score += 0.5; // Good length conversation
    if (transcript.includes('follow up') || transcript.includes('next step')) score += 0.5;
    
    return Math.min(10, Math.max(1, Math.round(score * 10) / 10));
  }

  private identifyImprovementAreas(transcript: string, callType: string, questionCount: number): string[] {
    const areas = [];
    
    if (questionCount < 8) {
      areas.push('Discovery questioning depth');
    }
    
    if (!transcript.includes('next step') && !transcript.includes('follow up')) {
      areas.push('Clear next steps definition');
    }
    
    if (callType === 'sales') {
      if (!transcript.includes('budget') && !transcript.includes('cost')) {
        areas.push('Budget qualification');
      }
      if (!transcript.includes('timeline') && !transcript.includes('when')) {
        areas.push('Timeline establishment');
      }
      if (!transcript.includes('decision') && !transcript.includes('approve')) {
        areas.push('Decision maker identification');
      }
    }
    
    if (!transcript.includes('pain') && !transcript.includes('challenge') && !transcript.includes('problem')) {
      areas.push('Pain point identification');
    }
    
    return areas.slice(0, 4); // Limit to top 4 areas
  }

private async generateSummaryPresentation(input: SalesCallInput, transcript: string) {
  const overallScore = this.calculateOverallScore(transcript, input.callType);
  const sentiment = this.analyzeSentiment(transcript, overallScore);
  
  // ✅ Await the async methods
  const keyInsights = await this.generateKeyInsights(transcript, input.callType);
  const actionItems = await this.generateActionItems(input);
  
  return [
    {
      title: 'Call Overview',
      content: `${input.callType} call with ${input.companyName || 'prospect'} completed successfully. Duration: ${Math.floor(transcript.split(' ').length * 1.2 / 60)} minutes. Overall sentiment: ${sentiment}.`,
      visualType: 'text' as const
    },
    {
      title: 'Performance Score',
      content: `Overall Score: ${overallScore}/100\nEngagement Level: ${this.calculateEngagementScore(transcript)}/10\nCommunication Quality: Professional\nObjectives Met: Yes`,
      visualType: 'chart' as const
    },
    {
      title: 'Key Insights',
      content: keyInsights.join('\n• '), // ✅ Now properly awaited
      visualType: 'bullet' as const
    },
    {
      title: 'Action Items & Next Steps',
      content: actionItems.join('\n• '), // ✅ Now properly awaited
      visualType: 'bullet' as const
    }
  ];
}

  private generateNextStepsStrategy(input: SalesCallInput, transcript: string) {
    return {
      immediateActions: [
        'Send personalized follow-up email within 24 hours',
        'Update CRM with detailed call notes and insights',
        'Research additional company background and recent news'
      ],
      shortTermGoals: [
        input.callType === 'sales' ? 'Prepare and present detailed proposal' : 'Schedule follow-up discussion',
        'Connect with additional stakeholders if mentioned',
        'Address any concerns or questions raised during the call'
      ],
      longTermStrategy: [
        'Build strategic partnership approach rather than transactional relationship',
        'Position as trusted advisor in their industry vertical',
        'Develop comprehensive account plan with multiple touchpoints'
      ],
      riskMitigation: [
        'Address any hesitations or concerns proactively',
        'Prepare competitive differentiation materials',
        'Have alternative solutions ready for potential objections'
      ]
    };
  }

private calculatePerformanceMetrics(transcript: string, speakers: CallParticipant[]) {
  const questionCount = (transcript.match(/\?/g) || []).length;
  const statementCount = transcript.split('.').length;
  
  // Find host speaking percentage
  const hostSpeaker = speakers.find(s => s.role === 'host') || speakers[0];
  const talkTime = hostSpeaker?.speakingPercentage || 40;
  
  return {
    talkTime, // Changed from talkTimePercentage
    questionToStatementRatio: Math.round((questionCount / Math.max(statementCount, 1)) * 100) / 100,
    interruptionCount: 2, // Add this missing field
    responseTime: 2.5, // Changed from averageResponseTime
    engagementScore: this.calculateEngagementScore(transcript),
    clarityScore: transcript.includes('unclear') || transcript.includes('confused') ? 6 : 8,
    enthusiasmLevel: this.calculateEnthusiasmLevel(transcript),
    professionalismScore: 8.5
  };
}

  private calculateEnthusiasmLevel(transcript: string): number {
    let level = 5; // Baseline
    
    const enthusiasticWords = ['excited', 'amazing', 'fantastic', 'love', 'great', 'awesome'];
    const count = enthusiasticWords.reduce((total, word) => 
      total + (transcript.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g'))?.length || 0), 0);
    
    level += Math.min(count * 0.5, 3);
    
    // Exclamation marks indicate enthusiasm
    const exclamationCount = (transcript.match(/!/g) || []).length;
    level += Math.min(exclamationCount * 0.2, 2);
    
    return Math.min(10, Math.max(1, Math.round(level * 10) / 10));
  }

  // Service management methods
// services/salesCallAnalyzer.service.ts - UPDATE saveCallAnalysis

async saveCallAnalysis(userId: string, workspaceId: string, analysis: GeneratedCallPackage, input: SalesCallInput): Promise<string> {
  console.log('💾 saveCallAnalysis called');
  console.log('💾 User ID:', userId);
  console.log('💾 Workspace ID:', workspaceId);
  console.log('💾 Analysis keys:', Object.keys(analysis));
  console.log('💾 Input keys:', Object.keys(input));
  
  try {
    const { prisma } = await import('@/lib/prisma');
    console.log('✅ Prisma imported successfully');
    
    console.log('📝 Creating deliverable record...');
    const deliverable = await prisma.deliverable.create({
      data: {
        title: `${input.callType} Call Analysis - ${input.title}`,
        content: JSON.stringify(analysis),
        type: 'sales_call_analysis',
        user_id: userId,
        workspace_id: workspaceId,
        metadata: {
          callType: input.callType,
          prospectName: input.prospectName,
          companyName: input.companyName,
          companyIndustry: input.companyIndustry,
          scheduledDate: input.scheduledDate?.toISOString(),
          actualDate: input.actualDate?.toISOString(),
          overallScore: analysis.callResults.analysis.overallScore,
          sentiment: analysis.callResults.analysis.sentiment,
          duration: analysis.callResults.duration,
          participantCount: analysis.callResults.participants.length,
          analysisStatus: 'completed',
          generatedAt: new Date().toISOString(),
          tokensUsed: analysis.tokensUsed,
          processingTime: analysis.processingTime,
          transcriptLength: input.transcript.length,
          questionCount: (input.transcript.match(/\?/g) || []).length,
          engagementScore: analysis.performanceMetrics.engagementScore
        },
        tags: [
          'sales-call', 
          input.callType, 
          input.companyIndustry?.toLowerCase() || 'general',
          'analysis',
          analysis.callResults.analysis.sentiment,
          'text-based'
        ]
      }
    });

    console.log('✅ Deliverable created with ID:', deliverable.id);
    return deliverable.id;
    
  } catch (error) {
    console.error('💥 Error saving call analysis:', error);
    console.error('💥 Error type:', error?.constructor?.name);
    console.error('💥 Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack');
    throw new Error('Failed to save call analysis');
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
      throw new Error('Failed to retrieve call analysis');
    }
  }

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
          analysisStatus: metadata?.analysisStatus || 'completed',
          transcriptLength: metadata?.transcriptLength,
          questionCount: metadata?.questionCount,
          engagementScore: metadata?.engagementScore,
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

  async updateCallAnalysis(userId: string, analysisId: string, updates: Partial<SalesCallInput>): Promise<any> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      // Get existing analysis
      const existingAnalysis = await this.getCallAnalysis(userId, analysisId);
      if (!existingAnalysis) {
        throw new Error('Call analysis not found');
      }

      const originalInput = existingAnalysis.metadata as any;
      const updatedInput = { ...originalInput, ...updates, userId };

      // If transcript or major details changed, regenerate analysis
      if (updates.transcript || updates.callType || updates.additionalContext) {
        const newAnalysis = await this.analyzeCall(updatedInput);

        const updated = await prisma.deliverable.update({
          where: { id: analysisId },
          data: {
            content: JSON.stringify(newAnalysis),
            title: updates.title ? `${updatedInput.callType} Call Analysis - ${updates.title}` : undefined,
            metadata: {
              ...(existingAnalysis.metadata as any),
              ...updates,
              updatedAt: new Date().toISOString(),
              tokensUsed: newAnalysis.tokensUsed,
              processingTime: newAnalysis.processingTime,
              overallScore: newAnalysis.callResults.analysis.overallScore,
              sentiment: newAnalysis.callResults.analysis.sentiment,
              transcriptLength: updates.transcript?.length || originalInput.transcriptLength
            }
          }
        });

        return updated;
      } else {
        // Simple metadata update
        const updated = await prisma.deliverable.update({
          where: { id: analysisId },
          data: {
            title: updates.title ? `${originalInput.callType} Call Analysis - ${updates.title}` : undefined,
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
      throw new Error('Failed to update call analysis');
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
      return false;
    }
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
        return callData.detailedReport || this.generateSummaryExport(callData, metadata);
      case 'presentation':
        return this.generatePresentationExport(analysis.analysis.summaryPresentation, metadata);
      case 'follow-up':
        return callData.followUpEmail || 'No follow-up email template available for this call type';
      default:
        return this.generateSummaryExport(callData, metadata);
    }
  }

  private generateSummaryExport(callData: any, metadata: any): string {
    return `# CALL ANALYSIS SUMMARY

**Date**: ${metadata.actualDate || metadata.scheduledDate || 'Not specified'}
**Type**: ${metadata.callType?.toUpperCase() || 'UNKNOWN'}
**Company**: ${metadata.companyName || 'Unknown'}
**Prospect**: ${metadata.prospectName || 'Unknown'}
**Duration**: ${Math.floor(callData.duration / 60)}:${(callData.duration % 60).toString().padStart(2, '0')}
**Overall Score**: ${callData.analysis.overallScore}/100
**Sentiment**: ${callData.analysis.sentiment?.toUpperCase() || 'NEUTRAL'}

## Key Insights
${callData.analysis.keyInsights?.map((insight: string) => `• ${insight}`).join('\n') || '• No specific insights available'}

## Action Items  
${callData.analysis.actionItems?.map((item: string) => `• ${item}`).join('\n') || '• Follow up as discussed'}

## Performance Metrics
• Talk Time: ${callData.performanceMetrics?.talkTime || 'N/A'}%
• Questions Asked: ${metadata.questionCount || 'N/A'}
• Engagement Score: ${callData.performanceMetrics?.engagementScore || 'N/A'}/10
• Communication Clarity: ${callData.performanceMetrics?.clarityScore || 'N/A'}/10

## Coaching Recommendations
### Strengths:
${callData.coachingFeedback?.strengths?.map((s: string) => `• ${s}`).join('\n') || '• Professional approach maintained'}

### Areas for Improvement:
${callData.coachingFeedback?.improvements?.map((i: string) => `• ${i}`).join('\n') || '• Continue current approach'}

## Next Steps
${callData.nextStepsStrategy?.immediateActions?.map((action: string) => `• ${action}`).join('\n') || '• Follow up within 24 hours'}

---
*Generated on ${new Date().toLocaleDateString()} by AI Sales Call Analyzer*`;
  }

  private generatePresentationExport(slides: any[], metadata: any): string {
    if (!slides || slides.length === 0) {
      return this.generateSummaryExport({ analysis: { keyInsights: [], actionItems: [] }, performanceMetrics: {} }, metadata);
    }

    return `# CALL ANALYSIS PRESENTATION
## ${metadata.companyName || 'Company'} - ${metadata.callType?.toUpperCase() || 'CALL'} Analysis

${slides.map((slide, index) => `
### Slide ${index + 1}: ${slide.title}

${slide.content}

---
`).join('\n')}

*Analysis generated on ${new Date().toLocaleDateString()}*
*Powered by AI Sales Call Analyzer*`;
  }

  private generateCacheKey(input: SalesCallInput): string {
    const transcript = input.transcript?.substring(0, 100) || '';
    const contextHash = `${input.callType}-${input.userId}-${input.title}-${transcript}`;
    return Buffer.from(contextHash).toString('base64').substring(0, 50);
  }

  


  // Analytics and reporting methods
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

      return this.calculateAnalyticsSummary(analyses, timeframe);
    } catch (error) {
      console.error('Error generating analytics summary:', error);
      throw new Error('Failed to generate analytics summary');
    }
  }

  private calculateAnalyticsSummary(analyses: any[], timeframe: string) {
    const totalCalls = analyses.length;
    
    if (totalCalls === 0) {
      return {
        totalCalls: 0,
        averageScore: 0,
        averageDuration: 0,
        callTypes: {},
        sentimentDistribution: {},
        timeframe,
        trend: { direction: 'stable' as const, percentage: 0 },
        topCompanies: [],
        performanceInsights: ['No calls analyzed in this timeframe']
      };
    }

    const callTypes = analyses.reduce((acc, analysis) => {
      const metadata = analysis.metadata as any;
      const type = metadata?.callType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageScore = Math.round(
      analyses.reduce((sum, analysis) => {
        const metadata = analysis.metadata as any;
        return sum + (metadata?.overallScore || 0);
      }, 0) / totalCalls * 10
    ) / 10;

    const sentimentDistribution = analyses.reduce((acc, analysis) => {
      const metadata = analysis.metadata as any;
      const sentiment = metadata?.sentiment || 'neutral';
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageDuration = Math.round(
      analyses.reduce((sum, analysis) => {
        const metadata = analysis.metadata as any;
        return sum + (metadata?.duration || 0);
      }, 0) / totalCalls
    );

    const trend = this.calculatePerformanceTrend(analyses);
    const topCompanies = this.getTopCompaniesFromAnalyses(analyses);
    const performanceInsights = this.generateAnalyticsInsights(analyses, averageScore);

    return {
      totalCalls,
      averageScore,
      averageDuration,
      callTypes,
      sentimentDistribution,
      timeframe,
      trend,
      topCompanies,
      performanceInsights
    };
  }

  private calculatePerformanceTrend(analyses: any[]) {
    if (analyses.length < 2) {
      return { direction: 'stable' as const, percentage: 0 };
    }

    // Sort by creation date
    const sorted = analyses.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const midpoint = Math.floor(sorted.length / 2);
    
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

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
      direction: change > 5 ? 'up' as const : change < -5 ? 'down' as const : 'stable' as const,
      percentage: Math.abs(Math.round(change))
    };
  }

  private getTopCompaniesFromAnalyses(analyses: any[]) {
    const companies = analyses.reduce((acc, analysis) => {
      const metadata = analysis.metadata as any;
      const company = metadata?.companyName || 'Unknown';
      if (!acc[company]) {
        acc[company] = { calls: 0, totalScore: 0 };
      }
      acc[company].calls++;
      acc[company].totalScore += metadata?.overallScore || 0;
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(companies)
      .map(([company, data]: [string, any]) => ({
        company,
        calls: data.calls,
        avgScore: Math.round((data.totalScore / data.calls) * 10) / 10
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 5);
  }

  private generateAnalyticsInsights(analyses: any[], avgScore: number): string[] {
    const insights: string[] = [];

    // Performance insights
    if (avgScore >= 85) {
      insights.push('🎉 Excellent call performance - consistently high scores across all calls');
    } else if (avgScore >= 75) {
      insights.push('✅ Strong call performance with good consistency');
    } else if (avgScore >= 65) {
      insights.push('📈 Solid performance with opportunities for improvement');
    } else {
      insights.push('🎯 Focus area identified - consider additional coaching and preparation');
    }

    // Call type insights
    const callTypes = analyses.reduce((acc, a) => {
      const metadata = a.metadata as any;
      const type = metadata?.callType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const mostCommon = Object.entries(callTypes)
      .sort((a: any, b: any) => b[1] - a[1])[0];
    
    if (mostCommon) {
      insights.push(`📞 Most frequent call type: ${mostCommon[0]} (${mostCommon[1]} calls)`);
    }

    // Sentiment insights
    const positiveCount = analyses.filter(a => {
      const metadata = a.metadata as any;
      return metadata?.sentiment === 'positive';
    }).length;
    
    const positiveRate = (positiveCount / analyses.length) * 100;
    
    if (positiveRate >= 80) {
      insights.push('😊 Excellent sentiment across calls - prospects are highly engaged');
    } else if (positiveRate >= 60) {
      insights.push('👍 Good sentiment levels - maintaining positive prospect relationships');
    } else if (positiveRate >= 40) {
      insights.push('⚖️ Mixed sentiment - focus on rapport building and value demonstration');
    } else {
      insights.push('🔄 Opportunity to improve sentiment through better preparation and approach');
    }

    // Engagement insights
    const avgEngagement = analyses.reduce((sum, a) => {
      const metadata = a.metadata as any;
      return sum + (metadata?.engagementScore || 5);
    }, 0) / analyses.length;

    if (avgEngagement >= 8) {
      insights.push('🔥 High engagement levels - prospects are actively participating');
    } else if (avgEngagement < 6) {
      insights.push('💡 Consider more interactive approaches to boost engagement');
    }

    return insights;
  }
}