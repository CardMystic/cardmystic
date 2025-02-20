export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const response = await $fetch(`${process.env.BACKEND_URL}:${process.env.BACKEND_PORT}/search`, {
    method: 'POST',
    body: body
  });

  return response;
});