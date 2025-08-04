"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
/**
 * @route GET /api/v1/health
 * @desc Basic health check endpoint
 * @access Public
 */
router.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            api: 'healthy',
            database: checkDatabaseHealth(),
            bedrock: checkBedrockHealth()
        }
    });
});
/**
 * @route GET /api/v1/health/detailed
 * @desc Detailed health check with component status
 * @access Public
 */
router.get('/detailed', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        components: {
            api: {
                status: 'healthy',
                version: process.env.npm_package_version || 'unknown'
            },
            database: {
                status: checkDatabaseHealth(),
                latency: Math.random() * 10,
                connections: Math.floor(Math.random() * 10) + 1 // Mock active connections
            },
            bedrock: {
                status: checkBedrockHealth(),
                models: {
                    'Claude-Sonnet-3.7': 'available',
                    'Claude-Haiku-3.5': 'available',
                    'Amazon-Nova-Pro': 'available'
                }
            },
            knowledgeService: {
                status: 'healthy',
                lastUpdated: new Date(Date.now() - Math.random() * 3600000).toISOString() // Random time in the last hour
            }
        },
        environment: process.env.NODE_ENV || 'development'
    });
});
/**
 * Mock function to check database health
 * In a real implementation, this would check the actual database connection
 */
function checkDatabaseHealth() {
    // In a real implementation, we would check the database connection
    return 'healthy';
}
/**
 * Mock function to check Bedrock health
 * In a real implementation, this would check the Bedrock service
 */
