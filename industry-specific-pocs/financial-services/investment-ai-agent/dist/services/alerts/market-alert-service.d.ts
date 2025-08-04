/**
 * Market data alert service implementation
 */
import { MarketAlertConfig, MarketAlert, MarketDataPoint } from '../../models/market-data';
import { MarketDataAlertService } from '../market-data-service';
/**
 * Market data alert service implementation
 */
export declare class MarketAlertService implements MarketDataAlertService {
    private alerts;
    private alertHistory;
    private notificationHandlers;
    constructor(); /**
  
     * Create a new market alert
     * @param alertConfig Alert configuration
     * @returns Created alert configuration
     */
    createAlert(alertConfig: Omit<MarketAlertConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarketAlertConfig>;
    /**
     * Update an existing market alert
     * @param alertId Alert ID
     * @param updates Alert updates
     * @returns Updated alert configuration
     */
    updateAlert(alertId: string, updates: Partial<MarketAlertConfig>): Promise<MarketAlertConfig>;
    /**
     * Delete a market alert
     * @param alertId Alert ID
     * @returns True if deletion was successful
     */
    deleteAlert(alertId: string): Promise<boolean>;
    /**
       * Get a market alert by ID
       * @param alertId Alert ID
       * @returns Alert configuration or null if not found
       */
    getAlert(alertId: string): Promise<MarketAlertConfig | null>;
    /**
     * List market alerts for a user
     * @param userId User ID
     * @returns List of alert configurations
     */
    listAlerts(userId: string): Promise<MarketAlertConfig[]>;
    /**
     * Enable a market alert
     * @param alertId Alert ID
     * @returns Updated alert configuration
     */
    enableAlert(alertId: string): Promise<MarketAlertConfig>;
    /**
     * Disable a market alert
     * @param alertId Alert ID
     * @returns Updated alert configuration
     */
    disableAlert(alertId: string): Promise<MarketAlertConfig>;
    /**
     * Process a market data point and trigger alerts if conditions are met
     * @param dataPoint Market data point
     * @returns List of triggered alerts
     */
    processDataPoint(dataPoint: MarketDataPoint): Promise<MarketAlert[]>; /**
     
  * Register a notification handler
     * @param type Notification type
     * @param handler Notification handler
     */
    registerNotificationHandler(type: string, handler: NotificationHandler): void;
    /**
     * Get alert history
     * @param alertId Alert ID
     * @returns List of triggered alerts
     */
    getAlertHistory(alertId: string): Promise<MarketAlert[]>;
    /**
     * Check if an alert is in cooldown period
     * @param alert Alert configuration
     * @returns True if in cooldown period
     */
    private isInCooldown;
    /**
     * Check if an alert condition is met
     * @param alert Alert configuration
     * @param dataPoint Market data point
     * @returns Condition check result
     */
    private checkCondition;
    /**
      * Extract a numeric value from a market data point
      * @param dataPoint Market data point
      * @returns Numeric value
      */
    private extractValue;
    /**
     * Get comparison value for an alert
     * @param alert Alert configuration
     * @param dataPoint Current market data point
     * @returns Comparison value
     */
    private getComparisonValue;
    /**
     * Create a market alert
     * @param alertConfig Alert configuration
     * @param dataPoint Market data point that triggered the alert
     * @param value Triggered value
     * @param comparisonValue Comparison value
     * @returns Created market alert
     */
    private createMarketAlert;
    /**
     * Generate alert message
     * @param alertConfig Alert configuration
     * @param dataPoint Market data point
     * @param value Triggered value
     * @param comparisonValue Comparison value
     * @returns Alert message
     */
    private generateAlertMessage;
    /**
     * Determine alert severity
     * @param alertConfig Alert configuration
     * @param value Triggered value
     * @param comparisonValue Comparison value
     * @returns Alert severity
     */
    private determineSeverity;
    /**
     * Send notifications for a triggered alert
     * @param alertConfig Alert configuration
     * @param alert Triggered alert
     */
    private sendNotifications;
}
/**
 * Notification handler interface
 */
interface NotificationHandler {
    sendNotification(destination: string, alert: MarketAlert): Promise<void>;
}
export {};
