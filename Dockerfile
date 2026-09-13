# ==============================================================================
# MedTrust SaaS Frontend Dockerfile
# Multi-Stage Build: Node 22 (Alpine) -> Nginx 1.27 (Alpine)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependency Installation & Base
# ------------------------------------------------------------------------------
FROM node:22-alpine AS base

WORKDIR /app

# Copy dependency specifications
COPY package.json package-lock.json ./

# Clean reproducible dependency install
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 2: Development (Vite Dev Server with Hot-Reloading)
# ------------------------------------------------------------------------------
FROM base AS development

ENV NODE_ENV=development

# Copy all source files
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite with --host 0.0.0.0 so it is reachable outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
# CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# ------------------------------------------------------------------------------
# Stage 3: Production Build (Compiles React/Vite into static assets)
# ------------------------------------------------------------------------------
FROM base AS build

# Build-time argument for API Base URL (defaults to http://localhost:8000)
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy source code for production compile
COPY . .

# Compile optimized static bundle into /app/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 4: Production Web Server (High-performance Nginx)
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS production

# Remove default Nginx welcome configuration
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration with SPA routing, gzip, and caching rules
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built production assets from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Health check verification using Alpine's built-in wget
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost/health || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
