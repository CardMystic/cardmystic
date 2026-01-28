// Mock profile image upload endpoint
export default defineEventHandler(async (event) => {
  const userId = getCookie(event, 'user_id');
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated',
    });
  }

  // Mock image upload - in production, this would upload to cloud storage
  // For now, return a placeholder image URL
  const mockImageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;

  return { url: mockImageUrl };
});
