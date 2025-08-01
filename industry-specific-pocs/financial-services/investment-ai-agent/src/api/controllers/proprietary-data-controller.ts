/**
 * Controller for proprietary data integration API endpoints
 */

import { Request, Response } from 'express';
import { ProprietaryDataService } from '../../services/proprietary-data-service';
import { AccessControl } from '../../models/proprietary-data';
import { DataMetadata } from '../../models/services';
import { createDefaultAccessControl, validateAccessControl } from '../../utils/secure-storage';
import { isSupportedFileType, isValidFileSize, sanitizeFileName } from '../../utils/file-utils';

// Initialize the service with the S3 bucket name
// In a real implementation, this would be configured from environment variables
const dataService = new ProprietaryDataService('investment-ai-proprietary-data');

/**
 * Upload a proprietary data file
 * @param req The request object
 * @param res The response object
 */
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if file is present
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    
    // Get user information from authenticated request
    const userId = req.user?.id || 'anonymous';
    const organizationId = req.user?.organizationId || 'default';
    const userRoles = req.user?.roles || [];
    
    // Validate file
    const fileName = sanitizeFileName(req.file.originalname);
    
    if (!isSupportedFileType(fileName)) {
      res.status(400).json({ 
        error: 'Unsupported file type. Supported types: CSV, PDF, Excel, JSON' 
      });
      return;
    }
    
    if (!isValidFileSize(req.file.size)) {
      res.status(400).json({ 
        error: 'File size exceeds maximum allowed (100MB)' 
      });
      return;
    }
    
    // Parse metadata from request body
    const metadata: DataMetadata = {
      source: req.body.source || 'user-upload',
      type: req.body.type || 'proprietary',
      timestamp: new Date(),
      confidentiality: req.body.confidentiality || 'private',
      tags: req.body.tags ? JSON.parse(req.body.tags) : []
    };
    
    // Parse access control from request body or use defaults
    let accessControl: AccessControl;
    
    if (req.body.accessControl) {
      try {
        accessControl = JSON.parse(req.body.accessControl);
        if (!validateAccessControl(accessControl)) {
          accessControl = createDefaultAccessControl(userId, organizationId, metadata.confidentiality === 'restricted');
        }
      } catch (error) {
        accessControl = createDefaultAccessControl(userId, organizationId, metadata.confidentiality === 'restricted');
      }
    } else {
      accessControl = createDefaultAccessControl(userId, organizationId, metadata.confidentiality === 'restricted');
    }
    
    // Create a File object from the uploaded file
    const file = new File(
      [req.file.buffer], 
      fileName, 
      { type: req.file.mimetype }
    );
    
    // Upload the file
    const result = await dataService.uploadFile(
      file,
      metadata,
      userId,
      organizationId,
      accessControl
    );
    
    if (result.success) {
      res.status(200).json({
        success: true,
        documentId: result.documentId,
        processingStatus: result.processingStatus
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        processingStatus: result.processingStatus
      });
    }
  } catch (error) {
    console.error('Error in uploadFile:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
};

/**
 * Get a list of proprietary data files
 * @param req The request object
 * @param res The response object
 */
export const listFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user information from authenticated request
    const userId = req.user?.id || 'anonymous';
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
  } catch (error) {
    console.error('Error in listFiles:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
};

/**
 * Get a proprietary data file by ID
 * @param req The request object
 * @param res The response object
 */
export const getFile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user information from authenticated request
    const userId = req.user?.id || 'anonymous';
    
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
  } catch (error) {
    console.error('Error in getFile:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
};

/**
 * Delete a proprietary data file
 * @param req The request object
 * @param res The response object
 */
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user information from authenticated request
    const userId = req.user?.id || 'anonymous';
    
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
    } else {
      res.status(404).json({ error: 'File not found or access denied' });
    }
  } catch (error) {
    console.error('Error in deleteFile:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
};

/**
 * Update access control for a file
 * @param req The request object
 * @param res The response object
 */
export const updateAccessControl = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user information from authenticated request
    const userId = req.user?.id || 'anonymous';
    
    // Get file ID from request parameters
    const documentId = req.params.id;
    
    if (!documentId) {
      res.status(400).json({ error: 'Document ID is required' });
      return;
    }
    
    // Parse access control from request body
    let accessControl: AccessControl;
    
    try {
      accessControl = req.body.accessControl;
      if (!validateAccessControl(accessControl)) {
        res.status(400).json({ error: 'Invalid access control settings' });
        return;
      }
    } catch (error) {
      res.status(400).json({ error: 'Invalid access control settings' });
      return;
    }
    
    // Update access control
    const success = await dataService.updateAccessControl(documentId, userId, accessControl);
    
    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ error: 'File not found or access denied' });
    }
  } catch (error) {
    console.error('Error in updateAccessControl:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
};