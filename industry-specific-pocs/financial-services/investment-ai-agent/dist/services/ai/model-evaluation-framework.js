"use strict";
/**
 * AI Model Evaluation Framework
 *
 * This service provides comprehensive evaluation capabilities for AI models including:
 * - Accuracy and performance metrics
 * - Bias detection and mitigation
 * - Explainability evaluation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModelEvaluationFramework = exports.createModelEvaluationFramework = exports.ModelEvaluationFramework = void 0;
class ModelEvaluationFramework {
    constructor(config) {
        this.evaluationHistory = [];
        this.config = {
            accuracyThresholds: {
                minimum: 0.80,
                target: 0.90,
                excellent: 0.95
            },
            biasThresholds: {
                acceptable: 0.05,
                concerning: 0.10,
                critical: 0.20
            },
            explainabilityRequirements: {
                minimumScore: 0.75,
                requireLocalExplanations: true,
                requireGlobalExplanations: true,
                requireCounterfactuals: false
            },
            evaluationDatasets: {
                testDataSize: 1000,
                validationDataSize: 500,
                biasTestingDataSize: 200
            },
            ...config
        };
    }
    /**
     * Comprehensive model evaluation
     */
    async evaluateModel(modelId, testCases, task, context) {
        const evaluationId = this.generateEvaluationId();
        console.log(`Starting comprehensive evaluation for model ${modelId}`);
        // Validate input
        if (!testCases || testCases.length === 0) {
            throw new Error('Test cases are required for model evaluation');
        }
        try {
            // Run all evaluation components
            const [accuracyMetrics, biasMetrics, explainabilityMetrics, reliabilityMetrics] = await Promise.all([
                this.evaluateAccuracy(modelId, testCases, task),
                this.evaluateBias(modelId, testCases, task),
                this.evaluateExplainability(modelId, testCases, task),
                this.evaluateReliability(modelId, testCases, task)
            ]);
            // Get performance metrics from existing systems
            const performanceMetrics = await this.getPerformanceMetrics(modelId, task);
            const metrics = {
                accuracy: accuracyMetrics,
                performance: performanceMetrics,
                bias: biasMetrics,
                explainability: explainabilityMetrics,
                reliability: reliabilityMetrics
            };
            // Calculate overall score and determine pass/fail
            const overallScore = this.calculateOverallScore(metrics);
            const passed = this.determinePassFail(metrics);
            // Identify issues and generate recommendations
            const issues = this.identifyIssues(metrics);
            const recommendations = this.generateRecommendations(metrics, issues);
            const result = {
                modelId,
                evaluationId,
                timestamp: new Date(),
                metrics,
                overallScore,
                passed,
                issues,
                recommendations
            };
            // Store evaluation result
            this.evaluationHistory.push(result);
            console.log(`Evaluation completed for model ${modelId}. Overall score: ${overallScore.toFixed(3)}, Passed: ${passed}`);
            return result;
        }
        catch (error) {
            console.error(`Error evaluating model ${modelId}:`, error);
            throw error;
        }
    }
    /**
     * Evaluate model accuracy and precision
     */
    async evaluateAccuracy(modelId, testCases, task) {
        console.log(`Evaluating accuracy for model ${modelId}`);
        let correctPredictions = 0;
        let totalPredictions = testCases.length;
        const domainAccuracy = {};
        const taskAccuracy = {};
        // Confusion matrix components
        let truePositives = 0;
        let falsePositives = 0;
        let trueNegatives = 0;
        let falseNegatives = 0;
        // Process each test case
        for (const testCase of testCases) {
            const isCorrect = this.evaluateTestCase(testCase);
            if (isCorrect) {
                correctPredictions++;
            }
            // Update domain-specific accuracy
            const domain = testCase.metadata.domain;
            if (!domainAccuracy[domain]) {
                domainAccuracy[domain] = { correct: 0, total: 0 };
            }
            domainAccuracy[domain].total++;
            if (isCorrect) {
                domainAccuracy[domain].correct++;
            }
            // Update task-specific accuracy
            const taskType = task.type;
            if (!taskAccuracy[taskType]) {
                taskAccuracy[taskType] = { correct: 0, total: 0 };
            }
            taskAccuracy[taskType].total++;
            if (isCorrect) {
                taskAccuracy[taskType].correct++;
            }
            // Update confusion matrix (simplified binary classification)
            if (this.isBinaryClassificationTask(task)) {
                const predicted = this.extractBinaryPrediction(testCase.actualOutput);
                const actual = this.extractBinaryPrediction(testCase.expectedOutput);
                if (predicted && actual)
                    truePositives++;
                else if (predicted && !actual)
                    falsePositives++;
                else if (!predicted && !actual)
                    trueNegatives++;
                else if (!predicted && actual)
                    falseNegatives++;
            }
        }
        const overallAccuracy = correctPredictions / totalPredictions;
        // Calculate precision, recall, and F1 score
        const precision = truePositives / Math.max(1, truePositives + falsePositives);
        const recall = truePositives / Math.max(1, truePositives + falseNegatives);
        const f1Score = 2 * (precision * recall) / Math.max(0.001, precision + recall);
        // Calculate domain and task specific accuracies
        const domainSpecificAccuracy = {};
        for (const [domain, stats] of Object.entries(domainAccuracy)) {
            domainSpecificAccuracy[domain] = stats.correct / stats.total;
        }
        const taskSpecificAccuracy = {};
        for (const [taskType, stats] of Object.entries(taskAccuracy)) {
            taskSpecificAccuracy[taskType] = stats.correct / stats.total;
        }
        // Calculate confidence calibration
        const confidenceCalibration = await this.calculateConfidenceCalibration(testCases);
        const confusionMatrix = {
            truePositives,
            falsePositives,
            trueNegatives,
            falseNegatives
        };
        return {
            overallAccuracy,
            precision,
            recall,
            f1Score,
            confusionMatrix,
            domainSpecificAccuracy,
            taskSpecificAccuracy,
            confidenceCalibration
        };
    }
    /**
     * Evaluate model for various types of bias
     */
    async evaluateBias(modelId, testCases, task) {
        console.log(`Evaluating bias for model ${modelId}`);
        const biasDetectionResults = [];
        const mitigationRecommendations = [];
        // Demographic bias detection
        const demographicBias = await this.detectDemographicBias(testCases);
        if (demographicBias) {
            biasDetectionResults.push(demographicBias);
        }
        // Confirmation bias detection
        const confirmationBias = await this.detectConfirmationBias(testCases);
        if (confirmationBias) {
            biasDetectionResults.push(confirmationBias);
        }
        // Anchoring bias detection
        const anchoringBias = await this.detectAnchoringBias(testCases);
        if (anchoringBias) {
            biasDetectionResults.push(anchoringBias);
        }
        // Representation bias detection
        const representationBias = await this.detectRepresentationBias(testCases);
        if (representationBias) {
            biasDetectionResults.push(representationBias);
        }
        // Calculate bias metrics
        const overallBiasScore = this.calculateOverallBiasScore(biasDetectionResults);
        const demographicParity = await this.calculateDemographicParity(testCases);
        const equalizedOdds = await this.calculateEqualizedOdds(testCases);
        const calibrationBias = await this.calculateCalibrationBias(testCases);
        const representationBiasScore = await this.calculateRepresentationBias(testCases);
        // Generate mitigation recommendations
        for (const biasResult of biasDetectionResults) {
            const remediation = this.generateBiasRemediation(biasResult);
            if (remediation) {
                mitigationRecommendations.push(remediation);
            }
        }
        return {
            overallBiasScore,
            demographicParity,
            equalizedOdds,
            calibrationBias,
            representationBias: representationBiasScore,
            biasDetectionResults,
            mitigationRecommendations
        };
    }
    /**
     * Evaluate model explainability
     */
    async evaluateExplainability(modelId, testCases, task) {
        console.log(`Evaluating explainability for model ${modelId}`);
        // Feature importance analysis
        const featureImportance = await this.calculateFeatureImportance(testCases, task);
        // Decision path clarity
        const decisionPathClarity = await this.evaluateDecisionPathClarity(testCases);
        // Generate counterfactual explanations
        const counterfactualExplanations = await this.generateCounterfactualExplanations(testCases.slice(0, 10));
        // Generate local explanations
        const localExplanations = await this.generateLocalExplanations(testCases.slice(0, 20));
        // Generate global explanations
        const globalExplanations = await this.generateGlobalExplanations(modelId, task);
        // Evaluate human interpretability
        const humanInterpretability = await this.evaluateHumanInterpretability(localExplanations, globalExplanations);
        // Calculate overall explainability score
        const overallExplainabilityScore = this.calculateExplainabilityScore({
            featureImportance,
            decisionPathClarity,
            counterfactualExplanations,
            localExplanations,
            globalExplanations,
            humanInterpretability
        });
        return {
            overallExplainabilityScore,
            featureImportance,
            decisionPathClarity,
            counterfactualExplanations,
            localExplanations,
            globalExplanations,
            humanInterpretability
        };
    }
    /**
     * Evaluate model reliability and robustness
     */
    async evaluateReliability(modelId, testCases, task) {
        console.log(`Evaluating reliability for model ${modelId}`);
        // Consistency evaluation
        const consistency = await this.evaluateConsistency(testCases);
        // Robustness evaluation
        const robustness = await this.evaluateRobustness(testCases);
        // Stability evaluation
        const stability = await this.evaluateStability(testCases);
        // Uncertainty quantification
        const uncertaintyQuantification = await this.quantifyUncertainty(testCases);
        // Adversarial robustness
        const adversarialRobustness = await this.evaluateAdversarialRobustness(testCases);
        return {
            consistency,
            robustness,
            stability,
            uncertaintyQuantification,
            adversarialRobustness
        };
    }
    // Helper methods for accuracy evaluation
    evaluateTestCase(testCase) {
        if (!testCase.actualOutput || !testCase.expectedOutput) {
            return false;
        }
        // Simple comparison - in practice, this would be more sophisticated
        if (typeof testCase.expectedOutput === 'string') {
            return this.compareStringOutputs(testCase.actualOutput, testCase.expectedOutput);
        }
        else if (typeof testCase.expectedOutput === 'number') {
            return this.compareNumericOutputs(testCase.actualOutput, testCase.expectedOutput);
        }
        else if (typeof testCase.expectedOutput === 'object') {
            return this.compareObjectOutputs(testCase.actualOutput, testCase.expectedOutput);
        }
        return false;
    }
    compareStringOutputs(actual, expected) {
        const actualStr = String(actual).toLowerCase().trim();
        const expectedStr = expected.toLowerCase().trim();
        // Use fuzzy matching for string comparison
        const similarity = this.calculateStringSimilarity(actualStr, expectedStr);
        return similarity > 0.8; // 80% similarity threshold
    }
    compareNumericOutputs(actual, expected) {
        const actualNum = Number(actual);
        if (isNaN(actualNum))
            return false;
        // Allow 5% tolerance for numeric comparisons
        const tolerance = Math.abs(expected) * 0.05;
        return Math.abs(actualNum - expected) <= tolerance;
    }
    compareObjectOutputs(actual, expected) {
        try {
            // Simple deep comparison - in practice, use a proper deep comparison library
            return JSON.stringify(actual) === JSON.stringify(expected);
        }
        catch {
            return false;
        }
    }
    calculateStringSimilarity(str1, str2) {
        // Simple Levenshtein distance-based similarity
        const maxLength = Math.max(str1.length, str2.length);
        if (maxLength === 0)
            return 1;
        const distance = this.levenshteinDistance(str1, str2);
        return 1 - distance / maxLength;
    }
    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        for (let i = 0; i <= str1.length; i++)
            matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++)
            matrix[j][0] = j;
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
            }
        }
        return matrix[str2.length][str1.length];
    }
    isBinaryClassificationTask(task) {
        return task.type === 'classification' && task.domain === 'financial';
    }
    extractBinaryPrediction(output) {
        if (typeof output === 'boolean')
            return output;
        if (typeof output === 'string') {
            const lower = output.toLowerCase();
            return lower.includes('yes') || lower.includes('true') || lower.includes('positive');
        }
        if (typeof output === 'number')
            return output > 0.5;
        return false;
    }
    async calculateConfidenceCalibration(testCases) {
        // Simplified confidence calibration calculation
        // In practice, this would analyze the relationship between predicted confidence and actual accuracy
        let totalCalibrationError = 0;
        let validCases = 0;
        for (const testCase of testCases) {
            if (testCase.actualOutput && typeof testCase.actualOutput === 'object' && 'confidence' in testCase.actualOutput) {
                const confidence = testCase.actualOutput.confidence;
                const isCorrect = this.evaluateTestCase(testCase);
                const calibrationError = Math.abs(confidence - (isCorrect ? 1 : 0));
                totalCalibrationError += calibrationError;
                validCases++;
            }
        }
        return validCases > 0 ? 1 - (totalCalibrationError / validCases) : 0.5;
    }
    // Helper methods for bias evaluation
    async detectDemographicBias(testCases) {
        // Simplified demographic bias detection
        const groupedResults = {};
        for (const testCase of testCases) {
            const group = testCase.metadata.biasTestingGroup || 'default';
            if (!groupedResults[group]) {
                groupedResults[group] = { correct: 0, total: 0 };
            }
            groupedResults[group].total++;
            if (this.evaluateTestCase(testCase)) {
                groupedResults[group].correct++;
            }
        }
        // Calculate accuracy differences between groups
        const accuracies = Object.entries(groupedResults).map(([group, stats]) => ({
            group,
            accuracy: stats.correct / stats.total
        }));
        if (accuracies.length < 2)
            return null;
        const maxAccuracy = Math.max(...accuracies.map(a => a.accuracy));
        const minAccuracy = Math.min(...accuracies.map(a => a.accuracy));
        const accuracyGap = maxAccuracy - minAccuracy;
        if (accuracyGap > 0.1) { // 10% threshold
            return {
                biasType: 'demographic',
                severity: accuracyGap > 0.2 ? 'critical' : accuracyGap > 0.15 ? 'high' : 'medium',
                description: `Significant accuracy difference (${(accuracyGap * 100).toFixed(1)}%) detected between demographic groups`,
                affectedGroups: accuracies.filter(a => a.accuracy < maxAccuracy - 0.05).map(a => a.group),
                evidence: accuracies,
                confidence: 0.8
            };
        }
        return null;
    }
    async detectConfirmationBias(testCases) {
        // Simplified confirmation bias detection
        // Look for patterns where the model consistently favors certain types of outcomes
        const outcomes = {};
        for (const testCase of testCases) {
            if (testCase.actualOutput) {
                const outcome = this.categorizeOutcome(testCase.actualOutput);
                outcomes[outcome] = (outcomes[outcome] || 0) + 1;
            }
        }
        const totalOutcomes = Object.values(outcomes).reduce((sum, count) => sum + count, 0);
        const expectedFrequency = totalOutcomes / Object.keys(outcomes).length;
        // Check for significant deviations from expected frequency
        for (const [outcome, count] of Object.entries(outcomes)) {
            const deviation = Math.abs(count - expectedFrequency) / expectedFrequency;
            if (deviation > 0.5) { // 50% deviation threshold
                return {
                    biasType: 'confirmation',
                    severity: deviation > 1.0 ? 'high' : 'medium',
                    description: `Model shows confirmation bias towards "${outcome}" outcomes (${((count / totalOutcomes) * 100).toFixed(1)}% vs expected ${((expectedFrequency / totalOutcomes) * 100).toFixed(1)}%)`,
                    affectedGroups: [outcome],
                    evidence: [outcomes],
                    confidence: 0.7
                };
            }
        }
        return null;
    }
    async detectAnchoringBias(testCases) {
        // Simplified anchoring bias detection
        // Look for cases where the model's output is disproportionately influenced by initial information
        let anchoringCases = 0;
        let totalCases = 0;
        for (const testCase of testCases) {
            if (this.hasAnchoringPattern(testCase)) {
                anchoringCases++;
            }
            totalCases++;
        }
        const anchoringRate = anchoringCases / totalCases;
        if (anchoringRate > 0.3) { // 30% threshold
            return {
                biasType: 'anchoring',
                severity: anchoringRate > 0.5 ? 'high' : 'medium',
                description: `Model shows anchoring bias in ${(anchoringRate * 100).toFixed(1)}% of cases`,
                affectedGroups: ['all'],
                evidence: [{ anchoringRate, totalCases }],
                confidence: 0.6
            };
        }
        return null;
    }
    async detectRepresentationBias(testCases) {
        // Simplified representation bias detection
        const domainCounts = {};
        for (const testCase of testCases) {
            const domain = testCase.metadata.domain;
            domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        }
        const totalCases = testCases.length;
        const expectedPerDomain = totalCases / Object.keys(domainCounts).length;
        // Check for significant under-representation
        for (const [domain, count] of Object.entries(domainCounts)) {
            if (count < expectedPerDomain * 0.5) { // Less than 50% of expected
                return {
                    biasType: 'representation',
                    severity: count < expectedPerDomain * 0.25 ? 'high' : 'medium',
                    description: `Domain "${domain}" is under-represented in evaluation data (${count} vs expected ${expectedPerDomain.toFixed(0)})`,
                    affectedGroups: [domain],
                    evidence: [domainCounts],
                    confidence: 0.8
                };
            }
        }
        return null;
    }
    categorizeOutcome(output) {
        if (typeof output === 'string') {
            const lower = output.toLowerCase();
            if (lower.includes('positive') || lower.includes('buy') || lower.includes('bullish'))
                return 'positive';
            if (lower.includes('negative') || lower.includes('sell') || lower.includes('bearish'))
                return 'negative';
            return 'neutral';
        }
        if (typeof output === 'number') {
            if (output > 0.6)
                return 'positive';
            if (output < 0.4)
                return 'negative';
            return 'neutral';
        }
        return 'unknown';
    }
    hasAnchoringPattern(testCase) {
        // Simplified anchoring detection - look for cases where first mentioned value heavily influences output
        if (typeof testCase.input === 'string' && typeof testCase.actualOutput === 'string') {
            const numbers = testCase.input.match(/\d+\.?\d*/g);
            if (numbers && numbers.length > 0) {
                const firstNumber = numbers[0];
                return testCase.actualOutput.includes(firstNumber);
            }
        }
        return false;
    }
    calculateOverallBiasScore(biasResults) {
        if (biasResults.length === 0)
            return 0;
        const severityWeights = { low: 0.25, medium: 0.5, high: 0.75, critical: 1.0 };
        let totalScore = 0;
        let totalWeight = 0;
        for (const result of biasResults) {
            const weight = severityWeights[result.severity];
            totalScore += weight * result.confidence;
            totalWeight += result.confidence;
        }
        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }
    async calculateDemographicParity(testCases) {
        // Simplified demographic parity calculation
        return 0.95; // Placeholder - would implement actual calculation
    }
    async calculateEqualizedOdds(testCases) {
        // Simplified equalized odds calculation
        return 0.92; // Placeholder - would implement actual calculation
    }
    async calculateCalibrationBias(testCases) {
        // Simplified calibration bias calculation
        return 0.08; // Placeholder - would implement actual calculation
    }
    async calculateRepresentationBias(testCases) {
        // Simplified representation bias calculation
        return 0.12; // Placeholder - would implement actual calculation
    }
    generateBiasRemediation(biasResult) {
        const remediationStrategies = {
            demographic: {
                biasType: 'demographic',
                strategy: 'data-augmentation',
                description: 'Augment training data to ensure balanced representation across demographic groups',
                expectedImpact: 0.7,
                implementationComplexity: 'medium',
                estimatedCost: 5000
            },
            confirmation: {
                biasType: 'confirmation',
                strategy: 'prompt-engineering',
                description: 'Modify prompts to encourage consideration of alternative viewpoints',
                expectedImpact: 0.6,
                implementationComplexity: 'low',
                estimatedCost: 1000
            },
            anchoring: {
                biasType: 'anchoring',
                strategy: 'post-processing',
                description: 'Implement post-processing to reduce influence of initial information',
                expectedImpact: 0.5,
                implementationComplexity: 'medium',
                estimatedCost: 3000
            },
            representation: {
                biasType: 'representation',
                strategy: 'data-augmentation',
                description: 'Collect additional data for under-represented domains',
                expectedImpact: 0.8,
                implementationComplexity: 'high',
                estimatedCost: 10000
            }
        };
        return remediationStrategies[biasResult.biasType] || null;
    }
    // Helper methods for explainability evaluation
    async calculateFeatureImportance(testCases, task) {
        // Simplified feature importance calculation
        const features = this.extractFeatures(testCases);
        return features.map(feature => ({
            feature,
            importance: Math.random() * 0.8 + 0.1,
            confidence: Math.random() * 0.3 + 0.7,
            direction: (Math.random() > 0.5 ? 'positive' : 'negative')
        })).sort((a, b) => b.importance - a.importance);
    }
    extractFeatures(testCases) {
        // Extract common features from test cases
        const features = new Set();
        for (const testCase of testCases) {
            if (typeof testCase.input === 'object') {
                Object.keys(testCase.input).forEach(key => features.add(key));
            }
        }
        return Array.from(features);
    }
    async evaluateDecisionPathClarity(testCases) {
        // Simplified decision path clarity evaluation
        return 0.75; // Placeholder - would implement actual evaluation
    }
    async generateCounterfactualExplanations(testCases) {
        // Simplified counterfactual generation
        return testCases.slice(0, 5).map(testCase => ({
            originalInput: testCase.input,
            counterfactualInput: this.generateCounterfactualInput(testCase.input),
            originalOutput: testCase.actualOutput,
            counterfactualOutput: this.generateCounterfactualOutput(testCase.actualOutput),
            changedFeatures: ['feature1', 'feature2'],
            plausibility: Math.random() * 0.3 + 0.7
        }));
    }
    generateCounterfactualInput(originalInput) {
        // Simplified counterfactual input generation
        return { ...originalInput, modified: true };
    }
    generateCounterfactualOutput(originalOutput) {
        // Simplified counterfactual output generation
        if (typeof originalOutput === 'string') {
            return originalOutput.includes('positive') ? 'negative outcome' : 'positive outcome';
        }
        return originalOutput;
    }
    async generateLocalExplanations(testCases) {
        // Simplified local explanation generation
        return testCases.map((testCase, index) => ({
            inputId: testCase.id,
            explanation: `This prediction was based on key factors including market conditions and historical patterns.`,
            confidence: Math.random() * 0.3 + 0.7,
            supportingEvidence: ['market_data', 'historical_trends'],
            keyFactors: ['factor1', 'factor2', 'factor3']
        }));
    }
    async generateGlobalExplanations(modelId, task) {
        // Simplified global explanation generation
        return [{
                modelBehavior: `The ${modelId} model analyzes financial data using pattern recognition and statistical analysis to generate investment recommendations.`,
                keyPatterns: [
                    'Market volatility patterns',
                    'Sector correlation analysis',
                    'Historical performance trends'
                ],
                limitations: [
                    'Limited to historical data patterns',
                    'May not account for unprecedented market events',
                    'Requires high-quality input data'
                ],
                assumptions: [
                    'Market efficiency assumptions',
                    'Historical patterns continue',
                    'Data quality is maintained'
                ],
                dataRequirements: [
                    'Historical price data',
                    'Market indicators',
                    'Company fundamentals'
                ]
            }];
    }
    async evaluateHumanInterpretability(localExplanations, globalExplanations) {
        // Simplified human interpretability evaluation
        const localScore = localExplanations.reduce((sum, exp) => sum + exp.confidence, 0) / localExplanations.length;
        const globalScore = globalExplanations.length > 0 ? 0.8 : 0.4;
        return (localScore + globalScore) / 2;
    }
    calculateExplainabilityScore(metrics) {
        let score = 0;
        let components = 0;
        if (metrics.featureImportance && metrics.featureImportance.length > 0) {
            const avgImportance = metrics.featureImportance.reduce((sum, fi) => sum + fi.importance, 0) / metrics.featureImportance.length;
            score += avgImportance * 0.3;
            components += 0.3;
        }
        if (metrics.decisionPathClarity !== undefined) {
            score += metrics.decisionPathClarity * 0.2;
            components += 0.2;
        }
        if (metrics.localExplanations && metrics.localExplanations.length > 0) {
            const avgConfidence = metrics.localExplanations.reduce((sum, exp) => sum + exp.confidence, 0) / metrics.localExplanations.length;
            score += avgConfidence * 0.3;
            components += 0.3;
        }
        if (metrics.humanInterpretability !== undefined) {
            score += metrics.humanInterpretability * 0.2;
            components += 0.2;
        }
        return components > 0 ? score / components : 0;
    }
    // Helper methods for reliability evaluation
    async evaluateConsistency(testCases) {
        // Simplified consistency evaluation
        return 0.88; // Placeholder - would implement actual evaluation
    }
    async evaluateRobustness(testCases) {
        // Simplified robustness evaluation
        return 0.82; // Placeholder - would implement actual evaluation
    }
    async evaluateStability(testCases) {
        // Simplified stability evaluation
        return 0.85; // Placeholder - would implement actual evaluation
    }
    async quantifyUncertainty(testCases) {
        // Simplified uncertainty quantification
        return {
            epistemicUncertainty: 0.15,
            aleatoricUncertainty: 0.10,
            totalUncertainty: 0.25,
            calibrationError: 0.08
        };
    }
    async evaluateAdversarialRobustness(testCases) {
        // Simplified adversarial robustness evaluation
        return 0.78; // Placeholder - would implement actual evaluation
    }
    // Helper methods for overall evaluation
    async getPerformanceMetrics(modelId, task) {
        // Get performance metrics from existing systems
        return {
            accuracy: 0.88,
            latency: 2500,
            throughput: 25,
            costPerRequest: 0.012,
            errorRate: 0.03,
            customMetrics: {}
        };
    }
    calculateOverallScore(metrics) {
        const weights = {
            accuracy: 0.3,
            performance: 0.2,
            bias: 0.2,
            explainability: 0.2,
            reliability: 0.1
        };
        let score = 0;
        score += metrics.accuracy.overallAccuracy * weights.accuracy;
        score += (1 - metrics.performance.errorRate) * weights.performance;
        score += (1 - metrics.bias.overallBiasScore) * weights.bias;
        score += metrics.explainability.overallExplainabilityScore * weights.explainability;
        score += metrics.reliability.consistency * weights.reliability;
        return Math.max(0, Math.min(1, score));
    }
    determinePassFail(metrics) {
        const checks = [
            metrics.accuracy.overallAccuracy >= this.config.accuracyThresholds.minimum,
            metrics.bias.overallBiasScore <= this.config.biasThresholds.acceptable,
            metrics.explainability.overallExplainabilityScore >= this.config.explainabilityRequirements.minimumScore,
            metrics.performance.errorRate <= 0.1,
            metrics.reliability.consistency >= 0.7
        ];
        return checks.every(check => check);
    }
    identifyIssues(metrics) {
        const issues = [];
        // Accuracy issues
        if (metrics.accuracy.overallAccuracy < this.config.accuracyThresholds.minimum) {
            issues.push({
                category: 'accuracy',
                severity: metrics.accuracy.overallAccuracy < 0.7 ? 'critical' : 'high',
                description: `Overall accuracy (${(metrics.accuracy.overallAccuracy * 100).toFixed(1)}%) below minimum threshold (${(this.config.accuracyThresholds.minimum * 100).toFixed(1)}%)`,
                impact: 'Reduced reliability of model predictions',
                remediation: 'Improve training data quality, adjust model parameters, or consider model retraining'
            });
        }
        // Bias issues
        if (metrics.bias.overallBiasScore > this.config.biasThresholds.acceptable) {
            const severity = metrics.bias.overallBiasScore > this.config.biasThresholds.critical ? 'critical' :
                metrics.bias.overallBiasScore > this.config.biasThresholds.concerning ? 'high' : 'medium';
            issues.push({
                category: 'bias',
                severity,
                description: `Bias score (${(metrics.bias.overallBiasScore * 100).toFixed(1)}%) exceeds acceptable threshold`,
                impact: 'Potential unfair treatment of certain groups or scenarios',
                remediation: 'Implement bias mitigation strategies, improve data representation, or adjust model training'
            });
        }
        // Explainability issues
        if (metrics.explainability.overallExplainabilityScore < this.config.explainabilityRequirements.minimumScore) {
            issues.push({
                category: 'explainability',
                severity: metrics.explainability.overallExplainabilityScore < 0.5 ? 'high' : 'medium',
                description: `Explainability score (${(metrics.explainability.overallExplainabilityScore * 100).toFixed(1)}%) below minimum requirement`,
                impact: 'Reduced trust and transparency in model decisions',
                remediation: 'Enhance explanation generation, improve feature importance analysis, or add interpretability tools'
            });
        }
        // Reliability issues
        if (metrics.reliability.consistency < 0.7) {
            issues.push({
                category: 'reliability',
                severity: metrics.reliability.consistency < 0.5 ? 'critical' : 'high',
                description: `Model consistency (${(metrics.reliability.consistency * 100).toFixed(1)}%) below acceptable threshold`,
                impact: 'Unpredictable model behavior and reduced user confidence',
                remediation: 'Improve model stability, enhance error handling, or implement consistency checks'
            });
        }
        return issues;
    }
    generateRecommendations(metrics, issues) {
        const recommendations = [];
        // General improvement recommendations
        if (metrics.accuracy.overallAccuracy < this.config.accuracyThresholds.target) {
            recommendations.push({
                category: 'accuracy',
                priority: 'high',
                description: 'Improve model accuracy through enhanced training data and parameter tuning',
                expectedBenefit: 'Increased prediction reliability and user confidence',
                implementationEffort: 'medium'
            });
        }
        if (metrics.bias.overallBiasScore > 0.05) {
            recommendations.push({
                category: 'bias',
                priority: 'high',
                description: 'Implement comprehensive bias mitigation strategies',
                expectedBenefit: 'Fairer and more equitable model predictions',
                implementationEffort: 'high'
            });
        }
        if (metrics.explainability.overallExplainabilityScore < 0.9) {
            recommendations.push({
                category: 'explainability',
                priority: 'medium',
                description: 'Enhance model explainability features and documentation',
                expectedBenefit: 'Improved user trust and regulatory compliance',
                implementationEffort: 'medium'
            });
        }
        // Performance optimization recommendations
        if (metrics.performance.latency > 3000) {
            recommendations.push({
                category: 'performance',
                priority: 'medium',
                description: 'Optimize model inference speed and resource usage',
                expectedBenefit: 'Better user experience and reduced operational costs',
                implementationEffort: 'medium'
            });
        }
        return recommendations;
    }
    generateEvaluationId() {
        return `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get evaluation history for a specific model
     */
    getEvaluationHistory(modelId) {
        return this.evaluationHistory.filter(result => result.modelId === modelId);
    }
    /**
     * Get the latest evaluation result for a model
     */
    getLatestEvaluation(modelId) {
        const history = this.getEvaluationHistory(modelId);
        return history.length > 0 ? history[history.length - 1] : null;
    }
    /**
     * Compare evaluation results between models
     */
    compareModels(modelIds) {
        const comparison = {};
        for (const modelId of modelIds) {
            comparison[modelId] = this.getLatestEvaluation(modelId);
        }
        return comparison;
    }
}
exports.ModelEvaluationFramework = ModelEvaluationFramework;
/**
 * Factory function to create a model evaluation framework instance
 */
function createModelEvaluationFramework(config) {
    return new ModelEvaluationFramework(config);
}
exports.createModelEvaluationFramework = createModelEvaluationFramework;
/**
 * Singleton instance for global use
 */
let globalEvaluationFramework = null;
function getModelEvaluationFramework() {
    if (!globalEvaluationFramework) {
        globalEvaluationFramework = createModelEvaluationFramework();
    }
    return globalEvaluationFramework;
}
exports.getModelEvaluationFramework = getModelEvaluationFramework;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWwtZXZhbHVhdGlvbi1mcmFtZXdvcmsuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvYWkvbW9kZWwtZXZhbHVhdGlvbi1mcmFtZXdvcmsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7O0dBT0c7OztBQW1MSCxNQUFhLHdCQUF3QjtJQUlqQyxZQUFZLE1BQWtDO1FBRnRDLHNCQUFpQixHQUF1QixFQUFFLENBQUM7UUFHL0MsSUFBSSxDQUFDLE1BQU0sR0FBRztZQUNWLGtCQUFrQixFQUFFO2dCQUNoQixPQUFPLEVBQUUsSUFBSTtnQkFDYixNQUFNLEVBQUUsSUFBSTtnQkFDWixTQUFTLEVBQUUsSUFBSTthQUNsQjtZQUNELGNBQWMsRUFBRTtnQkFDWixVQUFVLEVBQUUsSUFBSTtnQkFDaEIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLFFBQVEsRUFBRSxJQUFJO2FBQ2pCO1lBQ0QsMEJBQTBCLEVBQUU7Z0JBQ3hCLFlBQVksRUFBRSxJQUFJO2dCQUNsQix3QkFBd0IsRUFBRSxJQUFJO2dCQUM5Qix5QkFBeUIsRUFBRSxJQUFJO2dCQUMvQixzQkFBc0IsRUFBRSxLQUFLO2FBQ2hDO1lBQ0Qsa0JBQWtCLEVBQUU7Z0JBQ2hCLFlBQVksRUFBRSxJQUFJO2dCQUNsQixrQkFBa0IsRUFBRSxHQUFHO2dCQUN2QixtQkFBbUIsRUFBRSxHQUFHO2FBQzNCO1lBQ0QsR0FBRyxNQUFNO1NBQ1osQ0FBQztJQUNOLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxhQUFhLENBQ2YsT0FBZSxFQUNmLFNBQXFCLEVBQ3JCLElBQVUsRUFDVixPQUFxQjtRQUVyQixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUNqRCxPQUFPLENBQUMsR0FBRyxDQUFDLCtDQUErQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBRXRFLGlCQUFpQjtRQUNqQixJQUFJLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ3RDLE1BQU0sSUFBSSxLQUFLLENBQUMsOENBQThDLENBQUMsQ0FBQztTQUNuRTtRQUVELElBQUk7WUFDQSxnQ0FBZ0M7WUFDaEMsTUFBTSxDQUFDLGVBQWUsRUFBRSxXQUFXLEVBQUUscUJBQXFCLEVBQUUsa0JBQWtCLENBQUMsR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7Z0JBQ2hHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQztnQkFDL0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQztnQkFDM0MsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDO2dCQUNyRCxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUM7YUFDckQsQ0FBQyxDQUFDO1lBRUgsZ0RBQWdEO1lBQ2hELE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxJQUFJLENBQUMscUJBQXFCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRTNFLE1BQU0sT0FBTyxHQUFzQjtnQkFDL0IsUUFBUSxFQUFFLGVBQWU7Z0JBQ3pCLFdBQVcsRUFBRSxrQkFBa0I7Z0JBQy9CLElBQUksRUFBRSxXQUFXO2dCQUNqQixjQUFjLEVBQUUscUJBQXFCO2dCQUNyQyxXQUFXLEVBQUUsa0JBQWtCO2FBQ2xDLENBQUM7WUFFRixrREFBa0Q7WUFDbEQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUUvQywrQ0FBK0M7WUFDL0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM1QyxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRXRFLE1BQU0sTUFBTSxHQUFxQjtnQkFDN0IsT0FBTztnQkFDUCxZQUFZO2dCQUNaLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtnQkFDckIsT0FBTztnQkFDUCxZQUFZO2dCQUNaLE1BQU07Z0JBQ04sTUFBTTtnQkFDTixlQUFlO2FBQ2xCLENBQUM7WUFFRiwwQkFBMEI7WUFDMUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNwQyxPQUFPLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxPQUFPLG9CQUFvQixZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxhQUFhLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFFdkgsT0FBTyxNQUFNLENBQUM7U0FDakI7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNaLE9BQU8sQ0FBQyxLQUFLLENBQUMsMEJBQTBCLE9BQU8sR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzNELE1BQU0sS0FBSyxDQUFDO1NBQ2Y7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsZ0JBQWdCLENBQUMsT0FBZSxFQUFFLFNBQXFCLEVBQUUsSUFBVTtRQUNyRSxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBRXhELElBQUksa0JBQWtCLEdBQUcsQ0FBQyxDQUFDO1FBQzNCLElBQUksZ0JBQWdCLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztRQUN4QyxNQUFNLGNBQWMsR0FBdUQsRUFBRSxDQUFDO1FBQzlFLE1BQU0sWUFBWSxHQUF1RCxFQUFFLENBQUM7UUFFNUUsOEJBQThCO1FBQzlCLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztRQUN0QixJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUM7UUFDdkIsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQztRQUV2Qix5QkFBeUI7UUFDekIsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUU7WUFDOUIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRWxELElBQUksU0FBUyxFQUFFO2dCQUNYLGtCQUFrQixFQUFFLENBQUM7YUFDeEI7WUFFRCxrQ0FBa0M7WUFDbEMsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7WUFDeEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDekIsY0FBYyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUM7YUFDckQ7WUFDRCxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDL0IsSUFBSSxTQUFTLEVBQUU7Z0JBQ1gsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ3BDO1lBRUQsZ0NBQWdDO1lBQ2hDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDM0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDekIsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUM7YUFDckQ7WUFDRCxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDL0IsSUFBSSxTQUFTLEVBQUU7Z0JBQ1gsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ3BDO1lBRUQsNkRBQTZEO1lBQzdELElBQUksSUFBSSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN2QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUN0RSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUVyRSxJQUFJLFNBQVMsSUFBSSxNQUFNO29CQUFFLGFBQWEsRUFBRSxDQUFDO3FCQUNwQyxJQUFJLFNBQVMsSUFBSSxDQUFDLE1BQU07b0JBQUUsY0FBYyxFQUFFLENBQUM7cUJBQzNDLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxNQUFNO29CQUFFLGFBQWEsRUFBRSxDQUFDO3FCQUMzQyxJQUFJLENBQUMsU0FBUyxJQUFJLE1BQU07b0JBQUUsY0FBYyxFQUFFLENBQUM7YUFDbkQ7U0FDSjtRQUVELE1BQU0sZUFBZSxHQUFHLGtCQUFrQixHQUFHLGdCQUFnQixDQUFDO1FBRTlELDRDQUE0QztRQUM1QyxNQUFNLFNBQVMsR0FBRyxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsYUFBYSxHQUFHLGNBQWMsQ0FBQyxDQUFDO1FBQzlFLE1BQU0sTUFBTSxHQUFHLGFBQWEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxhQUFhLEdBQUcsY0FBYyxDQUFDLENBQUM7UUFDM0UsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLFNBQVMsR0FBRyxNQUFNLENBQUMsQ0FBQztRQUUvRSxnREFBZ0Q7UUFDaEQsTUFBTSxzQkFBc0IsR0FBMkIsRUFBRSxDQUFDO1FBQzFELEtBQUssTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFFO1lBQzFELHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztTQUNoRTtRQUVELE1BQU0sb0JBQW9CLEdBQTJCLEVBQUUsQ0FBQztRQUN4RCxLQUFLLE1BQU0sQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRTtZQUMxRCxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7U0FDaEU7UUFFRCxtQ0FBbUM7UUFDbkMsTUFBTSxxQkFBcUIsR0FBRyxNQUFNLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUVuRixNQUFNLGVBQWUsR0FBb0I7WUFDckMsYUFBYTtZQUNiLGNBQWM7WUFDZCxhQUFhO1lBQ2IsY0FBYztTQUNqQixDQUFDO1FBRUYsT0FBTztZQUNILGVBQWU7WUFDZixTQUFTO1lBQ1QsTUFBTTtZQUNOLE9BQU87WUFDUCxlQUFlO1lBQ2Ysc0JBQXNCO1lBQ3RCLG9CQUFvQjtZQUNwQixxQkFBcUI7U0FDeEIsQ0FBQztJQUNOLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBZSxFQUFFLFNBQXFCLEVBQUUsSUFBVTtRQUNqRSxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBRXBELE1BQU0sb0JBQW9CLEdBQTBCLEVBQUUsQ0FBQztRQUN2RCxNQUFNLHlCQUF5QixHQUFzQixFQUFFLENBQUM7UUFFeEQsNkJBQTZCO1FBQzdCLE1BQU0sZUFBZSxHQUFHLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BFLElBQUksZUFBZSxFQUFFO1lBQ2pCLG9CQUFvQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztTQUM5QztRQUVELDhCQUE4QjtRQUM5QixNQUFNLGdCQUFnQixHQUFHLE1BQU0sSUFBSSxDQUFDLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RFLElBQUksZ0JBQWdCLEVBQUU7WUFDbEIsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7U0FDL0M7UUFFRCwyQkFBMkI7UUFDM0IsTUFBTSxhQUFhLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDaEUsSUFBSSxhQUFhLEVBQUU7WUFDZixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7U0FDNUM7UUFFRCxnQ0FBZ0M7UUFDaEMsTUFBTSxrQkFBa0IsR0FBRyxNQUFNLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMxRSxJQUFJLGtCQUFrQixFQUFFO1lBQ3BCLG9CQUFvQixDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1NBQ2pEO1FBRUQseUJBQXlCO1FBQ3pCLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDOUUsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMzRSxNQUFNLGFBQWEsR0FBRyxNQUFNLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuRSxNQUFNLGVBQWUsR0FBRyxNQUFNLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN2RSxNQUFNLHVCQUF1QixHQUFHLE1BQU0sSUFBSSxDQUFDLDJCQUEyQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRWxGLHNDQUFzQztRQUN0QyxLQUFLLE1BQU0sVUFBVSxJQUFJLG9CQUFvQixFQUFFO1lBQzNDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM3RCxJQUFJLFdBQVcsRUFBRTtnQkFDYix5QkFBeUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDL0M7U0FDSjtRQUVELE9BQU87WUFDSCxnQkFBZ0I7WUFDaEIsaUJBQWlCO1lBQ2pCLGFBQWE7WUFDYixlQUFlO1lBQ2Ysa0JBQWtCLEVBQUUsdUJBQXVCO1lBQzNDLG9CQUFvQjtZQUNwQix5QkFBeUI7U0FDNUIsQ0FBQztJQUNOLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxPQUFlLEVBQUUsU0FBcUIsRUFBRSxJQUFVO1FBQzNFLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUNBQXVDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFFOUQsOEJBQThCO1FBQzlCLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRWpGLHdCQUF3QjtRQUN4QixNQUFNLG1CQUFtQixHQUFHLE1BQU0sSUFBSSxDQUFDLDJCQUEyQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRTlFLHVDQUF1QztRQUN2QyxNQUFNLDBCQUEwQixHQUFHLE1BQU0sSUFBSSxDQUFDLGtDQUFrQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFekcsOEJBQThCO1FBQzlCLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxJQUFJLENBQUMseUJBQXlCLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUV2RiwrQkFBK0I7UUFDL0IsTUFBTSxrQkFBa0IsR0FBRyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFaEYsa0NBQWtDO1FBQ2xDLE1BQU0scUJBQXFCLEdBQUcsTUFBTSxJQUFJLENBQUMsNkJBQTZCLENBQUMsaUJBQWlCLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUU5Ryx5Q0FBeUM7UUFDekMsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUM7WUFDakUsaUJBQWlCO1lBQ2pCLG1CQUFtQjtZQUNuQiwwQkFBMEI7WUFDMUIsaUJBQWlCO1lBQ2pCLGtCQUFrQjtZQUNsQixxQkFBcUI7U0FDeEIsQ0FBQyxDQUFDO1FBRUgsT0FBTztZQUNILDBCQUEwQjtZQUMxQixpQkFBaUI7WUFDakIsbUJBQW1CO1lBQ25CLDBCQUEwQjtZQUMxQixpQkFBaUI7WUFDakIsa0JBQWtCO1lBQ2xCLHFCQUFxQjtTQUN4QixDQUFDO0lBQ04sQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLG1CQUFtQixDQUFDLE9BQWUsRUFBRSxTQUFxQixFQUFFLElBQVU7UUFDeEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUUzRCx5QkFBeUI7UUFDekIsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFOUQsd0JBQXdCO1FBQ3hCLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRTVELHVCQUF1QjtRQUN2QixNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUUxRCw2QkFBNkI7UUFDN0IsTUFBTSx5QkFBeUIsR0FBRyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUU1RSx5QkFBeUI7UUFDekIsTUFBTSxxQkFBcUIsR0FBRyxNQUFNLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUVsRixPQUFPO1lBQ0gsV0FBVztZQUNYLFVBQVU7WUFDVixTQUFTO1lBQ1QseUJBQXlCO1lBQ3pCLHFCQUFxQjtTQUN4QixDQUFDO0lBQ04sQ0FBQztJQUVELHlDQUF5QztJQUNqQyxnQkFBZ0IsQ0FBQyxRQUFrQjtRQUN2QyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUU7WUFDcEQsT0FBTyxLQUFLLENBQUM7U0FDaEI7UUFFRCxvRUFBb0U7UUFDcEUsSUFBSSxPQUFPLFFBQVEsQ0FBQyxjQUFjLEtBQUssUUFBUSxFQUFFO1lBQzdDLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1NBQ3BGO2FBQU0sSUFBSSxPQUFPLFFBQVEsQ0FBQyxjQUFjLEtBQUssUUFBUSxFQUFFO1lBQ3BELE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1NBQ3JGO2FBQU0sSUFBSSxPQUFPLFFBQVEsQ0FBQyxjQUFjLEtBQUssUUFBUSxFQUFFO1lBQ3BELE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1NBQ3BGO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVPLG9CQUFvQixDQUFDLE1BQVcsRUFBRSxRQUFnQjtRQUN0RCxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEQsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO1FBRWxELDJDQUEyQztRQUMzQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzFFLE9BQU8sVUFBVSxHQUFHLEdBQUcsQ0FBQyxDQUFDLDJCQUEyQjtJQUN4RCxDQUFDO0lBRU8scUJBQXFCLENBQUMsTUFBVyxFQUFFLFFBQWdCO1FBQ3ZELE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqQyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUM7WUFBRSxPQUFPLEtBQUssQ0FBQztRQUVuQyw2Q0FBNkM7UUFDN0MsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDNUMsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsSUFBSSxTQUFTLENBQUM7SUFDdkQsQ0FBQztJQUVPLG9CQUFvQixDQUFDLE1BQVcsRUFBRSxRQUFnQjtRQUN0RCxJQUFJO1lBQ0EsNkVBQTZFO1lBQzdFLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQzlEO1FBQUMsTUFBTTtZQUNKLE9BQU8sS0FBSyxDQUFDO1NBQ2hCO0lBQ0wsQ0FBQztJQUVPLHlCQUF5QixDQUFDLElBQVksRUFBRSxJQUFZO1FBQ3hELCtDQUErQztRQUMvQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JELElBQUksU0FBUyxLQUFLLENBQUM7WUFBRSxPQUFPLENBQUMsQ0FBQztRQUU5QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3RELE9BQU8sQ0FBQyxHQUFHLFFBQVEsR0FBRyxTQUFTLENBQUM7SUFDcEMsQ0FBQztJQUVPLG1CQUFtQixDQUFDLElBQVksRUFBRSxJQUFZO1FBQ2xELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFOUYsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFO1lBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN4RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUU7WUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXhELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ25DLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNuQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FDbkIsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQ3BCLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUNwQixNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQ25DLENBQUM7YUFDTDtTQUNKO1FBRUQsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRU8sMEJBQTBCLENBQUMsSUFBVTtRQUN6QyxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssZ0JBQWdCLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxXQUFXLENBQUM7SUFDekUsQ0FBQztJQUVPLHVCQUF1QixDQUFDLE1BQVc7UUFDdkMsSUFBSSxPQUFPLE1BQU0sS0FBSyxTQUFTO1lBQUUsT0FBTyxNQUFNLENBQUM7UUFDL0MsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUU7WUFDNUIsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ25DLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDeEY7UUFDRCxJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVE7WUFBRSxPQUFPLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDcEQsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVPLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxTQUFxQjtRQUM5RCxnREFBZ0Q7UUFDaEQsb0dBQW9HO1FBQ3BHLElBQUkscUJBQXFCLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztRQUVuQixLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRTtZQUM5QixJQUFJLFFBQVEsQ0FBQyxZQUFZLElBQUksT0FBTyxRQUFRLENBQUMsWUFBWSxLQUFLLFFBQVEsSUFBSSxZQUFZLElBQUksUUFBUSxDQUFDLFlBQVksRUFBRTtnQkFDN0csTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUM7Z0JBQ3BELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbEQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwRSxxQkFBcUIsSUFBSSxnQkFBZ0IsQ0FBQztnQkFDMUMsVUFBVSxFQUFFLENBQUM7YUFDaEI7U0FDSjtRQUVELE9BQU8sVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztJQUMzRSxDQUFDO0lBRUQscUNBQXFDO0lBQzdCLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxTQUFxQjtRQUNyRCx3Q0FBd0M7UUFDeEMsTUFBTSxjQUFjLEdBQXVELEVBQUUsQ0FBQztRQUU5RSxLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRTtZQUM5QixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLGdCQUFnQixJQUFJLFNBQVMsQ0FBQztZQUM5RCxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUN4QixjQUFjLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQzthQUNwRDtZQUVELGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM5QixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDakMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ25DO1NBQ0o7UUFFRCxnREFBZ0Q7UUFDaEQsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN2RSxLQUFLO1lBQ0wsUUFBUSxFQUFFLEtBQUssQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLEtBQUs7U0FDeEMsQ0FBQyxDQUFDLENBQUM7UUFFSixJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQztZQUFFLE9BQU8sSUFBSSxDQUFDO1FBRXZDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDakUsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNqRSxNQUFNLFdBQVcsR0FBRyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBRTlDLElBQUksV0FBVyxHQUFHLEdBQUcsRUFBRSxFQUFFLGdCQUFnQjtZQUNyQyxPQUFPO2dCQUNILFFBQVEsRUFBRSxhQUFhO2dCQUN2QixRQUFRLEVBQUUsV0FBVyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVE7Z0JBQ2pGLFdBQVcsRUFBRSxvQ0FBb0MsQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyx3Q0FBd0M7Z0JBQ3ZILGNBQWMsRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBRyxXQUFXLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDekYsUUFBUSxFQUFFLFVBQVU7Z0JBQ3BCLFVBQVUsRUFBRSxHQUFHO2FBQ2xCLENBQUM7U0FDTDtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFTyxLQUFLLENBQUMsc0JBQXNCLENBQUMsU0FBcUI7UUFDdEQseUNBQXlDO1FBQ3pDLGtGQUFrRjtRQUNsRixNQUFNLFFBQVEsR0FBMkIsRUFBRSxDQUFDO1FBRTVDLEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFO1lBQzlCLElBQUksUUFBUSxDQUFDLFlBQVksRUFBRTtnQkFDdkIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDOUQsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNwRDtTQUNKO1FBRUQsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3JGLE1BQU0saUJBQWlCLEdBQUcsYUFBYSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDO1FBRXZFLDJEQUEyRDtRQUMzRCxLQUFLLE1BQU0sQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNyRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxHQUFHLGlCQUFpQixDQUFDO1lBQzFFLElBQUksU0FBUyxHQUFHLEdBQUcsRUFBRSxFQUFFLDBCQUEwQjtnQkFDN0MsT0FBTztvQkFDSCxRQUFRLEVBQUUsY0FBYztvQkFDeEIsUUFBUSxFQUFFLFNBQVMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUTtvQkFDN0MsV0FBVyxFQUFFLDBDQUEwQyxPQUFPLGVBQWUsQ0FBQyxDQUFDLEtBQUssR0FBRyxhQUFhLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsaUJBQWlCLEdBQUcsYUFBYSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJO29CQUNsTSxjQUFjLEVBQUUsQ0FBQyxPQUFPLENBQUM7b0JBQ3pCLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQztvQkFDcEIsVUFBVSxFQUFFLEdBQUc7aUJBQ2xCLENBQUM7YUFDTDtTQUNKO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVPLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxTQUFxQjtRQUNuRCxzQ0FBc0M7UUFDdEMsa0dBQWtHO1FBQ2xHLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQztRQUN2QixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFFbkIsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUU7WUFDOUIsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ3BDLGNBQWMsRUFBRSxDQUFDO2FBQ3BCO1lBQ0QsVUFBVSxFQUFFLENBQUM7U0FDaEI7UUFFRCxNQUFNLGFBQWEsR0FBRyxjQUFjLEdBQUcsVUFBVSxDQUFDO1FBRWxELElBQUksYUFBYSxHQUFHLEdBQUcsRUFBRSxFQUFFLGdCQUFnQjtZQUN2QyxPQUFPO2dCQUNILFFBQVEsRUFBRSxXQUFXO2dCQUNyQixRQUFRLEVBQUUsYUFBYSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRO2dCQUNqRCxXQUFXLEVBQUUsaUNBQWlDLENBQUMsYUFBYSxHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsWUFBWTtnQkFDMUYsY0FBYyxFQUFFLENBQUMsS0FBSyxDQUFDO2dCQUN2QixRQUFRLEVBQUUsQ0FBQyxFQUFFLGFBQWEsRUFBRSxVQUFVLEVBQUUsQ0FBQztnQkFDekMsVUFBVSxFQUFFLEdBQUc7YUFDbEIsQ0FBQztTQUNMO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVPLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxTQUFxQjtRQUN4RCwyQ0FBMkM7UUFDM0MsTUFBTSxZQUFZLEdBQTJCLEVBQUUsQ0FBQztRQUVoRCxLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRTtZQUM5QixNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUN4QyxZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzFEO1FBRUQsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztRQUNwQyxNQUFNLGlCQUFpQixHQUFHLFVBQVUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUV4RSw2Q0FBNkM7UUFDN0MsS0FBSyxNQUFNLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDeEQsSUFBSSxLQUFLLEdBQUcsaUJBQWlCLEdBQUcsR0FBRyxFQUFFLEVBQUUsNEJBQTRCO2dCQUMvRCxPQUFPO29CQUNILFFBQVEsRUFBRSxnQkFBZ0I7b0JBQzFCLFFBQVEsRUFBRSxLQUFLLEdBQUcsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVE7b0JBQzlELFdBQVcsRUFBRSxXQUFXLE1BQU0sOENBQThDLEtBQUssZ0JBQWdCLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRztvQkFDaEksY0FBYyxFQUFFLENBQUMsTUFBTSxDQUFDO29CQUN4QixRQUFRLEVBQUUsQ0FBQyxZQUFZLENBQUM7b0JBQ3hCLFVBQVUsRUFBRSxHQUFHO2lCQUNsQixDQUFDO2FBQ0w7U0FDSjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFTyxpQkFBaUIsQ0FBQyxNQUFXO1FBQ2pDLElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFO1lBQzVCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNuQyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQztnQkFBRSxPQUFPLFVBQVUsQ0FBQztZQUN4RyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQztnQkFBRSxPQUFPLFVBQVUsQ0FBQztZQUN6RyxPQUFPLFNBQVMsQ0FBQztTQUNwQjtRQUNELElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFO1lBQzVCLElBQUksTUFBTSxHQUFHLEdBQUc7Z0JBQUUsT0FBTyxVQUFVLENBQUM7WUFDcEMsSUFBSSxNQUFNLEdBQUcsR0FBRztnQkFBRSxPQUFPLFVBQVUsQ0FBQztZQUNwQyxPQUFPLFNBQVMsQ0FBQztTQUNwQjtRQUNELE9BQU8sU0FBUyxDQUFDO0lBQ3JCLENBQUM7SUFFTyxtQkFBbUIsQ0FBQyxRQUFrQjtRQUMxQyx3R0FBd0c7UUFDeEcsSUFBSSxPQUFPLFFBQVEsQ0FBQyxLQUFLLEtBQUssUUFBUSxJQUFJLE9BQU8sUUFBUSxDQUFDLFlBQVksS0FBSyxRQUFRLEVBQUU7WUFDakYsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDbkQsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQy9CLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDL0IsT0FBTyxRQUFRLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQzthQUN0RDtTQUNKO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVPLHlCQUF5QixDQUFDLFdBQWtDO1FBQ2hFLElBQUksV0FBVyxDQUFDLE1BQU0sS0FBSyxDQUFDO1lBQUUsT0FBTyxDQUFDLENBQUM7UUFFdkMsTUFBTSxlQUFlLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDOUUsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztRQUVwQixLQUFLLE1BQU0sTUFBTSxJQUFJLFdBQVcsRUFBRTtZQUM5QixNQUFNLE1BQU0sR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2hELFVBQVUsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQztZQUN6QyxXQUFXLElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQztTQUNwQztRQUVELE9BQU8sV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFFTyxLQUFLLENBQUMsMEJBQTBCLENBQUMsU0FBcUI7UUFDMUQsNENBQTRDO1FBQzVDLE9BQU8sSUFBSSxDQUFDLENBQUMsbURBQW1EO0lBQ3BFLENBQUM7SUFFTyxLQUFLLENBQUMsc0JBQXNCLENBQUMsU0FBcUI7UUFDdEQsd0NBQXdDO1FBQ3hDLE9BQU8sSUFBSSxDQUFDLENBQUMsbURBQW1EO0lBQ3BFLENBQUM7SUFFTyxLQUFLLENBQUMsd0JBQXdCLENBQUMsU0FBcUI7UUFDeEQsMENBQTBDO1FBQzFDLE9BQU8sSUFBSSxDQUFDLENBQUMsbURBQW1EO0lBQ3BFLENBQUM7SUFFTyxLQUFLLENBQUMsMkJBQTJCLENBQUMsU0FBcUI7UUFDM0QsNkNBQTZDO1FBQzdDLE9BQU8sSUFBSSxDQUFDLENBQUMsbURBQW1EO0lBQ3BFLENBQUM7SUFFTyx1QkFBdUIsQ0FBQyxVQUErQjtRQUMzRCxNQUFNLHFCQUFxQixHQUFvQztZQUMzRCxXQUFXLEVBQUU7Z0JBQ1QsUUFBUSxFQUFFLGFBQWE7Z0JBQ3ZCLFFBQVEsRUFBRSxtQkFBbUI7Z0JBQzdCLFdBQVcsRUFBRSxtRkFBbUY7Z0JBQ2hHLGNBQWMsRUFBRSxHQUFHO2dCQUNuQix3QkFBd0IsRUFBRSxRQUFRO2dCQUNsQyxhQUFhLEVBQUUsSUFBSTthQUN0QjtZQUNELFlBQVksRUFBRTtnQkFDVixRQUFRLEVBQUUsY0FBYztnQkFDeEIsUUFBUSxFQUFFLG9CQUFvQjtnQkFDOUIsV0FBVyxFQUFFLHFFQUFxRTtnQkFDbEYsY0FBYyxFQUFFLEdBQUc7Z0JBQ25CLHdCQUF3QixFQUFFLEtBQUs7Z0JBQy9CLGFBQWEsRUFBRSxJQUFJO2FBQ3RCO1lBQ0QsU0FBUyxFQUFFO2dCQUNQLFFBQVEsRUFBRSxXQUFXO2dCQUNyQixRQUFRLEVBQUUsaUJBQWlCO2dCQUMzQixXQUFXLEVBQUUsc0VBQXNFO2dCQUNuRixjQUFjLEVBQUUsR0FBRztnQkFDbkIsd0JBQXdCLEVBQUUsUUFBUTtnQkFDbEMsYUFBYSxFQUFFLElBQUk7YUFDdEI7WUFDRCxjQUFjLEVBQUU7Z0JBQ1osUUFBUSxFQUFFLGdCQUFnQjtnQkFDMUIsUUFBUSxFQUFFLG1CQUFtQjtnQkFDN0IsV0FBVyxFQUFFLHVEQUF1RDtnQkFDcEUsY0FBYyxFQUFFLEdBQUc7Z0JBQ25CLHdCQUF3QixFQUFFLE1BQU07Z0JBQ2hDLGFBQWEsRUFBRSxLQUFLO2FBQ3ZCO1NBQ0osQ0FBQztRQUVGLE9BQU8scUJBQXFCLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQztJQUM5RCxDQUFDO0lBRUQsK0NBQStDO0lBQ3ZDLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxTQUFxQixFQUFFLElBQVU7UUFDdEUsNENBQTRDO1FBQzVDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFakQsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM1QixPQUFPO1lBQ1AsVUFBVSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLEdBQUcsR0FBRztZQUNyQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsR0FBRyxHQUFHO1lBQ3JDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUF3QztTQUNwRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRU8sZUFBZSxDQUFDLFNBQXFCO1FBQ3pDLDBDQUEwQztRQUMxQyxNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1FBRW5DLEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFO1lBQzlCLElBQUksT0FBTyxRQUFRLENBQUMsS0FBSyxLQUFLLFFBQVEsRUFBRTtnQkFDcEMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQ2pFO1NBQ0o7UUFFRCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVPLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxTQUFxQjtRQUMzRCw4Q0FBOEM7UUFDOUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxrREFBa0Q7SUFDbkUsQ0FBQztJQUVPLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxTQUFxQjtRQUNsRSx1Q0FBdUM7UUFDdkMsT0FBTyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFDLGFBQWEsRUFBRSxRQUFRLENBQUMsS0FBSztZQUM3QixtQkFBbUIsRUFBRSxJQUFJLENBQUMsMkJBQTJCLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztZQUNyRSxjQUFjLEVBQUUsUUFBUSxDQUFDLFlBQVk7WUFDckMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLDRCQUE0QixDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUM7WUFDOUUsZUFBZSxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztZQUN6QyxZQUFZLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsR0FBRyxHQUFHO1NBQzFDLENBQUMsQ0FBQyxDQUFDO0lBQ1IsQ0FBQztJQUVPLDJCQUEyQixDQUFDLGFBQWtCO1FBQ2xELDZDQUE2QztRQUM3QyxPQUFPLEVBQUUsR0FBRyxhQUFhLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO0lBQ2hELENBQUM7SUFFTyw0QkFBNEIsQ0FBQyxjQUFtQjtRQUNwRCw4Q0FBOEM7UUFDOUMsSUFBSSxPQUFPLGNBQWMsS0FBSyxRQUFRLEVBQUU7WUFDcEMsT0FBTyxjQUFjLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUM7U0FDeEY7UUFDRCxPQUFPLGNBQWMsQ0FBQztJQUMxQixDQUFDO0lBRU8sS0FBSyxDQUFDLHlCQUF5QixDQUFDLFNBQXFCO1FBQ3pELDBDQUEwQztRQUMxQyxPQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZDLE9BQU8sRUFBRSxRQUFRLENBQUMsRUFBRTtZQUNwQixXQUFXLEVBQUUsK0ZBQStGO1lBQzVHLFVBQVUsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsR0FBRyxHQUFHLEdBQUc7WUFDckMsa0JBQWtCLEVBQUUsQ0FBQyxhQUFhLEVBQUUsbUJBQW1CLENBQUM7WUFDeEQsVUFBVSxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUM7U0FDaEQsQ0FBQyxDQUFDLENBQUM7SUFDUixDQUFDO0lBRU8sS0FBSyxDQUFDLDBCQUEwQixDQUFDLE9BQWUsRUFBRSxJQUFVO1FBQ2hFLDJDQUEyQztRQUMzQyxPQUFPLENBQUM7Z0JBQ0osYUFBYSxFQUFFLE9BQU8sT0FBTywySEFBMkg7Z0JBQ3hKLFdBQVcsRUFBRTtvQkFDVCw0QkFBNEI7b0JBQzVCLDZCQUE2QjtvQkFDN0IsK0JBQStCO2lCQUNsQztnQkFDRCxXQUFXLEVBQUU7b0JBQ1QscUNBQXFDO29CQUNyQyxpREFBaUQ7b0JBQ2pELGtDQUFrQztpQkFDckM7Z0JBQ0QsV0FBVyxFQUFFO29CQUNULCtCQUErQjtvQkFDL0IsOEJBQThCO29CQUM5Qiw0QkFBNEI7aUJBQy9CO2dCQUNELGdCQUFnQixFQUFFO29CQUNkLHVCQUF1QjtvQkFDdkIsbUJBQW1CO29CQUNuQixzQkFBc0I7aUJBQ3pCO2FBQ0osQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVPLEtBQUssQ0FBQyw2QkFBNkIsQ0FDdkMsaUJBQXFDLEVBQ3JDLGtCQUF1QztRQUV2QywrQ0FBK0M7UUFDL0MsTUFBTSxVQUFVLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDO1FBQzlHLE1BQU0sV0FBVyxHQUFHLGtCQUFrQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1FBRTlELE9BQU8sQ0FBQyxVQUFVLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFTyw0QkFBNEIsQ0FBQyxPQUF1QztRQUN4RSxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDZCxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFFbkIsSUFBSSxPQUFPLENBQUMsaUJBQWlCLElBQUksT0FBTyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDbkUsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUM7WUFDL0gsS0FBSyxJQUFJLGFBQWEsR0FBRyxHQUFHLENBQUM7WUFDN0IsVUFBVSxJQUFJLEdBQUcsQ0FBQztTQUNyQjtRQUVELElBQUksT0FBTyxDQUFDLG1CQUFtQixLQUFLLFNBQVMsRUFBRTtZQUMzQyxLQUFLLElBQUksT0FBTyxDQUFDLG1CQUFtQixHQUFHLEdBQUcsQ0FBQztZQUMzQyxVQUFVLElBQUksR0FBRyxDQUFDO1NBQ3JCO1FBRUQsSUFBSSxPQUFPLENBQUMsaUJBQWlCLElBQUksT0FBTyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDbkUsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUM7WUFDakksS0FBSyxJQUFJLGFBQWEsR0FBRyxHQUFHLENBQUM7WUFDN0IsVUFBVSxJQUFJLEdBQUcsQ0FBQztTQUNyQjtRQUVELElBQUksT0FBTyxDQUFDLHFCQUFxQixLQUFLLFNBQVMsRUFBRTtZQUM3QyxLQUFLLElBQUksT0FBTyxDQUFDLHFCQUFxQixHQUFHLEdBQUcsQ0FBQztZQUM3QyxVQUFVLElBQUksR0FBRyxDQUFDO1NBQ3JCO1FBRUQsT0FBTyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVELDRDQUE0QztJQUNwQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsU0FBcUI7UUFDbkQsb0NBQW9DO1FBQ3BDLE9BQU8sSUFBSSxDQUFDLENBQUMsa0RBQWtEO0lBQ25FLENBQUM7SUFFTyxLQUFLLENBQUMsa0JBQWtCLENBQUMsU0FBcUI7UUFDbEQsbUNBQW1DO1FBQ25DLE9BQU8sSUFBSSxDQUFDLENBQUMsa0RBQWtEO0lBQ25FLENBQUM7SUFFTyxLQUFLLENBQUMsaUJBQWlCLENBQUMsU0FBcUI7UUFDakQsa0NBQWtDO1FBQ2xDLE9BQU8sSUFBSSxDQUFDLENBQUMsa0RBQWtEO0lBQ25FLENBQUM7SUFFTyxLQUFLLENBQUMsbUJBQW1CLENBQUMsU0FBcUI7UUFDbkQsd0NBQXdDO1FBQ3hDLE9BQU87WUFDSCxvQkFBb0IsRUFBRSxJQUFJO1lBQzFCLG9CQUFvQixFQUFFLElBQUk7WUFDMUIsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixnQkFBZ0IsRUFBRSxJQUFJO1NBQ3pCLENBQUM7SUFDTixDQUFDO0lBRU8sS0FBSyxDQUFDLDZCQUE2QixDQUFDLFNBQXFCO1FBQzdELCtDQUErQztRQUMvQyxPQUFPLElBQUksQ0FBQyxDQUFDLGtEQUFrRDtJQUNuRSxDQUFDO0lBRUQsd0NBQXdDO0lBQ2hDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxPQUFlLEVBQUUsSUFBVTtRQUMzRCxnREFBZ0Q7UUFDaEQsT0FBTztZQUNILFFBQVEsRUFBRSxJQUFJO1lBQ2QsT0FBTyxFQUFFLElBQUk7WUFDYixVQUFVLEVBQUUsRUFBRTtZQUNkLGNBQWMsRUFBRSxLQUFLO1lBQ3JCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsYUFBYSxFQUFFLEVBQUU7U0FDcEIsQ0FBQztJQUNOLENBQUM7SUFFTyxxQkFBcUIsQ0FBQyxPQUEwQjtRQUNwRCxNQUFNLE9BQU8sR0FBRztZQUNaLFFBQVEsRUFBRSxHQUFHO1lBQ2IsV0FBVyxFQUFFLEdBQUc7WUFDaEIsSUFBSSxFQUFFLEdBQUc7WUFDVCxjQUFjLEVBQUUsR0FBRztZQUNuQixXQUFXLEVBQUUsR0FBRztTQUNuQixDQUFDO1FBRUYsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsS0FBSyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsZUFBZSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7UUFDN0QsS0FBSyxJQUFJLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQztRQUNuRSxLQUFLLElBQUksQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDNUQsS0FBSyxJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsMEJBQTBCLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQztRQUNwRixLQUFLLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQztRQUUvRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVPLGlCQUFpQixDQUFDLE9BQTBCO1FBQ2hELE1BQU0sTUFBTSxHQUFHO1lBQ1gsT0FBTyxDQUFDLFFBQVEsQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPO1lBQzFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsVUFBVTtZQUN0RSxPQUFPLENBQUMsY0FBYyxDQUFDLDBCQUEwQixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsMEJBQTBCLENBQUMsWUFBWTtZQUN4RyxPQUFPLENBQUMsV0FBVyxDQUFDLFNBQVMsSUFBSSxHQUFHO1lBQ3BDLE9BQU8sQ0FBQyxXQUFXLENBQUMsV0FBVyxJQUFJLEdBQUc7U0FDekMsQ0FBQztRQUVGLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFTyxjQUFjLENBQUMsT0FBMEI7UUFDN0MsTUFBTSxNQUFNLEdBQXNCLEVBQUUsQ0FBQztRQUVyQyxrQkFBa0I7UUFDbEIsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRTtZQUMzRSxNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUNSLFFBQVEsRUFBRSxVQUFVO2dCQUNwQixRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxlQUFlLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU07Z0JBQ3RFLFdBQVcsRUFBRSxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLGVBQWUsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLCtCQUErQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSTtnQkFDakwsTUFBTSxFQUFFLDBDQUEwQztnQkFDbEQsV0FBVyxFQUFFLHNGQUFzRjthQUN0RyxDQUFDLENBQUM7U0FDTjtRQUVELGNBQWM7UUFDZCxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFO1lBQ3ZFLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDL0YsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO1lBRTlGLE1BQU0sQ0FBQyxJQUFJLENBQUM7Z0JBQ1IsUUFBUSxFQUFFLE1BQU07Z0JBQ2hCLFFBQVE7Z0JBQ1IsV0FBVyxFQUFFLGVBQWUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsaUNBQWlDO2dCQUM3RyxNQUFNLEVBQUUsMkRBQTJEO2dCQUNuRSxXQUFXLEVBQUUsNkZBQTZGO2FBQzdHLENBQUMsQ0FBQztTQUNOO1FBRUQsd0JBQXdCO1FBQ3hCLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQywwQkFBMEIsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLDBCQUEwQixDQUFDLFlBQVksRUFBRTtZQUN6RyxNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUNSLFFBQVEsRUFBRSxnQkFBZ0I7Z0JBQzFCLFFBQVEsRUFBRSxPQUFPLENBQUMsY0FBYyxDQUFDLDBCQUEwQixHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRO2dCQUNyRixXQUFXLEVBQUUseUJBQXlCLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQywwQkFBMEIsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLDhCQUE4QjtnQkFDeEksTUFBTSxFQUFFLG1EQUFtRDtnQkFDM0QsV0FBVyxFQUFFLG9HQUFvRzthQUNwSCxDQUFDLENBQUM7U0FDTjtRQUVELHFCQUFxQjtRQUNyQixJQUFJLE9BQU8sQ0FBQyxXQUFXLENBQUMsV0FBVyxHQUFHLEdBQUcsRUFBRTtZQUN2QyxNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUNSLFFBQVEsRUFBRSxhQUFhO2dCQUN2QixRQUFRLEVBQUUsT0FBTyxDQUFDLFdBQVcsQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU07Z0JBQ3JFLFdBQVcsRUFBRSxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLCtCQUErQjtnQkFDcEgsTUFBTSxFQUFFLDBEQUEwRDtnQkFDbEUsV0FBVyxFQUFFLGtGQUFrRjthQUNsRyxDQUFDLENBQUM7U0FDTjtRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFFTyx1QkFBdUIsQ0FBQyxPQUEwQixFQUFFLE1BQXlCO1FBQ2pGLE1BQU0sZUFBZSxHQUErQixFQUFFLENBQUM7UUFFdkQsc0NBQXNDO1FBQ3RDLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUU7WUFDMUUsZUFBZSxDQUFDLElBQUksQ0FBQztnQkFDakIsUUFBUSxFQUFFLFVBQVU7Z0JBQ3BCLFFBQVEsRUFBRSxNQUFNO2dCQUNoQixXQUFXLEVBQUUsNEVBQTRFO2dCQUN6RixlQUFlLEVBQUUsc0RBQXNEO2dCQUN2RSxvQkFBb0IsRUFBRSxRQUFRO2FBQ2pDLENBQUMsQ0FBQztTQUNOO1FBRUQsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksRUFBRTtZQUN0QyxlQUFlLENBQUMsSUFBSSxDQUFDO2dCQUNqQixRQUFRLEVBQUUsTUFBTTtnQkFDaEIsUUFBUSxFQUFFLE1BQU07Z0JBQ2hCLFdBQVcsRUFBRSxvREFBb0Q7Z0JBQ2pFLGVBQWUsRUFBRSw2Q0FBNkM7Z0JBQzlELG9CQUFvQixFQUFFLE1BQU07YUFDL0IsQ0FBQyxDQUFDO1NBQ047UUFFRCxJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsMEJBQTBCLEdBQUcsR0FBRyxFQUFFO1lBQ3pELGVBQWUsQ0FBQyxJQUFJLENBQUM7Z0JBQ2pCLFFBQVEsRUFBRSxnQkFBZ0I7Z0JBQzFCLFFBQVEsRUFBRSxRQUFRO2dCQUNsQixXQUFXLEVBQUUseURBQXlEO2dCQUN0RSxlQUFlLEVBQUUsK0NBQStDO2dCQUNoRSxvQkFBb0IsRUFBRSxRQUFRO2FBQ2pDLENBQUMsQ0FBQztTQUNOO1FBRUQsMkNBQTJDO1FBQzNDLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxFQUFFO1lBQ3BDLGVBQWUsQ0FBQyxJQUFJLENBQUM7Z0JBQ2pCLFFBQVEsRUFBRSxhQUFhO2dCQUN2QixRQUFRLEVBQUUsUUFBUTtnQkFDbEIsV0FBVyxFQUFFLG1EQUFtRDtnQkFDaEUsZUFBZSxFQUFFLHNEQUFzRDtnQkFDdkUsb0JBQW9CLEVBQUUsUUFBUTthQUNqQyxDQUFDLENBQUM7U0FDTjtRQUVELE9BQU8sZUFBZSxDQUFDO0lBQzNCLENBQUM7SUFFTyxvQkFBb0I7UUFDeEIsT0FBTyxRQUFRLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUMzRSxDQUFDO0lBRUQ7O09BRUc7SUFDSCxvQkFBb0IsQ0FBQyxPQUFlO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEtBQUssT0FBTyxDQUFDLENBQUM7SUFDL0UsQ0FBQztJQUVEOztPQUVHO0lBQ0gsbUJBQW1CLENBQUMsT0FBZTtRQUMvQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkQsT0FBTyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNuRSxDQUFDO0lBRUQ7O09BRUc7SUFDSCxhQUFhLENBQUMsUUFBa0I7UUFDNUIsTUFBTSxVQUFVLEdBQTRDLEVBQUUsQ0FBQztRQUUvRCxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRTtZQUM1QixVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzNEO1FBRUQsT0FBTyxVQUFVLENBQUM7SUFDdEIsQ0FBQztDQUNKO0FBci9CRCw0REFxL0JDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQiw4QkFBOEIsQ0FDMUMsTUFBa0M7SUFFbEMsT0FBTyxJQUFJLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2hELENBQUM7QUFKRCx3RUFJQztBQUVEOztHQUVHO0FBQ0gsSUFBSSx5QkFBeUIsR0FBb0MsSUFBSSxDQUFDO0FBRXRFLFNBQWdCLDJCQUEyQjtJQUN2QyxJQUFJLENBQUMseUJBQXlCLEVBQUU7UUFDNUIseUJBQXlCLEdBQUcsOEJBQThCLEVBQUUsQ0FBQztLQUNoRTtJQUNELE9BQU8seUJBQXlCLENBQUM7QUFDckMsQ0FBQztBQUxELGtFQUtDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBSSBNb2RlbCBFdmFsdWF0aW9uIEZyYW1ld29ya1xuICogXG4gKiBUaGlzIHNlcnZpY2UgcHJvdmlkZXMgY29tcHJlaGVuc2l2ZSBldmFsdWF0aW9uIGNhcGFiaWxpdGllcyBmb3IgQUkgbW9kZWxzIGluY2x1ZGluZzpcbiAqIC0gQWNjdXJhY3kgYW5kIHBlcmZvcm1hbmNlIG1ldHJpY3NcbiAqIC0gQmlhcyBkZXRlY3Rpb24gYW5kIG1pdGlnYXRpb25cbiAqIC0gRXhwbGFpbmFiaWxpdHkgZXZhbHVhdGlvblxuICovXG5cbmltcG9ydCB7IFBlcmZvcm1hbmNlTWV0cmljcywgVGFzaywgTW9kZWxDb250ZXh0IH0gZnJvbSAnLi4vLi4vbW9kZWxzL3NlcnZpY2VzJztcblxuZXhwb3J0IGludGVyZmFjZSBFdmFsdWF0aW9uTWV0cmljcyB7XG4gICAgYWNjdXJhY3k6IEFjY3VyYWN5TWV0cmljcztcbiAgICBwZXJmb3JtYW5jZTogUGVyZm9ybWFuY2VNZXRyaWNzO1xuICAgIGJpYXM6IEJpYXNNZXRyaWNzO1xuICAgIGV4cGxhaW5hYmlsaXR5OiBFeHBsYWluYWJpbGl0eU1ldHJpY3M7XG4gICAgcmVsaWFiaWxpdHk6IFJlbGlhYmlsaXR5TWV0cmljcztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBY2N1cmFjeU1ldHJpY3Mge1xuICAgIG92ZXJhbGxBY2N1cmFjeTogbnVtYmVyO1xuICAgIHByZWNpc2lvbjogbnVtYmVyO1xuICAgIHJlY2FsbDogbnVtYmVyO1xuICAgIGYxU2NvcmU6IG51bWJlcjtcbiAgICBjb25mdXNpb25NYXRyaXg/OiBDb25mdXNpb25NYXRyaXg7XG4gICAgZG9tYWluU3BlY2lmaWNBY2N1cmFjeTogUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgICB0YXNrU3BlY2lmaWNBY2N1cmFjeTogUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgICBjb25maWRlbmNlQ2FsaWJyYXRpb246IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb25mdXNpb25NYXRyaXgge1xuICAgIHRydWVQb3NpdGl2ZXM6IG51bWJlcjtcbiAgICBmYWxzZVBvc2l0aXZlczogbnVtYmVyO1xuICAgIHRydWVOZWdhdGl2ZXM6IG51bWJlcjtcbiAgICBmYWxzZU5lZ2F0aXZlczogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJpYXNNZXRyaWNzIHtcbiAgICBvdmVyYWxsQmlhc1Njb3JlOiBudW1iZXI7XG4gICAgZGVtb2dyYXBoaWNQYXJpdHk6IG51bWJlcjtcbiAgICBlcXVhbGl6ZWRPZGRzOiBudW1iZXI7XG4gICAgY2FsaWJyYXRpb25CaWFzOiBudW1iZXI7XG4gICAgcmVwcmVzZW50YXRpb25CaWFzOiBudW1iZXI7XG4gICAgYmlhc0RldGVjdGlvblJlc3VsdHM6IEJpYXNEZXRlY3Rpb25SZXN1bHRbXTtcbiAgICBtaXRpZ2F0aW9uUmVjb21tZW5kYXRpb25zOiBCaWFzUmVtZWRpYXRpb25bXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCaWFzRGV0ZWN0aW9uUmVzdWx0IHtcbiAgICBiaWFzVHlwZTogJ2RlbW9ncmFwaGljJyB8ICdjb25maXJtYXRpb24nIHwgJ2FuY2hvcmluZycgfCAnYXZhaWxhYmlsaXR5JyB8ICdyZXByZXNlbnRhdGlvbic7XG4gICAgc2V2ZXJpdHk6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCcgfCAnY3JpdGljYWwnO1xuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gICAgYWZmZWN0ZWRHcm91cHM6IHN0cmluZ1tdO1xuICAgIGV2aWRlbmNlOiBhbnlbXTtcbiAgICBjb25maWRlbmNlOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmlhc1JlbWVkaWF0aW9uIHtcbiAgICBiaWFzVHlwZTogc3RyaW5nO1xuICAgIHN0cmF0ZWd5OiAnZGF0YS1hdWdtZW50YXRpb24nIHwgJ3Byb21wdC1lbmdpbmVlcmluZycgfCAncG9zdC1wcm9jZXNzaW5nJyB8ICdtb2RlbC1yZXRyYWluaW5nJztcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICAgIGV4cGVjdGVkSW1wYWN0OiBudW1iZXI7XG4gICAgaW1wbGVtZW50YXRpb25Db21wbGV4aXR5OiAnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnO1xuICAgIGVzdGltYXRlZENvc3Q6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFeHBsYWluYWJpbGl0eU1ldHJpY3Mge1xuICAgIG92ZXJhbGxFeHBsYWluYWJpbGl0eVNjb3JlOiBudW1iZXI7XG4gICAgZmVhdHVyZUltcG9ydGFuY2U6IEZlYXR1cmVJbXBvcnRhbmNlW107XG4gICAgZGVjaXNpb25QYXRoQ2xhcml0eTogbnVtYmVyO1xuICAgIGNvdW50ZXJmYWN0dWFsRXhwbGFuYXRpb25zOiBDb3VudGVyZmFjdHVhbEV4cGxhbmF0aW9uW107XG4gICAgbG9jYWxFeHBsYW5hdGlvbnM6IExvY2FsRXhwbGFuYXRpb25bXTtcbiAgICBnbG9iYWxFeHBsYW5hdGlvbnM6IEdsb2JhbEV4cGxhbmF0aW9uW107XG4gICAgaHVtYW5JbnRlcnByZXRhYmlsaXR5OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmVhdHVyZUltcG9ydGFuY2Uge1xuICAgIGZlYXR1cmU6IHN0cmluZztcbiAgICBpbXBvcnRhbmNlOiBudW1iZXI7XG4gICAgY29uZmlkZW5jZTogbnVtYmVyO1xuICAgIGRpcmVjdGlvbjogJ3Bvc2l0aXZlJyB8ICduZWdhdGl2ZScgfCAnbmV1dHJhbCc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ291bnRlcmZhY3R1YWxFeHBsYW5hdGlvbiB7XG4gICAgb3JpZ2luYWxJbnB1dDogYW55O1xuICAgIGNvdW50ZXJmYWN0dWFsSW5wdXQ6IGFueTtcbiAgICBvcmlnaW5hbE91dHB1dDogYW55O1xuICAgIGNvdW50ZXJmYWN0dWFsT3V0cHV0OiBhbnk7XG4gICAgY2hhbmdlZEZlYXR1cmVzOiBzdHJpbmdbXTtcbiAgICBwbGF1c2liaWxpdHk6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMb2NhbEV4cGxhbmF0aW9uIHtcbiAgICBpbnB1dElkOiBzdHJpbmc7XG4gICAgZXhwbGFuYXRpb246IHN0cmluZztcbiAgICBjb25maWRlbmNlOiBudW1iZXI7XG4gICAgc3VwcG9ydGluZ0V2aWRlbmNlOiBhbnlbXTtcbiAgICBrZXlGYWN0b3JzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHbG9iYWxFeHBsYW5hdGlvbiB7XG4gICAgbW9kZWxCZWhhdmlvcjogc3RyaW5nO1xuICAgIGtleVBhdHRlcm5zOiBzdHJpbmdbXTtcbiAgICBsaW1pdGF0aW9uczogc3RyaW5nW107XG4gICAgYXNzdW1wdGlvbnM6IHN0cmluZ1tdO1xuICAgIGRhdGFSZXF1aXJlbWVudHM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlbGlhYmlsaXR5TWV0cmljcyB7XG4gICAgY29uc2lzdGVuY3k6IG51bWJlcjtcbiAgICByb2J1c3RuZXNzOiBudW1iZXI7XG4gICAgc3RhYmlsaXR5OiBudW1iZXI7XG4gICAgdW5jZXJ0YWludHlRdWFudGlmaWNhdGlvbjogVW5jZXJ0YWludHlNZXRyaWNzO1xuICAgIGFkdmVyc2FyaWFsUm9idXN0bmVzczogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFVuY2VydGFpbnR5TWV0cmljcyB7XG4gICAgZXBpc3RlbWljVW5jZXJ0YWludHk6IG51bWJlcjtcbiAgICBhbGVhdG9yaWNVbmNlcnRhaW50eTogbnVtYmVyO1xuICAgIHRvdGFsVW5jZXJ0YWludHk6IG51bWJlcjtcbiAgICBjYWxpYnJhdGlvbkVycm9yOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXZhbHVhdGlvbkNvbmZpZyB7XG4gICAgYWNjdXJhY3lUaHJlc2hvbGRzOiB7XG4gICAgICAgIG1pbmltdW06IG51bWJlcjtcbiAgICAgICAgdGFyZ2V0OiBudW1iZXI7XG4gICAgICAgIGV4Y2VsbGVudDogbnVtYmVyO1xuICAgIH07XG4gICAgYmlhc1RocmVzaG9sZHM6IHtcbiAgICAgICAgYWNjZXB0YWJsZTogbnVtYmVyO1xuICAgICAgICBjb25jZXJuaW5nOiBudW1iZXI7XG4gICAgICAgIGNyaXRpY2FsOiBudW1iZXI7XG4gICAgfTtcbiAgICBleHBsYWluYWJpbGl0eVJlcXVpcmVtZW50czoge1xuICAgICAgICBtaW5pbXVtU2NvcmU6IG51bWJlcjtcbiAgICAgICAgcmVxdWlyZUxvY2FsRXhwbGFuYXRpb25zOiBib29sZWFuO1xuICAgICAgICByZXF1aXJlR2xvYmFsRXhwbGFuYXRpb25zOiBib29sZWFuO1xuICAgICAgICByZXF1aXJlQ291bnRlcmZhY3R1YWxzOiBib29sZWFuO1xuICAgIH07XG4gICAgZXZhbHVhdGlvbkRhdGFzZXRzOiB7XG4gICAgICAgIHRlc3REYXRhU2l6ZTogbnVtYmVyO1xuICAgICAgICB2YWxpZGF0aW9uRGF0YVNpemU6IG51bWJlcjtcbiAgICAgICAgYmlhc1Rlc3RpbmdEYXRhU2l6ZTogbnVtYmVyO1xuICAgIH07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXZhbHVhdGlvblJlc3VsdCB7XG4gICAgbW9kZWxJZDogc3RyaW5nO1xuICAgIGV2YWx1YXRpb25JZDogc3RyaW5nO1xuICAgIHRpbWVzdGFtcDogRGF0ZTtcbiAgICBtZXRyaWNzOiBFdmFsdWF0aW9uTWV0cmljcztcbiAgICBvdmVyYWxsU2NvcmU6IG51bWJlcjtcbiAgICBwYXNzZWQ6IGJvb2xlYW47XG4gICAgaXNzdWVzOiBFdmFsdWF0aW9uSXNzdWVbXTtcbiAgICByZWNvbW1lbmRhdGlvbnM6IEV2YWx1YXRpb25SZWNvbW1lbmRhdGlvbltdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEV2YWx1YXRpb25Jc3N1ZSB7XG4gICAgY2F0ZWdvcnk6ICdhY2N1cmFjeScgfCAnYmlhcycgfCAnZXhwbGFpbmFiaWxpdHknIHwgJ3JlbGlhYmlsaXR5JztcbiAgICBzZXZlcml0eTogJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJyB8ICdjcml0aWNhbCc7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICBpbXBhY3Q6IHN0cmluZztcbiAgICByZW1lZGlhdGlvbjogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEV2YWx1YXRpb25SZWNvbW1lbmRhdGlvbiB7XG4gICAgY2F0ZWdvcnk6IHN0cmluZztcbiAgICBwcmlvcml0eTogJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJztcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICAgIGV4cGVjdGVkQmVuZWZpdDogc3RyaW5nO1xuICAgIGltcGxlbWVudGF0aW9uRWZmb3J0OiAnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRlc3RDYXNlIHtcbiAgICBpZDogc3RyaW5nO1xuICAgIGlucHV0OiBhbnk7XG4gICAgZXhwZWN0ZWRPdXRwdXQ6IGFueTtcbiAgICBhY3R1YWxPdXRwdXQ/OiBhbnk7XG4gICAgbWV0YWRhdGE6IHtcbiAgICAgICAgZG9tYWluOiBzdHJpbmc7XG4gICAgICAgIGNvbXBsZXhpdHk6IHN0cmluZztcbiAgICAgICAgYmlhc1Rlc3RpbmdHcm91cD86IHN0cmluZztcbiAgICAgICAgZXhwbGFpbmFiaWxpdHlSZXF1aXJlZDogYm9vbGVhbjtcbiAgICB9O1xufVxuXG5leHBvcnQgY2xhc3MgTW9kZWxFdmFsdWF0aW9uRnJhbWV3b3JrIHtcbiAgICBwcml2YXRlIGNvbmZpZzogRXZhbHVhdGlvbkNvbmZpZztcbiAgICBwcml2YXRlIGV2YWx1YXRpb25IaXN0b3J5OiBFdmFsdWF0aW9uUmVzdWx0W10gPSBbXTtcblxuICAgIGNvbnN0cnVjdG9yKGNvbmZpZz86IFBhcnRpYWw8RXZhbHVhdGlvbkNvbmZpZz4pIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSB7XG4gICAgICAgICAgICBhY2N1cmFjeVRocmVzaG9sZHM6IHtcbiAgICAgICAgICAgICAgICBtaW5pbXVtOiAwLjgwLFxuICAgICAgICAgICAgICAgIHRhcmdldDogMC45MCxcbiAgICAgICAgICAgICAgICBleGNlbGxlbnQ6IDAuOTVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiaWFzVGhyZXNob2xkczoge1xuICAgICAgICAgICAgICAgIGFjY2VwdGFibGU6IDAuMDUsXG4gICAgICAgICAgICAgICAgY29uY2VybmluZzogMC4xMCxcbiAgICAgICAgICAgICAgICBjcml0aWNhbDogMC4yMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4cGxhaW5hYmlsaXR5UmVxdWlyZW1lbnRzOiB7XG4gICAgICAgICAgICAgICAgbWluaW11bVNjb3JlOiAwLjc1LFxuICAgICAgICAgICAgICAgIHJlcXVpcmVMb2NhbEV4cGxhbmF0aW9uczogdHJ1ZSxcbiAgICAgICAgICAgICAgICByZXF1aXJlR2xvYmFsRXhwbGFuYXRpb25zOiB0cnVlLFxuICAgICAgICAgICAgICAgIHJlcXVpcmVDb3VudGVyZmFjdHVhbHM6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXZhbHVhdGlvbkRhdGFzZXRzOiB7XG4gICAgICAgICAgICAgICAgdGVzdERhdGFTaXplOiAxMDAwLFxuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25EYXRhU2l6ZTogNTAwLFxuICAgICAgICAgICAgICAgIGJpYXNUZXN0aW5nRGF0YVNpemU6IDIwMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC4uLmNvbmZpZ1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbXByZWhlbnNpdmUgbW9kZWwgZXZhbHVhdGlvblxuICAgICAqL1xuICAgIGFzeW5jIGV2YWx1YXRlTW9kZWwoXG4gICAgICAgIG1vZGVsSWQ6IHN0cmluZyxcbiAgICAgICAgdGVzdENhc2VzOiBUZXN0Q2FzZVtdLFxuICAgICAgICB0YXNrOiBUYXNrLFxuICAgICAgICBjb250ZXh0OiBNb2RlbENvbnRleHRcbiAgICApOiBQcm9taXNlPEV2YWx1YXRpb25SZXN1bHQ+IHtcbiAgICAgICAgY29uc3QgZXZhbHVhdGlvbklkID0gdGhpcy5nZW5lcmF0ZUV2YWx1YXRpb25JZCgpO1xuICAgICAgICBjb25zb2xlLmxvZyhgU3RhcnRpbmcgY29tcHJlaGVuc2l2ZSBldmFsdWF0aW9uIGZvciBtb2RlbCAke21vZGVsSWR9YCk7XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgaW5wdXRcbiAgICAgICAgaWYgKCF0ZXN0Q2FzZXMgfHwgdGVzdENhc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUZXN0IGNhc2VzIGFyZSByZXF1aXJlZCBmb3IgbW9kZWwgZXZhbHVhdGlvbicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFJ1biBhbGwgZXZhbHVhdGlvbiBjb21wb25lbnRzXG4gICAgICAgICAgICBjb25zdCBbYWNjdXJhY3lNZXRyaWNzLCBiaWFzTWV0cmljcywgZXhwbGFpbmFiaWxpdHlNZXRyaWNzLCByZWxpYWJpbGl0eU1ldHJpY3NdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgICAgIHRoaXMuZXZhbHVhdGVBY2N1cmFjeShtb2RlbElkLCB0ZXN0Q2FzZXMsIHRhc2spLFxuICAgICAgICAgICAgICAgIHRoaXMuZXZhbHVhdGVCaWFzKG1vZGVsSWQsIHRlc3RDYXNlcywgdGFzayksXG4gICAgICAgICAgICAgICAgdGhpcy5ldmFsdWF0ZUV4cGxhaW5hYmlsaXR5KG1vZGVsSWQsIHRlc3RDYXNlcywgdGFzayksXG4gICAgICAgICAgICAgICAgdGhpcy5ldmFsdWF0ZVJlbGlhYmlsaXR5KG1vZGVsSWQsIHRlc3RDYXNlcywgdGFzaylcbiAgICAgICAgICAgIF0pO1xuXG4gICAgICAgICAgICAvLyBHZXQgcGVyZm9ybWFuY2UgbWV0cmljcyBmcm9tIGV4aXN0aW5nIHN5c3RlbXNcbiAgICAgICAgICAgIGNvbnN0IHBlcmZvcm1hbmNlTWV0cmljcyA9IGF3YWl0IHRoaXMuZ2V0UGVyZm9ybWFuY2VNZXRyaWNzKG1vZGVsSWQsIHRhc2spO1xuXG4gICAgICAgICAgICBjb25zdCBtZXRyaWNzOiBFdmFsdWF0aW9uTWV0cmljcyA9IHtcbiAgICAgICAgICAgICAgICBhY2N1cmFjeTogYWNjdXJhY3lNZXRyaWNzLFxuICAgICAgICAgICAgICAgIHBlcmZvcm1hbmNlOiBwZXJmb3JtYW5jZU1ldHJpY3MsXG4gICAgICAgICAgICAgICAgYmlhczogYmlhc01ldHJpY3MsXG4gICAgICAgICAgICAgICAgZXhwbGFpbmFiaWxpdHk6IGV4cGxhaW5hYmlsaXR5TWV0cmljcyxcbiAgICAgICAgICAgICAgICByZWxpYWJpbGl0eTogcmVsaWFiaWxpdHlNZXRyaWNzXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgb3ZlcmFsbCBzY29yZSBhbmQgZGV0ZXJtaW5lIHBhc3MvZmFpbFxuICAgICAgICAgICAgY29uc3Qgb3ZlcmFsbFNjb3JlID0gdGhpcy5jYWxjdWxhdGVPdmVyYWxsU2NvcmUobWV0cmljcyk7XG4gICAgICAgICAgICBjb25zdCBwYXNzZWQgPSB0aGlzLmRldGVybWluZVBhc3NGYWlsKG1ldHJpY3MpO1xuXG4gICAgICAgICAgICAvLyBJZGVudGlmeSBpc3N1ZXMgYW5kIGdlbmVyYXRlIHJlY29tbWVuZGF0aW9uc1xuICAgICAgICAgICAgY29uc3QgaXNzdWVzID0gdGhpcy5pZGVudGlmeUlzc3VlcyhtZXRyaWNzKTtcbiAgICAgICAgICAgIGNvbnN0IHJlY29tbWVuZGF0aW9ucyA9IHRoaXMuZ2VuZXJhdGVSZWNvbW1lbmRhdGlvbnMobWV0cmljcywgaXNzdWVzKTtcblxuICAgICAgICAgICAgY29uc3QgcmVzdWx0OiBFdmFsdWF0aW9uUmVzdWx0ID0ge1xuICAgICAgICAgICAgICAgIG1vZGVsSWQsXG4gICAgICAgICAgICAgICAgZXZhbHVhdGlvbklkLFxuICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgICBtZXRyaWNzLFxuICAgICAgICAgICAgICAgIG92ZXJhbGxTY29yZSxcbiAgICAgICAgICAgICAgICBwYXNzZWQsXG4gICAgICAgICAgICAgICAgaXNzdWVzLFxuICAgICAgICAgICAgICAgIHJlY29tbWVuZGF0aW9uc1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gU3RvcmUgZXZhbHVhdGlvbiByZXN1bHRcbiAgICAgICAgICAgIHRoaXMuZXZhbHVhdGlvbkhpc3RvcnkucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYEV2YWx1YXRpb24gY29tcGxldGVkIGZvciBtb2RlbCAke21vZGVsSWR9LiBPdmVyYWxsIHNjb3JlOiAke292ZXJhbGxTY29yZS50b0ZpeGVkKDMpfSwgUGFzc2VkOiAke3Bhc3NlZH1gKTtcblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGV2YWx1YXRpbmcgbW9kZWwgJHttb2RlbElkfTpgLCBlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV2YWx1YXRlIG1vZGVsIGFjY3VyYWN5IGFuZCBwcmVjaXNpb25cbiAgICAgKi9cbiAgICBhc3luYyBldmFsdWF0ZUFjY3VyYWN5KG1vZGVsSWQ6IHN0cmluZywgdGVzdENhc2VzOiBUZXN0Q2FzZVtdLCB0YXNrOiBUYXNrKTogUHJvbWlzZTxBY2N1cmFjeU1ldHJpY3M+IHtcbiAgICAgICAgY29uc29sZS5sb2coYEV2YWx1YXRpbmcgYWNjdXJhY3kgZm9yIG1vZGVsICR7bW9kZWxJZH1gKTtcblxuICAgICAgICBsZXQgY29ycmVjdFByZWRpY3Rpb25zID0gMDtcbiAgICAgICAgbGV0IHRvdGFsUHJlZGljdGlvbnMgPSB0ZXN0Q2FzZXMubGVuZ3RoO1xuICAgICAgICBjb25zdCBkb21haW5BY2N1cmFjeTogUmVjb3JkPHN0cmluZywgeyBjb3JyZWN0OiBudW1iZXI7IHRvdGFsOiBudW1iZXIgfT4gPSB7fTtcbiAgICAgICAgY29uc3QgdGFza0FjY3VyYWN5OiBSZWNvcmQ8c3RyaW5nLCB7IGNvcnJlY3Q6IG51bWJlcjsgdG90YWw6IG51bWJlciB9PiA9IHt9O1xuXG4gICAgICAgIC8vIENvbmZ1c2lvbiBtYXRyaXggY29tcG9uZW50c1xuICAgICAgICBsZXQgdHJ1ZVBvc2l0aXZlcyA9IDA7XG4gICAgICAgIGxldCBmYWxzZVBvc2l0aXZlcyA9IDA7XG4gICAgICAgIGxldCB0cnVlTmVnYXRpdmVzID0gMDtcbiAgICAgICAgbGV0IGZhbHNlTmVnYXRpdmVzID0gMDtcblxuICAgICAgICAvLyBQcm9jZXNzIGVhY2ggdGVzdCBjYXNlXG4gICAgICAgIGZvciAoY29uc3QgdGVzdENhc2Ugb2YgdGVzdENhc2VzKSB7XG4gICAgICAgICAgICBjb25zdCBpc0NvcnJlY3QgPSB0aGlzLmV2YWx1YXRlVGVzdENhc2UodGVzdENhc2UpO1xuXG4gICAgICAgICAgICBpZiAoaXNDb3JyZWN0KSB7XG4gICAgICAgICAgICAgICAgY29ycmVjdFByZWRpY3Rpb25zKys7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFVwZGF0ZSBkb21haW4tc3BlY2lmaWMgYWNjdXJhY3lcbiAgICAgICAgICAgIGNvbnN0IGRvbWFpbiA9IHRlc3RDYXNlLm1ldGFkYXRhLmRvbWFpbjtcbiAgICAgICAgICAgIGlmICghZG9tYWluQWNjdXJhY3lbZG9tYWluXSkge1xuICAgICAgICAgICAgICAgIGRvbWFpbkFjY3VyYWN5W2RvbWFpbl0gPSB7IGNvcnJlY3Q6IDAsIHRvdGFsOiAwIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb21haW5BY2N1cmFjeVtkb21haW5dLnRvdGFsKys7XG4gICAgICAgICAgICBpZiAoaXNDb3JyZWN0KSB7XG4gICAgICAgICAgICAgICAgZG9tYWluQWNjdXJhY3lbZG9tYWluXS5jb3JyZWN0Kys7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFVwZGF0ZSB0YXNrLXNwZWNpZmljIGFjY3VyYWN5XG4gICAgICAgICAgICBjb25zdCB0YXNrVHlwZSA9IHRhc2sudHlwZTtcbiAgICAgICAgICAgIGlmICghdGFza0FjY3VyYWN5W3Rhc2tUeXBlXSkge1xuICAgICAgICAgICAgICAgIHRhc2tBY2N1cmFjeVt0YXNrVHlwZV0gPSB7IGNvcnJlY3Q6IDAsIHRvdGFsOiAwIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0YXNrQWNjdXJhY3lbdGFza1R5cGVdLnRvdGFsKys7XG4gICAgICAgICAgICBpZiAoaXNDb3JyZWN0KSB7XG4gICAgICAgICAgICAgICAgdGFza0FjY3VyYWN5W3Rhc2tUeXBlXS5jb3JyZWN0Kys7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFVwZGF0ZSBjb25mdXNpb24gbWF0cml4IChzaW1wbGlmaWVkIGJpbmFyeSBjbGFzc2lmaWNhdGlvbilcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQmluYXJ5Q2xhc3NpZmljYXRpb25UYXNrKHRhc2spKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZGljdGVkID0gdGhpcy5leHRyYWN0QmluYXJ5UHJlZGljdGlvbih0ZXN0Q2FzZS5hY3R1YWxPdXRwdXQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjdHVhbCA9IHRoaXMuZXh0cmFjdEJpbmFyeVByZWRpY3Rpb24odGVzdENhc2UuZXhwZWN0ZWRPdXRwdXQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHByZWRpY3RlZCAmJiBhY3R1YWwpIHRydWVQb3NpdGl2ZXMrKztcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChwcmVkaWN0ZWQgJiYgIWFjdHVhbCkgZmFsc2VQb3NpdGl2ZXMrKztcbiAgICAgICAgICAgICAgICBlbHNlIGlmICghcHJlZGljdGVkICYmICFhY3R1YWwpIHRydWVOZWdhdGl2ZXMrKztcbiAgICAgICAgICAgICAgICBlbHNlIGlmICghcHJlZGljdGVkICYmIGFjdHVhbCkgZmFsc2VOZWdhdGl2ZXMrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG92ZXJhbGxBY2N1cmFjeSA9IGNvcnJlY3RQcmVkaWN0aW9ucyAvIHRvdGFsUHJlZGljdGlvbnM7XG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHByZWNpc2lvbiwgcmVjYWxsLCBhbmQgRjEgc2NvcmVcbiAgICAgICAgY29uc3QgcHJlY2lzaW9uID0gdHJ1ZVBvc2l0aXZlcyAvIE1hdGgubWF4KDEsIHRydWVQb3NpdGl2ZXMgKyBmYWxzZVBvc2l0aXZlcyk7XG4gICAgICAgIGNvbnN0IHJlY2FsbCA9IHRydWVQb3NpdGl2ZXMgLyBNYXRoLm1heCgxLCB0cnVlUG9zaXRpdmVzICsgZmFsc2VOZWdhdGl2ZXMpO1xuICAgICAgICBjb25zdCBmMVNjb3JlID0gMiAqIChwcmVjaXNpb24gKiByZWNhbGwpIC8gTWF0aC5tYXgoMC4wMDEsIHByZWNpc2lvbiArIHJlY2FsbCk7XG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIGRvbWFpbiBhbmQgdGFzayBzcGVjaWZpYyBhY2N1cmFjaWVzXG4gICAgICAgIGNvbnN0IGRvbWFpblNwZWNpZmljQWNjdXJhY3k6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBbZG9tYWluLCBzdGF0c10gb2YgT2JqZWN0LmVudHJpZXMoZG9tYWluQWNjdXJhY3kpKSB7XG4gICAgICAgICAgICBkb21haW5TcGVjaWZpY0FjY3VyYWN5W2RvbWFpbl0gPSBzdGF0cy5jb3JyZWN0IC8gc3RhdHMudG90YWw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0YXNrU3BlY2lmaWNBY2N1cmFjeTogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IFt0YXNrVHlwZSwgc3RhdHNdIG9mIE9iamVjdC5lbnRyaWVzKHRhc2tBY2N1cmFjeSkpIHtcbiAgICAgICAgICAgIHRhc2tTcGVjaWZpY0FjY3VyYWN5W3Rhc2tUeXBlXSA9IHN0YXRzLmNvcnJlY3QgLyBzdGF0cy50b3RhbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGN1bGF0ZSBjb25maWRlbmNlIGNhbGlicmF0aW9uXG4gICAgICAgIGNvbnN0IGNvbmZpZGVuY2VDYWxpYnJhdGlvbiA9IGF3YWl0IHRoaXMuY2FsY3VsYXRlQ29uZmlkZW5jZUNhbGlicmF0aW9uKHRlc3RDYXNlcyk7XG5cbiAgICAgICAgY29uc3QgY29uZnVzaW9uTWF0cml4OiBDb25mdXNpb25NYXRyaXggPSB7XG4gICAgICAgICAgICB0cnVlUG9zaXRpdmVzLFxuICAgICAgICAgICAgZmFsc2VQb3NpdGl2ZXMsXG4gICAgICAgICAgICB0cnVlTmVnYXRpdmVzLFxuICAgICAgICAgICAgZmFsc2VOZWdhdGl2ZXNcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb3ZlcmFsbEFjY3VyYWN5LFxuICAgICAgICAgICAgcHJlY2lzaW9uLFxuICAgICAgICAgICAgcmVjYWxsLFxuICAgICAgICAgICAgZjFTY29yZSxcbiAgICAgICAgICAgIGNvbmZ1c2lvbk1hdHJpeCxcbiAgICAgICAgICAgIGRvbWFpblNwZWNpZmljQWNjdXJhY3ksXG4gICAgICAgICAgICB0YXNrU3BlY2lmaWNBY2N1cmFjeSxcbiAgICAgICAgICAgIGNvbmZpZGVuY2VDYWxpYnJhdGlvblxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV2YWx1YXRlIG1vZGVsIGZvciB2YXJpb3VzIHR5cGVzIG9mIGJpYXNcbiAgICAgKi9cbiAgICBhc3luYyBldmFsdWF0ZUJpYXMobW9kZWxJZDogc3RyaW5nLCB0ZXN0Q2FzZXM6IFRlc3RDYXNlW10sIHRhc2s6IFRhc2spOiBQcm9taXNlPEJpYXNNZXRyaWNzPiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBFdmFsdWF0aW5nIGJpYXMgZm9yIG1vZGVsICR7bW9kZWxJZH1gKTtcblxuICAgICAgICBjb25zdCBiaWFzRGV0ZWN0aW9uUmVzdWx0czogQmlhc0RldGVjdGlvblJlc3VsdFtdID0gW107XG4gICAgICAgIGNvbnN0IG1pdGlnYXRpb25SZWNvbW1lbmRhdGlvbnM6IEJpYXNSZW1lZGlhdGlvbltdID0gW107XG5cbiAgICAgICAgLy8gRGVtb2dyYXBoaWMgYmlhcyBkZXRlY3Rpb25cbiAgICAgICAgY29uc3QgZGVtb2dyYXBoaWNCaWFzID0gYXdhaXQgdGhpcy5kZXRlY3REZW1vZ3JhcGhpY0JpYXModGVzdENhc2VzKTtcbiAgICAgICAgaWYgKGRlbW9ncmFwaGljQmlhcykge1xuICAgICAgICAgICAgYmlhc0RldGVjdGlvblJlc3VsdHMucHVzaChkZW1vZ3JhcGhpY0JpYXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ29uZmlybWF0aW9uIGJpYXMgZGV0ZWN0aW9uXG4gICAgICAgIGNvbnN0IGNvbmZpcm1hdGlvbkJpYXMgPSBhd2FpdCB0aGlzLmRldGVjdENvbmZpcm1hdGlvbkJpYXModGVzdENhc2VzKTtcbiAgICAgICAgaWYgKGNvbmZpcm1hdGlvbkJpYXMpIHtcbiAgICAgICAgICAgIGJpYXNEZXRlY3Rpb25SZXN1bHRzLnB1c2goY29uZmlybWF0aW9uQmlhcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBbmNob3JpbmcgYmlhcyBkZXRlY3Rpb25cbiAgICAgICAgY29uc3QgYW5jaG9yaW5nQmlhcyA9IGF3YWl0IHRoaXMuZGV0ZWN0QW5jaG9yaW5nQmlhcyh0ZXN0Q2FzZXMpO1xuICAgICAgICBpZiAoYW5jaG9yaW5nQmlhcykge1xuICAgICAgICAgICAgYmlhc0RldGVjdGlvblJlc3VsdHMucHVzaChhbmNob3JpbmdCaWFzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlcHJlc2VudGF0aW9uIGJpYXMgZGV0ZWN0aW9uXG4gICAgICAgIGNvbnN0IHJlcHJlc2VudGF0aW9uQmlhcyA9IGF3YWl0IHRoaXMuZGV0ZWN0UmVwcmVzZW50YXRpb25CaWFzKHRlc3RDYXNlcyk7XG4gICAgICAgIGlmIChyZXByZXNlbnRhdGlvbkJpYXMpIHtcbiAgICAgICAgICAgIGJpYXNEZXRlY3Rpb25SZXN1bHRzLnB1c2gocmVwcmVzZW50YXRpb25CaWFzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGN1bGF0ZSBiaWFzIG1ldHJpY3NcbiAgICAgICAgY29uc3Qgb3ZlcmFsbEJpYXNTY29yZSA9IHRoaXMuY2FsY3VsYXRlT3ZlcmFsbEJpYXNTY29yZShiaWFzRGV0ZWN0aW9uUmVzdWx0cyk7XG4gICAgICAgIGNvbnN0IGRlbW9ncmFwaGljUGFyaXR5ID0gYXdhaXQgdGhpcy5jYWxjdWxhdGVEZW1vZ3JhcGhpY1Bhcml0eSh0ZXN0Q2FzZXMpO1xuICAgICAgICBjb25zdCBlcXVhbGl6ZWRPZGRzID0gYXdhaXQgdGhpcy5jYWxjdWxhdGVFcXVhbGl6ZWRPZGRzKHRlc3RDYXNlcyk7XG4gICAgICAgIGNvbnN0IGNhbGlicmF0aW9uQmlhcyA9IGF3YWl0IHRoaXMuY2FsY3VsYXRlQ2FsaWJyYXRpb25CaWFzKHRlc3RDYXNlcyk7XG4gICAgICAgIGNvbnN0IHJlcHJlc2VudGF0aW9uQmlhc1Njb3JlID0gYXdhaXQgdGhpcy5jYWxjdWxhdGVSZXByZXNlbnRhdGlvbkJpYXModGVzdENhc2VzKTtcblxuICAgICAgICAvLyBHZW5lcmF0ZSBtaXRpZ2F0aW9uIHJlY29tbWVuZGF0aW9uc1xuICAgICAgICBmb3IgKGNvbnN0IGJpYXNSZXN1bHQgb2YgYmlhc0RldGVjdGlvblJlc3VsdHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlbWVkaWF0aW9uID0gdGhpcy5nZW5lcmF0ZUJpYXNSZW1lZGlhdGlvbihiaWFzUmVzdWx0KTtcbiAgICAgICAgICAgIGlmIChyZW1lZGlhdGlvbikge1xuICAgICAgICAgICAgICAgIG1pdGlnYXRpb25SZWNvbW1lbmRhdGlvbnMucHVzaChyZW1lZGlhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb3ZlcmFsbEJpYXNTY29yZSxcbiAgICAgICAgICAgIGRlbW9ncmFwaGljUGFyaXR5LFxuICAgICAgICAgICAgZXF1YWxpemVkT2RkcyxcbiAgICAgICAgICAgIGNhbGlicmF0aW9uQmlhcyxcbiAgICAgICAgICAgIHJlcHJlc2VudGF0aW9uQmlhczogcmVwcmVzZW50YXRpb25CaWFzU2NvcmUsXG4gICAgICAgICAgICBiaWFzRGV0ZWN0aW9uUmVzdWx0cyxcbiAgICAgICAgICAgIG1pdGlnYXRpb25SZWNvbW1lbmRhdGlvbnNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFdmFsdWF0ZSBtb2RlbCBleHBsYWluYWJpbGl0eVxuICAgICAqL1xuICAgIGFzeW5jIGV2YWx1YXRlRXhwbGFpbmFiaWxpdHkobW9kZWxJZDogc3RyaW5nLCB0ZXN0Q2FzZXM6IFRlc3RDYXNlW10sIHRhc2s6IFRhc2spOiBQcm9taXNlPEV4cGxhaW5hYmlsaXR5TWV0cmljcz4ge1xuICAgICAgICBjb25zb2xlLmxvZyhgRXZhbHVhdGluZyBleHBsYWluYWJpbGl0eSBmb3IgbW9kZWwgJHttb2RlbElkfWApO1xuXG4gICAgICAgIC8vIEZlYXR1cmUgaW1wb3J0YW5jZSBhbmFseXNpc1xuICAgICAgICBjb25zdCBmZWF0dXJlSW1wb3J0YW5jZSA9IGF3YWl0IHRoaXMuY2FsY3VsYXRlRmVhdHVyZUltcG9ydGFuY2UodGVzdENhc2VzLCB0YXNrKTtcblxuICAgICAgICAvLyBEZWNpc2lvbiBwYXRoIGNsYXJpdHlcbiAgICAgICAgY29uc3QgZGVjaXNpb25QYXRoQ2xhcml0eSA9IGF3YWl0IHRoaXMuZXZhbHVhdGVEZWNpc2lvblBhdGhDbGFyaXR5KHRlc3RDYXNlcyk7XG5cbiAgICAgICAgLy8gR2VuZXJhdGUgY291bnRlcmZhY3R1YWwgZXhwbGFuYXRpb25zXG4gICAgICAgIGNvbnN0IGNvdW50ZXJmYWN0dWFsRXhwbGFuYXRpb25zID0gYXdhaXQgdGhpcy5nZW5lcmF0ZUNvdW50ZXJmYWN0dWFsRXhwbGFuYXRpb25zKHRlc3RDYXNlcy5zbGljZSgwLCAxMCkpO1xuXG4gICAgICAgIC8vIEdlbmVyYXRlIGxvY2FsIGV4cGxhbmF0aW9uc1xuICAgICAgICBjb25zdCBsb2NhbEV4cGxhbmF0aW9ucyA9IGF3YWl0IHRoaXMuZ2VuZXJhdGVMb2NhbEV4cGxhbmF0aW9ucyh0ZXN0Q2FzZXMuc2xpY2UoMCwgMjApKTtcblxuICAgICAgICAvLyBHZW5lcmF0ZSBnbG9iYWwgZXhwbGFuYXRpb25zXG4gICAgICAgIGNvbnN0IGdsb2JhbEV4cGxhbmF0aW9ucyA9IGF3YWl0IHRoaXMuZ2VuZXJhdGVHbG9iYWxFeHBsYW5hdGlvbnMobW9kZWxJZCwgdGFzayk7XG5cbiAgICAgICAgLy8gRXZhbHVhdGUgaHVtYW4gaW50ZXJwcmV0YWJpbGl0eVxuICAgICAgICBjb25zdCBodW1hbkludGVycHJldGFiaWxpdHkgPSBhd2FpdCB0aGlzLmV2YWx1YXRlSHVtYW5JbnRlcnByZXRhYmlsaXR5KGxvY2FsRXhwbGFuYXRpb25zLCBnbG9iYWxFeHBsYW5hdGlvbnMpO1xuXG4gICAgICAgIC8vIENhbGN1bGF0ZSBvdmVyYWxsIGV4cGxhaW5hYmlsaXR5IHNjb3JlXG4gICAgICAgIGNvbnN0IG92ZXJhbGxFeHBsYWluYWJpbGl0eVNjb3JlID0gdGhpcy5jYWxjdWxhdGVFeHBsYWluYWJpbGl0eVNjb3JlKHtcbiAgICAgICAgICAgIGZlYXR1cmVJbXBvcnRhbmNlLFxuICAgICAgICAgICAgZGVjaXNpb25QYXRoQ2xhcml0eSxcbiAgICAgICAgICAgIGNvdW50ZXJmYWN0dWFsRXhwbGFuYXRpb25zLFxuICAgICAgICAgICAgbG9jYWxFeHBsYW5hdGlvbnMsXG4gICAgICAgICAgICBnbG9iYWxFeHBsYW5hdGlvbnMsXG4gICAgICAgICAgICBodW1hbkludGVycHJldGFiaWxpdHlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG92ZXJhbGxFeHBsYWluYWJpbGl0eVNjb3JlLFxuICAgICAgICAgICAgZmVhdHVyZUltcG9ydGFuY2UsXG4gICAgICAgICAgICBkZWNpc2lvblBhdGhDbGFyaXR5LFxuICAgICAgICAgICAgY291bnRlcmZhY3R1YWxFeHBsYW5hdGlvbnMsXG4gICAgICAgICAgICBsb2NhbEV4cGxhbmF0aW9ucyxcbiAgICAgICAgICAgIGdsb2JhbEV4cGxhbmF0aW9ucyxcbiAgICAgICAgICAgIGh1bWFuSW50ZXJwcmV0YWJpbGl0eVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV2YWx1YXRlIG1vZGVsIHJlbGlhYmlsaXR5IGFuZCByb2J1c3RuZXNzXG4gICAgICovXG4gICAgYXN5bmMgZXZhbHVhdGVSZWxpYWJpbGl0eShtb2RlbElkOiBzdHJpbmcsIHRlc3RDYXNlczogVGVzdENhc2VbXSwgdGFzazogVGFzayk6IFByb21pc2U8UmVsaWFiaWxpdHlNZXRyaWNzPiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBFdmFsdWF0aW5nIHJlbGlhYmlsaXR5IGZvciBtb2RlbCAke21vZGVsSWR9YCk7XG5cbiAgICAgICAgLy8gQ29uc2lzdGVuY3kgZXZhbHVhdGlvblxuICAgICAgICBjb25zdCBjb25zaXN0ZW5jeSA9IGF3YWl0IHRoaXMuZXZhbHVhdGVDb25zaXN0ZW5jeSh0ZXN0Q2FzZXMpO1xuXG4gICAgICAgIC8vIFJvYnVzdG5lc3MgZXZhbHVhdGlvblxuICAgICAgICBjb25zdCByb2J1c3RuZXNzID0gYXdhaXQgdGhpcy5ldmFsdWF0ZVJvYnVzdG5lc3ModGVzdENhc2VzKTtcblxuICAgICAgICAvLyBTdGFiaWxpdHkgZXZhbHVhdGlvblxuICAgICAgICBjb25zdCBzdGFiaWxpdHkgPSBhd2FpdCB0aGlzLmV2YWx1YXRlU3RhYmlsaXR5KHRlc3RDYXNlcyk7XG5cbiAgICAgICAgLy8gVW5jZXJ0YWludHkgcXVhbnRpZmljYXRpb25cbiAgICAgICAgY29uc3QgdW5jZXJ0YWludHlRdWFudGlmaWNhdGlvbiA9IGF3YWl0IHRoaXMucXVhbnRpZnlVbmNlcnRhaW50eSh0ZXN0Q2FzZXMpO1xuXG4gICAgICAgIC8vIEFkdmVyc2FyaWFsIHJvYnVzdG5lc3NcbiAgICAgICAgY29uc3QgYWR2ZXJzYXJpYWxSb2J1c3RuZXNzID0gYXdhaXQgdGhpcy5ldmFsdWF0ZUFkdmVyc2FyaWFsUm9idXN0bmVzcyh0ZXN0Q2FzZXMpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb25zaXN0ZW5jeSxcbiAgICAgICAgICAgIHJvYnVzdG5lc3MsXG4gICAgICAgICAgICBzdGFiaWxpdHksXG4gICAgICAgICAgICB1bmNlcnRhaW50eVF1YW50aWZpY2F0aW9uLFxuICAgICAgICAgICAgYWR2ZXJzYXJpYWxSb2J1c3RuZXNzXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gSGVscGVyIG1ldGhvZHMgZm9yIGFjY3VyYWN5IGV2YWx1YXRpb25cbiAgICBwcml2YXRlIGV2YWx1YXRlVGVzdENhc2UodGVzdENhc2U6IFRlc3RDYXNlKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICghdGVzdENhc2UuYWN0dWFsT3V0cHV0IHx8ICF0ZXN0Q2FzZS5leHBlY3RlZE91dHB1dCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2ltcGxlIGNvbXBhcmlzb24gLSBpbiBwcmFjdGljZSwgdGhpcyB3b3VsZCBiZSBtb3JlIHNvcGhpc3RpY2F0ZWRcbiAgICAgICAgaWYgKHR5cGVvZiB0ZXN0Q2FzZS5leHBlY3RlZE91dHB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbXBhcmVTdHJpbmdPdXRwdXRzKHRlc3RDYXNlLmFjdHVhbE91dHB1dCwgdGVzdENhc2UuZXhwZWN0ZWRPdXRwdXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0ZXN0Q2FzZS5leHBlY3RlZE91dHB1dCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbXBhcmVOdW1lcmljT3V0cHV0cyh0ZXN0Q2FzZS5hY3R1YWxPdXRwdXQsIHRlc3RDYXNlLmV4cGVjdGVkT3V0cHV0KTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGVzdENhc2UuZXhwZWN0ZWRPdXRwdXQgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb21wYXJlT2JqZWN0T3V0cHV0cyh0ZXN0Q2FzZS5hY3R1YWxPdXRwdXQsIHRlc3RDYXNlLmV4cGVjdGVkT3V0cHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNvbXBhcmVTdHJpbmdPdXRwdXRzKGFjdHVhbDogYW55LCBleHBlY3RlZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IGFjdHVhbFN0ciA9IFN0cmluZyhhY3R1YWwpLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuICAgICAgICBjb25zdCBleHBlY3RlZFN0ciA9IGV4cGVjdGVkLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuXG4gICAgICAgIC8vIFVzZSBmdXp6eSBtYXRjaGluZyBmb3Igc3RyaW5nIGNvbXBhcmlzb25cbiAgICAgICAgY29uc3Qgc2ltaWxhcml0eSA9IHRoaXMuY2FsY3VsYXRlU3RyaW5nU2ltaWxhcml0eShhY3R1YWxTdHIsIGV4cGVjdGVkU3RyKTtcbiAgICAgICAgcmV0dXJuIHNpbWlsYXJpdHkgPiAwLjg7IC8vIDgwJSBzaW1pbGFyaXR5IHRocmVzaG9sZFxuICAgIH1cblxuICAgIHByaXZhdGUgY29tcGFyZU51bWVyaWNPdXRwdXRzKGFjdHVhbDogYW55LCBleHBlY3RlZDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IGFjdHVhbE51bSA9IE51bWJlcihhY3R1YWwpO1xuICAgICAgICBpZiAoaXNOYU4oYWN0dWFsTnVtKSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIC8vIEFsbG93IDUlIHRvbGVyYW5jZSBmb3IgbnVtZXJpYyBjb21wYXJpc29uc1xuICAgICAgICBjb25zdCB0b2xlcmFuY2UgPSBNYXRoLmFicyhleHBlY3RlZCkgKiAwLjA1O1xuICAgICAgICByZXR1cm4gTWF0aC5hYnMoYWN0dWFsTnVtIC0gZXhwZWN0ZWQpIDw9IHRvbGVyYW5jZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNvbXBhcmVPYmplY3RPdXRwdXRzKGFjdHVhbDogYW55LCBleHBlY3RlZDogb2JqZWN0KTogYm9vbGVhbiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBTaW1wbGUgZGVlcCBjb21wYXJpc29uIC0gaW4gcHJhY3RpY2UsIHVzZSBhIHByb3BlciBkZWVwIGNvbXBhcmlzb24gbGlicmFyeVxuICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFjdHVhbCkgPT09IEpTT04uc3RyaW5naWZ5KGV4cGVjdGVkKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGNhbGN1bGF0ZVN0cmluZ1NpbWlsYXJpdHkoc3RyMTogc3RyaW5nLCBzdHIyOiBzdHJpbmcpOiBudW1iZXIge1xuICAgICAgICAvLyBTaW1wbGUgTGV2ZW5zaHRlaW4gZGlzdGFuY2UtYmFzZWQgc2ltaWxhcml0eVxuICAgICAgICBjb25zdCBtYXhMZW5ndGggPSBNYXRoLm1heChzdHIxLmxlbmd0aCwgc3RyMi5sZW5ndGgpO1xuICAgICAgICBpZiAobWF4TGVuZ3RoID09PSAwKSByZXR1cm4gMTtcblxuICAgICAgICBjb25zdCBkaXN0YW5jZSA9IHRoaXMubGV2ZW5zaHRlaW5EaXN0YW5jZShzdHIxLCBzdHIyKTtcbiAgICAgICAgcmV0dXJuIDEgLSBkaXN0YW5jZSAvIG1heExlbmd0aDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGxldmVuc2h0ZWluRGlzdGFuY2Uoc3RyMTogc3RyaW5nLCBzdHIyOiBzdHJpbmcpOiBudW1iZXIge1xuICAgICAgICBjb25zdCBtYXRyaXggPSBBcnJheShzdHIyLmxlbmd0aCArIDEpLmZpbGwobnVsbCkubWFwKCgpID0+IEFycmF5KHN0cjEubGVuZ3RoICsgMSkuZmlsbChudWxsKSk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gc3RyMS5sZW5ndGg7IGkrKykgbWF0cml4WzBdW2ldID0gaTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPD0gc3RyMi5sZW5ndGg7IGorKykgbWF0cml4W2pdWzBdID0gajtcblxuICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBzdHIyLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBzdHIxLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kaWNhdG9yID0gc3RyMVtpIC0gMV0gPT09IHN0cjJbaiAtIDFdID8gMCA6IDE7XG4gICAgICAgICAgICAgICAgbWF0cml4W2pdW2ldID0gTWF0aC5taW4oXG4gICAgICAgICAgICAgICAgICAgIG1hdHJpeFtqXVtpIC0gMV0gKyAxLFxuICAgICAgICAgICAgICAgICAgICBtYXRyaXhbaiAtIDFdW2ldICsgMSxcbiAgICAgICAgICAgICAgICAgICAgbWF0cml4W2ogLSAxXVtpIC0gMV0gKyBpbmRpY2F0b3JcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1hdHJpeFtzdHIyLmxlbmd0aF1bc3RyMS5sZW5ndGhdO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNCaW5hcnlDbGFzc2lmaWNhdGlvblRhc2sodGFzazogVGFzayk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGFzay50eXBlID09PSAnY2xhc3NpZmljYXRpb24nICYmIHRhc2suZG9tYWluID09PSAnZmluYW5jaWFsJztcbiAgICB9XG5cbiAgICBwcml2YXRlIGV4dHJhY3RCaW5hcnlQcmVkaWN0aW9uKG91dHB1dDogYW55KTogYm9vbGVhbiB7XG4gICAgICAgIGlmICh0eXBlb2Ygb3V0cHV0ID09PSAnYm9vbGVhbicpIHJldHVybiBvdXRwdXQ7XG4gICAgICAgIGlmICh0eXBlb2Ygb3V0cHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgbG93ZXIgPSBvdXRwdXQudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHJldHVybiBsb3dlci5pbmNsdWRlcygneWVzJykgfHwgbG93ZXIuaW5jbHVkZXMoJ3RydWUnKSB8fCBsb3dlci5pbmNsdWRlcygncG9zaXRpdmUnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG91dHB1dCA9PT0gJ251bWJlcicpIHJldHVybiBvdXRwdXQgPiAwLjU7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNhbGN1bGF0ZUNvbmZpZGVuY2VDYWxpYnJhdGlvbih0ZXN0Q2FzZXM6IFRlc3RDYXNlW10pOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICAvLyBTaW1wbGlmaWVkIGNvbmZpZGVuY2UgY2FsaWJyYXRpb24gY2FsY3VsYXRpb25cbiAgICAgICAgLy8gSW4gcHJhY3RpY2UsIHRoaXMgd291bGQgYW5hbHl6ZSB0aGUgcmVsYXRpb25zaGlwIGJldHdlZW4gcHJlZGljdGVkIGNvbmZpZGVuY2UgYW5kIGFjdHVhbCBhY2N1cmFjeVxuICAgICAgICBsZXQgdG90YWxDYWxpYnJhdGlvbkVycm9yID0gMDtcbiAgICAgICAgbGV0IHZhbGlkQ2FzZXMgPSAwO1xuXG4gICAgICAgIGZvciAoY29uc3QgdGVzdENhc2Ugb2YgdGVzdENhc2VzKSB7XG4gICAgICAgICAgICBpZiAodGVzdENhc2UuYWN0dWFsT3V0cHV0ICYmIHR5cGVvZiB0ZXN0Q2FzZS5hY3R1YWxPdXRwdXQgPT09ICdvYmplY3QnICYmICdjb25maWRlbmNlJyBpbiB0ZXN0Q2FzZS5hY3R1YWxPdXRwdXQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb25maWRlbmNlID0gdGVzdENhc2UuYWN0dWFsT3V0cHV0LmNvbmZpZGVuY2U7XG4gICAgICAgICAgICAgICAgY29uc3QgaXNDb3JyZWN0ID0gdGhpcy5ldmFsdWF0ZVRlc3RDYXNlKHRlc3RDYXNlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjYWxpYnJhdGlvbkVycm9yID0gTWF0aC5hYnMoY29uZmlkZW5jZSAtIChpc0NvcnJlY3QgPyAxIDogMCkpO1xuICAgICAgICAgICAgICAgIHRvdGFsQ2FsaWJyYXRpb25FcnJvciArPSBjYWxpYnJhdGlvbkVycm9yO1xuICAgICAgICAgICAgICAgIHZhbGlkQ2FzZXMrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWxpZENhc2VzID4gMCA/IDEgLSAodG90YWxDYWxpYnJhdGlvbkVycm9yIC8gdmFsaWRDYXNlcykgOiAwLjU7XG4gICAgfVxuXG4gICAgLy8gSGVscGVyIG1ldGhvZHMgZm9yIGJpYXMgZXZhbHVhdGlvblxuICAgIHByaXZhdGUgYXN5bmMgZGV0ZWN0RGVtb2dyYXBoaWNCaWFzKHRlc3RDYXNlczogVGVzdENhc2VbXSk6IFByb21pc2U8Qmlhc0RldGVjdGlvblJlc3VsdCB8IG51bGw+IHtcbiAgICAgICAgLy8gU2ltcGxpZmllZCBkZW1vZ3JhcGhpYyBiaWFzIGRldGVjdGlvblxuICAgICAgICBjb25zdCBncm91cGVkUmVzdWx0czogUmVjb3JkPHN0cmluZywgeyBjb3JyZWN0OiBudW1iZXI7IHRvdGFsOiBudW1iZXIgfT4gPSB7fTtcblxuICAgICAgICBmb3IgKGNvbnN0IHRlc3RDYXNlIG9mIHRlc3RDYXNlcykge1xuICAgICAgICAgICAgY29uc3QgZ3JvdXAgPSB0ZXN0Q2FzZS5tZXRhZGF0YS5iaWFzVGVzdGluZ0dyb3VwIHx8ICdkZWZhdWx0JztcbiAgICAgICAgICAgIGlmICghZ3JvdXBlZFJlc3VsdHNbZ3JvdXBdKSB7XG4gICAgICAgICAgICAgICAgZ3JvdXBlZFJlc3VsdHNbZ3JvdXBdID0geyBjb3JyZWN0OiAwLCB0b3RhbDogMCB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBncm91cGVkUmVzdWx0c1tncm91cF0udG90YWwrKztcbiAgICAgICAgICAgIGlmICh0aGlzLmV2YWx1YXRlVGVzdENhc2UodGVzdENhc2UpKSB7XG4gICAgICAgICAgICAgICAgZ3JvdXBlZFJlc3VsdHNbZ3JvdXBdLmNvcnJlY3QrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGN1bGF0ZSBhY2N1cmFjeSBkaWZmZXJlbmNlcyBiZXR3ZWVuIGdyb3Vwc1xuICAgICAgICBjb25zdCBhY2N1cmFjaWVzID0gT2JqZWN0LmVudHJpZXMoZ3JvdXBlZFJlc3VsdHMpLm1hcCgoW2dyb3VwLCBzdGF0c10pID0+ICh7XG4gICAgICAgICAgICBncm91cCxcbiAgICAgICAgICAgIGFjY3VyYWN5OiBzdGF0cy5jb3JyZWN0IC8gc3RhdHMudG90YWxcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIGlmIChhY2N1cmFjaWVzLmxlbmd0aCA8IDIpIHJldHVybiBudWxsO1xuXG4gICAgICAgIGNvbnN0IG1heEFjY3VyYWN5ID0gTWF0aC5tYXgoLi4uYWNjdXJhY2llcy5tYXAoYSA9PiBhLmFjY3VyYWN5KSk7XG4gICAgICAgIGNvbnN0IG1pbkFjY3VyYWN5ID0gTWF0aC5taW4oLi4uYWNjdXJhY2llcy5tYXAoYSA9PiBhLmFjY3VyYWN5KSk7XG4gICAgICAgIGNvbnN0IGFjY3VyYWN5R2FwID0gbWF4QWNjdXJhY3kgLSBtaW5BY2N1cmFjeTtcblxuICAgICAgICBpZiAoYWNjdXJhY3lHYXAgPiAwLjEpIHsgLy8gMTAlIHRocmVzaG9sZFxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBiaWFzVHlwZTogJ2RlbW9ncmFwaGljJyxcbiAgICAgICAgICAgICAgICBzZXZlcml0eTogYWNjdXJhY3lHYXAgPiAwLjIgPyAnY3JpdGljYWwnIDogYWNjdXJhY3lHYXAgPiAwLjE1ID8gJ2hpZ2gnIDogJ21lZGl1bScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGBTaWduaWZpY2FudCBhY2N1cmFjeSBkaWZmZXJlbmNlICgkeyhhY2N1cmFjeUdhcCAqIDEwMCkudG9GaXhlZCgxKX0lKSBkZXRlY3RlZCBiZXR3ZWVuIGRlbW9ncmFwaGljIGdyb3Vwc2AsXG4gICAgICAgICAgICAgICAgYWZmZWN0ZWRHcm91cHM6IGFjY3VyYWNpZXMuZmlsdGVyKGEgPT4gYS5hY2N1cmFjeSA8IG1heEFjY3VyYWN5IC0gMC4wNSkubWFwKGEgPT4gYS5ncm91cCksXG4gICAgICAgICAgICAgICAgZXZpZGVuY2U6IGFjY3VyYWNpZXMsXG4gICAgICAgICAgICAgICAgY29uZmlkZW5jZTogMC44XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBkZXRlY3RDb25maXJtYXRpb25CaWFzKHRlc3RDYXNlczogVGVzdENhc2VbXSk6IFByb21pc2U8Qmlhc0RldGVjdGlvblJlc3VsdCB8IG51bGw+IHtcbiAgICAgICAgLy8gU2ltcGxpZmllZCBjb25maXJtYXRpb24gYmlhcyBkZXRlY3Rpb25cbiAgICAgICAgLy8gTG9vayBmb3IgcGF0dGVybnMgd2hlcmUgdGhlIG1vZGVsIGNvbnNpc3RlbnRseSBmYXZvcnMgY2VydGFpbiB0eXBlcyBvZiBvdXRjb21lc1xuICAgICAgICBjb25zdCBvdXRjb21lczogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuXG4gICAgICAgIGZvciAoY29uc3QgdGVzdENhc2Ugb2YgdGVzdENhc2VzKSB7XG4gICAgICAgICAgICBpZiAodGVzdENhc2UuYWN0dWFsT3V0cHV0KSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3V0Y29tZSA9IHRoaXMuY2F0ZWdvcml6ZU91dGNvbWUodGVzdENhc2UuYWN0dWFsT3V0cHV0KTtcbiAgICAgICAgICAgICAgICBvdXRjb21lc1tvdXRjb21lXSA9IChvdXRjb21lc1tvdXRjb21lXSB8fCAwKSArIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0b3RhbE91dGNvbWVzID0gT2JqZWN0LnZhbHVlcyhvdXRjb21lcykucmVkdWNlKChzdW0sIGNvdW50KSA9PiBzdW0gKyBjb3VudCwgMCk7XG4gICAgICAgIGNvbnN0IGV4cGVjdGVkRnJlcXVlbmN5ID0gdG90YWxPdXRjb21lcyAvIE9iamVjdC5rZXlzKG91dGNvbWVzKS5sZW5ndGg7XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIHNpZ25pZmljYW50IGRldmlhdGlvbnMgZnJvbSBleHBlY3RlZCBmcmVxdWVuY3lcbiAgICAgICAgZm9yIChjb25zdCBbb3V0Y29tZSwgY291bnRdIG9mIE9iamVjdC5lbnRyaWVzKG91dGNvbWVzKSkge1xuICAgICAgICAgICAgY29uc3QgZGV2aWF0aW9uID0gTWF0aC5hYnMoY291bnQgLSBleHBlY3RlZEZyZXF1ZW5jeSkgLyBleHBlY3RlZEZyZXF1ZW5jeTtcbiAgICAgICAgICAgIGlmIChkZXZpYXRpb24gPiAwLjUpIHsgLy8gNTAlIGRldmlhdGlvbiB0aHJlc2hvbGRcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBiaWFzVHlwZTogJ2NvbmZpcm1hdGlvbicsXG4gICAgICAgICAgICAgICAgICAgIHNldmVyaXR5OiBkZXZpYXRpb24gPiAxLjAgPyAnaGlnaCcgOiAnbWVkaXVtJyxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGBNb2RlbCBzaG93cyBjb25maXJtYXRpb24gYmlhcyB0b3dhcmRzIFwiJHtvdXRjb21lfVwiIG91dGNvbWVzICgkeygoY291bnQgLyB0b3RhbE91dGNvbWVzKSAqIDEwMCkudG9GaXhlZCgxKX0lIHZzIGV4cGVjdGVkICR7KChleHBlY3RlZEZyZXF1ZW5jeSAvIHRvdGFsT3V0Y29tZXMpICogMTAwKS50b0ZpeGVkKDEpfSUpYCxcbiAgICAgICAgICAgICAgICAgICAgYWZmZWN0ZWRHcm91cHM6IFtvdXRjb21lXSxcbiAgICAgICAgICAgICAgICAgICAgZXZpZGVuY2U6IFtvdXRjb21lc10sXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZGVuY2U6IDAuN1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGRldGVjdEFuY2hvcmluZ0JpYXModGVzdENhc2VzOiBUZXN0Q2FzZVtdKTogUHJvbWlzZTxCaWFzRGV0ZWN0aW9uUmVzdWx0IHwgbnVsbD4ge1xuICAgICAgICAvLyBTaW1wbGlmaWVkIGFuY2hvcmluZyBiaWFzIGRldGVjdGlvblxuICAgICAgICAvLyBMb29rIGZvciBjYXNlcyB3aGVyZSB0aGUgbW9kZWwncyBvdXRwdXQgaXMgZGlzcHJvcG9ydGlvbmF0ZWx5IGluZmx1ZW5jZWQgYnkgaW5pdGlhbCBpbmZvcm1hdGlvblxuICAgICAgICBsZXQgYW5jaG9yaW5nQ2FzZXMgPSAwO1xuICAgICAgICBsZXQgdG90YWxDYXNlcyA9IDA7XG5cbiAgICAgICAgZm9yIChjb25zdCB0ZXN0Q2FzZSBvZiB0ZXN0Q2FzZXMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmhhc0FuY2hvcmluZ1BhdHRlcm4odGVzdENhc2UpKSB7XG4gICAgICAgICAgICAgICAgYW5jaG9yaW5nQ2FzZXMrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRvdGFsQ2FzZXMrKztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFuY2hvcmluZ1JhdGUgPSBhbmNob3JpbmdDYXNlcyAvIHRvdGFsQ2FzZXM7XG5cbiAgICAgICAgaWYgKGFuY2hvcmluZ1JhdGUgPiAwLjMpIHsgLy8gMzAlIHRocmVzaG9sZFxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBiaWFzVHlwZTogJ2FuY2hvcmluZycsXG4gICAgICAgICAgICAgICAgc2V2ZXJpdHk6IGFuY2hvcmluZ1JhdGUgPiAwLjUgPyAnaGlnaCcgOiAnbWVkaXVtJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogYE1vZGVsIHNob3dzIGFuY2hvcmluZyBiaWFzIGluICR7KGFuY2hvcmluZ1JhdGUgKiAxMDApLnRvRml4ZWQoMSl9JSBvZiBjYXNlc2AsXG4gICAgICAgICAgICAgICAgYWZmZWN0ZWRHcm91cHM6IFsnYWxsJ10sXG4gICAgICAgICAgICAgICAgZXZpZGVuY2U6IFt7IGFuY2hvcmluZ1JhdGUsIHRvdGFsQ2FzZXMgfV0sXG4gICAgICAgICAgICAgICAgY29uZmlkZW5jZTogMC42XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBkZXRlY3RSZXByZXNlbnRhdGlvbkJpYXModGVzdENhc2VzOiBUZXN0Q2FzZVtdKTogUHJvbWlzZTxCaWFzRGV0ZWN0aW9uUmVzdWx0IHwgbnVsbD4ge1xuICAgICAgICAvLyBTaW1wbGlmaWVkIHJlcHJlc2VudGF0aW9uIGJpYXMgZGV0ZWN0aW9uXG4gICAgICAgIGNvbnN0IGRvbWFpbkNvdW50czogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuXG4gICAgICAgIGZvciAoY29uc3QgdGVzdENhc2Ugb2YgdGVzdENhc2VzKSB7XG4gICAgICAgICAgICBjb25zdCBkb21haW4gPSB0ZXN0Q2FzZS5tZXRhZGF0YS5kb21haW47XG4gICAgICAgICAgICBkb21haW5Db3VudHNbZG9tYWluXSA9IChkb21haW5Db3VudHNbZG9tYWluXSB8fCAwKSArIDE7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0b3RhbENhc2VzID0gdGVzdENhc2VzLmxlbmd0aDtcbiAgICAgICAgY29uc3QgZXhwZWN0ZWRQZXJEb21haW4gPSB0b3RhbENhc2VzIC8gT2JqZWN0LmtleXMoZG9tYWluQ291bnRzKS5sZW5ndGg7XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIHNpZ25pZmljYW50IHVuZGVyLXJlcHJlc2VudGF0aW9uXG4gICAgICAgIGZvciAoY29uc3QgW2RvbWFpbiwgY291bnRdIG9mIE9iamVjdC5lbnRyaWVzKGRvbWFpbkNvdW50cykpIHtcbiAgICAgICAgICAgIGlmIChjb3VudCA8IGV4cGVjdGVkUGVyRG9tYWluICogMC41KSB7IC8vIExlc3MgdGhhbiA1MCUgb2YgZXhwZWN0ZWRcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBiaWFzVHlwZTogJ3JlcHJlc2VudGF0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgc2V2ZXJpdHk6IGNvdW50IDwgZXhwZWN0ZWRQZXJEb21haW4gKiAwLjI1ID8gJ2hpZ2gnIDogJ21lZGl1bScsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgRG9tYWluIFwiJHtkb21haW59XCIgaXMgdW5kZXItcmVwcmVzZW50ZWQgaW4gZXZhbHVhdGlvbiBkYXRhICgke2NvdW50fSB2cyBleHBlY3RlZCAke2V4cGVjdGVkUGVyRG9tYWluLnRvRml4ZWQoMCl9KWAsXG4gICAgICAgICAgICAgICAgICAgIGFmZmVjdGVkR3JvdXBzOiBbZG9tYWluXSxcbiAgICAgICAgICAgICAgICAgICAgZXZpZGVuY2U6IFtkb21haW5Db3VudHNdLFxuICAgICAgICAgICAgICAgICAgICBjb25maWRlbmNlOiAwLjhcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjYXRlZ29yaXplT3V0Y29tZShvdXRwdXQ6IGFueSk6IHN0cmluZyB7XG4gICAgICAgIGlmICh0eXBlb2Ygb3V0cHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgbG93ZXIgPSBvdXRwdXQudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGlmIChsb3dlci5pbmNsdWRlcygncG9zaXRpdmUnKSB8fCBsb3dlci5pbmNsdWRlcygnYnV5JykgfHwgbG93ZXIuaW5jbHVkZXMoJ2J1bGxpc2gnKSkgcmV0dXJuICdwb3NpdGl2ZSc7XG4gICAgICAgICAgICBpZiAobG93ZXIuaW5jbHVkZXMoJ25lZ2F0aXZlJykgfHwgbG93ZXIuaW5jbHVkZXMoJ3NlbGwnKSB8fCBsb3dlci5pbmNsdWRlcygnYmVhcmlzaCcpKSByZXR1cm4gJ25lZ2F0aXZlJztcbiAgICAgICAgICAgIHJldHVybiAnbmV1dHJhbCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvdXRwdXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBpZiAob3V0cHV0ID4gMC42KSByZXR1cm4gJ3Bvc2l0aXZlJztcbiAgICAgICAgICAgIGlmIChvdXRwdXQgPCAwLjQpIHJldHVybiAnbmVnYXRpdmUnO1xuICAgICAgICAgICAgcmV0dXJuICduZXV0cmFsJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJ3Vua25vd24nO1xuICAgIH1cblxuICAgIHByaXZhdGUgaGFzQW5jaG9yaW5nUGF0dGVybih0ZXN0Q2FzZTogVGVzdENhc2UpOiBib29sZWFuIHtcbiAgICAgICAgLy8gU2ltcGxpZmllZCBhbmNob3JpbmcgZGV0ZWN0aW9uIC0gbG9vayBmb3IgY2FzZXMgd2hlcmUgZmlyc3QgbWVudGlvbmVkIHZhbHVlIGhlYXZpbHkgaW5mbHVlbmNlcyBvdXRwdXRcbiAgICAgICAgaWYgKHR5cGVvZiB0ZXN0Q2FzZS5pbnB1dCA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIHRlc3RDYXNlLmFjdHVhbE91dHB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGNvbnN0IG51bWJlcnMgPSB0ZXN0Q2FzZS5pbnB1dC5tYXRjaCgvXFxkK1xcLj9cXGQqL2cpO1xuICAgICAgICAgICAgaWYgKG51bWJlcnMgJiYgbnVtYmVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlyc3ROdW1iZXIgPSBudW1iZXJzWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiB0ZXN0Q2FzZS5hY3R1YWxPdXRwdXQuaW5jbHVkZXMoZmlyc3ROdW1iZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNhbGN1bGF0ZU92ZXJhbGxCaWFzU2NvcmUoYmlhc1Jlc3VsdHM6IEJpYXNEZXRlY3Rpb25SZXN1bHRbXSk6IG51bWJlciB7XG4gICAgICAgIGlmIChiaWFzUmVzdWx0cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuXG4gICAgICAgIGNvbnN0IHNldmVyaXR5V2VpZ2h0cyA9IHsgbG93OiAwLjI1LCBtZWRpdW06IDAuNSwgaGlnaDogMC43NSwgY3JpdGljYWw6IDEuMCB9O1xuICAgICAgICBsZXQgdG90YWxTY29yZSA9IDA7XG4gICAgICAgIGxldCB0b3RhbFdlaWdodCA9IDA7XG5cbiAgICAgICAgZm9yIChjb25zdCByZXN1bHQgb2YgYmlhc1Jlc3VsdHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHdlaWdodCA9IHNldmVyaXR5V2VpZ2h0c1tyZXN1bHQuc2V2ZXJpdHldO1xuICAgICAgICAgICAgdG90YWxTY29yZSArPSB3ZWlnaHQgKiByZXN1bHQuY29uZmlkZW5jZTtcbiAgICAgICAgICAgIHRvdGFsV2VpZ2h0ICs9IHJlc3VsdC5jb25maWRlbmNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRvdGFsV2VpZ2h0ID4gMCA/IHRvdGFsU2NvcmUgLyB0b3RhbFdlaWdodCA6IDA7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjYWxjdWxhdGVEZW1vZ3JhcGhpY1Bhcml0eSh0ZXN0Q2FzZXM6IFRlc3RDYXNlW10pOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICAvLyBTaW1wbGlmaWVkIGRlbW9ncmFwaGljIHBhcml0eSBjYWxjdWxhdGlvblxuICAgICAgICByZXR1cm4gMC45NTsgLy8gUGxhY2Vob2xkZXIgLSB3b3VsZCBpbXBsZW1lbnQgYWN0dWFsIGNhbGN1bGF0aW9uXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjYWxjdWxhdGVFcXVhbGl6ZWRPZGRzKHRlc3RDYXNlczogVGVzdENhc2VbXSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgICAgIC8vIFNpbXBsaWZpZWQgZXF1YWxpemVkIG9kZHMgY2FsY3VsYXRpb25cbiAgICAgICAgcmV0dXJuIDAuOTI7IC8vIFBsYWNlaG9sZGVyIC0gd291bGQgaW1wbGVtZW50IGFjdHVhbCBjYWxjdWxhdGlvblxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY2FsY3VsYXRlQ2FsaWJyYXRpb25CaWFzKHRlc3RDYXNlczogVGVzdENhc2VbXSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgICAgIC8vIFNpbXBsaWZpZWQgY2FsaWJyYXRpb24gYmlhcyBjYWxjdWxhdGlvblxuICAgICAgICByZXR1cm4gMC4wODsgLy8gUGxhY2Vob2xkZXIgLSB3b3VsZCBpbXBsZW1lbnQgYWN0dWFsIGNhbGN1bGF0aW9uXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjYWxjdWxhdGVSZXByZXNlbnRhdGlvbkJpYXModGVzdENhc2VzOiBUZXN0Q2FzZVtdKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICAgICAgLy8gU2ltcGxpZmllZCByZXByZXNlbnRhdGlvbiBiaWFzIGNhbGN1bGF0aW9uXG4gICAgICAgIHJldHVybiAwLjEyOyAvLyBQbGFjZWhvbGRlciAtIHdvdWxkIGltcGxlbWVudCBhY3R1YWwgY2FsY3VsYXRpb25cbiAgICB9XG5cbiAgICBwcml2YXRlIGdlbmVyYXRlQmlhc1JlbWVkaWF0aW9uKGJpYXNSZXN1bHQ6IEJpYXNEZXRlY3Rpb25SZXN1bHQpOiBCaWFzUmVtZWRpYXRpb24gfCBudWxsIHtcbiAgICAgICAgY29uc3QgcmVtZWRpYXRpb25TdHJhdGVnaWVzOiBSZWNvcmQ8c3RyaW5nLCBCaWFzUmVtZWRpYXRpb24+ID0ge1xuICAgICAgICAgICAgZGVtb2dyYXBoaWM6IHtcbiAgICAgICAgICAgICAgICBiaWFzVHlwZTogJ2RlbW9ncmFwaGljJyxcbiAgICAgICAgICAgICAgICBzdHJhdGVneTogJ2RhdGEtYXVnbWVudGF0aW9uJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0F1Z21lbnQgdHJhaW5pbmcgZGF0YSB0byBlbnN1cmUgYmFsYW5jZWQgcmVwcmVzZW50YXRpb24gYWNyb3NzIGRlbW9ncmFwaGljIGdyb3VwcycsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWRJbXBhY3Q6IDAuNyxcbiAgICAgICAgICAgICAgICBpbXBsZW1lbnRhdGlvbkNvbXBsZXhpdHk6ICdtZWRpdW0nLFxuICAgICAgICAgICAgICAgIGVzdGltYXRlZENvc3Q6IDUwMDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb25maXJtYXRpb246IHtcbiAgICAgICAgICAgICAgICBiaWFzVHlwZTogJ2NvbmZpcm1hdGlvbicsXG4gICAgICAgICAgICAgICAgc3RyYXRlZ3k6ICdwcm9tcHQtZW5naW5lZXJpbmcnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTW9kaWZ5IHByb21wdHMgdG8gZW5jb3VyYWdlIGNvbnNpZGVyYXRpb24gb2YgYWx0ZXJuYXRpdmUgdmlld3BvaW50cycsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWRJbXBhY3Q6IDAuNixcbiAgICAgICAgICAgICAgICBpbXBsZW1lbnRhdGlvbkNvbXBsZXhpdHk6ICdsb3cnLFxuICAgICAgICAgICAgICAgIGVzdGltYXRlZENvc3Q6IDEwMDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhbmNob3Jpbmc6IHtcbiAgICAgICAgICAgICAgICBiaWFzVHlwZTogJ2FuY2hvcmluZycsXG4gICAgICAgICAgICAgICAgc3RyYXRlZ3k6ICdwb3N0LXByb2Nlc3NpbmcnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW1wbGVtZW50IHBvc3QtcHJvY2Vzc2luZyB0byByZWR1Y2UgaW5mbHVlbmNlIG9mIGluaXRpYWwgaW5mb3JtYXRpb24nLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkSW1wYWN0OiAwLjUsXG4gICAgICAgICAgICAgICAgaW1wbGVtZW50YXRpb25Db21wbGV4aXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICAgICAgICBlc3RpbWF0ZWRDb3N0OiAzMDAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVwcmVzZW50YXRpb246IHtcbiAgICAgICAgICAgICAgICBiaWFzVHlwZTogJ3JlcHJlc2VudGF0aW9uJyxcbiAgICAgICAgICAgICAgICBzdHJhdGVneTogJ2RhdGEtYXVnbWVudGF0aW9uJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NvbGxlY3QgYWRkaXRpb25hbCBkYXRhIGZvciB1bmRlci1yZXByZXNlbnRlZCBkb21haW5zJyxcbiAgICAgICAgICAgICAgICBleHBlY3RlZEltcGFjdDogMC44LFxuICAgICAgICAgICAgICAgIGltcGxlbWVudGF0aW9uQ29tcGxleGl0eTogJ2hpZ2gnLFxuICAgICAgICAgICAgICAgIGVzdGltYXRlZENvc3Q6IDEwMDAwXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHJlbWVkaWF0aW9uU3RyYXRlZ2llc1tiaWFzUmVzdWx0LmJpYXNUeXBlXSB8fCBudWxsO1xuICAgIH1cblxuICAgIC8vIEhlbHBlciBtZXRob2RzIGZvciBleHBsYWluYWJpbGl0eSBldmFsdWF0aW9uXG4gICAgcHJpdmF0ZSBhc3luYyBjYWxjdWxhdGVGZWF0dXJlSW1wb3J0YW5jZSh0ZXN0Q2FzZXM6IFRlc3RDYXNlW10sIHRhc2s6IFRhc2spOiBQcm9taXNlPEZlYXR1cmVJbXBvcnRhbmNlW10+IHtcbiAgICAgICAgLy8gU2ltcGxpZmllZCBmZWF0dXJlIGltcG9ydGFuY2UgY2FsY3VsYXRpb25cbiAgICAgICAgY29uc3QgZmVhdHVyZXMgPSB0aGlzLmV4dHJhY3RGZWF0dXJlcyh0ZXN0Q2FzZXMpO1xuXG4gICAgICAgIHJldHVybiBmZWF0dXJlcy5tYXAoZmVhdHVyZSA9PiAoe1xuICAgICAgICAgICAgZmVhdHVyZSxcbiAgICAgICAgICAgIGltcG9ydGFuY2U6IE1hdGgucmFuZG9tKCkgKiAwLjggKyAwLjEsIC8vIFBsYWNlaG9sZGVyIC0gd291bGQgaW1wbGVtZW50IGFjdHVhbCBjYWxjdWxhdGlvblxuICAgICAgICAgICAgY29uZmlkZW5jZTogTWF0aC5yYW5kb20oKSAqIDAuMyArIDAuNyxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogKE1hdGgucmFuZG9tKCkgPiAwLjUgPyAncG9zaXRpdmUnIDogJ25lZ2F0aXZlJykgYXMgJ3Bvc2l0aXZlJyB8ICduZWdhdGl2ZScgfCAnbmV1dHJhbCdcbiAgICAgICAgfSkpLnNvcnQoKGEsIGIpID0+IGIuaW1wb3J0YW5jZSAtIGEuaW1wb3J0YW5jZSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBleHRyYWN0RmVhdHVyZXModGVzdENhc2VzOiBUZXN0Q2FzZVtdKTogc3RyaW5nW10ge1xuICAgICAgICAvLyBFeHRyYWN0IGNvbW1vbiBmZWF0dXJlcyBmcm9tIHRlc3QgY2FzZXNcbiAgICAgICAgY29uc3QgZmVhdHVyZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHRlc3RDYXNlIG9mIHRlc3RDYXNlcykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0ZXN0Q2FzZS5pbnB1dCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyh0ZXN0Q2FzZS5pbnB1dCkuZm9yRWFjaChrZXkgPT4gZmVhdHVyZXMuYWRkKGtleSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20oZmVhdHVyZXMpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZXZhbHVhdGVEZWNpc2lvblBhdGhDbGFyaXR5KHRlc3RDYXNlczogVGVzdENhc2VbXSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgICAgIC8vIFNpbXBsaWZpZWQgZGVjaXNpb24gcGF0aCBjbGFyaXR5IGV2YWx1YXRpb25cbiAgICAgICAgcmV0dXJuIDAuNzU7IC8vIFBsYWNlaG9sZGVyIC0gd291bGQgaW1wbGVtZW50IGFjdHVhbCBldmFsdWF0aW9uXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUNvdW50ZXJmYWN0dWFsRXhwbGFuYXRpb25zKHRlc3RDYXNlczogVGVzdENhc2VbXSk6IFByb21pc2U8Q291bnRlcmZhY3R1YWxFeHBsYW5hdGlvbltdPiB7XG4gICAgICAgIC8vIFNpbXBsaWZpZWQgY291bnRlcmZhY3R1YWwgZ2VuZXJhdGlvblxuICAgICAgICByZXR1cm4gdGVzdENhc2VzLnNsaWNlKDAsIDUpLm1hcCh0ZXN0Q2FzZSA9PiAoe1xuICAgICAgICAgICAgb3JpZ2luYWxJbnB1dDogdGVzdENhc2UuaW5wdXQsXG4gICAgICAgICAgICBjb3VudGVyZmFjdHVhbElucHV0OiB0aGlzLmdlbmVyYXRlQ291bnRlcmZhY3R1YWxJbnB1dCh0ZXN0Q2FzZS5pbnB1dCksXG4gICAgICAgICAgICBvcmlnaW5hbE91dHB1dDogdGVzdENhc2UuYWN0dWFsT3V0cHV0LFxuICAgICAgICAgICAgY291bnRlcmZhY3R1YWxPdXRwdXQ6IHRoaXMuZ2VuZXJhdGVDb3VudGVyZmFjdHVhbE91dHB1dCh0ZXN0Q2FzZS5hY3R1YWxPdXRwdXQpLFxuICAgICAgICAgICAgY2hhbmdlZEZlYXR1cmVzOiBbJ2ZlYXR1cmUxJywgJ2ZlYXR1cmUyJ10sIC8vIFBsYWNlaG9sZGVyXG4gICAgICAgICAgICBwbGF1c2liaWxpdHk6IE1hdGgucmFuZG9tKCkgKiAwLjMgKyAwLjdcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2VuZXJhdGVDb3VudGVyZmFjdHVhbElucHV0KG9yaWdpbmFsSW5wdXQ6IGFueSk6IGFueSB7XG4gICAgICAgIC8vIFNpbXBsaWZpZWQgY291bnRlcmZhY3R1YWwgaW5wdXQgZ2VuZXJhdGlvblxuICAgICAgICByZXR1cm4geyAuLi5vcmlnaW5hbElucHV0LCBtb2RpZmllZDogdHJ1ZSB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2VuZXJhdGVDb3VudGVyZmFjdHVhbE91dHB1dChvcmlnaW5hbE91dHB1dDogYW55KTogYW55IHtcbiAgICAgICAgLy8gU2ltcGxpZmllZCBjb3VudGVyZmFjdHVhbCBvdXRwdXQgZ2VuZXJhdGlvblxuICAgICAgICBpZiAodHlwZW9mIG9yaWdpbmFsT3V0cHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsT3V0cHV0LmluY2x1ZGVzKCdwb3NpdGl2ZScpID8gJ25lZ2F0aXZlIG91dGNvbWUnIDogJ3Bvc2l0aXZlIG91dGNvbWUnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvcmlnaW5hbE91dHB1dDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlTG9jYWxFeHBsYW5hdGlvbnModGVzdENhc2VzOiBUZXN0Q2FzZVtdKTogUHJvbWlzZTxMb2NhbEV4cGxhbmF0aW9uW10+IHtcbiAgICAgICAgLy8gU2ltcGxpZmllZCBsb2NhbCBleHBsYW5hdGlvbiBnZW5lcmF0aW9uXG4gICAgICAgIHJldHVybiB0ZXN0Q2FzZXMubWFwKCh0ZXN0Q2FzZSwgaW5kZXgpID0+ICh7XG4gICAgICAgICAgICBpbnB1dElkOiB0ZXN0Q2FzZS5pZCxcbiAgICAgICAgICAgIGV4cGxhbmF0aW9uOiBgVGhpcyBwcmVkaWN0aW9uIHdhcyBiYXNlZCBvbiBrZXkgZmFjdG9ycyBpbmNsdWRpbmcgbWFya2V0IGNvbmRpdGlvbnMgYW5kIGhpc3RvcmljYWwgcGF0dGVybnMuYCxcbiAgICAgICAgICAgIGNvbmZpZGVuY2U6IE1hdGgucmFuZG9tKCkgKiAwLjMgKyAwLjcsXG4gICAgICAgICAgICBzdXBwb3J0aW5nRXZpZGVuY2U6IFsnbWFya2V0X2RhdGEnLCAnaGlzdG9yaWNhbF90cmVuZHMnXSxcbiAgICAgICAgICAgIGtleUZhY3RvcnM6IFsnZmFjdG9yMScsICdmYWN0b3IyJywgJ2ZhY3RvcjMnXVxuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUdsb2JhbEV4cGxhbmF0aW9ucyhtb2RlbElkOiBzdHJpbmcsIHRhc2s6IFRhc2spOiBQcm9taXNlPEdsb2JhbEV4cGxhbmF0aW9uW10+IHtcbiAgICAgICAgLy8gU2ltcGxpZmllZCBnbG9iYWwgZXhwbGFuYXRpb24gZ2VuZXJhdGlvblxuICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICAgIG1vZGVsQmVoYXZpb3I6IGBUaGUgJHttb2RlbElkfSBtb2RlbCBhbmFseXplcyBmaW5hbmNpYWwgZGF0YSB1c2luZyBwYXR0ZXJuIHJlY29nbml0aW9uIGFuZCBzdGF0aXN0aWNhbCBhbmFseXNpcyB0byBnZW5lcmF0ZSBpbnZlc3RtZW50IHJlY29tbWVuZGF0aW9ucy5gLFxuICAgICAgICAgICAga2V5UGF0dGVybnM6IFtcbiAgICAgICAgICAgICAgICAnTWFya2V0IHZvbGF0aWxpdHkgcGF0dGVybnMnLFxuICAgICAgICAgICAgICAgICdTZWN0b3IgY29ycmVsYXRpb24gYW5hbHlzaXMnLFxuICAgICAgICAgICAgICAgICdIaXN0b3JpY2FsIHBlcmZvcm1hbmNlIHRyZW5kcydcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBsaW1pdGF0aW9uczogW1xuICAgICAgICAgICAgICAgICdMaW1pdGVkIHRvIGhpc3RvcmljYWwgZGF0YSBwYXR0ZXJucycsXG4gICAgICAgICAgICAgICAgJ01heSBub3QgYWNjb3VudCBmb3IgdW5wcmVjZWRlbnRlZCBtYXJrZXQgZXZlbnRzJyxcbiAgICAgICAgICAgICAgICAnUmVxdWlyZXMgaGlnaC1xdWFsaXR5IGlucHV0IGRhdGEnXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgYXNzdW1wdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAnTWFya2V0IGVmZmljaWVuY3kgYXNzdW1wdGlvbnMnLFxuICAgICAgICAgICAgICAgICdIaXN0b3JpY2FsIHBhdHRlcm5zIGNvbnRpbnVlJyxcbiAgICAgICAgICAgICAgICAnRGF0YSBxdWFsaXR5IGlzIG1haW50YWluZWQnXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZGF0YVJlcXVpcmVtZW50czogW1xuICAgICAgICAgICAgICAgICdIaXN0b3JpY2FsIHByaWNlIGRhdGEnLFxuICAgICAgICAgICAgICAgICdNYXJrZXQgaW5kaWNhdG9ycycsXG4gICAgICAgICAgICAgICAgJ0NvbXBhbnkgZnVuZGFtZW50YWxzJ1xuICAgICAgICAgICAgXVxuICAgICAgICB9XTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGV2YWx1YXRlSHVtYW5JbnRlcnByZXRhYmlsaXR5KFxuICAgICAgICBsb2NhbEV4cGxhbmF0aW9uczogTG9jYWxFeHBsYW5hdGlvbltdLFxuICAgICAgICBnbG9iYWxFeHBsYW5hdGlvbnM6IEdsb2JhbEV4cGxhbmF0aW9uW11cbiAgICApOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICAvLyBTaW1wbGlmaWVkIGh1bWFuIGludGVycHJldGFiaWxpdHkgZXZhbHVhdGlvblxuICAgICAgICBjb25zdCBsb2NhbFNjb3JlID0gbG9jYWxFeHBsYW5hdGlvbnMucmVkdWNlKChzdW0sIGV4cCkgPT4gc3VtICsgZXhwLmNvbmZpZGVuY2UsIDApIC8gbG9jYWxFeHBsYW5hdGlvbnMubGVuZ3RoO1xuICAgICAgICBjb25zdCBnbG9iYWxTY29yZSA9IGdsb2JhbEV4cGxhbmF0aW9ucy5sZW5ndGggPiAwID8gMC44IDogMC40O1xuXG4gICAgICAgIHJldHVybiAobG9jYWxTY29yZSArIGdsb2JhbFNjb3JlKSAvIDI7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjYWxjdWxhdGVFeHBsYWluYWJpbGl0eVNjb3JlKG1ldHJpY3M6IFBhcnRpYWw8RXhwbGFpbmFiaWxpdHlNZXRyaWNzPik6IG51bWJlciB7XG4gICAgICAgIGxldCBzY29yZSA9IDA7XG4gICAgICAgIGxldCBjb21wb25lbnRzID0gMDtcblxuICAgICAgICBpZiAobWV0cmljcy5mZWF0dXJlSW1wb3J0YW5jZSAmJiBtZXRyaWNzLmZlYXR1cmVJbXBvcnRhbmNlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGF2Z0ltcG9ydGFuY2UgPSBtZXRyaWNzLmZlYXR1cmVJbXBvcnRhbmNlLnJlZHVjZSgoc3VtLCBmaSkgPT4gc3VtICsgZmkuaW1wb3J0YW5jZSwgMCkgLyBtZXRyaWNzLmZlYXR1cmVJbXBvcnRhbmNlLmxlbmd0aDtcbiAgICAgICAgICAgIHNjb3JlICs9IGF2Z0ltcG9ydGFuY2UgKiAwLjM7XG4gICAgICAgICAgICBjb21wb25lbnRzICs9IDAuMztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtZXRyaWNzLmRlY2lzaW9uUGF0aENsYXJpdHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2NvcmUgKz0gbWV0cmljcy5kZWNpc2lvblBhdGhDbGFyaXR5ICogMC4yO1xuICAgICAgICAgICAgY29tcG9uZW50cyArPSAwLjI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWV0cmljcy5sb2NhbEV4cGxhbmF0aW9ucyAmJiBtZXRyaWNzLmxvY2FsRXhwbGFuYXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGF2Z0NvbmZpZGVuY2UgPSBtZXRyaWNzLmxvY2FsRXhwbGFuYXRpb25zLnJlZHVjZSgoc3VtLCBleHApID0+IHN1bSArIGV4cC5jb25maWRlbmNlLCAwKSAvIG1ldHJpY3MubG9jYWxFeHBsYW5hdGlvbnMubGVuZ3RoO1xuICAgICAgICAgICAgc2NvcmUgKz0gYXZnQ29uZmlkZW5jZSAqIDAuMztcbiAgICAgICAgICAgIGNvbXBvbmVudHMgKz0gMC4zO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1ldHJpY3MuaHVtYW5JbnRlcnByZXRhYmlsaXR5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNjb3JlICs9IG1ldHJpY3MuaHVtYW5JbnRlcnByZXRhYmlsaXR5ICogMC4yO1xuICAgICAgICAgICAgY29tcG9uZW50cyArPSAwLjI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY29tcG9uZW50cyA+IDAgPyBzY29yZSAvIGNvbXBvbmVudHMgOiAwO1xuICAgIH1cblxuICAgIC8vIEhlbHBlciBtZXRob2RzIGZvciByZWxpYWJpbGl0eSBldmFsdWF0aW9uXG4gICAgcHJpdmF0ZSBhc3luYyBldmFsdWF0ZUNvbnNpc3RlbmN5KHRlc3RDYXNlczogVGVzdENhc2VbXSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgICAgIC8vIFNpbXBsaWZpZWQgY29uc2lzdGVuY3kgZXZhbHVhdGlvblxuICAgICAgICByZXR1cm4gMC44ODsgLy8gUGxhY2Vob2xkZXIgLSB3b3VsZCBpbXBsZW1lbnQgYWN0dWFsIGV2YWx1YXRpb25cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGV2YWx1YXRlUm9idXN0bmVzcyh0ZXN0Q2FzZXM6IFRlc3RDYXNlW10pOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICAvLyBTaW1wbGlmaWVkIHJvYnVzdG5lc3MgZXZhbHVhdGlvblxuICAgICAgICByZXR1cm4gMC44MjsgLy8gUGxhY2Vob2xkZXIgLSB3b3VsZCBpbXBsZW1lbnQgYWN0dWFsIGV2YWx1YXRpb25cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGV2YWx1YXRlU3RhYmlsaXR5KHRlc3RDYXNlczogVGVzdENhc2VbXSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgICAgIC8vIFNpbXBsaWZpZWQgc3RhYmlsaXR5IGV2YWx1YXRpb25cbiAgICAgICAgcmV0dXJuIDAuODU7IC8vIFBsYWNlaG9sZGVyIC0gd291bGQgaW1wbGVtZW50IGFjdHVhbCBldmFsdWF0aW9uXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBxdWFudGlmeVVuY2VydGFpbnR5KHRlc3RDYXNlczogVGVzdENhc2VbXSk6IFByb21pc2U8VW5jZXJ0YWludHlNZXRyaWNzPiB7XG4gICAgICAgIC8vIFNpbXBsaWZpZWQgdW5jZXJ0YWludHkgcXVhbnRpZmljYXRpb25cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGVwaXN0ZW1pY1VuY2VydGFpbnR5OiAwLjE1LFxuICAgICAgICAgICAgYWxlYXRvcmljVW5jZXJ0YWludHk6IDAuMTAsXG4gICAgICAgICAgICB0b3RhbFVuY2VydGFpbnR5OiAwLjI1LFxuICAgICAgICAgICAgY2FsaWJyYXRpb25FcnJvcjogMC4wOFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZXZhbHVhdGVBZHZlcnNhcmlhbFJvYnVzdG5lc3ModGVzdENhc2VzOiBUZXN0Q2FzZVtdKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICAgICAgLy8gU2ltcGxpZmllZCBhZHZlcnNhcmlhbCByb2J1c3RuZXNzIGV2YWx1YXRpb25cbiAgICAgICAgcmV0dXJuIDAuNzg7IC8vIFBsYWNlaG9sZGVyIC0gd291bGQgaW1wbGVtZW50IGFjdHVhbCBldmFsdWF0aW9uXG4gICAgfVxuXG4gICAgLy8gSGVscGVyIG1ldGhvZHMgZm9yIG92ZXJhbGwgZXZhbHVhdGlvblxuICAgIHByaXZhdGUgYXN5bmMgZ2V0UGVyZm9ybWFuY2VNZXRyaWNzKG1vZGVsSWQ6IHN0cmluZywgdGFzazogVGFzayk6IFByb21pc2U8UGVyZm9ybWFuY2VNZXRyaWNzPiB7XG4gICAgICAgIC8vIEdldCBwZXJmb3JtYW5jZSBtZXRyaWNzIGZyb20gZXhpc3Rpbmcgc3lzdGVtc1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYWNjdXJhY3k6IDAuODgsXG4gICAgICAgICAgICBsYXRlbmN5OiAyNTAwLFxuICAgICAgICAgICAgdGhyb3VnaHB1dDogMjUsXG4gICAgICAgICAgICBjb3N0UGVyUmVxdWVzdDogMC4wMTIsXG4gICAgICAgICAgICBlcnJvclJhdGU6IDAuMDMsXG4gICAgICAgICAgICBjdXN0b21NZXRyaWNzOiB7fVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgY2FsY3VsYXRlT3ZlcmFsbFNjb3JlKG1ldHJpY3M6IEV2YWx1YXRpb25NZXRyaWNzKTogbnVtYmVyIHtcbiAgICAgICAgY29uc3Qgd2VpZ2h0cyA9IHtcbiAgICAgICAgICAgIGFjY3VyYWN5OiAwLjMsXG4gICAgICAgICAgICBwZXJmb3JtYW5jZTogMC4yLFxuICAgICAgICAgICAgYmlhczogMC4yLFxuICAgICAgICAgICAgZXhwbGFpbmFiaWxpdHk6IDAuMixcbiAgICAgICAgICAgIHJlbGlhYmlsaXR5OiAwLjFcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgc2NvcmUgPSAwO1xuICAgICAgICBzY29yZSArPSBtZXRyaWNzLmFjY3VyYWN5Lm92ZXJhbGxBY2N1cmFjeSAqIHdlaWdodHMuYWNjdXJhY3k7XG4gICAgICAgIHNjb3JlICs9ICgxIC0gbWV0cmljcy5wZXJmb3JtYW5jZS5lcnJvclJhdGUpICogd2VpZ2h0cy5wZXJmb3JtYW5jZTtcbiAgICAgICAgc2NvcmUgKz0gKDEgLSBtZXRyaWNzLmJpYXMub3ZlcmFsbEJpYXNTY29yZSkgKiB3ZWlnaHRzLmJpYXM7XG4gICAgICAgIHNjb3JlICs9IG1ldHJpY3MuZXhwbGFpbmFiaWxpdHkub3ZlcmFsbEV4cGxhaW5hYmlsaXR5U2NvcmUgKiB3ZWlnaHRzLmV4cGxhaW5hYmlsaXR5O1xuICAgICAgICBzY29yZSArPSBtZXRyaWNzLnJlbGlhYmlsaXR5LmNvbnNpc3RlbmN5ICogd2VpZ2h0cy5yZWxpYWJpbGl0eTtcblxuICAgICAgICByZXR1cm4gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgc2NvcmUpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGRldGVybWluZVBhc3NGYWlsKG1ldHJpY3M6IEV2YWx1YXRpb25NZXRyaWNzKTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IGNoZWNrcyA9IFtcbiAgICAgICAgICAgIG1ldHJpY3MuYWNjdXJhY3kub3ZlcmFsbEFjY3VyYWN5ID49IHRoaXMuY29uZmlnLmFjY3VyYWN5VGhyZXNob2xkcy5taW5pbXVtLFxuICAgICAgICAgICAgbWV0cmljcy5iaWFzLm92ZXJhbGxCaWFzU2NvcmUgPD0gdGhpcy5jb25maWcuYmlhc1RocmVzaG9sZHMuYWNjZXB0YWJsZSxcbiAgICAgICAgICAgIG1ldHJpY3MuZXhwbGFpbmFiaWxpdHkub3ZlcmFsbEV4cGxhaW5hYmlsaXR5U2NvcmUgPj0gdGhpcy5jb25maWcuZXhwbGFpbmFiaWxpdHlSZXF1aXJlbWVudHMubWluaW11bVNjb3JlLFxuICAgICAgICAgICAgbWV0cmljcy5wZXJmb3JtYW5jZS5lcnJvclJhdGUgPD0gMC4xLFxuICAgICAgICAgICAgbWV0cmljcy5yZWxpYWJpbGl0eS5jb25zaXN0ZW5jeSA+PSAwLjdcbiAgICAgICAgXTtcblxuICAgICAgICByZXR1cm4gY2hlY2tzLmV2ZXJ5KGNoZWNrID0+IGNoZWNrKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGlkZW50aWZ5SXNzdWVzKG1ldHJpY3M6IEV2YWx1YXRpb25NZXRyaWNzKTogRXZhbHVhdGlvbklzc3VlW10ge1xuICAgICAgICBjb25zdCBpc3N1ZXM6IEV2YWx1YXRpb25Jc3N1ZVtdID0gW107XG5cbiAgICAgICAgLy8gQWNjdXJhY3kgaXNzdWVzXG4gICAgICAgIGlmIChtZXRyaWNzLmFjY3VyYWN5Lm92ZXJhbGxBY2N1cmFjeSA8IHRoaXMuY29uZmlnLmFjY3VyYWN5VGhyZXNob2xkcy5taW5pbXVtKSB7XG4gICAgICAgICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdhY2N1cmFjeScsXG4gICAgICAgICAgICAgICAgc2V2ZXJpdHk6IG1ldHJpY3MuYWNjdXJhY3kub3ZlcmFsbEFjY3VyYWN5IDwgMC43ID8gJ2NyaXRpY2FsJyA6ICdoaWdoJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogYE92ZXJhbGwgYWNjdXJhY3kgKCR7KG1ldHJpY3MuYWNjdXJhY3kub3ZlcmFsbEFjY3VyYWN5ICogMTAwKS50b0ZpeGVkKDEpfSUpIGJlbG93IG1pbmltdW0gdGhyZXNob2xkICgkeyh0aGlzLmNvbmZpZy5hY2N1cmFjeVRocmVzaG9sZHMubWluaW11bSAqIDEwMCkudG9GaXhlZCgxKX0lKWAsXG4gICAgICAgICAgICAgICAgaW1wYWN0OiAnUmVkdWNlZCByZWxpYWJpbGl0eSBvZiBtb2RlbCBwcmVkaWN0aW9ucycsXG4gICAgICAgICAgICAgICAgcmVtZWRpYXRpb246ICdJbXByb3ZlIHRyYWluaW5nIGRhdGEgcXVhbGl0eSwgYWRqdXN0IG1vZGVsIHBhcmFtZXRlcnMsIG9yIGNvbnNpZGVyIG1vZGVsIHJldHJhaW5pbmcnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJpYXMgaXNzdWVzXG4gICAgICAgIGlmIChtZXRyaWNzLmJpYXMub3ZlcmFsbEJpYXNTY29yZSA+IHRoaXMuY29uZmlnLmJpYXNUaHJlc2hvbGRzLmFjY2VwdGFibGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHNldmVyaXR5ID0gbWV0cmljcy5iaWFzLm92ZXJhbGxCaWFzU2NvcmUgPiB0aGlzLmNvbmZpZy5iaWFzVGhyZXNob2xkcy5jcml0aWNhbCA/ICdjcml0aWNhbCcgOlxuICAgICAgICAgICAgICAgIG1ldHJpY3MuYmlhcy5vdmVyYWxsQmlhc1Njb3JlID4gdGhpcy5jb25maWcuYmlhc1RocmVzaG9sZHMuY29uY2VybmluZyA/ICdoaWdoJyA6ICdtZWRpdW0nO1xuXG4gICAgICAgICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdiaWFzJyxcbiAgICAgICAgICAgICAgICBzZXZlcml0eSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogYEJpYXMgc2NvcmUgKCR7KG1ldHJpY3MuYmlhcy5vdmVyYWxsQmlhc1Njb3JlICogMTAwKS50b0ZpeGVkKDEpfSUpIGV4Y2VlZHMgYWNjZXB0YWJsZSB0aHJlc2hvbGRgLFxuICAgICAgICAgICAgICAgIGltcGFjdDogJ1BvdGVudGlhbCB1bmZhaXIgdHJlYXRtZW50IG9mIGNlcnRhaW4gZ3JvdXBzIG9yIHNjZW5hcmlvcycsXG4gICAgICAgICAgICAgICAgcmVtZWRpYXRpb246ICdJbXBsZW1lbnQgYmlhcyBtaXRpZ2F0aW9uIHN0cmF0ZWdpZXMsIGltcHJvdmUgZGF0YSByZXByZXNlbnRhdGlvbiwgb3IgYWRqdXN0IG1vZGVsIHRyYWluaW5nJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFeHBsYWluYWJpbGl0eSBpc3N1ZXNcbiAgICAgICAgaWYgKG1ldHJpY3MuZXhwbGFpbmFiaWxpdHkub3ZlcmFsbEV4cGxhaW5hYmlsaXR5U2NvcmUgPCB0aGlzLmNvbmZpZy5leHBsYWluYWJpbGl0eVJlcXVpcmVtZW50cy5taW5pbXVtU2NvcmUpIHtcbiAgICAgICAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBjYXRlZ29yeTogJ2V4cGxhaW5hYmlsaXR5JyxcbiAgICAgICAgICAgICAgICBzZXZlcml0eTogbWV0cmljcy5leHBsYWluYWJpbGl0eS5vdmVyYWxsRXhwbGFpbmFiaWxpdHlTY29yZSA8IDAuNSA/ICdoaWdoJyA6ICdtZWRpdW0nLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgRXhwbGFpbmFiaWxpdHkgc2NvcmUgKCR7KG1ldHJpY3MuZXhwbGFpbmFiaWxpdHkub3ZlcmFsbEV4cGxhaW5hYmlsaXR5U2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JSkgYmVsb3cgbWluaW11bSByZXF1aXJlbWVudGAsXG4gICAgICAgICAgICAgICAgaW1wYWN0OiAnUmVkdWNlZCB0cnVzdCBhbmQgdHJhbnNwYXJlbmN5IGluIG1vZGVsIGRlY2lzaW9ucycsXG4gICAgICAgICAgICAgICAgcmVtZWRpYXRpb246ICdFbmhhbmNlIGV4cGxhbmF0aW9uIGdlbmVyYXRpb24sIGltcHJvdmUgZmVhdHVyZSBpbXBvcnRhbmNlIGFuYWx5c2lzLCBvciBhZGQgaW50ZXJwcmV0YWJpbGl0eSB0b29scydcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVsaWFiaWxpdHkgaXNzdWVzXG4gICAgICAgIGlmIChtZXRyaWNzLnJlbGlhYmlsaXR5LmNvbnNpc3RlbmN5IDwgMC43KSB7XG4gICAgICAgICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdyZWxpYWJpbGl0eScsXG4gICAgICAgICAgICAgICAgc2V2ZXJpdHk6IG1ldHJpY3MucmVsaWFiaWxpdHkuY29uc2lzdGVuY3kgPCAwLjUgPyAnY3JpdGljYWwnIDogJ2hpZ2gnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgTW9kZWwgY29uc2lzdGVuY3kgKCR7KG1ldHJpY3MucmVsaWFiaWxpdHkuY29uc2lzdGVuY3kgKiAxMDApLnRvRml4ZWQoMSl9JSkgYmVsb3cgYWNjZXB0YWJsZSB0aHJlc2hvbGRgLFxuICAgICAgICAgICAgICAgIGltcGFjdDogJ1VucHJlZGljdGFibGUgbW9kZWwgYmVoYXZpb3IgYW5kIHJlZHVjZWQgdXNlciBjb25maWRlbmNlJyxcbiAgICAgICAgICAgICAgICByZW1lZGlhdGlvbjogJ0ltcHJvdmUgbW9kZWwgc3RhYmlsaXR5LCBlbmhhbmNlIGVycm9yIGhhbmRsaW5nLCBvciBpbXBsZW1lbnQgY29uc2lzdGVuY3kgY2hlY2tzJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaXNzdWVzO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2VuZXJhdGVSZWNvbW1lbmRhdGlvbnMobWV0cmljczogRXZhbHVhdGlvbk1ldHJpY3MsIGlzc3VlczogRXZhbHVhdGlvbklzc3VlW10pOiBFdmFsdWF0aW9uUmVjb21tZW5kYXRpb25bXSB7XG4gICAgICAgIGNvbnN0IHJlY29tbWVuZGF0aW9uczogRXZhbHVhdGlvblJlY29tbWVuZGF0aW9uW10gPSBbXTtcblxuICAgICAgICAvLyBHZW5lcmFsIGltcHJvdmVtZW50IHJlY29tbWVuZGF0aW9uc1xuICAgICAgICBpZiAobWV0cmljcy5hY2N1cmFjeS5vdmVyYWxsQWNjdXJhY3kgPCB0aGlzLmNvbmZpZy5hY2N1cmFjeVRocmVzaG9sZHMudGFyZ2V0KSB7XG4gICAgICAgICAgICByZWNvbW1lbmRhdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdhY2N1cmFjeScsXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ltcHJvdmUgbW9kZWwgYWNjdXJhY3kgdGhyb3VnaCBlbmhhbmNlZCB0cmFpbmluZyBkYXRhIGFuZCBwYXJhbWV0ZXIgdHVuaW5nJyxcbiAgICAgICAgICAgICAgICBleHBlY3RlZEJlbmVmaXQ6ICdJbmNyZWFzZWQgcHJlZGljdGlvbiByZWxpYWJpbGl0eSBhbmQgdXNlciBjb25maWRlbmNlJyxcbiAgICAgICAgICAgICAgICBpbXBsZW1lbnRhdGlvbkVmZm9ydDogJ21lZGl1bSdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1ldHJpY3MuYmlhcy5vdmVyYWxsQmlhc1Njb3JlID4gMC4wNSkge1xuICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAnYmlhcycsXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ltcGxlbWVudCBjb21wcmVoZW5zaXZlIGJpYXMgbWl0aWdhdGlvbiBzdHJhdGVnaWVzJyxcbiAgICAgICAgICAgICAgICBleHBlY3RlZEJlbmVmaXQ6ICdGYWlyZXIgYW5kIG1vcmUgZXF1aXRhYmxlIG1vZGVsIHByZWRpY3Rpb25zJyxcbiAgICAgICAgICAgICAgICBpbXBsZW1lbnRhdGlvbkVmZm9ydDogJ2hpZ2gnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtZXRyaWNzLmV4cGxhaW5hYmlsaXR5Lm92ZXJhbGxFeHBsYWluYWJpbGl0eVNjb3JlIDwgMC45KSB7XG4gICAgICAgICAgICByZWNvbW1lbmRhdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdleHBsYWluYWJpbGl0eScsXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRW5oYW5jZSBtb2RlbCBleHBsYWluYWJpbGl0eSBmZWF0dXJlcyBhbmQgZG9jdW1lbnRhdGlvbicsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWRCZW5lZml0OiAnSW1wcm92ZWQgdXNlciB0cnVzdCBhbmQgcmVndWxhdG9yeSBjb21wbGlhbmNlJyxcbiAgICAgICAgICAgICAgICBpbXBsZW1lbnRhdGlvbkVmZm9ydDogJ21lZGl1bSdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGVyZm9ybWFuY2Ugb3B0aW1pemF0aW9uIHJlY29tbWVuZGF0aW9uc1xuICAgICAgICBpZiAobWV0cmljcy5wZXJmb3JtYW5jZS5sYXRlbmN5ID4gMzAwMCkge1xuICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAncGVyZm9ybWFuY2UnLFxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ09wdGltaXplIG1vZGVsIGluZmVyZW5jZSBzcGVlZCBhbmQgcmVzb3VyY2UgdXNhZ2UnLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkQmVuZWZpdDogJ0JldHRlciB1c2VyIGV4cGVyaWVuY2UgYW5kIHJlZHVjZWQgb3BlcmF0aW9uYWwgY29zdHMnLFxuICAgICAgICAgICAgICAgIGltcGxlbWVudGF0aW9uRWZmb3J0OiAnbWVkaXVtJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVjb21tZW5kYXRpb25zO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2VuZXJhdGVFdmFsdWF0aW9uSWQoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGBldmFsXyR7RGF0ZS5ub3coKX1fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHIoMiwgOSl9YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgZXZhbHVhdGlvbiBoaXN0b3J5IGZvciBhIHNwZWNpZmljIG1vZGVsXG4gICAgICovXG4gICAgZ2V0RXZhbHVhdGlvbkhpc3RvcnkobW9kZWxJZDogc3RyaW5nKTogRXZhbHVhdGlvblJlc3VsdFtdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZhbHVhdGlvbkhpc3RvcnkuZmlsdGVyKHJlc3VsdCA9PiByZXN1bHQubW9kZWxJZCA9PT0gbW9kZWxJZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBsYXRlc3QgZXZhbHVhdGlvbiByZXN1bHQgZm9yIGEgbW9kZWxcbiAgICAgKi9cbiAgICBnZXRMYXRlc3RFdmFsdWF0aW9uKG1vZGVsSWQ6IHN0cmluZyk6IEV2YWx1YXRpb25SZXN1bHQgfCBudWxsIHtcbiAgICAgICAgY29uc3QgaGlzdG9yeSA9IHRoaXMuZ2V0RXZhbHVhdGlvbkhpc3RvcnkobW9kZWxJZCk7XG4gICAgICAgIHJldHVybiBoaXN0b3J5Lmxlbmd0aCA+IDAgPyBoaXN0b3J5W2hpc3RvcnkubGVuZ3RoIC0gMV0gOiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbXBhcmUgZXZhbHVhdGlvbiByZXN1bHRzIGJldHdlZW4gbW9kZWxzXG4gICAgICovXG4gICAgY29tcGFyZU1vZGVscyhtb2RlbElkczogc3RyaW5nW10pOiBSZWNvcmQ8c3RyaW5nLCBFdmFsdWF0aW9uUmVzdWx0IHwgbnVsbD4ge1xuICAgICAgICBjb25zdCBjb21wYXJpc29uOiBSZWNvcmQ8c3RyaW5nLCBFdmFsdWF0aW9uUmVzdWx0IHwgbnVsbD4gPSB7fTtcblxuICAgICAgICBmb3IgKGNvbnN0IG1vZGVsSWQgb2YgbW9kZWxJZHMpIHtcbiAgICAgICAgICAgIGNvbXBhcmlzb25bbW9kZWxJZF0gPSB0aGlzLmdldExhdGVzdEV2YWx1YXRpb24obW9kZWxJZCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY29tcGFyaXNvbjtcbiAgICB9XG59XG5cbi8qKlxuICogRmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgYSBtb2RlbCBldmFsdWF0aW9uIGZyYW1ld29yayBpbnN0YW5jZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTW9kZWxFdmFsdWF0aW9uRnJhbWV3b3JrKFxuICAgIGNvbmZpZz86IFBhcnRpYWw8RXZhbHVhdGlvbkNvbmZpZz5cbik6IE1vZGVsRXZhbHVhdGlvbkZyYW1ld29yayB7XG4gICAgcmV0dXJuIG5ldyBNb2RlbEV2YWx1YXRpb25GcmFtZXdvcmsoY29uZmlnKTtcbn1cblxuLyoqXG4gKiBTaW5nbGV0b24gaW5zdGFuY2UgZm9yIGdsb2JhbCB1c2VcbiAqL1xubGV0IGdsb2JhbEV2YWx1YXRpb25GcmFtZXdvcms6IE1vZGVsRXZhbHVhdGlvbkZyYW1ld29yayB8IG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9kZWxFdmFsdWF0aW9uRnJhbWV3b3JrKCk6IE1vZGVsRXZhbHVhdGlvbkZyYW1ld29yayB7XG4gICAgaWYgKCFnbG9iYWxFdmFsdWF0aW9uRnJhbWV3b3JrKSB7XG4gICAgICAgIGdsb2JhbEV2YWx1YXRpb25GcmFtZXdvcmsgPSBjcmVhdGVNb2RlbEV2YWx1YXRpb25GcmFtZXdvcmsoKTtcbiAgICB9XG4gICAgcmV0dXJuIGdsb2JhbEV2YWx1YXRpb25GcmFtZXdvcms7XG59Il19