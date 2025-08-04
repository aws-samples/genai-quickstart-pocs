/**
 * Market data alert service implementation
 */

import { v4 as uuidv4 } from 'uuid';
import {
  MarketAlertConfig,
  MarketAlert,
  MarketDataPoint,
  AlertCondition,
  NotificationChannel
} from '../../models/market-data';
import { MarketDataAlertService } from '../market-data-service';

/**
 * Market data alert service implementation
 */
export class MarketAlertService implements MarketDataAlertService {
  private alerts: Map<string, MarketAlertConfig> = new Map();
  private alertHistory: Map<string, MarketAlert[]> = new Map();
  private notificationHandlers: Map<string, NotificationHandler> = new Map();
  
  constructor() {
    // Register default notification handlers
    this.registerNotificationHandler('email', new EmailNotificationHandler());
    this.registerNotificationHandler('sms', new SmsNotificationHandler());
    this.registerNotificationHandler('push', new PushNotificationHandler());
    this.registerNotificationHandler('webhook', new WebhookNotificationHandler());
  }  /**

   * Create a new market alert
   * @param alertConfig Alert configuration
   * @returns Created alert configuration
   */
  async createAlert(alertConfig: Omit<MarketAlertConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarketAlertConfig> {
    // Generate ID and timestamps
    const id = uuidv4();
    const now = new Date();
    
    // Create the alert
    const newAlert: MarketAlertConfig = {
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
  async updateAlert(alertId: string, updates: Partial<MarketAlertConfig>): Promise<MarketAlertConfig> {
    // Get the existing alert
    const existingAlert = this.alerts.get(alertId);
    
    if (!existingAlert) {
      throw new Error(`Alert not found: ${alertId}`);
    }
    
    // Update the alert
    const updatedAlert: MarketAlertConfig = {
      ...existingAlert,
      ...updates,
      id: existingAlert.id, // Ensure ID doesn't change
      createdAt: existingAlert.createdAt, // Ensure creation date doesn't change
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
  async deleteAlert(alertId: string): Promise<boolean> {
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
  async getAlert(alertId: string): Promise<MarketAlertConfig | null> {
    return this.alerts.get(alertId) || null;
  }
  
  /**
   * List market alerts for a user
   * @param userId User ID
   * @returns List of alert configurations
   */
  async listAlerts(userId: string): Promise<MarketAlertConfig[]> {
    // Filter alerts by user ID
    return Array.from(this.alerts.values()).filter(alert => alert.userId === userId);
  }
  
  /**
   * Enable a market alert
   * @param alertId Alert ID
   * @returns Updated alert configuration
   */
  async enableAlert(alertId: string): Promise<MarketAlertConfig> {
    return this.updateAlert(alertId, { enabled: true });
  }
  
  /**
   * Disable a market alert
   * @param alertId Alert ID
   * @returns Updated alert configuration
   */
  async disableAlert(alertId: string): Promise<MarketAlertConfig> {
    return this.updateAlert(alertId, { enabled: false });
  }
  
  /**
   * Process a market data point and trigger alerts if conditions are met
   * @param dataPoint Market data point
   * @returns List of triggered alerts
   */
  async processDataPoint(dataPoint: MarketDataPoint): Promise<MarketAlert[]> {
    const triggeredAlerts: MarketAlert[] = [];
    
    // Find alerts that match this data point
    const matchingAlerts = Array.from(this.alerts.values()).filter(alert => 
      alert.enabled && 
      alert.symbol === dataPoint.symbol && 
      alert.dataType === dataPoint.dataType
    );
    
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
  }  /**
   
* Register a notification handler
   * @param type Notification type
   * @param handler Notification handler
   */
  registerNotificationHandler(type: string, handler: NotificationHandler): void {
    this.notificationHandlers.set(type, handler);
  }
  
  /**
   * Get alert history
   * @param alertId Alert ID
   * @returns List of triggered alerts
   */
  async getAlertHistory(alertId: string): Promise<MarketAlert[]> {
    return this.alertHistory.get(alertId) || [];
  }
  
  // Private helper methods
  
  /**
   * Check if an alert is in cooldown period
   * @param alert Alert configuration
   * @returns True if in cooldown period
   */
  private isInCooldown(alert: MarketAlertConfig): boolean {
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
  private checkCondition(
    alert: MarketAlertConfig, 
    dataPoint: MarketDataPoint
  ): { conditionMet: boolean; value: number; comparisonValue?: number } {
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
  private extractValue(dataPoint: MarketDataPoint): number {
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
  private getComparisonValue(alert: MarketAlertConfig, dataPoint: MarketDataPoint): number | undefined {
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
  private async createMarketAlert(
    alertConfig: MarketAlertConfig,
    dataPoint: MarketDataPoint,
    value: number,
    comparisonValue?: number
  ): Promise<MarketAlert> {
    // Generate alert message
    const message = this.generateAlertMessage(alertConfig, dataPoint, value, comparisonValue);
    
    // Determine severity
    const severity = this.determineSeverity(alertConfig, value, comparisonValue);
    
    // Create alert
    return {
      id: uuidv4(),
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
  private generateAlertMessage(
    alertConfig: MarketAlertConfig,
    dataPoint: MarketDataPoint,
    value: number,
    comparisonValue?: number
  ): string {
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
  private determineSeverity(
    alertConfig: MarketAlertConfig,
    value: number,
    comparisonValue?: number
  ): 'info' | 'warning' | 'critical' {
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
        } else if (percentChange > 5) {
          return 'warning';
        }
      }
    }
    
    // For threshold crossings, determine severity based on distance from threshold
    if (condition === 'greater-than' || condition === 'less-than') {
      const distance = Math.abs(value - threshold) / threshold;
      
      if (distance > 0.1) {
        return 'critical';
      } else if (distance > 0.05) {
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
  private async sendNotifications(alertConfig: MarketAlertConfig, alert: MarketAlert): Promise<void> {
    // Send notifications to all enabled channels
    for (const channel of alertConfig.notificationChannels) {
      if (channel.enabled) {
        const handler = this.notificationHandlers.get(channel.type);
        
        if (handler) {
          try {
            await handler.sendNotification(channel.destination, alert);
          } catch (error) {
            console.error(`Error sending ${channel.type} notification:`, error);
          }
        }
      }
    }
  }
}

/**
 * Notification handler interface
 */
interface NotificationHandler {
  sendNotification(destination: string, alert: MarketAlert): Promise<void>;
}

/**
 * Email notification handler
 */
class EmailNotificationHandler implements NotificationHandler {
  async sendNotification(destination: string, alert: MarketAlert): Promise<void> {
    // In a real implementation, this would send an email
    console.log(`[EMAIL] Sending alert to ${destination}: ${alert.message}`);
  }
}

/**
 * SMS notification handler
 */
class SmsNotificationHandler implements NotificationHandler {
  async sendNotification(destination: string, alert: MarketAlert): Promise<void> {
    // In a real implementation, this would send an SMS
    console.log(`[SMS] Sending alert to ${destination}: ${alert.message}`);
  }
}

/**
 * Push notification handler
 */
class PushNotificationHandler implements NotificationHandler {
  async sendNotification(destination: string, alert: MarketAlert): Promise<void> {
    // In a real implementation, this would send a push notification
    console.log(`[PUSH] Sending alert to ${destination}: ${alert.message}`);
  }
}

/**
 * Webhook notification handler
 */
class WebhookNotificationHandler implements NotificationHandler {
  async sendNotification(destination: string, alert: MarketAlert): Promise<void> {
    // In a real implementation, this would send a webhook request
    console.log(`[WEBHOOK] Sending alert to ${destination}: ${alert.message}`);
  }
}