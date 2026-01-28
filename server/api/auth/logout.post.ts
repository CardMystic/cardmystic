// Mock logout endpoint
export default defineEventHandler(async (event) => {
  deleteCookie(event, 'user_id');
  return { success: true };
});
