export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  console.log('url: ', `${process.env.NUXT_PUBLIC_API_URL}:${process.env.NUXT_PUBLIC_API_PORT}/search`)

  const response = await $fetch(`${process.env.NUXT_PUBLIC_API_URL}:${process.env.NUXT_PUBLIC_API_PORT}/search`, {
    method: 'POST',
    body: body
  });

  return response;
});