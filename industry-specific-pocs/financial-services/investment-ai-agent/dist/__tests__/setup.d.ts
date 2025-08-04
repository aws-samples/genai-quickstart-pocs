/**
 * Test setup and configuration
 */
declare global {
    var testUtils: {
        wait: (ms: number) => Promise<void>;
        mockDate: (dateString: string) => Date;
        generateTestId: () => string;
    };
    namespace jest {
        interface Matchers<R> {
            toBeValidUUID(): R;
            toBeValidEmail(): R;
        }
    }
}
export {};
