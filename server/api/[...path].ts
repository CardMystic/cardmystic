const runtimeConfig = useRuntimeConfig();

export default defineEventHandler(async (event) => {
  const pathParam = event.context.params?.path;
  const path = Array.isArray(pathParam)
    ? pathParam.join('/')
    : (pathParam ?? '');

  const target = `${runtimeConfig.backendUrl}/${path}`;

  return proxyRequest(event, target);
});
