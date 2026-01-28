// Mock unfollow endpoint
export default defineEventHandler(async (event) => {
  const userId = getCookie(event, 'user_id');
  const followingId = event.context.params?.id;
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated',
    });
  }

  // Mock unfollow - in production, this would delete from database
  return { success: true, id: followingId };
});
