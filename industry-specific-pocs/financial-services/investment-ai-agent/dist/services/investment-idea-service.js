"use strict";
/**
 * Investment Idea Service with versioning and tracking capabilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentIdeaService = void 0;
const investment_idea_validation_1 = require("../utils/investment-idea-validation");
class InvestmentIdeaService {
    constructor() {
        this.ideas = new Map();
        this.versions = new Map();
    }
    /**
     * Creates a new investment idea
     */
    async createInvestmentIdea(request) {
        // Validate the request
        const validation = investment_idea_validation_1.InvestmentIdeaValidator.validateCreateRequest(request);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
        // Generate unique ID
        const id = this.generateId();
        const now = new Date();
        // Create metadata
        const metadata = {
            sourceModels: [request.createdBy],
            processingTime: 0,
            dataSourcesUsed: this.extractDataSources(request.supportingData || []),
            researchDepth: 'standard',
            qualityScore: this.calculateQualityScore(request),
            noveltyScore: this.calculateNoveltyScore(request),
            marketConditionsAtGeneration: {
                volatilityIndex: 0,
                marketTrend: 'sideways',
                economicIndicators: {},
                geopoliticalRisk: 'medium'
            }
        };
        // Create tracking info
        const trackingInfo = {
            views: 0,
            implementations: 0,
            feedback: [],
            performance: [],
            status: 'active',
            statusHistory: [{
                    status: 'active',
                    timestamp: now,
                    changedBy: request.createdBy
                }]
        };
        // Create the investment idea
        const idea = {
            id,
            version: 1,
            title: request.title,
            description: request.description,
            investments: request.investments,
            rationale: request.rationale,
            strategy: request.strategy,
            timeHorizon: request.timeHorizon,
            confidenceScore: request.confidenceScore,
            generatedAt: now,
            expiresAt: request.expiresAt,
            lastUpdatedAt: now,
            potentialOutcomes: request.potentialOutcomes,
            supportingData: request.supportingData || [],
            counterArguments: request.counterArguments || [],
            complianceStatus: {
                compliant: true,
                issues: [],
                regulationsChecked: [],
                timestamp: now
            },
            createdBy: request.createdBy,
            tags: request.tags || [],
            category: request.category,
            riskLevel: request.riskLevel,
            targetAudience: request.targetAudience,
            metadata,
            trackingInfo
        };
        // Validate the complete idea
        const ideaValidation = investment_idea_validation_1.InvestmentIdeaValidator.validateInvestmentIdea(idea);
        // Store the idea
        this.ideas.set(id, idea);
        // Initialize version history
        this.versions.set(id, [{
                version: 1,
                timestamp: now,
                changes: [{
                        field: 'created',
                        oldValue: null,
                        newValue: idea,
                        changeType: 'added'
                    }],
                changedBy: request.createdBy,
                reason: 'Initial creation'
            }]);
        return {
            idea,
            validation: ideaValidation
        };
    }
    /**
     * Updates an existing investment idea
     */
    async updateInvestmentIdea(request) {
        // Validate the request
        const validation = investment_idea_validation_1.InvestmentIdeaValidator.validateUpdateRequest(request);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
        // Get existing idea
        const existingIdea = this.ideas.get(request.id);
        if (!existingIdea) {
            throw new Error(`Investment idea with ID ${request.id} not found`);
        }
        // Track changes
        const changes = [];
        const now = new Date();
        // Create updated idea
        const updatedIdea = { ...existingIdea };
        updatedIdea.version += 1;
        updatedIdea.lastUpdatedAt = now;
        // Apply updates and track changes
        if (request.title !== undefined && request.title !== existingIdea.title) {
            changes.push({
                field: 'title',
                oldValue: existingIdea.title,
                newValue: request.title,
                changeType: 'modified'
            });
            updatedIdea.title = request.title;
        }
        if (request.description !== undefined && request.description !== existingIdea.description) {
            changes.push({
                field: 'description',
                oldValue: existingIdea.description,
                newValue: request.description,
                changeType: 'modified'
            });
            updatedIdea.description = request.description;
        }
        if (request.rationale !== undefined && request.rationale !== existingIdea.rationale) {
            changes.push({
                field: 'rationale',
                oldValue: existingIdea.rationale,
                newValue: request.rationale,
                changeType: 'modified'
            });
            updatedIdea.rationale = request.rationale;
        }
        if (request.confidenceScore !== undefined && request.confidenceScore !== existingIdea.confidenceScore) {
            changes.push({
                field: 'confidenceScore',
                oldValue: existingIdea.confidenceScore,
                newValue: request.confidenceScore,
                changeType: 'modified'
            });
            updatedIdea.confidenceScore = request.confidenceScore;
        }
        if (request.expiresAt !== undefined && request.expiresAt !== existingIdea.expiresAt) {
            changes.push({
                field: 'expiresAt',
                oldValue: existingIdea.expiresAt,
                newValue: request.expiresAt,
                changeType: 'modified'
            });
            updatedIdea.expiresAt = request.expiresAt;
        }
        if (request.potentialOutcomes !== undefined) {
            changes.push({
                field: 'potentialOutcomes',
                oldValue: existingIdea.potentialOutcomes,
                newValue: request.potentialOutcomes,
                changeType: 'modified'
            });
            updatedIdea.potentialOutcomes = request.potentialOutcomes;
        }
        if (request.counterArguments !== undefined) {
            changes.push({
                field: 'counterArguments',
                oldValue: existingIdea.counterArguments,
                newValue: request.counterArguments,
                changeType: 'modified'
            });
            updatedIdea.counterArguments = request.counterArguments;
        }
        if (request.tags !== undefined) {
            changes.push({
                field: 'tags',
                oldValue: existingIdea.tags,
                newValue: request.tags,
                changeType: 'modified'
            });
            updatedIdea.tags = request.tags;
        }
        if (request.riskLevel !== undefined && request.riskLevel !== existingIdea.riskLevel) {
            changes.push({
                field: 'riskLevel',
                oldValue: existingIdea.riskLevel,
                newValue: request.riskLevel,
                changeType: 'modified'
            });
            updatedIdea.riskLevel = request.riskLevel;
        }
        if (request.targetAudience !== undefined) {
            changes.push({
                field: 'targetAudience',
                oldValue: existingIdea.targetAudience,
                newValue: request.targetAudience,
                changeType: 'modified'
            });
            updatedIdea.targetAudience = request.targetAudience;
        }
        // Validate the updated idea
        const ideaValidation = investment_idea_validation_1.InvestmentIdeaValidator.validateInvestmentIdea(updatedIdea);
        if (!ideaValidation.isValid) {
            throw new Error(`Updated idea validation failed: ${ideaValidation.errors.map(e => e.message).join(', ')}`);
        }
        // Store the updated idea
        this.ideas.set(request.id, updatedIdea);
        // Add version history
        const existingVersions = this.versions.get(request.id) || [];
        existingVersions.push({
            version: updatedIdea.version,
            timestamp: now,
            changes,
            changedBy: request.updatedBy,
            reason: request.reason
        });
        this.versions.set(request.id, existingVersions);
        return {
            idea: updatedIdea,
            validation: ideaValidation,
            changes
        };
    }
    /**
     * Gets an investment idea by ID
     */
    async getInvestmentIdea(id) {
        const idea = this.ideas.get(id);
        if (idea) {
            // Increment view count
            idea.trackingInfo.views += 1;
        }
        return idea || null;
    }
    /**
     * Gets version history for an investment idea
     */
    async getVersionHistory(id) {
        return this.versions.get(id) || [];
    }
    /**
     * Adds feedback to an investment idea
     */
    async addFeedback(id, feedback) {
        const idea = this.ideas.get(id);
        if (!idea) {
            throw new Error(`Investment idea with ID ${id} not found`);
        }
        const feedbackEntry = {
            id: this.generateId(),
            ...feedback,
            timestamp: new Date()
        };
        idea.trackingInfo.feedback.push(feedbackEntry);
    }
    /**
     * Adds performance tracking data
     */
    async addPerformanceTracking(id, performance) {
        const idea = this.ideas.get(id);
        if (!idea) {
            throw new Error(`Investment idea with ID ${id} not found`);
        }
        idea.trackingInfo.performance.push(performance);
    }
    /**
     * Updates the status of an investment idea
     */
    async updateStatus(id, status, changedBy, reason) {
        const idea = this.ideas.get(id);
        if (!idea) {
            throw new Error(`Investment idea with ID ${id} not found`);
        }
        const statusEntry = {
            status,
            timestamp: new Date(),
            reason,
            changedBy
        };
        idea.trackingInfo.status = status;
        idea.trackingInfo.statusHistory.push(statusEntry);
    }
    /**
     * Searches investment ideas based on criteria
     */
    async searchInvestmentIdeas(criteria) {
        const results = [];
        const now = new Date();
        for (const idea of this.ideas.values()) {
            let matches = true;
            if (criteria.status && !criteria.status.includes(idea.trackingInfo.status)) {
                matches = false;
            }
            if (criteria.category && !criteria.category.includes(idea.category)) {
                matches = false;
            }
            if (criteria.riskLevel && !criteria.riskLevel.includes(idea.riskLevel)) {
                matches = false;
            }
            if (criteria.timeHorizon && !criteria.timeHorizon.includes(idea.timeHorizon)) {
                matches = false;
            }
            if (criteria.tags && !criteria.tags.some(tag => idea.tags.includes(tag))) {
                matches = false;
            }
            if (criteria.createdBy && idea.createdBy !== criteria.createdBy) {
                matches = false;
            }
            if (criteria.minConfidence && idea.confidenceScore < criteria.minConfidence) {
                matches = false;
            }
            if (criteria.maxAge) {
                const ageInDays = (now.getTime() - idea.generatedAt.getTime()) / (1000 * 60 * 60 * 24);
                if (ageInDays > criteria.maxAge) {
                    matches = false;
                }
            }
            if (matches) {
                results.push(idea);
            }
        }
        return results;
    }
    /**
     * Gets investment ideas that are expiring soon
     */
    async getExpiringIdeas(daysAhead = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
        return Array.from(this.ideas.values()).filter(idea => idea.expiresAt &&
            idea.expiresAt <= cutoffDate &&
            idea.trackingInfo.status === 'active');
    }
    generateId() {
        return `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    extractDataSources(supportingData) {
        return [...new Set(supportingData.map(data => data.source).filter(Boolean))];
    }
    calculateQualityScore(request) {
        let score = 50; // Base score
        // Add points for completeness
        if (request.description && request.description.length > 100)
            score += 10;
        if (request.rationale && request.rationale.length > 200)
            score += 10;
        if (request.potentialOutcomes && request.potentialOutcomes.length >= 3)
            score += 10;
        if (request.counterArguments && request.counterArguments.length > 0)
            score += 10;
        if (request.supportingData && request.supportingData.length > 0)
            score += 10;
        return Math.min(100, score);
    }
    calculateNoveltyScore(request) {
        // This would typically involve comparing against existing ideas
        // For now, return a default score
        return 50;
    }
}
exports.InvestmentIdeaService = InvestmentIdeaService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52ZXN0bWVudC1pZGVhLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2VydmljZXMvaW52ZXN0bWVudC1pZGVhLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFnQkgsb0ZBQThFO0FBRTlFLE1BQWEscUJBQXFCO0lBQWxDO1FBQ1UsVUFBSyxHQUFnQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQy9DLGFBQVEsR0FBeUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQXNickUsQ0FBQztJQXBiQzs7T0FFRztJQUNILEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxPQUFvQztRQUk3RCx1QkFBdUI7UUFDdkIsTUFBTSxVQUFVLEdBQUcsb0RBQXVCLENBQUMscUJBQXFCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFMUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUU7WUFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsVUFBVSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUMzRjtRQUVELHFCQUFxQjtRQUNyQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDN0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUV2QixrQkFBa0I7UUFDbEIsTUFBTSxRQUFRLEdBQTJCO1lBQ3ZDLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7WUFDakMsY0FBYyxFQUFFLENBQUM7WUFDakIsZUFBZSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsY0FBYyxJQUFJLEVBQUUsQ0FBQztZQUN0RSxhQUFhLEVBQUUsVUFBVTtZQUN6QixZQUFZLEVBQUUsSUFBSSxDQUFDLHFC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QUUsQ0FBQztRQUNqRixJQUFJLE9BQU8sQ0FBQyxjQUFjLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQztZQUFFLEtBQUssSUFBSSxFQUFFLENBQUM7UUFFN0UsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRU8scUJBQXFCLENBQUMsT0FBb0M7UUFDaEUsZ0VBQWdFO1FBQ2hFLGtDQUFrQztRQUNsQyxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7Q0FDRjtBQXhiRCxzREF3YkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEludmVzdG1lbnQgSWRlYSBTZXJ2aWNlIHdpdGggdmVyc2lvbmluZyBhbmQgdHJhY2tpbmcgY2FwYWJpbGl0aWVzXG4gKi9cblxuaW1wb3J0IHtcbiAgSW52ZXN0bWVudElkZWEsXG4gIENyZWF0ZUludmVzdG1lbnRJZGVhUmVxdWVzdCxcbiAgVXBkYXRlSW52ZXN0bWVudElkZWFSZXF1ZXN0LFxuICBWYWxpZGF0aW9uUmVzdWx0LFxuICBJbnZlc3RtZW50SWRlYVZlcnNpb24sXG4gIFZlcnNpb25DaGFuZ2UsXG4gIEZlZWRiYWNrRW50cnksXG4gIFBlcmZvcm1hbmNlVHJhY2tpbmcsXG4gIFN0YXR1c0hpc3RvcnlFbnRyeSxcbiAgSWRlYVN0YXR1cyxcbiAgVHJhY2tpbmdJbmZvLFxuICBJbnZlc3RtZW50SWRlYU1ldGFkYXRhXG59IGZyb20gJy4uL21vZGVscy9pbnZlc3RtZW50LWlkZWEnO1xuaW1wb3J0IHsgSW52ZXN0bWVudElkZWFWYWxpZGF0b3IgfSBmcm9tICcuLi91dGlscy9pbnZlc3RtZW50LWlkZWEtdmFsaWRhdGlvbic7XG5cbmV4cG9ydCBjbGFzcyBJbnZlc3RtZW50SWRlYVNlcnZpY2Uge1xuICBwcml2YXRlIGlkZWFzOiBNYXA8c3RyaW5nLCBJbnZlc3RtZW50SWRlYT4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgdmVyc2lvbnM6IE1hcDxzdHJpbmcsIEludmVzdG1lbnRJZGVhVmVyc2lvbltdPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnZlc3RtZW50IGlkZWFcbiAgICovXG4gIGFzeW5jIGNyZWF0ZUludmVzdG1lbnRJZGVhKHJlcXVlc3Q6IENyZWF0ZUludmVzdG1lbnRJZGVhUmVxdWVzdCk6IFByb21pc2U8e1xuICAgIGlkZWE6IEludmVzdG1lbnRJZGVhO1xuICAgIHZhbGlkYXRpb246IFZhbGlkYXRpb25SZXN1bHQ7XG4gIH0+IHtcbiAgICAvLyBWYWxpZGF0ZSB0aGUgcmVxdWVzdFxuICAgIGNvbnN0IHZhbGlkYXRpb24gPSBJbnZlc3RtZW50SWRlYVZhbGlkYXRvci52YWxpZGF0ZUNyZWF0ZVJlcXVlc3QocmVxdWVzdCk7XG4gICAgXG4gICAgaWYgKCF2YWxpZGF0aW9uLmlzVmFsaWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVmFsaWRhdGlvbiBmYWlsZWQ6ICR7dmFsaWRhdGlvbi5lcnJvcnMubWFwKGUgPT4gZS5tZXNzYWdlKS5qb2luKCcsICcpfWApO1xuICAgIH1cblxuICAgIC8vIEdlbmVyYXRlIHVuaXF1ZSBJRFxuICAgIGNvbnN0IGlkID0gdGhpcy5nZW5lcmF0ZUlkKCk7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcblxuICAgIC8vIENyZWF0ZSBtZXRhZGF0YVxuICAgIGNvbnN0IG1ldGFkYXRhOiBJbnZlc3RtZW50SWRlYU1ldGFkYXRhID0ge1xuICAgICAgc291cmNlTW9kZWxzOiBbcmVxdWVzdC5jcmVhdGVkQnldLFxuICAgICAgcHJvY2Vzc2luZ1RpbWU6IDAsIC8vIFdpbGwgYmUgc2V0IGJ5IHRoZSBjYWxsaW5nIHNlcnZpY2VcbiAgICAgIGRhdGFTb3VyY2VzVXNlZDogdGhpcy5leHRyYWN0RGF0YVNvdXJjZXMocmVxdWVzdC5zdXBwb3J0aW5nRGF0YSB8fCBbXSksXG4gICAgICByZXNlYXJjaERlcHRoOiAnc3RhbmRhcmQnLCAvLyBEZWZhdWx0IHZhbHVlXG4gICAgICBxdWFsaXR5U2NvcmU6IHRoaXMuY2FsY3VsYXRlUXVhbGl0eVNjb3JlKHJlcXVlc3QpLFxuICAgICAgbm92ZWx0eVNjb3JlOiB0aGlzLmNhbGN1bGF0ZU5vdmVsdHlTY29yZShyZXF1ZXN0KSxcbiAgICAgIG1hcmtldENvbmRpdGlvbnNBdEdlbmVyYXRpb246IHtcbiAgICAgICAgdm9sYXRpbGl0eUluZGV4OiAwLCAvLyBXaWxsIGJlIHBvcHVsYXRlZCBieSBtYXJrZXQgZGF0YSBzZXJ2aWNlXG4gICAgICAgIG1hcmtldFRyZW5kOiAnc2lkZXdheXMnLCAvLyBEZWZhdWx0IHZhbHVlXG4gICAgICAgIGVjb25vbWljSW5kaWNhdG9yczoge30sXG4gICAgICAgIGdlb3BvbGl0aWNhbFJpc2s6ICdtZWRpdW0nXG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIENyZWF0ZSB0cmFja2luZyBpbmZvXG4gICAgY29uc3QgdHJhY2tpbmdJbmZvOiBUcmFja2luZ0luZm8gPSB7XG4gICAgICB2aWV3czogMCxcbiAgICAgIGltcGxlbWVudGF0aW9uczogMCxcbiAgICAgIGZlZWRiYWNrOiBbXSxcbiAgICAgIHBlcmZvcm1hbmNlOiBbXSxcbiAgICAgIHN0YXR1czogJ2FjdGl2ZScsXG4gICAgICBzdGF0dXNIaXN0b3J5OiBbe1xuICAgICAgICBzdGF0dXM6ICdhY3RpdmUnLFxuICAgICAgICB0aW1lc3RhbXA6IG5vdyxcbiAgICAgICAgY2hhbmdlZEJ5OiByZXF1ZXN0LmNyZWF0ZWRCeVxuICAgICAgfV1cbiAgICB9O1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBpbnZlc3RtZW50IGlkZWFcbiAgICBjb25zdCBpZGVhOiBJbnZlc3RtZW50SWRlYSA9IHtcbiAgICAgIGlkLFxuICAgICAgdmVyc2lvbjogMSxcbiAgICAgIHRpdGxlOiByZXF1ZXN0LnRpdGxlLFxuICAgICAgZGVzY3JpcHRpb246IHJlcXVlc3QuZGVzY3JpcHRpb24sXG4gICAgICBpbnZlc3RtZW50czogcmVxdWVzdC5pbnZlc3RtZW50cyxcbiAgICAgIHJhdGlvbmFsZTogcmVxdWVzdC5yYXRpb25hbGUsXG4gICAgICBzdHJhdGVneTogcmVxdWVzdC5zdHJhdGVneSxcbiAgICAgIHRpbWVIb3Jpem9uOiByZXF1ZXN0LnRpbWVIb3Jpem9uLFxuICAgICAgY29uZmlkZW5jZVNjb3JlOiByZXF1ZXN0LmNvbmZpZGVuY2VTY29yZSxcbiAgICAgIGdlbmVyYXRlZEF0OiBub3csXG4gICAgICBleHBpcmVzQXQ6IHJlcXVlc3QuZXhwaXJlc0F0LFxuICAgICAgbGFzdFVwZGF0ZWRBdDogbm93LFxuICAgICAgcG90ZW50aWFsT3V0Y29tZXM6IHJlcXVlc3QucG90ZW50aWFsT3V0Y29tZXMsXG4gICAgICBzdXBwb3J0aW5nRGF0YTogcmVxdWVzdC5zdXBwb3J0aW5nRGF0YSB8fCBbXSxcbiAgICAgIGNvdW50ZXJBcmd1bWVudHM6IHJlcXVlc3QuY291bnRlckFyZ3VtZW50cyB8fCBbXSxcbiAgICAgIGNvbXBsaWFuY2VTdGF0dXM6IHtcbiAgICAgICAgY29tcGxpYW50OiB0cnVlLCAvLyBXaWxsIGJlIHVwZGF0ZWQgYnkgY29tcGxpYW5jZSBzZXJ2aWNlXG4gICAgICAgIGlzc3VlczogW10sXG4gICAgICAgIHJlZ3VsYXRpb25zQ2hlY2tlZDogW10sXG4gICAgICAgIHRpbWVzdGFtcDogbm93XG4gICAgICB9LFxuICAgICAgY3JlYXRlZEJ5OiByZXF1ZXN0LmNyZWF0ZWRCeSxcbiAgICAgIHRhZ3M6IHJlcXVlc3QudGFncyB8fCBbXSxcbiAgICAgIGNhdGVnb3J5OiByZXF1ZXN0LmNhdGVnb3J5LFxuICAgICAgcmlza0xldmVsOiByZXF1ZXN0LnJpc2tMZXZlbCxcbiAgICAgIHRhcmdldEF1ZGllbmNlOiByZXF1ZXN0LnRhcmdldEF1ZGllbmNlLFxuICAgICAgbWV0YWRhdGEsXG4gICAgICB0cmFja2luZ0luZm9cbiAgICB9O1xuXG4gICAgLy8gVmFsaWRhdGUgdGhlIGNvbXBsZXRlIGlkZWFcbiAgICBjb25zdCBpZGVhVmFsaWRhdGlvbiA9IEludmVzdG1lbnRJZGVhVmFsaWRhdG9yLnZhbGlkYXRlSW52ZXN0bWVudElkZWEoaWRlYSk7XG4gICAgXG4gICAgLy8gU3RvcmUgdGhlIGlkZWFcbiAgICB0aGlzLmlkZWFzLnNldChpZCwgaWRlYSk7XG4gICAgXG4gICAgLy8gSW5pdGlhbGl6ZSB2ZXJzaW9uIGhpc3RvcnlcbiAgICB0aGlzLnZlcnNpb25zLnNldChpZCwgW3tcbiAgICAgIHZlcnNpb246IDEsXG4gICAgICB0aW1lc3RhbXA6IG5vdyxcbiAgICAgIGNoYW5nZXM6IFt7XG4gICAgICAgIGZpZWxkOiAnY3JlYXRlZCcsXG4gICAgICAgIG9sZFZhbHVlOiBudWxsLFxuICAgICAgICBuZXdWYWx1ZTogaWRlYSxcbiAgICAgICAgY2hhbmdlVHlwZTogJ2FkZGVkJ1xuICAgICAgfV0sXG4gICAgICBjaGFuZ2VkQnk6IHJlcXVlc3QuY3JlYXRlZEJ5LFxuICAgICAgcmVhc29uOiAnSW5pdGlhbCBjcmVhdGlvbidcbiAgICB9XSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgaWRlYSxcbiAgICAgIHZhbGlkYXRpb246IGlkZWFWYWxpZGF0aW9uXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIGFuIGV4aXN0aW5nIGludmVzdG1lbnQgaWRlYVxuICAgKi9cbiAgYXN5bmMgdXBkYXRlSW52ZXN0bWVudElkZWEocmVxdWVzdDogVXBkYXRlSW52ZXN0bWVudElkZWFSZXF1ZXN0KTogUHJvbWlzZTx7XG4gICAgaWRlYTogSW52ZXN0bWVudElkZWE7XG4gICAgdmFsaWRhdGlvbjogVmFsaWRhdGlvblJlc3VsdDtcbiAgICBjaGFuZ2VzOiBWZXJzaW9uQ2hhbmdlW107XG4gIH0+IHtcbiAgICAvLyBWYWxpZGF0ZSB0aGUgcmVxdWVzdFxuICAgIGNvbnN0IHZhbGlkYXRpb24gPSBJbnZlc3RtZW50SWRlYVZhbGlkYXRvci52YWxpZGF0ZVVwZGF0ZVJlcXVlc3QocmVxdWVzdCk7XG4gICAgXG4gICAgaWYgKCF2YWxpZGF0aW9uLmlzVmFsaWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVmFsaWRhdGlvbiBmYWlsZWQ6ICR7dmFsaWRhdGlvbi5lcnJvcnMubWFwKGUgPT4gZS5tZXNzYWdlKS5qb2luKCcsICcpfWApO1xuICAgIH1cblxuICAgIC8vIEdldCBleGlzdGluZyBpZGVhXG4gICAgY29uc3QgZXhpc3RpbmdJZGVhID0gdGhpcy5pZGVhcy5nZXQocmVxdWVzdC5pZCk7XG4gICAgaWYgKCFleGlzdGluZ0lkZWEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52ZXN0bWVudCBpZGVhIHdpdGggSUQgJHtyZXF1ZXN0LmlkfSBub3QgZm91bmRgKTtcbiAgICB9XG5cbiAgICAvLyBUcmFjayBjaGFuZ2VzXG4gICAgY29uc3QgY2hhbmdlczogVmVyc2lvbkNoYW5nZVtdID0gW107XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcblxuICAgIC8vIENyZWF0ZSB1cGRhdGVkIGlkZWFcbiAgICBjb25zdCB1cGRhdGVkSWRlYTogSW52ZXN0bWVudElkZWEgPSB7IC4uLmV4aXN0aW5nSWRlYSB9O1xuICAgIHVwZGF0ZWRJZGVhLnZlcnNpb24gKz0gMTtcbiAgICB1cGRhdGVkSWRlYS5sYXN0VXBkYXRlZEF0ID0gbm93O1xuXG4gICAgLy8gQXBwbHkgdXBkYXRlcyBhbmQgdHJhY2sgY2hhbmdlc1xuICAgIGlmIChyZXF1ZXN0LnRpdGxlICE9PSB1bmRlZmluZWQgJiYgcmVxdWVzdC50aXRsZSAhPT0gZXhpc3RpbmdJZGVhLnRpdGxlKSB7XG4gICAgICBjaGFuZ2VzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ3RpdGxlJyxcbiAgICAgICAgb2xkVmFsdWU6IGV4aXN0aW5nSWRlYS50aXRsZSxcbiAgICAgICAgbmV3VmFsdWU6IHJlcXVlc3QudGl0bGUsXG4gICAgICAgIGNoYW5nZVR5cGU6ICdtb2RpZmllZCdcbiAgICAgIH0pO1xuICAgICAgdXBkYXRlZElkZWEudGl0bGUgPSByZXF1ZXN0LnRpdGxlO1xuICAgIH1cblxuICAgIGlmIChyZXF1ZXN0LmRlc2NyaXB0aW9uICE9PSB1bmRlZmluZWQgJiYgcmVxdWVzdC5kZXNjcmlwdGlvbiAhPT0gZXhpc3RpbmdJZGVhLmRlc2NyaXB0aW9uKSB7XG4gICAgICBjaGFuZ2VzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ2Rlc2NyaXB0aW9uJyxcbiAgICAgICAgb2xkVmFsdWU6IGV4aXN0aW5nSWRlYS5kZXNjcmlwdGlvbixcbiAgICAgICAgbmV3VmFsdWU6IHJlcXVlc3QuZGVzY3JpcHRpb24sXG4gICAgICAgIGNoYW5nZVR5cGU6ICdtb2RpZmllZCdcbiAgICAgIH0pO1xuICAgICAgdXBkYXRlZElkZWEuZGVzY3JpcHRpb24gPSByZXF1ZXN0LmRlc2NyaXB0aW9uO1xuICAgIH1cblxuICAgIGlmIChyZXF1ZXN0LnJhdGlvbmFsZSAhPT0gdW5kZWZpbmVkICYmIHJlcXVlc3QucmF0aW9uYWxlICE9PSBleGlzdGluZ0lkZWEucmF0aW9uYWxlKSB7XG4gICAgICBjaGFuZ2VzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ3JhdGlvbmFsZScsXG4gICAgICAgIG9sZFZhbHVlOiBleGlzdGluZ0lkZWEucmF0aW9uYWxlLFxuICAgICAgICBuZXdWYWx1ZTogcmVxdWVzdC5yYXRpb25hbGUsXG4gICAgICAgIGNoYW5nZVR5cGU6ICdtb2RpZmllZCdcbiAgICAgIH0pO1xuICAgICAgdXBkYXRlZElkZWEucmF0aW9uYWxlID0gcmVxdWVzdC5yYXRpb25hbGU7XG4gICAgfVxuXG4gICAgaWYgKHJlcXVlc3QuY29uZmlkZW5jZVNjb3JlICE9PSB1bmRlZmluZWQgJiYgcmVxdWVzdC5jb25maWRlbmNlU2NvcmUgIT09IGV4aXN0aW5nSWRlYS5jb25maWRlbmNlU2NvcmUpIHtcbiAgICAgIGNoYW5nZXMucHVzaCh7XG4gICAgICAgIGZpZWxkOiAnY29uZmlkZW5jZVNjb3JlJyxcbiAgICAgICAgb2xkVmFsdWU6IGV4aXN0aW5nSWRlYS5jb25maWRlbmNlU2NvcmUsXG4gICAgICAgIG5ld1ZhbHVlOiByZXF1ZXN0LmNvbmZpZGVuY2VTY29yZSxcbiAgICAgICAgY2hhbmdlVHlwZTogJ21vZGlmaWVkJ1xuICAgICAgfSk7XG4gICAgICB1cGRhdGVkSWRlYS5jb25maWRlbmNlU2NvcmUgPSByZXF1ZXN0LmNvbmZpZGVuY2VTY29yZTtcbiAgICB9XG5cbiAgICBpZiAocmVxdWVzdC5leHBpcmVzQXQgIT09IHVuZGVmaW5lZCAmJiByZXF1ZXN0LmV4cGlyZXNBdCAhPT0gZXhpc3RpbmdJZGVhLmV4cGlyZXNBdCkge1xuICAgICAgY2hhbmdlcy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICdleHBpcmVzQXQnLFxuICAgICAgICBvbGRWYWx1ZTogZXhpc3RpbmdJZGVhLmV4cGlyZXNBdCxcbiAgICAgICAgbmV3VmFsdWU6IHJlcXVlc3QuZXhwaXJlc0F0LFxuICAgICAgICBjaGFuZ2VUeXBlOiAnbW9kaWZpZWQnXG4gICAgICB9KTtcbiAgICAgIHVwZGF0ZWRJZGVhLmV4cGlyZXNBdCA9IHJlcXVlc3QuZXhwaXJlc0F0O1xuICAgIH1cblxuICAgIGlmIChyZXF1ZXN0LnBvdGVudGlhbE91dGNvbWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNoYW5nZXMucHVzaCh7XG4gICAgICAgIGZpZWxkOiAncG90ZW50aWFsT3V0Y29tZXMnLFxuICAgICAgICBvbGRWYWx1ZTogZXhpc3RpbmdJZGVhLnBvdGVudGlhbE91dGNvbWVzLFxuICAgICAgICBuZXdWYWx1ZTogcmVxdWVzdC5wb3RlbnRpYWxPdXRjb21lcyxcbiAgICAgICAgY2hhbmdlVHlwZTogJ21vZGlmaWVkJ1xuICAgICAgfSk7XG4gICAgICB1cGRhdGVkSWRlYS5wb3RlbnRpYWxPdXRjb21lcyA9IHJlcXVlc3QucG90ZW50aWFsT3V0Y29tZXM7XG4gICAgfVxuXG4gICAgaWYgKHJlcXVlc3QuY291bnRlckFyZ3VtZW50cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjaGFuZ2VzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ2NvdW50ZXJBcmd1bWVudHMnLFxuICAgICAgICBvbGRWYWx1ZTogZXhpc3RpbmdJZGVhLmNvdW50ZXJBcmd1bWVudHMsXG4gICAgICAgIG5ld1ZhbHVlOiByZXF1ZXN0LmNvdW50ZXJBcmd1bWVudHMsXG4gICAgICAgIGNoYW5nZVR5cGU6ICdtb2RpZmllZCdcbiAgICAgIH0pO1xuICAgICAgdXBkYXRlZElkZWEuY291bnRlckFyZ3VtZW50cyA9IHJlcXVlc3QuY291bnRlckFyZ3VtZW50cztcbiAgICB9XG5cbiAgICBpZiAocmVxdWVzdC50YWdzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNoYW5nZXMucHVzaCh7XG4gICAgICAgIGZpZWxkOiAndGFncycsXG4gICAgICAgIG9sZFZhbHVlOiBleGlzdGluZ0lkZWEudGFncyxcbiAgICAgICAgbmV3VmFsdWU6IHJlcXVlc3QudGFncyxcbiAgICAgICAgY2hhbmdlVHlwZTogJ21vZGlmaWVkJ1xuICAgICAgfSk7XG4gICAgICB1cGRhdGVkSWRlYS50YWdzID0gcmVxdWVzdC50YWdzO1xuICAgIH1cblxuICAgIGlmIChyZXF1ZXN0LnJpc2tMZXZlbCAhPT0gdW5kZWZpbmVkICYmIHJlcXVlc3Qucmlza0xldmVsICE9PSBleGlzdGluZ0lkZWEucmlza0xldmVsKSB7XG4gICAgICBjaGFuZ2VzLnB1c2goe1xuICAgICAgICBmaWVsZDogJ3Jpc2tMZXZlbCcsXG4gICAgICAgIG9sZFZhbHVlOiBleGlzdGluZ0lkZWEucmlza0xldmVsLFxuICAgICAgICBuZXdWYWx1ZTogcmVxdWVzdC5yaXNrTGV2ZWwsXG4gICAgICAgIGNoYW5nZVR5cGU6ICdtb2RpZmllZCdcbiAgICAgIH0pO1xuICAgICAgdXBkYXRlZElkZWEucmlza0xldmVsID0gcmVxdWVzdC5yaXNrTGV2ZWw7XG4gICAgfVxuXG4gICAgaWYgKHJlcXVlc3QudGFyZ2V0QXVkaWVuY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY2hhbmdlcy5wdXNoKHtcbiAgICAgICAgZmllbGQ6ICd0YXJnZXRBdWRpZW5jZScsXG4gICAgICAgIG9sZFZhbHVlOiBleGlzdGluZ0lkZWEudGFyZ2V0QXVkaWVuY2UsXG4gICAgICAgIG5ld1ZhbHVlOiByZXF1ZXN0LnRhcmdldEF1ZGllbmNlLFxuICAgICAgICBjaGFuZ2VUeXBlOiAnbW9kaWZpZWQnXG4gICAgICB9KTtcbiAgICAgIHVwZGF0ZWRJZGVhLnRhcmdldEF1ZGllbmNlID0gcmVxdWVzdC50YXJnZXRBdWRpZW5jZTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSB0aGUgdXBkYXRlZCBpZGVhXG4gICAgY29uc3QgaWRlYVZhbGlkYXRpb24gPSBJbnZlc3RtZW50SWRlYVZhbGlkYXRvci52YWxpZGF0ZUludmVzdG1lbnRJZGVhKHVwZGF0ZWRJZGVhKTtcbiAgICBcbiAgICBpZiAoIWlkZWFWYWxpZGF0aW9uLmlzVmFsaWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVXBkYXRlZCBpZGVhIHZhbGlkYXRpb24gZmFpbGVkOiAke2lkZWFWYWxpZGF0aW9uLmVycm9ycy5tYXAoZSA9PiBlLm1lc3NhZ2UpLmpvaW4oJywgJyl9YCk7XG4gICAgfVxuXG4gICAgLy8gU3RvcmUgdGhlIHVwZGF0ZWQgaWRlYVxuICAgIHRoaXMuaWRlYXMuc2V0KHJlcXVlc3QuaWQsIHVwZGF0ZWRJZGVhKTtcbiAgICBcbiAgICAvLyBBZGQgdmVyc2lvbiBoaXN0b3J5XG4gICAgY29uc3QgZXhpc3RpbmdWZXJzaW9ucyA9IHRoaXMudmVyc2lvbnMuZ2V0KHJlcXVlc3QuaWQpIHx8IFtdO1xuICAgIGV4aXN0aW5nVmVyc2lvbnMucHVzaCh7XG4gICAgICB2ZXJzaW9uOiB1cGRhdGVkSWRlYS52ZXJzaW9uLFxuICAgICAgdGltZXN0YW1wOiBub3csXG4gICAgICBjaGFuZ2VzLFxuICAgICAgY2hhbmdlZEJ5OiByZXF1ZXN0LnVwZGF0ZWRCeSxcbiAgICAgIHJlYXNvbjogcmVxdWVzdC5yZWFzb25cbiAgICB9KTtcbiAgICB0aGlzLnZlcnNpb25zLnNldChyZXF1ZXN0LmlkLCBleGlzdGluZ1ZlcnNpb25zKTtcblxuICAgIHJldHVybiB7XG4gICAgICBpZGVhOiB1cGRhdGVkSWRlYSxcbiAgICAgIHZhbGlkYXRpb246IGlkZWFWYWxpZGF0aW9uLFxuICAgICAgY2hhbmdlc1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbiBpbnZlc3RtZW50IGlkZWEgYnkgSURcbiAgICovXG4gIGFzeW5jIGdldEludmVzdG1lbnRJZGVhKGlkOiBzdHJpbmcpOiBQcm9taXNlPEludmVzdG1lbnRJZGVhIHwgbnVsbD4ge1xuICAgIGNvbnN0IGlkZWEgPSB0aGlzLmlkZWFzLmdldChpZCk7XG4gICAgaWYgKGlkZWEpIHtcbiAgICAgIC8vIEluY3JlbWVudCB2aWV3IGNvdW50XG4gICAgICBpZGVhLnRyYWNraW5nSW5mby52aWV3cyArPSAxO1xuICAgIH1cbiAgICByZXR1cm4gaWRlYSB8fCBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdmVyc2lvbiBoaXN0b3J5IGZvciBhbiBpbnZlc3RtZW50IGlkZWFcbiAgICovXG4gIGFzeW5jIGdldFZlcnNpb25IaXN0b3J5KGlkOiBzdHJpbmcpOiBQcm9taXNlPEludmVzdG1lbnRJZGVhVmVyc2lvbltdPiB7XG4gICAgcmV0dXJuIHRoaXMudmVyc2lvbnMuZ2V0KGlkKSB8fCBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGZlZWRiYWNrIHRvIGFuIGludmVzdG1lbnQgaWRlYVxuICAgKi9cbiAgYXN5bmMgYWRkRmVlZGJhY2soaWQ6IHN0cmluZywgZmVlZGJhY2s6IE9taXQ8RmVlZGJhY2tFbnRyeSwgJ2lkJyB8ICd0aW1lc3RhbXAnPik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGlkZWEgPSB0aGlzLmlkZWFzLmdldChpZCk7XG4gICAgaWYgKCFpZGVhKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmVzdG1lbnQgaWRlYSB3aXRoIElEICR7aWR9IG5vdCBmb3VuZGApO1xuICAgIH1cblxuICAgIGNvbnN0IGZlZWRiYWNrRW50cnk6IEZlZWRiYWNrRW50cnkgPSB7XG4gICAgICBpZDogdGhpcy5nZW5lcmF0ZUlkKCksXG4gICAgICAuLi5mZWVkYmFjayxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxuICAgIH07XG5cbiAgICBpZGVhLnRyYWNraW5nSW5mby5mZWVkYmFjay5wdXNoKGZlZWRiYWNrRW50cnkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgcGVyZm9ybWFuY2UgdHJhY2tpbmcgZGF0YVxuICAgKi9cbiAgYXN5bmMgYWRkUGVyZm9ybWFuY2VUcmFja2luZyhpZDogc3RyaW5nLCBwZXJmb3JtYW5jZTogUGVyZm9ybWFuY2VUcmFja2luZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGlkZWEgPSB0aGlzLmlkZWFzLmdldChpZCk7XG4gICAgaWYgKCFpZGVhKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmVzdG1lbnQgaWRlYSB3aXRoIElEICR7aWR9IG5vdCBmb3VuZGApO1xuICAgIH1cblxuICAgIGlkZWEudHJhY2tpbmdJbmZvLnBlcmZvcm1hbmNlLnB1c2gocGVyZm9ybWFuY2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHN0YXR1cyBvZiBhbiBpbnZlc3RtZW50IGlkZWFcbiAgICovXG4gIGFzeW5jIHVwZGF0ZVN0YXR1cyhpZDogc3RyaW5nLCBzdGF0dXM6IElkZWFTdGF0dXMsIGNoYW5nZWRCeTogc3RyaW5nLCByZWFzb24/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBpZGVhID0gdGhpcy5pZGVhcy5nZXQoaWQpO1xuICAgIGlmICghaWRlYSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZlc3RtZW50IGlkZWEgd2l0aCBJRCAke2lkfSBub3QgZm91bmRgKTtcbiAgICB9XG5cbiAgICBjb25zdCBzdGF0dXNFbnRyeTogU3RhdHVzSGlzdG9yeUVudHJ5ID0ge1xuICAgICAgc3RhdHVzLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgcmVhc29uLFxuICAgICAgY2hhbmdlZEJ5XG4gICAgfTtcblxuICAgIGlkZWEudHJhY2tpbmdJbmZvLnN0YXR1cyA9IHN0YXR1cztcbiAgICBpZGVhLnRyYWNraW5nSW5mby5zdGF0dXNIaXN0b3J5LnB1c2goc3RhdHVzRW50cnkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaGVzIGludmVzdG1lbnQgaWRlYXMgYmFzZWQgb24gY3JpdGVyaWFcbiAgICovXG4gIGFzeW5jIHNlYXJjaEludmVzdG1lbnRJZGVhcyhjcml0ZXJpYToge1xuICAgIHN0YXR1cz86IElkZWFTdGF0dXNbXTtcbiAgICBjYXRlZ29yeT86IHN0cmluZ1tdO1xuICAgIHJpc2tMZXZlbD86IHN0cmluZ1tdO1xuICAgIHRpbWVIb3Jpem9uPzogc3RyaW5nW107XG4gICAgdGFncz86IHN0cmluZ1tdO1xuICAgIGNyZWF0ZWRCeT86IHN0cmluZztcbiAgICBtaW5Db25maWRlbmNlPzogbnVtYmVyO1xuICAgIG1heEFnZT86IG51bWJlcjsgLy8gaW4gZGF5c1xuICB9KTogUHJvbWlzZTxJbnZlc3RtZW50SWRlYVtdPiB7XG4gICAgY29uc3QgcmVzdWx0czogSW52ZXN0bWVudElkZWFbXSA9IFtdO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG5cbiAgICBmb3IgKGNvbnN0IGlkZWEgb2YgdGhpcy5pZGVhcy52YWx1ZXMoKSkge1xuICAgICAgbGV0IG1hdGNoZXMgPSB0cnVlO1xuXG4gICAgICBpZiAoY3JpdGVyaWEuc3RhdHVzICYmICFjcml0ZXJpYS5zdGF0dXMuaW5jbHVkZXMoaWRlYS50cmFja2luZ0luZm8uc3RhdHVzKSkge1xuICAgICAgICBtYXRjaGVzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChjcml0ZXJpYS5jYXRlZ29yeSAmJiAhY3JpdGVyaWEuY2F0ZWdvcnkuaW5jbHVkZXMoaWRlYS5jYXRlZ29yeSkpIHtcbiAgICAgICAgbWF0Y2hlcyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoY3JpdGVyaWEucmlza0xldmVsICYmICFjcml0ZXJpYS5yaXNrTGV2ZWwuaW5jbHVkZXMoaWRlYS5yaXNrTGV2ZWwpKSB7XG4gICAgICAgIG1hdGNoZXMgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNyaXRlcmlhLnRpbWVIb3Jpem9uICYmICFjcml0ZXJpYS50aW1lSG9yaXpvbi5pbmNsdWRlcyhpZGVhLnRpbWVIb3Jpem9uKSkge1xuICAgICAgICBtYXRjaGVzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChjcml0ZXJpYS50YWdzICYmICFjcml0ZXJpYS50YWdzLnNvbWUodGFnID0+IGlkZWEudGFncy5pbmNsdWRlcyh0YWcpKSkge1xuICAgICAgICBtYXRjaGVzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChjcml0ZXJpYS5jcmVhdGVkQnkgJiYgaWRlYS5jcmVhdGVkQnkgIT09IGNyaXRlcmlhLmNyZWF0ZWRCeSkge1xuICAgICAgICBtYXRjaGVzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChjcml0ZXJpYS5taW5Db25maWRlbmNlICYmIGlkZWEuY29uZmlkZW5jZVNjb3JlIDwgY3JpdGVyaWEubWluQ29uZmlkZW5jZSkge1xuICAgICAgICBtYXRjaGVzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChjcml0ZXJpYS5tYXhBZ2UpIHtcbiAgICAgICAgY29uc3QgYWdlSW5EYXlzID0gKG5vdy5nZXRUaW1lKCkgLSBpZGVhLmdlbmVyYXRlZEF0LmdldFRpbWUoKSkgLyAoMTAwMCAqIDYwICogNjAgKiAyNCk7XG4gICAgICAgIGlmIChhZ2VJbkRheXMgPiBjcml0ZXJpYS5tYXhBZ2UpIHtcbiAgICAgICAgICBtYXRjaGVzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKGlkZWEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgaW52ZXN0bWVudCBpZGVhcyB0aGF0IGFyZSBleHBpcmluZyBzb29uXG4gICAqL1xuICBhc3luYyBnZXRFeHBpcmluZ0lkZWFzKGRheXNBaGVhZDogbnVtYmVyID0gNyk6IFByb21pc2U8SW52ZXN0bWVudElkZWFbXT4ge1xuICAgIGNvbnN0IGN1dG9mZkRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIGN1dG9mZkRhdGUuc2V0RGF0ZShjdXRvZmZEYXRlLmdldERhdGUoKSArIGRheXNBaGVhZCk7XG5cbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLmlkZWFzLnZhbHVlcygpKS5maWx0ZXIoaWRlYSA9PiBcbiAgICAgIGlkZWEuZXhwaXJlc0F0ICYmIFxuICAgICAgaWRlYS5leHBpcmVzQXQgPD0gY3V0b2ZmRGF0ZSAmJiBcbiAgICAgIGlkZWEudHJhY2tpbmdJbmZvLnN0YXR1cyA9PT0gJ2FjdGl2ZSdcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBpZGVhXyR7RGF0ZS5ub3coKX1fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHIoMiwgOSl9YDtcbiAgfVxuXG4gIHByaXZhdGUgZXh0cmFjdERhdGFTb3VyY2VzKHN1cHBvcnRpbmdEYXRhOiBhbnlbXSk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gWy4uLm5ldyBTZXQoc3VwcG9ydGluZ0RhdGEubWFwKGRhdGEgPT4gZGF0YS5zb3VyY2UpLmZpbHRlcihCb29sZWFuKSldO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVRdWFsaXR5U2NvcmUocmVxdWVzdDogQ3JlYXRlSW52ZXN0bWVudElkZWFSZXF1ZXN0KTogbnVtYmVyIHtcbiAgICBsZXQgc2NvcmUgPSA1MDsgLy8gQmFzZSBzY29yZVxuXG4gICAgLy8gQWRkIHBvaW50cyBmb3IgY29tcGxldGVuZXNzXG4gICAgaWYgKHJlcXVlc3QuZGVzY3JpcHRpb24gJiYgcmVxdWVzdC5kZXNjcmlwdGlvbi5sZW5ndGggPiAxMDApIHNjb3JlICs9IDEwO1xuICAgIGlmIChyZXF1ZXN0LnJhdGlvbmFsZSAmJiByZXF1ZXN0LnJhdGlvbmFsZS5sZW5ndGggPiAyMDApIHNjb3JlICs9IDEwO1xuICAgIGlmIChyZXF1ZXN0LnBvdGVudGlhbE91dGNvbWVzICYmIHJlcXVlc3QucG90ZW50aWFsT3V0Y29tZXMubGVuZ3RoID49IDMpIHNjb3JlICs9IDEwO1xuICAgIGlmIChyZXF1ZXN0LmNvdW50ZXJBcmd1bWVudHMgJiYgcmVxdWVzdC5jb3VudGVyQXJndW1lbnRzLmxlbmd0aCA+IDApIHNjb3JlICs9IDEwO1xuICAgIGlmIChyZXF1ZXN0LnN1cHBvcnRpbmdEYXRhICYmIHJlcXVlc3Quc3VwcG9ydGluZ0RhdGEubGVuZ3RoID4gMCkgc2NvcmUgKz0gMTA7XG5cbiAgICByZXR1cm4gTWF0aC5taW4oMTAwLCBzY29yZSk7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZU5vdmVsdHlTY29yZShyZXF1ZXN0OiBDcmVhdGVJbnZlc3RtZW50SWRlYVJlcXVlc3QpOiBudW1iZXIge1xuICAgIC8vIFRoaXMgd291bGQgdHlwaWNhbGx5IGludm9sdmUgY29tcGFyaW5nIGFnYWluc3QgZXhpc3RpbmcgaWRlYXNcbiAgICAvLyBGb3Igbm93LCByZXR1cm4gYSBkZWZhdWx0IHNjb3JlXG4gICAgcmV0dXJuIDUwO1xuICB9XG59Il19