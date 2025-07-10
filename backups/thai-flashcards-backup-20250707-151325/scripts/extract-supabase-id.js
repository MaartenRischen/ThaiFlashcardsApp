/**
 * This script extracts the Supabase project ID from the URL
 * Run with: node scripts/extract-supabase-id.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not defined in your environment variables.');
  process.exit(1);
}

const match = supabaseUrl.match(/https:\/\/([a-zA-Z0-9-]+)\.supabase\.co/);

if (match && match[1]) {
  const projectId = match[1];
  console.log('');
  console.log('Your Supabase Project ID is:', projectId);
  console.log('');
  console.log('Add this to your environment variables:');
  console.log('NEXT_PUBLIC_SUPABASE_PROJECT_ID=' + projectId);
  console.log('');
  
  // Try to write to .env.local
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    // Read existing file if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check if the variable is already defined
      if (envContent.includes('NEXT_PUBLIC_SUPABASE_PROJECT_ID=')) {
        // Replace existing line
        envContent = envContent.replace(
          /NEXT_PUBLIC_SUPABASE_PROJECT_ID=.*/,
          `NEXT_PUBLIC_SUPABASE_PROJECT_ID=${projectId}`
        );
      } else {
        // Add new line
        envContent += `\nNEXT_PUBLIC_SUPABASE_PROJECT_ID=${projectId}\n`;
      }
    } else {
      // Create new file
      envContent = `NEXT_PUBLIC_SUPABASE_PROJECT_ID=${projectId}\n`;
    }
    
    // Write to file
    fs.writeFileSync(envPath, envContent);
    console.log(`Successfully wrote Supabase Project ID to ${envPath}`);
  } catch (error) {
    console.error('Error writing to .env.local file:', error.message);
    console.log('Please add the Supabase Project ID to your environment variables manually.');
  }
} else {
  console.error('Error: Could not extract project ID from Supabase URL:', supabaseUrl);
  process.exit(1);
} 