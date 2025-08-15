FROM node:18-alpine

# Install Python and pip for Yahoo Finance provider
RUN apk add --no-cache python3 py3-pip

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Python dependencies for Yahoo Finance
RUN pip3 install --no-cache-dir --break-system-packages yfinance pandas numpy

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY public/ ./public/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start application
CMD ["npm", "start"]