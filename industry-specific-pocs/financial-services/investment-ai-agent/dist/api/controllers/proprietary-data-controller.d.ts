/**
 * Controller for proprietary data integration API endpoints
 */
import { Request, Response } from 'express';
/**
 * Upload a proprietary data file
 * @param req The request object
 * @param res The response object
 */
export declare const uploadFile: (req: Request, res: Response) => Promise<void>;
/**
 * Get a list of proprietary data files
 * @param req The request object
 * @param res The response object
 */
export declare const listFiles: (req: Request, res: Response) => Promise<void>;
/**
 * Get a proprietary data file by ID
 * @param req The request object
 * @param res The response object
 */
export declare const getFile: (req: Request, res: Response) => Promise<void>;
/**
 * Delete a proprietary data file
 * @param req The request object
 * @param res The response object
 */
export declare const deleteFile: (req: Request, res: Response) => Promise<void>;
/**
 * Update access control for a file
 * @param req The request object
 * @param res The response object
 */
export declare const updateAccessControl: (req: Request, res: Response) => Promise<void>;
