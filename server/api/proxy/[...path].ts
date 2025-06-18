export default defineEventHandler(async (event) => {
  const pathParam = event.context.params?.path;
  const path = Array.isArray(pathParam)
    ? pathParam.join('/')
    : (pathParam ?? '');

  const body = await readBody(event);
  const method = event.method;

  const response = await $fetch(`http://localhost:3000/${path}`, {
    method,
    body: ['POST', 'PUT', 'PATCH'].includes(method) ? body : undefined,
    query: getQuery(event),
  });

  return response;
});
