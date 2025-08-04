"use strict";
/**
 * Supporting Analysis Service
 * Implements key metrics calculation, risk assessment algorithms, and expected outcome modeling
 * Requirements: 4.3, 7.2, 7.3
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportingAnalysisService = void 0;
class SupportingAnalysisService {
    /**
     * Calculates comprehensive key metrics for an investment idea
     */
    async calculateKeyMetrics(idea) {
        const investments = idea.investments;
        // Calculate portfolio-level metrics
        const expectedReturn = this.calculateExpectedReturn(investments, idea.potentialOutcomes);
        const volatility = this.calculatePortfolioVolatility(investments);
        const sharpeRatio = this.calculateSharpeRatio(expectedReturn, volatility);
        const maxDrawdown = this.calculateMaxDrawdown(investments);
        const valueAtRisk = this.calculateValueAtRisk(investments, 0.05); // 5% VaR
        // Portfolio construction metrics
        const diversificationRatio = this.calculateDiversificationRatio(investments);
        const correlationScore = this.calculateCorrelationScore(investments);
        const concentrationRisk = this.calculateConcentrationRisk(investments);
        // Quality scores
        const fundamentalScore = this.calculateFundamentalScore(investments);
        const technicalScore = this.calculateTechnicalScore(investments);
        const sentimentScore = this.calculateSentimentScore(investments);
        // Risk-adjusted metrics
        const informationRatio = this.calculateInformationRatio(investments);
        const calmarRatio = this.calculateCalmarRatio(expectedReturn, maxDrawdown);
        const sortinoRatio = this.calculateSortinoRatio(investments);
        // Time-based metrics
        const timeToBreakeven = this.calculateTimeToBreakeven(idea);
        const optimalHoldingPeriod = this.calculateOptimalHoldingPeriod(idea);
        // Confidence metrics
        const dataQuality = this.assessDataQuality(idea.supportingData);
        const modelConfidence = idea.confidenceScore;
        const marketConditionSuitability = this.assessMarketConditionSuitability(idea);
        return {
            expectedReturn,
            volatility,
            sharpeRatio,
            maxDrawdown,
            valueAtRisk,
            diversificationRatio,
            correlationScore,
            concentrationRisk,
            fundamentalScore,
            technicalScore,
            sentimentScore,
            informationRatio,
            calmarRatio,
            sortinoRatio,
            timeToBreakeven,
            optimalHoldingPeriod,
            dataQuality,
            modelConfidence,
            marketConditionSuitability
        };
    }
    /**
     * Performs comprehensive risk assessment
     */
    async assessRisk(idea) {
        const investments = idea.investments;
        // Calculate overall risk score and level
        const riskScore = this.calculateOverallRiskScore(investments, idea);
        const overallRiskLevel = this.determineRiskLevel(riskScore);
        // Identify risk factors
        const riskFactors = this.identifyRiskFactors(investments, idea);
        // Generate risk mitigation strategies
        const riskMitigation = this.generateRiskMitigation(riskFactors);
        // Perform stress tests
        const stressTestResults = this.performStressTests(investments);
        // Scenario analysis
        const scenarioAnalysis = this.performScenarioAnalysis(investments);
        // Correlation risks
        const correlationRisks = this.assessCorrelationRisks(investments);
        // Specific risk assessments
        const liquidityRisk = this.assessLiquidityRisk(investments);
        const concentrationRisk = this.assessConcentrationRisk(investments);
        const marketRisk = this.assessMarketRisk(investments);
        const creditRisk = this.assessCreditRisk(investments);
        const operationalRisk = this.assessOperationalRisk(investments, idea);
        return {
            overallRiskLevel,
            riskScore,
            riskFactors,
            riskMitigation,
            stressTestResults,
            scenarioAnalysis,
            correlationRisks,
            liquidityRisk,
            concentrationRisk,
            marketRisk,
            creditRisk,
            operationalRisk
        };
    }
    /**
     * Models expected outcomes using various techniques
     */
    async modelExpectedOutcomes(idea) {
        const investments = idea.investments;
        // Create scenario outcomes
        const baseCase = this.createBaseScenario(idea);
        const bullCase = this.createBullScenario(idea);
        const bearCase = this.createBearScenario(idea);
        // Calculate probability-weighted return
        const probabilityWeightedReturn = this.calculateProbabilityWeightedReturn([baseCase, bullCase, bearCase]);
        // Generate confidence intervals
        const confidenceInterval = this.calculateConfidenceInterval(investments);
        // Perform sensitivity analysis
        const sensitivityAnalysis = this.performSensitivityAnalysis(investments, idea);
        // Run Monte Carlo simulation
        const monteCarloResults = this.runMonteCarloSimulation(investments, idea);
        // Generate time series projection
        const timeSeriesProjection = this.generateTimeSeriesProjection(idea, monteCarloResults);
        return {
            baseCase,
            bullCase,
            bearCase,
            probabilityWeightedReturn,
            confidenceInterval,
            sensitivityAnalysis,
            monteCarloResults,
            timeSeriesProjection
        };
    }
    // Private helper methods for key metrics calculation
    calculateExpectedReturn(investments, outcomes) {
        if (outcomes.length === 0) {
            // Fallback to historical performance
            return investments.reduce((sum, inv) => {
                const historicalReturn = this.calculateHistoricalReturn(inv);
                return sum + historicalReturn;
            }, 0) / investments.length;
        }
        return outcomes.reduce((sum, outcome) => sum + (outcome.returnEstimate * outcome.probability), 0);
    }
    calculateHistoricalReturn(investment) {
        const performance = investment.historicalPerformance;
        if (performance.length < 2)
            return 0;
        const firstPrice = performance[0].adjustedClose;
        const lastPrice = performance[performance.length - 1].adjustedClose;
        const periods = performance.length;
        // Annualized return
        return Math.pow(lastPrice / firstPrice, 252 / periods) - 1;
    }
    calculatePortfolioVolatility(investments) {
        if (investments.length === 0)
            return 0;
        // Simple average of individual volatilities (could be enhanced with correlation matrix)
        const totalVolatility = investments.reduce((sum, inv) => {
            return sum + (inv.riskMetrics?.volatility || 0);
        }, 0);
        return totalVolatility / investments.length;
    }
    calculateSharpeRatio(expectedReturn, volatility, riskFreeRate = 0.02) {
        if (volatility === 0)
            return 0;
        return (expectedReturn - riskFreeRate) / volatility;
    }
    calculateMaxDrawdown(investments) {
        let maxDrawdown = 0;
        for (const investment of investments) {
            const performance = investment.historicalPerformance;
            if (performance.length < 2)
                continue;
            let peak = performance[0].adjustedClose;
            let currentDrawdown = 0;
            for (let i = 1; i < performance.length; i++) {
                const currentPrice = performance[i].adjustedClose;
                if (currentPrice > peak) {
                    peak = currentPrice;
                }
                else {
                    currentDrawdown = (peak - currentPrice) / peak;
                    maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
                }
            }
        }
        return maxDrawdown;
    }
    calculateValueAtRisk(investments, confidenceLevel) {
        // Simplified VaR calculation using normal distribution assumption
        const portfolioReturn = this.calculateExpectedReturn(investments, []);
        const portfolioVolatility = this.calculatePortfolioVolatility(investments);
        // Z-score for confidence level (e.g., -1.645 for 5% VaR)
        const zScore = this.getZScore(confidenceLevel);
        return portfolioReturn + (zScore * portfolioVolatility);
    }
    getZScore(confidenceLevel) {
        // Simplified mapping of confidence levels to z-scores
        const zScores = {
            0.01: -2.326,
            0.05: -1.645,
            0.10: -1.282
        };
        return zScores[confidenceLevel] || -1.645;
    }
    calculateDiversificationRatio(investments) {
        if (investments.length <= 1)
            return 0;
        // Simplified diversification ratio based on number of assets and sectors
        const sectors = new Set(investments.map(inv => inv.sector).filter(Boolean));
        const assetTypes = new Set(investments.map(inv => inv.type));
        const sectorDiversification = sectors.size / Math.max(investments.length, 1);
        const assetTypeDiversification = assetTypes.size / Math.max(investments.length, 1);
        return (sectorDiversification + assetTypeDiversification) / 2;
    }
    calculateCorrelationScore(investments) {
        if (investments.length <= 1)
            return 0;
        let totalCorrelation = 0;
        let pairCount = 0;
        for (let i = 0; i < investments.length; i++) {
            for (let j = i + 1; j < investments.length; j++) {
                const inv1 = investments[i];
                const inv2 = investments[j];
                // Get correlation from risk metrics if available
                const correlation = inv1.riskMetrics?.correlations?.[inv2.id] || 0.5; // Default moderate correlation
                totalCorrelation += Math.abs(correlation);
                pairCount++;
            }
        }
        return pairCount > 0 ? totalCorrelation / pairCount : 0;
    }
    calculateConcentrationRisk(investments) {
        if (investments.length === 0)
            return 1;
        // Calculate Herfindahl-Hirschman Index for concentration
        const totalValue = investments.length; // Assuming equal weights
        let hhi = 0;
        for (const investment of investments) {
            const weight = 1 / totalValue; // Equal weight assumption
            hhi += weight * weight;
        }
        return hhi;
    }
    calculateFundamentalScore(investments) {
        let totalScore = 0;
        let validInvestments = 0;
        for (const investment of investments) {
            if (!investment.fundamentals)
                continue;
            const fundamentals = investment.fundamentals;
            let score = 50; // Base score
            // P/E ratio scoring
            if (fundamentals.peRatio && fundamentals.peRatio > 0) {
                if (fundamentals.peRatio < 15)
                    score += 10;
                else if (fundamentals.peRatio < 25)
                    score += 5;
                else if (fundamentals.peRatio > 40)
                    score -= 10;
            }
            // Profit margin scoring
            if (fundamentals.profitMargin && fundamentals.profitMargin > 0) {
                if (fundamentals.profitMargin > 0.15)
                    score += 10;
                else if (fundamentals.profitMargin > 0.10)
                    score += 5;
            }
            // ROE scoring
            if (fundamentals.returnOnEquity && fundamentals.returnOnEquity > 0) {
                if (fundamentals.returnOnEquity > 0.15)
                    score += 10;
                else if (fundamentals.returnOnEquity > 0.10)
                    score += 5;
            }
            // Debt-to-equity scoring
            if (fundamentals.debtToEquity !== undefined) {
                if (fundamentals.debtToEquity < 0.3)
                    score += 5;
                else if (fundamentals.debtToEquity > 1.0)
                    score -= 10;
            }
            totalScore += Math.max(0, Math.min(100, score));
            validInvestments++;
        }
        return validInvestments > 0 ? totalScore / validInvestments : 50;
    }
    calculateTechnicalScore(investments) {
        let totalScore = 0;
        let validInvestments = 0;
        for (const investment of investments) {
            if (!investment.technicalIndicators)
                continue;
            const technical = investment.technicalIndicators;
            let score = 50; // Base score
            // RSI scoring
            if (technical.relativeStrengthIndex) {
                const rsi = technical.relativeStrengthIndex;
                if (rsi > 30 && rsi < 70)
                    score += 10; // Neutral zone
                else if (rsi < 30)
                    score += 15; // Oversold
                else if (rsi > 70)
                    score -= 10; // Overbought
            }
            // Moving average trend
            if (technical.movingAverages && investment.currentPrice) {
                const price = investment.currentPrice;
                const ma50 = technical.movingAverages.ma50;
                const ma200 = technical.movingAverages.ma200;
                if (price > ma50 && ma50 > ma200)
                    score += 15; // Uptrend
                else if (price < ma50 && ma50 < ma200)
                    score -= 10; // Downtrend
            }
            // MACD scoring
            if (technical.macdLine && technical.macdSignal) {
                if (technical.macdLine > technical.macdSignal)
                    score += 5; // Bullish
                else
                    score -= 5; // Bearish
            }
            totalScore += Math.max(0, Math.min(100, score));
            validInvestments++;
        }
        return validInvestments > 0 ? totalScore / validInvestments : 50;
    }
    calculateSentimentScore(investments) {
        let totalScore = 0;
        let validInvestments = 0;
        for (const investment of investments) {
            if (!investment.sentimentAnalysis)
                continue;
            const sentiment = investment.sentimentAnalysis;
            let score = 50; // Base score
            // Overall sentiment scoring
            switch (sentiment.overallSentiment) {
                case 'very-positive':
                    score += 20;
                    break;
                case 'positive':
                    score += 10;
                    break;
                case 'neutral':
                    score += 0;
                    break;
                case 'negative':
                    score -= 10;
                    break;
                case 'very-negative':
                    score -= 20;
                    break;
            }
            // Sentiment trend scoring
            switch (sentiment.sentimentTrend) {
                case 'improving':
                    score += 10;
                    break;
                case 'stable':
                    score += 0;
                    break;
                case 'deteriorating':
                    score -= 10;
                    break;
            }
            // Analyst recommendations
            if (sentiment.analystRecommendations) {
                const total = sentiment.analystRecommendations.buy +
                    sentiment.analystRecommendations.hold +
                    sentiment.analystRecommendations.sell;
                if (total > 0) {
                    const buyRatio = sentiment.analystRecommendations.buy / total;
                    score += (buyRatio - 0.5) * 20; // Adjust based on buy ratio
                }
            }
            totalScore += Math.max(0, Math.min(100, score));
            validInvestments++;
        }
        return validInvestments > 0 ? totalScore / validInvestments : 50;
    }
    calculateInformationRatio(investments) {
        // Simplified information ratio calculation
        const activeReturn = this.calculateExpectedReturn(investments, []);
        const benchmarkReturn = 0.08; // Assume 8% benchmark
        const trackingError = this.calculatePortfolioVolatility(investments) * 0.5; // Simplified
        if (trackingError === 0)
            return 0;
        return (activeReturn - benchmarkReturn) / trackingError;
    }
    calculateCalmarRatio(expectedReturn, maxDrawdown) {
        if (maxDrawdown === 0)
            return 0;
        return expectedReturn / maxDrawdown;
    }
    calculateSortinoRatio(investments, targetReturn = 0) {
        // Simplified Sortino ratio calculation
        const expectedReturn = this.calculateExpectedReturn(investments, []);
        const downwardDeviation = this.calculateDownwardDeviation(investments, targetReturn);
        if (downwardDeviation === 0)
            return 0;
        return (expectedReturn - targetReturn) / downwardDeviation;
    }
    calculateDownwardDeviation(investments, targetReturn) {
        // Simplified calculation - would need actual return series for proper implementation
        const volatility = this.calculatePortfolioVolatility(investments);
        return volatility * 0.7; // Approximate downward deviation as 70% of total volatility
    }
    calculateTimeToBreakeven(idea) {
        // Estimate based on expected return and time horizon
        const expectedReturn = this.calculateExpectedReturn(idea.investments, idea.potentialOutcomes);
        if (expectedReturn <= 0)
            return Infinity;
        // Simple breakeven calculation
        const transactionCosts = 0.01; // Assume 1% transaction costs
        return (transactionCosts / expectedReturn) * 365; // Convert to days
    }
    calculateOptimalHoldingPeriod(idea) {
        // Map time horizon to days
        const timeHorizonDays = {
            'intraday': 1,
            'short': 90,
            'medium': 365,
            'long': 1095,
            'very-long': 1825
        };
        return timeHorizonDays[idea.timeHorizon] || 365;
    }
    assessDataQuality(supportingData) {
        if (supportingData.length === 0)
            return 30;
        let qualityScore = 0;
        let totalWeight = 0;
        for (const dataPoint of supportingData) {
            const reliability = dataPoint.reliability || 0.5;
            const recency = this.calculateRecencyScore(dataPoint.timestamp);
            const sourceQuality = this.assessSourceQuality(dataPoint.source);
            const pointQuality = (reliability * 0.4 + recency * 0.3 + sourceQuality * 0.3) * 100;
            qualityScore += pointQuality;
            totalWeight += 1;
        }
        return totalWeight > 0 ? qualityScore / totalWeight : 50;
    }
    calculateRecencyScore(timestamp) {
        const now = new Date();
        const ageInDays = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays <= 1)
            return 1.0;
        if (ageInDays <= 7)
            return 0.9;
        if (ageInDays <= 30)
            return 0.7;
        if (ageInDays <= 90)
            return 0.5;
        if (ageInDays <= 365)
            return 0.3;
        return 0.1;
    }
    assessSourceQuality(source) {
        // Simple source quality assessment
        const highQualitySources = ['bloomberg', 'reuters', 'sec', 'fed', 'treasury'];
        const mediumQualitySources = ['yahoo', 'google', 'marketwatch', 'cnbc'];
        const lowerSource = source.toLowerCase();
        if (highQualitySources.some(s => lowerSource.includes(s)))
            return 0.9;
        if (mediumQualitySources.some(s => lowerSource.includes(s)))
            return 0.7;
        return 0.5;
    }
    assessMarketConditionSuitability(idea) {
        // Simplified market condition assessment
        let suitabilityScore = 50;
        // Adjust based on strategy and current market conditions
        switch (idea.strategy) {
            case 'growth':
                suitabilityScore += 10; // Assume growth-friendly environment
                break;
            case 'value':
                suitabilityScore += 5;
                break;
            case 'momentum':
                suitabilityScore -= 5; // Assume less suitable for momentum
                break;
        }
        // Adjust based on risk level and market volatility
        if (idea.riskLevel === 'high' || idea.riskLevel === 'very-high') {
            suitabilityScore -= 10; // High risk less suitable in uncertain times
        }
        return Math.max(0, Math.min(100, suitabilityScore));
    }
    // Risk assessment helper methods
    calculateOverallRiskScore(investments, idea) {
        let riskScore = 0;
        let factors = 0;
        // Portfolio volatility contribution
        const volatility = this.calculatePortfolioVolatility(investments);
        riskScore += Math.min(volatility * 100, 40); // Cap at 40 points
        factors++;
        // Concentration risk contribution
        const concentration = this.calculateConcentrationRisk(investments);
        riskScore += concentration * 20; // Up to 20 points
        factors++;
        // Time horizon risk (shorter = riskier for volatile assets)
        const timeHorizonRisk = this.calculateTimeHorizonRisk(idea.timeHorizon);
        riskScore += timeHorizonRisk;
        factors++;
        // Strategy risk
        const strategyRisk = this.calculateStrategyRisk(idea.strategy);
        riskScore += strategyRisk;
        factors++;
        return factors > 0 ? riskScore / factors : 50;
    }
    calculateTimeHorizonRisk(timeHorizon) {
        const riskScores = {
            'intraday': 30,
            'short': 20,
            'medium': 10,
            'long': 5,
            'very-long': 2
        };
        return riskScores[timeHorizon] || 15;
    }
    calculateStrategyRisk(strategy) {
        const riskScores = {
            'buy': 10,
            'hold': 5,
            'sell': 15,
            'short': 25,
            'long': 10,
            'hedge': 8,
            'arbitrage': 12,
            'pairs-trade': 15,
            'momentum': 20,
            'value': 8,
            'growth': 12,
            'income': 5,
            'complex': 25
        };
        return riskScores[strategy] || 15;
    }
    determineRiskLevel(riskScore) {
        if (riskScore <= 20)
            return 'very-low';
        if (riskScore <= 40)
            return 'low';
        if (riskScore <= 60)
            return 'moderate';
        if (riskScore <= 80)
            return 'high';
        return 'very-high';
    }
    identifyRiskFactors(investments, idea) {
        const riskFactors = [];
        if (investments.length === 0) {
            // Add a general risk factor for empty portfolios
            riskFactors.push({
                type: 'operational',
                severity: 'high',
                probability: 1.0,
                impact: 100,
                description: 'No investments in portfolio',
                timeHorizon: 'immediate'
            });
            return riskFactors;
        }
        // Market risk factors
        const avgBeta = investments.reduce((sum, inv) => sum + (inv.riskMetrics?.beta || 1), 0) / investments.length;
        if (avgBeta > 1.2) {
            riskFactors.push({
                type: 'market',
                severity: 'medium',
                probability: 0.3,
                impact: (avgBeta - 1) * 20,
                description: `High market sensitivity (Beta: ${avgBeta.toFixed(2)})`,
                timeHorizon: 'short-term'
            });
        }
        // Liquidity risk factors
        const lowLiquidityAssets = investments.filter(inv => inv.historicalPerformance.some(p => p.volume < 100000));
        if (lowLiquidityAssets.length > 0) {
            riskFactors.push({
                type: 'liquidity',
                severity: 'medium',
                probability: 0.4,
                impact: 15,
                description: `${lowLiquidityAssets.length} assets with potential liquidity constraints`,
                timeHorizon: 'immediate'
            });
        }
        // Concentration risk
        const sectors = new Set(investments.map(inv => inv.sector).filter(Boolean));
        if (sectors.size <= 2 && investments.length > 2) {
            riskFactors.push({
                type: 'market',
                severity: 'high',
                probability: 0.5,
                impact: 25,
                description: 'High sector concentration risk',
                timeHorizon: 'medium-term'
            });
        }
        // Strategy-specific risks
        if (idea.strategy === 'momentum') {
            riskFactors.push({
                type: 'market',
                severity: 'medium',
                probability: 0.6,
                impact: 20,
                description: 'Momentum strategy vulnerable to trend reversals',
                timeHorizon: 'short-term'
            });
        }
        // Always add at least one general risk factor to ensure mitigation strategies are generated
        if (riskFactors.length === 0) {
            riskFactors.push({
                type: 'market',
                severity: 'low',
                probability: 0.2,
                impact: 5,
                description: 'General market risk exposure',
                timeHorizon: 'medium-term'
            });
        }
        return riskFactors;
    }
    generateRiskMitigation(riskFactors) {
        return riskFactors.map(factor => {
            switch (factor.type) {
                case 'market':
                    return {
                        riskType: factor.type,
                        strategy: 'Consider hedging with market-neutral positions or defensive assets',
                        effectiveness: 0.7,
                        cost: 0.02,
                        implementation: 'gradual'
                    };
                case 'liquidity':
                    return {
                        riskType: factor.type,
                        strategy: 'Maintain cash reserves and stagger position sizes',
                        effectiveness: 0.8,
                        cost: 0.01,
                        implementation: 'immediate'
                    };
                case 'credit':
                    return {
                        riskType: factor.type,
                        strategy: 'Diversify across credit ratings and monitor credit spreads',
                        effectiveness: 0.6,
                        cost: 0.015,
                        implementation: 'gradual'
                    };
                default:
                    return {
                        riskType: factor.type,
                        strategy: 'Monitor closely and maintain stop-loss levels',
                        effectiveness: 0.5,
                        cost: 0.005,
                        implementation: 'immediate'
                    };
            }
        });
    }
    performStressTests(investments) {
        const results = [];
        // Market crash scenario
        results.push({
            scenario: 'Market Crash (-30%)',
            probability: 0.05,
            expectedLoss: 0.25,
            timeToRecovery: 365,
            description: 'Broad market decline of 30% over 3 months'
        });
        // Interest rate shock
        results.push({
            scenario: 'Interest Rate Shock (+200bp)',
            probability: 0.15,
            expectedLoss: 0.12,
            timeToRecovery: 180,
            description: 'Rapid increase in interest rates by 2 percentage points'
        });
        // Sector-specific stress
        const sectors = new Set(investments.map(inv => inv.sector).filter(Boolean));
        for (const sector of sectors) {
            results.push({
                scenario: `${sector} Sector Decline (-20%)`,
                probability: 0.1,
                expectedLoss: 0.15,
                timeToRecovery: 270,
                description: `Sector-specific decline in ${sector}`
            });
        }
        return results;
    }
    performScenarioAnalysis(investments) {
        return [
            {
                scenario: 'bull',
                probability: 0.3,
                riskLevel: 'low',
                expectedImpact: 0.15,
                keyTriggers: ['Economic growth', 'Low interest rates', 'Positive earnings']
            },
            {
                scenario: 'bear',
                probability: 0.2,
                riskLevel: 'high',
                expectedImpact: -0.25,
                keyTriggers: ['Recession', 'High inflation', 'Geopolitical tensions']
            },
            {
                scenario: 'sideways',
                probability: 0.4,
                riskLevel: 'moderate',
                expectedImpact: 0.02,
                keyTriggers: ['Mixed economic signals', 'Uncertainty', 'Range-bound markets']
            },
            {
                scenario: 'crisis',
                probability: 0.05,
                riskLevel: 'very-high',
                expectedImpact: -0.40,
                keyTriggers: ['Financial crisis', 'Black swan event', 'System failure']
            },
            {
                scenario: 'recovery',
                probability: 0.05,
                riskLevel: 'moderate',
                expectedImpact: 0.25,
                keyTriggers: ['Post-crisis recovery', 'Policy support', 'Pent-up demand']
            }
        ];
    }
    assessCorrelationRisks(investments) {
        const risks = [];
        for (let i = 0; i < investments.length; i++) {
            for (let j = i + 1; j < investments.length; j++) {
                const inv1 = investments[i];
                const inv2 = investments[j];
                const correlation = inv1.riskMetrics?.correlations?.[inv2.id] || 0.5;
                if (Math.abs(correlation) > 0.7) {
                    risks.push({
                        assetPair: `${inv1.name} - ${inv2.name}`,
                        correlation,
                        riskLevel: Math.abs(correlation) > 0.8 ? 'high' : 'medium',
                        description: `High correlation (${correlation.toFixed(2)}) reduces diversification benefits`
                    });
                }
            }
        }
        return risks;
    }
    assessLiquidityRisk(investments) {
        const avgVolume = investments.reduce((sum, inv) => {
            const recentVolume = inv.historicalPerformance.slice(-30)
                .reduce((vSum, p) => vSum + p.volume, 0) / 30;
            return sum + recentVolume;
        }, 0) / investments.length;
        const lowVolumeCount = investments.filter(inv => {
            const recentVolume = inv.historicalPerformance.slice(-30)
                .reduce((vSum, p) => vSum + p.volume, 0) / 30;
            return recentVolume < 100000;
        }).length;
        const liquidityLevel = lowVolumeCount > investments.length * 0.3 ? 'high' :
            lowVolumeCount > 0 ? 'medium' : 'low';
        return {
            level: liquidityLevel,
            averageDailyVolume: avgVolume,
            bidAskSpread: 0.01,
            marketImpactCost: liquidityLevel === 'high' ? 0.02 : liquidityLevel === 'medium' ? 0.01 : 0.005,
            timeToLiquidate: liquidityLevel === 'high' ? 5 : liquidityLevel === 'medium' ? 2 : 1
        };
    }
    assessConcentrationRisk(investments) {
        const sectors = new Set(investments.map(inv => inv.sector).filter(Boolean));
        const assetTypes = new Set(investments.map(inv => inv.type));
        const sectorConcentration = 1 - (sectors.size / Math.max(investments.length, 1));
        const assetClassConcentration = 1 - (assetTypes.size / Math.max(investments.length, 1));
        // Single position risk (assuming equal weights)
        const singlePositionRisk = 1 / investments.length;
        const overallLevel = sectorConcentration > 0.7 || assetClassConcentration > 0.7 || singlePositionRisk > 0.3 ? 'high' :
            sectorConcentration > 0.5 || assetClassConcentration > 0.5 || singlePositionRisk > 0.2 ? 'medium' : 'low';
        return {
            level: overallLevel,
            sectorConcentration,
            geographicConcentration: 0.5,
            assetClassConcentration,
            singlePositionRisk
        };
    }
    assessMarketRisk(investments) {
        const avgBeta = investments.reduce((sum, inv) => sum + (inv.riskMetrics?.beta || 1), 0) / investments.length;
        return {
            beta: avgBeta,
            marketSensitivity: avgBeta,
            sectorSensitivity: 0.7,
            interestRateSensitivity: 0.3,
            currencyExposure: 0.1 // Simplified assumption
        };
    }
    assessCreditRisk(investments) {
        const bondInvestments = investments.filter(inv => inv.type === 'bond');
        if (bondInvestments.length === 0)
            return undefined;
        return {
            creditRating: 'BBB',
            defaultProbability: 0.02,
            recoveryRate: 0.6,
            creditSpread: 0.015
        };
    }
    assessOperationalRisk(investments, idea) {
        // Simplified operational risk assessment
        const complexityScore = idea.strategy === 'complex' ? 0.8 : 0.3;
        const dataQualityScore = this.assessDataQuality(idea.supportingData) / 100;
        return {
            level: complexityScore > 0.6 ? 'high' : complexityScore > 0.3 ? 'medium' : 'low',
            keyPersonRisk: 0.2,
            systemRisk: 0.1,
            processRisk: complexityScore,
            externalEventRisk: 0.15
        };
    }
    // Expected outcome modeling helper methods
    createBaseScenario(idea) {
        const expectedOutcome = idea.potentialOutcomes.find(o => o.scenario === 'expected');
        return {
            probability: 0.6,
            expectedReturn: expectedOutcome?.returnEstimate || 0.08,
            timeToRealization: expectedOutcome?.timeToRealization || this.calculateOptimalHoldingPeriod(idea),
            keyAssumptions: [
                'Market conditions remain stable',
                'Company fundamentals improve as expected',
                'No major external shocks'
            ],
            catalysts: expectedOutcome?.catalysts || ['Earnings growth', 'Market expansion'],
            risks: expectedOutcome?.keyRisks || ['Market volatility', 'Execution risk'],
            milestones: this.generateMilestones(idea)
        };
    }
    createBullScenario(idea) {
        const bestOutcome = idea.potentialOutcomes.find(o => o.scenario === 'best');
        return {
            probability: 0.2,
            expectedReturn: bestOutcome?.returnEstimate || 0.20,
            timeToRealization: (bestOutcome?.timeToRealization || this.calculateOptimalHoldingPeriod(idea)) * 0.8,
            keyAssumptions: [
                'Favorable market conditions',
                'Strong execution of business plan',
                'Positive regulatory environment'
            ],
            catalysts: bestOutcome?.catalysts || ['Strong earnings beat', 'Market leadership', 'Strategic partnerships'],
            risks: ['Overvaluation', 'Market correction'],
            milestones: this.generateMilestones(idea, 'bull')
        };
    }
    createBearScenario(idea) {
        const worstOutcome = idea.potentialOutcomes.find(o => o.scenario === 'worst');
        return {
            probability: 0.2,
            expectedReturn: worstOutcome?.returnEstimate || -0.15,
            timeToRealization: (worstOutcome?.timeToRealization || this.calculateOptimalHoldingPeriod(idea)) * 1.5,
            keyAssumptions: [
                'Adverse market conditions',
                'Execution challenges',
                'Regulatory headwinds'
            ],
            catalysts: ['Earnings miss', 'Competitive pressure', 'Economic downturn'],
            risks: worstOutcome?.keyRisks || ['Significant losses', 'Liquidity issues'],
            milestones: this.generateMilestones(idea, 'bear')
        };
    }
    generateMilestones(idea, scenario = 'base') {
        const milestones = [];
        const baseDate = new Date();
        const holdingPeriod = this.calculateOptimalHoldingPeriod(idea);
        // Quarterly milestones
        for (let i = 1; i <= Math.ceil(holdingPeriod / 90); i++) {
            const date = new Date(baseDate);
            date.setDate(date.getDate() + (i * 90));
            milestones.push({
                date,
                description: `Q${i} Performance Review`,
                probability: scenario === 'bull' ? 0.8 : scenario === 'bear' ? 0.4 : 0.6,
                impact: scenario === 'bull' ? 0.05 : scenario === 'bear' ? -0.03 : 0.02,
                type: 'decision-point'
            });
        }
        // Major market events
        const marketEventDate = new Date(baseDate);
        marketEventDate.setDate(marketEventDate.getDate() + (holdingPeriod / 2));
        milestones.push({
            date: marketEventDate,
            description: 'Major Market Event',
            probability: 0.3,
            impact: scenario === 'bull' ? 0.10 : scenario === 'bear' ? -0.15 : -0.05,
            type: 'market-event'
        });
        return milestones;
    }
    calculateProbabilityWeightedReturn(scenarios) {
        return scenarios.reduce((sum, scenario) => sum + (scenario.expectedReturn * scenario.probability), 0);
    }
    calculateConfidenceInterval(investments) {
        const expectedReturn = this.calculateExpectedReturn(investments, []);
        const volatility = this.calculatePortfolioVolatility(investments);
        // 95% confidence interval
        const zScore = 1.96;
        const standardError = volatility / Math.sqrt(252); // Daily to annual
        return {
            level: 0.95,
            lowerBound: expectedReturn - (zScore * standardError),
            upperBound: expectedReturn + (zScore * standardError),
            standardError
        };
    }
    performSensitivityAnalysis(investments, idea) {
        const variables = [
            {
                name: 'Market Return',
                baseValue: 0.08,
                impact: 1.2,
                elasticity: 1.5,
                range: { min: -0.30, max: 0.30 }
            },
            {
                name: 'Interest Rates',
                baseValue: 0.05,
                impact: -0.8,
                elasticity: -1.2,
                range: { min: 0.01, max: 0.10 }
            },
            {
                name: 'Volatility',
                baseValue: 0.20,
                impact: -0.3,
                elasticity: -0.5,
                range: { min: 0.10, max: 0.50 }
            }
        ];
        // Simplified correlation matrix
        const correlationMatrix = [
            [1.0, -0.3, 0.6],
            [-0.3, 1.0, -0.2],
            [0.6, -0.2, 1.0] // Volatility correlations
        ];
        return {
            variables,
            correlationMatrix,
            keyDrivers: ['Market Return', 'Interest Rates']
        };
    }
    runMonteCarloSimulation(investments, idea) {
        const iterations = 10000;
        const expectedReturn = this.calculateExpectedReturn(investments, idea.potentialOutcomes);
        const volatility = this.calculatePortfolioVolatility(investments);
        const returns = [];
        // Simple Monte Carlo simulation using normal distribution
        for (let i = 0; i < iterations; i++) {
            const randomReturn = this.generateNormalRandom(expectedReturn, volatility);
            returns.push(randomReturn);
        }
        returns.sort((a, b) => a - b);
        const meanReturn = returns.reduce((sum, r) => sum + r, 0) / iterations;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / iterations;
        const standardDeviation = Math.sqrt(variance);
        const percentiles = {
            '1': returns[Math.floor(iterations * 0.01)],
            '5': returns[Math.floor(iterations * 0.05)],
            '10': returns[Math.floor(iterations * 0.10)],
            '25': returns[Math.floor(iterations * 0.25)],
            '50': returns[Math.floor(iterations * 0.50)],
            '75': returns[Math.floor(iterations * 0.75)],
            '90': returns[Math.floor(iterations * 0.90)],
            '95': returns[Math.floor(iterations * 0.95)],
            '99': returns[Math.floor(iterations * 0.99)]
        };
        const probabilityOfLoss = returns.filter(r => r < 0).length / iterations;
        const targetReturn = 0.10; // 10% target
        const probabilityOfTarget = returns.filter(r => r >= targetReturn).length / iterations;
        // Expected Shortfall (Conditional VaR at 5%)
        const var5 = percentiles['5'];
        const tailReturns = returns.filter(r => r <= var5);
        const expectedShortfall = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
        return {
            iterations,
            meanReturn,
            standardDeviation,
            percentiles,
            probabilityOfLoss,
            probabilityOfTarget,
            expectedShortfall
        };
    }
    generateNormalRandom(mean, stdDev) {
        // Box-Muller transformation for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + (stdDev * z0);
    }
    generateTimeSeriesProjection(idea, monteCarloResults) {
        const projections = [];
        const holdingPeriod = this.calculateOptimalHoldingPeriod(idea);
        const steps = Math.min(holdingPeriod, 365); // Daily projections up to 1 year
        const baseDate = new Date();
        const dailyReturn = monteCarloResults.meanReturn / 252; // Annualized to daily
        const dailyVolatility = monteCarloResults.standardDeviation / Math.sqrt(252);
        let cumulativeReturn = 0;
        for (let i = 1; i <= steps; i++) {
            const date = new Date(baseDate);
            date.setDate(date.getDate() + i);
            const expectedValue = dailyReturn * i;
            const volatilityAdjustment = dailyVolatility * Math.sqrt(i);
            cumulativeReturn += dailyReturn;
            projections.push({
                date,
                expectedValue,
                confidenceBands: {
                    upper95: expectedValue + (1.96 * volatilityAdjustment),
                    upper68: expectedValue + (1.0 * volatilityAdjustment),
                    lower68: expectedValue - (1.0 * volatilityAdjustment),
                    lower95: expectedValue - (1.96 * volatilityAdjustment)
                },
                cumulativeReturn
            });
        }
        return projections;
    }
}
exports.SupportingAnalysisService = SupportingAnalysisService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VwcG9ydGluZy1hbmFseXNpcy1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NlcnZpY2VzL3N1cHBvcnRpbmctYW5hbHlzaXMtc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7O0FBOE1ILE1BQWEseUJBQXlCO0lBQ3BDOztPQUVHO0lBQ0gsS0FBSyxDQUFDLG1CQUFtQixDQUFDLElBQW9CO1FBQzVDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7UUFFckMsb0NBQW9DO1FBQ3BDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDekYsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2xFLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDMUUsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzNELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTO1FBRTNFLGlDQUFpQztRQUNqQyxNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM3RSxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNyRSxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUV2RSxpQkFBaUI7UUFDakIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFD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QUFPLFdBQVcsQ0FBQztJQUNyQixDQUFDO0NBQ0Y7QUE1b0NELDhEQTRvQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFN1cHBvcnRpbmcgQW5hbHlzaXMgU2VydmljZVxuICogSW1wbGVtZW50cyBrZXkgbWV0cmljcyBjYWxjdWxhdGlvbiwgcmlzayBhc3Nlc3NtZW50IGFsZ29yaXRobXMsIGFuZCBleHBlY3RlZCBvdXRjb21lIG1vZGVsaW5nXG4gKiBSZXF1aXJlbWVudHM6IDQuMywgNy4yLCA3LjNcbiAqL1xuXG5pbXBvcnQgeyBJbnZlc3RtZW50LCBSaXNrTWV0cmljcywgRnVuZGFtZW50YWxzLCBUZWNobmljYWxJbmRpY2F0b3JzIH0gZnJvbSAnLi4vbW9kZWxzL2ludmVzdG1lbnQnO1xuaW1wb3J0IHsgSW52ZXN0bWVudElkZWEsIE91dGNvbWUsIFRpbWVIb3Jpem9uLCBSaXNrTGV2ZWwgfSBmcm9tICcuLi9tb2RlbHMvaW52ZXN0bWVudC1pZGVhJztcbmltcG9ydCB7IERhdGFQb2ludCB9IGZyb20gJy4uL21vZGVscy9hbmFseXNpcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgS2V5TWV0cmljcyB7XG4gIC8vIEZpbmFuY2lhbCBtZXRyaWNzXG4gIGV4cGVjdGVkUmV0dXJuOiBudW1iZXI7XG4gIHZvbGF0aWxpdHk6IG51bWJlcjtcbiAgc2hhcnBlUmF0aW86IG51bWJlcjtcbiAgbWF4RHJhd2Rvd246IG51bWJlcjtcbiAgdmFsdWVBdFJpc2s6IG51bWJlcjtcbiAgXG4gIC8vIFBvcnRmb2xpbyBtZXRyaWNzXG4gIGRpdmVyc2lmaWNhdGlvblJhdGlvOiBudW1iZXI7XG4gIGNvcnJlbGF0aW9uU2NvcmU6IG51bWJlcjtcbiAgY29uY2VudHJhdGlvblJpc2s6IG51bWJlcjtcbiAgXG4gIC8vIFF1YWxpdHkgbWV0cmljc1xuICBmdW5kYW1lbnRhbFNjb3JlOiBudW1iZXI7XG4gIHRlY2huaWNhbFNjb3JlOiBudW1iZXI7XG4gIHNlbnRpbWVudFNjb3JlOiBudW1iZXI7XG4gIFxuICAvLyBSaXNrLWFkanVzdGVkIG1ldHJpY3NcbiAgaW5mb3JtYXRpb25SYXRpbzogbnVtYmVyO1xuICBjYWxtYXJSYXRpbzogbnVtYmVyO1xuICBzb3J0aW5vUmF0aW86IG51bWJlcjtcbiAgXG4gIC8vIFRpbWUtYmFzZWQgbWV0cmljc1xuICB0aW1lVG9CcmVha2V2ZW46IG51bWJlcjsgLy8gaW4gZGF5c1xuICBvcHRpbWFsSG9sZGluZ1BlcmlvZDogbnVtYmVyOyAvLyBpbiBkYXlzXG4gIFxuICAvLyBDb25maWRlbmNlIG1ldHJpY3NcbiAgZGF0YVF1YWxpdHk6IG51bWJlcjtcbiAgbW9kZWxDb25maWRlbmNlOiBudW1iZXI7XG4gIG1hcmtldENvbmRpdGlvblN1aXRhYmlsaXR5OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmlza0Fzc2Vzc21lbnQge1xuICBvdmVyYWxsUmlza0xldmVsOiBSaXNrTGV2ZWw7XG4gIHJpc2tTY29yZTogbnVtYmVyOyAvLyAwLTEwMFxuICByaXNrRmFjdG9yczogUmlza0ZhY3RvcltdO1xuICByaXNrTWl0aWdhdGlvbjogUmlza01pdGlnYXRpb25bXTtcbiAgc3RyZXNzVGVzdFJlc3VsdHM6IFN0cmVzc1Rlc3RSZXN1bHRbXTtcbiAgc2NlbmFyaW9BbmFseXNpczogU2NlbmFyaW9SaXNrW107XG4gIGNvcnJlbGF0aW9uUmlza3M6IENvcnJlbGF0aW9uUmlza1tdO1xuICBsaXF1aWRpdHlSaXNrOiBMaXF1aWRpdHlSaXNrO1xuICBjb25jZW50cmF0aW9uUmlzazogQ29uY2VudHJhdGlvblJpc2s7XG4gIG1hcmtldFJpc2s6IE1hcmtldFJpc2s7XG4gIGNyZWRpdFJpc2s/OiBDcmVkaXRSaXNrO1xuICBvcGVyYXRpb25hbFJpc2s6IE9wZXJhdGlvbmFsUmlzaztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSaXNrRmFjdG9yIHtcbiAgdHlwZTogJ21hcmtldCcgfCAnY3JlZGl0JyB8ICdsaXF1aWRpdHknIHwgJ29wZXJhdGlvbmFsJyB8ICdyZWd1bGF0b3J5JyB8ICdnZW9wb2xpdGljYWwnIHwgJ2N1cnJlbmN5JyB8ICdpbnRlcmVzdC1yYXRlJztcbiAgc2V2ZXJpdHk6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCcgfCAnY3JpdGljYWwnO1xuICBwcm9iYWJpbGl0eTogbnVtYmVyOyAvLyAwLTFcbiAgaW1wYWN0OiBudW1iZXI7IC8vIHBvdGVudGlhbCBsb3NzIGFzIHBlcmNlbnRhZ2VcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgdGltZUhvcml6b246ICdpbW1lZGlhdGUnIHwgJ3Nob3J0LXRlcm0nIHwgJ21lZGl1bS10ZXJtJyB8ICdsb25nLXRlcm0nO1xuICBtaXRpZ2F0aW9uPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJpc2tNaXRpZ2F0aW9uIHtcbiAgcmlza1R5cGU6IHN0cmluZztcbiAgc3RyYXRlZ3k6IHN0cmluZztcbiAgZWZmZWN0aXZlbmVzczogbnVtYmVyOyAvLyAwLTFcbiAgY29zdDogbnVtYmVyOyAvLyBhcyBwZXJjZW50YWdlIG9mIGludmVzdG1lbnRcbiAgaW1wbGVtZW50YXRpb246ICdpbW1lZGlhdGUnIHwgJ2dyYWR1YWwnIHwgJ2NvbmRpdGlvbmFsJztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdHJlc3NUZXN0UmVzdWx0IHtcbiAgc2NlbmFyaW86IHN0cmluZztcbiAgcHJvYmFiaWxpdHk6IG51bWJlcjtcbiAgZXhwZWN0ZWRMb3NzOiBudW1iZXI7XG4gIHRpbWVUb1JlY292ZXJ5OiBudW1iZXI7IC8vIGluIGRheXNcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTY2VuYXJpb1Jpc2sge1xuICBzY2VuYXJpbzogJ2J1bGwnIHwgJ2JlYXInIHwgJ3NpZGV3YXlzJyB8ICdjcmlzaXMnIHwgJ3JlY292ZXJ5JztcbiAgcHJvYmFiaWxpdHk6IG51bWJlcjtcbiAgcmlza0xldmVsOiBSaXNrTGV2ZWw7XG4gIGV4cGVjdGVkSW1wYWN0OiBudW1iZXI7XG4gIGtleVRyaWdnZXJzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb3JyZWxhdGlvblJpc2sge1xuICBhc3NldFBhaXI6IHN0cmluZztcbiAgY29ycmVsYXRpb246IG51bWJlcjtcbiAgcmlza0xldmVsOiAnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExpcXVpZGl0eVJpc2sge1xuICBsZXZlbDogJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJztcbiAgYXZlcmFnZURhaWx5Vm9sdW1lOiBudW1iZXI7XG4gIGJpZEFza1NwcmVhZDogbnVtYmVyO1xuICBtYXJrZXRJbXBhY3RDb3N0OiBudW1iZXI7XG4gIHRpbWVUb0xpcXVpZGF0ZTogbnVtYmVyOyAvLyBpbiBkYXlzXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29uY2VudHJhdGlvblJpc2sge1xuICBsZXZlbDogJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJztcbiAgc2VjdG9yQ29uY2VudHJhdGlvbjogbnVtYmVyO1xuICBnZW9ncmFwaGljQ29uY2VudHJhdGlvbjogbnVtYmVyO1xuICBhc3NldENsYXNzQ29uY2VudHJhdGlvbjogbnVtYmVyO1xuICBzaW5nbGVQb3NpdGlvblJpc2s6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNYXJrZXRSaXNrIHtcbiAgYmV0YTogbnVtYmVyO1xuICBtYXJrZXRTZW5zaXRpdml0eTogbnVtYmVyO1xuICBzZWN0b3JTZW5zaXRpdml0eTogbnVtYmVyO1xuICBpbnRlcmVzdFJhdGVTZW5zaXRpdml0eTogbnVtYmVyO1xuICBjdXJyZW5jeUV4cG9zdXJlOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlZGl0UmlzayB7XG4gIGNyZWRpdFJhdGluZz86IHN0cmluZztcbiAgZGVmYXVsdFByb2JhYmlsaXR5OiBudW1iZXI7XG4gIHJlY292ZXJ5UmF0ZTogbnVtYmVyO1xuICBjcmVkaXRTcHJlYWQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPcGVyYXRpb25hbFJpc2sge1xuICBsZXZlbDogJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJztcbiAga2V5UGVyc29uUmlzazogbnVtYmVyO1xuICBzeXN0ZW1SaXNrOiBudW1iZXI7XG4gIHByb2Nlc3NSaXNrOiBudW1iZXI7XG4gIGV4dGVybmFsRXZlbnRSaXNrOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXhwZWN0ZWRPdXRjb21lTW9kZWwge1xuICBiYXNlQ2FzZTogT3V0Y29tZVNjZW5hcmlvO1xuICBidWxsQ2FzZTogT3V0Y29tZVNjZW5hcmlvO1xuICBiZWFyQ2FzZTogT3V0Y29tZVNjZW5hcmlvO1xuICBwcm9iYWJpbGl0eVdlaWdodGVkUmV0dXJuOiBudW1iZXI7XG4gIGNvbmZpZGVuY2VJbnRlcnZhbDogQ29uZmlkZW5jZUludGVydmFsO1xuICBzZW5zaXRpdml0eUFuYWx5c2lzOiBTZW5zaXRpdml0eUFuYWx5c2lzO1xuICBtb250ZUNhcmxvUmVzdWx0czogTW9udGVDYXJsb1Jlc3VsdHM7XG4gIHRpbWVTZXJpZXNQcm9qZWN0aW9uOiBUaW1lU2VyaWVzUHJvamVjdGlvbltdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE91dGNvbWVTY2VuYXJpbyB7XG4gIHByb2JhYmlsaXR5OiBudW1iZXI7XG4gIGV4cGVjdGVkUmV0dXJuOiBudW1iZXI7XG4gIHRpbWVUb1JlYWxpemF0aW9uOiBudW1iZXI7IC8vIGluIGRheXNcbiAga2V5QXNzdW1wdGlvbnM6IHN0cmluZ1tdO1xuICBjYXRhbHlzdHM6IHN0cmluZ1tdO1xuICByaXNrczogc3RyaW5nW107XG4gIG1pbGVzdG9uZXM6IE1pbGVzdG9uZVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbmZpZGVuY2VJbnRlcnZhbCB7XG4gIGxldmVsOiBudW1iZXI7IC8vIGUuZy4sIDAuOTUgZm9yIDk1JVxuICBsb3dlckJvdW5kOiBudW1iZXI7XG4gIHVwcGVyQm91bmQ6IG51bWJlcjtcbiAgc3RhbmRhcmRFcnJvcjogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlbnNpdGl2aXR5QW5hbHlzaXMge1xuICB2YXJpYWJsZXM6IFNlbnNpdGl2aXR5VmFyaWFibGVbXTtcbiAgY29ycmVsYXRpb25NYXRyaXg6IG51bWJlcltdW107XG4gIGtleURyaXZlcnM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlbnNpdGl2aXR5VmFyaWFibGUge1xuICBuYW1lOiBzdHJpbmc7XG4gIGJhc2VWYWx1ZTogbnVtYmVyO1xuICBpbXBhY3Q6IG51bWJlcjsgLy8gY2hhbmdlIGluIG91dGNvbWUgcGVyIHVuaXQgY2hhbmdlIGluIHZhcmlhYmxlXG4gIGVsYXN0aWNpdHk6IG51bWJlcjtcbiAgcmFuZ2U6IHsgbWluOiBudW1iZXI7IG1heDogbnVtYmVyIH07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTW9udGVDYXJsb1Jlc3VsdHMge1xuICBpdGVyYXRpb25zOiBudW1iZXI7XG4gIG1lYW5SZXR1cm46IG51bWJlcjtcbiAgc3RhbmRhcmREZXZpYXRpb246IG51bWJlcjtcbiAgcGVyY2VudGlsZXM6IFJlY29yZDxzdHJpbmcsIG51bWJlcj47IC8vIGUuZy4sIFwiNVwiOiAtMC4xNSwgXCI5NVwiOiAwLjI1XG4gIHByb2JhYmlsaXR5T2ZMb3NzOiBudW1iZXI7XG4gIHByb2JhYmlsaXR5T2ZUYXJnZXQ6IG51bWJlcjtcbiAgZXhwZWN0ZWRTaG9ydGZhbGw6IG51bWJlcjsgLy8gQ29uZGl0aW9uYWwgVmFSXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGltZVNlcmllc1Byb2plY3Rpb24ge1xuICBkYXRlOiBEYXRlO1xuICBleHBlY3RlZFZhbHVlOiBudW1iZXI7XG4gIGNvbmZpZGVuY2VCYW5kczoge1xuICAgIHVwcGVyOTU6IG51bWJlcjtcbiAgICB1cHBlcjY4OiBudW1iZXI7XG4gICAgbG93ZXI2ODogbnVtYmVyO1xuICAgIGxvd2VyOTU6IG51bWJlcjtcbiAgfTtcbiAgY3VtdWxhdGl2ZVJldHVybjogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbGVzdG9uZSB7XG4gIGRhdGU6IERhdGU7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIHByb2JhYmlsaXR5OiBudW1iZXI7XG4gIGltcGFjdDogbnVtYmVyO1xuICB0eXBlOiAnY2F0YWx5c3QnIHwgJ3Jpc2stZXZlbnQnIHwgJ2RlY2lzaW9uLXBvaW50JyB8ICdtYXJrZXQtZXZlbnQnO1xufVxuXG5leHBvcnQgY2xhc3MgU3VwcG9ydGluZ0FuYWx5c2lzU2VydmljZSB7XG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIGNvbXByZWhlbnNpdmUga2V5IG1ldHJpY3MgZm9yIGFuIGludmVzdG1lbnQgaWRlYVxuICAgKi9cbiAgYXN5bmMgY2FsY3VsYXRlS2V5TWV0cmljcyhpZGVhOiBJbnZlc3RtZW50SWRlYSk6IFByb21pc2U8S2V5TWV0cmljcz4ge1xuICAgIGNvbnN0IGludmVzdG1lbnRzID0gaWRlYS5pbnZlc3RtZW50cztcbiAgICBcbiAgICAvLyBDYWxjdWxhdGUgcG9ydGZvbGlvLWxldmVsIG1ldHJpY3NcbiAgICBjb25zdCBleHBlY3RlZFJldHVybiA9IHRoaXMuY2FsY3VsYXRlRXhwZWN0ZWRSZXR1cm4oaW52ZXN0bWVudHMsIGlkZWEucG90ZW50aWFsT3V0Y29tZXMpO1xuICAgIGNvbnN0IHZvbGF0aWxpdHkgPSB0aGlzLmNhbGN1bGF0ZVBvcnRmb2xpb1ZvbGF0aWxpdHkoaW52ZXN0bWVudHMpO1xuICAgIGNvbnN0IHNoYXJwZVJhdGlvID0gdGhpcy5jYWxjdWxhdGVTaGFycGVSYXRpbyhleHBlY3RlZFJldHVybiwgdm9sYXRpbGl0eSk7XG4gICAgY29uc3QgbWF4RHJhd2Rvd24gPSB0aGlzLmNhbGN1bGF0ZU1heERyYXdkb3duKGludmVzdG1lbnRzKTtcbiAgICBjb25zdCB2YWx1ZUF0UmlzayA9IHRoaXMuY2FsY3VsYXRlVmFsdWVBdFJpc2soaW52ZXN0bWVudHMsIDAuMDUpOyAvLyA1JSBWYVJcbiAgICBcbiAgICAvLyBQb3J0Zm9saW8gY29uc3RydWN0aW9uIG1ldHJpY3NcbiAgICBjb25zdCBkaXZlcnNpZmljYXRpb25SYXRpbyA9IHRoaXMuY2FsY3VsYXRlRGl2ZXJzaWZpY2F0aW9uUmF0aW8oaW52ZXN0bWVudHMpO1xuICAgIGNvbnN0IGNvcnJlbGF0aW9uU2NvcmUgPSB0aGlzLmNhbGN1bGF0ZUNvcnJlbGF0aW9uU2NvcmUoaW52ZXN0bWVudHMpO1xuICAgIGNvbnN0IGNvbmNlbnRyYXRpb25SaXNrID0gdGhpcy5jYWxjdWxhdGVDb25jZW50cmF0aW9uUmlzayhpbnZlc3RtZW50cyk7XG4gICAgXG4gICAgLy8gUXVhbGl0eSBzY29yZXNcbiAgICBjb25zdCBmdW5kYW1lbnRhbFNjb3JlID0gdGhpcy5jYWxjdWxhdGVGdW5kYW1lbnRhbFNjb3JlKGludmVzdG1lbnRzKTtcbiAgICBjb25zdCB0ZWNobmljYWxTY29yZSA9IHRoaXMuY2FsY3VsYXRlVGVjaG5pY2FsU2NvcmUoaW52ZXN0bWVudHMpO1xuICAgIGNvbnN0IHNlbnRpbWVudFNjb3JlID0gdGhpcy5jYWxjdWxhdGVTZW50aW1lbnRTY29yZShpbnZlc3RtZW50cyk7XG4gICAgXG4gICAgLy8gUmlzay1hZGp1c3RlZCBtZXRyaWNzXG4gICAgY29uc3QgaW5mb3JtYXRpb25SYXRpbyA9IHRoaXMuY2FsY3VsYXRlSW5mb3JtYXRpb25SYXRpbyhpbnZlc3RtZW50cyk7XG4gICAgY29uc3QgY2FsbWFyUmF0aW8gPSB0aGlzLmNhbGN1bGF0ZUNhbG1hclJhdGlvKGV4cGVjdGVkUmV0dXJuLCBtYXhEcmF3ZG93bik7XG4gICAgY29uc3Qgc29ydGlub1JhdGlvID0gdGhpcy5jYWxjdWxhdGVTb3J0aW5vUmF0aW8oaW52ZXN0bWVudHMpO1xuICAgIFxuICAgIC8vIFRpbWUtYmFzZWQgbWV0cmljc1xuICAgIGNvbnN0IHRpbWVUb0JyZWFrZXZlbiA9IHRoaXMuY2FsY3VsYXRlVGltZVRvQnJlYWtldmVuKGlkZWEpO1xuICAgIGNvbnN0IG9wdGltYWxIb2xkaW5nUGVyaW9kID0gdGhpcy5jYWxjdWxhdGVPcHRpbWFsSG9sZGluZ1BlcmlvZChpZGVhKTtcbiAgICBcbiAgICAvLyBDb25maWRlbmNlIG1ldHJpY3NcbiAgICBjb25zdCBkYXRhUXVhbGl0eSA9IHRoaXMuYXNzZXNzRGF0YVF1YWxpdHkoaWRlYS5zdXBwb3J0aW5nRGF0YSk7XG4gICAgY29uc3QgbW9kZWxDb25maWRlbmNlID0gaWRlYS5jb25maWRlbmNlU2NvcmU7XG4gICAgY29uc3QgbWFya2V0Q29uZGl0aW9uU3VpdGFiaWxpdHkgPSB0aGlzLmFzc2Vzc01hcmtldENvbmRpdGlvblN1aXRhYmlsaXR5KGlkZWEpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGV4cGVjdGVkUmV0dXJuLFxuICAgICAgdm9sYXRpbGl0eSxcbiAgICAgIHNoYXJwZVJhdGlvLFxuICAgICAgbWF4RHJhd2Rvd24sXG4gICAgICB2YWx1ZUF0UmlzayxcbiAgICAgIGRpdmVyc2lmaWNhdGlvblJhdGlvLFxuICAgICAgY29ycmVsYXRpb25TY29yZSxcbiAgICAgIGNvbmNlbnRyYXRpb25SaXNrLFxuICAgICAgZnVuZGFtZW50YWxTY29yZSxcbiAgICAgIHRlY2huaWNhbFNjb3JlLFxuICAgICAgc2VudGltZW50U2NvcmUsXG4gICAgICBpbmZvcm1hdGlvblJhdGlvLFxuICAgICAgY2FsbWFyUmF0aW8sXG4gICAgICBzb3J0aW5vUmF0aW8sXG4gICAgICB0aW1lVG9CcmVha2V2ZW4sXG4gICAgICBvcHRpbWFsSG9sZGluZ1BlcmlvZCxcbiAgICAgIGRhdGFRdWFsaXR5LFxuICAgICAgbW9kZWxDb25maWRlbmNlLFxuICAgICAgbWFya2V0Q29uZGl0aW9uU3VpdGFiaWxpdHlcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGNvbXByZWhlbnNpdmUgcmlzayBhc3Nlc3NtZW50XG4gICAqL1xuICBhc3luYyBhc3Nlc3NSaXNrKGlkZWE6IEludmVzdG1lbnRJZGVhKTogUHJvbWlzZTxSaXNrQXNzZXNzbWVudD4ge1xuICAgIGNvbnN0IGludmVzdG1lbnRzID0gaWRlYS5pbnZlc3RtZW50cztcbiAgICBcbiAgICAvLyBDYWxjdWxhdGUgb3ZlcmFsbCByaXNrIHNjb3JlIGFuZCBsZXZlbFxuICAgIGNvbnN0IHJpc2tTY29yZSA9IHRoaXMuY2FsY3VsYXRlT3ZlcmFsbFJpc2tTY29yZShpbnZlc3RtZW50cywgaWRlYSk7XG4gICAgY29uc3Qgb3ZlcmFsbFJpc2tMZXZlbCA9IHRoaXMuZGV0ZXJtaW5lUmlza0xldmVsKHJpc2tTY29yZSk7XG4gICAgXG4gICAgLy8gSWRlbnRpZnkgcmlzayBmYWN0b3JzXG4gICAgY29uc3Qgcmlza0ZhY3RvcnMgPSB0aGlzLmlkZW50aWZ5Umlza0ZhY3RvcnMoaW52ZXN0bWVudHMsIGlkZWEpO1xuICAgIFxuICAgIC8vIEdlbmVyYXRlIHJpc2sgbWl0aWdhdGlvbiBzdHJhdGVnaWVzXG4gICAgY29uc3Qgcmlza01pdGlnYXRpb24gPSB0aGlzLmdlbmVyYXRlUmlza01pdGlnYXRpb24ocmlza0ZhY3RvcnMpO1xuICAgIFxuICAgIC8vIFBlcmZvcm0gc3RyZXNzIHRlc3RzXG4gICAgY29uc3Qgc3RyZXNzVGVzdFJlc3VsdHMgPSB0aGlzLnBlcmZvcm1TdHJlc3NUZXN0cyhpbnZlc3RtZW50cyk7XG4gICAgXG4gICAgLy8gU2NlbmFyaW8gYW5hbHlzaXNcbiAgICBjb25zdCBzY2VuYXJpb0FuYWx5c2lzID0gdGhpcy5wZXJmb3JtU2NlbmFyaW9BbmFseXNpcyhpbnZlc3RtZW50cyk7XG4gICAgXG4gICAgLy8gQ29ycmVsYXRpb24gcmlza3NcbiAgICBjb25zdCBjb3JyZWxhdGlvblJpc2tzID0gdGhpcy5hc3Nlc3NDb3JyZWxhdGlvblJpc2tzKGludmVzdG1lbnRzKTtcbiAgICBcbiAgICAvLyBTcGVjaWZpYyByaXNrIGFzc2Vzc21lbnRzXG4gICAgY29uc3QgbGlxdWlkaXR5UmlzayA9IHRoaXMuYXNzZXNzTGlxdWlkaXR5UmlzayhpbnZlc3RtZW50cyk7XG4gICAgY29uc3QgY29uY2VudHJhdGlvblJpc2sgPSB0aGlzLmFzc2Vzc0NvbmNlbnRyYXRpb25SaXNrKGludmVzdG1lbnRzKTtcbiAgICBjb25zdCBtYXJrZXRSaXNrID0gdGhpcy5hc3Nlc3NNYXJrZXRSaXNrKGludmVzdG1lbnRzKTtcbiAgICBjb25zdCBjcmVkaXRSaXNrID0gdGhpcy5hc3Nlc3NDcmVkaXRSaXNrKGludmVzdG1lbnRzKTtcbiAgICBjb25zdCBvcGVyYXRpb25hbFJpc2sgPSB0aGlzLmFzc2Vzc09wZXJhdGlvbmFsUmlzayhpbnZlc3RtZW50cywgaWRlYSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgb3ZlcmFsbFJpc2tMZXZlbCxcbiAgICAgIHJpc2tTY29yZSxcbiAgICAgIHJpc2tGYWN0b3JzLFxuICAgICAgcmlza01pdGlnYXRpb24sXG4gICAgICBzdHJlc3NUZXN0UmVzdWx0cyxcbiAgICAgIHNjZW5hcmlvQW5hbHlzaXMsXG4gICAgICBjb3JyZWxhdGlvblJpc2tzLFxuICAgICAgbGlxdWlkaXR5UmlzayxcbiAgICAgIGNvbmNlbnRyYXRpb25SaXNrLFxuICAgICAgbWFya2V0UmlzayxcbiAgICAgIGNyZWRpdFJpc2ssXG4gICAgICBvcGVyYXRpb25hbFJpc2tcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIE1vZGVscyBleHBlY3RlZCBvdXRjb21lcyB1c2luZyB2YXJpb3VzIHRlY2huaXF1ZXNcbiAgICovXG4gIGFzeW5jIG1vZGVsRXhwZWN0ZWRPdXRjb21lcyhpZGVhOiBJbnZlc3RtZW50SWRlYSk6IFByb21pc2U8RXhwZWN0ZWRPdXRjb21lTW9kZWw+IHtcbiAgICBjb25zdCBpbnZlc3RtZW50cyA9IGlkZWEuaW52ZXN0bWVudHM7XG4gICAgXG4gICAgLy8gQ3JlYXRlIHNjZW5hcmlvIG91dGNvbWVzXG4gICAgY29uc3QgYmFzZUNhc2UgPSB0aGlzLmNyZWF0ZUJhc2VTY2VuYXJpbyhpZGVhKTtcbiAgICBjb25zdCBidWxsQ2FzZSA9IHRoaXMuY3JlYXRlQnVsbFNjZW5hcmlvKGlkZWEpO1xuICAgIGNvbnN0IGJlYXJDYXNlID0gdGhpcy5jcmVhdGVCZWFyU2NlbmFyaW8oaWRlYSk7XG4gICAgXG4gICAgLy8gQ2FsY3VsYXRlIHByb2JhYmlsaXR5LXdlaWdodGVkIHJldHVyblxuICAgIGNvbnN0IHByb2JhYmlsaXR5V2VpZ2h0ZWRSZXR1cm4gPSB0aGlzLmNhbGN1bGF0ZVByb2JhYmlsaXR5V2VpZ2h0ZWRSZXR1cm4oW2Jhc2VDYXNlLCBidWxsQ2FzZSwgYmVhckNhc2VdKTtcbiAgICBcbiAgICAvLyBHZW5lcmF0ZSBjb25maWRlbmNlIGludGVydmFsc1xuICAgIGNvbnN0IGNvbmZpZGVuY2VJbnRlcnZhbCA9IHRoaXMuY2FsY3VsYXRlQ29uZmlkZW5jZUludGVydmFsKGludmVzdG1lbnRzKTtcbiAgICBcbiAgICAvLyBQZXJmb3JtIHNlbnNpdGl2aXR5IGFuYWx5c2lzXG4gICAgY29uc3Qgc2Vuc2l0aXZpdHlBbmFseXNpcyA9IHRoaXMucGVyZm9ybVNlbnNpdGl2aXR5QW5hbHlzaXMoaW52ZXN0bWVudHMsIGlkZWEpO1xuICAgIFxuICAgIC8vIFJ1biBNb250ZSBDYXJsbyBzaW11bGF0aW9uXG4gICAgY29uc3QgbW9udGVDYXJsb1Jlc3VsdHMgPSB0aGlzLnJ1bk1vbnRlQ2FybG9TaW11bGF0aW9uKGludmVzdG1lbnRzLCBpZGVhKTtcbiAgICBcbiAgICAvLyBHZW5lcmF0ZSB0aW1lIHNlcmllcyBwcm9qZWN0aW9uXG4gICAgY29uc3QgdGltZVNlcmllc1Byb2plY3Rpb24gPSB0aGlzLmdlbmVyYXRlVGltZVNlcmllc1Byb2plY3Rpb24oaWRlYSwgbW9udGVDYXJsb1Jlc3VsdHMpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGJhc2VDYXNlLFxuICAgICAgYnVsbENhc2UsXG4gICAgICBiZWFyQ2FzZSxcbiAgICAgIHByb2JhYmlsaXR5V2VpZ2h0ZWRSZXR1cm4sXG4gICAgICBjb25maWRlbmNlSW50ZXJ2YWwsXG4gICAgICBzZW5zaXRpdml0eUFuYWx5c2lzLFxuICAgICAgbW9udGVDYXJsb1Jlc3VsdHMsXG4gICAgICB0aW1lU2VyaWVzUHJvamVjdGlvblxuICAgIH07XG4gIH1cblxuICAvLyBQcml2YXRlIGhlbHBlciBtZXRob2RzIGZvciBrZXkgbWV0cmljcyBjYWxjdWxhdGlvblxuXG4gIHByaXZhdGUgY2FsY3VsYXRlRXhwZWN0ZWRSZXR1cm4oaW52ZXN0bWVudHM6IEludmVzdG1lbnRbXSwgb3V0Y29tZXM6IE91dGNvbWVbXSk6IG51bWJlciB7XG4gICAgaWYgKG91dGNvbWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgLy8gRmFsbGJhY2sgdG8gaGlzdG9yaWNhbCBwZXJmb3JtYW5jZVxuICAgICAgcmV0dXJuIGludmVzdG1lbnRzLnJlZHVjZSgoc3VtLCBpbnYpID0+IHtcbiAgICAgICAgY29uc3QgaGlzdG9yaWNhbFJldHVybiA9IHRoaXMuY2FsY3VsYXRlSGlzdG9yaWNhbFJldHVybihpbnYpO1xuICAgICAgICByZXR1cm4gc3VtICsgaGlzdG9yaWNhbFJldHVybjtcbiAgICAgIH0sIDApIC8gaW52ZXN0bWVudHMubGVuZ3RoO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0Y29tZXMucmVkdWNlKChzdW0sIG91dGNvbWUpID0+IHN1bSArIChvdXRjb21lLnJldHVybkVzdGltYXRlICogb3V0Y29tZS5wcm9iYWJpbGl0eSksIDApO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVIaXN0b3JpY2FsUmV0dXJuKGludmVzdG1lbnQ6IEludmVzdG1lbnQpOiBudW1iZXIge1xuICAgIGNvbnN0IHBlcmZvcm1hbmNlID0gaW52ZXN0bWVudC5oaXN0b3JpY2FsUGVyZm9ybWFuY2U7XG4gICAgaWYgKHBlcmZvcm1hbmNlLmxlbmd0aCA8IDIpIHJldHVybiAwO1xuICAgIFxuICAgIGNvbnN0IGZpcnN0UHJpY2UgPSBwZXJmb3JtYW5jZVswXS5hZGp1c3RlZENsb3NlO1xuICAgIGNvbnN0IGxhc3RQcmljZSA9IHBlcmZvcm1hbmNlW3BlcmZvcm1hbmNlLmxlbmd0aCAtIDFdLmFkanVzdGVkQ2xvc2U7XG4gICAgY29uc3QgcGVyaW9kcyA9IHBlcmZvcm1hbmNlLmxlbmd0aDtcbiAgICBcbiAgICAvLyBBbm51YWxpemVkIHJldHVyblxuICAgIHJldHVybiBNYXRoLnBvdyhsYXN0UHJpY2UgLyBmaXJzdFByaWNlLCAyNTIgLyBwZXJpb2RzKSAtIDE7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZVBvcnRmb2xpb1ZvbGF0aWxpdHkoaW52ZXN0bWVudHM6IEludmVzdG1lbnRbXSk6IG51bWJlciB7XG4gICAgaWYgKGludmVzdG1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgXG4gICAgLy8gU2ltcGxlIGF2ZXJhZ2Ugb2YgaW5kaXZpZHVhbCB2b2xhdGlsaXRpZXMgKGNvdWxkIGJlIGVuaGFuY2VkIHdpdGggY29ycmVsYXRpb24gbWF0cml4KVxuICAgIGNvbnN0IHRvdGFsVm9sYXRpbGl0eSA9IGludmVzdG1lbnRzLnJlZHVjZSgoc3VtLCBpbnYpID0+IHtcbiAgICAgIHJldHVybiBzdW0gKyAoaW52LnJpc2tNZXRyaWNzPy52b2xhdGlsaXR5IHx8IDApO1xuICAgIH0sIDApO1xuICAgIFxuICAgIHJldHVybiB0b3RhbFZvbGF0aWxpdHkgLyBpbnZlc3RtZW50cy5sZW5ndGg7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZVNoYXJwZVJhdGlvKGV4cGVjdGVkUmV0dXJuOiBudW1iZXIsIHZvbGF0aWxpdHk6IG51bWJlciwgcmlza0ZyZWVSYXRlOiBudW1iZXIgPSAwLjAyKTogbnVtYmVyIHtcbiAgICBpZiAodm9sYXRpbGl0eSA9PT0gMCkgcmV0dXJuIDA7XG4gICAgcmV0dXJuIChleHBlY3RlZFJldHVybiAtIHJpc2tGcmVlUmF0ZSkgLyB2b2xhdGlsaXR5O1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVNYXhEcmF3ZG93bihpbnZlc3RtZW50czogSW52ZXN0bWVudFtdKTogbnVtYmVyIHtcbiAgICBsZXQgbWF4RHJhd2Rvd24gPSAwO1xuICAgIFxuICAgIGZvciAoY29uc3QgaW52ZXN0bWVudCBvZiBpbnZlc3RtZW50cykge1xuICAgICAgY29uc3QgcGVyZm9ybWFuY2UgPSBpbnZlc3RtZW50Lmhpc3RvcmljYWxQZXJmb3JtYW5jZTtcbiAgICAgIGlmIChwZXJmb3JtYW5jZS5sZW5ndGggPCAyKSBjb250aW51ZTtcbiAgICAgIFxuICAgICAgbGV0IHBlYWsgPSBwZXJmb3JtYW5jZVswXS5hZGp1c3RlZENsb3NlO1xuICAgICAgbGV0IGN1cnJlbnREcmF3ZG93biA9IDA7XG4gICAgICBcbiAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcGVyZm9ybWFuY2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY3VycmVudFByaWNlID0gcGVyZm9ybWFuY2VbaV0uYWRqdXN0ZWRDbG9zZTtcbiAgICAgICAgaWYgKGN1cnJlbnRQcmljZSA+IHBlYWspIHtcbiAgICAgICAgICBwZWFrID0gY3VycmVudFByaWNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnJlbnREcmF3ZG93biA9IChwZWFrIC0gY3VycmVudFByaWNlKSAvIHBlYWs7XG4gICAgICAgICAgbWF4RHJhd2Rvd24gPSBNYXRoLm1heChtYXhEcmF3ZG93biwgY3VycmVudERyYXdkb3duKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gbWF4RHJhd2Rvd247XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZVZhbHVlQXRSaXNrKGludmVzdG1lbnRzOiBJbnZlc3RtZW50W10sIGNvbmZpZGVuY2VMZXZlbDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAvLyBTaW1wbGlmaWVkIFZhUiBjYWxjdWxhdGlvbiB1c2luZyBub3JtYWwgZGlzdHJpYnV0aW9uIGFzc3VtcHRpb25cbiAgICBjb25zdCBwb3J0Zm9saW9SZXR1cm4gPSB0aGlzLmNhbGN1bGF0ZUV4cGVjdGVkUmV0dXJuKGludmVzdG1lbnRzLCBbXSk7XG4gICAgY29uc3QgcG9ydGZvbGlvVm9sYXRpbGl0eSA9IHRoaXMuY2FsY3VsYXRlUG9ydGZvbGlvVm9sYXRpbGl0eShpbnZlc3RtZW50cyk7XG4gICAgXG4gICAgLy8gWi1zY29yZSBmb3IgY29uZmlkZW5jZSBsZXZlbCAoZS5nLiwgLTEuNjQ1IGZvciA1JSBWYVIpXG4gICAgY29uc3QgelNjb3JlID0gdGhpcy5nZXRaU2NvcmUoY29uZmlkZW5jZUxldmVsKTtcbiAgICBcbiAgICByZXR1cm4gcG9ydGZvbGlvUmV0dXJuICsgKHpTY29yZSAqIHBvcnRmb2xpb1ZvbGF0aWxpdHkpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRaU2NvcmUoY29uZmlkZW5jZUxldmVsOiBudW1iZXIpOiBudW1iZXIge1xuICAgIC8vIFNpbXBsaWZpZWQgbWFwcGluZyBvZiBjb25maWRlbmNlIGxldmVscyB0byB6LXNjb3Jlc1xuICAgIGNvbnN0IHpTY29yZXM6IFJlY29yZDxudW1iZXIsIG51bWJlcj4gPSB7XG4gICAgICAwLjAxOiAtMi4zMjYsXG4gICAgICAwLjA1OiAtMS42NDUsXG4gICAgICAwLjEwOiAtMS4yODJcbiAgICB9O1xuICAgIHJldHVybiB6U2NvcmVzW2NvbmZpZGVuY2VMZXZlbF0gfHwgLTEuNjQ1O1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVEaXZlcnNpZmljYXRpb25SYXRpbyhpbnZlc3RtZW50czogSW52ZXN0bWVudFtdKTogbnVtYmVyIHtcbiAgICBpZiAoaW52ZXN0bWVudHMubGVuZ3RoIDw9IDEpIHJldHVybiAwO1xuICAgIFxuICAgIC8vIFNpbXBsaWZpZWQgZGl2ZXJzaWZpY2F0aW9uIHJhdGlvIGJhc2VkIG9uIG51bWJlciBvZiBhc3NldHMgYW5kIHNlY3RvcnNcbiAgICBjb25zdCBzZWN0b3JzID0gbmV3IFNldChpbnZlc3RtZW50cy5tYXAoaW52ID0+IGludi5zZWN0b3IpLmZpbHRlcihCb29sZWFuKSk7XG4gICAgY29uc3QgYXNzZXRUeXBlcyA9IG5ldyBTZXQoaW52ZXN0bWVudHMubWFwKGludiA9PiBpbnYudHlwZSkpO1xuICAgIFxuICAgIGNvbnN0IHNlY3RvckRpdmVyc2lmaWNhdGlvbiA9IHNlY3RvcnMuc2l6ZSAvIE1hdGgubWF4KGludmVzdG1lbnRzLmxlbmd0aCwgMSk7XG4gICAgY29uc3QgYXNzZXRUeXBlRGl2ZXJzaWZpY2F0aW9uID0gYXNzZXRUeXBlcy5zaXplIC8gTWF0aC5tYXgoaW52ZXN0bWVudHMubGVuZ3RoLCAxKTtcbiAgICBcbiAgICByZXR1cm4gKHNlY3RvckRpdmVyc2lmaWNhdGlvbiArIGFzc2V0VHlwZURpdmVyc2lmaWNhdGlvbikgLyAyO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVDb3JyZWxhdGlvblNjb3JlKGludmVzdG1lbnRzOiBJbnZlc3RtZW50W10pOiBudW1iZXIge1xuICAgIGlmIChpbnZlc3RtZW50cy5sZW5ndGggPD0gMSkgcmV0dXJuIDA7XG4gICAgXG4gICAgbGV0IHRvdGFsQ29ycmVsYXRpb24gPSAwO1xuICAgIGxldCBwYWlyQ291bnQgPSAwO1xuICAgIFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW52ZXN0bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IGludmVzdG1lbnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGludjEgPSBpbnZlc3RtZW50c1tpXTtcbiAgICAgICAgY29uc3QgaW52MiA9IGludmVzdG1lbnRzW2pdO1xuICAgICAgICBcbiAgICAgICAgLy8gR2V0IGNvcnJlbGF0aW9uIGZyb20gcmlzayBtZXRyaWNzIGlmIGF2YWlsYWJsZVxuICAgICAgICBjb25zdCBjb3JyZWxhdGlvbiA9IGludjEucmlza01ldHJpY3M/LmNvcnJlbGF0aW9ucz8uW2ludjIuaWRdIHx8IDAuNTsgLy8gRGVmYXVsdCBtb2RlcmF0ZSBjb3JyZWxhdGlvblxuICAgICAgICB0b3RhbENvcnJlbGF0aW9uICs9IE1hdGguYWJzKGNvcnJlbGF0aW9uKTtcbiAgICAgICAgcGFpckNvdW50Kys7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBwYWlyQ291bnQgPiAwID8gdG90YWxDb3JyZWxhdGlvbiAvIHBhaXJDb3VudCA6IDA7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZUNvbmNlbnRyYXRpb25SaXNrKGludmVzdG1lbnRzOiBJbnZlc3RtZW50W10pOiBudW1iZXIge1xuICAgIGlmIChpbnZlc3RtZW50cy5sZW5ndGggPT09IDApIHJldHVybiAxO1xuICAgIFxuICAgIC8vIENhbGN1bGF0ZSBIZXJmaW5kYWhsLUhpcnNjaG1hbiBJbmRleCBmb3IgY29uY2VudHJhdGlvblxuICAgIGNvbnN0IHRvdGFsVmFsdWUgPSBpbnZlc3RtZW50cy5sZW5ndGg7IC8vIEFzc3VtaW5nIGVxdWFsIHdlaWdodHNcbiAgICBsZXQgaGhpID0gMDtcbiAgICBcbiAgICBmb3IgKGNvbnN0IGludmVzdG1lbnQgb2YgaW52ZXN0bWVudHMpIHtcbiAgICAgIGNvbnN0IHdlaWdodCA9IDEgLyB0b3RhbFZhbHVlOyAvLyBFcXVhbCB3ZWlnaHQgYXNzdW1wdGlvblxuICAgICAgaGhpICs9IHdlaWdodCAqIHdlaWdodDtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGhoaTtcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlRnVuZGFtZW50YWxTY29yZShpbnZlc3RtZW50czogSW52ZXN0bWVudFtdKTogbnVtYmVyIHtcbiAgICBsZXQgdG90YWxTY29yZSA9IDA7XG4gICAgbGV0IHZhbGlkSW52ZXN0bWVudHMgPSAwO1xuICAgIFxuICAgIGZvciAoY29uc3QgaW52ZXN0bWVudCBvZiBpbnZlc3RtZW50cykge1xuICAgICAgaWYgKCFpbnZlc3RtZW50LmZ1bmRhbWVudGFscykgY29udGludWU7XG4gICAgICBcbiAgICAgIGNvbnN0IGZ1bmRhbWVudGFscyA9IGludmVzdG1lbnQuZnVuZGFtZW50YWxzO1xuICAgICAgbGV0IHNjb3JlID0gNTA7IC8vIEJhc2Ugc2NvcmVcbiAgICAgIFxuICAgICAgLy8gUC9FIHJhdGlvIHNjb3JpbmdcbiAgICAgIGlmIChmdW5kYW1lbnRhbHMucGVSYXRpbyAmJiBmdW5kYW1lbnRhbHMucGVSYXRpbyA+IDApIHtcbiAgICAgICAgaWYgKGZ1bmRhbWVudGFscy5wZVJhdGlvIDwgMTUpIHNjb3JlICs9IDEwO1xuICAgICAgICBlbHNlIGlmIChmdW5kYW1lbnRhbHMucGVSYXRpbyA8IDI1KSBzY29yZSArPSA1O1xuICAgICAgICBlbHNlIGlmIChmdW5kYW1lbnRhbHMucGVSYXRpbyA+IDQwKSBzY29yZSAtPSAxMDtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gUHJvZml0IG1hcmdpbiBzY29yaW5nXG4gICAgICBpZiAoZnVuZGFtZW50YWxzLnByb2ZpdE1hcmdpbiAmJiBmdW5kYW1lbnRhbHMucHJvZml0TWFyZ2luID4gMCkge1xuICAgICAgICBpZiAoZnVuZGFtZW50YWxzLnByb2ZpdE1hcmdpbiA+IDAuMTUpIHNjb3JlICs9IDEwO1xuICAgICAgICBlbHNlIGlmIChmdW5kYW1lbnRhbHMucHJvZml0TWFyZ2luID4gMC4xMCkgc2NvcmUgKz0gNTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gUk9FIHNjb3JpbmdcbiAgICAgIGlmIChmdW5kYW1lbnRhbHMucmV0dXJuT25FcXVpdHkgJiYgZnVuZGFtZW50YWxzLnJldHVybk9uRXF1aXR5ID4gMCkge1xuICAgICAgICBpZiAoZnVuZGFtZW50YWxzLnJldHVybk9uRXF1aXR5ID4gMC4xNSkgc2NvcmUgKz0gMTA7XG4gICAgICAgIGVsc2UgaWYgKGZ1bmRhbWVudGFscy5yZXR1cm5PbkVxdWl0eSA+IDAuMTApIHNjb3JlICs9IDU7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIERlYnQtdG8tZXF1aXR5IHNjb3JpbmdcbiAgICAgIGlmIChmdW5kYW1lbnRhbHMuZGVidFRvRXF1aXR5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGZ1bmRhbWVudGFscy5kZWJ0VG9FcXVpdHkgPCAwLjMpIHNjb3JlICs9IDU7XG4gICAgICAgIGVsc2UgaWYgKGZ1bmRhbWVudGFscy5kZWJ0VG9FcXVpdHkgPiAxLjApIHNjb3JlIC09IDEwO1xuICAgICAgfVxuICAgICAgXG4gICAgICB0b3RhbFNjb3JlICs9IE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgc2NvcmUpKTtcbiAgICAgIHZhbGlkSW52ZXN0bWVudHMrKztcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHZhbGlkSW52ZXN0bWVudHMgPiAwID8gdG90YWxTY29yZSAvIHZhbGlkSW52ZXN0bWVudHMgOiA1MDtcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlVGVjaG5pY2FsU2NvcmUoaW52ZXN0bWVudHM6IEludmVzdG1lbnRbXSk6IG51bWJlciB7XG4gICAgbGV0IHRvdGFsU2NvcmUgPSAwO1xuICAgIGxldCB2YWxpZEludmVzdG1lbnRzID0gMDtcbiAgICBcbiAgICBmb3IgKGNvbnN0IGludmVzdG1lbnQgb2YgaW52ZXN0bWVudHMpIHtcbiAgICAgIGlmICghaW52ZXN0bWVudC50ZWNobmljYWxJbmRpY2F0b3JzKSBjb250aW51ZTtcbiAgICAgIFxuICAgICAgY29uc3QgdGVjaG5pY2FsID0gaW52ZXN0bWVudC50ZWNobmljYWxJbmRpY2F0b3JzO1xuICAgICAgbGV0IHNjb3JlID0gNTA7IC8vIEJhc2Ugc2NvcmVcbiAgICAgIFxuICAgICAgLy8gUlNJIHNjb3JpbmdcbiAgICAgIGlmICh0ZWNobmljYWwucmVsYXRpdmVTdHJlbmd0aEluZGV4KSB7XG4gICAgICAgIGNvbnN0IHJzaSA9IHRlY2huaWNhbC5yZWxhdGl2ZVN0cmVuZ3RoSW5kZXg7XG4gICAgICAgIGlmIChyc2kgPiAzMCAmJiByc2kgPCA3MCkgc2NvcmUgKz0gMTA7IC8vIE5ldXRyYWwgem9uZVxuICAgICAgICBlbHNlIGlmIChyc2kgPCAzMCkgc2NvcmUgKz0gMTU7IC8vIE92ZXJzb2xkXG4gICAgICAgIGVsc2UgaWYgKHJzaSA+IDcwKSBzY29yZSAtPSAxMDsgLy8gT3ZlcmJvdWdodFxuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBNb3ZpbmcgYXZlcmFnZSB0cmVuZFxuICAgICAgaWYgKHRlY2huaWNhbC5tb3ZpbmdBdmVyYWdlcyAmJiBpbnZlc3RtZW50LmN1cnJlbnRQcmljZSkge1xuICAgICAgICBjb25zdCBwcmljZSA9IGludmVzdG1lbnQuY3VycmVudFByaWNlO1xuICAgICAgICBjb25zdCBtYTUwID0gdGVjaG5pY2FsLm1vdmluZ0F2ZXJhZ2VzLm1hNTA7XG4gICAgICAgIGNvbnN0IG1hMjAwID0gdGVjaG5pY2FsLm1vdmluZ0F2ZXJhZ2VzLm1hMjAwO1xuICAgICAgICBcbiAgICAgICAgaWYgKHByaWNlID4gbWE1MCAmJiBtYTUwID4gbWEyMDApIHNjb3JlICs9IDE1OyAvLyBVcHRyZW5kXG4gICAgICAgIGVsc2UgaWYgKHByaWNlIDwgbWE1MCAmJiBtYTUwIDwgbWEyMDApIHNjb3JlIC09IDEwOyAvLyBEb3dudHJlbmRcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gTUFDRCBzY29yaW5nXG4gICAgICBpZiAodGVjaG5pY2FsLm1hY2RMaW5lICYmIHRlY2huaWNhbC5tYWNkU2lnbmFsKSB7XG4gICAgICAgIGlmICh0ZWNobmljYWwubWFjZExpbmUgPiB0ZWNobmljYWwubWFjZFNpZ25hbCkgc2NvcmUgKz0gNTsgLy8gQnVsbGlzaFxuICAgICAgICBlbHNlIHNjb3JlIC09IDU7IC8vIEJlYXJpc2hcbiAgICAgIH1cbiAgICAgIFxuICAgICAgdG90YWxTY29yZSArPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIHNjb3JlKSk7XG4gICAgICB2YWxpZEludmVzdG1lbnRzKys7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB2YWxpZEludmVzdG1lbnRzID4gMCA/IHRvdGFsU2NvcmUgLyB2YWxpZEludmVzdG1lbnRzIDogNTA7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZVNlbnRpbWVudFNjb3JlKGludmVzdG1lbnRzOiBJbnZlc3RtZW50W10pOiBudW1iZXIge1xuICAgIGxldCB0b3RhbFNjb3JlID0gMDtcbiAgICBsZXQgdmFsaWRJbnZlc3RtZW50cyA9IDA7XG4gICAgXG4gICAgZm9yIChjb25zdCBpbnZlc3RtZW50IG9mIGludmVzdG1lbnRzKSB7XG4gICAgICBpZiAoIWludmVzdG1lbnQuc2VudGltZW50QW5hbHlzaXMpIGNvbnRpbnVlO1xuICAgICAgXG4gICAgICBjb25zdCBzZW50aW1lbnQgPSBpbnZlc3RtZW50LnNlbnRpbWVudEFuYWx5c2lzO1xuICAgICAgbGV0IHNjb3JlID0gNTA7IC8vIEJhc2Ugc2NvcmVcbiAgICAgIFxuICAgICAgLy8gT3ZlcmFsbCBzZW50aW1lbnQgc2NvcmluZ1xuICAgICAgc3dpdGNoIChzZW50aW1lbnQub3ZlcmFsbFNlbnRpbWVudCkge1xuICAgICAgICBjYXNlICd2ZXJ5LXBvc2l0aXZlJzpcbiAgICAgICAgICBzY29yZSArPSAyMDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncG9zaXRpdmUnOlxuICAgICAgICAgIHNjb3JlICs9IDEwO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICduZXV0cmFsJzpcbiAgICAgICAgICBzY29yZSArPSAwO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICduZWdhdGl2ZSc6XG4gICAgICAgICAgc2NvcmUgLT0gMTA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3ZlcnktbmVnYXRpdmUnOlxuICAgICAgICAgIHNjb3JlIC09IDIwO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBTZW50aW1lbnQgdHJlbmQgc2NvcmluZ1xuICAgICAgc3dpdGNoIChzZW50aW1lbnQuc2VudGltZW50VHJlbmQpIHtcbiAgICAgICAgY2FzZSAnaW1wcm92aW5nJzpcbiAgICAgICAgICBzY29yZSArPSAxMDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnc3RhYmxlJzpcbiAgICAgICAgICBzY29yZSArPSAwO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdkZXRlcmlvcmF0aW5nJzpcbiAgICAgICAgICBzY29yZSAtPSAxMDtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gQW5hbHlzdCByZWNvbW1lbmRhdGlvbnNcbiAgICAgIGlmIChzZW50aW1lbnQuYW5hbHlzdFJlY29tbWVuZGF0aW9ucykge1xuICAgICAgICBjb25zdCB0b3RhbCA9IHNlbnRpbWVudC5hbmFseXN0UmVjb21tZW5kYXRpb25zLmJ1eSArIFxuICAgICAgICAgICAgICAgICAgICAgc2VudGltZW50LmFuYWx5c3RSZWNvbW1lbmRhdGlvbnMuaG9sZCArIFxuICAgICAgICAgICAgICAgICAgICAgc2VudGltZW50LmFuYWx5c3RSZWNvbW1lbmRhdGlvbnMuc2VsbDtcbiAgICAgICAgaWYgKHRvdGFsID4gMCkge1xuICAgICAgICAgIGNvbnN0IGJ1eVJhdGlvID0gc2VudGltZW50LmFuYWx5c3RSZWNvbW1lbmRhdGlvbnMuYnV5IC8gdG90YWw7XG4gICAgICAgICAgc2NvcmUgKz0gKGJ1eVJhdGlvIC0gMC41KSAqIDIwOyAvLyBBZGp1c3QgYmFzZWQgb24gYnV5IHJhdGlvXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgdG90YWxTY29yZSArPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIHNjb3JlKSk7XG4gICAgICB2YWxpZEludmVzdG1lbnRzKys7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB2YWxpZEludmVzdG1lbnRzID4gMCA/IHRvdGFsU2NvcmUgLyB2YWxpZEludmVzdG1lbnRzIDogNTA7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZUluZm9ybWF0aW9uUmF0aW8oaW52ZXN0bWVudHM6IEludmVzdG1lbnRbXSk6IG51bWJlciB7XG4gICAgLy8gU2ltcGxpZmllZCBpbmZvcm1hdGlvbiByYXRpbyBjYWxjdWxhdGlvblxuICAgIGNvbnN0IGFjdGl2ZVJldHVybiA9IHRoaXMuY2FsY3VsYXRlRXhwZWN0ZWRSZXR1cm4oaW52ZXN0bWVudHMsIFtdKTtcbiAgICBjb25zdCBiZW5jaG1hcmtSZXR1cm4gPSAwLjA4OyAvLyBBc3N1bWUgOCUgYmVuY2htYXJrXG4gICAgY29uc3QgdHJhY2tpbmdFcnJvciA9IHRoaXMuY2FsY3VsYXRlUG9ydGZvbGlvVm9sYXRpbGl0eShpbnZlc3RtZW50cykgKiAwLjU7IC8vIFNpbXBsaWZpZWRcbiAgICBcbiAgICBpZiAodHJhY2tpbmdFcnJvciA9PT0gMCkgcmV0dXJuIDA7XG4gICAgcmV0dXJuIChhY3RpdmVSZXR1cm4gLSBiZW5jaG1hcmtSZXR1cm4pIC8gdHJhY2tpbmdFcnJvcjtcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlQ2FsbWFyUmF0aW8oZXhwZWN0ZWRSZXR1cm46IG51bWJlciwgbWF4RHJhd2Rvd246IG51bWJlcik6IG51bWJlciB7XG4gICAgaWYgKG1heERyYXdkb3duID09PSAwKSByZXR1cm4gMDtcbiAgICByZXR1cm4gZXhwZWN0ZWRSZXR1cm4gLyBtYXhEcmF3ZG93bjtcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlU29ydGlub1JhdGlvKGludmVzdG1lbnRzOiBJbnZlc3RtZW50W10sIHRhcmdldFJldHVybjogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgLy8gU2ltcGxpZmllZCBTb3J0aW5vIHJhdGlvIGNhbGN1bGF0aW9uXG4gICAgY29uc3QgZXhwZWN0ZWRSZXR1cm4gPSB0aGlzLmNhbGN1bGF0ZUV4cGVjdGVkUmV0dXJuKGludmVzdG1lbnRzLCBbXSk7XG4gICAgY29uc3QgZG93bndhcmREZXZpYXRpb24gPSB0aGlzLmNhbGN1bGF0ZURvd253YXJkRGV2aWF0aW9uKGludmVzdG1lbnRzLCB0YXJnZXRSZXR1cm4pO1xuICAgIFxuICAgIGlmIChkb3dud2FyZERldmlhdGlvbiA9PT0gMCkgcmV0dXJuIDA7XG4gICAgcmV0dXJuIChleHBlY3RlZFJldHVybiAtIHRhcmdldFJldHVybikgLyBkb3dud2FyZERldmlhdGlvbjtcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlRG93bndhcmREZXZpYXRpb24oaW52ZXN0bWVudHM6IEludmVzdG1lbnRbXSwgdGFyZ2V0UmV0dXJuOiBudW1iZXIpOiBudW1iZXIge1xuICAgIC8vIFNpbXBsaWZpZWQgY2FsY3VsYXRpb24gLSB3b3VsZCBuZWVkIGFjdHVhbCByZXR1cm4gc2VyaWVzIGZvciBwcm9wZXIgaW1wbGVtZW50YXRpb25cbiAgICBjb25zdCB2b2xhdGlsaXR5ID0gdGhpcy5jYWxjdWxhdGVQb3J0Zm9saW9Wb2xhdGlsaXR5KGludmVzdG1lbnRzKTtcbiAgICByZXR1cm4gdm9sYXRpbGl0eSAqIDAuNzsgLy8gQXBwcm94aW1hdGUgZG93bndhcmQgZGV2aWF0aW9uIGFzIDcwJSBvZiB0b3RhbCB2b2xhdGlsaXR5XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZVRpbWVUb0JyZWFrZXZlbihpZGVhOiBJbnZlc3RtZW50SWRlYSk6IG51bWJlciB7XG4gICAgLy8gRXN0aW1hdGUgYmFzZWQgb24gZXhwZWN0ZWQgcmV0dXJuIGFuZCB0aW1lIGhvcml6b25cbiAgICBjb25zdCBleHBlY3RlZFJldHVybiA9IHRoaXMuY2FsY3VsYXRlRXhwZWN0ZWRSZXR1cm4oaWRlYS5pbnZlc3RtZW50cywgaWRlYS5wb3RlbnRpYWxPdXRjb21lcyk7XG4gICAgaWYgKGV4cGVjdGVkUmV0dXJuIDw9IDApIHJldHVybiBJbmZpbml0eTtcbiAgICBcbiAgICAvLyBTaW1wbGUgYnJlYWtldmVuIGNhbGN1bGF0aW9uXG4gICAgY29uc3QgdHJhbnNhY3Rpb25Db3N0cyA9IDAuMDE7IC8vIEFzc3VtZSAxJSB0cmFuc2FjdGlvbiBjb3N0c1xuICAgIHJldHVybiAodHJhbnNhY3Rpb25Db3N0cyAvIGV4cGVjdGVkUmV0dXJuKSAqIDM2NTsgLy8gQ29udmVydCB0byBkYXlzXG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZU9wdGltYWxIb2xkaW5nUGVyaW9kKGlkZWE6IEludmVzdG1lbnRJZGVhKTogbnVtYmVyIHtcbiAgICAvLyBNYXAgdGltZSBob3Jpem9uIHRvIGRheXNcbiAgICBjb25zdCB0aW1lSG9yaXpvbkRheXM6IFJlY29yZDxUaW1lSG9yaXpvbiwgbnVtYmVyPiA9IHtcbiAgICAgICdpbnRyYWRheSc6IDEsXG4gICAgICAnc2hvcnQnOiA5MCxcbiAgICAgICdtZWRpdW0nOiAzNjUsXG4gICAgICAnbG9uZyc6IDEwOTUsXG4gICAgICAndmVyeS1sb25nJzogMTgyNVxuICAgIH07XG4gICAgXG4gICAgcmV0dXJuIHRpbWVIb3Jpem9uRGF5c1tpZGVhLnRpbWVIb3Jpem9uXSB8fCAzNjU7XG4gIH1cblxuICBwcml2YXRlIGFzc2Vzc0RhdGFRdWFsaXR5KHN1cHBvcnRpbmdEYXRhOiBEYXRhUG9pbnRbXSk6IG51bWJlciB7XG4gICAgaWYgKHN1cHBvcnRpbmdEYXRhLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDMwO1xuICAgIFxuICAgIGxldCBxdWFsaXR5U2NvcmUgPSAwO1xuICAgIGxldCB0b3RhbFdlaWdodCA9IDA7XG4gICAgXG4gICAgZm9yIChjb25zdCBkYXRhUG9pbnQgb2Ygc3VwcG9ydGluZ0RhdGEpIHtcbiAgICAgIGNvbnN0IHJlbGlhYmlsaXR5ID0gZGF0YVBvaW50LnJlbGlhYmlsaXR5IHx8IDAuNTtcbiAgICAgIGNvbnN0IHJlY2VuY3kgPSB0aGlzLmNhbGN1bGF0ZVJlY2VuY3lTY29yZShkYXRhUG9pbnQudGltZXN0YW1wKTtcbiAgICAgIGNvbnN0IHNvdXJjZVF1YWxpdHkgPSB0aGlzLmFzc2Vzc1NvdXJjZVF1YWxpdHkoZGF0YVBvaW50LnNvdXJjZSk7XG4gICAgICBcbiAgICAgIGNvbnN0IHBvaW50UXVhbGl0eSA9IChyZWxpYWJpbGl0eSAqIDAuNCArIHJlY2VuY3kgKiAwLjMgKyBzb3VyY2VRdWFsaXR5ICogMC4zKSAqIDEwMDtcbiAgICAgIHF1YWxpdHlTY29yZSArPSBwb2ludFF1YWxpdHk7XG4gICAgICB0b3RhbFdlaWdodCArPSAxO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdG90YWxXZWlnaHQgPiAwID8gcXVhbGl0eVNjb3JlIC8gdG90YWxXZWlnaHQgOiA1MDtcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlUmVjZW5jeVNjb3JlKHRpbWVzdGFtcDogRGF0ZSk6IG51bWJlciB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBhZ2VJbkRheXMgPSAobm93LmdldFRpbWUoKSAtIHRpbWVzdGFtcC5nZXRUaW1lKCkpIC8gKDEwMDAgKiA2MCAqIDYwICogMjQpO1xuICAgIFxuICAgIGlmIChhZ2VJbkRheXMgPD0gMSkgcmV0dXJuIDEuMDtcbiAgICBpZiAoYWdlSW5EYXlzIDw9IDcpIHJldHVybiAwLjk7XG4gICAgaWYgKGFnZUluRGF5cyA8PSAzMCkgcmV0dXJuIDAuNztcbiAgICBpZiAoYWdlSW5EYXlzIDw9IDkwKSByZXR1cm4gMC41O1xuICAgIGlmIChhZ2VJbkRheXMgPD0gMzY1KSByZXR1cm4gMC4zO1xuICAgIHJldHVybiAwLjE7XG4gIH1cblxuICBwcml2YXRlIGFzc2Vzc1NvdXJjZVF1YWxpdHkoc291cmNlOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIC8vIFNpbXBsZSBzb3VyY2UgcXVhbGl0eSBhc3Nlc3NtZW50XG4gICAgY29uc3QgaGlnaFF1YWxpdHlTb3VyY2VzID0gWydibG9vbWJlcmcnLCAncmV1dGVycycsICdzZWMnLCAnZmVkJywgJ3RyZWFzdXJ5J107XG4gICAgY29uc3QgbWVkaXVtUXVhbGl0eVNvdXJjZXMgPSBbJ3lhaG9vJywgJ2dvb2dsZScsICdtYXJrZXR3YXRjaCcsICdjbmJjJ107XG4gICAgXG4gICAgY29uc3QgbG93ZXJTb3VyY2UgPSBzb3VyY2UudG9Mb3dlckNhc2UoKTtcbiAgICBcbiAgICBpZiAoaGlnaFF1YWxpdHlTb3VyY2VzLnNvbWUocyA9PiBsb3dlclNvdXJjZS5pbmNsdWRlcyhzKSkpIHJldHVybiAwLjk7XG4gICAgaWYgKG1lZGl1bVF1YWxpdHlTb3VyY2VzLnNvbWUocyA9PiBsb3dlclNvdXJjZS5pbmNsdWRlcyhzKSkpIHJldHVybiAwLjc7XG4gICAgcmV0dXJuIDAuNTtcbiAgfVxuXG4gIHByaXZhdGUgYXNzZXNzTWFya2V0Q29uZGl0aW9uU3VpdGFiaWxpdHkoaWRlYTogSW52ZXN0bWVudElkZWEpOiBudW1iZXIge1xuICAgIC8vIFNpbXBsaWZpZWQgbWFya2V0IGNvbmRpdGlvbiBhc3Nlc3NtZW50XG4gICAgbGV0IHN1aXRhYmlsaXR5U2NvcmUgPSA1MDtcbiAgICBcbiAgICAvLyBBZGp1c3QgYmFzZWQgb24gc3RyYXRlZ3kgYW5kIGN1cnJlbnQgbWFya2V0IGNvbmRpdGlvbnNcbiAgICBzd2l0Y2ggKGlkZWEuc3RyYXRlZ3kpIHtcbiAgICAgIGNhc2UgJ2dyb3d0aCc6XG4gICAgICAgIHN1aXRhYmlsaXR5U2NvcmUgKz0gMTA7IC8vIEFzc3VtZSBncm93dGgtZnJpZW5kbHkgZW52aXJvbm1lbnRcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd2YWx1ZSc6XG4gICAgICAgIHN1aXRhYmlsaXR5U2NvcmUgKz0gNTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtb21lbnR1bSc6XG4gICAgICAgIHN1aXRhYmlsaXR5U2NvcmUgLT0gNTsgLy8gQXNzdW1lIGxlc3Mgc3VpdGFibGUgZm9yIG1vbWVudHVtXG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBcbiAgICAvLyBBZGp1c3QgYmFzZWQgb24gcmlzayBsZXZlbCBhbmQgbWFya2V0IHZvbGF0aWxpdHlcbiAgICBpZiAoaWRlYS5yaXNrTGV2ZWwgPT09ICdoaWdoJyB8fCBpZGVhLnJpc2tMZXZlbCA9PT0gJ3ZlcnktaGlnaCcpIHtcbiAgICAgIHN1aXRhYmlsaXR5U2NvcmUgLT0gMTA7IC8vIEhpZ2ggcmlzayBsZXNzIHN1aXRhYmxlIGluIHVuY2VydGFpbiB0aW1lc1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCBzdWl0YWJpbGl0eVNjb3JlKSk7XG4gIH1cblxuICAvLyBSaXNrIGFzc2Vzc21lbnQgaGVscGVyIG1ldGhvZHNcblxuICBwcml2YXRlIGNhbGN1bGF0ZU92ZXJhbGxSaXNrU2NvcmUoaW52ZXN0bWVudHM6IEludmVzdG1lbnRbXSwgaWRlYTogSW52ZXN0bWVudElkZWEpOiBudW1iZXIge1xuICAgIGxldCByaXNrU2NvcmUgPSAwO1xuICAgIGxldCBmYWN0b3JzID0gMDtcbiAgICBcbiAgICAvLyBQb3J0Zm9saW8gdm9sYXRpbGl0eSBjb250cmlidXRpb25cbiAgICBjb25zdCB2b2xhdGlsaXR5ID0gdGhpcy5jYWxjdWxhdGVQb3J0Zm9saW9Wb2xhdGlsaXR5KGludmVzdG1lbnRzKTtcbiAgICByaXNrU2NvcmUgKz0gTWF0aC5taW4odm9sYXRpbGl0eSAqIDEwMCwgNDApOyAvLyBDYXAgYXQgNDAgcG9pbnRzXG4gICAgZmFjdG9ycysrO1xuICAgIFxuICAgIC8vIENvbmNlbnRyYXRpb24gcmlzayBjb250cmlidXRpb25cbiAgICBjb25zdCBjb25jZW50cmF0aW9uID0gdGhpcy5jYWxjdWxhdGVDb25jZW50cmF0aW9uUmlzayhpbnZlc3RtZW50cyk7XG4gICAgcmlza1Njb3JlICs9IGNvbmNlbnRyYXRpb24gKiAyMDsgLy8gVXAgdG8gMjAgcG9pbnRzXG4gICAgZmFjdG9ycysrO1xuICAgIFxuICAgIC8vIFRpbWUgaG9yaXpvbiByaXNrIChzaG9ydGVyID0gcmlza2llciBmb3Igdm9sYXRpbGUgYXNzZXRzKVxuICAgIGNvbnN0IHRpbWVIb3Jpem9uUmlzayA9IHRoaXMuY2FsY3VsYXRlVGltZUhvcml6b25SaXNrKGlkZWEudGltZUhvcml6b24pO1xuICAgIHJpc2tTY29yZSArPSB0aW1lSG9yaXpvblJpc2s7XG4gICAgZmFjdG9ycysrO1xuICAgIFxuICAgIC8vIFN0cmF0ZWd5IHJpc2tcbiAgICBjb25zdCBzdHJhdGVneVJpc2sgPSB0aGlzLmNhbGN1bGF0ZVN0cmF0ZWd5UmlzayhpZGVhLnN0cmF0ZWd5KTtcbiAgICByaXNrU2NvcmUgKz0gc3RyYXRlZ3lSaXNrO1xuICAgIGZhY3RvcnMrKztcbiAgICBcbiAgICByZXR1cm4gZmFjdG9ycyA+IDAgPyByaXNrU2NvcmUgLyBmYWN0b3JzIDogNTA7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZVRpbWVIb3Jpem9uUmlzayh0aW1lSG9yaXpvbjogVGltZUhvcml6b24pOiBudW1iZXIge1xuICAgIGNvbnN0IHJpc2tTY29yZXM6IFJlY29yZDxUaW1lSG9yaXpvbiwgbnVtYmVyPiA9IHtcbiAgICAgICdpbnRyYWRheSc6IDMwLFxuICAgICAgJ3Nob3J0JzogMjAsXG4gICAgICAnbWVkaXVtJzogMTAsXG4gICAgICAnbG9uZyc6IDUsXG4gICAgICAndmVyeS1sb25nJzogMlxuICAgIH07XG4gICAgcmV0dXJuIHJpc2tTY29yZXNbdGltZUhvcml6b25dIHx8IDE1O1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVTdHJhdGVneVJpc2soc3RyYXRlZ3k6IHN0cmluZyk6IG51bWJlciB7XG4gICAgY29uc3Qgcmlza1Njb3JlczogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHtcbiAgICAgICdidXknOiAxMCxcbiAgICAgICdob2xkJzogNSxcbiAgICAgICdzZWxsJzogMTUsXG4gICAgICAnc2hvcnQnOiAyNSxcbiAgICAgICdsb25nJzogMTAsXG4gICAgICAnaGVkZ2UnOiA4LFxuICAgICAgJ2FyYml0cmFnZSc6IDEyLFxuICAgICAgJ3BhaXJzLXRyYWRlJzogMTUsXG4gICAgICAnbW9tZW50dW0nOiAyMCxcbiAgICAgICd2YWx1ZSc6IDgsXG4gICAgICAnZ3Jvd3RoJzogMTIsXG4gICAgICAnaW5jb21lJzogNSxcbiAgICAgICdjb21wbGV4JzogMjVcbiAgICB9O1xuICAgIHJldHVybiByaXNrU2NvcmVzW3N0cmF0ZWd5XSB8fCAxNTtcbiAgfVxuXG4gIHByaXZhdGUgZGV0ZXJtaW5lUmlza0xldmVsKHJpc2tTY29yZTogbnVtYmVyKTogUmlza0xldmVsIHtcbiAgICBpZiAocmlza1Njb3JlIDw9IDIwKSByZXR1cm4gJ3ZlcnktbG93JztcbiAgICBpZiAocmlza1Njb3JlIDw9IDQwKSByZXR1cm4gJ2xvdyc7XG4gICAgaWYgKHJpc2tTY29yZSA8PSA2MCkgcmV0dXJuICdtb2RlcmF0ZSc7XG4gICAgaWYgKHJpc2tTY29yZSA8PSA4MCkgcmV0dXJuICdoaWdoJztcbiAgICByZXR1cm4gJ3ZlcnktaGlnaCc7XG4gIH1cblxuICBwcml2YXRlIGlkZW50aWZ5Umlza0ZhY3RvcnMoaW52ZXN0bWVudHM6IEludmVzdG1lbnRbXSwgaWRlYTogSW52ZXN0bWVudElkZWEpOiBSaXNrRmFjdG9yW10ge1xuICAgIGNvbnN0IHJpc2tGYWN0b3JzOiBSaXNrRmFjdG9yW10gPSBbXTtcbiAgICBcbiAgICBpZiAoaW52ZXN0bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAvLyBBZGQgYSBnZW5lcmFsIHJpc2sgZmFjdG9yIGZvciBlbXB0eSBwb3J0Zm9saW9zXG4gICAgICByaXNrRmFjdG9ycy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ29wZXJhdGlvbmFsJyxcbiAgICAgICAgc2V2ZXJpdHk6ICdoaWdoJyxcbiAgICAgICAgcHJvYmFiaWxpdHk6IDEuMCxcbiAgICAgICAgaW1wYWN0OiAxMDAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTm8gaW52ZXN0bWVudHMgaW4gcG9ydGZvbGlvJyxcbiAgICAgICAgdGltZUhvcml6b246ICdpbW1lZGlhdGUnXG4gICAgICB9KTtcbiAgICAgIHJldHVybiByaXNrRmFjdG9ycztcbiAgICB9XG4gICAgXG4gICAgLy8gTWFya2V0IHJpc2sgZmFjdG9yc1xuICAgIGNvbnN0IGF2Z0JldGEgPSBpbnZlc3RtZW50cy5yZWR1Y2UoKHN1bSwgaW52KSA9PiBzdW0gKyAoaW52LnJpc2tNZXRyaWNzPy5iZXRhIHx8IDEpLCAwKSAvIGludmVzdG1lbnRzLmxlbmd0aDtcbiAgICBpZiAoYXZnQmV0YSA+IDEuMikge1xuICAgICAgcmlza0ZhY3RvcnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdtYXJrZXQnLFxuICAgICAgICBzZXZlcml0eTogJ21lZGl1bScsXG4gICAgICAgIHByb2JhYmlsaXR5OiAwLjMsXG4gICAgICAgIGltcGFjdDogKGF2Z0JldGEgLSAxKSAqIDIwLFxuICAgICAgICBkZXNjcmlwdGlvbjogYEhpZ2ggbWFya2V0IHNlbnNpdGl2aXR5IChCZXRhOiAke2F2Z0JldGEudG9GaXhlZCgyKX0pYCxcbiAgICAgICAgdGltZUhvcml6b246ICdzaG9ydC10ZXJtJ1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIExpcXVpZGl0eSByaXNrIGZhY3RvcnNcbiAgICBjb25zdCBsb3dMaXF1aWRpdHlBc3NldHMgPSBpbnZlc3RtZW50cy5maWx0ZXIoaW52ID0+IFxuICAgICAgaW52Lmhpc3RvcmljYWxQZXJmb3JtYW5jZS5zb21lKHAgPT4gcC52b2x1bWUgPCAxMDAwMDApXG4gICAgKTtcbiAgICBpZiAobG93TGlxdWlkaXR5QXNzZXRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJpc2tGYWN0b3JzLnB1c2goe1xuICAgICAgICB0eXBlOiAnbGlxdWlkaXR5JyxcbiAgICAgICAgc2V2ZXJpdHk6ICdtZWRpdW0nLFxuICAgICAgICBwcm9iYWJpbGl0eTogMC40LFxuICAgICAgICBpbXBhY3Q6IDE1LFxuICAgICAgICBkZXNjcmlwdGlvbjogYCR7bG93TGlxdWlkaXR5QXNzZXRzLmxlbmd0aH0gYXNzZXRzIHdpdGggcG90ZW50aWFsIGxpcXVpZGl0eSBjb25zdHJhaW50c2AsXG4gICAgICAgIHRpbWVIb3Jpem9uOiAnaW1tZWRpYXRlJ1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIENvbmNlbnRyYXRpb24gcmlza1xuICAgIGNvbnN0IHNlY3RvcnMgPSBuZXcgU2V0KGludmVzdG1lbnRzLm1hcChpbnYgPT4gaW52LnNlY3RvcikuZmlsdGVyKEJvb2xlYW4pKTtcbiAgICBpZiAoc2VjdG9ycy5zaXplIDw9IDIgJiYgaW52ZXN0bWVudHMubGVuZ3RoID4gMikge1xuICAgICAgcmlza0ZhY3RvcnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdtYXJrZXQnLFxuICAgICAgICBzZXZlcml0eTogJ2hpZ2gnLFxuICAgICAgICBwcm9iYWJpbGl0eTogMC41LFxuICAgICAgICBpbXBhY3Q6IDI1LFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0hpZ2ggc2VjdG9yIGNvbmNlbnRyYXRpb24gcmlzaycsXG4gICAgICAgIHRpbWVIb3Jpem9uOiAnbWVkaXVtLXRlcm0nXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gU3RyYXRlZ3ktc3BlY2lmaWMgcmlza3NcbiAgICBpZiAoaWRlYS5zdHJhdGVneSA9PT0gJ21vbWVudHVtJykge1xuICAgICAgcmlza0ZhY3RvcnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdtYXJrZXQnLFxuICAgICAgICBzZXZlcml0eTogJ21lZGl1bScsXG4gICAgICAgIHByb2JhYmlsaXR5OiAwLjYsXG4gICAgICAgIGltcGFjdDogMjAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTW9tZW50dW0gc3RyYXRlZ3kgdnVsbmVyYWJsZSB0byB0cmVuZCByZXZlcnNhbHMnLFxuICAgICAgICB0aW1lSG9yaXpvbjogJ3Nob3J0LXRlcm0nXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gQWx3YXlzIGFkZCBhdCBsZWFzdCBvbmUgZ2VuZXJhbCByaXNrIGZhY3RvciB0byBlbnN1cmUgbWl0aWdhdGlvbiBzdHJhdGVnaWVzIGFyZSBnZW5lcmF0ZWRcbiAgICBpZiAocmlza0ZhY3RvcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByaXNrRmFjdG9ycy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ21hcmtldCcsXG4gICAgICAgIHNldmVyaXR5OiAnbG93JyxcbiAgICAgICAgcHJvYmFiaWxpdHk6IDAuMixcbiAgICAgICAgaW1wYWN0OiA1LFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0dlbmVyYWwgbWFya2V0IHJpc2sgZXhwb3N1cmUnLFxuICAgICAgICB0aW1lSG9yaXpvbjogJ21lZGl1bS10ZXJtJ1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByaXNrRmFjdG9ycztcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVSaXNrTWl0aWdhdGlvbihyaXNrRmFjdG9yczogUmlza0ZhY3RvcltdKTogUmlza01pdGlnYXRpb25bXSB7XG4gICAgcmV0dXJuIHJpc2tGYWN0b3JzLm1hcChmYWN0b3IgPT4ge1xuICAgICAgc3dpdGNoIChmYWN0b3IudHlwZSkge1xuICAgICAgICBjYXNlICdtYXJrZXQnOlxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByaXNrVHlwZTogZmFjdG9yLnR5cGUsXG4gICAgICAgICAgICBzdHJhdGVneTogJ0NvbnNpZGVyIGhlZGdpbmcgd2l0aCBtYXJrZXQtbmV1dHJhbCBwb3NpdGlvbnMgb3IgZGVmZW5zaXZlIGFzc2V0cycsXG4gICAgICAgICAgICBlZmZlY3RpdmVuZXNzOiAwLjcsXG4gICAgICAgICAgICBjb3N0OiAwLjAyLFxuICAgICAgICAgICAgaW1wbGVtZW50YXRpb246ICdncmFkdWFsJ1xuICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgJ2xpcXVpZGl0eSc6XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJpc2tUeXBlOiBmYWN0b3IudHlwZSxcbiAgICAgICAgICAgIHN0cmF0ZWd5OiAnTWFpbnRhaW4gY2FzaCByZXNlcnZlcyBhbmQgc3RhZ2dlciBwb3NpdGlvbiBzaXplcycsXG4gICAgICAgICAgICBlZmZlY3RpdmVuZXNzOiAwLjgsXG4gICAgICAgICAgICBjb3N0OiAwLjAxLFxuICAgICAgICAgICAgaW1wbGVtZW50YXRpb246ICdpbW1lZGlhdGUnXG4gICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAnY3JlZGl0JzpcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmlza1R5cGU6IGZhY3Rvci50eXBlLFxuICAgICAgICAgICAgc3RyYXRlZ3k6ICdEaXZlcnNpZnkgYWNyb3NzIGNyZWRpdCByYXRpbmdzIGFuZCBtb25pdG9yIGNyZWRpdCBzcHJlYWRzJyxcbiAgICAgICAgICAgIGVmZmVjdGl2ZW5lc3M6IDAuNixcbiAgICAgICAgICAgIGNvc3Q6IDAuMDE1LFxuICAgICAgICAgICAgaW1wbGVtZW50YXRpb246ICdncmFkdWFsJ1xuICAgICAgICAgIH07XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJpc2tUeXBlOiBmYWN0b3IudHlwZSxcbiAgICAgICAgICAgIHN0cmF0ZWd5OiAnTW9uaXRvciBjbG9zZWx5IGFuZCBtYWludGFpbiBzdG9wLWxvc3MgbGV2ZWxzJyxcbiAgICAgICAgICAgIGVmZmVjdGl2ZW5lc3M6IDAuNSxcbiAgICAgICAgICAgIGNvc3Q6IDAuMDA1LFxuICAgICAgICAgICAgaW1wbGVtZW50YXRpb246ICdpbW1lZGlhdGUnXG4gICAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcGVyZm9ybVN0cmVzc1Rlc3RzKGludmVzdG1lbnRzOiBJbnZlc3RtZW50W10pOiBTdHJlc3NUZXN0UmVzdWx0W10ge1xuICAgIGNvbnN0IHJlc3VsdHM6IFN0cmVzc1Rlc3RSZXN1bHRbXSA9IFtdO1xuICAgIFxuICAgIC8vIE1hcmtldCBjcmFzaCBzY2VuYXJpb1xuICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICBzY2VuYXJpbzogJ01hcmtldCBDcmFzaCAoLTMwJSknLFxuICAgICAgcHJvYmFiaWxpdHk6IDAuMDUsXG4gICAgICBleHBlY3RlZExvc3M6IDAuMjUsIC8vIEFzc3VtaW5nIHNvbWUgY29ycmVsYXRpb24gYnV0IG5vdCBwZXJmZWN0XG4gICAgICB0aW1lVG9SZWNvdmVyeTogMzY1LFxuICAgICAgZGVzY3JpcHRpb246ICdCcm9hZCBtYXJrZXQgZGVjbGluZSBvZiAzMCUgb3ZlciAzIG1vbnRocydcbiAgICB9KTtcbiAgICBcbiAgICAvLyBJbnRlcmVzdCByYXRlIHNob2NrXG4gICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgIHNjZW5hcmlvOiAnSW50ZXJlc3QgUmF0ZSBTaG9jayAoKzIwMGJwKScsXG4gICAgICBwcm9iYWJpbGl0eTogMC4xNSxcbiAgICAgIGV4cGVjdGVkTG9zczogMC4xMixcbiAgICAgIHRpbWVUb1JlY292ZXJ5OiAxODAsXG4gICAgICBkZXNjcmlwdGlvbjogJ1JhcGlkIGluY3JlYXNlIGluIGludGVyZXN0IHJhdGVzIGJ5IDIgcGVyY2VudGFnZSBwb2ludHMnXG4gICAgfSk7XG4gICAgXG4gICAgLy8gU2VjdG9yLXNwZWNpZmljIHN0cmVzc1xuICAgIGNvbnN0IHNlY3RvcnMgPSBuZXcgU2V0KGludmVzdG1lbnRzLm1hcChpbnYgPT4gaW52LnNlY3RvcikuZmlsdGVyKEJvb2xlYW4pKTtcbiAgICBmb3IgKGNvbnN0IHNlY3RvciBvZiBzZWN0b3JzKSB7XG4gICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICBzY2VuYXJpbzogYCR7c2VjdG9yfSBTZWN0b3IgRGVjbGluZSAoLTIwJSlgLFxuICAgICAgICBwcm9iYWJpbGl0eTogMC4xLFxuICAgICAgICBleHBlY3RlZExvc3M6IDAuMTUsXG4gICAgICAgIHRpbWVUb1JlY292ZXJ5OiAyNzAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgU2VjdG9yLXNwZWNpZmljIGRlY2xpbmUgaW4gJHtzZWN0b3J9YFxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG5cbiAgcHJpdmF0ZSBwZXJmb3JtU2NlbmFyaW9BbmFseXNpcyhpbnZlc3RtZW50czogSW52ZXN0bWVudFtdKTogU2NlbmFyaW9SaXNrW10ge1xuICAgIHJldHVybiBbXG4gICAgICB7XG4gICAgICAgIHNjZW5hcmlvOiAnYnVsbCcsXG4gICAgICAgIHByb2JhYmlsaXR5OiAwLjMsXG4gICAgICAgIHJpc2tMZXZlbDogJ2xvdycsXG4gICAgICAgIGV4cGVjdGVkSW1wYWN0OiAwLjE1LFxuICAgICAgICBrZXlUcmlnZ2VyczogWydFY29ub21pYyBncm93dGgnLCAnTG93IGludGVyZXN0IHJhdGVzJywgJ1Bvc2l0aXZlIGVhcm5pbmdzJ11cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNjZW5hcmlvOiAnYmVhcicsXG4gICAgICAgIHByb2JhYmlsaXR5OiAwLjIsXG4gICAgICAgIHJpc2tMZXZlbDogJ2hpZ2gnLFxuICAgICAgICBleHBlY3RlZEltcGFjdDogLTAuMjUsXG4gICAgICAgIGtleVRyaWdnZXJzOiBbJ1JlY2Vzc2lvbicsICdIaWdoIGluZmxhdGlvbicsICdHZW9wb2xpdGljYWwgdGVuc2lvbnMnXVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc2NlbmFyaW86ICdzaWRld2F5cycsXG4gICAgICAgIHByb2JhYmlsaXR5OiAwLjQsXG4gICAgICAgIHJpc2tMZXZlbDogJ21vZGVyYXRlJyxcbiAgICAgICAgZXhwZWN0ZWRJbXBhY3Q6IDAuMDIsXG4gICAgICAgIGtleVRyaWdnZXJzOiBbJ01peGVkIGVjb25vbWljIHNpZ25hbHMnLCAnVW5jZXJ0YWludHknLCAnUmFuZ2UtYm91bmQgbWFya2V0cyddXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzY2VuYXJpbzogJ2NyaXNpcycsXG4gICAgICAgIHByb2JhYmlsaXR5OiAwLjA1LFxuICAgICAgICByaXNrTGV2ZWw6ICd2ZXJ5LWhpZ2gnLFxuICAgICAgICBleHBlY3RlZEltcGFjdDogLTAuNDAsXG4gICAgICAgIGtleVRyaWdnZXJzOiBbJ0ZpbmFuY2lhbCBjcmlzaXMnLCAnQmxhY2sgc3dhbiBldmVudCcsICdTeXN0ZW0gZmFpbHVyZSddXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzY2VuYXJpbzogJ3JlY292ZXJ5JyxcbiAgICAgICAgcHJvYmFiaWxpdHk6IDAuMDUsXG4gICAgICAgIHJpc2tMZXZlbDogJ21vZGVyYXRlJyxcbiAgICAgICAgZXhwZWN0ZWRJbXBhY3Q6IDAuMjUsXG4gICAgICAgIGtleVRyaWdnZXJzOiBbJ1Bvc3QtY3Jpc2lzIHJlY292ZXJ5JywgJ1BvbGljeSBzdXBwb3J0JywgJ1BlbnQtdXAgZGVtYW5kJ11cbiAgICAgIH1cbiAgICBdO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3Nlc3NDb3JyZWxhdGlvblJpc2tzKGludmVzdG1lbnRzOiBJbnZlc3RtZW50W10pOiBDb3JyZWxhdGlvblJpc2tbXSB7XG4gICAgY29uc3Qgcmlza3M6IENvcnJlbGF0aW9uUmlza1tdID0gW107XG4gICAgXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnZlc3RtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDwgaW52ZXN0bWVudHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgY29uc3QgaW52MSA9IGludmVzdG1lbnRzW2ldO1xuICAgICAgICBjb25zdCBpbnYyID0gaW52ZXN0bWVudHNbal07XG4gICAgICAgIGNvbnN0IGNvcnJlbGF0aW9uID0gaW52MS5yaXNrTWV0cmljcz8uY29ycmVsYXRpb25zPy5baW52Mi5pZF0gfHwgMC41O1xuICAgICAgICBcbiAgICAgICAgaWYgKE1hdGguYWJzKGNvcnJlbGF0aW9uKSA+IDAuNykge1xuICAgICAgICAgIHJpc2tzLnB1c2goe1xuICAgICAgICAgICAgYXNzZXRQYWlyOiBgJHtpbnYxLm5hbWV9IC0gJHtpbnYyLm5hbWV9YCxcbiAgICAgICAgICAgIGNvcnJlbGF0aW9uLFxuICAgICAgICAgICAgcmlza0xldmVsOiBNYXRoLmFicyhjb3JyZWxhdGlvbikgPiAwLjggPyAnaGlnaCcgOiAnbWVkaXVtJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgSGlnaCBjb3JyZWxhdGlvbiAoJHtjb3JyZWxhdGlvbi50b0ZpeGVkKDIpfSkgcmVkdWNlcyBkaXZlcnNpZmljYXRpb24gYmVuZWZpdHNgXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHJpc2tzO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3Nlc3NMaXF1aWRpdHlSaXNrKGludmVzdG1lbnRzOiBJbnZlc3RtZW50W10pOiBMaXF1aWRpdHlSaXNrIHtcbiAgICBjb25zdCBhdmdWb2x1bWUgPSBpbnZlc3RtZW50cy5yZWR1Y2UoKHN1bSwgaW52KSA9PiB7XG4gICAgICBjb25zdCByZWNlbnRWb2x1bWUgPSBpbnYuaGlzdG9yaWNhbFBlcmZvcm1hbmNlLnNsaWNlKC0zMClcbiAgICAgICAgLnJlZHVjZSgodlN1bSwgcCkgPT4gdlN1bSArIHAudm9sdW1lLCAwKSAvIDMwO1xuICAgICAgcmV0dXJuIHN1bSArIHJlY2VudFZvbHVtZTtcbiAgICB9LCAwKSAvIGludmVzdG1lbnRzLmxlbmd0aDtcbiAgICBcbiAgICBjb25zdCBsb3dWb2x1bWVDb3VudCA9IGludmVzdG1lbnRzLmZpbHRlcihpbnYgPT4ge1xuICAgICAgY29uc3QgcmVjZW50Vm9sdW1lID0gaW52Lmhpc3RvcmljYWxQZXJmb3JtYW5jZS5zbGljZSgtMzApXG4gICAgICAgIC5yZWR1Y2UoKHZTdW0sIHApID0+IHZTdW0gKyBwLnZvbHVtZSwgMCkgLyAzMDtcbiAgICAgIHJldHVybiByZWNlbnRWb2x1bWUgPCAxMDAwMDA7XG4gICAgfSkubGVuZ3RoO1xuICAgIFxuICAgIGNvbnN0IGxpcXVpZGl0eUxldmVsID0gbG93Vm9sdW1lQ291bnQgPiBpbnZlc3RtZW50cy5sZW5ndGggKiAwLjMgPyAnaGlnaCcgOiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbG93Vm9sdW1lQ291bnQgPiAwID8gJ21lZGl1bScgOiAnbG93JztcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgbGV2ZWw6IGxpcXVpZGl0eUxldmVsLFxuICAgICAgYXZlcmFnZURhaWx5Vm9sdW1lOiBhdmdWb2x1bWUsXG4gICAgICBiaWRBc2tTcHJlYWQ6IDAuMDEsIC8vIFNpbXBsaWZpZWQgYXNzdW1wdGlvblxuICAgICAgbWFya2V0SW1wYWN0Q29zdDogbGlxdWlkaXR5TGV2ZWwgPT09ICdoaWdoJyA/IDAuMDIgOiBsaXF1aWRpdHlMZXZlbCA9PT0gJ21lZGl1bScgPyAwLjAxIDogMC4wMDUsXG4gICAgICB0aW1lVG9MaXF1aWRhdGU6IGxpcXVpZGl0eUxldmVsID09PSAnaGlnaCcgPyA1IDogbGlxdWlkaXR5TGV2ZWwgPT09ICdtZWRpdW0nID8gMiA6IDFcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3Nlc3NDb25jZW50cmF0aW9uUmlzayhpbnZlc3RtZW50czogSW52ZXN0bWVudFtdKTogQ29uY2VudHJhdGlvblJpc2sge1xuICAgIGNvbnN0IHNlY3RvcnMgPSBuZXcgU2V0KGludmVzdG1lbnRzLm1hcChpbnYgPT4gaW52LnNlY3RvcikuZmlsdGVyKEJvb2xlYW4pKTtcbiAgICBjb25zdCBhc3NldFR5cGVzID0gbmV3IFNldChpbnZlc3RtZW50cy5tYXAoaW52ID0+IGludi50eXBlKSk7XG4gICAgXG4gICAgY29uc3Qgc2VjdG9yQ29uY2VudHJhdGlvbiA9IDEgLSAoc2VjdG9ycy5zaXplIC8gTWF0aC5tYXgoaW52ZXN0bWVudHMubGVuZ3RoLCAxKSk7XG4gICAgY29uc3QgYXNzZXRDbGFzc0NvbmNlbnRyYXRpb24gPSAxIC0gKGFzc2V0VHlwZXMuc2l6ZSAvIE1hdGgubWF4KGludmVzdG1lbnRzLmxlbmd0aCwgMSkpO1xuICAgIFxuICAgIC8vIFNpbmdsZSBwb3NpdGlvbiByaXNrIChhc3N1bWluZyBlcXVhbCB3ZWlnaHRzKVxuICAgIGNvbnN0IHNpbmdsZVBvc2l0aW9uUmlzayA9IDEgLyBpbnZlc3RtZW50cy5sZW5ndGg7XG4gICAgXG4gICAgY29uc3Qgb3ZlcmFsbExldmVsID0gc2VjdG9yQ29uY2VudHJhdGlvbiA+IDAuNyB8fCBhc3NldENsYXNzQ29uY2VudHJhdGlvbiA+IDAuNyB8fCBzaW5nbGVQb3NpdGlvblJpc2sgPiAwLjMgPyAnaGlnaCcgOlxuICAgICAgICAgICAgICAgICAgICAgICAgc2VjdG9yQ29uY2VudHJhdGlvbiA+IDAuNSB8fCBhc3NldENsYXNzQ29uY2VudHJhdGlvbiA+IDAuNSB8fCBzaW5nbGVQb3NpdGlvblJpc2sgPiAwLjIgPyAnbWVkaXVtJyA6ICdsb3cnO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBsZXZlbDogb3ZlcmFsbExldmVsLFxuICAgICAgc2VjdG9yQ29uY2VudHJhdGlvbixcbiAgICAgIGdlb2dyYXBoaWNDb25jZW50cmF0aW9uOiAwLjUsIC8vIFNpbXBsaWZpZWQgYXNzdW1wdGlvblxuICAgICAgYXNzZXRDbGFzc0NvbmNlbnRyYXRpb24sXG4gICAgICBzaW5nbGVQb3NpdGlvblJpc2tcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3Nlc3NNYXJrZXRSaXNrKGludmVzdG1lbnRzOiBJbnZlc3RtZW50W10pOiBNYXJrZXRSaXNrIHtcbiAgICBjb25zdCBhdmdCZXRhID0gaW52ZXN0bWVudHMucmVkdWNlKChzdW0sIGludikgPT4gc3VtICsgKGludi5yaXNrTWV0cmljcz8uYmV0YSB8fCAxKSwgMCkgLyBpbnZlc3RtZW50cy5sZW5ndGg7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIGJldGE6IGF2Z0JldGEsXG4gICAgICBtYXJrZXRTZW5zaXRpdml0eTogYXZnQmV0YSxcbiAgICAgIHNlY3RvclNlbnNpdGl2aXR5OiAwLjcsIC8vIFNpbXBsaWZpZWQgYXNzdW1wdGlvblxuICAgICAgaW50ZXJlc3RSYXRlU2Vuc2l0aXZpdHk6IDAuMywgLy8gU2ltcGxpZmllZCBhc3N1bXB0aW9uXG4gICAgICBjdXJyZW5jeUV4cG9zdXJlOiAwLjEgLy8gU2ltcGxpZmllZCBhc3N1bXB0aW9uXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXNzZXNzQ3JlZGl0UmlzayhpbnZlc3RtZW50czogSW52ZXN0bWVudFtdKTogQ3JlZGl0UmlzayB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgYm9uZEludmVzdG1lbnRzID0gaW52ZXN0bWVudHMuZmlsdGVyKGludiA9PiBpbnYudHlwZSA9PT0gJ2JvbmQnKTtcbiAgICBpZiAoYm9uZEludmVzdG1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgY3JlZGl0UmF0aW5nOiAnQkJCJywgLy8gU2ltcGxpZmllZCBhc3N1bXB0aW9uXG4gICAgICBkZWZhdWx0UHJvYmFiaWxpdHk6IDAuMDIsXG4gICAgICByZWNvdmVyeVJhdGU6IDAuNixcbiAgICAgIGNyZWRpdFNwcmVhZDogMC4wMTVcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3Nlc3NPcGVyYXRpb25hbFJpc2soaW52ZXN0bWVudHM6IEludmVzdG1lbnRbXSwgaWRlYTogSW52ZXN0bWVudElkZWEpOiBPcGVyYXRpb25hbFJpc2sge1xuICAgIC8vIFNpbXBsaWZpZWQgb3BlcmF0aW9uYWwgcmlzayBhc3Nlc3NtZW50XG4gICAgY29uc3QgY29tcGxleGl0eVNjb3JlID0gaWRlYS5zdHJhdGVneSA9PT0gJ2NvbXBsZXgnID8gMC44IDogMC4zO1xuICAgIGNvbnN0IGRhdGFRdWFsaXR5U2NvcmUgPSB0aGlzLmFzc2Vzc0RhdGFRdWFsaXR5KGlkZWEuc3VwcG9ydGluZ0RhdGEpIC8gMTAwO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBsZXZlbDogY29tcGxleGl0eVNjb3JlID4gMC42ID8gJ2hpZ2gnIDogY29tcGxleGl0eVNjb3JlID4gMC4zID8gJ21lZGl1bScgOiAnbG93JyxcbiAgICAgIGtleVBlcnNvblJpc2s6IDAuMixcbiAgICAgIHN5c3RlbVJpc2s6IDAuMSxcbiAgICAgIHByb2Nlc3NSaXNrOiBjb21wbGV4aXR5U2NvcmUsXG4gICAgICBleHRlcm5hbEV2ZW50UmlzazogMC4xNVxuICAgIH07XG4gIH1cblxuICAvLyBFeHBlY3RlZCBvdXRjb21lIG1vZGVsaW5nIGhlbHBlciBtZXRob2RzXG5cbiAgcHJpdmF0ZSBjcmVhdGVCYXNlU2NlbmFyaW8oaWRlYTogSW52ZXN0bWVudElkZWEpOiBPdXRjb21lU2NlbmFyaW8ge1xuICAgIGNvbnN0IGV4cGVjdGVkT3V0Y29tZSA9IGlkZWEucG90ZW50aWFsT3V0Y29tZXMuZmluZChvID0+IG8uc2NlbmFyaW8gPT09ICdleHBlY3RlZCcpO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBwcm9iYWJpbGl0eTogMC42LFxuICAgICAgZXhwZWN0ZWRSZXR1cm46IGV4cGVjdGVkT3V0Y29tZT8ucmV0dXJuRXN0aW1hdGUgfHwgMC4wOCxcbiAgICAgIHRpbWVUb1JlYWxpemF0aW9uOiBleHBlY3RlZE91dGNvbWU/LnRpbWVUb1JlYWxpemF0aW9uIHx8IHRoaXMuY2FsY3VsYXRlT3B0aW1hbEhvbGRpbmdQZXJpb2QoaWRlYSksXG4gICAgICBrZXlBc3N1bXB0aW9uczogW1xuICAgICAgICAnTWFya2V0IGNvbmRpdGlvbnMgcmVtYWluIHN0YWJsZScsXG4gICAgICAgICdDb21wYW55IGZ1bmRhbWVudGFscyBpbXByb3ZlIGFzIGV4cGVjdGVkJyxcbiAgICAgICAgJ05vIG1ham9yIGV4dGVybmFsIHNob2NrcydcbiAgICAgIF0sXG4gICAgICBjYXRhbHlzdHM6IGV4cGVjdGVkT3V0Y29tZT8uY2F0YWx5c3RzIHx8IFsnRWFybmluZ3MgZ3Jvd3RoJywgJ01hcmtldCBleHBhbnNpb24nXSxcbiAgICAgIHJpc2tzOiBleHBlY3RlZE91dGNvbWU/LmtleVJpc2tzIHx8IFsnTWFya2V0IHZvbGF0aWxpdHknLCAnRXhlY3V0aW9uIHJpc2snXSxcbiAgICAgIG1pbGVzdG9uZXM6IHRoaXMuZ2VuZXJhdGVNaWxlc3RvbmVzKGlkZWEpXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQnVsbFNjZW5hcmlvKGlkZWE6IEludmVzdG1lbnRJZGVhKTogT3V0Y29tZVNjZW5hcmlvIHtcbiAgICBjb25zdCBiZXN0T3V0Y29tZSA9IGlkZWEucG90ZW50aWFsT3V0Y29tZXMuZmluZChvID0+IG8uc2NlbmFyaW8gPT09ICdiZXN0Jyk7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIHByb2JhYmlsaXR5OiAwLjIsXG4gICAgICBleHBlY3RlZFJldHVybjogYmVzdE91dGNvbWU/LnJldHVybkVzdGltYXRlIHx8IDAuMjAsXG4gICAgICB0aW1lVG9SZWFsaXphdGlvbjogKGJlc3RPdXRjb21lPy50aW1lVG9SZWFsaXphdGlvbiB8fCB0aGlzLmNhbGN1bGF0ZU9wdGltYWxIb2xkaW5nUGVyaW9kKGlkZWEpKSAqIDAuOCxcbiAgICAgIGtleUFzc3VtcHRpb25zOiBbXG4gICAgICAgICdGYXZvcmFibGUgbWFya2V0IGNvbmRpdGlvbnMnLFxuICAgICAgICAnU3Ryb25nIGV4ZWN1dGlvbiBvZiBidXNpbmVzcyBwbGFuJyxcbiAgICAgICAgJ1Bvc2l0aXZlIHJlZ3VsYXRvcnkgZW52aXJvbm1lbnQnXG4gICAgICBdLFxuICAgICAgY2F0YWx5c3RzOiBiZXN0T3V0Y29tZT8uY2F0YWx5c3RzIHx8IFsnU3Ryb25nIGVhcm5pbmdzIGJlYXQnLCAnTWFya2V0IGxlYWRlcnNoaXAnLCAnU3RyYXRlZ2ljIHBhcnRuZXJzaGlwcyddLFxuICAgICAgcmlza3M6IFsnT3ZlcnZhbHVhdGlvbicsICdNYXJrZXQgY29ycmVjdGlvbiddLFxuICAgICAgbWlsZXN0b25lczogdGhpcy5nZW5lcmF0ZU1pbGVzdG9uZXMoaWRlYSwgJ2J1bGwnKVxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUJlYXJTY2VuYXJpbyhpZGVhOiBJbnZlc3RtZW50SWRlYSk6IE91dGNvbWVTY2VuYXJpbyB7XG4gICAgY29uc3Qgd29yc3RPdXRjb21lID0gaWRlYS5wb3RlbnRpYWxPdXRjb21lcy5maW5kKG8gPT4gby5zY2VuYXJpbyA9PT0gJ3dvcnN0Jyk7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIHByb2JhYmlsaXR5OiAwLjIsXG4gICAgICBleHBlY3RlZFJldHVybjogd29yc3RPdXRjb21lPy5yZXR1cm5Fc3RpbWF0ZSB8fCAtMC4xNSxcbiAgICAgIHRpbWVUb1JlYWxpemF0aW9uOiAod29yc3RPdXRjb21lPy50aW1lVG9SZWFsaXphdGlvbiB8fCB0aGlzLmNhbGN1bGF0ZU9wdGltYWxIb2xkaW5nUGVyaW9kKGlkZWEpKSAqIDEuNSxcbiAgICAgIGtleUFzc3VtcHRpb25zOiBbXG4gICAgICAgICdBZHZlcnNlIG1hcmtldCBjb25kaXRpb25zJyxcbiAgICAgICAgJ0V4ZWN1dGlvbiBjaGFsbGVuZ2VzJyxcbiAgICAgICAgJ1JlZ3VsYXRvcnkgaGVhZHdpbmRzJ1xuICAgICAgXSxcbiAgICAgIGNhdGFseXN0czogWydFYXJuaW5ncyBtaXNzJywgJ0NvbXBldGl0aXZlIHByZXNzdXJlJywgJ0Vjb25vbWljIGRvd250dXJuJ10sXG4gICAgICByaXNrczogd29yc3RPdXRjb21lPy5rZXlSaXNrcyB8fCBbJ1NpZ25pZmljYW50IGxvc3NlcycsICdMaXF1aWRpdHkgaXNzdWVzJ10sXG4gICAgICBtaWxlc3RvbmVzOiB0aGlzLmdlbmVyYXRlTWlsZXN0b25lcyhpZGVhLCAnYmVhcicpXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVNaWxlc3RvbmVzKGlkZWE6IEludmVzdG1lbnRJZGVhLCBzY2VuYXJpbzogJ2J1bGwnIHwgJ2JlYXInIHwgJ2Jhc2UnID0gJ2Jhc2UnKTogTWlsZXN0b25lW10ge1xuICAgIGNvbnN0IG1pbGVzdG9uZXM6IE1pbGVzdG9uZVtdID0gW107XG4gICAgY29uc3QgYmFzZURhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IGhvbGRpbmdQZXJpb2QgPSB0aGlzLmNhbGN1bGF0ZU9wdGltYWxIb2xkaW5nUGVyaW9kKGlkZWEpO1xuICAgIFxuICAgIC8vIFF1YXJ0ZXJseSBtaWxlc3RvbmVzXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gTWF0aC5jZWlsKGhvbGRpbmdQZXJpb2QgLyA5MCk7IGkrKykge1xuICAgICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKGJhc2VEYXRlKTtcbiAgICAgIGRhdGUuc2V0RGF0ZShkYXRlLmdldERhdGUoKSArIChpICogOTApKTtcbiAgICAgIFxuICAgICAgbWlsZXN0b25lcy5wdXNoKHtcbiAgICAgICAgZGF0ZSxcbiAgICAgICAgZGVzY3JpcHRpb246IGBRJHtpfSBQZXJmb3JtYW5jZSBSZXZpZXdgLFxuICAgICAgICBwcm9iYWJpbGl0eTogc2NlbmFyaW8gPT09ICdidWxsJyA/IDAuOCA6IHNjZW5hcmlvID09PSAnYmVhcicgPyAwLjQgOiAwLjYsXG4gICAgICAgIGltcGFjdDogc2NlbmFyaW8gPT09ICdidWxsJyA/IDAuMDUgOiBzY2VuYXJpbyA9PT0gJ2JlYXInID8gLTAuMDMgOiAwLjAyLFxuICAgICAgICB0eXBlOiAnZGVjaXNpb24tcG9pbnQnXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gTWFqb3IgbWFya2V0IGV2ZW50c1xuICAgIGNvbnN0IG1hcmtldEV2ZW50RGF0ZSA9IG5ldyBEYXRlKGJhc2VEYXRlKTtcbiAgICBtYXJrZXRFdmVudERhdGUuc2V0RGF0ZShtYXJrZXRFdmVudERhdGUuZ2V0RGF0ZSgpICsgKGhvbGRpbmdQZXJpb2QgLyAyKSk7XG4gICAgXG4gICAgbWlsZXN0b25lcy5wdXNoKHtcbiAgICAgIGRhdGU6IG1hcmtldEV2ZW50RGF0ZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTWFqb3IgTWFya2V0IEV2ZW50JyxcbiAgICAgIHByb2JhYmlsaXR5OiAwLjMsXG4gICAgICBpbXBhY3Q6IHNjZW5hcmlvID09PSAnYnVsbCcgPyAwLjEwIDogc2NlbmFyaW8gPT09ICdiZWFyJyA/IC0wLjE1IDogLTAuMDUsXG4gICAgICB0eXBlOiAnbWFya2V0LWV2ZW50J1xuICAgIH0pO1xuICAgIFxuICAgIHJldHVybiBtaWxlc3RvbmVzO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVQcm9iYWJpbGl0eVdlaWdodGVkUmV0dXJuKHNjZW5hcmlvczogT3V0Y29tZVNjZW5hcmlvW10pOiBudW1iZXIge1xuICAgIHJldHVybiBzY2VuYXJpb3MucmVkdWNlKChzdW0sIHNjZW5hcmlvKSA9PiBzdW0gKyAoc2NlbmFyaW8uZXhwZWN0ZWRSZXR1cm4gKiBzY2VuYXJpby5wcm9iYWJpbGl0eSksIDApO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVDb25maWRlbmNlSW50ZXJ2YWwoaW52ZXN0bWVudHM6IEludmVzdG1lbnRbXSk6IENvbmZpZGVuY2VJbnRlcnZhbCB7XG4gICAgY29uc3QgZXhwZWN0ZWRSZXR1cm4gPSB0aGlzLmNhbGN1bGF0ZUV4cGVjdGVkUmV0dXJuKGludmVzdG1lbnRzLCBbXSk7XG4gICAgY29uc3Qgdm9sYXRpbGl0eSA9IHRoaXMuY2FsY3VsYXRlUG9ydGZvbGlvVm9sYXRpbGl0eShpbnZlc3RtZW50cyk7XG4gICAgXG4gICAgLy8gOTUlIGNvbmZpZGVuY2UgaW50ZXJ2YWxcbiAgICBjb25zdCB6U2NvcmUgPSAxLjk2O1xuICAgIGNvbnN0IHN0YW5kYXJkRXJyb3IgPSB2b2xhdGlsaXR5IC8gTWF0aC5zcXJ0KDI1Mik7IC8vIERhaWx5IHRvIGFubnVhbFxuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBsZXZlbDogMC45NSxcbiAgICAgIGxvd2VyQm91bmQ6IGV4cGVjdGVkUmV0dXJuIC0gKHpTY29yZSAqIHN0YW5kYXJkRXJyb3IpLFxuICAgICAgdXBwZXJCb3VuZDogZXhwZWN0ZWRSZXR1cm4gKyAoelNjb3JlICogc3RhbmRhcmRFcnJvciksXG4gICAgICBzdGFuZGFyZEVycm9yXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgcGVyZm9ybVNlbnNpdGl2aXR5QW5hbHlzaXMoaW52ZXN0bWVudHM6IEludmVzdG1lbnRbXSwgaWRlYTogSW52ZXN0bWVudElkZWEpOiBTZW5zaXRpdml0eUFuYWx5c2lzIHtcbiAgICBjb25zdCB2YXJpYWJsZXM6IFNlbnNpdGl2aXR5VmFyaWFibGVbXSA9IFtcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ01hcmtldCBSZXR1cm4nLFxuICAgICAgICBiYXNlVmFsdWU6IDAuMDgsXG4gICAgICAgIGltcGFjdDogMS4yLCAvLyBCZXRhLWxpa2Ugc2Vuc2l0aXZpdHlcbiAgICAgICAgZWxhc3RpY2l0eTogMS41LFxuICAgICAgICByYW5nZTogeyBtaW46IC0wLjMwLCBtYXg6IDAuMzAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ0ludGVyZXN0IFJhdGVzJyxcbiAgICAgICAgYmFzZVZhbHVlOiAwLjA1LFxuICAgICAgICBpbXBhY3Q6IC0wLjgsIC8vIE5lZ2F0aXZlIHNlbnNpdGl2aXR5XG4gICAgICAgIGVsYXN0aWNpdHk6IC0xLjIsXG4gICAgICAgIHJhbmdlOiB7IG1pbjogMC4wMSwgbWF4OiAwLjEwIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdWb2xhdGlsaXR5JyxcbiAgICAgICAgYmFzZVZhbHVlOiAwLjIwLFxuICAgICAgICBpbXBhY3Q6IC0wLjMsIC8vIEhpZ2hlciB2b2xhdGlsaXR5IHJlZHVjZXMgcmV0dXJuc1xuICAgICAgICBlbGFzdGljaXR5OiAtMC41LFxuICAgICAgICByYW5nZTogeyBtaW46IDAuMTAsIG1heDogMC41MCB9XG4gICAgICB9XG4gICAgXTtcbiAgICBcbiAgICAvLyBTaW1wbGlmaWVkIGNvcnJlbGF0aW9uIG1hdHJpeFxuICAgIGNvbnN0IGNvcnJlbGF0aW9uTWF0cml4ID0gW1xuICAgICAgWzEuMCwgLTAuMywgMC42XSwgIC8vIE1hcmtldCBSZXR1cm4gY29ycmVsYXRpb25zXG4gICAgICBbLTAuMywgMS4wLCAtMC4yXSwgLy8gSW50ZXJlc3QgUmF0ZSBjb3JyZWxhdGlvbnNcbiAgICAgIFswLjYsIC0wLjIsIDEuMF0gICAvLyBWb2xhdGlsaXR5IGNvcnJlbGF0aW9uc1xuICAgIF07XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIHZhcmlhYmxlcyxcbiAgICAgIGNvcnJlbGF0aW9uTWF0cml4LFxuICAgICAga2V5RHJpdmVyczogWydNYXJrZXQgUmV0dXJuJywgJ0ludGVyZXN0IFJhdGVzJ11cbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBydW5Nb250ZUNhcmxvU2ltdWxhdGlvbihpbnZlc3RtZW50czogSW52ZXN0bWVudFtdLCBpZGVhOiBJbnZlc3RtZW50SWRlYSk6IE1vbnRlQ2FybG9SZXN1bHRzIHtcbiAgICBjb25zdCBpdGVyYXRpb25zID0gMTAwMDA7XG4gICAgY29uc3QgZXhwZWN0ZWRSZXR1cm4gPSB0aGlzLmNhbGN1bGF0ZUV4cGVjdGVkUmV0dXJuKGludmVzdG1lbnRzLCBpZGVhLnBvdGVudGlhbE91dGNvbWVzKTtcbiAgICBjb25zdCB2b2xhdGlsaXR5ID0gdGhpcy5jYWxjdWxhdGVQb3J0Zm9saW9Wb2xhdGlsaXR5KGludmVzdG1lbnRzKTtcbiAgICBcbiAgICBjb25zdCByZXR1cm5zOiBudW1iZXJbXSA9IFtdO1xuICAgIFxuICAgIC8vIFNpbXBsZSBNb250ZSBDYXJsbyBzaW11bGF0aW9uIHVzaW5nIG5vcm1hbCBkaXN0cmlidXRpb25cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZXJhdGlvbnM7IGkrKykge1xuICAgICAgY29uc3QgcmFuZG9tUmV0dXJuID0gdGhpcy5nZW5lcmF0ZU5vcm1hbFJhbmRvbShleHBlY3RlZFJldHVybiwgdm9sYXRpbGl0eSk7XG4gICAgICByZXR1cm5zLnB1c2gocmFuZG9tUmV0dXJuKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJucy5zb3J0KChhLCBiKSA9PiBhIC0gYik7XG4gICAgXG4gICAgY29uc3QgbWVhblJldHVybiA9IHJldHVybnMucmVkdWNlKChzdW0sIHIpID0+IHN1bSArIHIsIDApIC8gaXRlcmF0aW9ucztcbiAgICBjb25zdCB2YXJpYW5jZSA9IHJldHVybnMucmVkdWNlKChzdW0sIHIpID0+IHN1bSArIE1hdGgucG93KHIgLSBtZWFuUmV0dXJuLCAyKSwgMCkgLyBpdGVyYXRpb25zO1xuICAgIGNvbnN0IHN0YW5kYXJkRGV2aWF0aW9uID0gTWF0aC5zcXJ0KHZhcmlhbmNlKTtcbiAgICBcbiAgICBjb25zdCBwZXJjZW50aWxlczogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHtcbiAgICAgICcxJzogcmV0dXJuc1tNYXRoLmZsb29yKGl0ZXJhdGlvbnMgKiAwLjAxKV0sXG4gICAgICAnNSc6IHJldHVybnNbTWF0aC5mbG9vcihpdGVyYXRpb25zICogMC4wNSldLFxuICAgICAgJzEwJzogcmV0dXJuc1tNYXRoLmZsb29yKGl0ZXJhdGlvbnMgKiAwLjEwKV0sXG4gICAgICAnMjUnOiByZXR1cm5zW01hdGguZmxvb3IoaXRlcmF0aW9ucyAqIDAuMjUpXSxcbiAgICAgICc1MCc6IHJldHVybnNbTWF0aC5mbG9vcihpdGVyYXRpb25zICogMC41MCldLFxuICAgICAgJzc1JzogcmV0dXJuc1tNYXRoLmZsb29yKGl0ZXJhdGlvbnMgKiAwLjc1KV0sXG4gICAgICAnOTAnOiByZXR1cm5zW01hdGguZmxvb3IoaXRlcmF0aW9ucyAqIDAuOTApXSxcbiAgICAgICc5NSc6IHJldHVybnNbTWF0aC5mbG9vcihpdGVyYXRpb25zICogMC45NSldLFxuICAgICAgJzk5JzogcmV0dXJuc1tNYXRoLmZsb29yKGl0ZXJhdGlvbnMgKiAwLjk5KV1cbiAgICB9O1xuICAgIFxuICAgIGNvbnN0IHByb2JhYmlsaXR5T2ZMb3NzID0gcmV0dXJucy5maWx0ZXIociA9PiByIDwgMCkubGVuZ3RoIC8gaXRlcmF0aW9ucztcbiAgICBjb25zdCB0YXJnZXRSZXR1cm4gPSAwLjEwOyAvLyAxMCUgdGFyZ2V0XG4gICAgY29uc3QgcHJvYmFiaWxpdHlPZlRhcmdldCA9IHJldHVybnMuZmlsdGVyKHIgPT4gciA+PSB0YXJnZXRSZXR1cm4pLmxlbmd0aCAvIGl0ZXJhdGlvbnM7XG4gICAgXG4gICAgLy8gRXhwZWN0ZWQgU2hvcnRmYWxsIChDb25kaXRpb25hbCBWYVIgYXQgNSUpXG4gICAgY29uc3QgdmFyNSA9IHBlcmNlbnRpbGVzWyc1J107XG4gICAgY29uc3QgdGFpbFJldHVybnMgPSByZXR1cm5zLmZpbHRlcihyID0+IHIgPD0gdmFyNSk7XG4gICAgY29uc3QgZXhwZWN0ZWRTaG9ydGZhbGwgPSB0YWlsUmV0dXJucy5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgciwgMCkgLyB0YWlsUmV0dXJucy5sZW5ndGg7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIGl0ZXJhdGlvbnMsXG4gICAgICBtZWFuUmV0dXJuLFxuICAgICAgc3RhbmRhcmREZXZpYXRpb24sXG4gICAgICBwZXJjZW50aWxlcyxcbiAgICAgIHByb2JhYmlsaXR5T2ZMb3NzLFxuICAgICAgcHJvYmFiaWxpdHlPZlRhcmdldCxcbiAgICAgIGV4cGVjdGVkU2hvcnRmYWxsXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVOb3JtYWxSYW5kb20obWVhbjogbnVtYmVyLCBzdGREZXY6IG51bWJlcik6IG51bWJlciB7XG4gICAgLy8gQm94LU11bGxlciB0cmFuc2Zvcm1hdGlvbiBmb3Igbm9ybWFsIGRpc3RyaWJ1dGlvblxuICAgIGNvbnN0IHUxID0gTWF0aC5yYW5kb20oKTtcbiAgICBjb25zdCB1MiA9IE1hdGgucmFuZG9tKCk7XG4gICAgY29uc3QgejAgPSBNYXRoLnNxcnQoLTIgKiBNYXRoLmxvZyh1MSkpICogTWF0aC5jb3MoMiAqIE1hdGguUEkgKiB1Mik7XG4gICAgcmV0dXJuIG1lYW4gKyAoc3RkRGV2ICogejApO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZVRpbWVTZXJpZXNQcm9qZWN0aW9uKGlkZWE6IEludmVzdG1lbnRJZGVhLCBtb250ZUNhcmxvUmVzdWx0czogTW9udGVDYXJsb1Jlc3VsdHMpOiBUaW1lU2VyaWVzUHJvamVjdGlvbltdIHtcbiAgICBjb25zdCBwcm9qZWN0aW9uczogVGltZVNlcmllc1Byb2plY3Rpb25bXSA9IFtdO1xuICAgIGNvbnN0IGhvbGRpbmdQZXJpb2QgPSB0aGlzLmNhbGN1bGF0ZU9wdGltYWxIb2xkaW5nUGVyaW9kKGlkZWEpO1xuICAgIGNvbnN0IHN0ZXBzID0gTWF0aC5taW4oaG9sZGluZ1BlcmlvZCwgMzY1KTsgLy8gRGFpbHkgcHJvamVjdGlvbnMgdXAgdG8gMSB5ZWFyXG4gICAgXG4gICAgY29uc3QgYmFzZURhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IGRhaWx5UmV0dXJuID0gbW9udGVDYXJsb1Jlc3VsdHMubWVhblJldHVybiAvIDI1MjsgLy8gQW5udWFsaXplZCB0byBkYWlseVxuICAgIGNvbnN0IGRhaWx5Vm9sYXRpbGl0eSA9IG1vbnRlQ2FybG9SZXN1bHRzLnN0YW5kYXJkRGV2aWF0aW9uIC8gTWF0aC5zcXJ0KDI1Mik7XG4gICAgXG4gICAgbGV0IGN1bXVsYXRpdmVSZXR1cm4gPSAwO1xuICAgIFxuICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHN0ZXBzOyBpKyspIHtcbiAgICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZShiYXNlRGF0ZSk7XG4gICAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgKyBpKTtcbiAgICAgIFxuICAgICAgY29uc3QgZXhwZWN0ZWRWYWx1ZSA9IGRhaWx5UmV0dXJuICogaTtcbiAgICAgIGNvbnN0IHZvbGF0aWxpdHlBZGp1c3RtZW50ID0gZGFpbHlWb2xhdGlsaXR5ICogTWF0aC5zcXJ0KGkpO1xuICAgICAgXG4gICAgICBjdW11bGF0aXZlUmV0dXJuICs9IGRhaWx5UmV0dXJuO1xuICAgICAgXG4gICAgICBwcm9qZWN0aW9ucy5wdXNoKHtcbiAgICAgICAgZGF0ZSxcbiAgICAgICAgZXhwZWN0ZWRWYWx1ZSxcbiAgICAgICAgY29uZmlkZW5jZUJhbmRzOiB7XG4gICAgICAgICAgdXBwZXI5NTogZXhwZWN0ZWRWYWx1ZSArICgxLjk2ICogdm9sYXRpbGl0eUFkanVzdG1lbnQpLFxuICAgICAgICAgIHVwcGVyNjg6IGV4cGVjdGVkVmFsdWUgKyAoMS4wICogdm9sYXRpbGl0eUFkanVzdG1lbnQpLFxuICAgICAgICAgIGxvd2VyNjg6IGV4cGVjdGVkVmFsdWUgLSAoMS4wICogdm9sYXRpbGl0eUFkanVzdG1lbnQpLFxuICAgICAgICAgIGxvd2VyOTU6IGV4cGVjdGVkVmFsdWUgLSAoMS45NiAqIHZvbGF0aWxpdHlBZGp1c3RtZW50KVxuICAgICAgICB9LFxuICAgICAgICBjdW11bGF0aXZlUmV0dXJuXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHByb2plY3Rpb25zO1xuICB9XG59Il19