function checkBedrockHealth() {
    // In a real implementation, we would check the Bedrock service
    return 'healthy';
}
exports.default = router;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVhbHRoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwaS9yb3V0ZXMvaGVhbHRoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscUNBQW9EO0FBRXBELE1BQU0sTUFBTSxHQUFHLElBQUEsZ0JBQU0sR0FBRSxDQUFDO0FBRXhCOzs7O0dBSUc7QUFDSCxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQVksRUFBRSxHQUFhLEVBQUUsRUFBRTtJQUM5QyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNuQixNQUFNLEVBQUUsSUFBSTtRQUNaLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtRQUNuQyxRQUFRLEVBQUU7WUFDUixHQUFHLEVBQUUsU0FBUztZQUNkLFFBQVEsRUFBRSxtQkFBbUIsRUFBRTtZQUMvQixPQUFPLEVBQUUsa0JBQWtCLEVBQUU7U0FDOUI7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVIOzs7O0dBSUc7QUFDSCxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLEdBQVksRUFBRSxHQUFhLEVBQUUsRUFBRTtJQUN0RCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNuQixNQUFNLEVBQUUsSUFBSTtRQUNaLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtRQUNuQyxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRTtRQUN4QixVQUFVLEVBQUU7WUFDVixHQUFHLEVBQUU7Z0JBQ0gsTUFBTSxFQUFFLFNBQVM7Z0JBQ2pCLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixJQUFJLFNBQVM7YUFDdEQ7WUFDRCxRQUFRLEVBQUU7Z0JBQ1IsTUFBTSxFQUFFLG1CQUFtQixFQUFFO2dCQUM3QixPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUU7Z0JBQzNCLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsMEJBQTBCO2FBQzNFO1lBQ0QsT0FBTyxFQUFFO2dCQUNQLE1BQU0sRUFBRSxrQkFBa0IsRUFBRTtnQkFDNUIsTUFBTSxFQUFFO29CQUNOLG1CQUFtQixFQUFFLFdBQVc7b0JBQ2hDLGtCQUFrQixFQUFFLFdBQVc7b0JBQy9CLGlCQUFpQixFQUFFLFdBQVc7aUJBQy9CO2FBQ0Y7WUFDRCxnQkFBZ0IsRUFBRTtnQkFDaEIsTUFBTSxFQUFFLFNBQVM7Z0JBQ2pCLFdBQVcsRUFBRSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLCtCQUErQjthQUMxRztTQUNGO1FBQ0QsV0FBVyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxJQUFJLGFBQWE7S0FDbkQsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFSDs7O0dBR0c7QUFDSCxTQUFTLG1CQUFtQjtJQUMxQixtRUFBbUU7SUFDbkUsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsa0JBQWtCO0lBQ3pCLCtEQUErRDtJQUMvRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBRUQsa0JBQWUsTUFBTSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUm91dGVyLCBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gJ2V4cHJlc3MnO1xuXG5jb25zdCByb3V0ZXIgPSBSb3V0ZXIoKTtcblxuLyoqXG4gKiBAcm91dGUgR0VUIC9hcGkvdjEvaGVhbHRoXG4gKiBAZGVzYyBCYXNpYyBoZWFsdGggY2hlY2sgZW5kcG9pbnRcbiAqIEBhY2Nlc3MgUHVibGljXG4gKi9cbnJvdXRlci5nZXQoJy8nLCAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSA9PiB7XG4gIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICBzdGF0dXM6ICdvaycsXG4gICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgc2VydmljZXM6IHtcbiAgICAgIGFwaTogJ2hlYWx0aHknLFxuICAgICAgZGF0YWJhc2U6IGNoZWNrRGF0YWJhc2VIZWFsdGgoKSxcbiAgICAgIGJlZHJvY2s6IGNoZWNrQmVkcm9ja0hlYWx0aCgpXG4gICAgfVxuICB9KTtcbn0pO1xuXG4vKipcbiAqIEByb3V0ZSBHRVQgL2FwaS92MS9oZWFsdGgvZGV0YWlsZWRcbiAqIEBkZXNjIERldGFpbGVkIGhlYWx0aCBjaGVjayB3aXRoIGNvbXBvbmVudCBzdGF0dXNcbiAqIEBhY2Nlc3MgUHVibGljXG4gKi9cbnJvdXRlci5nZXQoJy9kZXRhaWxlZCcsIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpID0+IHtcbiAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgIHN0YXR1czogJ29rJyxcbiAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB1cHRpbWU6IHByb2Nlc3MudXB0aW1lKCksXG4gICAgY29tcG9uZW50czoge1xuICAgICAgYXBpOiB7XG4gICAgICAgIHN0YXR1czogJ2hlYWx0aHknLFxuICAgICAgICB2ZXJzaW9uOiBwcm9jZXNzLmVudi5ucG1fcGFja2FnZV92ZXJzaW9uIHx8ICd1bmtub3duJ1xuICAgICAgfSxcbiAgICAgIGRhdGFiYXNlOiB7XG4gICAgICAgIHN0YXR1czogY2hlY2tEYXRhYmFzZUhlYWx0aCgpLFxuICAgICAgICBsYXRlbmN5OiBNYXRoLnJhbmRvbSgpICogMTAsIC8vIE1vY2sgbGF0ZW5jeSBpbiBtc1xuICAgICAgICBjb25uZWN0aW9uczogTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTApICsgMSAvLyBNb2NrIGFjdGl2ZSBjb25uZWN0aW9uc1xuICAgICAgfSxcbiAgICAgIGJlZHJvY2s6IHtcbiAgICAgICAgc3RhdHVzOiBjaGVja0JlZHJvY2tIZWFsdGgoKSxcbiAgICAgICAgbW9kZWxzOiB7XG4gICAgICAgICAgJ0NsYXVkZS1Tb25uZXQtMy43JzogJ2F2YWlsYWJsZScsXG4gICAgICAgICAgJ0NsYXVkZS1IYWlrdS0zLjUnOiAnYXZhaWxhYmxlJyxcbiAgICAgICAgICAnQW1hem9uLU5vdmEtUHJvJzogJ2F2YWlsYWJsZSdcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGtub3dsZWRnZVNlcnZpY2U6IHtcbiAgICAgICAgc3RhdHVzOiAnaGVhbHRoeScsXG4gICAgICAgIGxhc3RVcGRhdGVkOiBuZXcgRGF0ZShEYXRlLm5vdygpIC0gTWF0aC5yYW5kb20oKSAqIDM2MDAwMDApLnRvSVNPU3RyaW5nKCkgLy8gUmFuZG9tIHRpbWUgaW4gdGhlIGxhc3QgaG91clxuICAgICAgfVxuICAgIH0sXG4gICAgZW52aXJvbm1lbnQ6IHByb2Nlc3MuZW52Lk5PREVfRU5WIHx8ICdkZXZlbG9wbWVudCdcbiAgfSk7XG59KTtcblxuLyoqXG4gKiBNb2NrIGZ1bmN0aW9uIHRvIGNoZWNrIGRhdGFiYXNlIGhlYWx0aFxuICogSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIGNoZWNrIHRoZSBhY3R1YWwgZGF0YWJhc2UgY29ubmVjdGlvblxuICovXG5mdW5jdGlvbiBjaGVja0RhdGFiYXNlSGVhbHRoKCk6IHN0cmluZyB7XG4gIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgd2Ugd291bGQgY2hlY2sgdGhlIGRhdGFiYXNlIGNvbm5lY3Rpb25cbiAgcmV0dXJuICdoZWFsdGh5Jztcbn1cblxuLyoqXG4gKiBNb2NrIGZ1bmN0aW9uIHRvIGNoZWNrIEJlZHJvY2sgaGVhbHRoXG4gKiBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgY2hlY2sgdGhlIEJlZHJvY2sgc2VydmljZVxuICovXG5mdW5jdGlvbiBjaGVja0JlZHJvY2tIZWFsdGgoKTogc3RyaW5nIHtcbiAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB3ZSB3b3VsZCBjaGVjayB0aGUgQmVkcm9jayBzZXJ2aWNlXG4gIHJldHVybiAnaGVhbHRoeSc7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHJvdXRlcjsiXX0=