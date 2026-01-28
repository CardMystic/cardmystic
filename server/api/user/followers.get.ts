// Mock followers endpoint
import type { UserFollow } from '~/models/userModel';

export default defineEventHandler(async (event) => {
  const userId = getCookie(event, 'user_id');
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated',
    });
  }

  // Mock followers list - in production, this would query database
  const mockFollowers: UserFollow[] = [];
  
  return mockFollowers;
});
