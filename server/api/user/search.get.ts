// Mock user search endpoint
import type { UserSearchResult } from '~/models/userModel';

export default defineEventHandler(async (event) => {
  const userId = getCookie(event, 'user_id');
  const query = getQuery(event);
  const searchQuery = query.q as string;
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated',
    });
  }

  if (!searchQuery) {
    return [];
  }

  // Mock search results - in production, this would search database
  const mockResults: UserSearchResult[] = [
    {
      id: '2',
      username: `${searchQuery}_fan`,
      profile_image: `https://api.dicebear.com/7.x/avataaars/svg?seed=2`,
      is_following: false,
    },
    {
      id: '3',
      username: `${searchQuery}_player`,
      profile_image: `https://api.dicebear.com/7.x/avataaars/svg?seed=3`,
      is_following: false,
    },
  ];

  return mockResults;
});
