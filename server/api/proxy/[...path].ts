export default defineEventHandler(async (event) => {
  const pathParam = event.context.params?.path;
  const path = Array.isArray(pathParam)
    ? pathParam.join('/')
    : (pathParam ?? '');

  const method = event.method;

  // Only read body for methods that typically have a body
  const body = ['POST', 'PUT', 'PATCH'].includes(method)
    ? await readBody(event)
    : undefined;

  const response = await $fetch(`${env.BACKEND_URL}/${path}`, {
    method,
    body,
    query: getQuery(event),
  });

  return response;
});
