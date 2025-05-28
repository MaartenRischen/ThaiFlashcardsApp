console.log('=== SERVER DEBUG START ===');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  HOSTNAME: process.env.HOSTNAME,
});

// Check if server.js exists
const fs = require('fs');
const path = require('path');

console.log('Checking for server.js...');
const serverPath = path.join(process.cwd(), 'server.js');
console.log('Looking for server at:', serverPath);
console.log('File exists:', fs.existsSync(serverPath));

// List all files in current directory
console.log('\nFiles in current directory:');
const files = fs.readdirSync(process.cwd());
files.forEach(file => {
  const stat = fs.statSync(file);
  console.log(`  ${file} (${stat.isDirectory() ? 'dir' : 'file'})`);
});

// Check .next directory
const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  console.log('\nFiles in .next directory:');
  const nextFiles = fs.readdirSync(nextDir);
  nextFiles.forEach(file => console.log(`  ${file}`));
}

// Try to start the server
console.log('\n=== STARTING SERVER ===');
try {
  require('./server.js');
} catch (error) {
  console.error('Failed to start server:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
} 