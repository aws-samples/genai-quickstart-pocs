import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

export class RateLimiter {
    private static instance: RateLimiter;
    private lastInvocationTime: number | null = null;
    private rateLimitSeconds: number;

    private static async initializeRateLimit(): Promise<number> {
        const ssm = new SSMClient({});
        const parameterPath = 'AGENT_RATE_LIMIT';
        console.log(`RateLimiter: Attempting to fetch rate limit from Parameter Store at path: ${parameterPath}`);
        const startTime = Date.now();

        try {
            const command = new GetParameterCommand({
                Name: parameterPath,
                WithDecryption: false
            });
            const result = await ssm.send(command);
            const fetchDuration = Date.now() - startTime;

            if (!result.Parameter?.Value) {
                console.log('RateLimiter: No rate limit value found in Parameter Store');
                console.log(`RateLimiter: Parameter Store fetch took ${fetchDuration}ms`);
                return 0;
            }

            const rateLimit = parseInt(result.Parameter.Value);
            if (isNaN(rateLimit)) {
                console.error(`RateLimiter: Invalid rate limit value: ${result.Parameter.Value}. Using default rate limit of 0 seconds.`);
                return 0;
            }

            console.log(`RateLimiter: Found rate limit value: ${rateLimit} seconds`);
            console.log(`RateLimiter: Parameter Store fetch took ${fetchDuration}ms`);
            return rateLimit;
        } catch (error) {
            const fetchDuration = Date.now() - startTime;
            console.error('RateLimiter: Error fetching rate limit from Parameter Store:', error);
            console.log(`RateLimiter: Parameter Store fetch took ${fetchDuration}ms`);
            return 0;
        }
    }

    private constructor() {
        this.rateLimitSeconds = 0;
    }

    public static async getInstance(): Promise<RateLimiter> {
        if (!RateLimiter.instance) {
            RateLimiter.instance = new RateLimiter();
            RateLimiter.instance.rateLimitSeconds = await RateLimiter.initializeRateLimit();
        }
        return RateLimiter.instance;
    }

    public async waitForRateLimit(): Promise<void> {
        if (this.rateLimitSeconds <= 0) {
            console.log('RateLimiter: Skipping rate limiting as it is not configured.');
            return;
        }

        const now = Date.now();
        if (this.lastInvocationTime !== null) {
            const timeSinceLastInvocation = now - this.lastInvocationTime;
            const waitTime = Math.max(0, (this.rateLimitSeconds * 1000) - timeSinceLastInvocation);

            if (waitTime > 0) {
                console.log(`RateLimiter: Pausing for ${waitTime}ms due to rate limit threshold being met`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                console.log(`RateLimiter: Below threshold (last call ${timeSinceLastInvocation}ms ago)`);
            }
        }

        this.lastInvocationTime = now;
    }
}