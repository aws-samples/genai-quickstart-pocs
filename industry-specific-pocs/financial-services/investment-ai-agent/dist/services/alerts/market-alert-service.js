"use strict";
/**
 * Market data alert service implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketAlertService = void 0;
const uuid_1 = require("uuid");
/**
 * Market data alert service implementation
 */
class MarketAlertService {
    constructor() {
        this.alerts = new Map();
        this.alertHistory = new Map();
        this.notificationHandlers = new Map();
        // Register default notification handlers
        this.registerNotificationHandler('email', new EmailNotificationHandler());
        this.registerNotificationHandler('sms', new SmsNotificationHandler());
        this.registerNotificationHandler('push', new PushNotificationHandler());
        this.registerNotificationHandler('webhook', new WebhookNotificationHandler());
    } /**
  
     * Create a new market alert
     * @param alertConfig Alert configuration
     * @returns Created alert configuration
     */
    async createAlert(alertConfig) {
        // Generate ID and timestamps
        const id = (0, uuid_1.v4)();
        const now = new Date();
        // Create the alert
        const newAlert = {
            ...alertConfig,
            id,
            createdAt: now,
            updatedAt: now
        };
        // Store the alert
        this.alerts.set(id, newAlert);
        // Initialize alert history
        this.alertHistory.set(id, []);
        return newAlert;
    }
    /**
     * Update an existing market alert
     * @param alertId Alert ID
     * @param updates Alert updates
     * @returns Updated alert configuration
     */
    async updateAlert(alertId, updates) {
        // Get the existing alert
        const existingAlert = this.alerts.get(alertId);
        if (!existingAlert) {
            throw new Error(`Alert not found: ${alertId}`);
        }
        // Update the alert
        const updatedAlert = {
            ...existingAlert,
            ...updates,
            id: existingAlert.id,
            createdAt: existingAlert.createdAt,
            updatedAt: new Date() // Update the updated timestamp
        };
        // Store the updated alert
        this.alerts.set(alertId, updatedAlert);
        return updatedAlert;
    }
    /**
     * Delete a market alert
     * @param alertId Alert ID
     * @returns True if deletion was successful
     */
    async deleteAlert(alertId) {
        // Delete the alert and its history
        const alertDeleted = this.alerts.delete(alertId);
        this.alertHistory.delete(alertId);
        return alertDeleted;
    }
    /**
       * Get a market alert by ID
       * @param alertId Alert ID
       * @returns Alert configuration or null if not found
       */
    async getAlert(alertId) {
        return this.alerts.get(alertId) || null;
    }
    /**
     * List market alerts for a user
     * @param userId User ID
     * @returns List of alert configurations
     */
    async listAlerts(userId) {
        // Filter alerts by user ID
        return Array.from(this.alerts.values()).filter(alert => alert.userId === userId);
    }
    /**
     * Enable a market alert
     * @param alertId Alert ID
     * @returns Updated alert configuration
     */
    async enableAlert(alertId) {
        return this.updateAlert(alertId, { enabled: true });
    }
    /**
     * Disable a market alert
     * @param alertId Alert ID
     * @returns Updated alert configuration
     */
    async disableAlert(alertId) {
        return this.updateAlert(alertId, { enabled: false });
    }
    /**
     * Process a market data point and trigger alerts if conditions are met
     * @param dataPoint Market data point
     * @returns List of triggered alerts
     */
    async processDataPoint(dataPoint) {
        const triggeredAlerts = [];
        // Find alerts that match this data point
        const matchingAlerts = Array.from(this.alerts.values()).filter(alert => alert.enabled &&
            alert.symbol === dataPoint.symbol &&
            alert.dataType === dataPoint.dataType);
        // Check each alert
        for (const alert of matchingAlerts) {
            // Skip if in cooldown period
            if (this.isInCooldown(alert)) {
                continue;
            }
            // Check if condition is met
            const { conditionMet, value, comparisonValue } = this.checkCondition(alert, dataPoint);
            if (conditionMet) {
                // Create alert
                const marketAlert = await this.createMarketAlert(alert, dataPoint, value, comparisonValue);
                // Add to history
                const history = this.alertHistory.get(alert.id) || [];
                history.push(marketAlert);
                this.alertHistory.set(alert.id, history);
                // Update last triggered timestamp
                await this.updateAlert(alert.id, { lastTriggered: new Date() });
                // Send notifications
                await this.sendNotifications(alert, marketAlert);
                // Add to result
                triggeredAlerts.push(marketAlert);
            }
        }
        return triggeredAlerts;
    } /**
     
  * Register a notification handler
     * @param type Notification type
     * @param handler Notification handler
     */
    registerNotificationHandler(type, handler) {
        this.notificationHandlers.set(type, handler);
    }
    /**
     * Get alert history
     * @param alertId Alert ID
     * @returns List of triggered alerts
     */
    async getAlertHistory(alertId) {
        return this.alertHistory.get(alertId) || [];
    }
    // Private helper methods
    /**
     * Check if an alert is in cooldown period
     * @param alert Alert configuration
     * @returns True if in cooldown period
     */
    isInCooldown(alert) {
        if (!alert.lastTriggered || !alert.cooldownPeriod) {
            return false;
        }
        const now = new Date().getTime();
        const lastTriggered = alert.lastTriggered.getTime();
        return now - lastTriggered < alert.cooldownPeriod;
    }
    /**
     * Check if an alert condition is met
     * @param alert Alert configuration
     * @param dataPoint Market data point
     * @returns Condition check result
     */
    checkCondition(alert, dataPoint) {
        // Extract value from data point
        const value = this.extractValue(dataPoint);
        // Get comparison value
        const comparisonValue = this.getComparisonValue(alert, dataPoint);
        // Check condition
        let conditionMet = false;
        switch (alert.condition) {
            case 'greater-than':
                conditionMet = value > alert.threshold;
                break;
            case 'less-than':
                conditionMet = value < alert.threshold;
                break;
            case 'equal-to':
                conditionMet = Math.abs(value - alert.threshold) < 0.0001; // Approximate equality for floating point
                break;
            case 'percent-change-up':
                if (comparisonValue !== undefined) {
                    const percentChange = ((value - comparisonValue) / comparisonValue) * 100;
                    conditionMet = percentChange > alert.threshold;
                }
                break;
            case 'percent-change-down':
                if (comparisonValue !== undefined) {
                    const percentChange = ((value - comparisonValue) / comparisonValue) * 100;
                    conditionMet = percentChange < -alert.threshold;
                }
                break;
            case 'crosses-above':
                if (comparisonValue !== undefined) {
                    conditionMet = value > alert.threshold && comparisonValue <= alert.threshold;
                }
                break;
            case 'crosses-below':
                if (comparisonValue !== undefined) {
                    conditionMet = value < alert.threshold && comparisonValue >= alert.threshold;
                }
                break;
            case 'volume-spike':
                if (comparisonValue !== undefined) {
                    conditionMet = value > comparisonValue * alert.threshold;
                }
                break;
            case 'volatility-increase':
                if (comparisonValue !== undefined) {
                    conditionMet = value > comparisonValue * alert.threshold;
                }
                break;
            case 'custom':
                // Custom conditions would be implemented here
                conditionMet = false;
                break;
        }
        return { conditionMet, value, comparisonValue };
    }
    /**
      * Extract a numeric value from a market data point
      * @param dataPoint Market data point
      * @returns Numeric value
      */
    extractValue(dataPoint) {
        if (typeof dataPoint.value === 'number') {
            return dataPoint.value;
        }
        // Handle different data types
        switch (dataPoint.dataType) {
            case 'price':
                return dataPoint.value.close || 0;
            case 'volume':
                return dataPoint.value;
            case 'technical-indicators':
                return dataPoint.value.value || 0;
            case 'news-sentiment':
                return dataPoint.value.score || 0;
            case 'economic-indicators':
                return dataPoint.value.value || 0;
            case 'volatility-metrics':
                return dataPoint.value.historicalVolatility || 0;
            default:
                return 0;
        }
    }
    /**
     * Get comparison value for an alert
     * @param alert Alert configuration
     * @param dataPoint Current market data point
     * @returns Comparison value
     */
    getComparisonValue(alert, dataPoint) {
        if (!alert.comparisonValue) {
            return undefined;
        }
        switch (alert.comparisonValue) {
            case 'previous':
                // In a real implementation, this would look up the previous value from storage
                // For now, we'll use a mock value
                return this.extractValue(dataPoint) * 0.95; // 5% less than current value
            case 'moving-average':
                // In a real implementation, this would calculate the moving average
                // For now, we'll use a mock value
                return this.extractValue(dataPoint) * 0.9; // 10% less than current value
            case 'fixed':
                return alert.threshold;
            default:
                return undefined;
        }
    }
    /**
     * Create a market alert
     * @param alertConfig Alert configuration
     * @param dataPoint Market data point that triggered the alert
     * @param value Triggered value
     * @param comparisonValue Comparison value
     * @returns Created market alert
     */
    async createMarketAlert(alertConfig, dataPoint, value, comparisonValue) {
        // Generate alert message
        const message = this.generateAlertMessage(alertConfig, dataPoint, value, comparisonValue);
        // Determine severity
        const severity = this.determineSeverity(alertConfig, value, comparisonValue);
        // Create alert
        return {
            id: (0, uuid_1.v4)(),
            alertConfigId: alertConfig.id,
            symbol: alertConfig.symbol,
            dataType: alertConfig.dataType,
            condition: alertConfig.condition,
            threshold: alertConfig.threshold,
            triggeredValue: value,
            comparisonValue,
            timestamp: new Date(),
            message,
            severity,
            metadata: {
                dataPointId: dataPoint.id,
                dataPointTimestamp: dataPoint.timestamp
            }
        };
    }
    /**
     * Generate alert message
     * @param alertConfig Alert configuration
     * @param dataPoint Market data point
     * @param value Triggered value
     * @param comparisonValue Comparison value
     * @returns Alert message
     */
    generateAlertMessage(alertConfig, dataPoint, value, comparisonValue) {
        const symbol = alertConfig.symbol;
        const condition = alertConfig.condition;
        const threshold = alertConfig.threshold;
        switch (condition) {
            case 'greater-than':
                return `${symbol} ${dataPoint.dataType} is above ${threshold} (current: ${value.toFixed(2)})`;
            case 'less-than':
                return `${symbol} ${dataPoint.dataType} is below ${threshold} (current: ${value.toFixed(2)})`;
            case 'equal-to':
                return `${symbol} ${dataPoint.dataType} is equal to ${threshold} (current: ${value.toFixed(2)})`;
            case 'percent-change-up':
                if (comparisonValue !== undefined) {
                    const percentChange = ((value - comparisonValue) / comparisonValue) * 100;
                    return `${symbol} ${dataPoint.dataType} increased by ${percentChange.toFixed(2)}% (from ${comparisonValue.toFixed(2)} to ${value.toFixed(2)})`;
                }
                return `${symbol} ${dataPoint.dataType} increased significantly`;
            case 'percent-change-down':
                if (comparisonValue !== undefined) {
                    const percentChange = ((comparisonValue - value) / comparisonValue) * 100;
                    return `${symbol} ${dataPoint.dataType} decreased by ${percentChange.toFixed(2)}% (from ${comparisonValue.toFixed(2)} to ${value.toFixed(2)})`;
                }
                return `${symbol} ${dataPoint.dataType} decreased significantly`;
            case 'crosses-above':
                return `${symbol} ${dataPoint.dataType} crossed above ${threshold} (current: ${value.toFixed(2)})`;
            case 'crosses-below':
                return `${symbol} ${dataPoint.dataType} crossed below ${threshold} (current: ${value.toFixed(2)})`;
            case 'volume-spike':
                if (comparisonValue !== undefined) {
                    const ratio = value / comparisonValue;
                    return `${symbol} volume spiked ${ratio.toFixed(2)}x above normal (current: ${value})`;
                }
                return `${symbol} volume spiked significantly`;
            case 'volatility-increase':
                if (comparisonValue !== undefined) {
                    const ratio = value / comparisonValue;
                    return `${symbol} volatility increased ${ratio.toFixed(2)}x (current: ${value.toFixed(2)})`;
                }
                return `${symbol} volatility increased significantly`;
            default:
                return `${symbol} ${dataPoint.dataType} alert triggered (${value.toFixed(2)})`;
        }
    }
    /**
     * Determine alert severity
     * @param alertConfig Alert configuration
     * @param value Triggered value
     * @param comparisonValue Comparison value
     * @returns Alert severity
     */
    determineSeverity(alertConfig, value, comparisonValue) {
        // This is a simplified implementation
        // In a real system, this would use more sophisticated logic
        const condition = alertConfig.condition;
        const threshold = alertConfig.threshold;
        // For percent changes, determine severity based on magnitude
        if (condition === 'percent-change-up' || condition === 'percent-change-down') {
            if (comparisonValue !== undefined) {
                const percentChange = Math.abs((value - comparisonValue) / comparisonValue) * 100;
                if (percentChange > 10) {
                    return 'critical';
                }
                else if (percentChange > 5) {
                    return 'warning';
                }
            }
        }
        // For threshold crossings, determine severity based on distance from threshold
        if (condition === 'greater-than' || condition === 'less-than') {
            const distance = Math.abs(value - threshold) / threshold;
            if (distance > 0.1) {
                return 'critical';
            }
            else if (distance > 0.05) {
                return 'warning';
            }
        }
        // Default severity
        return 'info';
    }
    /**
     * Send notifications for a triggered alert
     * @param alertConfig Alert configuration
     * @param alert Triggered alert
     */
    async sendNotifications(alertConfig, alert) {
        // Send notifications to all enabled channels
        for (const channel of alertConfig.notificationChannels) {
            if (channel.enabled) {
                const handler = this.notificationHandlers.get(channel.type);
                if (handler) {
                    try {
                        await handler.sendNotification(channel.destination, alert);
                    }
                    catch (error) {
                        console.error(`Error sending ${channel.type} notification:`, error);
                    }
                }
            }
        }
    }
}
exports.MarketAlertService = MarketAlertService;
/**
 * Email notification handler
 */
