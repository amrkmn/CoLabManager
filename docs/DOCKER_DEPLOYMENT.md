# Docker Deployment Guide

This document explains how to deploy CoLab Manager using Docker and GitHub Container Registry.

## 🐳 Container Registry

The application is automatically built and published to GitHub Container Registry (GHCR) when changes are pushed to the main branch.

**Image Location**: `ghcr.io/YOUR_USERNAME/pta:latest`

## 🚀 Quick Deployment

### Prerequisites

- Docker and Docker Compose installed
- Access to the GitHub Container Registry image
- PostgreSQL database (included in docker-compose)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/pta.git
cd pta
```

### 2. Configure Environment

```bash
# Copy the environment template
cp .env.example .env

# Edit the environment file with your actual values
nano .env
```

**Required Environment Variables:**

```env
# Application Configuration
PORT=3930
NODE_ENV=production
JWT_SECRET=your-very-secure-jwt-secret

# Database
DATABASE_URL=postgresql://postgres:your-secure-password@db:5432/pta

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# S3 Storage (if using external S3)
S3_ENDPOINT=your-s3-endpoint
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Application URL
APP_URL=https://your-domain.com
```

### 3. Deploy

```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Deploy the application
./scripts/deploy.sh deploy

# Or deploy with optional services (MinIO for file storage, Redis for caching, pgAdmin for DB management)
./scripts/deploy.sh deploy -p storage,cache,tools
```

### 4. Access the Application

The application will be available at:
- **Main App**: http://localhost:3930 (or your configured APP_URL)
- **MinIO Console**: http://localhost:9001 (if using storage profile)
- **pgAdmin**: http://localhost:8080 (if using tools profile)
- **Database**: localhost:5432

## 📋 Management Commands

### Update to Latest Version

```bash
./scripts/deploy.sh update
```

### View Logs

```bash
# Follow logs
./scripts/deploy.sh logs -f

# View specific service logs
docker compose -f docker-compose.prod.yml logs app -f
```

### Stop the Application

```bash
./scripts/deploy.sh stop
```

### Restart the Application

```bash
./scripts/deploy.sh restart
```

### Cleanup Unused Resources

```bash
./scripts/deploy.sh cleanup
```

## 🔧 Advanced Configuration

### Custom Compose File

```bash
# Use custom compose file
./scripts/deploy.sh deploy -f my-custom-compose.yml
```

### Custom Environment File

```bash
# Use custom environment file
./scripts/deploy.sh deploy -e .env.staging
```

### Enable Optional Services

```bash
# Enable pgAdmin for database management
./scripts/deploy.sh deploy -p tools

# Enable Redis for caching
./scripts/deploy.sh deploy -p cache

# Enable all optional services
./scripts/deploy.sh deploy -p storage,cache,tools
```

## 🏗️ Manual Docker Commands

If you prefer to use Docker commands directly:

### Pull the Latest Image

```bash
docker pull ghcr.io/YOUR_USERNAME/pta:latest
```

### Run with Docker Compose

```bash
# Start all services
docker compose --env-file .env up -d

# Run database migrations
docker compose --env-file .env run --rm app bunx prisma migrate deploy

# View logs
docker compose logs -f
```

### Run Database Migrations

```bash
docker compose --env-file .env run --rm app bunx prisma migrate deploy
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit actual environment files to git
2. **Database Password**: Use a strong, unique password for PostgreSQL
3. **JWT Secret**: Use a cryptographically secure random string (minimum 32 characters)
4. **HTTPS**: Always use HTTPS in production with a reverse proxy (nginx, Traefik, etc.)
5. **Firewall**: Only expose necessary ports (3000 for the app, 443/80 for web traffic)

## 🌐 Production Setup with Reverse Proxy

For production, it's recommended to use a reverse proxy like nginx or Traefik:

### Example nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring and Health Checks

The Docker setup includes health checks for all services:

- **App**: Checks if Bun runtime is working
- **Database**: PostgreSQL readiness check
- **MinIO**: Storage service health check
- **Redis**: Redis ping check

Monitor your deployment with:

```bash
# Check service health
docker compose ps

# View resource usage
docker stats
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**   ```bash
   # Check if database is running
   docker compose logs db
   
   # Run migrations manually
   docker compose run --rm app bunx prisma migrate deploy
   ```

2. **Email Issues**   ```bash
   # Test email configuration
   docker compose run --rm app bun run scripts/test-email.js your-email@example.com
   ```

3. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

4. **Port Conflicts**
   ```bash
   # Check what's using the port
   sudo lsof -i :3000
     # Change port in compose.yaml
   ports:
     - "8080:3930"  # Use port 8080 instead
   ```

### Getting Help

- Check the application logs: `./scripts/deploy.sh logs -f`
- Review Docker Compose status: `docker compose ps`
- Verify environment variables: `docker compose config`

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
