// Mock user follow/following endpoints
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

  if (event.method === 'GET') {
    // Return following list for user
    const follows = followsStore.get(userId) || [];
    return follows;
  }

  if (event.method === 'POST') {
    // Follow a user
    const body = await readBody(event);
    const follows = followsStore.get(userId) || [];
    
    const newFollow: UserFollow = {
      id: String(Date.now()),
      follower_id: userId,
      following_id: body.user_id,
      following_username: `user_${body.user_id}`,
      created_at: new Date().toISOString(),
    };

    follows.push(newFollow);
    followsStore.set(userId, follows);
    
    return newFollow;
  }

  throw createError({
    statusCode: 405,
    message: 'Method not allowed',
  });
});