class EmailNotificationHandler {
    async sendNotification(destination, alert) {
        // In a real implementation, this would send an email
        console.log(`[EMAIL] Sending alert to ${destination}: ${alert.message}`);
    }
}
/**
 * SMS notification handler
 */
class SmsNotificationHandler {
    async sendNotification(destination, alert) {
        // In a real implementation, this would send an SMS
        console.log(`[SMS] Sending alert to ${destination}: ${alert.message}`);
    }
}
/**
 * Push notification handler
 */
class PushNotificationHandler {
    async sendNotification(destination, alert) {
        // In a real implementation, this would send a push notification
        console.log(`[PUSH] Sending alert to ${destination}: ${alert.message}`);
    }
}
/**
 * Webhook notification handler
 */
class WebhookNotificationHandler {
    async sendNotification(destination, alert) {
        // In a real implementation, this would send a webhook request
        console.log(`[WEBHOOK] Sending alert to ${destination}: ${alert.message}`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2V0LWFsZXJ0LXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvYWxlcnRzL21hcmtldC1hbGVydC1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7O0FBRUgsK0JBQW9DO0FBVXBDOztHQUVHO0FBQ0gsTUFBYSxrQkFBa0I7SUFLN0I7UUFKUSxXQUFNLEdBQW1DLElBQUksR0FBRyxFQUFFLENBQUM7UUFDbkQsaUJBQVksR0FBK0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNyRCx5QkFBb0IsR0FBcUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUd6RSx5Q0FBeUM7UUFDekMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLE9BQU8sRUFBRSxJQUFJLHdCQUF3QixFQUFFLENBQUMsQ0FBQztRQUMxRSxJQUFJLENBQUMsMkJBQTJCLENBQUMsS0FBSyxFQUFFLElBQUksc0JBQXNCLEVBQUUsQ0FBQyxDQUFDO1FBQ3RFLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxNQUFNLEVBQUUsSUFBSSx1QkFBdUIsRUFBRSxDQUFDLENBQUM7UUFDeEUsSUFBSSxDQUFDLDJCQUEyQixDQUFDLFNBQVMsRUFBRSxJQUFJLDBCQUEwQixFQUFFLENBQUMsQ0FBQztJQUNoRixDQUFDLENBQUU7Ozs7O09BS0E7SUFDSCxLQUFLLENBQUMsV0FBVyxDQUFDLFdBQXNFO1FBQ3RGLDZCQUE2QjtRQUM3QixNQUFNLEVBQUUsR0FBRyxJQUFBLFNBQU0sR0FBRSxDQUFDO1FBQ3BCLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7UUFFdkIsbUJBQW1CO1FBQ25CLE1BQU0sUUFBUSxHQUFzQjtZQUNsQyxHQUFHLFdBQVc7WUFDZCxFQUFFO1lBQ0YsU0FBUyxFQUFFLEdBQUc7WUFDZCxTQUFTLEVBQUUsR0FBRztTQUNmLENBQUM7UUFFRixrQkFBa0I7UUFDbEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxH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LENBQUMsR0FBRyxDQUFDLDRCQUE0QixXQUFXLEtBQUssS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDM0UsQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLHNCQUFzQjtJQUMxQixLQUFLLENBQUMsZ0JBQWdCLENBQUMsV0FBbUIsRUFBRSxLQUFrQjtRQUM1RCxtREFBbUQ7UUFDbkQsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsV0FBVyxLQUFLLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7Q0FDRjtBQUVEOztHQUVHO0FBQ0gsTUFBTSx1QkFBdUI7SUFDM0IsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFdBQW1CLEVBQUUsS0FBa0I7UUFDNUQsZ0VBQWdFO1FBQ2hFLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLFdBQVcsS0FBSyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUMxRSxDQUFDO0NBQ0Y7QUFFRDs7R0FFRztBQUNILE1BQU0sMEJBQTBCO0lBQzlCLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFtQixFQUFFLEtBQWtCO1FBQzVELDhEQUE4RDtRQUM5RCxPQUFPLENBQUMsR0FBRyxDQUFDLDhCQUE4QixXQUFXLEtBQUssS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDN0UsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBNYXJrZXQgZGF0YSBhbGVydCBzZXJ2aWNlIGltcGxlbWVudGF0aW9uXG4gKi9cblxuaW1wb3J0IHsgdjQgYXMgdXVpZHY0IH0gZnJvbSAndXVpZCc7XG5pbXBvcnQge1xuICBNYXJrZXRBbGVydENvbmZpZyxcbiAgTWFya2V0QWxlcnQsXG4gIE1hcmtldERhdGFQb2ludCxcbiAgQWxlcnRDb25kaXRpb24sXG4gIE5vdGlmaWNhdGlvbkNoYW5uZWxcbn0gZnJvbSAnLi4vLi4vbW9kZWxzL21hcmtldC1kYXRhJztcbmltcG9ydCB7IE1hcmtldERhdGFBbGVydFNlcnZpY2UgfSBmcm9tICcuLi9tYXJrZXQtZGF0YS1zZXJ2aWNlJztcblxuLyoqXG4gKiBNYXJrZXQgZGF0YSBhbGVydCBzZXJ2aWNlIGltcGxlbWVudGF0aW9uXG4gKi9cbmV4cG9ydCBjbGFzcyBNYXJrZXRBbGVydFNlcnZpY2UgaW1wbGVtZW50cyBNYXJrZXREYXRhQWxlcnRTZXJ2aWNlIHtcbiAgcHJpdmF0ZSBhbGVydHM6IE1hcDxzdHJpbmcsIE1hcmtldEFsZXJ0Q29uZmlnPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBhbGVydEhpc3Rvcnk6IE1hcDxzdHJpbmcsIE1hcmtldEFsZXJ0W10+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIG5vdGlmaWNhdGlvbkhhbmRsZXJzOiBNYXA8c3RyaW5nLCBOb3RpZmljYXRpb25IYW5kbGVyPiA9IG5ldyBNYXAoKTtcbiAgXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vIFJlZ2lzdGVyIGRlZmF1bHQgbm90aWZpY2F0aW9uIGhhbmRsZXJzXG4gICAgdGhpcy5yZWdpc3Rlck5vdGlmaWNhdGlvbkhhbmRsZXIoJ2VtYWlsJywgbmV3IEVtYWlsTm90aWZpY2F0aW9uSGFuZGxlcigpKTtcbiAgICB0aGlzLnJlZ2lzdGVyTm90aWZpY2F0aW9uSGFuZGxlcignc21zJywgbmV3IFNtc05vdGlmaWNhdGlvbkhhbmRsZXIoKSk7XG4gICAgdGhpcy5yZWdpc3Rlck5vdGlmaWNhdGlvbkhhbmRsZXIoJ3B1c2gnLCBuZXcgUHVzaE5vdGlmaWNhdGlvbkhhbmRsZXIoKSk7XG4gICAgdGhpcy5yZWdpc3Rlck5vdGlmaWNhdGlvbkhhbmRsZXIoJ3dlYmhvb2snLCBuZXcgV2ViaG9va05vdGlmaWNhdGlvbkhhbmRsZXIoKSk7XG4gIH0gIC8qKlxuXG4gICAqIENyZWF0ZSBhIG5ldyBtYXJrZXQgYWxlcnRcbiAgICogQHBhcmFtIGFsZXJ0Q29uZmlnIEFsZXJ0IGNvbmZpZ3VyYXRpb25cbiAgICogQHJldHVybnMgQ3JlYXRlZCBhbGVydCBjb25maWd1cmF0aW9uXG4gICAqL1xuICBhc3luYyBjcmVhdGVBbGVydChhbGVydENvbmZpZzogT21pdDxNYXJrZXRBbGVydENvbmZpZywgJ2lkJyB8ICdjcmVhdGVkQXQnIHwgJ3VwZGF0ZWRBdCc+KTogUHJvbWlzZTxNYXJrZXRBbGVydENvbmZpZz4ge1xuICAgIC8vIEdlbmVyYXRlIElEIGFuZCB0aW1lc3RhbXBzXG4gICAgY29uc3QgaWQgPSB1dWlkdjQoKTtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIFxuICAgIC8vIENyZWF0ZSB0aGUgYWxlcnRcbiAgICBjb25zdCBuZXdBbGVydDogTWFya2V0QWxlcnRDb25maWcgPSB7XG4gICAgICAuLi5hbGVydENvbmZpZyxcbiAgICAgIGlkLFxuICAgICAgY3JlYXRlZEF0OiBub3csXG4gICAgICB1cGRhdGVkQXQ6IG5vd1xuICAgIH07XG4gICAgXG4gICAgLy8gU3RvcmUgdGhlIGFsZXJ0XG4gICAgdGhpcy5hbGVydHMuc2V0KGlkLCBuZXdBbGVydCk7XG4gICAgXG4gICAgLy8gSW5pdGlhbGl6ZSBhbGVydCBoaXN0b3J5XG4gICAgdGhpcy5hbGVydEhpc3Rvcnkuc2V0KGlkLCBbXSk7XG4gICAgXG4gICAgcmV0dXJuIG5ld0FsZXJ0O1xuICB9XG4gIFxuICAvKipcbiAgICogVXBkYXRlIGFuIGV4aXN0aW5nIG1hcmtldCBhbGVydFxuICAgKiBAcGFyYW0gYWxlcnRJZCBBbGVydCBJRFxuICAgKiBAcGFyYW0gdXBkYXRlcyBBbGVydCB1cGRhdGVzXG4gICAqIEByZXR1cm5zIFVwZGF0ZWQgYWxlcnQgY29uZmlndXJhdGlvblxuICAgKi9cbiAgYXN5bmMgdXBkYXRlQWxlcnQoYWxlcnRJZDogc3RyaW5nLCB1cGRhdGVzOiBQYXJ0aWFsPE1hcmtldEFsZXJ0Q29uZmlnPik6IFByb21pc2U8TWFya2V0QWxlcnRDb25maWc+IHtcbiAgICAvLyBHZXQgdGhlIGV4aXN0aW5nIGFsZXJ0XG4gICAgY29uc3QgZXhpc3RpbmdBbGVydCA9IHRoaXMuYWxlcnRzLmdldChhbGVydElkKTtcbiAgICBcbiAgICBpZiAoIWV4aXN0aW5nQWxlcnQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQWxlcnQgbm90IGZvdW5kOiAke2FsZXJ0SWR9YCk7XG4gICAgfVxuICAgIFxuICAgIC8vIFVwZGF0ZSB0aGUgYWxlcnRcbiAgICBjb25zdCB1cGRhdGVkQWxlcnQ6IE1hcmtldEFsZXJ0Q29uZmlnID0ge1xuICAgICAgLi4uZXhpc3RpbmdBbGVydCxcbiAgICAgIC4uLnVwZGF0ZXMsXG4gICAgICBpZDogZXhpc3RpbmdBbGVydC5pZCwgLy8gRW5zdXJlIElEIGRvZXNuJ3QgY2hhbmdlXG4gICAgICBjcmVhdGVkQXQ6IGV4aXN0aW5nQWxlcnQuY3JlYXRlZEF0LCAvLyBFbnN1cmUgY3JlYXRpb24gZGF0ZSBkb2Vzbid0IGNoYW5nZVxuICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpIC8vIFVwZGF0ZSB0aGUgdXBkYXRlZCB0aW1lc3RhbXBcbiAgICB9O1xuICAgIFxuICAgIC8vIFN0b3JlIHRoZSB1cGRhdGVkIGFsZXJ0XG4gICAgdGhpcy5hbGVydHMuc2V0KGFsZXJ0SWQsIHVwZGF0ZWRBbGVydCk7XG4gICAgXG4gICAgcmV0dXJuIHVwZGF0ZWRBbGVydDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlbGV0ZSBhIG1hcmtldCBhbGVydFxuICAgKiBAcGFyYW0gYWxlcnRJZCBBbGVydCBJRFxuICAgKiBAcmV0dXJucyBUcnVlIGlmIGRlbGV0aW9uIHdhcyBzdWNjZXNzZnVsXG4gICAqL1xuICBhc3luYyBkZWxldGVBbGVydChhbGVydElkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAvLyBEZWxldGUgdGhlIGFsZXJ0IGFuZCBpdHMgaGlzdG9yeVxuICAgIGNvbnN0IGFsZXJ0RGVsZXRlZCA9IHRoaXMuYWxlcnRzLmRlbGV0ZShhbGVydElkKTtcbiAgICB0aGlzLmFsZXJ0SGlzdG9yeS5kZWxldGUoYWxlcnRJZCk7XG4gICAgXG4gICAgcmV0dXJuIGFsZXJ0RGVsZXRlZDtcbiAgfSAgXG4vKipcbiAgICogR2V0IGEgbWFya2V0IGFsZXJ0IGJ5IElEXG4gICAqIEBwYXJhbSBhbGVydElkIEFsZXJ0IElEXG4gICAqIEByZXR1cm5zIEFsZXJ0IGNvbmZpZ3VyYXRpb24gb3IgbnVsbCBpZiBub3QgZm91bmRcbiAgICovXG4gIGFzeW5jIGdldEFsZXJ0KGFsZXJ0SWQ6IHN0cmluZyk6IFByb21pc2U8TWFya2V0QWxlcnRDb25maWcgfCBudWxsPiB7XG4gICAgcmV0dXJuIHRoaXMuYWxlcnRzLmdldChhbGVydElkKSB8fCBudWxsO1xuICB9XG4gIFxuICAvKipcbiAgICogTGlzdCBtYXJrZXQgYWxlcnRzIGZvciBhIHVzZXJcbiAgICogQHBhcmFtIHVzZXJJZCBVc2VyIElEXG4gICAqIEByZXR1cm5zIExpc3Qgb2YgYWxlcnQgY29uZmlndXJhdGlvbnNcbiAgICovXG4gIGFzeW5jIGxpc3RBbGVydHModXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPE1hcmtldEFsZXJ0Q29uZmlnW10+IHtcbiAgICAvLyBGaWx0ZXIgYWxlcnRzIGJ5IHVzZXIgSURcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLmFsZXJ0cy52YWx1ZXMoKSkuZmlsdGVyKGFsZXJ0ID0+IGFsZXJ0LnVzZXJJZCA9PT0gdXNlcklkKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEVuYWJsZSBhIG1hcmtldCBhbGVydFxuICAgKiBAcGFyYW0gYWxlcnRJZCBBbGVydCBJRFxuICAgKiBAcmV0dXJucyBVcGRhdGVkIGFsZXJ0IGNvbmZpZ3VyYXRpb25cbiAgICovXG4gIGFzeW5jIGVuYWJsZUFsZXJ0KGFsZXJ0SWQ6IHN0cmluZyk6IFByb21pc2U8TWFya2V0QWxlcnRDb25maWc+IHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVBbGVydChhbGVydElkLCB7IGVuYWJsZWQ6IHRydWUgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEaXNhYmxlIGEgbWFya2V0IGFsZXJ0XG4gICAqIEBwYXJhbSBhbGVydElkIEFsZXJ0IElEXG4gICAqIEByZXR1cm5zIFVwZGF0ZWQgYWxlcnQgY29uZmlndXJhdGlvblxuICAgKi9cbiAgYXN5bmMgZGlzYWJsZUFsZXJ0KGFsZXJ0SWQ6IHN0cmluZyk6IFByb21pc2U8TWFya2V0QWxlcnRDb25maWc+IHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVBbGVydChhbGVydElkLCB7IGVuYWJsZWQ6IGZhbHNlIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogUHJvY2VzcyBhIG1hcmtldCBkYXRhIHBvaW50IGFuZCB0cmlnZ2VyIGFsZXJ0cyBpZiBjb25kaXRpb25zIGFyZSBtZXRcbiAgICogQHBhcmFtIGRhdGFQb2ludCBNYXJrZXQgZGF0YSBwb2ludFxuICAgKiBAcmV0dXJucyBMaXN0IG9mIHRyaWdnZXJlZCBhbGVydHNcbiAgICovXG4gIGFzeW5jIHByb2Nlc3NEYXRhUG9pbnQoZGF0YVBvaW50OiBNYXJrZXREYXRhUG9pbnQpOiBQcm9taXNlPE1hcmtldEFsZXJ0W10+IHtcbiAgICBjb25zdCB0cmlnZ2VyZWRBbGVydHM6IE1hcmtldEFsZXJ0W10gPSBbXTtcbiAgICBcbiAgICAvLyBGaW5kIGFsZXJ0cyB0aGF0IG1hdGNoIHRoaXMgZGF0YSBwb2ludFxuICAgIGNvbnN0IG1hdGNoaW5nQWxlcnRzID0gQXJyYXkuZnJvbSh0aGlzLmFsZXJ0cy52YWx1ZXMoKSkuZmlsdGVyKGFsZXJ0ID0+IFxuICAgICAgYWxlcnQuZW5hYmxlZCAmJiBcbiAgICAgIGFsZXJ0LnN5bWJvbCA9PT0gZGF0YVBvaW50LnN5bWJvbCAmJiBcbiAgICAgIGFsZXJ0LmRhdGFUeXBlID09PSBkYXRhUG9pbnQuZGF0YVR5cGVcbiAgICApO1xuICAgIFxuICAgIC8vIENoZWNrIGVhY2ggYWxlcnRcbiAgICBmb3IgKGNvbnN0IGFsZXJ0IG9mIG1hdGNoaW5nQWxlcnRzKSB7XG4gICAgICAvLyBTa2lwIGlmIGluIGNvb2xkb3duIHBlcmlvZFxuICAgICAgaWYgKHRoaXMuaXNJbkNvb2xkb3duKGFsZXJ0KSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gQ2hlY2sgaWYgY29uZGl0aW9uIGlzIG1ldFxuICAgICAgY29uc3QgeyBjb25kaXRpb25NZXQsIHZhbHVlLCBjb21wYXJpc29uVmFsdWUgfSA9IHRoaXMuY2hlY2tDb25kaXRpb24oYWxlcnQsIGRhdGFQb2ludCk7XG4gICAgICBcbiAgICAgIGlmIChjb25kaXRpb25NZXQpIHtcbiAgICAgICAgLy8gQ3JlYXRlIGFsZXJ0XG4gICAgICAgIGNvbnN0IG1hcmtldEFsZXJ0ID0gYXdhaXQgdGhpcy5jcmVhdGVNYXJrZXRBbGVydChhbGVydCwgZGF0YVBvaW50LCB2YWx1ZSwgY29tcGFyaXNvblZhbHVlKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEFkZCB0byBoaXN0b3J5XG4gICAgICAgIGNvbnN0IGhpc3RvcnkgPSB0aGlzLmFsZXJ0SGlzdG9yeS5nZXQoYWxlcnQuaWQpIHx8IFtdO1xuICAgICAgICBoaXN0b3J5LnB1c2gobWFya2V0QWxlcnQpO1xuICAgICAgICB0aGlzLmFsZXJ0SGlzdG9yeS5zZXQoYWxlcnQuaWQsIGhpc3RvcnkpO1xuICAgICAgICBcbiAgICAgICAgLy8gVXBkYXRlIGxhc3QgdHJpZ2dlcmVkIHRpbWVzdGFtcFxuICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZUFsZXJ0KGFsZXJ0LmlkLCB7IGxhc3RUcmlnZ2VyZWQ6IG5ldyBEYXRlKCkgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBTZW5kIG5vdGlmaWNhdGlvbnNcbiAgICAgICAgYXdhaXQgdGhpcy5zZW5kTm90aWZpY2F0aW9ucyhhbGVydCwgbWFya2V0QWxlcnQpO1xuICAgICAgICBcbiAgICAgICAgLy8gQWRkIHRvIHJlc3VsdFxuICAgICAgICB0cmlnZ2VyZWRBbGVydHMucHVzaChtYXJrZXRBbGVydCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmlnZ2VyZWRBbGVydHM7XG4gIH0gIC8qKlxuICAgXG4qIFJlZ2lzdGVyIGEgbm90aWZpY2F0aW9uIGhhbmRsZXJcbiAgICogQHBhcmFtIHR5cGUgTm90aWZpY2F0aW9uIHR5cGVcbiAgICogQHBhcmFtIGhhbmRsZXIgTm90aWZpY2F0aW9uIGhhbmRsZXJcbiAgICovXG4gIHJlZ2lzdGVyTm90aWZpY2F0aW9uSGFuZGxlcih0eXBlOiBzdHJpbmcsIGhhbmRsZXI6IE5vdGlmaWNhdGlvbkhhbmRsZXIpOiB2b2lkIHtcbiAgICB0aGlzLm5vdGlmaWNhdGlvbkhhbmRsZXJzLnNldCh0eXBlLCBoYW5kbGVyKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhbGVydCBoaXN0b3J5XG4gICAqIEBwYXJhbSBhbGVydElkIEFsZXJ0IElEXG4gICAqIEByZXR1cm5zIExpc3Qgb2YgdHJpZ2dlcmVkIGFsZXJ0c1xuICAgKi9cbiAgYXN5bmMgZ2V0QWxlcnRIaXN0b3J5KGFsZXJ0SWQ6IHN0cmluZyk6IFByb21pc2U8TWFya2V0QWxlcnRbXT4ge1xuICAgIHJldHVybiB0aGlzLmFsZXJ0SGlzdG9yeS5nZXQoYWxlcnRJZCkgfHwgW107XG4gIH1cbiAgXG4gIC8vIFByaXZhdGUgaGVscGVyIG1ldGhvZHNcbiAgXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhbiBhbGVydCBpcyBpbiBjb29sZG93biBwZXJpb2RcbiAgICogQHBhcmFtIGFsZXJ0IEFsZXJ0IGNvbmZpZ3VyYXRpb25cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBpbiBjb29sZG93biBwZXJpb2RcbiAgICovXG4gIHByaXZhdGUgaXNJbkNvb2xkb3duKGFsZXJ0OiBNYXJrZXRBbGVydENvbmZpZyk6IGJvb2xlYW4ge1xuICAgIGlmICghYWxlcnQubGFzdFRyaWdnZXJlZCB8fCAhYWxlcnQuY29vbGRvd25QZXJpb2QpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgXG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgY29uc3QgbGFzdFRyaWdnZXJlZCA9IGFsZXJ0Lmxhc3RUcmlnZ2VyZWQuZ2V0VGltZSgpO1xuICAgIFxuICAgIHJldHVybiBub3cgLSBsYXN0VHJpZ2dlcmVkIDwgYWxlcnQuY29vbGRvd25QZXJpb2Q7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhbiBhbGVydCBjb25kaXRpb24gaXMgbWV0XG4gICAqIEBwYXJhbSBhbGVydCBBbGVydCBjb25maWd1cmF0aW9uXG4gICAqIEBwYXJhbSBkYXRhUG9pbnQgTWFya2V0IGRhdGEgcG9pbnRcbiAgICogQHJldHVybnMgQ29uZGl0aW9uIGNoZWNrIHJlc3VsdFxuICAgKi9cbiAgcHJpdmF0ZSBjaGVja0NvbmRpdGlvbihcbiAgICBhbGVydDogTWFya2V0QWxlcnRDb25maWcsIFxuICAgIGRhdGFQb2ludDogTWFya2V0RGF0YVBvaW50XG4gICk6IHsgY29uZGl0aW9uTWV0OiBib29sZWFuOyB2YWx1ZTogbnVtYmVyOyBjb21wYXJpc29uVmFsdWU/OiBudW1iZXIgfSB7XG4gICAgLy8gRXh0cmFjdCB2YWx1ZSBmcm9tIGRhdGEgcG9pbnRcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZXh0cmFjdFZhbHVlKGRhdGFQb2ludCk7XG4gICAgXG4gICAgLy8gR2V0IGNvbXBhcmlzb24gdmFsdWVcbiAgICBjb25zdCBjb21wYXJpc29uVmFsdWUgPSB0aGlzLmdldENvbXBhcmlzb25WYWx1ZShhbGVydCwgZGF0YVBvaW50KTtcbiAgICBcbiAgICAvLyBDaGVjayBjb25kaXRpb25cbiAgICBsZXQgY29uZGl0aW9uTWV0ID0gZmFsc2U7XG4gICAgXG4gICAgc3dpdGNoIChhbGVydC5jb25kaXRpb24pIHtcbiAgICAgIGNhc2UgJ2dyZWF0ZXItdGhhbic6XG4gICAgICAgIGNvbmRpdGlvbk1ldCA9IHZhbHVlID4gYWxlcnQudGhyZXNob2xkO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xlc3MtdGhhbic6XG4gICAgICAgIGNvbmRpdGlvbk1ldCA9IHZhbHVlIDwgYWxlcnQudGhyZXNob2xkO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2VxdWFsLXRvJzpcbiAgICAgICAgY29uZGl0aW9uTWV0ID0gTWF0aC5hYnModmFsdWUgLSBhbGVydC50aHJlc2hvbGQpIDwgMC4wMDAxOyAvLyBBcHByb3hpbWF0ZSBlcXVhbGl0eSBmb3IgZmxvYXRpbmcgcG9pbnRcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwZXJjZW50LWNoYW5nZS11cCc6XG4gICAgICAgIGlmIChjb21wYXJpc29uVmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGNvbnN0IHBlcmNlbnRDaGFuZ2UgPSAoKHZhbHVlIC0gY29tcGFyaXNvblZhbHVlKSAvIGNvbXBhcmlzb25WYWx1ZSkgKiAxMDA7XG4gICAgICAgICAgY29uZGl0aW9uTWV0ID0gcGVyY2VudENoYW5nZSA+IGFsZXJ0LnRocmVzaG9sZDtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3BlcmNlbnQtY2hhbmdlLWRvd24nOlxuICAgICAgICBpZiAoY29tcGFyaXNvblZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBjb25zdCBwZXJjZW50Q2hhbmdlID0gKCh2YWx1ZSAtIGNvbXBhcmlzb25WYWx1ZSkgLyBjb21wYXJpc29uVmFsdWUpICogMTAwO1xuICAgICAgICAgIGNvbmRpdGlvbk1ldCA9IHBlcmNlbnRDaGFuZ2UgPCAtYWxlcnQudGhyZXNob2xkO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnY3Jvc3Nlcy1hYm92ZSc6XG4gICAgICAgIGlmIChjb21wYXJpc29uVmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGNvbmRpdGlvbk1ldCA9IHZhbHVlID4gYWxlcnQudGhyZXNob2xkICYmIGNvbXBhcmlzb25WYWx1ZSA8PSBhbGVydC50aHJlc2hvbGQ7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdjcm9zc2VzLWJlbG93JzpcbiAgICAgICAgaWYgKGNvbXBhcmlzb25WYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29uZGl0aW9uTWV0ID0gdmFsdWUgPCBhbGVydC50aHJlc2hvbGQgJiYgY29tcGFyaXNvblZhbHVlID49IGFsZXJ0LnRocmVzaG9sZDtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3ZvbHVtZS1zcGlrZSc6XG4gICAgICAgIGlmIChjb21wYXJpc29uVmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGNvbmRpdGlvbk1ldCA9IHZhbHVlID4gY29tcGFyaXNvblZhbHVlICogYWxlcnQudGhyZXNob2xkO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndm9sYXRpbGl0eS1pbmNyZWFzZSc6XG4gICAgICAgIGlmIChjb21wYXJpc29uVmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGNvbmRpdGlvbk1ldCA9IHZhbHVlID4gY29tcGFyaXNvblZhbHVlICogYWxlcnQudGhyZXNob2xkO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnY3VzdG9tJzpcbiAgICAgICAgLy8gQ3VzdG9tIGNvbmRpdGlvbnMgd291bGQgYmUgaW1wbGVtZW50ZWQgaGVyZVxuICAgICAgICBjb25kaXRpb25NZXQgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB7IGNvbmRpdGlvbk1ldCwgdmFsdWUsIGNvbXBhcmlzb25WYWx1ZSB9O1xuICB9IFxuIC8qKlxuICAgKiBFeHRyYWN0IGEgbnVtZXJpYyB2YWx1ZSBmcm9tIGEgbWFya2V0IGRhdGEgcG9pbnRcbiAgICogQHBhcmFtIGRhdGFQb2ludCBNYXJrZXQgZGF0YSBwb2ludFxuICAgKiBAcmV0dXJucyBOdW1lcmljIHZhbHVlXG4gICAqL1xuICBwcml2YXRlIGV4dHJhY3RWYWx1ZShkYXRhUG9pbnQ6IE1hcmtldERhdGFQb2ludCk6IG51bWJlciB7XG4gICAgaWYgKHR5cGVvZiBkYXRhUG9pbnQudmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gZGF0YVBvaW50LnZhbHVlO1xuICAgIH1cbiAgICBcbiAgICAvLyBIYW5kbGUgZGlmZmVyZW50IGRhdGEgdHlwZXNcbiAgICBzd2l0Y2ggKGRhdGFQb2ludC5kYXRhVHlwZSkge1xuICAgICAgY2FzZSAncHJpY2UnOlxuICAgICAgICByZXR1cm4gZGF0YVBvaW50LnZhbHVlLmNsb3NlIHx8IDA7XG4gICAgICBjYXNlICd2b2x1bWUnOlxuICAgICAgICByZXR1cm4gZGF0YVBvaW50LnZhbHVlO1xuICAgICAgY2FzZSAndGVjaG5pY2FsLWluZGljYXRvcnMnOlxuICAgICAgICByZXR1cm4gZGF0YVBvaW50LnZhbHVlLnZhbHVlIHx8IDA7XG4gICAgICBjYXNlICduZXdzLXNlbnRpbWVudCc6XG4gICAgICAgIHJldHVybiBkYXRhUG9pbnQudmFsdWUuc2NvcmUgfHwgMDtcbiAgICAgIGNhc2UgJ2Vjb25vbWljLWluZGljYXRvcnMnOlxuICAgICAgICByZXR1cm4gZGF0YVBvaW50LnZhbHVlLnZhbHVlIHx8IDA7XG4gICAgICBjYXNlICd2b2xhdGlsaXR5LW1ldHJpY3MnOlxuICAgICAgICByZXR1cm4gZGF0YVBvaW50LnZhbHVlLmhpc3RvcmljYWxWb2xhdGlsaXR5IHx8IDA7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgY29tcGFyaXNvbiB2YWx1ZSBmb3IgYW4gYWxlcnRcbiAgICogQHBhcmFtIGFsZXJ0IEFsZXJ0IGNvbmZpZ3VyYXRpb25cbiAgICogQHBhcmFtIGRhdGFQb2ludCBDdXJyZW50IG1hcmtldCBkYXRhIHBvaW50XG4gICAqIEByZXR1cm5zIENvbXBhcmlzb24gdmFsdWVcbiAgICovXG4gIHByaXZhdGUgZ2V0Q29tcGFyaXNvblZhbHVlKGFsZXJ0OiBNYXJrZXRBbGVydENvbmZpZywgZGF0YVBvaW50OiBNYXJrZXREYXRhUG9pbnQpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICAgIGlmICghYWxlcnQuY29tcGFyaXNvblZhbHVlKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBcbiAgICBzd2l0Y2ggKGFsZXJ0LmNvbXBhcmlzb25WYWx1ZSkge1xuICAgICAgY2FzZSAncHJldmlvdXMnOlxuICAgICAgICAvLyBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgbG9vayB1cCB0aGUgcHJldmlvdXMgdmFsdWUgZnJvbSBzdG9yYWdlXG4gICAgICAgIC8vIEZvciBub3csIHdlJ2xsIHVzZSBhIG1vY2sgdmFsdWVcbiAgICAgICAgcmV0dXJuIHRoaXMuZXh0cmFjdFZhbHVlKGRhdGFQb2ludCkgKiAwLjk1OyAvLyA1JSBsZXNzIHRoYW4gY3VycmVudCB2YWx1ZVxuICAgICAgY2FzZSAnbW92aW5nLWF2ZXJhZ2UnOlxuICAgICAgICAvLyBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgY2FsY3VsYXRlIHRoZSBtb3ZpbmcgYXZlcmFnZVxuICAgICAgICAvLyBGb3Igbm93LCB3ZSdsbCB1c2UgYSBtb2NrIHZhbHVlXG4gICAgICAgIHJldHVybiB0aGlzLmV4dHJhY3RWYWx1ZShkYXRhUG9pbnQpICogMC45OyAvLyAxMCUgbGVzcyB0aGFuIGN1cnJlbnQgdmFsdWVcbiAgICAgIGNhc2UgJ2ZpeGVkJzpcbiAgICAgICAgcmV0dXJuIGFsZXJ0LnRocmVzaG9sZDtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogQ3JlYXRlIGEgbWFya2V0IGFsZXJ0XG4gICAqIEBwYXJhbSBhbGVydENvbmZpZyBBbGVydCBjb25maWd1cmF0aW9uXG4gICAqIEBwYXJhbSBkYXRhUG9pbnQgTWFya2V0IGRhdGEgcG9pbnQgdGhhdCB0cmlnZ2VyZWQgdGhlIGFsZXJ0XG4gICAqIEBwYXJhbSB2YWx1ZSBUcmlnZ2VyZWQgdmFsdWVcbiAgICogQHBhcmFtIGNvbXBhcmlzb25WYWx1ZSBDb21wYXJpc29uIHZhbHVlXG4gICAqIEByZXR1cm5zIENyZWF0ZWQgbWFya2V0IGFsZXJ0XG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGNyZWF0ZU1hcmtldEFsZXJ0KFxuICAgIGFsZXJ0Q29uZmlnOiBNYXJrZXRBbGVydENvbmZpZyxcbiAgICBkYXRhUG9pbnQ6IE1hcmtldERhdGFQb2ludCxcbiAgICB2YWx1ZTogbnVtYmVyLFxuICAgIGNvbXBhcmlzb25WYWx1ZT86IG51bWJlclxuICApOiBQcm9taXNlPE1hcmtldEFsZXJ0PiB7XG4gICAgLy8gR2VuZXJhdGUgYWxlcnQgbWVzc2FnZVxuICAgIGNvbnN0IG1lc3NhZ2UgPSB0aGlzLmdlbmVyYXRlQWxlcnRNZXNzYWdlKGFsZXJ0Q29uZmlnLCBkYXRhUG9pbnQsIHZhbHVlLCBjb21wYXJpc29uVmFsdWUpO1xuICAgIFxuICAgIC8vIERldGVybWluZSBzZXZlcml0eVxuICAgIGNvbnN0IHNldmVyaXR5ID0gdGhpcy5kZXRlcm1pbmVTZXZlcml0eShhbGVydENvbmZpZywgdmFsdWUsIGNvbXBhcmlzb25WYWx1ZSk7XG4gICAgXG4gICAgLy8gQ3JlYXRlIGFsZXJ0XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiB1dWlkdjQoKSxcbiAgICAgIGFsZXJ0Q29uZmlnSWQ6IGFsZXJ0Q29uZmlnLmlkLFxuICAgICAgc3ltYm9sOiBhbGVydENvbmZpZy5zeW1ib2wsXG4gICAgICBkYXRhVHlwZTogYWxlcnRDb25maWcuZGF0YVR5cGUsXG4gICAgICBjb25kaXRpb246IGFsZXJ0Q29uZmlnLmNvbmRpdGlvbixcbiAgICAgIHRocmVzaG9sZDogYWxlcnRDb25maWcudGhyZXNob2xkLFxuICAgICAgdHJpZ2dlcmVkVmFsdWU6IHZhbHVlLFxuICAgICAgY29tcGFyaXNvblZhbHVlLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgbWVzc2FnZSxcbiAgICAgIHNldmVyaXR5LFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgZGF0YVBvaW50SWQ6IGRhdGFQb2ludC5pZCxcbiAgICAgICAgZGF0YVBvaW50VGltZXN0YW1wOiBkYXRhUG9pbnQudGltZXN0YW1wXG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdlbmVyYXRlIGFsZXJ0IG1lc3NhZ2VcbiAgICogQHBhcmFtIGFsZXJ0Q29uZmlnIEFsZXJ0IGNvbmZpZ3VyYXRpb25cbiAgICogQHBhcmFtIGRhdGFQb2ludCBNYXJrZXQgZGF0YSBwb2ludFxuICAgKiBAcGFyYW0gdmFsdWUgVHJpZ2dlcmVkIHZhbHVlXG4gICAqIEBwYXJhbSBjb21wYXJpc29uVmFsdWUgQ29tcGFyaXNvbiB2YWx1ZVxuICAgKiBAcmV0dXJucyBBbGVydCBtZXNzYWdlXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlQWxlcnRNZXNzYWdlKFxuICAgIGFsZXJ0Q29uZmlnOiBNYXJrZXRBbGVydENvbmZpZyxcbiAgICBkYXRhUG9pbnQ6IE1hcmtldERhdGFQb2ludCxcbiAgICB2YWx1ZTogbnVtYmVyLFxuICAgIGNvbXBhcmlzb25WYWx1ZT86IG51bWJlclxuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IHN5bWJvbCA9IGFsZXJ0Q29uZmlnLnN5bWJvbDtcbiAgICBjb25zdCBjb25kaXRpb24gPSBhbGVydENvbmZpZy5jb25kaXRpb247XG4gICAgY29uc3QgdGhyZXNob2xkID0gYWxlcnRDb25maWcudGhyZXNob2xkO1xuICAgIFxuICAgIHN3aXRjaCAoY29uZGl0aW9uKSB7XG4gICAgICBjYXNlICdncmVhdGVyLXRoYW4nOlxuICAgICAgICByZXR1cm4gYCR7c3ltYm9sfSAke2RhdGFQb2ludC5kYXRhVHlwZX0gaXMgYWJvdmUgJHt0aHJlc2hvbGR9IChjdXJyZW50OiAke3ZhbHVlLnRvRml4ZWQoMil9KWA7XG4gICAgICBjYXNlICdsZXNzLXRoYW4nOlxuICAgICAgICByZXR1cm4gYCR7c3ltYm9sfSAke2RhdGFQb2ludC5kYXRhVHlwZX0gaXMgYmVsb3cgJHt0aHJlc2hvbGR9IChjdXJyZW50OiAke3ZhbHVlLnRvRml4ZWQoMil9KWA7XG4gICAgICBjYXNlICdlcXVhbC10byc6XG4gICAgICAgIHJldHVybiBgJHtzeW1ib2x9ICR7ZGF0YVBvaW50LmRhdGFUeXBlfSBpcyBlcXVhbCB0byAke3RocmVzaG9sZH0gKGN1cnJlbnQ6ICR7dmFsdWUudG9GaXhlZCgyKX0pYDtcbiAgICAgIGNhc2UgJ3BlcmNlbnQtY2hhbmdlLXVwJzpcbiAgICAgICAgaWYgKGNvbXBhcmlzb25WYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29uc3QgcGVyY2VudENoYW5nZSA9ICgodmFsdWUgLSBjb21wYXJpc29uVmFsdWUpIC8gY29tcGFyaXNvblZhbHVlKSAqIDEwMDtcbiAgICAgICAgICByZXR1cm4gYCR7c3ltYm9sfSAke2RhdGFQb2ludC5kYXRhVHlwZX0gaW5jcmVhc2VkIGJ5ICR7cGVyY2VudENoYW5nZS50b0ZpeGVkKDIpfSUgKGZyb20gJHtjb21wYXJpc29uVmFsdWUudG9GaXhlZCgyKX0gdG8gJHt2YWx1ZS50b0ZpeGVkKDIpfSlgO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgJHtzeW1ib2x9ICR7ZGF0YVBvaW50LmRhdGFUeXBlfSBpbmNyZWFzZWQgc2lnbmlmaWNhbnRseWA7XG4gICAgICBjYXNlICdwZXJjZW50LWNoYW5nZS1kb3duJzpcbiAgICAgICAgaWYgKGNvbXBhcmlzb25WYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29uc3QgcGVyY2VudENoYW5nZSA9ICgoY29tcGFyaXNvblZhbHVlIC0gdmFsdWUpIC8gY29tcGFyaXNvblZhbHVlKSAqIDEwMDtcbiAgICAgICAgICByZXR1cm4gYCR7c3ltYm9sfSAke2RhdGFQb2ludC5kYXRhVHlwZX0gZGVjcmVhc2VkIGJ5ICR7cGVyY2VudENoYW5nZS50b0ZpeGVkKDIpfSUgKGZyb20gJHtjb21wYXJpc29uVmFsdWUudG9GaXhlZCgyKX0gdG8gJHt2YWx1ZS50b0ZpeGVkKDIpfSlgO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgJHtzeW1ib2x9ICR7ZGF0YVBvaW50LmRhdGFUeXBlfSBkZWNyZWFzZWQgc2lnbmlmaWNhbnRseWA7XG4gICAgICBjYXNlICdjcm9zc2VzLWFib3ZlJzpcbiAgICAgICAgcmV0dXJuIGAke3N5bWJvbH0gJHtkYXRhUG9pbnQuZGF0YVR5cGV9IGNyb3NzZWQgYWJvdmUgJHt0aHJlc2hvbGR9IChjdXJyZW50OiAke3ZhbHVlLnRvRml4ZWQoMil9KWA7XG4gICAgICBjYXNlICdjcm9zc2VzLWJlbG93JzpcbiAgICAgICAgcmV0dXJuIGAke3N5bWJvbH0gJHtkYXRhUG9pbnQuZGF0YVR5cGV9IGNyb3NzZWQgYmVsb3cgJHt0aHJlc2hvbGR9IChjdXJyZW50OiAke3ZhbHVlLnRvRml4ZWQoMil9KWA7XG4gICAgICBjYXNlICd2b2x1bWUtc3Bpa2UnOlxuICAgICAgICBpZiAoY29tcGFyaXNvblZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBjb25zdCByYXRpbyA9IHZhbHVlIC8gY29tcGFyaXNvblZhbHVlO1xuICAgICAgICAgIHJldHVybiBgJHtzeW1ib2x9IHZvbHVtZSBzcGlrZWQgJHtyYXRpby50b0ZpeGVkKDIpfXggYWJvdmUgbm9ybWFsIChjdXJyZW50OiAke3ZhbHVlfSlgO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgJHtzeW1ib2x9IHZvbHVtZSBzcGlrZWQgc2lnbmlmaWNhbnRseWA7XG4gICAgICBjYXNlICd2b2xhdGlsaXR5LWluY3JlYXNlJzpcbiAgICAgICAgaWYgKGNvbXBhcmlzb25WYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29uc3QgcmF0aW8gPSB2YWx1ZSAvIGNvbXBhcmlzb25WYWx1ZTtcbiAgICAgICAgICByZXR1cm4gYCR7c3ltYm9sfSB2b2xhdGlsaXR5IGluY3JlYXNlZCAke3JhdGlvLnRvRml4ZWQoMil9eCAoY3VycmVudDogJHt2YWx1ZS50b0ZpeGVkKDIpfSlgO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgJHtzeW1ib2x9IHZvbGF0aWxpdHkgaW5jcmVhc2VkIHNpZ25pZmljYW50bHlgO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGAke3N5bWJvbH0gJHtkYXRhUG9pbnQuZGF0YVR5cGV9IGFsZXJ0IHRyaWdnZXJlZCAoJHt2YWx1ZS50b0ZpeGVkKDIpfSlgO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIERldGVybWluZSBhbGVydCBzZXZlcml0eVxuICAgKiBAcGFyYW0gYWxlcnRDb25maWcgQWxlcnQgY29uZmlndXJhdGlvblxuICAgKiBAcGFyYW0gdmFsdWUgVHJpZ2dlcmVkIHZhbHVlXG4gICAqIEBwYXJhbSBjb21wYXJpc29uVmFsdWUgQ29tcGFyaXNvbiB2YWx1ZVxuICAgKiBAcmV0dXJucyBBbGVydCBzZXZlcml0eVxuICAgKi9cbiAgcHJpdmF0ZSBkZXRlcm1pbmVTZXZlcml0eShcbiAgICBhbGVydENvbmZpZzogTWFya2V0QWxlcnRDb25maWcsXG4gICAgdmFsdWU6IG51bWJlcixcbiAgICBjb21wYXJpc29uVmFsdWU/OiBudW1iZXJcbiAgKTogJ2luZm8nIHwgJ3dhcm5pbmcnIHwgJ2NyaXRpY2FsJyB7XG4gICAgLy8gVGhpcyBpcyBhIHNpbXBsaWZpZWQgaW1wbGVtZW50YXRpb25cbiAgICAvLyBJbiBhIHJlYWwgc3lzdGVtLCB0aGlzIHdvdWxkIHVzZSBtb3JlIHNvcGhpc3RpY2F0ZWQgbG9naWNcbiAgICBcbiAgICBjb25zdCBjb25kaXRpb24gPSBhbGVydENvbmZpZy5jb25kaXRpb247XG4gICAgY29uc3QgdGhyZXNob2xkID0gYWxlcnRDb25maWcudGhyZXNob2xkO1xuICAgIFxuICAgIC8vIEZvciBwZXJjZW50IGNoYW5nZXMsIGRldGVybWluZSBzZXZlcml0eSBiYXNlZCBvbiBtYWduaXR1ZGVcbiAgICBpZiAoY29uZGl0aW9uID09PSAncGVyY2VudC1jaGFuZ2UtdXAnIHx8IGNvbmRpdGlvbiA9PT0gJ3BlcmNlbnQtY2hhbmdlLWRvd24nKSB7XG4gICAgICBpZiAoY29tcGFyaXNvblZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgcGVyY2VudENoYW5nZSA9IE1hdGguYWJzKCh2YWx1ZSAtIGNvbXBhcmlzb25WYWx1ZSkgLyBjb21wYXJpc29uVmFsdWUpICogMTAwO1xuICAgICAgICBcbiAgICAgICAgaWYgKHBlcmNlbnRDaGFuZ2UgPiAxMCkge1xuICAgICAgICAgIHJldHVybiAnY3JpdGljYWwnO1xuICAgICAgICB9IGVsc2UgaWYgKHBlcmNlbnRDaGFuZ2UgPiA1KSB7XG4gICAgICAgICAgcmV0dXJuICd3YXJuaW5nJztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBGb3IgdGhyZXNob2xkIGNyb3NzaW5ncywgZGV0ZXJtaW5lIHNldmVyaXR5IGJhc2VkIG9uIGRpc3RhbmNlIGZyb20gdGhyZXNob2xkXG4gICAgaWYgKGNvbmRpdGlvbiA9PT0gJ2dyZWF0ZXItdGhhbicgfHwgY29uZGl0aW9uID09PSAnbGVzcy10aGFuJykge1xuICAgICAgY29uc3QgZGlzdGFuY2UgPSBNYXRoLmFicyh2YWx1ZSAtIHRocmVzaG9sZCkgLyB0aHJlc2hvbGQ7XG4gICAgICBcbiAgICAgIGlmIChkaXN0YW5jZSA+IDAuMSkge1xuICAgICAgICByZXR1cm4gJ2NyaXRpY2FsJztcbiAgICAgIH0gZWxzZSBpZiAoZGlzdGFuY2UgPiAwLjA1KSB7XG4gICAgICAgIHJldHVybiAnd2FybmluZyc7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIERlZmF1bHQgc2V2ZXJpdHlcbiAgICByZXR1cm4gJ2luZm8nO1xuICB9XG4gIFxuICAvKipcbiAgICogU2VuZCBub3RpZmljYXRpb25zIGZvciBhIHRyaWdnZXJlZCBhbGVydFxuICAgKiBAcGFyYW0gYWxlcnRDb25maWcgQWxlcnQgY29uZmlndXJhdGlvblxuICAgKiBAcGFyYW0gYWxlcnQgVHJpZ2dlcmVkIGFsZXJ0XG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHNlbmROb3RpZmljYXRpb25zKGFsZXJ0Q29uZmlnOiBNYXJrZXRBbGVydENvbmZpZywgYWxlcnQ6IE1hcmtldEFsZXJ0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gU2VuZCBub3RpZmljYXRpb25zIHRvIGFsbCBlbmFibGVkIGNoYW5uZWxzXG4gICAgZm9yIChjb25zdCBjaGFubmVsIG9mIGFsZXJ0Q29uZmlnLm5vdGlmaWNhdGlvbkNoYW5uZWxzKSB7XG4gICAgICBpZiAoY2hhbm5lbC5lbmFibGVkKSB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLm5vdGlmaWNhdGlvbkhhbmRsZXJzLmdldChjaGFubmVsLnR5cGUpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGhhbmRsZXIpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgaGFuZGxlci5zZW5kTm90aWZpY2F0aW9uKGNoYW5uZWwuZGVzdGluYXRpb24sIGFsZXJ0KTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3Igc2VuZGluZyAke2NoYW5uZWwudHlwZX0gbm90aWZpY2F0aW9uOmAsIGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBOb3RpZmljYXRpb24gaGFuZGxlciBpbnRlcmZhY2VcbiAqL1xuaW50ZXJmYWNlIE5vdGlmaWNhdGlvbkhhbmRsZXIge1xuICBzZW5kTm90aWZpY2F0aW9uKGRlc3RpbmF0aW9uOiBzdHJpbmcsIGFsZXJ0OiBNYXJrZXRBbGVydCk6IFByb21pc2U8dm9pZD47XG59XG5cbi8qKlxuICogRW1haWwgbm90aWZpY2F0aW9uIGhhbmRsZXJcbiAqL1xuY2xhc3MgRW1haWxOb3RpZmljYXRpb25IYW5kbGVyIGltcGxlbWVudHMgTm90aWZpY2F0aW9uSGFuZGxlciB7XG4gIGFzeW5jIHNlbmROb3RpZmljYXRpb24oZGVzdGluYXRpb246IHN0cmluZywgYWxlcnQ6IE1hcmtldEFsZXJ0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIHNlbmQgYW4gZW1haWxcbiAgICBjb25zb2xlLmxvZyhgW0VNQUlMXSBTZW5kaW5nIGFsZXJ0IHRvICR7ZGVzdGluYXRpb259OiAke2FsZXJ0Lm1lc3NhZ2V9YCk7XG4gIH1cbn1cblxuLyoqXG4gKiBTTVMgbm90aWZpY2F0aW9uIGhhbmRsZXJcbiAqL1xuY2xhc3MgU21zTm90aWZpY2F0aW9uSGFuZGxlciBpbXBsZW1lbnRzIE5vdGlmaWNhdGlvbkhhbmRsZXIge1xuICBhc3luYyBzZW5kTm90aWZpY2F0aW9uKGRlc3RpbmF0aW9uOiBzdHJpbmcsIGFsZXJ0OiBNYXJrZXRBbGVydCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgdGhpcyB3b3VsZCBzZW5kIGFuIFNNU1xuICAgIGNvbnNvbGUubG9nKGBbU01TXSBTZW5kaW5nIGFsZXJ0IHRvICR7ZGVzdGluYXRpb259OiAke2FsZXJ0Lm1lc3NhZ2V9YCk7XG4gIH1cbn1cblxuLyoqXG4gKiBQdXNoIG5vdGlmaWNhdGlvbiBoYW5kbGVyXG4gKi9cbmNsYXNzIFB1c2hOb3RpZmljYXRpb25IYW5kbGVyIGltcGxlbWVudHMgTm90aWZpY2F0aW9uSGFuZGxlciB7XG4gIGFzeW5jIHNlbmROb3RpZmljYXRpb24oZGVzdGluYXRpb246IHN0cmluZywgYWxlcnQ6IE1hcmtldEFsZXJ0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIHNlbmQgYSBwdXNoIG5vdGlmaWNhdGlvblxuICAgIGNvbnNvbGUubG9nKGBbUFVTSF0gU2VuZGluZyBhbGVydCB0byAke2Rlc3RpbmF0aW9ufTogJHthbGVydC5tZXNzYWdlfWApO1xuICB9XG59XG5cbi8qKlxuICogV2ViaG9vayBub3RpZmljYXRpb24gaGFuZGxlclxuICovXG5jbGFzcyBXZWJob29rTm90aWZpY2F0aW9uSGFuZGxlciBpbXBsZW1lbnRzIE5vdGlmaWNhdGlvbkhhbmRsZXIge1xuICBhc3luYyBzZW5kTm90aWZpY2F0aW9uKGRlc3RpbmF0aW9uOiBzdHJpbmcsIGFsZXJ0OiBNYXJrZXRBbGVydCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgdGhpcyB3b3VsZCBzZW5kIGEgd2ViaG9vayByZXF1ZXN0XG4gICAgY29uc29sZS5sb2coYFtXRUJIT09LXSBTZW5kaW5nIGFsZXJ0IHRvICR7ZGVzdGluYXRpb259OiAke2FsZXJ0Lm1lc3NhZ2V9YCk7XG4gIH1cbn0iXX0=