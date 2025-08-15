const runtimeConfig = useRuntimeConfig();

export default defineEventHandler(async (event) => {
  const pathParam = event.context.params?.path;
  const path = Array.isArray(pathParam)
    ? pathParam.join('/')
    : (pathParam ?? '');

  const target = `${runtimeConfig.backendUrl}/${path}`;

  // In development, fallback to production API if primary backend is not available
  if (process.env.NODE_ENV === 'development') {
    try {
      return await proxyRequest(event, target);
    } catch (error) {
      // If the primary backend fails, try the fallback URL
      const fallbackTarget = `https://api.next.cardmystic.io/${path}`;
      return proxyRequest(event, fallbackTarget);
    }
  }

  return proxyRequest(event, target);
});
