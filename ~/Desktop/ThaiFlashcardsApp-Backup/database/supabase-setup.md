# Supabase Database Setup

## Creating a New Supabase Project

1. Create an account on [Supabase](https://supabase.com/) if you don't have one
2. Create a new project with the following settings:
   - Name: ThaiFlashcardsApp (or any name you prefer)
   - Database Password: Create a strong password and save it
   - Region: Select 'Southeast Asia (Singapore)' to match the current setup
   - Pricing Plan: Free tier is sufficient for development

## Database Configuration

After project creation, follow these steps:

1. Record your database connection details from:
   - Project Settings → Database → Connection String → URI
   - You'll need both the direct connection string and the pooler connection string

2. Database schema will be automatically created by Prisma migrations on first deployment

## Security Settings

1. In Project Settings → Database → Network Settings:
   - Ensure "Require SSL" is enabled
   - No IP restrictions are necessary unless you want to limit access
   
2. Make sure your database password used in the connection strings matches the one you set when creating the project

## Initial Setup

When setting up a new instance, you'll run the Prisma migration command to create all necessary tables:

```bash
# From your project root after deployment
npx prisma migrate deploy
```

This will create the schema based on the prisma/schema.prisma file included in the code backup. 