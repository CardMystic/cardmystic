const config = useRuntimeConfig();

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  console.log('url: ', `${config.public.NUXT_PUBLIC_API_URL}:${config.public.NUXT_PUBLIC_API_PORT}/search`)

  const response = await $fetch(`${config.public.NUXT_PUBLIC_API_URL}:${config.public.NUXT_PUBLIC_API_PORT}/search`, {
    method: 'POST',
    body: body
  });

  return response;
});