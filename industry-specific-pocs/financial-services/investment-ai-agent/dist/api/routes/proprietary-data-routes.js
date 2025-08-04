"use strict";
/**
 * Routes for proprietary data integration API
 */
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
const express_1 = require("express");
const ProprietaryDataController = __importStar(require("../controllers/proprietary-data-controller"));
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    }
});
const router = (0, express_1.Router)();
/**
 * @route POST /api/proprietary-data/upload
 * @desc Upload a proprietary data file
 * @access Private
 */
router.post('/upload', auth_1.authenticateUser, upload.single('file'), ProprietaryDataController.uploadFile);
/**
 * @route GET /api/proprietary-data/files
 * @desc Get a list of proprietary data files
 * @access Private
 */
router.get('/files', auth_1.authenticateUser, ProprietaryDataController.listFiles);
/**
 * @route GET /api/proprietary-data/files/:id
 * @desc Get a proprietary data file by ID
 * @access Private
 */
router.get('/files/:id', auth_1.authenticateUser, ProprietaryDataController.getFile);
/**
 * @route DELETE /api/proprietary-data/files/:id
 * @desc Delete a proprietary data file
 * @access Private
 */
router.delete('/files/:id', auth_1.authenticateUser, ProprietaryDataController.deleteFile);
/**
 * @route PUT /api/proprietary-data/files/:id/access
 * @desc Update access control for a file
 * @access Private
 */
