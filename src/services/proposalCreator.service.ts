// services/proposalCreator.service.ts - COMPLETE PRODUCTION VERSION
import { Redis } from '@upstash/redis';
import { 
  ProposalInput, 
  GeneratedProposal,
  ProposalPackage,
  ProposalAnalysis,
  SavedProposal,
  AlternativeOption,
  RiskAssessment,
  CompetitiveAnalysis,
  ProposalType,
  IndustryType
} from '@/types/proposalCreator';
import { generateProposalCacheKey } from '../app/validators/proposalCreator.validator';
import { OpenRouterClient } from '@/lib/openrouter';

export class ProposalCreatorService {
  private openRouterClient: OpenRouterClient;
  private redis: Redis;

  constructor() {
    this.openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });
  }

  async generateProposal(input: ProposalInput): Promise<ProposalPackage> {
    const startTime = Date.now();

    // Check cache first with proper error handling
    const cacheKey = generateProposalCacheKey(input);
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        if (typeof cached === 'string') {
          return JSON.parse(cached);
        } else if (typeof cached === 'object' && cached !== null) {
          return cached as ProposalPackage;
        }
      }
    } catch (cacheError) {
      console.warn('Cache retrieval error, proceeding with fresh generation:', cacheError);
      await this.redis.del(cacheKey).catch(() => {});
    }

    const prompt = this.buildProposalPrompt(input);

    try {
      const response = await this.openRouterClient.complete({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(input.proposalType)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 8000
      });

      const parsedProposal = this.parseProposalResponse(response.content, input);
      const analysis = this.generateProposalAnalysis(input, parsedProposal);
      const recommendations = this.generateRecommendations(input, analysis);
      const alternatives = this.generateAlternativeOptions(input);
      const riskAssessment = this.generateRiskAssessment(input);
      const competitiveAnalysis = this.generateCompetitiveAnalysis(input);

      const proposalPackage: ProposalPackage = {
        proposal: parsedProposal,
        analysis,
        recommendations,
        alternativeOptions: alternatives,
        riskAssessment,
        competitiveAnalysis,
        tokensUsed: response.usage.total_tokens,
        generationTime: Date.now() - startTime,
        originalInput: input
      };

      // Cache for 2 hours with proper error handling
      try {
        await this.redis.set(cacheKey, JSON.stringify(proposalPackage), { ex: 7200 });
      } catch (cacheSetError) {
        console.warn('Failed to cache proposal, but generation succeeded:', cacheSetError);
      }

      return proposalPackage;
    } catch (error) {
      console.error('Error generating proposal:', error);
      throw new Error('Failed to generate proposal. Please try again.');
    }
  }

  private getSystemPrompt(proposalType: ProposalType): string {
    const basePrompt = `You are an expert business proposal writer with deep experience in creating compelling, professional proposals that win contracts. You understand legal frameworks, pricing psychology, and client decision-making processes.`;

    const typeSpecificPrompts = {
      'service-agreement': `${basePrompt} You specialize in service agreements that clearly define ongoing relationships, responsibilities, and deliverables. Focus on creating comprehensive service level agreements with clear performance metrics.`,
      'project-proposal': `${basePrompt} You specialize in project-based proposals that demonstrate clear value, defined scope, and measurable outcomes. Focus on compelling project narratives and detailed implementation plans.`,
      'retainer-agreement': `${basePrompt} You specialize in retainer agreements that establish ongoing advisory relationships. Focus on value justification for monthly fees and clear service boundaries.`,
      'consulting-proposal': `${basePrompt} You specialize in consulting proposals that position expertise and strategic thinking. Focus on problem diagnosis, methodology, and transformation outcomes.`,
      'custom-proposal': `${basePrompt} You adapt your writing style to match the specific requirements and context provided. Focus on customization and client-specific value propositions.`
    };

    return typeSpecificPrompts[proposalType] || basePrompt;
  }

  private buildProposalPrompt(input: ProposalInput): string {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  const totalValue = input.pricing.totalAmount;
  
  // Handle placeholder payment schedules
  const paymentSchedule = input.pricing.paymentSchedule.length > 0 
    ? input.pricing.paymentSchedule.map(p => 
        `${this.getCleanValue(p.description, 'Payment')}: ${formatCurrency(p.amount)} due ${this.getCleanValue(p.dueDate, 'TBD')}`
      ).join('\n')
    : `50% Upfront: ${formatCurrency(totalValue * 0.5)} due Upon signing\n50% Final: ${formatCurrency(totalValue * 0.5)} due Upon completion`;

  return `
# PROPOSAL GENERATION BRIEF

## CLIENT PROFILE
**Client:** ${this.getCleanValue(input.client.legalName)} (${input.client.entityType || 'Corporation'})
**Industry:** ${input.client.industry}
**Company Size:** ${input.client.companySize}
**Decision Maker:** ${this.getCleanValue(input.client.decisionMaker || '', 'TBD')}
**Address:** ${this.getCleanValue(input.client.address || '', 'Client Address TBD')}
**Signatory:** ${this.getCleanValue(input.client.signatoryName || '', 'TBD')}, ${this.getCleanValue(input.client.signatoryTitle || '', 'TBD')}

## SERVICE PROVIDER
**Provider:** ${this.getCleanValue(input.serviceProvider.name || '', 'Service Provider')}
**Legal Name:** ${this.getCleanValue(input.serviceProvider.legalName || '', 'Service Provider LLC')}
**Address:** ${this.getCleanValue(input.serviceProvider.address || '', 'Provider Address TBD')}
**Signatory:** ${this.getCleanValue(input.serviceProvider.signatoryName || '', 'TBD')}, ${this.getCleanValue(input.serviceProvider.signatoryTitle || '', 'TBD')}
**Specializations:** ${input.serviceProvider.specializations.filter(s => !this.isPlaceholder(s)).join(', ') || 'Professional Services'}
**Credentials:** ${input.serviceProvider.credentials.filter(c => !this.isPlaceholder(c)).join(', ') || 'Professional Credentials'}

## PROJECT SCOPE
**Description:** ${input.project.description}

**Objectives:**
${input.project.objectives.filter(obj => !this.isPlaceholder(obj)).map(obj => `• ${obj}`).join('\n') || '• Deliver high-quality professional solution'}

**Deliverables:**
${input.project.deliverables.length > 0 
  ? input.project.deliverables.map(del => 
      `• ${this.getCleanValue(del.name, 'Project Deliverable')}: ${this.getCleanValue(del.description, 'Professional deliverable')} (${del.format}, qty: ${del.quantity})`
    ).join('\n')
  : '• Professional Project Deliverable: Comprehensive solution delivery (Document, qty: 1)'
}

**Timeline:** ${this.getCleanValue(input.project.timeline, '8-12 weeks')}

**Key Milestones:**
${input.project.milestones.length > 0 
  ? input.project.milestones.map(milestone => 
      `• ${this.getCleanValue(milestone.name, 'Project Milestone')}: ${this.getCleanValue(milestone.description, 'Milestone completion')} (Due: ${this.getCleanValue(milestone.dueDate, 'TBD')})`
    ).join('\n')
  : '• Project Kickoff: Initial setup and planning (Due: Week 1)\n• Project Completion: Final delivery and approval (Due: Final week)'
}

**Project Exclusions:**
${input.project.exclusions.filter(exc => !this.isPlaceholder(exc)).map(exc => `• ${exc}`).join('\n') || '• Third-party services and materials not specified\n• Ongoing support beyond project completion'}

**Assumptions:**
${input.project.assumptions.filter(ass => !this.isPlaceholder(ass)).map(ass => `• ${ass}`).join('\n') || '• Client will provide necessary access and information\n• Project requirements remain stable'}

**Dependencies:**
${input.project.dependencies.filter(dep => !this.isPlaceholder(dep)).map(dep => `• ${dep}`).join('\n') || '• Client availability for reviews and approvals'}

## PRICING STRUCTURE
**Model:** ${input.pricing.model}
**Total Value:** ${formatCurrency(totalValue)} ${input.pricing.currency}
**Payment Schedule:**
${paymentSchedule}

**Pricing Breakdown:**
${input.pricing.breakdown.length > 0 
  ? input.pricing.breakdown.map(item => 
      `• ${this.getCleanValue(item.item, 'Professional Services')}: ${this.getCleanValue(item.description, 'Complete project delivery')} (${item.quantity} × ${formatCurrency(item.rate)} = ${formatCurrency(item.amount)})`
    ).join('\n')
  : `• Professional Services: Complete project delivery as specified (1 × ${formatCurrency(totalValue)} = ${formatCurrency(totalValue)})`
}

**Expense Policy:** ${this.getCleanValue(input.pricing.expensePolicy, 'Pre-approved expenses will be reimbursed with receipts')}

## CONTRACT TERMS
**Proposal Validity:** ${input.terms.proposalValidityDays} days
**Contract Length:** ${input.terms.contractLength}
**Termination Notice:** ${input.terms.terminationNotice} days
**IP Ownership:** ${input.terms.intellectualProperty}
**Liability Limit:** ${input.terms.liabilityLimit > 0 ? formatCurrency(input.terms.liabilityLimit) : 'Standard professional limits'}
**Governing Law:** ${this.getCleanValue(input.terms.governingLaw, 'Delaware')}
**Dispute Resolution:** ${input.terms.disputeResolution}

## IMPORTANT INSTRUCTIONS

When generating the proposal content:
1. Replace any placeholder text (text in [brackets]) with professional, contextually appropriate content
2. If client or service provider information contains placeholders, use generic professional language
3. Ensure all contract templates use proper placeholder formatting for fields that need customization
4. Focus on creating compelling value propositions based on the actual project description
5. Make the proposal sound professional even when working with limited information

## OUTPUT FORMAT

Return a JSON structure with all sections properly formatted and placeholder-aware.
`;
}

  private parseProposalResponse(content: string, input: ProposalInput): GeneratedProposal {
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonString);
        
        if (this.validateProposalStructure(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to parse AI JSON response, using fallback generation');
    }

    return this.generateFallbackProposal(input);
  }

  private validateProposalStructure(proposal: any): boolean {
    return (
      proposal &&
      proposal.projectOverview &&
      proposal.scopeOfWork &&
      proposal.pricing &&
      proposal.contractTemplates &&
      proposal.contractTemplates.serviceAgreement &&
      proposal.contractTemplates.statementOfWork
    );
  }

  private generateRecommendations(input: ProposalInput, analysis: ProposalAnalysis): string[] {
    const recommendations: string[] = [];
    
    if (analysis.winProbability.score < 60) {
      recommendations.push('Consider strengthening value proposition and reducing risk factors');
    }
    
    recommendations.push(...analysis.pricingAnalysis.recommendations);
    
    if (analysis.riskLevel === 'high') {
      recommendations.push('Implement additional risk mitigation strategies');
      recommendations.push('Consider adding performance guarantees or success metrics');
    }
    
    const industryRecs = this.getIndustryRecommendations(input.client.industry);
    recommendations.push(...industryRecs.slice(0, 2));
    
    return recommendations.slice(0, 8);
  }

  private getIndustryRecommendations(industry: IndustryType): string[] {
    const industryRecommendations: Record<IndustryType, string[]> = {
      technology: [
        'Emphasize technical expertise and integration capabilities',
        'Include security and scalability considerations',
        'Highlight agile methodology and iterative approach'
      ],
      healthcare: [
        'Address compliance requirements (HIPAA, FDA)',
        'Emphasize patient outcome improvements',
        'Include risk management and quality assurance'
      ],
      finance: [
        'Address regulatory compliance requirements',
        'Emphasize risk management and security',
        'Include audit trail and documentation standards'
      ],
      consulting: [
        'Focus on methodology and proven frameworks',
        'Emphasize change management and adoption',
        'Include knowledge transfer and training'
      ],
      marketing: [
        'Include performance metrics and KPIs',
        'Emphasize creative and strategic approach',
        'Address brand guidelines and consistency'
      ],
      ecommerce: [
        'Focus on conversion optimization and user experience',
        'Address scalability and performance requirements',
        'Include analytics and measurement frameworks'
      ],
      manufacturing: [
        'Emphasize operational efficiency and cost reduction',
        'Address safety and compliance requirements',
        'Include quality control and process improvement'
      ],
      'real-estate': [
        'Focus on market analysis and valuation expertise',
        'Address regulatory and legal considerations',
        'Include risk assessment and mitigation'
      ],
      education: [
        'Emphasize learning outcomes and student success',
        'Address accessibility and inclusion requirements',
        'Include assessment and evaluation frameworks'
      ],
      other: [
        'Focus on industry best practices and standards',
        'Emphasize customized approach and flexibility',
        'Include performance monitoring and optimization'
      ]
    };
    
    return industryRecommendations[industry] || industryRecommendations.other;
  }

  private generateAlternativeOptions(input: ProposalInput): AlternativeOption[] {
    const alternatives: AlternativeOption[] = [];
    
    alternatives.push({
      title: 'Essential Package',
      description: 'Streamlined version focusing on core deliverables',
      pricingAdjustment: -0.3,
      timelineAdjustment: 'Reduced by 25%',
      scopeChanges: [
        'Focus on essential deliverables only',
        'Reduce revision cycles',
        'Streamlined reporting and documentation'
      ],
      pros: [
        'Lower investment required',
        'Faster time to value',
        'Reduced complexity'
      ],
      cons: [
        'Limited scope coverage',
        'Fewer revisions included',
        'Less comprehensive documentation'
      ]
    });
    
    alternatives.push({
      title: 'Comprehensive Package',
      description: 'Enhanced version with additional services and support',
      pricingAdjustment: 0.4,
      timelineAdjustment: 'Extended by 30%',
      scopeChanges: [
        'Additional consultation sessions',
        'Enhanced documentation and training',
        'Extended support period',
        'Additional deliverable options'
      ],
      pros: [
        'More comprehensive solution',
        'Extended support and training',
        'Additional deliverables and options'
      ],
      cons: [
        'Higher investment required',
        'Longer implementation timeline',
        'Increased complexity'
      ]
    });
    
    alternatives.push({
      title: 'Phased Implementation',
      description: 'Break project into distinct phases for better risk management',
      pricingAdjustment: 0.1,
      timelineAdjustment: 'Same overall timeline, phased delivery',
      scopeChanges: [
        'Phase 1: Core foundation and quick wins',
        'Phase 2: Advanced features and optimization',
        'Phase 3: Enhancement and scaling'
      ],
      pros: [
        'Lower initial investment',
        'Proven value before proceeding',
        'Reduced implementation risk'
      ],
      cons: [
        'Potential delays between phases',
        'May require additional coordination',
        'Slight overall cost increase'
      ]
    });
    
    return alternatives;
  }


  private isPlaceholder(value: string): boolean {
  return value.includes('[') && value.includes(']');
}

