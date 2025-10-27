"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const awsServerlessExpress = __importStar(require("aws-serverless-express"));
const server_1 = __importDefault(require("./server"));
// Create the server
const server = awsServerlessExpress.createServer(server_1.default);
/**
 * Lambda handler for API Gateway events
 */
const handler = (event, context) => {
    // Log the incoming request
    console.log(`API Gateway event: ${JSON.stringify(event)}`);
    // Handle the request
    return awsServerlessExpress.proxy(server, event, context, 'PROMISE').promise;
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2FwaS9sYW1iZGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSw2RUFBK0Q7QUFDL0Qsc0RBQTJCO0FBRTNCLG9CQUFvQjtBQUNwQixNQUFNLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQyxZQUFZLENBQUMsZ0JBQUcsQ0FBQyxDQUFDO0FBRXREOztHQUVHO0FBQ0ksTUFBTSxPQUFPLEdBQUcsQ0FBQyxLQUEyQixFQUFFLE9BQWdCLEVBQWtDLEVBQUU7SUFDdkcsMkJBQTJCO0lBQzNCLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBRTNELHFCQUFxQjtJQUNyQixPQUFPLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFDL0UsQ0FBQyxDQUFDO0FBTlcsUUFBQSxPQUFPLFdBTWxCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCwgQ29udGV4dCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgYXdzU2VydmVybGVzc0V4cHJlc3MgZnJvbSAnYXdzLXNlcnZlcmxlc3MtZXhwcmVzcyc7XG5pbXBvcnQgYXBwIGZyb20gJy4vc2VydmVyJztcblxuLy8gQ3JlYXRlIHRoZSBzZXJ2ZXJcbmNvbnN0IHNlcnZlciA9IGF3c1NlcnZlcmxlc3NFeHByZXNzLmNyZWF0ZVNlcnZlcihhcHApO1xuXG4vKipcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBBUEkgR2F0ZXdheSBldmVudHNcbiAqL1xuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSAoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBjb250ZXh0OiBDb250ZXh0KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+ID0+IHtcbiAgLy8gTG9nIHRoZSBpbmNvbWluZyByZXF1ZXN0XG4gIGNvbnNvbGUubG9nKGBBUEkgR2F0ZXdheSBldmVudDogJHtKU09OLnN0cmluZ2lmeShldmVudCl9YCk7XG4gIFxuICAvLyBIYW5kbGUgdGhlIHJlcXVlc3RcbiAgcmV0dXJuIGF3c1NlcnZlcmxlc3NFeHByZXNzLnByb3h5KHNlcnZlciwgZXZlbnQsIGNvbnRleHQsICdQUk9NSVNFJykucHJvbWlzZTtcbn07Il19