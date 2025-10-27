"use strict";
/**
 * Example usage of the market data integration module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMarketDataExample = void 0;
const services_1 = require("../services");
const validation_1 = require("../utils/validation");
/**
 * Run the market data example
 */
async function runMarketDataExample() {
    console.log('Starting market data integration example...');
    try {
        // Initialize components
        const alertService = new services_1.MarketAlertService();
        const storage = new services_1.TimestreamStorage();
        const marketDataService = new services_1.MarketDataService(storage, alertService);
        // Initialize storage
        const storageConfig = {
            storageType: 'timestream',
            retentionPeriod: {
                highResolution: 7,
                lowResolution: 365 // 1 year
            },
            aggregationIntervals: ['1min', '1hour', 'daily'],
            compressionEnabled: true
        };
        await marketDataService.initialize(storageConfig);
        console.log('Market data service initialized');
        // Register provider
        const alphaVantageProvider = new services_1.AlphaVantageProvider();
        marketDataService.registerProvider('alpha-vantage', alphaVantageProvider, true);
        console.log('Alpha Vantage provider registered');
        // Connect to market data feed
        const feedConfig = {
            provider: 'alpha-vantage',
            apiKey: 'demo',
            dataTypes: ['price', 'volume', 'technical-indicators'],
            symbols: ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META'],
            interval: '15min',
            maxHistoricalDays: 30,
            refreshInterval: 60000 // 1 minute
        };
        // Validate feed configuration
        const validationResult = (0, validation_1.validateMarketDataFeedConfig)(feedConfig);
        if (!validationResult.valid) {
            console.error('Invalid feed configuration:', validationResult.errors);
            return;
        }
        const connectionStatus = await marketDataService.connectToFeed(feedConfig);
        console.log('Connection status:', connectionStatus);
        // Create market alert
        const emailChannel = {
            type: 'email',
            destination: 'user@example.com',
            enabled: true
        };
        const smsChannel = {
            type: 'sms',
            destination: '+1234567890',
            enabled: false
        };
        const alertConfig = {
            name: 'AAPL Price Alert',
            description: 'Alert when AAPL price changes significantly',
            symbol: 'AAPL',
            dataType: 'price',
            condition: 'percent-change-up',
            threshold: 5,
            comparisonValue: 'previous',
            enabled: true,
            cooldownPeriod: 3600000,
            userId: 'user123',
            notificationChannels: [emailChannel, smsChannel]
        };
        const createdAlert = await marketDataService.createAlert(alertConfig);
        console.log('Created alert:', createdAlert);
        // Query historical data
        const now = new Date();
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const query = {
            symbols: ['AAPL', 'MSFT'],
            dataTypes: ['price'],
            timeRange: {
                start: oneMonthAgo,
                end: now
            },
            interval: 'daily',
            aggregation: 'ohlc',
            limit: 10
        };
        const queryResult = await marketDataService.queryData(query);
        console.log(`Query returned ${queryResult.data.length} data points`);
        console.log('First data point:', queryResult.data[0]);
        // Normalize data
        const normalizedResult = marketDataService.normalizeData(queryResult.data, {
            adjustForSplits: true,
            adjustForDividends: true,
            fillGaps: true,
            fillMethod: 'linear',
            timezone: 'America/New_York',
            convertCurrency: false
        });
        console.log(`Normalized ${normalizedResult.normalizedData.length} data points`);
        console.log('Transformations:', normalizedResult.transformations);
        // Disconnect from feed
        await marketDataService.disconnectFromFeed('alpha-vantage');
        console.log('Disconnected from Alpha Vantage');
        console.log('Market data integration example completed successfully');
    }
    catch (error) {
        console.error('Error in market data example:', error);
    }
}
exports.runMarketDataExample = runMarketDataExample;
// Run the example if this file is executed directly
if (require.main === module) {
    runMarketDataExample().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2V0LWRhdGEtZXhhbXBsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGFtcGxlcy9tYXJrZXQtZGF0YS1leGFtcGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7O0FBR0gsMENBS3FCO0FBUXJCLG9EQUFtRTtBQUVuRTs7R0FFRztBQUNILEtBQUssVUFBVSxvQkFBb0I7SUFDakMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO0lBRTNELElBQUk7UUFDRix3QkFBd0I7UUFDeEIsTUFBTSxZQUFZLEdBQUcsSUFBSSw2QkFBa0IsRUFBRSxDQUFDO1FBQzlDLE1BQU0sT0FBTyxHQUFHLElBQUksNEJBQWlCLEVBQUUsQ0FBQztRQUN4QyxNQUFNLGlCQUFpQixHQUFHLElBQUksNEJBQWlCLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBRXZFLHFCQUFxQjtRQUNyQixNQUFNLGFBQWEsR0FBNEI7WUFDN0MsV0FBVyxFQUFFLFlBQVk7WUFDekIsZUFBZSxFQUFFO2dCQUNmLGNBQWMsRUFBRSxDQUFDO2dCQUNqQixhQUFhLEVBQUUsR0FBRyxDQUFDLFNBQVM7YUFDN0I7WUFDRCxvQkFBb0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDO1lBQ2hELGtCQUFrQixFQUFFLElBQUk7U0FDekIsQ0FBQztRQUVGLE1BQU0saUJBQWlCLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ2xELE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLENBQUMsQ0FBQztRQUUvQyxvQkFBb0I7UUFDcEIsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLCtCQUFvQixFQUFFLENBQUM7UUFDeEQsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsZUFBZSxFQUFFLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hGLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUNBQW1DLENBQUMs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bWFya2V0IGRhdGEgaW50ZWdyYXRpb24gbW9kdWxlXG4gKi9cblxuaW1wb3J0IHsgdjQgYXMgdXVpZHY0IH0gZnJvbSAndXVpZCc7XG5pbXBvcnQge1xuICBNYXJrZXREYXRhU2VydmljZSxcbiAgQWxwaGFWYW50YWdlUHJvdmlkZXIsXG4gIFRpbWVzdHJlYW1TdG9yYWdlLFxuICBNYXJrZXRBbGVydFNlcnZpY2Vcbn0gZnJvbSAnLi4vc2VydmljZXMnO1xuaW1wb3J0IHtcbiAgTWFya2V0RGF0YUZlZWRDb25maWcsXG4gIE1hcmtldERhdGFTdG9yYWdlQ29uZmlnLFxuICBNYXJrZXREYXRhUXVlcnksXG4gIE1hcmtldEFsZXJ0Q29uZmlnLFxuICBOb3RpZmljYXRpb25DaGFubmVsXG59IGZyb20gJy4uL21vZGVscy9tYXJrZXQtZGF0YSc7XG5pbXBvcnQgeyB2YWxpZGF0ZU1hcmtldERhdGFGZWVkQ29uZmlnIH0gZnJvbSAnLi4vdXRpbHMvdmFsaWRhdGlvbic7XG5cbi8qKlxuICogUnVuIHRoZSBtYXJrZXQgZGF0YSBleGFtcGxlXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJ1bk1hcmtldERhdGFFeGFtcGxlKCkge1xuICBjb25zb2xlLmxvZygnU3RhcnRpbmcgbWFya2V0IGRhdGEgaW50ZWdyYXRpb24gZXhhbXBsZS4uLicpO1xuICBcbiAgdHJ5IHtcbiAgICAvLyBJbml0aWFsaXplIGNvbXBvbmVudHNcbiAgICBjb25zdCBhbGVydFNlcnZpY2UgPSBuZXcgTWFya2V0QWxlcnRTZXJ2aWNlKCk7XG4gICAgY29uc3Qgc3RvcmFnZSA9IG5ldyBUaW1lc3RyZWFtU3RvcmFnZSgpO1xuICAgIGNvbnN0IG1hcmtldERhdGFTZXJ2aWNlID0gbmV3IE1hcmtldERhdGFTZXJ2aWNlKHN0b3JhZ2UsIGFsZXJ0U2VydmljZSk7XG4gICAgXG4gICAgLy8gSW5pdGlhbGl6ZSBzdG9yYWdlXG4gICAgY29uc3Qgc3RvcmFnZUNvbmZpZzogTWFya2V0RGF0YVN0b3JhZ2VDb25maWcgPSB7XG4gICAgICBzdG9yYWdlVHlwZTogJ3RpbWVzdHJlYW0nLFxuICAgICAgcmV0ZW50aW9uUGVyaW9kOiB7XG4gICAgICAgIGhpZ2hSZXNvbHV0aW9uOiA3LCAvLyA3IGRheXNcbiAgICAgICAgbG93UmVzb2x1dGlvbjogMzY1IC8vIDEgeWVhclxuICAgICAgfSxcbiAgICAgIGFnZ3JlZ2F0aW9uSW50ZXJ2YWxzOiBbJzFtaW4nLCAnMWhvdXInLCAnZGFpbHknXSxcbiAgICAgIGNvbXByZXNzaW9uRW5hYmxlZDogdHJ1ZVxuICAgIH07XG4gICAgXG4gICAgYXdhaXQgbWFya2V0RGF0YVNlcnZpY2UuaW5pdGlhbGl6ZShzdG9yYWdlQ29uZmlnKTtcbiAgICBjb25zb2xlLmxvZygnTWFya2V0IGRhdGEgc2VydmljZSBpbml0aWFsaXplZCcpO1xuICAgIFxuICAgIC8vIFJlZ2lzdGVyIHByb3ZpZGVyXG4gICAgY29uc3QgYWxwaGFWYW50YWdlUHJvdmlkZXIgPSBuZXcgQWxwaGFWYW50YWdlUHJvdmlkZXIoKTtcbiAgICBtYXJrZXREYXRhU2VydmljZS5yZWdpc3RlclByb3ZpZGVyKCdhbHBoYS12YW50YWdlJywgYWxwaGFWYW50YWdlUHJvdmlkZXIsIHRydWUpO1xuICAgIGNvbnNvbGUubG9nKCdBbHBoYSBWYW50YWdlIHByb3ZpZGVyIHJlZ2lzdGVyZWQnKTtcbiAgICAgXG4gICAvLyBDb25uZWN0IHRvIG1hcmtldCBkYXRhIGZlZWRcbiAgICBjb25zdCBmZWVkQ29uZmlnOiBNYXJrZXREYXRhRmVlZENvbmZpZyA9IHtcbiAgICAgIHByb3ZpZGVyOiAnYWxwaGEtdmFudGFnZScsXG4gICAgICBhcGlLZXk6ICdkZW1vJywgLy8gUmVwbGFjZSB3aXRoIGFjdHVhbCBBUEkga2V5XG4gICAgICBkYXRhVHlwZXM6IFsncHJpY2UnLCAndm9sdW1lJywgJ3RlY2huaWNhbC1pbmRpY2F0b3JzJ10sXG4gICAgICBzeW1ib2xzOiBbJ0FBUEwnLCAnTVNGVCcsICdBTVpOJywgJ0dPT0dMJywgJ01FVEEnXSxcbiAgICAgIGludGVydmFsOiAnMTVtaW4nLFxuICAgICAgbWF4SGlzdG9yaWNhbERheXM6IDMwLFxuICAgICAgcmVmcmVzaEludGVydmFsOiA2MDAwMCAvLyAxIG1pbnV0ZVxuICAgIH07XG4gICAgXG4gICAgLy8gVmFsaWRhdGUgZmVlZCBjb25maWd1cmF0aW9uXG4gICAgY29uc3QgdmFsaWRhdGlvblJlc3VsdCA9IHZhbGlkYXRlTWFya2V0RGF0YUZlZWRDb25maWcoZmVlZENvbmZpZyk7XG4gICAgaWYgKCF2YWxpZGF0aW9uUmVzdWx0LnZhbGlkKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdJbnZhbGlkIGZlZWQgY29uZmlndXJhdGlvbjonLCB2YWxpZGF0aW9uUmVzdWx0LmVycm9ycyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IGNvbm5lY3Rpb25TdGF0dXMgPSBhd2FpdCBtYXJrZXREYXRhU2VydmljZS5jb25uZWN0VG9GZWVkKGZlZWRDb25maWcpO1xuICAgIGNvbnNvbGUubG9nKCdDb25uZWN0aW9uIHN0YXR1czonLCBjb25uZWN0aW9uU3RhdHVzKTtcbiAgICBcbiAgICAvLyBDcmVhdGUgbWFya2V0IGFsZXJ0XG4gICAgY29uc3QgZW1haWxDaGFubmVsOiBOb3RpZmljYXRpb25DaGFubmVsID0ge1xuICAgICAgdHlwZTogJ2VtYWlsJyxcbiAgICAgIGRlc3RpbmF0aW9uOiAndXNlckBleGFtcGxlLmNvbScsXG4gICAgICBlbmFibGVkOiB0cnVlXG4gICAgfTtcbiAgICBcbiAgICBjb25zdCBzbXNDaGFubmVsOiBOb3RpZmljYXRpb25DaGFubmVsID0ge1xuICAgICAgdHlwZTogJ3NtcycsXG4gICAgICBkZXN0aW5hdGlvbjogJysxMjM0NTY3ODkwJyxcbiAgICAgIGVuYWJsZWQ6IGZhbHNlXG4gICAgfTtcbiAgICBcbiAgICBjb25zdCBhbGVydENvbmZpZzogT21pdDxNYXJrZXRBbGVydENvbmZpZywgJ2lkJyB8ICdjcmVhdGVkQXQnIHwgJ3VwZGF0ZWRBdCc+ID0ge1xuICAgICAgbmFtZTogJ0FBUEwgUHJpY2UgQWxlcnQnLFxuICAgICAgZGVzY3JpcHRpb246ICdBbGVydCB3aGVuIEFBUEwgcHJpY2UgY2hhbmdlcyBzaWduaWZpY2FudGx5JyxcbiAgICAgIHN5bWJvbDogJ0FBUEwnLFxuICAgICAgZGF0YVR5cGU6ICdwcmljZScsXG4gICAgICBjb25kaXRpb246ICdwZXJjZW50LWNoYW5nZS11cCcsXG4gICAgICB0aHJlc2hvbGQ6IDUsIC8vIDUlIGNoYW5nZVxuICAgICAgY29tcGFyaXNvblZhbHVlOiAncHJldmlvdXMnLFxuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIGNvb2xkb3duUGVyaW9kOiAzNjAwMDAwLCAvLyAxIGhvdXJcbiAgICAgIHVzZXJJZDogJ3VzZXIxMjMnLFxuICAgICAgbm90aWZpY2F0aW9uQ2hhbm5lbHM6IFtlbWFpbENoYW5uZWwsIHNtc0NoYW5uZWxdXG4gICAgfTtcbiAgICBcbiAgICBjb25zdCBjcmVhdGVkQWxlcnQgPSBhd2FpdCBtYXJrZXREYXRhU2VydmljZS5jcmVhdGVBbGVydChhbGVydENvbmZpZyk7XG4gICAgY29uc29sZS5sb2coJ0NyZWF0ZWQgYWxlcnQ6JywgY3JlYXRlZEFsZXJ0KTtcbiAgICAgIFxuICAvLyBRdWVyeSBoaXN0b3JpY2FsIGRhdGFcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IG9uZU1vbnRoQWdvID0gbmV3IERhdGUobm93LmdldFRpbWUoKSAtIDMwICogMjQgKiA2MCAqIDYwICogMTAwMCk7XG4gICAgXG4gICAgY29uc3QgcXVlcnk6IE1hcmtldERhdGFRdWVyeSA9IHtcbiAgICAgIHN5bWJvbHM6IFsnQUFQTCcsICdNU0ZUJ10sXG4gICAgICBkYXRhVHlwZXM6IFsncHJpY2UnXSxcbiAgICAgIHRpbWVSYW5nZToge1xuICAgICAgICBzdGFydDogb25lTW9udGhBZ28sXG4gICAgICAgIGVuZDogbm93XG4gICAgICB9LFxuICAgICAgaW50ZXJ2YWw6ICdkYWlseScsXG4gICAgICBhZ2dyZWdhdGlvbjogJ29obGMnLFxuICAgICAgbGltaXQ6IDEwXG4gICAgfTtcbiAgICBcbiAgICBjb25zdCBxdWVyeVJlc3VsdCA9IGF3YWl0IG1hcmtldERhdGFTZXJ2aWNlLnF1ZXJ5RGF0YShxdWVyeSk7XG4gICAgY29uc29sZS5sb2coYFF1ZXJ5IHJldHVybmVkICR7cXVlcnlSZXN1bHQuZGF0YS5sZW5ndGh9IGRhdGEgcG9pbnRzYCk7XG4gICAgY29uc29sZS5sb2coJ0ZpcnN0IGRhdGEgcG9pbnQ6JywgcXVlcnlSZXN1bHQuZGF0YVswXSk7XG4gICAgXG4gICAgLy8gTm9ybWFsaXplIGRhdGFcbiAgICBjb25zdCBub3JtYWxpemVkUmVzdWx0ID0gbWFya2V0RGF0YVNlcnZpY2Uubm9ybWFsaXplRGF0YShxdWVyeVJlc3VsdC5kYXRhLCB7XG4gICAgICBhZGp1c3RGb3JTcGxpdHM6IHRydWUsXG4gICAgICBhZGp1c3RGb3JEaXZpZGVuZHM6IHRydWUsXG4gICAgICBmaWxsR2FwczogdHJ1ZSxcbiAgICAgIGZpbGxNZXRob2Q6ICdsaW5lYXInLFxuICAgICAgdGltZXpvbmU6ICdBbWVyaWNhL05ld19Zb3JrJyxcbiAgICAgIGNvbnZlcnRDdXJyZW5jeTogZmFsc2VcbiAgICB9KTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhgTm9ybWFsaXplZCAke25vcm1hbGl6ZWRSZXN1bHQubm9ybWFsaXplZERhdGEubGVuZ3RofSBkYXRhIHBvaW50c2ApO1xuICAgIGNvbnNvbGUubG9nKCdUcmFuc2Zvcm1hdGlvbnM6Jywgbm9ybWFsaXplZFJlc3VsdC50cmFuc2Zvcm1hdGlvbnMpO1xuICAgIFxuICAgIC8vIERpc2Nvbm5lY3QgZnJvbSBmZWVkXG4gICAgYXdhaXQgbWFya2V0RGF0YVNlcnZpY2UuZGlzY29ubmVjdEZyb21GZWVkKCdhbHBoYS12YW50YWdlJyk7XG4gICAgY29uc29sZS5sb2coJ0Rpc2Nvbm5lY3RlZCBmcm9tIEFscGhhIFZhbnRhZ2UnKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygnTWFya2V0IGRhdGEgaW50ZWdyYXRpb24gZXhhbXBsZSBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gbWFya2V0IGRhdGEgZXhhbXBsZTonLCBlcnJvcik7XG4gIH1cbn1cblxuLy8gUnVuIHRoZSBleGFtcGxlIGlmIHRoaXMgZmlsZSBpcyBleGVjdXRlZCBkaXJlY3RseVxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIHJ1bk1hcmtldERhdGFFeGFtcGxlKCkuY2F0Y2goZXJyb3IgPT4ge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1VuaGFuZGxlZCBlcnJvcjonLCBlcnJvcik7XG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9KTtcbn1cblxuZXhwb3J0IHsgcnVuTWFya2V0RGF0YUV4YW1wbGUgfTsiXX0=