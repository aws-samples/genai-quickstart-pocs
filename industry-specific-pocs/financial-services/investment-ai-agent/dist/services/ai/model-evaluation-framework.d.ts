/**
 * AI Model Evaluation Framework
 *
 * This service provides comprehensive evaluation capabilities for AI models including:
 * - Accuracy and performance metrics
 * - Bias detection and mitigation
 * - Explainability evaluation
 */
import { PerformanceMetrics, Task, ModelContext } from '../../models/services';
export interface EvaluationMetrics {
    accuracy: AccuracyMetrics;
    performance: PerformanceMetrics;
    bias: BiasMetrics;
    explainability: ExplainabilityMetrics;
    reliability: ReliabilityMetrics;
}
export interface AccuracyMetrics {
    overallAccuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix?: ConfusionMatrix;
    domainSpecificAccuracy: Record<string, number>;
    taskSpecificAccuracy: Record<string, number>;
    confidenceCalibration: number;
}
export interface ConfusionMatrix {
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
}
export interface BiasMetrics {
    overallBiasScore: number;
    demographicParity: number;
    equalizedOdds: number;
    calibrationBias: number;
    representationBias: number;
    biasDetectionResults: BiasDetectionResult[];
    mitigationRecommendations: BiasRemediation[];
}
export interface BiasDetectionResult {
    biasType: 'demographic' | 'confirmation' | 'anchoring' | 'availability' | 'representation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedGroups: string[];
    evidence: any[];
    confidence: number;
}
export interface BiasRemediation {
    biasType: string;
    strategy: 'data-augmentation' | 'prompt-engineering' | 'post-processing' | 'model-retraining';
    description: string;
    expectedImpact: number;
    implementationComplexity: 'low' | 'medium' | 'high';
    estimatedCost: number;
}
export interface ExplainabilityMetrics {
    overallExplainabilityScore: number;
    featureImportance: FeatureImportance[];
    decisionPathClarity: number;
    counterfactualExplanations: CounterfactualExplanation[];
    localExplanations: LocalExplanation[];
    globalExplanations: GlobalExplanation[];
    humanInterpretability: number;
}
export interface FeatureImportance {
    feature: string;
    importance: number;
    confidence: number;
    direction: 'positive' | 'negative' | 'neutral';
}
export interface CounterfactualExplanation {
    originalInput: any;
    counterfactualInput: any;
    originalOutput: any;
    counterfactualOutput: any;
    changedFeatures: string[];
    plausibility: number;
}
export interface LocalExplanation {
    inputId: string;
    explanation: string;
    confidence: number;
    supportingEvidence: any[];
    keyFactors: string[];
}
export interface GlobalExplanation {
    modelBehavior: string;
    keyPatterns: string[];
    limitations: string[];
    assumptions: string[];
    dataRequirements: string[];
}
export interface ReliabilityMetrics {
    consistency: number;
    robustness: number;
    stability: number;
    uncertaintyQuantification: UncertaintyMetrics;
    adversarialRobustness: number;
}
export interface UncertaintyMetrics {
    epistemicUncertainty: number;
    aleatoricUncertainty: number;
    totalUncertainty: number;
    calibrationError: number;
}
export interface EvaluationConfig {
    accuracyThresholds: {
        minimum: number;
        target: number;
        excellent: number;
    };
    biasThresholds: {
        acceptable: number;
        concerning: number;
        critical: number;
    };
    explainabilityRequirements: {
        minimumScore: number;
        requireLocalExplanations: boolean;
        requireGlobalExplanations: boolean;
        requireCounterfactuals: boolean;
    };
    evaluationDatasets: {
        testDataSize: number;
        validationDataSize: number;
        biasTestingDataSize: number;
    };
}
export interface EvaluationResult {
    modelId: string;
    evaluationId: string;
    timestamp: Date;
    metrics: EvaluationMetrics;
    overallScore: number;
    passed: boolean;
    issues: EvaluationIssue[];
    recommendations: EvaluationRecommendation[];
}
export interface EvaluationIssue {
    category: 'accuracy' | 'bias' | 'explainability' | 'reliability';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: string;
    remediation: string;
}
export interface EvaluationRecommendation {
    category: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
    expectedBenefit: string;
    implementationEffort: 'low' | 'medium' | 'high';
}
export interface TestCase {
    id: string;
    input: any;
    expectedOutput: any;
    actualOutput?: any;
    metadata: {
        domain: string;
        complexity: string;
        biasTestingGroup?: string;
        explainabilityRequired: boolean;
    };
}
export declare class ModelEvaluationFramework {
    private config;
    private evaluationHistory;
    constructor(config?: Partial<EvaluationConfig>);
    /**
     * Comprehensive model evaluation
     */
    evaluateModel(modelId: string, testCases: TestCase[], task: Task, context: ModelContext): Promise<EvaluationResult>;
    /**
     * Evaluate model accuracy and precision
     */
    evaluateAccuracy(modelId: string, testCases: TestCase[], task: Task): Promise<AccuracyMetrics>;
    /**
     * Evaluate model for various types of bias
     */
    evaluateBias(modelId: string, testCases: TestCase[], task: Task): Promise<BiasMetrics>;
    /**
     * Evaluate model explainability
     */
    evaluateExplainability(modelId: string, testCases: TestCase[], task: Task): Promise<ExplainabilityMetrics>;
    /**
     * Evaluate model reliability and robustness
     */
    evaluateReliability(modelId: string, testCases: TestCase[], task: Task): Promise<ReliabilityMetrics>;
    private evaluateTestCase;
    private compareStringOutputs;
    private compareNumericOutputs;
    private compareObjectOutputs;
    private calculateStringSimilarity;
    private levenshteinDistance;
    private isBinaryClassificationTask;
    private extractBinaryPrediction;
    private calculateConfidenceCalibration;
    private detectDemographicBias;
    private detectConfirmationBias;
    private detectAnchoringBias;
    private detectRepresentationBias;
    private categorizeOutcome;
    private hasAnchoringPattern;
    private calculateOverallBiasScore;
    private calculateDemographicParity;
    private calculateEqualizedOdds;
    private calculateCalibrationBias;
    private calculateRepresentationBias;
    private generateBiasRemediation;
    private calculateFeatureImportance;
    private extractFeatures;
    private evaluateDecisionPathClarity;
    private generateCounterfactualExplanations;
    private generateCounterfactualInput;
    private generateCounterfactualOutput;
    private generateLocalExplanations;
    private generateGlobalExplanations;
    private evaluateHumanInterpretability;
    private calculateExplainabilityScore;
    private evaluateConsistency;
    private evaluateRobustness;
    private evaluateStability;
    private quantifyUncertainty;
    private evaluateAdversarialRobustness;
    private getPerformanceMetrics;
    private calculateOverallScore;
    private determinePassFail;
    private identifyIssues;
    private generateRecommendations;
    private generateEvaluationId;
    /**
     * Get evaluation history for a specific model
     */
    getEvaluationHistory(modelId: string): EvaluationResult[];
    /**
     * Get the latest evaluation result for a model
     */
    getLatestEvaluation(modelId: string): EvaluationResult | null;
    /**
     * Compare evaluation results between models
     */
    compareModels(modelIds: string[]): Record<string, EvaluationResult | null>;
}
/**
 * Factory function to create a model evaluation framework instance
 */
export declare function createModelEvaluationFramework(config?: Partial<EvaluationConfig>): ModelEvaluationFramework;
export declare function getModelEvaluationFramework(): ModelEvaluationFramework;
