/**
 * Mock data for testing
 */
import { User, InvestmentIdea, MarketDataPoint, Feedback } from '../models';
export declare const mockUsers: User[];
export declare const mockInvestmentIdeas: InvestmentIdea[];
export declare const mockMarketData: MarketDataPoint[];
export declare const mockFeedback: Feedback[];
export declare const createMockUser: (overrides?: Partial<User>) => User;
export declare const createMockInvestmentIdea: (overrides?: Partial<InvestmentIdea>) => InvestmentIdea;
export declare const createMockRequest: (overrides?: any) => any;
export declare const createMockMarketDataPoint: (overrides?: Partial<MarketDataPoint>) => MarketDataPoint;
export declare const createMockFeedback: (overrides?: Partial<Feedback>) => Feedback;
export declare const mockApiResponses: {
    bedrockInvokeModel: {
        body: Uint8Array;
    };
    marketDataApi: {
        'Global Quote': {
            '01. symbol': string;
            '05. price': string;
            '07. latest trading day': string;
            '09. change': string;
            '10. change percent': string;
        };
    };
};
export declare const testUtils: {
    randomString: (length?: number) => string;
    randomNumber: (min?: number, max?: number) => number;
    randomDate: (start?: Date, end?: Date) => Date;
    waitFor: (condition: () => boolean, timeout?: number) => Promise<void>;
};
