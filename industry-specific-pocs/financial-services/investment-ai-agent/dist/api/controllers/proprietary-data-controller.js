"use strict";
/**
 * Controller for proprietary data integration API endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAccessControl = exports.deleteFile = exports.getFile = exports.listFiles = exports.uploadFile = void 0;
const proprietary_data_service_1 = require("../../services/proprietary-data-service");
const secure_storage_1 = require("../../utils/secure-storage");
const file_utils_1 = require("../../utils/file-utils");
// Initialize the service with the S3 bucket name
// In a real implementation, this would be configured from environment variables
const dataService = new proprietary_data_service_1.ProprietaryDataService('investment-ai-proprietary-data');
/**
 * Upload a proprietary data file
 * @param req The request object
 * @param res The response object
 */
const uploadFile = async (req, res) => {
    try {
        // Check if file is present
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        // Get user information from authenticated request
        const userId = req.user?.userId || 'anonymous';
        const organizationId = req.user?.organizationId || 'default';
        const userRoles = [req.user?.role] || [];
        // Validate file
        const fileName = (0, file_utils_1.sanitizeFileName)(req.file.originalname);
        if (!(0, file_utils_1.isSupportedFileType)(fileName)) {
            res.status(400).json({
                error: 'Unsupported file type. Supported types: CSV, PDF, Excel, JSON'
            });
            return;
        }
        if (!(0, file_utils_1.isValidFileSize)(req.file.size)) {
            res.status(400).json({
                error: 'File size exceeds maximum allowed (100MB)'
            });
            return;
        }
        // Parse metadata from request body
        const metadata = {
            source: req.body.source || 'user-upload',
            type: req.body.type || 'proprietary',
            timestamp: new Date(),
            confidentiality: req.body.confidentiality || 'private',
            tags: req.body.tags ? JSON.parse(req.body.tags) : []
        };
        // Parse access control from request body or use defaults
        let accessControl;
        if (req.body.accessControl) {
            try {
                accessControl = JSON.parse(req.body.accessControl);
                if (!(0, secure_storage_1.validateAccessControl)(accessControl)) {
                    accessControl = (0, secure_storage_1.createDefaultAccessControl)(userId, organizationId, metadata.confidentiality === 'restricted');
                }
            }
            catch (error) {
                accessControl = (0, secure_storage_1.createDefaultAccessControl)(userId, organizationId, metadata.confidentiality === 'restricted');
            }
        }
        else {
            accessControl = (0, secure_storage_1.createDefaultAccessControl)(userId, organizationId, metadata.confidentiality === 'restricted');
        }
        // Create a File object from the uploaded file
        const file = new File([req.file.buffer], fileName, { type: req.file.mimetype });
        // Upload the file
        const result = await dataService.uploadFile(file, metadata, userId, organizationId, accessControl);
        if (result.success) {
            res.status(200).json({
                success: true,
                documentId: result.documentId,
                processingStatus: result.processingStatus
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: result.error,
                processingStatus: result.processingStatus
            });
        }
    }
    catch (error) {
        console.error('Error in uploadFile:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
exports.uploadFile = uploadFile;
/**
 * Get a list of proprietary data files
 * @param req The request object
 * @param res The response object
 */
const listFiles = async (req, res) => {
    try {
        // Get user information from authenticated request
        const userId = req.user?.userId || 'anonymous';
        const organizationId = req.user?.organizationId || 'default';
        // Get files
        const files = await dataService.listFiles(userId, organizationId);
        res.status(200).json({
            success: true,
            files: files.map(file => ({
                id: file.id,
                fileName: file.fileName,
                fileType: file.fileType,
                uploadDate: file.uploadDate,
                status: file.status,
                metadata: {
                    source: file.metadata.source,
                    type: file.metadata.type,
                    confidentiality: file.metadata.confidentiality,
                    tags: file.metadata.tags
                }
            }))
        });
    }
    catch (error) {
        console.error('Error in listFiles:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
exports.listFiles = listFiles;
/**
 * Get a proprietary data file by ID
 * @param req The request object
 * @param res The response object
 */
const getFile = async (req, res) => {
    try {
        // Get user information from authenticated request
        const userId = req.user?.userId || 'anonymous';
        // Get file ID from request parameters
        const documentId = req.params.id;
        if (!documentId) {
            res.status(400).json({ error: 'Document ID is required' });
            return;
        }
        // Get file
        const file = await dataService.getFile(documentId, userId);
        if (!file) {
            res.status(404).json({ error: 'File not found or access denied' });
            return;
        }
        res.status(200).json({
            success: true,
            file: {
                id: file.id,
                fileName: file.fileName,
                fileType: file.fileType,
                uploadDate: file.uploadDate,
                status: file.status,
                metadata: {
                    source: file.metadata.source,
                    type: file.metadata.type,
                    confidentiality: file.metadata.confidentiality,
                    tags: file.metadata.tags
                },
                extractedData: file.extractedData
            }
        });
    }
    catch (error) {
        console.error('Error in getFile:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
exports.getFile = getFile;
/**
 * Delete a proprietary data file
 * @param req The request object
 * @param res The response object
 */
const deleteFile = async (req, res) => {
    try {
        // Get user information from authenticated request
        const userId = req.user?.userId || 'anonymous';
        // Get file ID from request parameters
        const documentId = req.params.id;
        if (!documentId) {
            res.status(400).json({ error: 'Document ID is required' });
            return;
        }
        // Delete file
        const success = await dataService.deleteFile(documentId, userId);
        if (success) {
            res.status(200).json({ success: true });
        }
        else {
            res.status(404).json({ error: 'File not found or access denied' });
        }
    }
    catch (error) {
        console.error('Error in deleteFile:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
exports.deleteFile = deleteFile;
/**
 * Update access control for a file
 * @param req The request object
 * @param res The response object
 */
const updateAccessControl = async (req, res) => {
    try {
        // Get user information from authenticated request
        const userId = req.user?.userId || 'anonymous';
        // Get file ID from request parameters
        const documentId = req.params.id;
        if (!documentId) {
            res.status(400).json({ error: 'Document ID is required' });
            return;
        }
        // Parse access control from request body
        let accessControl;
        try {
            accessControl = req.body.accessControl;
            if (!(0, secure_storage_1.validateAccessControl)(accessControl)) {
                res.status(400).json({ error: 'Invalid access control settings' });
                return;
            }
        }
        catch (error) {
            res.status(400).json({ error: 'Invalid access control settings' });
            return;
        }
        // Update access control
        const success = await dataService.updateAccessControl(documentId, userId, accessControl);
        if (success) {
            res.status(200).json({ success: true });
        }
        else {
            res.status(404).json({ error: 'File not found or access denied' });
        }
    }
    catch (error) {
        console.error('Error in updateAccessControl:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
exports.updateAccessControl = updateAccessControl;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcHJpZXRhcnktZGF0YS1jb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwaS9jb250cm9sbGVycy9wcm9wcmlldGFyeS1kYXRhLWNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFHSCxzRkFBaUY7QUFHakYsK0RBQStGO0FBQy9GLHVEQUFnRztBQUVoRyxpREFBaUQ7QUFDakQsZ0ZBQWdGO0FBQ2hGLE1BQU0sV0FBVyxHQUFHLElBQUksaURBQXNCLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztBQUVqRjs7OztHQUlHO0FBQ0ksTUFBTSxVQUFVLEdBQUcsS0FBSyxFQUFFLEdBQVksRUFBRSxHQUFhLEVBQWlCLEVBQUU7SUFDN0UsSUFBSTtRQUNGLDJCQUEyQjtRQUMzQixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRTtZQUNiLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFLENBQUMsQ0FBQztZQUNwRCxPQUFPO1NBQ1I7UUFFRCxrREFBa0Q7UUFDbEQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLElBQUksV0FBVyxDQUFDO1FBQy9DLE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxJQUFJLEVBQUUsY0FBYyxJQUFJLFNBQVMsQ0FBQztRQUM3RCxNQUFNLFNBQVMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBRXpDLGdCQUFnQjtRQUNoQixNQUFNLFFBQVEsR0FBRyxJQUFBLDZCQUFnQixFQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFekQsSUFBSSxDQUFDLElBQUEsZ0NBQW1CLEVBQUMsUUFBUSxDQUFDLEVBQUU7WUFDbEMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFH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RUFBRSxLQUFLLEVBQUUsaUNBQWlDLEVBQUUsQ0FBQyxDQUFDO1NBQ3BFO0tBQ0Y7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsK0JBQStCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdEQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLHVCQUF1QjtTQUN4RSxDQUFDLENBQUM7S0FDSjtBQUNILENBQUMsQ0FBQztBQXpDVyxRQUFBLG1CQUFtQix1QkF5QzlCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb250cm9sbGVyIGZvciBwcm9wcmlldGFyeSBkYXRhIGludGVncmF0aW9uIEFQSSBlbmRwb2ludHNcbiAqL1xuXG5pbXBvcnQgeyBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IHsgUHJvcHJpZXRhcnlEYXRhU2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL3Byb3ByaWV0YXJ5LWRhdGEtc2VydmljZSc7XG5pbXBvcnQgeyBBY2Nlc3NDb250cm9sIH0gZnJvbSAnLi4vLi4vbW9kZWxzL3Byb3ByaWV0YXJ5LWRhdGEnO1xuaW1wb3J0IHsgRGF0YU1ldGFkYXRhIH0gZnJvbSAnLi4vLi4vbW9kZWxzL3NlcnZpY2VzJztcbmltcG9ydCB7IGNyZWF0ZURlZmF1bHRBY2Nlc3NDb250cm9sLCB2YWxpZGF0ZUFjY2Vzc0NvbnRyb2wgfSBmcm9tICcuLi8uLi91dGlscy9zZWN1cmUtc3RvcmFnZSc7XG5pbXBvcnQgeyBpc1N1cHBvcnRlZEZpbGVUeXBlLCBpc1ZhbGlkRmlsZVNpemUsIHNhbml0aXplRmlsZU5hbWUgfSBmcm9tICcuLi8uLi91dGlscy9maWxlLXV0aWxzJztcblxuLy8gSW5pdGlhbGl6ZSB0aGUgc2VydmljZSB3aXRoIHRoZSBTMyBidWNrZXQgbmFtZVxuLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIGJlIGNvbmZpZ3VyZWQgZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZXNcbmNvbnN0IGRhdGFTZXJ2aWNlID0gbmV3IFByb3ByaWV0YXJ5RGF0YVNlcnZpY2UoJ2ludmVzdG1lbnQtYWktcHJvcHJpZXRhcnktZGF0YScpO1xuXG4vKipcbiAqIFVwbG9hZCBhIHByb3ByaWV0YXJ5IGRhdGEgZmlsZVxuICogQHBhcmFtIHJlcSBUaGUgcmVxdWVzdCBvYmplY3RcbiAqIEBwYXJhbSByZXMgVGhlIHJlc3BvbnNlIG9iamVjdFxuICovXG5leHBvcnQgY29uc3QgdXBsb2FkRmlsZSA9IGFzeW5jIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgdHJ5IHtcbiAgICAvLyBDaGVjayBpZiBmaWxlIGlzIHByZXNlbnRcbiAgICBpZiAoIXJlcS5maWxlKSB7XG4gICAgICByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnTm8gZmlsZSB1cGxvYWRlZCcgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIC8vIEdldCB1c2VyIGluZm9ybWF0aW9uIGZyb20gYXV0aGVudGljYXRlZCByZXF1ZXN0XG4gICAgY29uc3QgdXNlcklkID0gcmVxLnVzZXI/LnVzZXJJZCB8fCAnYW5vbnltb3VzJztcbiAgICBjb25zdCBvcmdhbml6YXRpb25JZCA9IHJlcS51c2VyPy5vcmdhbml6YXRpb25JZCB8fCAnZGVmYXVsdCc7XG4gICAgY29uc3QgdXNlclJvbGVzID0gW3JlcS51c2VyPy5yb2xlXSB8fCBbXTtcbiAgICBcbiAgICAvLyBWYWxpZGF0ZSBmaWxlXG4gICAgY29uc3QgZmlsZU5hbWUgPSBzYW5pdGl6ZUZpbGVOYW1lKHJlcS5maWxlLm9yaWdpbmFsbmFtZSk7XG4gICAgXG4gICAgaWYgKCFpc1N1cHBvcnRlZEZpbGVUeXBlKGZpbGVOYW1lKSkge1xuICAgICAgcmVzLnN0YXR1cyg0MDApLmpzb24oeyBcbiAgICAgICAgZXJyb3I6ICdVbnN1cHBvcnRlZCBmaWxlIHR5cGUuIFN1cHBvcnRlZCB0eXBlczogQ1NWLCBQREYsIEV4Y2VsLCBKU09OJyBcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICBpZiAoIWlzVmFsaWRGaWxlU2l6ZShyZXEuZmlsZS5zaXplKSkge1xuICAgICAgcmVzLnN0YXR1cyg0MDApLmpzb24oeyBcbiAgICAgICAgZXJyb3I6ICdGaWxlIHNpemUgZXhjZWVkcyBtYXhpbXVtIGFsbG93ZWQgKDEwME1CKScgXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgXG4gICAgLy8gUGFyc2UgbWV0YWRhdGEgZnJvbSByZXF1ZXN0IGJvZHlcbiAgICBjb25zdCBtZXRhZGF0YTogRGF0YU1ldGFkYXRhID0ge1xuICAgICAgc291cmNlOiByZXEuYm9keS5zb3VyY2UgfHwgJ3VzZXItdXBsb2FkJyxcbiAgICAgIHR5cGU6IHJlcS5ib2R5LnR5cGUgfHwgJ3Byb3ByaWV0YXJ5JyxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgIGNvbmZpZGVudGlhbGl0eTogcmVxLmJvZHkuY29uZmlkZW50aWFsaXR5IHx8ICdwcml2YXRlJyxcbiAgICAgIHRhZ3M6IHJlcS5ib2R5LnRhZ3MgPyBKU09OLnBhcnNlKHJlcS5ib2R5LnRhZ3MpIDogW11cbiAgICB9O1xuICAgIFxuICAgIC8vIFBhcnNlIGFjY2VzcyBjb250cm9sIGZyb20gcmVxdWVzdCBib2R5IG9yIHVzZSBkZWZhdWx0c1xuICAgIGxldCBhY2Nlc3NDb250cm9sOiBBY2Nlc3NDb250cm9sO1xuICAgIFxuICAgIGlmIChyZXEuYm9keS5hY2Nlc3NDb250cm9sKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhY2Nlc3NDb250cm9sID0gSlNPTi5wYXJzZShyZXEuYm9keS5hY2Nlc3NDb250cm9sKTtcbiAgICAgICAgaWYgKCF2YWxpZGF0ZUFjY2Vzc0NvbnRyb2woYWNjZXNzQ29udHJvbCkpIHtcbiAgICAgICAgICBhY2Nlc3NDb250cm9sID0gY3JlYXRlRGVmYXVsdEFjY2Vzc0NvbnRyb2wodXNlcklkLCBvcmdhbml6YXRpb25JZCwgbWV0YWRhdGEuY29uZmlkZW50aWFsaXR5ID09PSAncmVzdHJpY3RlZCcpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBhY2Nlc3NDb250cm9sID0gY3JlYXRlRGVmYXVsdEFjY2Vzc0NvbnRyb2wodXNlcklkLCBvcmdhbml6YXRpb25JZCwgbWV0YWRhdGEuY29uZmlkZW50aWFsaXR5ID09PSAncmVzdHJpY3RlZCcpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBhY2Nlc3NDb250cm9sID0gY3JlYXRlRGVmYXVsdEFjY2Vzc0NvbnRyb2wodXNlcklkLCBvcmdhbml6YXRpb25JZCwgbWV0YWRhdGEuY29uZmlkZW50aWFsaXR5ID09PSAncmVzdHJpY3RlZCcpO1xuICAgIH1cbiAgICBcbiAgICAvLyBDcmVhdGUgYSBGaWxlIG9iamVjdCBmcm9tIHRoZSB1cGxvYWRlZCBmaWxlXG4gICAgY29uc3QgZmlsZSA9IG5ldyBGaWxlKFxuICAgICAgW3JlcS5maWxlLmJ1ZmZlcl0sIFxuICAgICAgZmlsZU5hbWUsIFxuICAgICAgeyB0eXBlOiByZXEuZmlsZS5taW1ldHlwZSB9XG4gICAgKTtcbiAgICBcbiAgICAvLyBVcGxvYWQgdGhlIGZpbGVcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBkYXRhU2VydmljZS51cGxvYWRGaWxlKFxuICAgICAgZmlsZSxcbiAgICAgIG1ldGFkYXRhLFxuICAgICAgdXNlcklkLFxuICAgICAgb3JnYW5pemF0aW9uSWQsXG4gICAgICBhY2Nlc3NDb250cm9sXG4gICAgKTtcbiAgICBcbiAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgZG9jdW1lbnRJZDogcmVzdWx0LmRvY3VtZW50SWQsXG4gICAgICAgIHByb2Nlc3NpbmdTdGF0dXM6IHJlc3VsdC5wcm9jZXNzaW5nU3RhdHVzXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IHJlc3VsdC5lcnJvcixcbiAgICAgICAgcHJvY2Vzc2luZ1N0YXR1czogcmVzdWx0LnByb2Nlc3NpbmdTdGF0dXNcbiAgICAgIH0pO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiB1cGxvYWRGaWxlOicsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IFxuICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgXG4gICAgfSk7XG4gIH1cbn07XG5cbi8qKlxuICogR2V0IGEgbGlzdCBvZiBwcm9wcmlldGFyeSBkYXRhIGZpbGVzXG4gKiBAcGFyYW0gcmVxIFRoZSByZXF1ZXN0IG9iamVjdFxuICogQHBhcmFtIHJlcyBUaGUgcmVzcG9uc2Ugb2JqZWN0XG4gKi9cbmV4cG9ydCBjb25zdCBsaXN0RmlsZXMgPSBhc3luYyAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gIHRyeSB7XG4gICAgLy8gR2V0IHVzZXIgaW5mb3JtYXRpb24gZnJvbSBhdXRoZW50aWNhdGVkIHJlcXVlc3RcbiAgICBjb25zdCB1c2VySWQgPSByZXEudXNlcj8udXNlcklkIHx8ICdhbm9ueW1vdXMnO1xuICAgIGNvbnN0IG9yZ2FuaXphdGlvbklkID0gcmVxLnVzZXI/Lm9yZ2FuaXphdGlvbklkIHx8ICdkZWZhdWx0JztcbiAgICBcbiAgICAvLyBHZXQgZmlsZXNcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IGRhdGFTZXJ2aWNlLmxpc3RGaWxlcyh1c2VySWQsIG9yZ2FuaXphdGlvbklkKTtcbiAgICBcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZmlsZXM6IGZpbGVzLm1hcChmaWxlID0+ICh7XG4gICAgICAgIGlkOiBmaWxlLmlkLFxuICAgICAgICBmaWxlTmFtZTogZmlsZS5maWxlTmFtZSxcbiAgICAgICAgZmlsZVR5cGU6IGZpbGUuZmlsZVR5cGUsXG4gICAgICAgIHVwbG9hZERhdGU6IGZpbGUudXBsb2FkRGF0ZSxcbiAgICAgICAgc3RhdHVzOiBmaWxlLnN0YXR1cyxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBzb3VyY2U6IGZpbGUubWV0YWRhdGEuc291cmNlLFxuICAgICAgICAgIHR5cGU6IGZpbGUubWV0YWRhdGEudHlwZSxcbiAgICAgICAgICBjb25maWRlbnRpYWxpdHk6IGZpbGUubWV0YWRhdGEuY29uZmlkZW50aWFsaXR5LFxuICAgICAgICAgIHRhZ3M6IGZpbGUubWV0YWRhdGEudGFnc1xuICAgICAgICB9XG4gICAgICB9KSlcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiBsaXN0RmlsZXM6JywgZXJyb3IpO1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgXG4gICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyBcbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgYSBwcm9wcmlldGFyeSBkYXRhIGZpbGUgYnkgSURcbiAqIEBwYXJhbSByZXEgVGhlIHJlcXVlc3Qgb2JqZWN0XG4gKiBAcGFyYW0gcmVzIFRoZSByZXNwb25zZSBvYmplY3RcbiAqL1xuZXhwb3J0IGNvbnN0IGdldEZpbGUgPSBhc3luYyAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gIHRyeSB7XG4gICAgLy8gR2V0IHVzZXIgaW5mb3JtYXRpb24gZnJvbSBhdXRoZW50aWNhdGVkIHJlcXVlc3RcbiAgICBjb25zdCB1c2VySWQgPSByZXEudXNlcj8udXNlcklkIHx8ICdhbm9ueW1vdXMnO1xuICAgIFxuICAgIC8vIEdldCBmaWxlIElEIGZyb20gcmVxdWVzdCBwYXJhbWV0ZXJzXG4gICAgY29uc3QgZG9jdW1lbnRJZCA9IHJlcS5wYXJhbXMuaWQ7XG4gICAgXG4gICAgaWYgKCFkb2N1bWVudElkKSB7XG4gICAgICByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnRG9jdW1lbnQgSUQgaXMgcmVxdWlyZWQnIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICAvLyBHZXQgZmlsZVxuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCBkYXRhU2VydmljZS5nZXRGaWxlKGRvY3VtZW50SWQsIHVzZXJJZCk7XG4gICAgXG4gICAgaWYgKCFmaWxlKSB7XG4gICAgICByZXMuc3RhdHVzKDQwNCkuanNvbih7IGVycm9yOiAnRmlsZSBub3QgZm91bmQgb3IgYWNjZXNzIGRlbmllZCcgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBmaWxlOiB7XG4gICAgICAgIGlkOiBmaWxlLmlkLFxuICAgICAgICBmaWxlTmFtZTogZmlsZS5maWxlTmFtZSxcbiAgICAgICAgZmlsZVR5cGU6IGZpbGUuZmlsZVR5cGUsXG4gICAgICAgIHVwbG9hZERhdGU6IGZpbGUudXBsb2FkRGF0ZSxcbiAgICAgICAgc3RhdHVzOiBmaWxlLnN0YXR1cyxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBzb3VyY2U6IGZpbGUubWV0YWRhdGEuc291cmNlLFxuICAgICAgICAgIHR5cGU6IGZpbGUubWV0YWRhdGEudHlwZSxcbiAgICAgICAgICBjb25maWRlbnRpYWxpdHk6IGZpbGUubWV0YWRhdGEuY29uZmlkZW50aWFsaXR5LFxuICAgICAgICAgIHRhZ3M6IGZpbGUubWV0YWRhdGEudGFnc1xuICAgICAgICB9LFxuICAgICAgICBleHRyYWN0ZWREYXRhOiBmaWxlLmV4dHJhY3RlZERhdGFcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiBnZXRGaWxlOicsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IFxuICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgXG4gICAgfSk7XG4gIH1cbn07XG5cbi8qKlxuICogRGVsZXRlIGEgcHJvcHJpZXRhcnkgZGF0YSBmaWxlXG4gKiBAcGFyYW0gcmVxIFRoZSByZXF1ZXN0IG9iamVjdFxuICogQHBhcmFtIHJlcyBUaGUgcmVzcG9uc2Ugb2JqZWN0XG4gKi9cbmV4cG9ydCBjb25zdCBkZWxldGVGaWxlID0gYXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4gPT4ge1xuICB0cnkge1xuICAgIC8vIEdldCB1c2VyIGluZm9ybWF0aW9uIGZyb20gYXV0aGVudGljYXRlZCByZXF1ZXN0XG4gICAgY29uc3QgdXNlcklkID0gcmVxLnVzZXI/LnVzZXJJZCB8fCAnYW5vbnltb3VzJztcbiAgICBcbiAgICAvLyBHZXQgZmlsZSBJRCBmcm9tIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgIGNvbnN0IGRvY3VtZW50SWQgPSByZXEucGFyYW1zLmlkO1xuICAgIFxuICAgIGlmICghZG9jdW1lbnRJZCkge1xuICAgICAgcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ0RvY3VtZW50IElEIGlzIHJlcXVpcmVkJyB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgXG4gICAgLy8gRGVsZXRlIGZpbGVcbiAgICBjb25zdCBzdWNjZXNzID0gYXdhaXQgZGF0YVNlcnZpY2UuZGVsZXRlRmlsZShkb2N1bWVudElkLCB1c2VySWQpO1xuICAgIFxuICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdGaWxlIG5vdCBmb3VuZCBvciBhY2Nlc3MgZGVuaWVkJyB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gZGVsZXRlRmlsZTonLCBlcnJvcik7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIFxuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIFVwZGF0ZSBhY2Nlc3MgY29udHJvbCBmb3IgYSBmaWxlXG4gKiBAcGFyYW0gcmVxIFRoZSByZXF1ZXN0IG9iamVjdFxuICogQHBhcmFtIHJlcyBUaGUgcmVzcG9uc2Ugb2JqZWN0XG4gKi9cbmV4cG9ydCBjb25zdCB1cGRhdGVBY2Nlc3NDb250cm9sID0gYXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4gPT4ge1xuICB0cnkge1xuICAgIC8vIEdldCB1c2VyIGluZm9ybWF0aW9uIGZyb20gYXV0aGVudGljYXRlZCByZXF1ZXN0XG4gICAgY29uc3QgdXNlcklkID0gcmVxLnVzZXI/LnVzZXJJZCB8fCAnYW5vbnltb3VzJztcbiAgICBcbiAgICAvLyBHZXQgZmlsZSBJRCBmcm9tIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgIGNvbnN0IGRvY3VtZW50SWQgPSByZXEucGFyYW1zLmlkO1xuICAgIFxuICAgIGlmICghZG9jdW1lbnRJZCkge1xuICAgICAgcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ0RvY3VtZW50IElEIGlzIHJlcXVpcmVkJyB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgXG4gICAgLy8gUGFyc2UgYWNjZXNzIGNvbnRyb2wgZnJvbSByZXF1ZXN0IGJvZHlcbiAgICBsZXQgYWNjZXNzQ29udHJvbDogQWNjZXNzQ29udHJvbDtcbiAgICBcbiAgICB0cnkge1xuICAgICAgYWNjZXNzQ29udHJvbCA9IHJlcS5ib2R5LmFjY2Vzc0NvbnRyb2w7XG4gICAgICBpZiAoIXZhbGlkYXRlQWNjZXNzQ29udHJvbChhY2Nlc3NDb250cm9sKSkge1xuICAgICAgICByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnSW52YWxpZCBhY2Nlc3MgY29udHJvbCBzZXR0aW5ncycgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ0ludmFsaWQgYWNjZXNzIGNvbnRyb2wgc2V0dGluZ3MnIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICAvLyBVcGRhdGUgYWNjZXNzIGNvbnRyb2xcbiAgICBjb25zdCBzdWNjZXNzID0gYXdhaXQgZGF0YVNlcnZpY2UudXBkYXRlQWNjZXNzQ29udHJvbChkb2N1bWVudElkLCB1c2VySWQsIGFjY2Vzc0NvbnRyb2wpO1xuICAgIFxuICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdGaWxlIG5vdCBmb3VuZCBvciBhY2Nlc3MgZGVuaWVkJyB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gdXBkYXRlQWNjZXNzQ29udHJvbDonLCBlcnJvcik7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIFxuICAgIH0pO1xuICB9XG59OyJdfQ==