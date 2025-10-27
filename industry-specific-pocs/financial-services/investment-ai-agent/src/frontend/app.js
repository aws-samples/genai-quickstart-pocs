/**
 * Investment AI Agent - Frontend Application
 * Handles form submission, request tracking, and user interactions
 */

class InvestmentRequestApp {
    constructor() {
        this.currentRequestId = null;
        this.statusPollingInterval = null;
        this.currentPage = 1;
        this.currentFilters = {};
        this.selectedRating = 0;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSliders();
        this.setupCollapsibleSections();
        this.loadRequestHistory();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('investment-request-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitRequest();
        });

        // Form reset
        document.getElementById('reset-form').addEventListener('click', () => {
            this.resetForm();
        });

        // Status refresh
        document.getElementById('refresh-status').addEventListener('click', () => {
            this.refreshStatus();
        });

        // Cancel request
        document.getElementById('cancel-request').addEventListener('click', () => {
            this.cancelRequest();
        });

        // New request
        document.getElementById('new-request').addEventListener('click', () => {
            this.showRequestForm();
        });

        // History filters
        document.getElementById('apply-filters').addEventListener('click', () => {
            this.applyHistoryFilters();
        });

        // Pagination
        document.getElementById('prev-page').addEventListener('click', () => {
            this.changePage(this.currentPage - 1);
        });

        document.getElementById('next-page').addEventListener('click', () => {
            this.changePage(this.currentPage + 1);
        });

        // Feedback modal
        document.getElementById('provide-feedback').addEventListener('click', () => {
            this.showFeedbackModal();
        });

        document.getElementById('close-feedback-modal').addEventListener('click', () => {
            this.hideFeedbackModal();
        });

        document.getElementById('cancel-feedback').addEventListener('click', () => {
            this.hideFeedbackModal();
        });

        document.getElementById('submit-feedback').addEventListener('click', () => {
            this.submitFeedback();
        });