private getCleanValue(value: string, fallback: string = 'TBD'): string {
  return this.isPlaceholder(value) ? fallback : value;
}


  private generateRiskAssessment(input: ProposalInput): RiskAssessment {
    const riskCategories = {
      technical: this.assessTechnicalRisks(input),
      financial: this.assessFinancialRisks(input),
      timeline: this.assessTimelineRisks(input),
      relationship: this.assessRelationshipRisks(input)
    };
    
    const overallRisk = this.assessOverallRisk(input);
    const mitigationPlan = this.generateMitigationPlan(riskCategories);
    
    return {
      overallRisk,
      riskCategories,
      mitigationPlan
    };
  }

  private assessTechnicalRisks(input: ProposalInput): any[] {
    const risks: any[] = [];
    
    const complexDeliverables = input.project.deliverables.filter(del => 
      del.description.toLowerCase().includes('integration') ||
      del.description.toLowerCase().includes('custom') ||
      del.description.toLowerCase().includes('complex')
    );
    
    if (complexDeliverables.length > 0) {
      risks.push({
        description: 'Complex technical deliverables may require specialized expertise',
        probability: 'medium',
        impact: 'medium',
        mitigation: 'Ensure technical team has required expertise and experience'
      });
    }
    
    return risks;
  }

private assessFinancialRisks(input: ProposalInput): any[] {
  const risks: any[] = [];
  
  // Only assess if we have real payment schedule data
  if (input.pricing.paymentSchedule.length > 0 && 
      !this.isPlaceholder(input.pricing.paymentSchedule[0].description)) {
    const upfrontPercentage = input.pricing.paymentSchedule[0]?.amount / input.pricing.totalAmount || 0;
    if (upfrontPercentage < 0.25) {
      risks.push({
        description: 'Low upfront payment may create cash flow challenges',
        probability: 'medium',
        impact: 'medium',
        mitigation: 'Negotiate higher upfront payment or milestone-based payments'
      });
    }
  } else {
    risks.push({
      description: 'Payment schedule needs customization',
      probability: 'low',
      impact: 'medium',
      mitigation: 'Review and customize payment terms before sending to client'
    });
  }
  
  return risks;
}

  private assessTimelineRisks(input: ProposalInput): any[] {
    const risks: any[] = [];
    
    if (this.assessTimelineRealism(input) === 'aggressive') {
      risks.push({
        description: 'Aggressive timeline may lead to quality issues or delays',
        probability: 'high',
        impact: 'high',
        mitigation: 'Add buffer time to critical path activities and establish clear priorities'
      });
    }
    
    return risks;
  }

  private assessRelationshipRisks(input: ProposalInput): any[] {
    const risks: any[] = [];
    
    if (this.assessScopeClarity(input) === 'unclear') {
      risks.push({
        description: 'Unclear scope may lead to client expectations misalignment',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Clarify scope and establish detailed acceptance criteria'
      });
    }
    
    return risks;
  }

  private generateMitigationPlan(riskCategories: any): string[] {
    const mitigationPlan: string[] = [];
    
    mitigationPlan.push('Establish clear communication protocols and regular check-ins');
    mitigationPlan.push('Define detailed acceptance criteria for all deliverables');
    mitigationPlan.push('Implement change management process for scope modifications');
    mitigationPlan.push('Maintain detailed project documentation and progress tracking');
    
    return mitigationPlan;
  }

  private generateCompetitiveAnalysis(input: ProposalInput): CompetitiveAnalysis {
    return {
      positioningAdvantages: [
        `Specialized expertise in ${input.client.industry} industry`,
        `Proven track record with similar ${input.proposalType} engagements`,
        'Comprehensive approach with clear deliverables and timelines'
      ],
      potentialChallenges: [
        'Market competition on pricing',
        'Client budget constraints',
        'Alternative solution providers'
      ],
      differentiationPoints: [
        ...input.serviceProvider.specializations,
        `${input.pricing.model} pricing model`,
        'Industry-specific expertise and experience'
      ],
      marketBenchmarks: {
        pricingRange: {
          min: Math.round(input.pricing.totalAmount * 0.7),
          max: Math.round(input.pricing.totalAmount * 1.4)
        },
        typicalTimeline: input.project.timeline,
        standardFeatures: [
          'Project management and coordination',
          'Regular progress reporting',
          'Quality assurance and testing',
          'Documentation and knowledge transfer'
        ]
      }
    };
  }

  // Database Operations
  async saveProposal(userId: string, workspaceId: string, proposal: ProposalPackage, input: ProposalInput): Promise<string> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const serializedProposal = JSON.stringify(proposal, null, 2);
      
      const deliverable = await prisma.deliverable.create({
        data: {
          title: `${input.proposalType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${input.client.legalName}`,
          content: serializedProposal,
          type: 'proposal',
          user_id: userId,
          workspace_id: workspaceId,
          metadata: {
            proposalType: input.proposalType,
            clientName: input.client.legalName,
            clientIndustry: input.client.industry,
            totalValue: input.pricing.totalAmount,
            currency: input.pricing.currency,
            contractLength: input.terms.contractLength,
            pricingModel: input.pricing.model,
            winProbability: proposal.analysis.winProbability.score,
            riskLevel: proposal.analysis.riskLevel,
            generatedAt: new Date().toISOString(),
            tokensUsed: proposal.tokensUsed,
            generationTime: proposal.generationTime,
            version: '1.0'
          },
          tags: [
            'proposal',
            input.proposalType,
            input.client.industry,
            input.pricing.model,
            `value-${Math.floor(input.pricing.totalAmount / 10000)}0k`
          ]
        }
      });

      console.log('✅ Proposal saved successfully with ID:', deliverable.id);
      return deliverable.id;
    } catch (error) {
      console.error('💥 Error saving proposal:', error);
      throw error;
    }
  }

  async getUserProposals(userId: string, workspaceId?: string): Promise<SavedProposal[]> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const whereClause: any = {
        user_id: userId,
        type: 'proposal'
      };

      if (workspaceId) {
        whereClause.workspace_id = workspaceId;
      }

      const proposals = await prisma.deliverable.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        include: {
          workspace: true
        }
      });

      return proposals.map(proposal => ({
        id: proposal.id,
        title: proposal.title,
        proposalType: (proposal.metadata as any)?.proposalType || 'custom-proposal',
        clientName: (proposal.metadata as any)?.clientName || 'Unknown Client',
        status: 'draft',
        totalValue: (proposal.metadata as any)?.totalValue || 0,
        createdAt: proposal.created_at,
        updatedAt: proposal.updated_at,
        proposalData: JSON.parse(proposal.content),
        metadata: {
          industry: (proposal.metadata as any)?.clientIndustry || 'other',
          projectSize: this.categorizeProjectSize((proposal.metadata as any)?.totalValue || 0),
          complexity: 'moderate',
          winProbability: (proposal.metadata as any)?.winProbability || 50,
          version: (proposal.metadata as any)?.version || 1
        },
        workspace: proposal.workspace
      }));
    } catch (error) {
      console.error('Error fetching user proposals:', error);
      return [];
    }
  }

  private categorizeProjectSize(totalValue: number): 'small' | 'medium' | 'large' {
    if (totalValue < 10000) return 'small';
    if (totalValue < 100000) return 'medium';
    return 'large';
  }

  async getProposal(userId: string, proposalId: string) {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const deliverable = await prisma.deliverable.findFirst({
        where: {
          id: proposalId,
          user_id: userId,
          type: 'proposal'
        },
        include: {
          workspace: true
        }
      });

      if (!deliverable) {
        return null;
      }

      let parsedProposal: ProposalPackage;
      try {
        parsedProposal = JSON.parse(deliverable.content);
      } catch (parseError) {
        console.error('Error parsing proposal content:', parseError);
        throw new Error('Invalid proposal data');
      }

      return {
        id: deliverable.id,
        title: deliverable.title,
        proposal: parsedProposal,
        metadata: deliverable.metadata,
        createdAt: deliverable.created_at,
        updatedAt: deliverable.updated_at,
        workspace: deliverable.workspace
      };
    } catch (error) {
      console.error('Error retrieving proposal:', error);
      throw error;
    }
  }

  async deleteProposal(userId: string, proposalId: string): Promise<boolean> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const result = await prisma.deliverable.deleteMany({
        where: {
          id: proposalId,
          user_id: userId,
          type: 'proposal'
        }
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error deleting proposal:', error);
      throw error;
    }
  }

  async exportProposal(userId: string, proposalId: string, format: 'json' | 'html' | 'pdf' = 'html') {
    try {
      const proposal = await this.getProposal(userId, proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      if (format === 'json') {
        return {
          format: 'json',
          content: proposal,
          filename: `proposal-${(proposal.metadata as any)?.clientName || 'export'}.json`
        };
      }

      if (format === 'html') {
        const htmlContent = this.generateHTMLExport(proposal);
        return {
          format: 'html',
          content: htmlContent,
          filename: `proposal-${(proposal.metadata as any)?.clientName || 'export'}.html`
        };
      }

      throw new Error('PDF export not yet implemented');
    } catch (error) {
      console.error('Error exporting proposal:', error);
      throw error;
    }
  }

  private generateHTMLExport(proposal: any): string {
    const proposalData = proposal.proposal;
    const metadata = proposal.metadata;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Business Proposal - ${metadata?.clientName}</title>
    <style>
        body { 
            font-family: 'Georgia', serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 40px; 
            color: #333; 
            background: #f9f9f9; 
        }
        .container { 
            max-width: 900px; 
            margin: 0 auto; 
            background: white; 
            padding: 60px; 
            border-radius: 8px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
        }
        .header { 
            text-align: center; 
            margin-bottom: 50px; 
            padding-bottom: 30px; 
            border-bottom: 3px solid #2c5aa0; 
        }
        .section { 
            margin: 40px 0; 
            page-break-inside: avoid; 
        }
        .section h2 { 
            color: #2c5aa0; 
            border-bottom: 2px solid #e9ecef; 
            padding-bottom: 10px; 
            margin-bottom: 20px; 
        }
        .contract-section { 
            background: #f8f9fa; 
            padding: 30px; 
            border-radius: 6px; 
            margin: 30px 0; 
            border-left: 4px solid #2c5aa0; 
        }
        h1 { color: #2c5aa0; margin-bottom: 10px; }
        .meta-info { 
            background: #e9ecef; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 20px 0; 
            font-size: 0.9em; 
        }
        @media print {
            body { background: white; padding: 20px; }
            .container { box-shadow: none; padding: 20px; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Business Proposal</h1>
            <p><strong>Client:</strong> ${metadata?.clientName}</p>
            <p><strong>Total Value:</strong> ${(metadata?.totalValue || 0).toLocaleString()}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        ${proposalData.executiveSummary ? `
        <div class="section">
            <h2>Executive Summary</h2>
            <p>${proposalData.executiveSummary.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}

        <div class="section">
            <h2>Project Overview</h2>
            <p>${proposalData.projectOverview?.replace(/\n/g, '<br>') || 'Project overview not available'}</p>
        </div>

        <div class="section">
            <h2>Scope of Work</h2>
            <p>${proposalData.scopeOfWork?.replace(/\n/g, '<br>') || 'Scope of work not available'}</p>
        </div>

        <div class="section">
            <h2>Timeline & Milestones</h2>
            <p>${proposalData.timeline?.replace(/\n/g, '<br>') || 'Timeline not available'}</p>
        </div>

        <div class="section">
            <h2>Investment & Payment Terms</h2>
            <p>${proposalData.pricing?.replace(/\n/g, '<br>') || 'Pricing not available'}</p>
        </div>

        <div class="section">
            <h2>Terms & Conditions</h2>
            <p>${proposalData.terms?.replace(/\n/g, '<br>') || 'Terms not available'}</p>
        </div>

        <div class="page-break"></div>

        <div class="contract-section">
            <h2>Service Agreement</h2>
            <pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 0.85em;">
${proposalData.contractTemplates?.serviceAgreement || 'Service agreement not available'}
            </pre>
        </div>

        <div class="page-break"></div>

        <div class="contract-section">
            <h2>Statement of Work</h2>
            <pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 0.85em;">
${proposalData.contractTemplates?.statementOfWork || 'Statement of work not available'}
            </pre>
        </div>

        <div class="meta-info">
            <h3>Proposal Analysis</h3>
            <p><strong>Win Probability:</strong> ${proposalData.analysis?.winProbability?.score || 'Not analyzed'}%</p>
            <p><strong>Risk Level:</strong> ${proposalData.analysis?.riskLevel || 'Not assessed'}</p>
            <p><strong>Generated with:</strong> ${proposalData.tokensUsed || 0} AI tokens</p>
        </div>
    </div>
</body>
</html>`;
  }



// Fixed section from ProposalCreatorService

private generateFallbackProposal(input: ProposalInput): GeneratedProposal {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  
  return {
    executiveSummary: input.customizations.includeExecutiveSummary ? 
      `${input.serviceProvider.name} proposes to deliver ${input.project.description} for ${input.client.legalName}. This engagement will provide significant value through our proven methodology and deep ${input.client.industry} expertise, resulting in measurable business outcomes within the proposed ${input.project.timeline} timeline.` : undefined,
    
    projectOverview: `${input.client.legalName} has identified the need for ${input.project.description}. ${input.serviceProvider.name} proposes a comprehensive solution that addresses these requirements through our specialized ${input.serviceProvider.specializations.join(', ')} capabilities. Our approach will deliver the following key objectives: ${input.project.objectives.join(', ')}.`,
    
    scopeOfWork: `The scope of this engagement includes:\n\n${input.project.deliverables.map(del => 
      `• ${del.name}: ${del.description}\n  - Format: ${del.format}\n  - Quantity: ${del.quantity}\n  - Acceptance Criteria: ${del.acceptanceCriteria.join(', ')}`
    ).join('\n\n')}\n\nProject Exclusions:\n${input.project.exclusions.map(exc => `• ${exc}`).join('\n')}`,
    
    timeline: `Project Timeline: ${input.project.timeline}\n\nKey Milestones:\n${input.project.milestones.map(milestone => 
      `• ${milestone.name}: ${milestone.description} (Due: ${milestone.dueDate})`
    ).join('\n')}`,
    
    deliverables: input.project.deliverables.map(del => 
      `${del.name}: ${del.description} (${del.format}, ${del.quantity} units)`
    ).join('\n'),
    
    pricing: `Total Project Investment: ${formatCurrency(input.pricing.totalAmount)} ${input.pricing.currency}\n\nPricing Model: ${input.pricing.model}\n\nPayment Schedule:\n${input.pricing.paymentSchedule.map(payment => 
      `• ${payment.description}: ${formatCurrency(payment.amount)} (Due: ${payment.dueDate})`
    ).join('\n')}\n\nExpense Policy: ${input.pricing.expensePolicy}`,
    
    terms: `This proposal is valid for ${input.terms.proposalValidityDays} days. The engagement will be governed by ${input.terms.governingLaw} law with ${input.terms.disputeResolution} for dispute resolution. Intellectual property will be handled as ${input.terms.intellectualProperty}. Liability is limited to ${formatCurrency(input.terms.liabilityLimit)}.`,
    
    nextSteps: 'To proceed with this engagement:\n1. Review and approve this proposal\n2. Execute the service agreement\n3. Schedule project kickoff meeting\n4. Begin project initiation phase\n\nWe look forward to partnering with you on this important initiative.',
    
    contractTemplates: {
      serviceAgreement: this.generateServiceAgreement(input),
      statementOfWork: this.generateStatementOfWork(input),
      masterServiceAgreement: input.terms.contractLength === 'ongoing' ? this.generateMasterServiceAgreement(input) : undefined
    }
  };
}

private generateServiceAgreement(input: ProposalInput): string {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  
  // Use safe values for contract generation
  const serviceProviderName = this.getCleanValue(input.serviceProvider.name || '', '[SERVICE PROVIDER NAME]');
  const serviceProviderLegal = this.getCleanValue(input.serviceProvider.legalName || '', '[SERVICE PROVIDER LEGAL NAME]');
  const serviceProviderAddress = this.getCleanValue(input.serviceProvider.address || '', '[SERVICE PROVIDER ADDRESS]');
  const clientName = this.getCleanValue(input.client.legalName);
  const clientAddress = this.getCleanValue(input.client.address || '', '[CLIENT ADDRESS]');
  
  return `SERVICE AGREEMENT

This Service Agreement (the "Agreement") is entered into as of [DATE] (the "Effective Date"), by and between:

${serviceProviderLegal}, a ${this.getCleanValue(input.serviceProvider.businessStructure || '', '[BUSINESS STRUCTURE]')} with its principal place of business at ${serviceProviderAddress} ("Service Provider"),

and

${clientName}, a ${this.getCleanValue(input.client.stateOfIncorporation || '', '[STATE]')} ${input.client.entityType || 'Corporation'} with its principal place of business at ${clientAddress} ("Client").

Together referred to as the "Parties" and individually as a "Party."

1. SERVICES

1.1 Scope of Services.
Service Provider shall provide the services set forth in one or more statements of work executed by the Parties (each, a "SOW"). Each SOW shall describe the services, deliverables, timelines, and fees.

1.2 Standard of Performance.
Service Provider shall perform the Services in a professional and workmanlike manner consistent with industry standards for ${input.client.industry} services.

2. TERM

This Agreement shall commence on the Effective Date and continue for ${input.terms.contractLength} or until terminated in accordance with Section 8.

3. FEES & PAYMENT

3.1 Fees.
Client shall pay Service Provider the fees set forth in the applicable SOW. Total project fees: ${formatCurrency(input.pricing.totalAmount)} ${input.pricing.currency}.

3.2 Payment Schedule.
${input.pricing.paymentSchedule.length > 0 
  ? input.pricing.paymentSchedule.map(payment => 
      `${this.getCleanValue(payment.description, '[PAYMENT DESCRIPTION]')}: ${formatCurrency(payment.amount)} due ${this.getCleanValue(payment.dueDate, '[DUE DATE]')}`
    ).join('\n')
  : `50% Upfront Payment: ${formatCurrency(input.pricing.totalAmount * 0.5)} due Upon signing\n50% Final Payment: ${formatCurrency(input.pricing.totalAmount * 0.5)} due Upon completion`
}

3.3 Late Payments.
Past due balances may accrue interest at ${input.pricing.lateFeePercentage}% per month or the maximum allowed by law.

4. EXPENSES

${this.getCleanValue(input.pricing.expensePolicy, '[EXPENSE POLICY - CUSTOMIZE BASED ON YOUR BUSINESS NEEDS]')}

5. CONFIDENTIALITY

Each Party agrees to maintain in strict confidence any non-public, proprietary, or confidential information disclosed by the other Party, and to use such information solely for purposes of performing under this Agreement.

6. INTELLECTUAL PROPERTY

${this.getIPClause(input.terms.intellectualProperty)}

7. REPRESENTATIONS & WARRANTIES

Each Party represents and warrants that it has full power and authority to enter into this Agreement. Service Provider warrants that Services shall be performed in a professional manner. ${this.getCleanValue(input.terms.warranty, '[WARRANTY TERMS - CUSTOMIZE AS NEEDED]')}

8. LIMITATION OF LIABILITY

Except for confidentiality or indemnification obligations, neither Party shall be liable for any indirect, incidental, special, or consequential damages. Service Provider's total liability shall not exceed ${input.terms.liabilityLimit > 0 ? formatCurrency(input.terms.liabilityLimit) : '[LIABILITY LIMIT AMOUNT]'}.

9. TERMINATION

Either Party may terminate this Agreement upon ${input.terms.terminationNotice} days' prior written notice.

10. GOVERNING LAW

This Agreement shall be governed by and construed under the laws of the State of ${this.getCleanValue(input.terms.governingLaw, '[GOVERNING LAW STATE]')}.

11. DISPUTE RESOLUTION

Any disputes shall be resolved through ${input.terms.disputeResolution}.

${input.terms.forceMarjeure ? '12. FORCE MAJEURE\n\nNeither party shall be liable for any failure to perform due to circumstances beyond its reasonable control.' : ''}

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.

${serviceProviderName.toUpperCase()}                          ${clientName.toUpperCase()}
By: _________________________              By: _________________________
Name: ${this.getCleanValue(input.serviceProvider.signatoryName || '', '[SIGNATORY NAME]')}                Name: ${this.getCleanValue(input.client.signatoryName || '', '[CLIENT SIGNATORY NAME]')}
Title: ${this.getCleanValue(input.serviceProvider.signatoryTitle || '', '[SIGNATORY TITLE]')}                  Title: ${this.getCleanValue(input.client.signatoryTitle || '', '[CLIENT SIGNATORY TITLE]')}`;
}


  private generateStatementOfWork(input: ProposalInput): string {
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
    
    return `STATEMENT OF WORK #001

This Statement of Work ("SOW") is issued pursuant to the Service Agreement between ${input.serviceProvider.name} and ${input.client.legalName}.

1. PROJECT DESCRIPTION
${input.project.description}

2. SCOPE OF SERVICES
${input.project.deliverables.map(del => 
  `${del.name}: ${del.description}\n- Format: ${del.format}\n- Quantity: ${del.quantity}\n- Acceptance Criteria: ${del.acceptanceCriteria.join(', ')}`
).join('\n\n')}

3. TIMELINE & MILESTONES
${input.project.timeline}

Key Milestones:
${input.project.milestones.map(milestone => 
  `• ${milestone.name}: ${milestone.description} (Due: ${milestone.dueDate})`
).join('\n')}

4. PRICING
Total: ${formatCurrency(input.pricing.totalAmount)} ${input.pricing.currency}

Payment Schedule:
${input.pricing.paymentSchedule.map(payment => 
  `• ${payment.description}: ${formatCurrency(payment.amount)} due ${payment.dueDate}`
).join('\n')}

5. RESPONSIBILITIES

Service Provider Responsibilities:
• Deliver all specified services according to the timeline
• Maintain professional standards throughout the engagement
• Provide regular progress updates

Client Responsibilities:
• Provide necessary access and information
• Review deliverables within agreed timeframes
• Make payments according to the schedule

6. ACCEPTANCE CRITERIA
${input.project.deliverables.map(del => 
  `${del.name}: ${del.acceptanceCriteria.join(', ')}`
).join('\n')}

7. PROJECT EXCLUSIONS
${input.project.exclusions.map(exc => `• ${exc}`).join('\n')}

8. ASSUMPTIONS
${input.project.assumptions.map(ass => `• ${ass}`).join('\n')}

9. DEPENDENCIES
${input.project.dependencies.map(dep => `• ${dep}`).join('\n')}

IN WITNESS WHEREOF, the Parties have executed this Statement of Work as of the Effective Date.

${input.serviceProvider.name.toUpperCase()}                          ${input.client.legalName.toUpperCase()}
By: _________________________              By: _________________________
Name: ${input.serviceProvider.signatoryName}                Name: ${input.client.signatoryName}
Title: ${input.serviceProvider.signatoryTitle}                  Title: ${input.client.signatoryTitle}`;
  }

  private generateMasterServiceAgreement(input: ProposalInput): string {
    return `MASTER SERVICE AGREEMENT

This Master Service Agreement ("MSA") governs the ongoing relationship between ${input.serviceProvider.name} and ${input.client.legalName} for multiple service engagements.

1. FRAMEWORK
This MSA establishes the terms and conditions for future statements of work and service engagements.

2. ONGOING RELATIONSHIP
The parties anticipate an ongoing business relationship with multiple service engagements over time.

3. GOVERNING TERMS
Each individual engagement shall be governed by this MSA and the applicable SOW.

4. INTELLECTUAL PROPERTY FRAMEWORK
${this.getIPClause(input.terms.intellectualProperty)}

5. CONFIDENTIALITY
Enhanced confidentiality provisions for ongoing relationship and shared information.

6. TERMINATION
Either party may terminate this MSA with ${input.terms.terminationNotice} days notice, subject to completion of active SOWs.

This MSA provides the framework for our ongoing partnership and future service engagements.`;
  }

  private getIPClause(ipType: string): string {
    const clauses = {
      'client-owns': 'All deliverables and work product created under this Agreement shall be owned by Client upon full payment.',
      'service-provider-owns': 'Service Provider retains ownership of all deliverables, granting Client a license for use.',
      'shared': 'Intellectual property shall be jointly owned by both parties with shared usage rights.',
      'work-for-hire': 'All deliverables shall be deemed "work made for hire" and owned by Client upon creation.'
    };
    
    return clauses[ipType as keyof typeof clauses] || clauses['work-for-hire'];
  }

  // Analysis and Assessment Methods
  private generateProposalAnalysis(input: ProposalInput, proposal: GeneratedProposal): ProposalAnalysis {
    const winProbability = this.calculateWinProbability(input);
    const pricingAnalysis = this.analyzePricing(input);
    const riskLevel = this.assessOverallRisk(input);
    const strengthsWeaknesses = this.analyzeStrengthsWeaknesses(input);

    return {
      winProbability,
      pricingAnalysis,
      riskLevel,
      strengthsWeaknesses
    };
  }

private calculateWinProbability(input: ProposalInput): { score: number; factors: any[] } {
  let score = 60; // Base score
  const factors: any[] = [];

  // Only analyze non-placeholder specializations
  const realSpecializations = input.serviceProvider.specializations.filter(s => !this.isPlaceholder(s));
  if (realSpecializations.some(spec => 
    spec.toLowerCase().includes(input.client.industry.toLowerCase())
  )) {
    score += 15;
    factors.push({
      factor: 'Industry expertise alignment',
      impact: 'High',
      description: 'Service provider has relevant industry specialization'
    });
  } else if (realSpecializations.length === 0) {
    factors.push({
      factor: 'Limited specialization data',
      impact: 'Medium',
      description: 'Specializations not specified - consider adding for better positioning'
    });
  }

  // Handle placeholder-aware pricing analysis
  const pricingScore = this.assessPricingCompetitiveness(input);
  if (pricingScore === 'competitive') {
    score += 10;
    factors.push({
      factor: 'Competitive pricing',
      impact: 'Medium',
      description: 'Pricing is well-positioned for market acceptance'
    });
  }

  // Timeline analysis with placeholder handling
  const timelineRisk = this.assessTimelineRealism(input);
  if (timelineRisk === 'realistic') {
    score += 10;
    factors.push({
      factor: 'Realistic timeline',
      impact: 'High',
      description: 'Timeline appears achievable and well-planned'
    });
  } else if (timelineRisk === 'unknown') {
    factors.push({
      factor: 'Timeline needs clarification',
      impact: 'Medium',
      description: 'Consider specifying a more detailed timeline'
    });
  }

  return {
    score: Math.min(95, Math.max(35, score)), // Higher minimum for placeholder scenarios
    factors
  };
}



  private analyzePricing(input: ProposalInput): {
    competitiveness: 'low' | 'competitive' | 'premium';
    valueJustification: string;
    recommendations: string[];
  } {
    const competitiveness = this.assessPricingCompetitiveness(input);
    const recommendations: string[] = [];
    
    let valueJustification = `The ${input.pricing.model} pricing model provides `;
    
    switch (input.pricing.model) {
      case 'fixed-price':
        valueJustification += 'budget certainty and risk transfer to the service provider.';
        if (competitiveness === 'premium') {
          recommendations.push('Consider breaking down value components to justify premium pricing');
        }
        break;
      case 'milestone-based':
        valueJustification += 'payment tied to deliverable completion, reducing client risk.';
        recommendations.push('Ensure milestones are clearly defined and measurable');
        break;
      case 'value-based':
        valueJustification += 'pricing aligned with business outcomes and ROI.';
        recommendations.push('Quantify expected business impact to support pricing');
        break;
      default:
        valueJustification += 'transparent and fair pricing for services rendered.';
    }

    if (input.pricing.totalAmount > 100000) {
      recommendations.push('Consider offering payment plan options for large engagements');
    }

    return {
      competitiveness,
      valueJustification,
      recommendations
    };
  }

  private assessPricingCompetitiveness(input: ProposalInput): 'low' | 'competitive' | 'premium' {
    const industryMultipliers: Record<string, number> = {
      technology: 1.2,
      finance: 1.3,
      healthcare: 1.1,
      consulting: 1.0,
      marketing: 0.9
    };

    const baseRate = 150;
    const multiplier = industryMultipliers[input.client.industry] || 1.0;
    const expectedHourlyRate = baseRate * multiplier;

    const estimatedHours = input.project.deliverables.reduce((total, del) => {
      return total + (del.quantity * 10);
    }, 0);

    const impliedHourlyRate = input.pricing.totalAmount / Math.max(estimatedHours, 40);

    if (impliedHourlyRate > expectedHourlyRate * 1.3) return 'premium';
    if (impliedHourlyRate < expectedHourlyRate * 0.7) return 'low';
    return 'competitive';
  }

private assessTimelineRealism(input: ProposalInput): 'aggressive' | 'realistic' | 'conservative' | 'unknown' {
  if (this.isPlaceholder(input.project.timeline)) {
    return 'unknown';
  }

  const deliverableCount = input.project.deliverables.filter(d => !this.isPlaceholder(d.name)).length || 1;
  const milestoneCount = input.project.milestones.filter(m => !this.isPlaceholder(m.name)).length;
  const complexityScore = deliverableCount + (milestoneCount * 2);
  
  const timelineMatch = input.project.timeline.match(/(\d+)\s*(week|month|day)/i);
  if (!timelineMatch) return 'unknown';
  
  const timeValue = parseInt(timelineMatch[1]);
  const timeUnit = timelineMatch[2].toLowerCase();
  
  let timelineWeeks = timeValue;
  if (timeUnit === 'month') timelineWeeks *= 4;
  if (timeUnit === 'day') timelineWeeks /= 7;
  
  const weeksPerComplexityPoint = timelineWeeks / Math.max(complexityScore, 1);
  
  if (weeksPerComplexityPoint < 0.5) return 'aggressive';
  if (weeksPerComplexityPoint > 2) return 'conservative';
  return 'realistic';
}


  private assessScopeClarity(input: ProposalInput): 'unclear' | 'moderate' | 'clear' {
    let clarityScore = 0;
    
    const avgAcceptanceCriteria = input.project.deliverables.reduce((sum, del) => 
      sum + del.acceptanceCriteria.length, 0) / input.project.deliverables.length;
    
    if (avgAcceptanceCriteria >= 3) clarityScore += 2;
    else if (avgAcceptanceCriteria >= 1) clarityScore += 1;
    
    if (input.project.exclusions.length > 0) clarityScore += 1;
    if (input.project.assumptions.length > 0) clarityScore += 1;
    if (input.project.dependencies.length > 0) clarityScore += 1;
    
    if (clarityScore >= 4) return 'clear';
    if (clarityScore >= 2) return 'moderate';
    return 'unclear';
  }

  private assessOverallRisk(input: ProposalInput): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    if (this.assessTimelineRealism(input) === 'aggressive') riskScore += 2;
    if (this.assessPricingCompetitiveness(input) === 'premium') riskScore += 1;
    if (this.assessScopeClarity(input) === 'unclear') riskScore += 2;
    
    const upfrontPercentage = input.pricing.paymentSchedule[0]?.amount / input.pricing.totalAmount || 0;
    if (upfrontPercentage < 0.25) riskScore += 1;
    
    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  private analyzeStrengthsWeaknesses(input: ProposalInput): {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const improvements: string[] = [];

    if (input.serviceProvider.credentials.length > 0) {
      strengths.push('Strong credentials and certifications');
    }
    
    if (input.serviceProvider.specializations.length >= 3) {
      strengths.push('Diverse specialization portfolio');
    }
    
    if (this.assessScopeClarity(input) === 'clear') {
      strengths.push('Well-defined project scope and deliverables');
    }
    
    if (input.customizations.includeCaseStudies) {
      strengths.push('Includes relevant case studies and proof points');
    }

    if (this.assessPricingCompetitiveness(input) === 'premium') {
      weaknesses.push('Premium pricing may face resistance');
      improvements.push('Strengthen value proposition and ROI justification');
    }
    
    if (this.assessTimelineRealism(input) === 'aggressive') {
      weaknesses.push('Aggressive timeline increases execution risk');
      improvements.push('Consider adding buffer time to critical milestones');
    }
    
    if (input.pricing.paymentSchedule.length <= 2) {
      weaknesses.push('Limited payment milestones may impact cash flow');
      improvements.push('Consider more frequent payment milestones');
    }

    return { strengths, weaknesses, improvements };
  }

  // Cache management
  async clearProposalCache(input: ProposalInput): Promise<void> {
    try {
      const cacheKey = generateProposalCacheKey(input);
      await this.redis.del(cacheKey);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}