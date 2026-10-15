import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { SearchAccess } from '~/models/searchAccessModel';
import { BACKEND_USER_AUTH_HEADER } from '~/utils/backendRequestHeaders';

export function useSearchAccess() {
  const { userId, loading } = useUserProfile();
  const config = useRuntimeConfig();
  const supabase = process.server ? null : useSupabase();
  const client = useQueryClient();
  const mounted = useState('billing-session-ready', () => false);
  onMounted(() => {
    mounted.value = true;
  });
  const ready = computed(
    () => import.meta.client && mounted.value && !loading.value,
  );
  const key = computed(() => ['search-access', userId.value]);
  async function headers() {
    const session = await supabase?.auth.getSession();
    if (session?.error) throw new Error('Please sign in again.');
    const token = session?.data.session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { [BACKEND_USER_AUTH_HEADER]: `Bearer ${token}` } : {}),
    };
  }
  async function request<T>(path: string, body?: unknown): Promise<T> {
    const response = await globalThis.fetch(
      `${config.public.backendPath}${path}`,
      {
        method: body === undefined ? 'GET' : 'POST',
        headers: await headers(),
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      },
    );
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result?.message ?? 'Membership could not be verified. Please retry.',
      );
    return result as T;
  }
  const query = useQuery({
    queryKey: key,
    enabled: ready,
    queryFn: () => request<SearchAccess>('/search-access'),
    staleTime: 30_000,
    retry: false,
  });
  return {
    access: query.data,
    pending: query.isPending,
    error: query.error,
    refresh: query.refetch,
    ready,
    userId,
    request,
    headers,
    report: (access: Partial<SearchAccess>, subject: string | null) => {
      if (userId.value !== subject) return;
      client.setQueryData<SearchAccess>(key.value, (previous) =>
        previous ? { ...previous, ...access } : undefined,
      );
    },
  };
}

export function useMeteredSearchRequest() {
  const access = useSearchAccess();
  const route = useRoute();
  const router = useRouter();
  const toast = useToast();
  const notice = useState('search-allowance-notice', () => '');
  const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const subject = access.userId.value;
    const searchLocation = route.fullPath;
    const response = await globalThis.fetch(input, {
      ...init,
      headers: {
        ...Object.fromEntries(new Headers(init?.headers)),
        ...(await access.headers()),
      },
    });
    const header = response.headers.get('x-search-access');
    if (header && subject === access.userId.value) {
      const decision = JSON.parse(header);
      access.report(decision, subject);
      if (
        ['allowance_exhausted', 'guest_identity_unavailable'].includes(
          decision.reason,
        ) &&
        route.fullPath === searchLocation &&
        route.query.useRerank !== 'false'
      ) {
        await router.replace({
          path: route.path,
          query: { ...route.query, useRerank: 'false' },
          hash: route.hash,
        });
      }
      if (
        decision.reason &&
        decision.reason !== 'enhancement_unavailable' &&
        notice.value !== `${subject}:${decision.resetsAt}`
      ) {
        notice.value = `${subject}:${decision.resetsAt}`;
        toast.add({
          title: 'Search mode switched to Normal',
          description:
            decision.reason === 'guest_identity_unavailable'
              ? 'Your guest allowance could not be verified. Your results are shown in Normal mode. Sign in to use your account allowance.'
              : 'You have used your available Enhanced searches. Your results are shown in Normal mode. Free allowances reset at midnight UTC.',
          actions: [{ label: 'View memberships', to: '/memberships' }],
          duration: 10000,
        });
      } else if (decision.reason === 'enhancement_unavailable') {
        toast.add({
          title: 'Enhanced search is unavailable',
          description:
            'Your results use Normal mode. This search did not use your allowance.',
        });
      }
    }
    return response;
  };
  return { ...access, fetch };
}
