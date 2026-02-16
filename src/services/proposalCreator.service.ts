// services/proposalCreator.service.ts - SIMPLIFIED VERSION

import { Redis } from '@upstash/redis';
import { OpenRouterClient } from '@/lib/openrouter';
import { ProposalInput, ProposalPackage, SavedProposal, ContractTemplates } from '@/types/proposalCreator';

export class ProposalGenerationError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ProposalGenerationError';
  }
}

export class ProposalCreatorService {
  private openRouterClient: OpenRouterClient;
  private redis: Redis;
  private readonly AI_TIMEOUT = 120000;
  private readonly MAX_RETRIES = 2;

  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is required');
    }
    if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
      throw new Error('Redis configuration is required');
    }

    this.openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY);
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN
    });
  }

  async generateProposal(input: ProposalInput): Promise<ProposalPackage> {
    const startTime = Date.now();

    try {
      this.validateInput(input);

      const contracts = await this.generateContractsWithRetry(input);
      
      const proposalPackage: ProposalPackage = {
        contracts,
        tokensUsed: contracts.metadata?.tokensUsed || 0,
        generationTime: Date.now() - startTime,
        originalInput: input
      };

      return proposalPackage;
      
    } catch (error) {
      console.error('Proposal generation failed:', error);
      throw new ProposalGenerationError(
        'Failed to generate proposal. Please check your input and try again.',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private validateInput(input: ProposalInput): void {
    const errors: string[] = [];

    if (!input.clientInfo?.legalName?.trim()) {
      errors.push('Client legal name is required');
    }
    if (!input.projectScope?.description?.trim()) {
      errors.push('Project description is required');
    }
    if (!input.serviceProvider?.name?.trim()) {
      errors.push('Service provider name is required');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  private async generateContractsWithRetry(input: ProposalInput): Promise<ContractTemplates & { metadata?: any }> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Generating contracts (attempt ${attempt}/${this.MAX_RETRIES})`);
        return await this.generateContractsFromAI(input);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`  Attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < this.MAX_RETRIES) {
          const delay = 2000 * attempt;
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`AI generation failed after ${this.MAX_RETRIES} attempts: ${lastError?.message}`);
  }

  private async generateContractsFromAI(input: ProposalInput): Promise<ContractTemplates & { metadata?: any }> {
    console.log(' Starting AI generation...');
    
    const prompt = this.buildContractPrompt(input);
    console.log('📄 Prompt built');
    
    try {
      const response = await Promise.race([
        this.openRouterClient.complete({
          model: 'openai/gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert legal document writer specializing in service agreements and statements of work. Generate complete, professional contracts with all sections filled in using the actual information provided. NEVER use placeholders like [NAME] or [ADDRESS].'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 32000
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('AI generation timeout')), this.AI_TIMEOUT);
        })
      ]);

      console.log('  AI response received');
      console.log('📏 Response length:', response.content.length);
      
      const contracts = this.parseContractsResponse(response.content);
      
      return {
        ...contracts,
        metadata: {
          tokensUsed: response.usage.total_tokens,
          model: 'openai/gpt-4o',
          generatedAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('  AI generation failed:', error);
      throw error;
    }
  }

private buildContractPrompt(input: ProposalInput): string {
  const effectiveDate = input.effectiveDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return `Generate a complete SERVICE AGREEMENT and STATEMENT OF WORK using this exact information:

**CRITICAL REQUIREMENTS:**
1. Use ACTUAL information provided - NEVER use placeholders like [NAME] or [ADDRESS]
2. Generate COMPLETE legal text with ALL sections
3. Each document should be AT LEAST 500 words
4. Use proper legal formatting with numbered sections
5. DO NOT include signature blocks - end the document after the final substantive section

**PROVIDED INFORMATION:**

EFFECTIVE DATE: ${effectiveDate}

SERVICE PROVIDER:
- Name: ${input.serviceProvider.name || 'Service Provider'}
- Address: ${input.serviceProvider.address || '[Service Provider Address]'}
- Signatory Name: ${input.serviceProvider.signatoryName || '[Authorized Representative]'}
- Signatory Title: ${input.serviceProvider.signatoryTitle || '[Title]'}

CLIENT:
- Legal Name: ${input.clientInfo.legalName}
- Entity Type: ${input.clientInfo.entityType || 'corporation'}
- State of Incorporation: ${input.clientInfo.stateOfIncorporation || 'Delaware'}
- Address: ${input.clientInfo.address || '[Client Address]'}
- Signatory Name: ${input.clientInfo.signatoryName || '[Authorized Representative]'}
- Signatory Title: ${input.clientInfo.signatoryTitle || '[Title]'}

PROJECT DETAILS:
- Description: ${input.projectScope.description}
- Scope of Services: ${input.projectScope.scopeOfServices || 'To be defined in Statement of Work'}
- Timeline: ${input.projectScope.timeline || 'To be determined'}
- Fees: ${input.projectScope.fees || 'To be defined in Statement of Work'}
- Service Provider Responsibilities: ${input.projectScope.serviceProviderResponsibilities || 'As outlined in SOW'}
- Client Responsibilities: ${input.projectScope.clientResponsibilities || 'As outlined in SOW'}
- Acceptance Criteria: ${input.projectScope.acceptanceCriteria || 'Client written approval'}
- Additional Terms: ${input.projectScope.additionalTerms || 'None'}

**OUTPUT FORMAT:**
Return ONLY valid JSON with this exact structure:
{
  "serviceAgreement": "COMPLETE multi-paragraph SERVICE AGREEMENT text here...",
  "statementOfWork": "COMPLETE multi-paragraph STATEMENT OF WORK text here..."
}

**SERVICE AGREEMENT STRUCTURE:**
Generate the following structure with actual names/addresses. END the document after Section 12.4 - do NOT add signature blocks:

This Service Agreement (the "Agreement") is entered into as of ${effectiveDate} (the "Effective Date"), by and between:

${input.serviceProvider.name || 'Service Provider'}, with its principal place of business at ${input.serviceProvider.address || '[Service Provider Address]'} ("Service Provider"),

and

${input.clientInfo.legalName}, a ${input.clientInfo.entityType || 'corporation'} with its principal place of business at ${input.clientInfo.address || '[Client Address]'} ("Client").

Together referred to as the "Parties" and individually as a "Party."

1. SERVICES
1.1 Scope of Services.
Service Provider shall provide the services set forth in one or more statements of work, proposals, or schedules executed by the Parties (each, an "SOW"). Each SOW shall describe the services, deliverables, timelines, and fees.

1.2 Standard of Performance.
Service Provider shall perform the Services in a professional and workmanlike manner consistent with industry standards.

2. TERM
This Agreement shall commence on the Effective Date and continue until terminated in accordance with Section 10.

3. FEES & PAYMENT
3.1 Fees.
Client shall pay Service Provider the fees set forth in the applicable SOW.

3.2 Invoices.
Unless otherwise stated, Service Provider shall invoice monthly in arrears. Payment shall be due within fifteen (15) days of receipt of invoice.

3.3 Late Payments.
Past due balances may accrue interest at one and one-half percent (1.5%) per month or the maximum allowed by law.

4. EXPENSES
Client shall reimburse Service Provider for pre-approved, reasonable, out-of-pocket expenses incurred in performing the Services.

5. CONFIDENTIALITY
Each Party agrees to maintain in strict confidence any non-public, proprietary, or confidential information disclosed by the other Party, and to use such information solely for purposes of performing under this Agreement.

6. INTELLECTUAL PROPERTY
6.1 Pre-Existing IP.
Each Party retains ownership of its pre-existing intellectual property.

6.2 Deliverables.
Unless otherwise set forth in an SOW, all deliverables created specifically for Client under this Agreement shall be deemed "work made for hire" and owned by Client upon full payment.

6.3 Tools & Background Technology.
Service Provider retains all rights to its methodologies, templates, processes, code libraries, and tools used in providing the Services. Client receives a non-exclusive license to use such elements solely as incorporated into deliverables.

7. REPRESENTATIONS & WARRANTIES
Each Party represents and warrants that it has full power and authority to enter into this Agreement. Service Provider warrants that Services shall be performed in a professional manner. EXCEPT AS EXPRESSLY PROVIDED, SERVICES ARE PROVIDED "AS IS" WITHOUT OTHER WARRANTIES.

8. INDEMNIFICATION
Each Party shall indemnify, defend, and hold harmless the other Party against claims, damages, or expenses arising from the indemnifying Party's negligence, willful misconduct, or breach of this Agreement.

9. LIMITATION OF LIABILITY
Except for confidentiality or indemnification obligations, neither Party shall be liable for any indirect, incidental, special, or consequential damages. Service Provider's total liability shall not exceed the fees paid by Client in the six (6) months preceding the claim.

10. TERMINATION
Either Party may terminate this Agreement or any SOW:
(a) for convenience upon thirty (30) days' prior written notice; or
(b) immediately upon written notice if the other Party materially breaches and fails to cure within fifteen (15) days after notice.

11. GOVERNING LAW
This Agreement shall be governed by and construed under the laws of the State of ${input.clientInfo.stateOfIncorporation || 'Delaware'}, without regard to its conflicts of law principles.

12. GENERAL
12.1 Independent Contractor.
Service Provider is an independent contractor and not an employee, agent, or partner of Client.

12.2 Assignment.
Neither Party may assign this Agreement without prior written consent, except to a successor in interest by merger or acquisition.

12.3 Entire Agreement.
This Agreement, together with applicable SOWs, constitutes the entire agreement between the Parties.

12.4 Amendments.
No amendment shall be effective unless in writing and signed by both Parties.

**CRITICAL: End the Service Agreement here. Do NOT add "IN WITNESS WHEREOF" or any signature blocks.**

**STATEMENT OF WORK STRUCTURE:**
Generate the following structure. END the document after Section 7 - do NOT add signature blocks:

This Statement of Work ("SOW") is issued pursuant to the Service Agreement entered into between ${input.serviceProvider.name || 'Service Provider'} ("Service Provider") and ${input.clientInfo.legalName} ("Client"). This SOW is incorporated into and made part of the Agreement.

1. Project Description
${input.projectScope.description}

2. Scope of Services
${input.projectScope.scopeOfServices || 'Services to be performed as outlined in this agreement'}

3. Timeline & Milestones
${input.projectScope.timeline || 'To be determined'}

4. Fees & Payment
${input.projectScope.fees || 'Fees to be defined'}

5. Responsibilities
Service Provider Responsibilities:
${input.projectScope.serviceProviderResponsibilities || 'As outlined in the Service Agreement'}

Client Responsibilities:
${input.projectScope.clientResponsibilities || 'As outlined in the Service Agreement'}

6. Acceptance Criteria
${input.projectScope.acceptanceCriteria || 'Deliverables shall be deemed accepted upon Client written approval or five (5) business days after delivery if no objections are raised.'}

7. Additional Terms
${input.projectScope.additionalTerms || 'None'}

**CRITICAL: End the Statement of Work here. Do NOT add "IN WITNESS WHEREOF" or any signature blocks.**

Generate complete, professional legal text for both documents now. Include all the sections shown above. Remember: DO NOT include signature blocks, "IN WITNESS WHEREOF" clauses, or any "By:", "Name:", "Title:", "Date:" lines in your generated text. The signature blocks will be added separately during document formatting.`;
}


  private parseContractsResponse(content: string): ContractTemplates {
    console.log('🔧 Parsing AI response...');
    
    try {
      const jsonString = this.extractJSONFromResponse(content);
      const parsed = JSON.parse(jsonString);
      
      if (!parsed.serviceAgreement || !parsed.statementOfWork) {
        throw new Error('Missing required contract sections');
      }

      // Validate minimum length
      if (parsed.serviceAgreement.length < 500) {
        throw new Error('Service Agreement too short');
      }
      if (parsed.statementOfWork.length < 300) {
        throw new Error('Statement of Work too short');
      }

      return {
        serviceAgreement: parsed.serviceAgreement,
        statementOfWork: parsed.statementOfWork
      };
      
    } catch (error) {
      console.error('  Contract parsing failed:', error);
      throw new ProposalGenerationError(
        'Failed to parse AI response into valid contracts',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private extractJSONFromResponse(content: string): string {
    // Try to extract JSON from markdown code blocks
    const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      return jsonBlockMatch[1].trim();
    }

    // Try to extract JSON object
    const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      return jsonObjectMatch[0].trim();
    }

    throw new Error('No valid JSON found in AI response');
  }

  // Database operations
  async saveProposal(userId: string, workspaceId: string, proposal: ProposalPackage, input: ProposalInput): Promise<string> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const serializedProposal = JSON.stringify(proposal, null, 2);
      const clientName = input.clientInfo.legalName || 'Unknown Client';
      const proposalTitle = `Service Agreement - ${clientName}`;
      
      const deliverable = await prisma.deliverable.create({
        data: {
          title: proposalTitle,
          content: serializedProposal,
          type: 'proposal',
          user_id: userId,
          workspace_id: workspaceId,
          metadata: {
            clientName,
            effectiveDate: input.effectiveDate || new Date().toISOString(),
            generatedAt: new Date().toISOString(),
            tokensUsed: proposal.tokensUsed || 0,
            generationTime: proposal.generationTime || 0,
            version: '2.0'
          },
          tags: ['proposal', 'service-agreement']
        }
      });

      console.log('Proposal saved successfully with ID:', deliverable.id);
      return deliverable.id;
    } catch (error) {
      console.error('Error saving proposal:', error);
      throw new ProposalGenerationError('Failed to save proposal to database', error instanceof Error ? error : new Error(String(error)));
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
        include: { workspace: true }
      });

      return proposals.map(proposal => ({
        id: proposal.id,
        title: proposal.title,
        clientName: (proposal.metadata as any)?.clientName || 'Unknown Client',
        status: 'draft',
        totalValue: 0,
        createdAt: proposal.created_at,
        updatedAt: proposal.updated_at,
        proposalData: typeof proposal.content === 'string' ? JSON.parse(proposal.content) : proposal.content,
        metadata: {
          version: (proposal.metadata as any)?.version || '2.0'
        },
        workspace: proposal.workspace
      }));
    } catch (error) {
      console.error('Error fetching user proposals:', error);
      throw new ProposalGenerationError('Failed to retrieve proposals', error instanceof Error ? error : new Error(String(error)));
    }
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
        include: { workspace: true }
      });

      if (!deliverable) {
        return null;
      }

      return {
        id: deliverable.id,
        title: deliverable.title,
        proposalData: typeof deliverable.content === 'string' ? JSON.parse(deliverable.content) : deliverable.content,
        metadata: deliverable.metadata,
        createdAt: deliverable.created_at,
        updatedAt: deliverable.updated_at,
        workspace: deliverable.workspace
      };
    } catch (error) {
      console.error('Error retrieving proposal:', error);
      throw new ProposalGenerationError('Failed to retrieve proposal', error instanceof Error ? error : new Error(String(error)));
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
      throw new ProposalGenerationError('Failed to delete proposal', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async exportProposal(userId: string, proposalId: string, format: 'json' | 'html' | 'pdf' = 'html') {
    try {
      const proposal = await this.getProposal(userId, proposalId);
      if (!proposal) {
        throw new ProposalGenerationError('Proposal not found');
      }

      const clientName = this.sanitizeFilename((proposal.metadata as any)?.clientName || 'export');
      
      if (format === 'json') {
        return {
          format: 'json',
          content: JSON.stringify(proposal, null, 2),
          filename: `proposal-${clientName}.json`,
          mimeType: 'application/json'
        };
      }

      if (format === 'html') {
        const htmlContent = this.generateHTMLExport(proposal);
        return {
          format: 'html',
          content: htmlContent,
          filename: `proposal-${clientName}.html`,
          mimeType: 'text/html'
        };
      }

      throw new ProposalGenerationError(`Unsupported export format: ${format}`);
      
    } catch (error) {
      console.error('Export error:', error);
      throw new ProposalGenerationError('Failed to export proposal', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private generateHTMLExport(proposal: any): string {
  const contracts = proposal.proposalData?.contracts;
  const originalInput = proposal.proposalData?.originalInput;
  const metadata = proposal.metadata || {};
  
  // Extract signatory information
  const providerName = originalInput?.serviceProvider?.name || 'Service Provider';
  const providerAddress = originalInput?.serviceProvider?.address || '';
  const providerSignatoryName = originalInput?.serviceProvider?.signatoryName || '_________________________';
  const providerSignatoryTitle = originalInput?.serviceProvider?.signatoryTitle || '_________________________';
  
  const clientName = originalInput?.clientInfo?.legalName || 'Client';
  const clientAddress = originalInput?.clientInfo?.address || '';
  const clientSignatoryName = originalInput?.clientInfo?.signatoryName || '_________________________';
  const clientSignatoryTitle = originalInput?.clientInfo?.signatoryTitle || '_________________________';
  const effectiveDate = originalInput?.effectiveDate || metadata?.effectiveDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Agreement - ${this.escapeHtml(clientName)}</title>
    <style>
        body { 
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 1in;
        }
        .document-title {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            margin: 30px 0;
        }
        .content {
            text-align: justify;
            white-space: pre-wrap;
        }
        .signature-block {
            margin-top: 60px;
            page-break-inside: avoid;
        }
        .signature-container {
            display: table;
            width: 100%;
            margin-top: 40px;
        }
        .signature-box {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding: 0 20px;
        }
        .signature-box:first-child {
            padding-left: 0;
        }
        .signature-box:last-child {
            padding-right: 0;
        }
        .signature-line {
            border-top: 1px solid #000;
            margin: 40px 0 5px 0;
            padding-top: 5px;
        }
        .signature-label {
            font-size: 10pt;
            margin: 3px 0;
        }
        .page-break { page-break-before: always; }
        
        @media print {
            .signature-container {
                display: table;
            }
            .signature-box {
                display: table-cell;
            }
        }
    </style>
</head>
<body>
    <div class="document-title">SERVICE AGREEMENT</div>
    <div class="content">${this.escapeHtml(contracts?.serviceAgreement || 'Content not available')}</div>
    
    <div class="signature-block">
        <p style="font-weight: bold; margin-bottom: 30px;">IN WITNESS WHEREOF, the Parties have executed this Service Agreement as of the Effective Date.</p>
        
        <div class="signature-container">
            <div class="signature-box">
                <div><strong>${this.escapeHtml(providerName).toUpperCase()}</strong></div>
                <div style="font-size: 10pt; margin-top: 5px;">${this.escapeHtml(providerAddress)}</div>
                <div class="signature-line"></div>
                <div class="signature-label">By: _________________________</div>
                <div class="signature-label">Name: ${this.escapeHtml(providerSignatoryName)}</div>
                <div class="signature-label">Title: ${this.escapeHtml(providerSignatoryTitle)}</div>
                <div class="signature-label">Date: _________________________</div>
            </div>
            
            <div class="signature-box">
                <div><strong>${this.escapeHtml(clientName).toUpperCase()}</strong></div>
                <div style="font-size: 10pt; margin-top: 5px;">${this.escapeHtml(clientAddress)}</div>
                <div class="signature-line"></div>
                <div class="signature-label">By: _________________________</div>
                <div class="signature-label">Name: ${this.escapeHtml(clientSignatoryName)}</div>
                <div class="signature-label">Title: ${this.escapeHtml(clientSignatoryTitle)}</div>
                <div class="signature-label">Date: _________________________</div>
            </div>
        </div>
    </div>
    
    <div class="page-break"></div>
    <div class="document-title">STATEMENT OF WORK</div>
    <div class="content">${this.escapeHtml(contracts?.statementOfWork || 'Content not available')}</div>
    
    <div class="signature-block">
        <p style="font-weight: bold; margin-bottom: 30px;">IN WITNESS WHEREOF, the Parties have executed this Statement of Work as of the Effective Date.</p>
        
        <div class="signature-container">
            <div class="signature-box">
                <div><strong>${this.escapeHtml(providerName).toUpperCase()}</strong></div>
                <div style="font-size: 10pt; margin-top: 5px;">${this.escapeHtml(providerAddress)}</div>
                <div class="signature-line"></div>
                <div class="signature-label">By: _________________________</div>
                <div class="signature-label">Name: ${this.escapeHtml(providerSignatoryName)}</div>
                <div class="signature-label">Title: ${this.escapeHtml(providerSignatoryTitle)}</div>
                <div class="signature-label">Date: _________________________</div>
            </div>
            
            <div class="signature-box">
                <div><strong>${this.escapeHtml(clientName).toUpperCase()}</strong></div>
                <div style="font-size: 10pt; margin-top: 5px;">${this.escapeHtml(clientAddress)}</div>
                <div class="signature-line"></div>
                <div class="signature-label">By: _________________________</div>
                <div class="signature-label">Name: ${this.escapeHtml(clientSignatoryName)}</div>
                <div class="signature-label">Title: ${this.escapeHtml(clientSignatoryTitle)}</div>
                <div class="signature-label">Date: _________________________</div>
            </div>
        </div>
    </div>
</body>
</html>`;
}


  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9\-_]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .substring(0, 50) || 'proposal';
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}