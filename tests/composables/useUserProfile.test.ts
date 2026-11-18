import { computed, readonly, ref } from 'vue';
import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  onAuthStateChange: vi.fn(),
  invalidateQueries: vi.fn(),
}));
vi.mock('~/composables/useSupabase', () => ({
  useSupabase: () => ({ auth: { onAuthStateChange: mocks.onAuthStateChange } }),
}));
vi.mock('@tanstack/vue-query', () => ({
  useQuery: () => ({
    data: ref(null),
    isLoading: ref(false),
    refetch: vi.fn(),
  }),
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
});

it('refreshes the signed-in profile without recording a signup or consuming the Ads conversion flag', async () => {
  const storage = new Map([['pendingOAuthSignup', 'true']]);
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => storage.get(key),
    removeItem: (key: string) => storage.delete(key),
  });
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  vi.stubGlobal('computed', computed);
  vi.stubGlobal('readonly', readonly);
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: { backendPath: '/api/backend' },
  }));
  mocks.onAuthStateChange.mockReturnValue({ data: { subscription: {} } });
  const { useUserProfile } = await import('~/composables/useUserProfile');
  useUserProfile().initAuthListener();
  const listener = mocks.onAuthStateChange.mock.calls[0]![0];
  for (const event of ['INITIAL_SESSION', 'SIGNED_IN']) {
    await listener(event, { access_token: 'test-token' });
  }
  expect(mocks.invalidateQueries.mock.calls).toEqual([
    [{ queryKey: ['user'] }],
    [{ queryKey: ['profile'] }],
    [{ queryKey: ['user'] }],
    [{ queryKey: ['profile'] }],
  ]);
  expect(fetch).not.toHaveBeenCalled();
  expect(storage.get('pendingOAuthSignup')).toBe('true');
});
