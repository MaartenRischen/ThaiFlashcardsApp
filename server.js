// Custom server.js wrapper for standalone Next.js server
const { join } = require('path');

// Get Next.js server path from standalone output
const nextServerPath = join(__dirname, '.next/standalone/server.js');

// Log startup details
console.log('Starting custom standalone server');
console.log(`Node version: ${process.version}`);
console.log(`Server path: ${nextServerPath}`);
console.log(`PORT env: ${process.env.PORT || '8080 (default)'}`);

try {
  // Import and start the Next.js server
  require(nextServerPath);
  console.log('Next.js server started successfully');
} catch (error) {
  console.error('Failed to start Next.js server:', error);
  process.exit(1);
} 