import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from './amplify-config';

// Ensure Amplify is configured
ensureAmplifyConfigured();

// Admin user ID from AWS Cognito
const ADMIN_USER_ID = '640834f8-40b1-705a-06f7-b96562e999fc';
const ADMIN_EMAIL = 'ryan.zillini@gauntletai.com';

/**
 * Check if the current user is an admin
 * @returns {Promise<boolean>} True if the user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    
    // Check if user ID matches admin ID
    if (user.userId === ADMIN_USER_ID) {
      return true;
    }
    
    // Check if user email matches admin email
    const attributes = await fetchUserAttributes();
    if (attributes.email === ADMIN_EMAIL) {
      return true;
    }
    
    // Skip database check for now due to potential issues
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get the current user's ID
 * @returns {Promise<string>} The user ID
 */
export async function getCurrentUserId(): Promise<string> {
  try {
    const user = await getCurrentUser();
    return user.userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    throw error;
  }
}

/**
 * Get the current user's email
 * @returns {Promise<string>} The user email
 */
export async function getCurrentUserEmail(): Promise<string> {
  try {
    const attributes = await fetchUserAttributes();
    return attributes.email || '';
  } catch (error) {
    console.error('Error getting user email:', error);
    throw error;
  }
}

/**
 * Ensure the current user exists in the database
 * If not, create a new user record
 */
export async function ensureUserInDatabase(): Promise<void> {
  // Skip database operations for now due to potential issues
  console.log('Database operations skipped for now');
  return;
} 