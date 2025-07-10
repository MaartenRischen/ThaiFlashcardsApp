# ThaiFlashcardsApp Deployment Guide

This guide will help you deploy the ThaiFlashcardsApp to a new environment from scratch.

## Prerequisites

1. A [Railway](https://railway.app/) account
2. A [Supabase](https://supabase.com/) account
3. A [GitHub](https://github.com/) account for code hosting
4. [Node.js](https://nodejs.org/) installed on your local machine

## Step 1: Set Up the Database

Follow the instructions in the `../database/supabase-setup.md` file to create your Supabase PostgreSQL database.

## Step 2: Prepare the Code

1. Create a new GitHub repository
2. Upload the entire content of the `../code/` folder to the repository
3. Make sure to include all hidden files (.env, .gitignore, etc.)

## Step 3: Deploy to Railway

1. Log in to [Railway](https://railway.app/)
2. Create a new project
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account and select the repository you created in Step 2
5. Configure the project:
   - Environment: Node.js
   - Build Command: `npm run build`
   - Start Command: `npm start`

## Step 4: Set Environment Variables

Add all environment variables listed in `../environment/railway-variables.md` to your Railway project:

1. In your Railway project dashboard, go to the "Variables" tab
2. Add each variable exactly as specified in the environment variables document
3. Make sure to update:
   - `NEXTAUTH_URL` with your actual Railway project URL
   - `DATABASE_URL` and `DIRECT_DATABASE_URL` with your Supabase connection strings
   - Remove any square brackets around passwords in the connection strings

## Step 5: Run Migrations

After deployment, connect to your Railway instance and run the following commands to set up the database:

```bash
npx prisma generate
npx prisma migrate deploy
```

## Step 6: Verify Deployment

1. Wait for the deployment to complete
2. Visit your Railway application URL
3. Try registering a new user and logging in
4. Check the logs for any errors:
   - Go to the "Deployments" tab in Railway
   - Select the most recent deployment
   - Click "View Logs"

## Troubleshooting

### Database Connection Issues

If you see errors related to database connection:
1. Double-check your `DATABASE_URL` and `DIRECT_DATABASE_URL` variables
2. Ensure passwords don't contain brackets or special characters that need escaping
3. Verify that the Supabase project is in the correct region and SSL is enabled

### Authentication Problems

If NextAuth.js isn't working properly:
1. Verify `NEXTAUTH_URL` matches your actual deployed URL
2. Make sure `NEXTAUTH_SECRET` is set correctly
3. Check Railway logs for any specific error messages

## Maintenance

To update the application:
1. Push changes to your GitHub repository
2. Railway will automatically detect changes and deploy the new version

Remember to update your backup if you make significant changes to the application. 