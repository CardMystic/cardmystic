// Mock search history endpoint
import type { SearchHistoryItem } from '~/models/userModel';

// In-memory mock storage
const searchHistoryStore = new Map<string, SearchHistoryItem[]>();

export default defineEventHandler(async (event) => {
  const userId = getCookie(event, 'user_id');
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated',
    });
  }

  if (event.method === 'GET') {
    // Return search history for user (limited to 50 items)
    const history = searchHistoryStore.get(userId) || [];
    return history.slice(0, 50);
  }

  if (event.method === 'POST') {
    // Add search to history
    const body = await readBody(event);
    const history = searchHistoryStore.get(userId) || [];
    
    const newItem: SearchHistoryItem = {
      id: String(Date.now()),
      user_id: userId,
      query: body.query,
      filters: body.filters,
      created_at: new Date().toISOString(),
    };

    // Add to front, limit to 50 items
    history.unshift(newItem);
    searchHistoryStore.set(userId, history.slice(0, 50));
    
    return newItem;
  }

  if (event.method === 'DELETE') {
    // Clear all search history
    searchHistoryStore.set(userId, []);
    return { success: true };
  }

  throw createError({
    statusCode: 405,
    message: 'Method not allowed',
  });
});
