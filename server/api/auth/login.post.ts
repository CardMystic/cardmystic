// Mock authentication endpoints - Replace with actual backend implementation
import type { UserProfile } from '~/models/userModel';

// In-memory mock data (for development only)
const mockUsers: UserProfile[] = [
  {
    id: '1',
    username: 'demo_user',
    email: 'demo@cardmystic.io',
    profile_image: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let currentUserId: string | null = null;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  // Mock login - in production, this would verify credentials with backend
  const user = mockUsers.find(u => u.email === body.email);
  
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Invalid credentials',
    });
  }

  currentUserId = user.id;
  
  // Set a mock session cookie
  setCookie(event, 'user_id', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return user;
});
