// Mock following endpoint
import type { UserFollow } from '~/models/userModel';

// In-memory mock storage
const followsStore = new Map<string, UserFollow[]>();

export default defineEventHandler(async (event) => {
  const userId = getCookie(event, 'user_id');
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated',
    });
  }

  // Return following list for user
  const follows = followsStore.get(userId) || [];
  return follows;
});