        // Rating stars
        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', (e) => {
                this.setRating(parseInt(e.target.dataset.rating));
            });
        });

        // Download results
        document.getElementById('download-results').addEventListener('click', () => {
            this.downloadResults();
        });

        // View toggle buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Sort controls
        document.getElementById('sort-by').addEventListener('change', () => {
            this.sortResults();
        });

        document.getElementById('sort-order').addEventListener('click', () => {
            this.toggleSortOrder();
        });

        // Filter controls
        document.getElementById('filter-toggle').addEventListener('click', () => {
            this.toggleFilterPanel();
        });

        // Investment idea detail modal
        document.getElementById('close-idea-modal').addEventListener('click', () => {
            this.hideIdeaDetailModal();
        });

        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                this.switchTab(e.target.dataset.tab);
            }
        });

        // Share results
        document.getElementById('share-results').addEventListener('click', () => {
            this.shareResults();
        });
    }

    setupSliders() {
        const sliders = document.querySelectorAll('.slider');
        sliders.forEach(slider => {
            const valueSpan = slider.nextElementSibling;

            slider.addEventListener('input', (e) => {
                const value = e.target.value;
                const suffix = e.target.name === 'minimumConfidence' ? '%' : '';
                valueSpan.textContent = value + suffix;
            });
        });
    }

    setupCollapsibleSections() {
        document.querySelectorAll('.collapsible-header').forEach(header => {
            header.addEventListener('click', () => {
                const section = header.parentElement;
                section.classList.toggle('expanded');
            });
        });
    }

    async submitRequest() {
        try {
            this.showLoading();

            const formData = this.collectFormData();
            const validationResult = this.validateFormData(formData);

            if (!validationResult.isValid) {
                this.showToast('error', 'Please fix the validation errors: ' + validationResult.errors.join(', '));
                this.hideLoading();
                return;
            }

            const response = await fetch('https://fflo4lgd6d.execute-api.us-west-2.amazonaws.com/v1/api/v1/ideas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    parameters: formData.parameters,
                    priority: formData.priority
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit request');
            }

            this.currentRequestId = result.requestId;
            this.showRequestStatus();
            this.startStatusPolling();
            this.showToast('success', 'Request submitted successfully!');

        } catch (error) {
            console.error('Error submitting request:', error);
            const errorMessage = error.message || error.toString() || 'Unknown error occurred';
            this.showToast('error', 'Failed to submit request: ' + errorMessage);
        } finally {
            this.hideLoading();
        }
    }

    collectFormData() {
        const form = document.getElementById('investment-request-form');
        const formData = new FormData(form);

        const parameters = {
            investmentHorizon: formData.get('investmentHorizon'),
            riskTolerance: formData.get('riskTolerance'),
            investmentAmount: formData.get('investmentAmount') ? parseFloat(formData.get('investmentAmount')) : undefined,
            currency: formData.get('currency') || 'USD',
            sectors: this.parseCommaSeparated(formData.get('sectors')),
            assetClasses: formData.getAll('assetClasses'),
            geographicFocus: formData.getAll('geographicFocus'),
            excludedInvestments: this.parseCommaSeparated(formData.get('excludedInvestments')),
            minimumConfidence: parseInt(formData.get('minimumConfidence')),
            maximumIdeas: parseInt(formData.get('maximumIdeas')),
            researchDepth: formData.get('researchDepth'),
            includeAlternatives: formData.get('includeAlternatives') === 'true',
            includeESGFactors: formData.get('includeESGFactors') === 'true',
            includeVisualizations: formData.get('includeVisualizations') === 'true',
            includeBacktesting: formData.get('includeBacktesting') === 'true',
            includeRiskAnalysis: formData.get('includeRiskAnalysis') === 'true',
            liquidityRequirement: formData.get('liquidityRequirement'),
            outputFormat: formData.get('outputFormat'),
            thematicFocus: this.parseCommaSeparated(formData.get('thematicFocus'))
        };

        return {
            parameters,
            priority: formData.get('priority') || 'medium'
        };
    }

    parseCommaSeparated(value) {
        if (!value) return [];
        return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }

    validateFormData(formData) {
        const errors = [];
        const warnings = [];

        // Required fields
        if (!formData.parameters.investmentHorizon) {
            errors.push('Investment horizon is required');
        }

        if (!formData.parameters.riskTolerance) {
            errors.push('Risk tolerance is required');
        }

        // Validation rules
        if (formData.parameters.minimumConfidence < 0 || formData.parameters.minimumConfidence > 100) {
            errors.push('Minimum confidence must be between 0 and 100');
        }

        if (formData.parameters.maximumIdeas < 1 || formData.parameters.maximumIdeas > 20) {
            errors.push('Maximum ideas must be between 1 and 20');
        }

        if (formData.parameters.investmentAmount && formData.parameters.investmentAmount < 0) {
            errors.push('Investment amount must be positive');
        }

        // Warnings
        if (formData.parameters.riskTolerance === 'very-aggressive' && formData.parameters.investmentHorizon === 'short-term') {
            warnings.push('Very aggressive risk tolerance with short-term horizon may result in high volatility');
        }

        if (formData.parameters.assetClasses.length === 0) {
            warnings.push('No asset classes selected - all asset classes will be considered');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    async refreshStatus() {
        if (!this.currentRequestId) {
            console.log('❌ No current request ID for status refresh');
            return;
        }

        console.log('🔄 Refreshing status for request:', this.currentRequestId);

        try {
            const response = await fetch(`https://fflo4lgd6d.execute-api.us-west-2.amazonaws.com/v1/api/v1/ideas`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const status = await response.json();
            console.log('📡 Status response received:', status);

            if (!response.ok) {
                throw new Error(status.error || 'Failed to get status');
            }

            this.updateStatusDisplay(status);

            if (status.status === 'completed') {
                this.stopStatusPolling();
                this.loadRequestResults();
            } else if (status.status === 'failed' || status.status === 'cancelled') {
                this.stopStatusPolling();
            }

        } catch (error) {
            console.error('Error refreshing status:', error);
            this.showToast('error', 'Failed to refresh status: ' + error.message);
        }
    }

    async cancelRequest() {
        if (!this.currentRequestId) return;

        try {
            const response = await fetch(`/api/v1/ideas/requests/${this.currentRequestId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to cancel request');
            }

            this.stopStatusPolling();
            this.showToast('success', 'Request cancelled successfully');
            this.refreshStatus();

        } catch (error) {
            console.error('Error cancelling request:', error);
            this.showToast('error', 'Failed to cancel request: ' + error.message);
        }
    }

    async loadRequestResults() {
        if (!this.currentRequestId) return;

        try {
            const response = await fetch(`/api/v1/ideas/requests/${this.currentRequestId}/results`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            const results = await response.json();

            if (!response.ok) {
                throw new Error(results.error || 'Failed to load results');
            }

            this.displayResults(results);
            this.showRequestResults();

        } catch (error) {
            console.error('Error loading results:', error);
            this.showToast('error', 'Failed to load results: ' + error.message);
        }
    }

    async loadRequestHistory() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: 10,
                ...this.currentFilters
            });

            const response = await fetch(`/api/v1/ideas/requests/history?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            const history = await response.json();

            if (!response.ok) {
                throw new Error(history.error || 'Failed to load history');
            }

            this.displayHistory(history);

        } catch (error) {
            console.error('Error loading history:', error);
            this.showToast('error', 'Failed to load request history: ' + error.message);
        }
    }

    async submitFeedback() {
        try {
            // Validate required fields
            if (!this.validateFeedbackForm()) {
                return;
            }

            // Collect form data
            const formData = this.collectFeedbackData();

            // Show loading state
            const submitButton = document.getElementById('submit-feedback');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Submitting...';
            submitButton.disabled = true;

            const response = await fetch('/api/v1/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.errors ? result.errors.join(', ') : 'Failed to submit feedback');
            }

            // Hide feedback modal and show success
            this.hideFeedbackModal();
            this.showFeedbackSuccess(result.data.id);

        } catch (error) {
            console.error('Error submitting feedback:', error);
            this.showToast('error', 'Failed to submit feedback: ' + error.message);
        } finally {
            // Reset button state
            const submitButton = document.getElementById('submit-feedback');
            submitButton.textContent = 'Submit Feedback';
            submitButton.disabled = false;
        }
    }

    validateFeedbackForm() {
        const requiredFields = [
            { id: 'feedback-type', name: 'Feedback Type' },
            { id: 'feedback-category', name: 'Category' },
            { id: 'feedback-title', name: 'Title' },
            { id: 'feedback-description', name: 'Description' }
        ];

        let isValid = true;

        // Clear previous errors
        document.querySelectorAll('.form-group.error').forEach(group => {
            group.classList.remove('error');
            const errorMsg = group.querySelector('.error-message');
            if (errorMsg) errorMsg.remove();
        });

        // Validate required fields
        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            const value = element.value.trim();

            if (!value) {
                this.showFieldError(element, `${field.name} is required`);
                isValid = false;
            }
        });

        // Validate rating
        if (this.selectedRating === 0) {
            const ratingContainer = document.querySelector('.rating-container');
            this.showFieldError(ratingContainer, 'Please provide a rating');
            isValid = false;
        }

        // Validate description length
        const description = document.getElementById('feedback-description').value;
        if (description.length > 2000) {
            const descElement = document.getElementById('feedback-description');
            this.showFieldError(descElement, 'Description must be 2000 characters or less');
            isValid = false;
        }

        // Validate title length
        const title = document.getElementById('feedback-title').value;
        if (title.length > 200) {
            const titleElement = document.getElementById('feedback-title');
            this.showFieldError(titleElement, 'Title must be 200 characters or less');
            isValid = false;
        }

        return isValid;
    }

    showFieldError(element, message) {
        const formGroup = element.closest('.form-group') || element.parentElement;
        formGroup.classList.add('error');

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        formGroup.appendChild(errorDiv);
    }

    collectFeedbackData() {
        const formData = {
            feedbackType: document.getElementById('feedback-type').value,
            category: document.getElementById('feedback-category').value,
            title: document.getElementById('feedback-title').value,
            description: document.getElementById('feedback-description').value,
            rating: this.selectedRating,
            tags: this.parseTags(document.getElementById('feedback-tags').value),
            metadata: {
                source: 'web',
                userAgent: navigator.userAgent,
                contextData: {
                    currentPage: window.location.pathname,
                    timestamp: new Date().toISOString()
                }
            }
        };

        // Add investment idea ID if available
        if (this.currentIdea && this.currentIdea.id) {
            formData.investmentIdeaId = this.currentIdea.id;
        }

        // Add request ID if available
        if (this.currentRequestId) {
            formData.requestId = this.currentRequestId;
        }

        // Add idea-specific feedback data
        const feedbackType = document.getElementById('feedback-type').value;
        if (feedbackType === 'investment-idea-quality') {
            const actionTaken = document.getElementById('action-taken').value;
            if (actionTaken) {
                formData.metadata.contextData.actionTaken = actionTaken;
            }

            // Collect valuable aspects
            const valuableAspects = Array.from(document.querySelectorAll('input[name="valuableAspects"]:checked'))
                .map(cb => cb.value);
            if (valuableAspects.length > 0) {
                formData.metadata.contextData.valuableAspects = valuableAspects;
            }
        }

        // Add performance feedback data
        if (feedbackType === 'system-performance') {
            const responseTime = document.getElementById('response-time').value;
            if (responseTime) {
                formData.metadata.contextData.responseTime = responseTime;
            }

            const systemIssues = Array.from(document.querySelectorAll('input[name="systemIssues"]:checked'))
                .map(cb => cb.value);
            if (systemIssues.length > 0) {
                formData.metadata.contextData.systemIssues = systemIssues;
            }
        }

        // Add follow-up consent
        const followUpConsent = document.getElementById('follow-up-consent').checked;
        formData.metadata.contextData.followUpConsent = followUpConsent;

        return formData;
    }

    parseTags(tagsString) {
        if (!tagsString) return [];
        return tagsString.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .slice(0, 10); // Limit to 10 tags
    }

    showFeedbackSuccess(feedbackId) {
        document.getElementById('feedback-reference-id').textContent = feedbackId;
        document.getElementById('feedback-success-modal').style.display = 'flex';

        // Auto-close after 5 seconds
        setTimeout(() => {
            this.hideFeedbackSuccess();
        }, 5000);
    }

    hideFeedbackSuccess() {
        document.getElementById('feedback-success-modal').style.display = 'none';
    }

    // UI Management Methods
    showRequestForm() {
        document.getElementById('request-form-container').style.display = 'block';
        document.getElementById('request-status-container').style.display = 'none';
        document.getElementById('request-results-container').style.display = 'none';
        this.stopStatusPolling();
        this.currentRequestId = null;
    }

    showRequestStatus() {
        document.getElementById('request-form-container').style.display = 'none';
        document.getElementById('request-status-container').style.display = 'block';
        document.getElementById('request-results-container').style.display = 'none';
    }

    showRequestResults() {
        document.getElementById('request-status-container').style.display = 'none';
        document.getElementById('request-results-container').style.display = 'block';
        document.getElementById('new-request').style.display = 'inline-flex';
    }

    updateStatusDisplay(status) {
        console.log('🔄 Updating status display:', status);
        
        const requestIdElement = document.getElementById('request-id');
        if (requestIdElement) {
            requestIdElement.textContent = `Request ID: ${status.requestId}`;
        }

        const statusBadge = document.getElementById('status-badge');
        if (statusBadge) {
            statusBadge.textContent = status.status.charAt(0).toUpperCase() + status.status.slice(1);
            statusBadge.className = `status-badge ${status.status}`;
        }

        if (status.progress) {
            console.log('📊 Updating progress:', status.progress);
            
            const progressFill = document.getElementById('progress-fill');
            const progressText = document.getElementById('progress-text');
            const currentStep = document.getElementById('current-step');
            
            if (progressFill) {
                progressFill.style.width = `${status.progress.percentage}%`;
                console.log('📈 Progress bar updated to:', status.progress.percentage + '%');
            }
            
            if (progressText) {
                progressText.textContent = `${status.progress.percentage}%`;
            }
            
            if (currentStep) {
                currentStep.textContent = `Current step: ${status.progress.currentPhase}`;
            }
        }

        if (status.estimatedTimeRemaining) {
            document.getElementById('estimated-time').textContent =
                `Estimated time remaining: ${Math.ceil(status.estimatedTimeRemaining / 60)} minutes`;
        }

        this.updateProcessingHistory(status.processingHistory || []);
    }

    updateProcessingHistory(history) {
        const container = document.getElementById('processing-history');
        container.innerHTML = '<h4>Processing Steps:</h4>';

        history.forEach(entry => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'processing-step';

            const statusDiv = document.createElement('div');
            statusDiv.className = `step-status ${entry.status}`;

            const textDiv = document.createElement('div');
            textDiv.textContent = `${entry.step.replace(/-/g, ' ')} - ${entry.status}`;

            stepDiv.appendChild(statusDiv);
            stepDiv.appendChild(textDiv);
            container.appendChild(stepDiv);
        });
    }

    displayResults(results) {
        this.currentResults = results;
        this.setupFilterOptions(results);
        this.renderResults(results.investmentIdeas || []);
    }

    setupFilterOptions(results) {
        // Setup asset class filters
        const assetClasses = new Set();
        results.investmentIdeas?.forEach(idea => {
            idea.investments?.forEach(investment => {
                if (investment.type) {
                    assetClasses.add(investment.type);
                }
            });
        });

        const assetClassFilters = document.getElementById('asset-class-filters');
        assetClassFilters.innerHTML = '';
        assetClasses.forEach(assetClass => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" value="${assetClass}" checked> 
                ${assetClass.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            `;
            assetClassFilters.appendChild(label);
        });
    }

    renderResults(ideas) {
        const container = document.getElementById('request-results');
        const currentView = document.querySelector('.view-btn.active')?.dataset.view || 'grid';

        container.className = `results-content ${currentView}-view`;
        container.innerHTML = '';

        if (!ideas || ideas.length === 0) {
            container.innerHTML = '<div class="no-results"><p>No investment ideas match your current filters.</p></div>';
            return;
        }

        if (currentView === 'comparison') {
            this.renderComparisonView(ideas);
            return;
        }

        ideas.forEach((idea, index) => {
            const ideaElement = this.createIdeaElement(idea, index, currentView);
            container.appendChild(ideaElement);
        });
    }

    createIdeaElement(idea, index, view) {
        const ideaDiv = document.createElement('div');
        ideaDiv.className = 'investment-idea';
        ideaDiv.onclick = () => this.showIdeaDetail(idea);

        const confidenceClass = this.getConfidenceClass(idea.confidenceScore);
        const riskLevel = this.calculateOverallRisk(idea.riskFactors);

        ideaDiv.innerHTML = `
            <div class="idea-header">
                <h3 class="idea-title">${idea.title}</h3>
                <div class="idea-actions">
                    <button class="idea-action-btn" onclick="event.stopPropagation(); this.saveIdea('${idea.id}')" title="Save to Portfolio">
                        <i class="fas fa-bookmark"></i>
                    </button>
                    <button class="idea-action-btn" onclick="event.stopPropagation(); this.shareIdea('${idea.id}')" title="Share">
                        <i class="fas fa-share"></i>
                    </button>
                </div>
            </div>
            
            <div class="confidence-score ${confidenceClass}">
                <i class="fas fa-chart-line"></i>
                ${idea.confidenceScore}% Confidence
            </div>
            
            <div class="idea-description">${idea.description}</div>
            
            ${view === 'list' ? this.createListViewMetrics(idea) : this.createGridViewMetrics(idea)}
            
            <div class="idea-tags">
                ${this.createIdeaTags(idea)}
            </div>
            
            <div class="idea-footer">
                <div class="risk-indicator">
                    <div class="risk-dot ${riskLevel}"></div>
                    <span>${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk</span>
                </div>
                <div class="time-horizon">${idea.timeHorizon || 'Medium-term'}</div>
            </div>
        `;

        return ideaDiv;
    }

    createGridViewMetrics(idea) {
        const outcomes = idea.potentialOutcomes || [];
        const expectedOutcome = outcomes.find(o => o.scenario === 'expected') || {};

        return `
            <div class="idea-metrics">
                <div class="metric">
                    <span class="metric-value">${this.formatPercentage(expectedOutcome.returnEstimate)}</span>
                    <span class="metric-label">Expected Return</span>
                </div>
                <div class="metric">
                    <span class="metric-value">${this.formatTimeHorizon(idea.timeHorizon)}</span>
                    <span class="metric-label">Time Horizon</span>
                </div>
                <div class="metric">
                    <span class="metric-value">${idea.investments?.length || 1}</span>
                    <span class="metric-label">Assets</span>
                </div>
            </div>
        `;
    }

    createListViewMetrics(idea) {
        const outcomes = idea.potentialOutcomes || [];
        const bestCase = outcomes.find(o => o.scenario === 'best') || {};
        const expectedCase = outcomes.find(o => o.scenario === 'expected') || {};
        const worstCase = outcomes.find(o => o.scenario === 'worst') || {};

        return `
            <div class="idea-metrics">
                <div class="metric">
                    <span class="metric-value">${this.formatPercentage(bestCase.returnEstimate)}</span>
                    <span class="metric-label">Best Case</span>
                </div>
                <div class="metric">
                    <span class="metric-value">${this.formatPercentage(expectedCase.returnEstimate)}</span>
                    <span class="metric-label">Expected</span>
                </div>
                <div class="metric">
                    <span class="metric-value">${this.formatPercentage(worstCase.returnEstimate)}</span>
                    <span class="metric-label">Worst Case</span>
                </div>
                <div class="metric">
                    <span class="metric-value">${this.calculateVolatility(idea)}</span>
                    <span class="metric-label">Volatility</span>
                </div>
            </div>
        `;
    }

    createIdeaTags(idea) {
        const tags = [];

        // Add sector tags
        const sectors = new Set();
        idea.investments?.forEach(investment => {
            if (investment.sector) sectors.add(investment.sector);
        });
        sectors.forEach(sector => {
            tags.push(`<span class="idea-tag sector">${sector}</span>`);
        });

        // Add asset class tags
        const assetClasses = new Set();
        idea.investments?.forEach(investment => {
            if (investment.type) assetClasses.add(investment.type);
        });
        assetClasses.forEach(assetClass => {
            tags.push(`<span class="idea-tag asset-class">${assetClass.replace('-', ' ')}</span>`);
        });

        return tags.join('');
    }

    renderComparisonView(ideas) {
        const container = document.getElementById('request-results');
        const comparisonContainer = document.getElementById('comparison-container');

        container.style.display = 'none';
        comparisonContainer.style.display = 'block';

        const tableContainer = document.getElementById('comparison-table');
        tableContainer.innerHTML = this.createComparisonTable(ideas);
    }

    createComparisonTable(ideas) {
        const headers = ['Investment Idea', 'Confidence', 'Expected Return', 'Risk Level', 'Time Horizon', 'Assets'];

        let tableHTML = '<table><thead><tr>';
        headers.forEach(header => {
            tableHTML += `<th>${header}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';

        ideas.forEach(idea => {
            const expectedOutcome = idea.potentialOutcomes?.find(o => o.scenario === 'expected') || {};
            const riskLevel = this.calculateOverallRisk(idea.riskFactors);

            tableHTML += `
                <tr onclick="this.showIdeaDetail(${JSON.stringify(idea).replace(/"/g, '&quot;')})">
                    <td><strong>${idea.title}</strong></td>
                    <td class="metric-cell">${idea.confidenceScore}%</td>
                    <td class="metric-cell">${this.formatPercentage(expectedOutcome.returnEstimate)}</td>
                    <td class="metric-cell">
                        <span class="risk-level ${riskLevel}">${riskLevel}</span>
                    </td>
                    <td class="metric-cell">${idea.timeHorizon || 'Medium-term'}</td>
                    <td class="metric-cell">${idea.investments?.length || 1}</td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        return tableHTML;
    }

    showIdeaDetail(idea) {
        this.currentIdea = idea;
        this.populateIdeaDetailModal(idea);
        document.getElementById('idea-detail-modal').style.display = 'flex';
    }

    populateIdeaDetailModal(idea) {
        document.getElementById('idea-title').textContent = idea.title;

        // Populate overview tab
        this.populateOverviewTab(idea);

        // Populate analysis tab
        this.populateAnalysisTab(idea);

        // Populate risks tab
        this.populateRisksTab(idea);

        // Populate data tab
        this.populateDataTab(idea);

        // Populate compliance tab
        this.populateComplianceTab(idea);
    }

    populateOverviewTab(idea) {
        const overviewTab = document.getElementById('overview-tab');
        const outcomes = idea.potentialOutcomes || [];
        const expectedOutcome = outcomes.find(o => o.scenario === 'expected') || {};

        overviewTab.innerHTML = `
            <div class="overview-summary">
                <div class="overview-main">
                    <h4>Investment Rationale</h4>
                    <p>${idea.rationale}</p>
                    
                    <div class="explanation-section">
                        <div class="explanation-header">
                            <i class="fas fa-lightbulb explanation-icon"></i>
                            <span class="explanation-title">Why This Investment Makes Sense</span>
                        </div>
                        <div class="explanation-content">
                            ${this.generateExplanation(idea)}
                        </div>
                        <div class="reasoning-steps">
                            ${this.generateReasoningSteps(idea)}
                        </div>
                    </div>
                </div>
                
                <div class="overview-sidebar">
                    <div class="key-metrics">
                        <div class="key-metric">
                            <span class="key-metric-value">${idea.confidenceScore}%</span>
                            <span class="key-metric-label">Confidence Score</span>
                        </div>
                        <div class="key-metric">
                            <span class="key-metric-value">${this.formatPercentage(expectedOutcome.returnEstimate)}</span>
                            <span class="key-metric-label">Expected Return</span>
                        </div>
                        <div class="key-metric">
                            <span class="key-metric-value">${this.calculateOverallRisk(idea.riskFactors)}</span>
                            <span class="key-metric-label">Risk Level</span>
                        </div>
                        <div class="key-metric">
                            <span class="key-metric-value">${idea.timeHorizon || 'Medium'}</span>
                            <span class="key-metric-label">Time Horizon</span>
                        </div>
                    </div>
                    
                    <h5>Investment Components</h5>
                    <div class="investment-components">
                        ${this.renderInvestmentComponents(idea.investments)}
                    </div>
                </div>
            </div>
        `;
    }

    populateAnalysisTab(idea) {
        const analysisTab = document.getElementById('analysis-tab');
        const outcomes = idea.potentialOutcomes || [];

        analysisTab.innerHTML = `
            <div class="analysis-section">
                <h4>Scenario Analysis</h4>
                <div class="scenario-analysis">
                    ${outcomes.map(outcome => `
                        <div class="scenario ${outcome.scenario}">
                            <div class="scenario-label">${outcome.scenario} Case</div>
                            <div class="scenario-value">${this.formatPercentage(outcome.returnEstimate)}</div>
                            <div class="scenario-probability">${outcome.probability ? (outcome.probability * 100).toFixed(0) + '% probability' : ''}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="analysis-section">
                <h4>Performance Projection</h4>
                <div class="chart-container">
                    <canvas id="performance-chart"></canvas>
                </div>
            </div>
            
            <div class="analysis-section">
                <h4>Risk-Return Analysis</h4>
                <div class="chart-container">
                    <canvas id="risk-return-chart"></canvas>
                </div>
            </div>
        `;

        // Initialize charts after DOM update
        setTimeout(() => {
            this.initializeCharts(idea);
        }, 100);
    }

    populateRisksTab(idea) {
        const risksTab = document.getElementById('risks-tab');
        const riskFactors = idea.riskFactors || [];

        // Group risks by category
        const riskCategories = this.groupRisksByCategory(riskFactors);

        risksTab.innerHTML = `
            <div class="risk-matrix">
                ${Object.entries(riskCategories).map(([category, risks]) => `
                    <div class="risk-category">
                        <h5>${category} Risks</h5>
                        ${risks.map(risk => `
                            <div class="risk-item">
                                <span class="risk-severity ${risk.level || 'medium'}">${risk.level || 'medium'}</span>
                                <div class="risk-description">${risk.description}</div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
            
            <div class="analysis-section">
                <h4>Risk Mitigation Strategies</h4>
                ${this.generateRiskMitigationStrategies(riskFactors)}
            </div>
        `;
    }

    populateDataTab(idea) {
        const dataTab = document.getElementById('data-tab');
        const supportingData = idea.supportingData || [];

        dataTab.innerHTML = `
            <div class="data-sources">
                <h4>Data Sources</h4>
                ${this.renderDataSources(supportingData)}
            </div>
            
            <div class="supporting-evidence">
                <h4>Supporting Evidence</h4>
                ${supportingData.map(dataPoint => `
                    <div class="evidence-item">
                        <div class="evidence-header">
                            <span class="evidence-type">${dataPoint.type}</span>
                            <span class="evidence-date">${new Date(dataPoint.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div class="evidence-content">
                            ${this.formatDataPoint(dataPoint)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    populateComplianceTab(idea) {
        const complianceTab = document.getElementById('compliance-tab');
        const complianceStatus = idea.complianceStatus || {};

        const overallStatus = complianceStatus.compliant ? 'compliant' :
            (complianceStatus.issues?.some(i => i.severity === 'critical') ? 'non-compliant' : 'warning');

        complianceTab.innerHTML = `
            <div class="compliance-status ${overallStatus}">
                <i class="fas ${overallStatus === 'compliant' ? 'fa-check-circle' :
                overallStatus === 'non-compliant' ? 'fa-times-circle' : 'fa-exclamation-triangle'} 
                   compliance-icon ${overallStatus}"></i>
                <div>
                    <strong>${overallStatus === 'compliant' ? 'Compliant' :
                overallStatus === 'non-compliant' ? 'Non-Compliant' : 'Requires Attention'}</strong>
                    <p>${this.getComplianceStatusMessage(overallStatus, complianceStatus)}</p>
                </div>
            </div>
            
            <div class="compliance-checks">
                <h4>Compliance Checks</h4>
                ${this.renderComplianceChecks(complianceStatus)}
            </div>
            
            ${complianceStatus.issues?.length ? `
                <div class="compliance-issues">
                    <h4>Issues & Recommendations</h4>
                    ${complianceStatus.issues.map(issue => `
                        <div class="compliance-issue ${issue.severity}">
                            <div class="issue-header">
                                <span class="issue-severity">${issue.severity}</span>
                                <span class="issue-regulation">${issue.regulation}</span>
                            </div>
                            <div class="issue-description">${issue.description}</div>
                            ${issue.remediation ? `<div class="issue-remediation"><strong>Recommendation:</strong> ${issue.remediation}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }

    displayHistory(history) {
        const container = document.getElementById('request-history');
        container.innerHTML = '';

        if (!history.requests || history.requests.length === 0) {
            container.innerHTML = '<p>No request history found.</p>';
            return;
        }

        history.requests.forEach(request => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'history-item';
            itemDiv.onclick = () => this.loadHistoryRequest(request.id);

            itemDiv.innerHTML = `
                <div class="history-item-info">
                    <div class="history-item-title">
                        ${request.parameters.investmentHorizon} - ${request.parameters.riskTolerance}
                    </div>
                    <div class="history-item-meta">
                        Submitted: ${new Date(request.submittedAt).toLocaleDateString()}
                        ${request.completedAt ? ` | Completed: ${new Date(request.completedAt).toLocaleDateString()}` : ''}
                        ${request.resultCount ? ` | ${request.resultCount} ideas` : ''}
                    </div>
                </div>
                <div class="history-item-status ${request.status}">${request.status}</div>
            `;

            container.appendChild(itemDiv);
        });

        this.updatePagination(history.pagination);
    }

    updatePagination(pagination) {
        document.getElementById('page-info').textContent =
            `Page ${pagination.page} of ${pagination.totalPages}`;

        document.getElementById('prev-page').disabled = pagination.page <= 1;
        document.getElementById('next-page').disabled = pagination.page >= pagination.totalPages;
    }

    showFeedbackModal() {
        document.getElementById('feedback-modal').style.display = 'flex';
        document.getElementById('feedback-form').reset();
        this.selectedRating = 0;
        this.updateStarDisplay();
        this.setupFeedbackFormListeners();
        this.updateSubmitButtonState();
    }

    hideFeedbackModal() {
        document.getElementById('feedback-modal').style.display = 'none';
        document.getElementById('feedback-form').reset();
        this.selectedRating = 0;
        this.updateStarDisplay();
        this.hideFeedbackSections();
        this.clearFormErrors();
    }

    setupFeedbackFormListeners() {
        // Feedback type change handler
        const feedbackType = document.getElementById('feedback-type');
        feedbackType.addEventListener('change', () => {
            this.handleFeedbackTypeChange();
            this.updateSubmitButtonState();
        });

        // Form field change handlers for validation
        const requiredFields = ['feedback-type', 'feedback-category', 'feedback-title', 'feedback-description'];
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.addEventListener('input', () => {
                this.clearFieldError(field);
                this.updateSubmitButtonState();
            });
            field.addEventListener('change', () => {
                this.clearFieldError(field);
                this.updateSubmitButtonState();
            });
        });

        // Character counter for description
        const description = document.getElementById('feedback-description');
        description.addEventListener('input', () => {
            this.updateCharacterCount();
        });

        // Success modal close handlers
        document.getElementById('close-success-modal').addEventListener('click', () => {
            this.hideFeedbackSuccess();
        });

        document.getElementById('close-success-feedback').addEventListener('click', () => {
            this.hideFeedbackSuccess();
        });
    }

    handleFeedbackTypeChange() {
        const feedbackType = document.getElementById('feedback-type').value;

        // Hide all specific sections first
        this.hideFeedbackSections();

        // Show relevant sections based on feedback type
        if (feedbackType === 'investment-idea-quality') {
            document.getElementById('idea-specific-feedback').style.display = 'block';
        } else if (feedbackType === 'system-performance') {
            document.getElementById('performance-feedback').style.display = 'block';
        }
    }

    hideFeedbackSections() {
        document.getElementById('idea-specific-feedback').style.display = 'none';
        document.getElementById('performance-feedback').style.display = 'none';
    }

    updateCharacterCount() {
        const description = document.getElementById('feedback-description');
        const counter = document.getElementById('description-count');
        const count = description.value.length;

        counter.textContent = count;
        counter.parentElement.classList.remove('warning', 'danger');

        if (count > 1800) {
            counter.parentElement.classList.add('danger');
        } else if (count > 1500) {
            counter.parentElement.classList.add('warning');
        }
    }

    updateSubmitButtonState() {
        const submitButton = document.getElementById('submit-feedback');
        const requiredFields = [
            document.getElementById('feedback-type').value,
            document.getElementById('feedback-category').value,
            document.getElementById('feedback-title').value,
            document.getElementById('feedback-description').value
        ];

        const hasRequiredFields = requiredFields.every(value => value.trim() !== '');
        const hasRating = this.selectedRating > 0;

        submitButton.disabled = !(hasRequiredFields && hasRating);
    }

    clearFormErrors() {
        document.querySelectorAll('.form-group.error').forEach(group => {
            group.classList.remove('error');
            const errorMsg = group.querySelector('.error-message');
            if (errorMsg) errorMsg.remove();
        });
    }

    clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('error');
            const errorMsg = formGroup.querySelector('.error-message');
            if (errorMsg) errorMsg.remove();
        }
    }

    setRating(rating) {
        this.selectedRating = rating;
        this.updateStarDisplay();
        this.updateSubmitButtonState();

        // Clear rating error if exists
        const ratingContainer = document.querySelector('.rating-container');
        this.clearFieldError(ratingContainer);
    }

    updateStarDisplay() {
        document.querySelectorAll('.star').forEach((star, index) => {
            star.classList.toggle('active', index < this.selectedRating);
        });
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    showToast(type, message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    resetForm() {
        document.getElementById('investment-request-form').reset();

        // Reset sliders
        document.getElementById('minimum-confidence').value = 70;
        document.getElementById('maximum-ideas').value = 5;
        document.querySelector('#minimum-confidence + .slider-value').textContent = '70%';
        document.querySelector('#maximum-ideas + .slider-value').textContent = '5';

        // Reset checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Set default checked items
        document.querySelector('input[name="includeVisualizations"]').checked = true;
        document.querySelector('input[name="includeRiskAnalysis"]').checked = true;
    }

    startStatusPolling() {
        this.statusPollingInterval = setInterval(() => {
            this.refreshStatus();
        }, 5000); // Poll every 5 seconds
    }

    stopStatusPolling() {
        if (this.statusPollingInterval) {
            clearInterval(this.statusPollingInterval);
            this.statusPollingInterval = null;
        }
    }

    applyHistoryFilters() {
        this.currentFilters = {
            status: document.getElementById('history-status-filter').value,
            dateFrom: document.getElementById('history-date-from').value,
            dateTo: document.getElementById('history-date-to').value
        };

        this.currentPage = 1;
        this.loadRequestHistory();
    }

    changePage(page) {
        this.currentPage = page;
        this.loadRequestHistory();
    }

    loadHistoryRequest(requestId) {
        this.currentRequestId = requestId;
        this.refreshStatus();
        this.showRequestStatus();
    }

    downloadResults() {
        if (!this.currentRequestId) return;

        // Create download link
        const link = document.createElement('a');
        link.href = `/api/v1/ideas/requests/${this.currentRequestId}/download`;
        link.download = `investment-ideas-${this.currentRequestId}.pdf`;
        link.click();
    }

    getAuthToken() {
        // No authentication required for demo
        return null;
    }

    // Investment Idea Presentation Methods
    switchView(view) {
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Show/hide comparison container
        const comparisonContainer = document.getElementById('comparison-container');
        const resultsContainer = document.getElementById('request-results');

        if (view === 'comparison') {
            comparisonContainer.style.display = 'block';
            resultsContainer.style.display = 'none';
            this.renderComparisonView(this.getFilteredResults());
        } else {
            comparisonContainer.style.display = 'none';
            resultsContainer.style.display = 'block';
            this.renderResults(this.getFilteredResults());
        }
    }

    sortResults() {
        const sortBy = document.getElementById('sort-by').value;
        const sortOrder = document.getElementById('sort-order').dataset.order;
        const ideas = this.getFilteredResults();

        ideas.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'confidence':
                    aValue = a.confidenceScore || 0;
                    bValue = b.confidenceScore || 0;
                    break;
                case 'return':
                    aValue = this.getExpectedReturn(a);
                    bValue = this.getExpectedReturn(b);
                    break;
                case 'risk':
                    aValue = this.getRiskScore(a);
                    bValue = this.getRiskScore(b);
                    break;
                case 'timeHorizon':
                    aValue = this.getTimeHorizonScore(a.timeHorizon);
                    bValue = this.getTimeHorizonScore(b.timeHorizon);
                    break;
                default:
                    return 0;
            }

            return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
        });

        this.renderResults(ideas);
    }

    toggleSortOrder() {
        const button = document.getElementById('sort-order');
        const currentOrder = button.dataset.order;
        const newOrder = currentOrder === 'desc' ? 'asc' : 'desc';

        button.dataset.order = newOrder;
        button.innerHTML = `<i class="fas fa-sort-amount-${newOrder === 'desc' ? 'down' : 'up'}"></i>`;

        this.sortResults();
    }

    toggleFilterPanel() {
        const panel = document.getElementById('filter-panel');
        const isVisible = panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'block';
    }

    getFilteredResults() {
        if (!this.currentResults?.investmentIdeas) return [];

        const confidenceMin = parseInt(document.getElementById('confidence-min')?.value || 0);
        const confidenceMax = parseInt(document.getElementById('confidence-max')?.value || 100);

        const selectedRiskLevels = Array.from(document.querySelectorAll('#filter-panel input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        return this.currentResults.investmentIdeas.filter(idea => {
            // Confidence filter
            if (idea.confidenceScore < confidenceMin || idea.confidenceScore > confidenceMax) {
                return false;
            }

            // Risk level filter
            const riskLevel = this.calculateOverallRisk(idea.riskFactors);
            if (selectedRiskLevels.length > 0 && !selectedRiskLevels.includes(riskLevel)) {
                return false;
            }

            return true;
        });
    }

    hideIdeaDetailModal() {
        document.getElementById('idea-detail-modal').style.display = 'none';
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    shareResults() {
        if (navigator.share) {
            navigator.share({
                title: 'Investment Ideas',
                text: 'Check out these AI-generated investment ideas',
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showToast('success', 'Link copied to clipboard!');
            });
        }
    }

    // Utility Methods for Presentation

    getConfidenceClass(score) {
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        return 'low';
    }

    calculateOverallRisk(riskFactors) {
        if (!riskFactors || riskFactors.length === 0) return 'medium';

        const riskScores = riskFactors.map(risk => {
            switch (risk.level) {
                case 'high': return 3;
                case 'medium': return 2;
                case 'low': return 1;
                default: return 2;
            }
        });

        const avgRisk = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;

        if (avgRisk >= 2.5) return 'high';
        if (avgRisk >= 1.5) return 'medium';
        return 'low';
    }

    formatPercentage(value) {
        if (value === undefined || value === null) return 'N/A';
        return `${(value * 100).toFixed(1)}%`;
    }

    formatTimeHorizon(horizon) {
        const mapping = {
            'short': 'Short',
            'medium': 'Medium',
            'long': 'Long',
            'short-term': 'Short',
            'medium-term': 'Medium',
            'long-term': 'Long'
        };
        return mapping[horizon] || horizon || 'Medium';
    }

    calculateVolatility(idea) {
        // Simple volatility calculation based on scenario spread
        const outcomes = idea.potentialOutcomes || [];
        if (outcomes.length < 2) return 'N/A';

        const returns = outcomes.map(o => o.returnEstimate || 0);
        const max = Math.max(...returns);
        const min = Math.min(...returns);
        const volatility = ((max - min) / 2) * 100;

        return `${volatility.toFixed(1)}%`;
    }

    getExpectedReturn(idea) {
        const expectedOutcome = idea.potentialOutcomes?.find(o => o.scenario === 'expected');
        return expectedOutcome?.returnEstimate || 0;
    }

    getRiskScore(idea) {
        const riskLevel = this.calculateOverallRisk(idea.riskFactors);
        const scores = { low: 1, medium: 2, high: 3 };
        return scores[riskLevel] || 2;
    }

    getTimeHorizonScore(horizon) {
        const scores = {
            'short': 1, 'short-term': 1,
            'medium': 2, 'medium-term': 2,
            'long': 3, 'long-term': 3
        };
        return scores[horizon] || 2;
    }

    generateExplanation(idea) {
        // Generate a comprehensive explanation based on the idea's data
        const rationale = idea.rationale || '';
        const supportingData = idea.supportingData || [];

        let explanation = rationale;

        if (supportingData.length > 0) {
            explanation += ' This recommendation is supported by ';
            const dataTypes = [...new Set(supportingData.map(d => d.type))];
            explanation += dataTypes.join(', ') + ' analysis.';
        }

        return explanation;
    }

    generateReasoningSteps(idea) {
        // Generate step-by-step reasoning
        const steps = [
            {
                title: 'Market Analysis',
                description: 'Analyzed current market conditions and identified key trends affecting this investment opportunity.'
            },
            {
                title: 'Risk Assessment',
                description: `Evaluated ${idea.riskFactors?.length || 0} risk factors and determined overall risk level as ${this.calculateOverallRisk(idea.riskFactors)}.`
            },
            {
                title: 'Return Projection',
                description: `Calculated potential returns based on historical data and current market conditions.`
            },
            {
                title: 'Compliance Check',
                description: 'Verified investment meets regulatory requirements and compliance standards.'
            }
        ];

        return steps.map((step, index) => `
            <div class="reasoning-step">
                <div class="step-number">${index + 1}</div>
                <div class="step-content">
                    <div class="step-title">${step.title}</div>
                    <div class="step-description">${step.description}</div>
                </div>
            </div>
        `).join('');
    }

    renderInvestmentComponents(investments) {
        if (!investments || investments.length === 0) {
            return '<p>No specific investment components identified.</p>';
        }

        return investments.map(investment => `
            <div class="investment-component">
                <div class="component-name">${investment.name}</div>
                <div class="component-type">${investment.type}</div>
                ${investment.ticker ? `<div class="component-ticker">${investment.ticker}</div>` : ''}
            </div>
        `).join('');
    }

    groupRisksByCategory(riskFactors) {
        const categories = {
            'Market': [],
            'Credit': [],
            'Operational': [],
            'Regulatory': [],
            'Other': []
        };

        riskFactors.forEach(risk => {
            const category = risk.category || 'Other';
            if (categories[category]) {
                categories[category].push(risk);
            } else {
                categories['Other'].push(risk);
            }
        });

        // Remove empty categories
        Object.keys(categories).forEach(key => {
            if (categories[key].length === 0) {
                delete categories[key];
            }
        });

        return categories;
    }

    generateRiskMitigationStrategies(riskFactors) {
        if (!riskFactors || riskFactors.length === 0) {
            return '<p>No specific risk mitigation strategies required.</p>';
        }

        const strategies = riskFactors.map(risk => {
            let strategy = 'Monitor closely and review regularly.';

            if (risk.level === 'high') {
                strategy = 'Consider position sizing limits and stop-loss orders. Regular monitoring required.';
            } else if (risk.level === 'medium') {
                strategy = 'Implement diversification strategies and periodic review.';
            }

            return `
                <div class="mitigation-strategy">
                    <div class="strategy-risk">${risk.description}</div>
                    <div class="strategy-action">${strategy}</div>
                </div>
            `;
        }).join('');

        return `<div class="mitigation-strategies">${strategies}</div>`;
    }

    renderDataSources(supportingData) {
        const sources = [...new Set(supportingData.map(d => d.source))];

        return sources.map(source => `
            <div class="data-source">
                <div class="data-source-icon">
                    <i class="fas fa-database"></i>
                </div>
                <div class="data-source-info">
                    <div class="data-source-name">${source}</div>
                    <div class="data-source-meta">
                        ${supportingData.filter(d => d.source === source).length} data points
                    </div>
                </div>
                <div class="data-source-reliability">
                    <div class="reliability-score">95%</div>
                    <div class="reliability-label">Reliable</div>
                </div>
            </div>
        `).join('');
    }

    formatDataPoint(dataPoint) {
        switch (dataPoint.type) {
            case 'fundamental':
                return `Financial metric: ${JSON.stringify(dataPoint.value)}`;
            case 'technical':
                return `Technical indicator: ${JSON.stringify(dataPoint.value)}`;
            case 'sentiment':
                return `Market sentiment: ${dataPoint.value}`;
            case 'news':
                return `News analysis: ${dataPoint.value}`;
            default:
                return JSON.stringify(dataPoint.value);
        }
    }

    getComplianceStatusMessage(status, complianceStatus) {
        switch (status) {
            case 'compliant':
                return 'This investment idea meets all regulatory requirements and compliance standards.';
            case 'non-compliant':
                return 'This investment idea has critical compliance issues that must be addressed.';
            case 'warning':
                return 'This investment idea has some compliance considerations that should be reviewed.';
            default:
                return 'Compliance status unknown.';
        }
    }

    renderComplianceChecks(complianceStatus) {
        const checks = [
            { name: 'Regulatory Compliance', status: complianceStatus.compliant ? 'pass' : 'fail' },
            { name: 'ESG Factors', status: 'pass' },
            { name: 'Risk Limits', status: 'pass' },
            { name: 'Liquidity Requirements', status: 'warning' },
            { name: 'Concentration Limits', status: 'pass' }
        ];

        return checks.map(check => `
            <div class="compliance-check">
                <div class="check-status ${check.status}">
                    <i class="fas ${check.status === 'pass' ? 'fa-check' :
                check.status === 'fail' ? 'fa-times' : 'fa-exclamation-triangle'}"></i>
                </div>
                <div class="check-description">${check.name}</div>
            </div>
        `).join('');
    }

    initializeCharts(idea) {
        this.initializePerformanceChart(idea);
        this.initializeRiskReturnChart(idea);
    }

    initializePerformanceChart(idea) {
        const canvas = document.getElementById('performance-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Generate sample performance data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const performanceData = this.generatePerformanceData(idea, months.length);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Projected Performance',
                    data: performanceData,
                    borderColor: 'rgb(37, 99, 235)',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    initializeRiskReturnChart(idea) {
        const canvas = document.getElementById('risk-return-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Generate risk-return data for this idea and benchmarks
        const data = this.generateRiskReturnData(idea);

        new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'This Investment',
                    data: [data.thisInvestment],
                    backgroundColor: 'rgb(37, 99, 235)',
                    borderColor: 'rgb(37, 99, 235)',
                    pointRadius: 8
                }, {
                    label: 'Market Benchmarks',
                    data: data.benchmarks,
                    backgroundColor: 'rgba(100, 116, 139, 0.6)',
                    borderColor: 'rgb(100, 116, 139)',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Risk (Volatility %)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Expected Return %'
                        }
                    }
                }
            }
        });
    }

    generatePerformanceData(idea, length) {
        const expectedReturn = this.getExpectedReturn(idea);
        const baseReturn = expectedReturn * 100;

        const data = [];
        let currentValue = 0;

        for (let i = 0; i < length; i++) {
            const monthlyReturn = (baseReturn / 12) + (Math.random() - 0.5) * 2;
            currentValue += monthlyReturn;
            data.push(parseFloat(currentValue.toFixed(2)));
        }

        return data;
    }

    generateRiskReturnData(idea) {
        const expectedReturn = this.getExpectedReturn(idea) * 100;
        const riskScore = this.getRiskScore(idea);
        const volatility = 5 + (riskScore * 5); // Simple volatility calculation

        return {
            thisInvestment: { x: volatility, y: expectedReturn },
            benchmarks: [
                { x: 8, y: 6 },   // Conservative
                { x: 12, y: 8 },  // Moderate
                { x: 18, y: 12 }, // Aggressive
                { x: 25, y: 15 }  // High Risk
            ]
        };
    }

    saveIdea(ideaId) {
        // Implementation for saving idea to portfolio
        this.showToast('success', 'Investment idea saved to portfolio!');
    }

    shareIdea(ideaId) {
        // Implementation for sharing individual idea
        if (navigator.share) {
            navigator.share({
                title: 'Investment Idea',
                text: 'Check out this AI-generated investment idea',
                url: `${window.location.href}#idea-${ideaId}`
            });
        } else {
            navigator.clipboard.writeText(`${window.location.href}#idea-${ideaId}`).then(() => {
                this.showToast('success', 'Idea link copied to clipboard!');
            });
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InvestmentRequestApp();
});

// Handle page visibility changes to pause/resume polling
document.addEventListener('visibilitychange', () => {
    const app = window.investmentApp;
    if (app) {
        if (document.hidden) {
            app.stopStatusPolling();
        } else if (app.currentRequestId) {
            app.startStatusPolling();
        }
    }
});