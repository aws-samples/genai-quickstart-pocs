/**
 * Routes for proprietary data integration API
 */

import { Router } from 'express';
import * as ProprietaryDataController from '../controllers/proprietary-data-controller';
import { authenticateUser } from '../middleware/auth';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

const router = Router();

/**
 * @route POST /api/proprietary-data/upload
 * @desc Upload a proprietary data file
 * @access Private
 */
router.post(
  '/upload',
  authenticateUser,
  upload.single('file'),
  ProprietaryDataController.uploadFile
);

/**
 * @route GET /api/proprietary-data/files
 * @desc Get a list of proprietary data files
 * @access Private
 */
router.get(
  '/files',
  authenticateUser,
  ProprietaryDataController.listFiles
);

/**
 * @route GET /api/proprietary-data/files/:id
 * @desc Get a proprietary data file by ID
 * @access Private
 */
router.get(
  '/files/:id',
  authenticateUser,
  ProprietaryDataController.getFile
);

/**
 * @route DELETE /api/proprietary-data/files/:id
 * @desc Delete a proprietary data file
 * @access Private
 */
router.delete(
  '/files/:id',
  authenticateUser,
  ProprietaryDataController.deleteFile
);

/**
 * @route PUT /api/proprietary-data/files/:id/access
 * @desc Update access control for a file
 * @access Private
 */
router.put(
  '/files/:id/access',
  authenticateUser,
  ProprietaryDataController.updateAccessControl
);

export default router;