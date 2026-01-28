// Mock user profile endpoint
import type { UserProfile } from '~/models/userModel';

export default defineEventHandler(async (event) => {
  const userId = getCookie(event, 'user_id');
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated',
    });
  }

  if (event.method === 'GET') {
    // Mock profile fetch
    const profile: UserProfile = {
      id: userId,
      username: 'demo_user',
      email: 'demo@cardmystic.io',
      profile_image: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return profile;
  }

  if (event.method === 'PUT') {
    // Mock profile update
    const body = await readBody(event);
    const updatedProfile: UserProfile = {
      id: userId,
      username: body.username || 'demo_user',
      email: 'demo@cardmystic.io',
      profile_image: body.profile_image,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return updatedProfile;
  }

  throw createError({
    statusCode: 405,
    message: 'Method not allowed',
  });
});
