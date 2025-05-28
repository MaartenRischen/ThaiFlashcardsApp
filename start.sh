#!/bin/sh

# Ensure PORT is set
export PORT=${PORT:-3000}
export HOSTNAME=${HOSTNAME:-0.0.0.0}

echo "Starting Next.js server..."
echo "PORT: $PORT"
echo "HOSTNAME: $HOSTNAME"
echo "NODE_ENV: $NODE_ENV"

# Start the Next.js standalone server
exec node server.js 