router.put('/files/:id/access', auth_1.authenticateUser, ProprietaryDataController.updateAccessControl);
exports.default = router;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcHJpZXRhcnktZGF0YS1yb3V0ZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYXBpL3JvdXRlcy9wcm9wcmlldGFyeS1kYXRhLXJvdXRlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCxxQ0FBaUM7QUFDakMsc0dBQXdGO0FBQ3hGLDZDQUFzRDtBQUN0RCxvREFBNEI7QUFFNUIsb0NBQW9DO0FBQ3BDLE1BQU0sTUFBTSxHQUFHLElBQUEsZ0JBQU0sRUFBQztJQUNwQixPQUFPLEVBQUUsZ0JBQU0sQ0FBQyxhQUFhLEVBQUU7SUFDL0IsTUFBTSxFQUFFO1FBQ04sUUFBUSxFQUFFLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxFQUFFLGNBQWM7S0FDNUM7Q0FDRixDQUFDLENBQUM7QUFFSCxNQUFNLE1BQU0sR0FBRyxJQUFBLGdCQUFNLEdBQUUsQ0FBQztBQUV4Qjs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLElBQUksQ0FDVCxTQUFTLEVBQ1QsdUJBQWdCLEVBQ2hCLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQ3JCLHlCQUF5QixDQUFDLFVBQVUsQ0FDckMsQ0FBQztBQUVGOzs7O0dBSUc7QUFDSCxNQUFNLENBQUMsR0FBRyxDQUNSLFFBQVEsRUFDUix1QkFBZ0IsRUFDaEIseUJBQXlCLENBQUMsU0FBUyxDQUNwQyxDQUFDO0FBRUY7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxHQUFHLENBQ1IsWUFBWSxFQUNaLHVCQUFnQixFQUNoQix5QkFBeUIsQ0FBQyxPQUFPLENBQ2xDLENBQUM7QUFFRjs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FDWCxZQUFZLEVBQ1osdUJBQWdCLEVBQ2hCLHlCQUF5QixDQUFDLFVBQVUsQ0FDckMsQ0FBQztBQUVGOzs7O0dBSUc7QUFDSCxNQUFNLENBQUMsR0FBRyxDQUNSLG1CQUFtQixFQUNuQix1QkFBZ0IsRUFDaEIseUJBQXlCLENBQUMsbUJBQW1CLENBQzlDLENBQUM7QUFFRixrQkFBZSxNQUFNLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFJvdXRlcyBmb3IgcHJvcHJpZXRhcnkgZGF0YSBpbnRlZ3JhdGlvbiBBUElcbiAqL1xuXG5pbXBvcnQgeyBSb3V0ZXIgfSBmcm9tICdleHByZXNzJztcbmltcG9ydCAqIGFzIFByb3ByaWV0YXJ5RGF0YUNvbnRyb2xsZXIgZnJvbSAnLi4vY29udHJvbGxlcnMvcHJvcHJpZXRhcnktZGF0YS1jb250cm9sbGVyJztcbmltcG9ydCB7IGF1dGhlbnRpY2F0ZVVzZXIgfSBmcm9tICcuLi9taWRkbGV3YXJlL2F1dGgnO1xuaW1wb3J0IG11bHRlciBmcm9tICdtdWx0ZXInO1xuXG4vLyBDb25maWd1cmUgbXVsdGVyIGZvciBmaWxlIHVwbG9hZHNcbmNvbnN0IHVwbG9hZCA9IG11bHRlcih7XG4gIHN0b3JhZ2U6IG11bHRlci5tZW1vcnlTdG9yYWdlKCksXG4gIGxpbWl0czoge1xuICAgIGZpbGVTaXplOiAxMDAgKiAxMDI0ICogMTAyNCwgLy8gMTAwTUIgbGltaXRcbiAgfVxufSk7XG5cbmNvbnN0IHJvdXRlciA9IFJvdXRlcigpO1xuXG4vKipcbiAqIEByb3V0ZSBQT1NUIC9hcGkvcHJvcHJpZXRhcnktZGF0YS91cGxvYWRcbiAqIEBkZXNjIFVwbG9hZCBhIHByb3ByaWV0YXJ5IGRhdGEgZmlsZVxuICogQGFjY2VzcyBQcml2YXRlXG4gKi9cbnJvdXRlci5wb3N0KFxuICAnL3VwbG9hZCcsXG4gIGF1dGhlbnRpY2F0ZVVzZXIsXG4gIHVwbG9hZC5zaW5nbGUoJ2ZpbGUnKSxcbiAgUHJvcHJpZXRhcnlEYXRhQ29udHJvbGxlci51cGxvYWRGaWxlXG4pO1xuXG4vKipcbiAqIEByb3V0ZSBHRVQgL2FwaS9wcm9wcmlldGFyeS1kYXRhL2ZpbGVzXG4gKiBAZGVzYyBHZXQgYSBsaXN0IG9mIHByb3ByaWV0YXJ5IGRhdGEgZmlsZXNcbiAqIEBhY2Nlc3MgUHJpdmF0ZVxuICovXG5yb3V0ZXIuZ2V0KFxuICAnL2ZpbGVzJyxcbiAgYXV0aGVudGljYXRlVXNlcixcbiAgUHJvcHJpZXRhcnlEYXRhQ29udHJvbGxlci5saXN0RmlsZXNcbik7XG5cbi8qKlxuICogQHJvdXRlIEdFVCAvYXBpL3Byb3ByaWV0YXJ5LWRhdGEvZmlsZXMvOmlkXG4gKiBAZGVzYyBHZXQgYSBwcm9wcmlldGFyeSBkYXRhIGZpbGUgYnkgSURcbiAqIEBhY2Nlc3MgUHJpdmF0ZVxuICovXG5yb3V0ZXIuZ2V0KFxuICAnL2ZpbGVzLzppZCcsXG4gIGF1dGhlbnRpY2F0ZVVzZXIsXG4gIFByb3ByaWV0YXJ5RGF0YUNvbnRyb2xsZXIuZ2V0RmlsZVxuKTtcblxuLyoqXG4gKiBAcm91dGUgREVMRVRFIC9hcGkvcHJvcHJpZXRhcnktZGF0YS9maWxlcy86aWRcbiAqIEBkZXNjIERlbGV0ZSBhIHByb3ByaWV0YXJ5IGRhdGEgZmlsZVxuICogQGFjY2VzcyBQcml2YXRlXG4gKi9cbnJvdXRlci5kZWxldGUoXG4gICcvZmlsZXMvOmlkJyxcbiAgYXV0aGVudGljYXRlVXNlcixcbiAgUHJvcHJpZXRhcnlEYXRhQ29udHJvbGxlci5kZWxldGVGaWxlXG4pO1xuXG4vKipcbiAqIEByb3V0ZSBQVVQgL2FwaS9wcm9wcmlldGFyeS1kYXRhL2ZpbGVzLzppZC9hY2Nlc3NcbiAqIEBkZXNjIFVwZGF0ZSBhY2Nlc3MgY29udHJvbCBmb3IgYSBmaWxlXG4gKiBAYWNjZXNzIFByaXZhdGVcbiAqL1xucm91dGVyLnB1dChcbiAgJy9maWxlcy86aWQvYWNjZXNzJyxcbiAgYXV0aGVudGljYXRlVXNlcixcbiAgUHJvcHJpZXRhcnlEYXRhQ29udHJvbGxlci51cGRhdGVBY2Nlc3NDb250cm9sXG4pO1xuXG5leHBvcnQgZGVmYXVsdCByb3V0ZXI7Il19