# PTA - Project Tracking Application

A comprehensive project management application built with SvelteKit, featuring team collaboration, task management, and email-based user invitations.

## Features

### 🚀 Core Features
- **Project Management**: Create, update, and organize projects
- **Task Tracking**: Kanban-style task management with drag-and-drop
- **File Management**: Upload and manage project files
- **Team Collaboration**: Invite team members via email
- **User Authentication**: Secure login with email verification

### 👥 Collaboration Features
- **Email Invitations**: Invite users to projects via email
- **Role-based Access**: Admin and Member roles with different permissions
- **User Onboarding**: Guided setup for invited users
- **Member Management**: Add/remove team members from projects

### 📧 Email System
- **Email Verification**: Required for new user registrations
- **Project Invitations**: Automated email invitations for collaboration
- **SMTP Integration**: Configurable email service (Gmail, Outlook, etc.)

## Setup

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL database
- SMTP email service (Gmail, Outlook, etc.)

### 🐳 Docker Deployment (Recommended)

The easiest way to deploy CoLab Manager is using Docker with our pre-built images from GitHub Container Registry.

**Quick Start:**
```bash
# Clone and configure
git clone <repository-url>
cd PTA
cp .env.example .env
# Edit .env with your values

# Deploy with one command
chmod +x scripts/deploy.sh
./scripts/deploy.sh deploy
```

**Access your application at:** http://localhost:3930

For detailed Docker deployment instructions, see [Docker Deployment Guide](docs/DOCKER_DEPLOYMENT.md).

### 💻 Local Development

For local development and testing:
```bash
git clone <repository-url>
cd PTA
bun install
# or
npm install
```

Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/pta_db"

# Authentication
JWT_SECRET="your-super-secure-jwt-secret"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="your-email@gmail.com"
EMAIL_FROM_NAME="PTA Team"

# Application URL
APP_URL="http://localhost:5173"
```

Set up the database:
```bash
bunx prisma migrate dev
# or
npx prisma migrate dev
```

(Optional) Seed the database:
```bash
bunx prisma db seed
# or
npx prisma db seed
```

Start the development server:
```bash
bun run dev
# or
npm run dev
```

The application will be available at `http://localhost:5173`

## Email Configuration

### Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an app-specific password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use your email and the generated password in the environment variables

### Other Email Providers
The application supports any SMTP server. Update the SMTP configuration in your `.env` file accordingly.

## Usage

### User Registration & Email Verification
1. Users register with email, name, and password
2. Verification email is sent automatically
3. Users must verify their email before logging in

### Project Collaboration
1. Project admins can invite users via email
2. Invitations work for both existing and new users
3. New users are guided through account setup
4. Members can be assigned different roles (Admin/Member)

### Member Management
- View all project members with their roles
- Remove members (Admin only)
- Invite new members via email

## API Endpoints

### Authentication
- `POST /api/register` - User registration with email verification
- `POST /api/login` - User login
- `GET /auth/verify` - Email verification endpoint

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project

### Project Members
- `GET /api/projects/[id]/members` - List project members
- `POST /api/projects/[id]/members` - Invite user to project
- `DELETE /api/projects/[id]/members/[userId]` - Remove member

### User Setup
- `POST /api/auth/setup` - Complete user profile setup (for invited users)

## Building

To create a production version:
```bash
bun run build
# or
npm run build
```

Preview the production build:
```bash
bun run preview
# or
npm run preview
```

## Deployment

The application can be deployed to any platform that supports Node.js applications. Make sure to:

1. Set up your production database
2. Configure environment variables on your hosting platform
3. Set up your SMTP email service
4. Update the `APP_URL` to your production domain

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
