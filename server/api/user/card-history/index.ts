// Mock card history endpoint
import type { CardHistoryItem } from '~/models/userModel';

// In-memory mock storage
const cardHistoryStore = new Map<string, CardHistoryItem[]>();

export default defineEventHandler(async (event) => {
  const userId = getCookie(event, 'user_id');
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated',
    });
  }

  if (event.method === 'GET') {
    // Return card history for user (limited to 50 items)
    const history = cardHistoryStore.get(userId) || [];
    return history.slice(0, 50);
  }

  if (event.method === 'POST') {
    // Add card to history
    const body = await readBody(event);
    const history = cardHistoryStore.get(userId) || [];
    
    const newItem: CardHistoryItem = {
      id: String(Date.now()),
      user_id: userId,
      card_id: body.card_id,
      card_name: body.card_name,
      viewed_at: new Date().toISOString(),
    };

    // Add to front, limit to 50 items
    history.unshift(newItem);
    cardHistoryStore.set(userId, history.slice(0, 50));
    
    return newItem;
  }

  if (event.method === 'DELETE') {
    // Clear all card history
    cardHistoryStore.set(userId, []);
    return { success: true };
  }

  throw createError({
    statusCode: 405,
    message: 'Method not allowed',
  });
});
