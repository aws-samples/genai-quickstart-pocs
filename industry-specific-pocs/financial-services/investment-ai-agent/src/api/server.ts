/**
 * API server for the Investment AI Agent
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import proprietaryDataRoutes from './routes/proprietary-data-routes';
import webSearchRoutes from './routes/web-search-routes';
import authRoutes from './routes/auth-routes';
import userProfileRoutes from './routes/user-profile-routes';
import investmentIdeaRoutes from './routes/investment-idea-routes';
import feedbackRoutes from './routes/feedback-routes';
import frontendRoutes from './routes/frontend-routes';
import { 
  auditContextMiddleware, 
  requestLoggingMiddleware, 
  auditErrorMiddleware 
} from './middleware/audit-logging';

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Audit and logging middleware
app.use(auditContextMiddleware);
app.use(requestLoggingMiddleware);

// Serve static files from frontend directory
app.use('/static', express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', userProfileRoutes);
app.use('/api/proprietary-data', proprietaryDataRoutes);
app.use('/api/web-search', webSearchRoutes);
app.use('/api/v1/ideas', investmentIdeaRoutes);
app.use('/api/v1/feedback', feedbackRoutes);

// Frontend Routes (serve the investment idea request interface)
app.use('/', frontendRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use(auditErrorMiddleware);
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;