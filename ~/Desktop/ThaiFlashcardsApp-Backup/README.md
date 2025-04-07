# ThaiFlashcardsApp - Full Backup

This folder contains a complete backup of the ThaiFlashcardsApp as of April 7, 2025. This backup contains everything needed to restore the application to its exact state on a new machine.

## Backup Structure

```
ThaiFlashcardsApp-Backup/
├── code/                  # Complete source code with all hidden files
├── database/              # Database setup instructions
├── environment/           # Environment variables and configuration
├── docs/                  # Deployment and setup documentation
└── README.md              # This file
```

## Restoration Guide

To fully restore this application:

1. **Database Setup**: 
   - Follow the instructions in `database/supabase-setup.md` to create a new Supabase project
   - Save your connection details for the next steps

2. **Code Deployment**:
   - Use the code in the `code/` directory to create a new GitHub repository
   - Deploy to Railway following the guide in `docs/deployment-guide.md`

3. **Environment Configuration**:
   - Add the environment variables listed in `environment/railway-variables.md` to your Railway project
   - Be sure to update URLs and connection strings to match your new deployment

4. **Database Migration**:
   - Run the Prisma migrations after deployment to set up the database schema

## Important Notes

- All passwords in connection strings should be updated to match your new Supabase project
- The NEXTAUTH_URL should be updated to match your new Railway deployment URL
- Generate a new NEXTAUTH_SECRET for production (can use: `openssl rand -base64 32`)

## Application URLs

- Original Application URL: https://thaiflashcardsapp-production.up.railway.app
- GitHub Repository: https://github.com/MaartenRischen/ThaiFlashcardsApp

## Technical Stack

- Framework: Next.js 14
- Authentication: NextAuth.js v5 beta
- Database ORM: Prisma 6.5.0
- Database: Supabase PostgreSQL
- Deployment: Railway
- AI Integration: Google Gemini API

This backup was created on: April 7, 2025 