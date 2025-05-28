# Base on Node Alpine
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for environment variables
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ARG DATABASE_URL
ARG DIRECT_DATABASE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG IDEOGRAM_API_KEY
ARG GEMINI_API_KEY
ARG OPENROUTER_API_KEY
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL

# Set them as environment variables for the build
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY
ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_DATABASE_URL=$DIRECT_DATABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV IDEOGRAM_API_KEY=$IDEOGRAM_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY
ENV OPENROUTER_API_KEY=$OPENROUTER_API_KEY
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Build Next.js
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public folder
COPY --from=builder /app/public ./public

# IMPORTANT: For standalone builds, we need to copy files in the correct structure
# Copy the standalone folder contents (not the folder itself)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/. ./

# Copy static files separately (they're not included in standalone)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# IMPORTANT: Set PORT explicitly for Railway health checks
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

EXPOSE 3000

# The standalone build creates server.js in the root
CMD ["node", "server.js"] 