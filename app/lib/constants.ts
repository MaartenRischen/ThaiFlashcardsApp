// Admin user IDs - these users have special permissions
export const ADMIN_USER_IDS = [
  'user_2w7FgmYkPXUKYesPpqgxeAF7C1h', // rischenme@gmail.com
  // Add the Clerk user ID for maartenrischen@protonmail.com here once known
];

// Helper function to check if a user is an admin
export function isAdminUser(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return ADMIN_USER_IDS.includes(userId);
} 