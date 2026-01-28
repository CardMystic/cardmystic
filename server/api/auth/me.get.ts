// Mock get current user endpoint
import type { UserProfile } from '~/models/userModel';

export default defineEventHandler(async (event) => {
  const userId = getCookie(event, 'user_id');
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated',
    });
  }

  // Mock user data - in production, this would fetch from backend
  const user: UserProfile = {
    id: userId,
    username: 'demo_user',
    email: 'demo@cardmystic.io',
    profile_image: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return user;
});
