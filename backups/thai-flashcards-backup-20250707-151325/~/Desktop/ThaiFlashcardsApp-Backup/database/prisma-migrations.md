# Prisma Database Migrations

This document explains how to run Prisma migrations to set up your database schema.

## Running Migrations

After deploying your application to Railway and setting up environment variables, you need to run the migrations to create the database schema:

```bash
# Connect to your Railway deployment
railway connect

# Generate Prisma client based on your schema
npx prisma generate

# Run migrations to set up the database schema
npx prisma migrate deploy
```

## Manual Setup (Alternative)

If there are issues with migrations, you can use Prisma's introspection to recreate your schema:

```bash
# Generate SQL from your schema
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > setup.sql

# You can then run this SQL in your Supabase SQL editor
```

## Seeding the Database

To create a default flashcard set:

```bash
# Run the seed script to create initial data
node app/lib/seed-default-set.ts
```

Alternatively, you can create an account and use the Set Wizard in the application to create new flashcard sets.

## Verifying Database Setup

To check if your database was correctly set up:

```bash
# Check which tables exist in your database
npx prisma db pull --print

# View data in a specific table
npx prisma studio
```

## Troubleshooting

If you encounter `PrismaClientInitializationError`, check:

1. Ensure your DATABASE_URL and DIRECT_DATABASE_URL environment variables are correctly set
2. Verify the Supabase PostgreSQL server is running and accessible
3. Check that your IP address is not blocked by Supabase firewall settings
4. Ensure connection string format is correct (especially no brackets around passwords)

For more detailed Prisma troubleshooting, visit: https://www.prisma.io/docs/reference/api-reference/error-reference 