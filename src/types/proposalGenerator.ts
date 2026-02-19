// types/proposalGenerator.ts - Proposal Generator (Gamma Prompt Creator)

/** Section 1: Client & Presentation Details */
export interface ClientDetails {
  clientName: string;
  clientTitle: string;
  companyName: string;
  corePitchGoal: string;
  presentationTone: string;
}

/** Section 2: Current State / Pain Points */
export interface CurrentState {
  mainBottleneck: string;
  teamInefficiencies: string;
  opportunityCost?: string;
}

/** Section 3: Future State / Proposed Changes */
export interface FutureState {
  proposedTeamStructure: string;
  ownerExecutiveRole: string;
}

/** Section 4: Solutions (repeatable) */
export interface ProposalSolution {
  id: string;
  solutionName: string;
  howItWorks: string;
  keyBenefits?: string;
  setupFee: string;
  monthlyFee: string;
}

/** Section 5: The Close */
export interface CloseDetails {
  bundleDiscountOffer?: string;
  callToAction: string;
  bookingLink?: string;
}

/** Full Proposal Generator Input */
export interface ProposalGeneratorInput {
  clientDetails: ClientDetails;
  currentState: CurrentState;
  futureState: FutureState;
  solutions: ProposalSolution[];
  closeDetails: CloseDetails;

  /**
   * Raw deal architecture JSON from the Sales Call Analyzer.
   * When present, the AI uses this rich data to produce a much more
   * detailed and specific prompt. Passed by the Quick Generate flow.
   */
  rawAnalysisContext?: string;
}

/** Output from the generator */
export interface ProposalGeneratorOutput {
  gammaPrompt: string;
  generatedAt: string;
  tokensUsed: number;
  processingTime: number;
  inputSnapshot: ProposalGeneratorInput;
}