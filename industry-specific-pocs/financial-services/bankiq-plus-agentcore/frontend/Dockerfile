# Multi-stage build for React UI
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV REACT_APP_PROXY_URL=http://bankiq-platform-alb-614395446.us-east-1.elb.amazonaws.com
RUN npm run build

# Production stage with serve
FROM --platform=linux/amd64 node:18-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=build /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]