export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const response = await $fetch(`http://localhost:3000/search`, {
    method: 'POST',
    body: body,
  });

  return response;
});
