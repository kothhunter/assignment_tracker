# Deployment Guide

This document provides comprehensive deployment instructions for the Project Assignment application across multiple platforms.

## 🚀 Quick Start

Choose your preferred deployment platform:

- **[Vercel](#vercel-deployment)** - Recommended for Next.js applications
- **[Docker](#docker-deployment)** - For containerized deployments
- **[Railway](#railway-deployment)** - Simple cloud deployment
- **[Render](#render-deployment)** - Alternative cloud platform

## Prerequisites

- Node.js 18+ installed locally
- Git repository access
- Environment variables configured
- Database setup (Supabase recommended)

## Environment Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure required variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `NEXTAUTH_SECRET`

3. **Optional monitoring variables:**
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`

## Vercel Deployment

### Automatic Deployment (Recommended)

1. **Connect repository to Vercel:**
   - Visit [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your Git repository
   - Vercel will auto-detect Next.js configuration

2. **Configure environment variables:**
   - In project settings, add all required environment variables
   - Use different variables for production/preview environments

3. **Deploy:**
   ```bash
   git push origin main
   ```

### Manual Deployment

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy using script:**
   ```bash
   # Production deployment
   ./scripts/deployment/deploy-vercel.sh production
   
   # Staging deployment
   ./scripts/deployment/deploy-vercel.sh staging
   ```

### Vercel Configuration

The `vercel.json` file includes:
- Function timeout configurations
- Security headers
- Health check redirects
- Environment-specific settings

## Docker Deployment

### Local Development

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Check health:**
   ```bash
   ./scripts/deployment/health-check.sh http://localhost:3000
   ```

### Production Deployment

1. **Use deployment script:**
   ```bash
   ./scripts/deployment/deploy-docker.sh production latest
   ```

2. **Manual deployment:**
   ```bash
   # Build image
   docker build -t project-assignment .
   
   # Run container
   docker run -d \
     --name project-assignment \
     -p 3000:3000 \
     --env-file .env.production \
     project-assignment
   ```

### Docker Configuration

- **Multi-stage build** for optimized production images
- **Health checks** built into containers
- **Volume mounting** for file uploads
- **Non-root user** for security
- **Alpine Linux** base for smaller images

## Railway Deployment

1. **Connect repository:**
   - Visit [Railway Dashboard](https://railway.app/dashboard)
   - Create new project from GitHub repository

2. **Configure variables:**
   - Add environment variables in Railway dashboard
   - Railway will auto-deploy on pushes to main

3. **Custom configuration:**
   - Railway uses `railway.json` for deployment settings
   - Automatic health checks enabled

## Render Deployment

1. **Connect repository:**
   - Visit [Render Dashboard](https://dashboard.render.com)
   - Create new web service from repository

2. **Configuration:**
   - Render uses `render.yaml` for service configuration
   - Auto-scaling based on CPU/memory usage

## Health Monitoring

### Endpoints

- **Basic Health:** `/api/health`
- **Detailed Health:** `/api/health/detailed`
- **Monitoring Dashboard:** `/admin/monitoring`

### Automated Health Checks

Run comprehensive health checks:

```bash
# Local environment
./scripts/deployment/health-check.sh http://localhost:3000

# Production environment
./scripts/deployment/health-check.sh https://your-domain.com
```

### Monitoring Integration

- **Sentry** for error tracking and performance monitoring
- **Built-in analytics** for user behavior tracking
- **Custom metrics** via health check endpoints

## Database Setup

### Supabase (Recommended)

1. **Create project:**
   - Visit [Supabase Dashboard](https://supabase.com/dashboard)
   - Create new project

2. **Run migrations:**
   ```sql
   -- Use the provided SQL files:
   -- database-migration-complete.sql
   -- database-migration-planning-tables.sql
   -- database-migration-refinement-messages.sql
   ```

3. **Configure RLS policies:**
   - Set up Row Level Security for user data protection

### Self-hosted PostgreSQL

1. **Use Docker Compose:**
   ```bash
   docker-compose up postgres -d
   ```

2. **Run migrations:**
   ```bash
   psql -h localhost -U postgres -d project_assignment -f database-migration-complete.sql
   ```

## Security Considerations

### Environment Variables

- **Never commit** `.env` files to repository
- **Use secrets management** for production environments
- **Rotate API keys** regularly

### Headers & CORS

- Security headers configured in `next.config.mjs`
- CORS policies set for API endpoints
- CSP configured for Sentry integration

### Authentication

- NextAuth.js configured for secure authentication
- Session management with secure cookies
- CSRF protection enabled

## Performance Optimization

### Build Optimization

- **Static generation** where possible
- **Image optimization** with Next.js Image component
- **Bundle analysis** available via `npm run analyze`

### Caching Strategy

- **Static assets** cached with long expiration
- **API responses** with appropriate cache headers
- **CDN integration** for global content delivery

### Monitoring

- **Core Web Vitals** tracking
- **API response time** monitoring
- **Error rate** tracking via Sentry

## Troubleshooting

### Common Issues

1. **Build failures:**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

2. **Environment variable issues:**
   ```bash
   # Verify variables are loaded
   npm run build:debug
   ```

3. **Database connection issues:**
   ```bash
   # Test database connectivity
   curl https://your-app.com/api/health/detailed
   ```

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm run dev
```

### Log Analysis

- **Vercel logs:** Available in Vercel dashboard
- **Docker logs:** `docker logs container-name`
- **Sentry issues:** Check Sentry dashboard for errors

## Rollback Procedures

### Vercel

1. **Via Dashboard:**
   - Go to deployment history
   - Select previous successful deployment
   - Click "Promote to Production"

2. **Via CLI:**
   ```bash
   vercel --prod --target=<deployment-url>
   ```

### Docker

1. **Revert to previous image:**
   ```bash
   docker-compose down
   docker-compose up -d --image=project-assignment:previous-tag
   ```

2. **Database rollback:**
   ```bash
   # Restore from backup
   psql -h localhost -U postgres -d project_assignment < backup.sql
   ```

## Support

- **Health Check:** Use `/api/health/detailed` for system status
- **Monitoring:** Check `/admin/monitoring` dashboard
- **Logs:** Review platform-specific logging systems
- **Issues:** Check Sentry for error tracking

---

## Platform-Specific Notes

### Vercel
- Automatically handles Next.js optimization
- Edge functions for global performance
- Automatic SSL certificates

### Docker
- Full control over runtime environment
- Suitable for complex deployment scenarios
- Requires container orchestration for scaling

### Railway
- Simple deployment with minimal configuration
- Automatic scaling based on usage
- Built-in monitoring and logging

### Render
- Docker-based deployments
- Automatic SSL and CDN
- Integrated PostgreSQL options