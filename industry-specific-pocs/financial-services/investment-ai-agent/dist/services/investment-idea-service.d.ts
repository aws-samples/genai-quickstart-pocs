/**
 * Investment Idea Service with versioning and tracking capabilities
 */
import { InvestmentIdea, CreateInvestmentIdeaRequest, UpdateInvestmentIdeaRequest, ValidationResult, InvestmentIdeaVersion, VersionChange, FeedbackEntry, PerformanceTracking, IdeaStatus } from '../models/investment-idea';
export declare class InvestmentIdeaService {
    private ideas;
    private versions;
    /**
     * Creates a new investment idea
     */
    createInvestmentIdea(request: CreateInvestmentIdeaRequest): Promise<{
        idea: InvestmentIdea;
        validation: ValidationResult;
    }>;
    /**
     * Updates an existing investment idea
     */
    updateInvestmentIdea(request: UpdateInvestmentIdeaRequest): Promise<{
        idea: InvestmentIdea;
        validation: ValidationResult;
        changes: VersionChange[];
    }>;
    /**
     * Gets an investment idea by ID
     */
    getInvestmentIdea(id: string): Promise<InvestmentIdea | null>;
    /**
     * Gets version history for an investment idea
     */
    getVersionHistory(id: string): Promise<InvestmentIdeaVersion[]>;
    /**
     * Adds feedback to an investment idea
     */
    addFeedback(id: string, feedback: Omit<FeedbackEntry, 'id' | 'timestamp'>): Promise<void>;
    /**
     * Adds performance tracking data
     */
    addPerformanceTracking(id: string, performance: PerformanceTracking): Promise<void>;
    /**
     * Updates the status of an investment idea
     */
    updateStatus(id: string, status: IdeaStatus, changedBy: string, reason?: string): Promise<void>;
    /**
     * Searches investment ideas based on criteria
     */
    searchInvestmentIdeas(criteria: {
        status?: IdeaStatus[];
        category?: string[];
        riskLevel?: string[];
        timeHorizon?: string[];
        tags?: string[];
        createdBy?: string;
        minConfidence?: number;
        maxAge?: number;
    }): Promise<InvestmentIdea[]>;
    /**
     * Gets investment ideas that are expiring soon
     */
    getExpiringIdeas(daysAhead?: number): Promise<InvestmentIdea[]>;
    private generateId;
    private extractDataSources;
    private calculateQualityScore;
    private calculateNoveltyScore;
}
