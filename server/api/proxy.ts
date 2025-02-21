export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const response = await $fetch(`https://api.cardmystic.io/search`, {
    method: 'POST',
    body: body
  });

  return response;
});