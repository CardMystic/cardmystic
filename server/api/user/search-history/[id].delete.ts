// Mock delete single search history item endpoint
export default defineEventHandler(async (event) => {
  const userId = getCookie(event, 'user_id');
  const itemId = event.context.params?.id;
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated',
    });
  }

  // Mock delete - in production, this would delete from database
  return { success: true, id: itemId };
});
