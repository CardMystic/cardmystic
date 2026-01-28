// Mock registration endpoint
import type { UserProfile } from '~/models/userModel';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  // Mock user creation - in production, this would create a user in the backend
  const newUser: UserProfile = {
    id: String(Date.now()),
    username: body.username,
    email: body.email,
    profile_image: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  setCookie(event, 'user_id', newUser.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return newUser;
});
