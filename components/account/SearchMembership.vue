<script setup lang="ts">
import type { BillingStatus } from '~/models/searchAccessModel';
import {
  membershipPlans as plans,
  membershipTierLabels as tierLabels,
} from '~/utils/membershipPlans';
const emit = defineEmits<{ changed: [] }>();
const { userProfile: session, userId } = useUserProfile();
const {
  access,
  pending,
  error: accessError,
  refresh,
  request,
  ready,
} = useSearchAccess();
const api = {
  status: () => request<BillingStatus>('/billing/status'),
  checkout: (product: 'enhanced' | 'enhanced-topup') =>
    request<{ url: string }>('/billing/checkout', { product }),
  portal: () => request<{ url: string }>('/billing/portal', {}),
};
const context = {
  capture: () => userId.value,
  isCurrent: (id: string | null) => id === userId.value,
};
const accountDate = (date: string) => new Date(date).toLocaleDateString();
function safeStripeUrl(value: string, kind: 'checkout' | 'portal') {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      url.hostname ===
        (kind === 'checkout' ? 'checkout.stripe.com' : 'billing.stripe.com')
      ? url.href
      : null;
  } catch {
    return null;
  }
}
const billingErrorMessage = (failure: unknown) =>
  failure instanceof Error
    ? failure.message
    : 'Stripe is unavailable. Please retry.';
const billing = ref<BillingStatus>();
const loading = ref(true);
const busy = ref(false);
const loadFailed = ref(false);
const error = ref('');
const errorNotice = ref<HTMLElement | null>(null);
const route = useRoute();
const outcome = computed(() => route.query.billing);
const signInUrl = '/user/login?redirect=/memberships';
const verified = computed(
  () =>
    !loading.value &&
    !loadFailed.value &&
    !accessError.value &&
    billing.value &&
    billing.value.status !== 'unavailable',
);
const trialPlan = computed(() =>
  plans.find((plan) => plan.tier === billing.value?.tier),
);
const subscriptionNotice = computed(() => {
  switch (billing.value?.status) {
    case 'past_due':
      return 'Your payment is overdue. Update your payment method in Stripe.';
    case 'unpaid':
      return 'Your subscription is unpaid. Check your payment in Stripe.';
    case 'incomplete':
      return 'Your subscription payment is incomplete. Finish it in Stripe.';
    case 'paused':
      return 'Your subscription is paused. Manage it in Stripe.';
    default:
      return '';
  }
});
const topups = [
  {
    tier: 'enhanced-topup' as const,
    label: '1,000 Enhanced searches',
    price: 7,
    available: 'enhancedTopUpAvailable' as const,
  },
];
async function load() {
  if (!session.value) {
    loading.value = false;
    return;
  }
  const captured = context.capture();
  loading.value = true;
  loadFailed.value = false;
  error.value = '';
  try {
    const value = await api.status();
    if (!context.isCurrent(captured)) return;
    billing.value = value;
    await refresh();
    if (context.isCurrent(captured)) emit('changed');
  } catch {
    if (context.isCurrent(captured)) {
      billing.value = undefined;
      loadFailed.value = true;
    }
  } finally {
    if (context.isCurrent(captured)) loading.value = false;
  }
}
async function openStripe(tier?: 'enhanced' | 'enhanced-topup') {
  if (busy.value || loading.value) return;
  const captured = context.capture();
  busy.value = true;
  error.value = '';
  try {
    const result = tier ? await api.checkout(tier) : await api.portal();
    if (!context.isCurrent(captured)) return;
    const url = safeStripeUrl(result.url, tier ? 'checkout' : 'portal');
    if (!url) throw new Error('Invalid Stripe destination');
    await navigateTo(url, { external: true });
  } catch (failure) {
    if (context.isCurrent(captured)) {
      error.value = billingErrorMessage(failure);
      await nextTick();
      errorNotice.value?.focus();
    }
  } finally {
    if (context.isCurrent(captured)) busy.value = false;
  }
}
watch(
  [ready, userId],
  () => {
    billing.value = undefined;
    if (ready.value) void load();
  },
  { immediate: true },
);
</script>

<template>
  <section
    id="search-membership"
    class="account-service membership scroll-mt-24"
    aria-label="Search membership"
    :aria-busy="loading || busy"
  >
    <p
      v-if="error"
      ref="errorNotice"
      class="membership-notice"
      role="alert"
      tabindex="-1"
    >
      {{ error }}
    </p>
    <p v-if="outcome === 'success'" class="membership-notice" role="status">
      Stripe is confirming your purchase. Refresh your membership if it has not
      updated yet.
    </p>
    <p
      v-else-if="outcome === 'cancelled'"
      class="membership-notice"
      role="status"
    >
      Checkout canceled. No purchase was confirmed.
    </p>

    <div v-if="session" class="membership-account">
      <div class="membership-account-heading">
        <div>
          <p v-if="loading || pending" role="status">
            Checking your membership...
          </p>
          <p v-else-if="!verified" role="alert">
            Your membership could not be verified. Refresh to try again.
          </p>
          <p
            v-else-if="access"
            class="membership-current"
            :data-tier="access.tier"
          >
            Current search membership:
            <strong>{{ tierLabels[access.tier] }}</strong>
          </p>
          <p
            v-if="
              verified && billing?.status === 'trialing' && billing.trialEndsAt
            "
            class="membership-muted"
          >
            Your free month ends
            {{ accountDate(billing.trialEndsAt) }}.<template v-if="trialPlan">
              Then ${{ trialPlan.price }}/month unless you cancel.</template
            >
          </p>
          <p
            v-if="verified && subscriptionNotice"
            class="membership-muted"
            role="status"
          >
            {{ subscriptionNotice }}
          </p>
        </div>
        <div class="membership-account-actions">
          <button
            v-if="billing?.canManage"
            type="button"
            :disabled="busy || loading"
            @click="openStripe()"
          >
            {{
              billing.hasSubscription
                ? 'Change or cancel membership'
                : 'Manage billing'
            }}
          </button>
          <button
            class="membership-refresh"
            type="button"
            :disabled="busy || loading"
            aria-label="Refresh search membership"
            @click="load"
          >
            Refresh
          </button>
        </div>
      </div>
      <p
        v-if="verified && access"
        class="membership-muted membership-remaining"
      >
        <span
          ><strong>{{
            access.enhancedRemaining.toLocaleString('en-US')
          }}</strong>
          Enhanced left
          {{ access.tier === 'normal' ? 'today' : 'this month' }}</span
        >
        <span v-if="access.enhancedTopUpRemaining > 0"
          >{{ access.enhancedTopUpRemaining.toLocaleString('en-US') }} purchased
          Enhanced</span
        >
      </p>
    </div>

    <div class="membership-offer">
      <h2>CardMystic Enhanced</h2>
      <p class="membership-muted">
        Put better matches near the top with relevance reranking.
      </p>
    </div>
    <USkeleton
      v-if="session && loading"
      class="h-24 w-full"
      aria-label="Loading membership"
    />
    <div class="membership-plans">
      <article
        v-for="plan in plans"
        :key="plan.tier"
        class="membership-plan"
        :data-tier="plan.tier"
        :aria-labelledby="`membership-${plan.tier}-title`"
      >
        <div class="membership-plan-heading">
          <h3 :id="`membership-${plan.tier}-title`">{{ plan.name }}</h3>
          <span
            v-if="
              verified && billing?.hasSubscription && billing.tier === plan.tier
            "
            class="membership-current-label"
            >Current plan</span
          >
        </div>
        <p class="membership-price">
          <strong>${{ plan.price }}</strong
          ><span>/month</span>
        </p>
        <ul class="membership-features">
          <li>
            <strong>{{ plan.enhancedSearches.toLocaleString('en-US') }}</strong>
            Enhanced searches
          </li>
        </ul>
        <div class="membership-plan-action">
          <p v-if="billing?.trialEligible" class="membership-trial">
            1 month free, then ${{ plan.price }}/month
          </p>
          <a v-if="!session" class="membership-checkout" :href="signInUrl"
            >Sign in to choose {{ plan.name }}</a
          >
          <button
            v-else-if="
              billing &&
              billing[plan.available] &&
              !billing.hasSubscription &&
              billing.status !== 'unavailable'
            "
            class="membership-checkout"
            type="button"
            :disabled="busy || loading"
            @click="openStripe(plan.tier)"
          >
            {{
              billing.trialEligible
                ? `Start ${plan.name} free month`
                : `Choose ${plan.name}`
            }}
          </button>
          <template v-else-if="billing?.hasSubscription">
            <button
              v-if="billing.canManage && billing.tier !== plan.tier"
              class="membership-checkout"
              type="button"
              :disabled="busy || loading"
              @click="openStripe()"
            >
              Change plan in Stripe
            </button>
            <p v-else-if="billing.tier === plan.tier" class="membership-muted">
              Your current plan
            </p>
            <p v-else class="membership-muted">Plan changes are unavailable.</p>
          </template>
          <p v-else class="membership-muted">
            {{ loading ? 'Checking availability...' : 'Checkout unavailable' }}
          </p>
        </div>
      </article>
    </div>
    <div class="membership-plan-notes">
      <p>
        Includes Enhanced search access. Membership does not change featured
        placement.
      </p>
      <p v-if="!session || billing?.trialEligible">
        {{
          session
            ? 'One free calendar month per account.'
            : 'First month free for eligible accounts.'
        }}
        Payment method required. Renews monthly at the prices above; cancel
        anytime in Stripe.
      </p>
      <p v-else>
        Plans renew monthly. Change plans, payment details or cancel anytime in
        Stripe.
      </p>
    </div>

    <details class="membership-disclosure">
      <summary>Compare all features</summary>
      <MembershipComparison />
    </details>

    <MembershipSearchEvidence />

    <details class="membership-disclosure membership-topups">
      <summary>Need extra searches? Buy a top-up</summary>
      <p class="membership-muted">
        One-time purchase. No subscription needed. Unused top-ups carry forward.
      </p>
      <div class="membership-topup-options">
        <article
          v-for="topup in topups"
          :key="topup.tier"
          class="membership-topup"
        >
          <div>
            <h3>{{ topup.label }}</h3>
            <p>${{ topup.price }} one time</p>
          </div>
          <a v-if="!session" :href="signInUrl">Sign in to buy searches</a>
          <button
            v-else-if="billing?.[topup.available]"
            type="button"
            :disabled="busy || loading"
            @click="openStripe(topup.tier)"
          >
            Buy {{ topup.label }} for ${{ topup.price }}
          </button>
          <p v-else class="membership-muted">
            {{ loading ? 'Checking availability...' : 'Top-up unavailable' }}
          </p>
        </article>
      </div>
      <p class="membership-muted">
        For regular use, Enhanced is $7/month for 1,000 searches.
      </p>
    </details>
    <details class="membership-disclosure membership-footer">
      <summary>Free searches and resets</summary>
      <p>
        Free access includes 10 Enhanced searches per day. Normal search stays
        available. Guest allowances are shared on the same network.
      </p>
      <p>
        Enhanced membership replaces the free allowance with 1,000 searches per
        month. Daily limits reset at midnight UTC; monthly limits reset on the
        first, independently of your billing date. Included searches are used
        before purchased top-ups.
      </p>
    </details>
    <p
      v-if="!loading && billing && !billing.enabled"
      role="status"
      class="membership-muted"
    >
      Stripe payments are not configured yet.
    </p>
  </section>
</template>

<style scoped>
.membership {
  gap: 1.25rem;
  padding: 1rem;
}
.membership-muted,
.membership-plan-notes {
  color: var(--ui-text-muted);
  font-size: 0.875rem;
  line-height: 1.6;
}
.membership-offer {
  display: grid;
  gap: 0.375rem;
}
.membership-account {
  display: grid;
  gap: 0.75rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--ui-border);
}
.membership-account-heading,
.membership-account-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.membership-account-heading {
  justify-content: space-between;
}
.membership-account-heading > div:first-child {
  flex: 1 1 18rem;
}
.membership-account-actions button {
  font-size: 0.875rem;
}
.membership-current strong {
  font-size: 1.125rem;
}
.membership-remaining {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1.5rem;
}
.membership-plans {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem;
}
.membership-plan {
  --plan-accent: #6d28d9;
  --plan-bg: #faf7ff;
  --plan-border: #ddd0f5;
  --plan-button: #c1a3ff;
  --plan-button-text: #24113f;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  border: 1px solid var(--plan-border);
  border-radius: 0.5rem;
  background: var(--plan-bg);
}
.membership-plan:is([data-tier='pro'], [data-tier='pro-plus']) {
  --plan-accent: #924e11;
  --plan-bg: #fffbf4;
  --plan-border: #f4dab3;
  --plan-button: #ffc878;
  --plan-button-text: #3f250b;
}
.membership-plan-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  color: var(--plan-accent);
}
.membership-plan h3 {
  font-size: 1.25rem;
  font-weight: 700;
}
.membership-current-label {
  font-size: 0.75rem;
  font-weight: 600;
}
.membership-price {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
}
.membership-price strong {
  font-size: 2.25rem;
  line-height: 1.1;
  font-weight: 700;
}
.membership-price span {
  color: var(--ui-text-muted);
  font-size: 0.875rem;
}
.membership .membership-features {
  display: grid;
  gap: 0.375rem;
  list-style: none;
  padding: 0;
  font-size: 0.9375rem;
}
.membership .membership-features li {
  margin: 0;
}
.membership-plan-action {
  display: grid;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.5rem;
}
.membership-trial {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--plan-accent);
}
.membership .membership-checkout {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 0.625rem;
  border-radius: 0.375rem;
  min-height: 44px;
  background: var(--plan-button);
  color: var(--plan-button-text);
  border-color: var(--plan-button);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
}
.membership .membership-checkout:not(:disabled):hover {
  background: var(--plan-button);
  filter: brightness(0.95);
}
.membership-plan-notes {
  display: grid;
  gap: 0.375rem;
}
.membership-notice {
  padding: 1rem;
  border: 1px solid var(--ui-border-accented);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}
.membership-disclosure {
  border-top: 1px solid var(--ui-border);
  font-size: 0.875rem;
  line-height: 1.6;
}
.membership-disclosure > summary {
  padding-block: 0.75rem;
  min-height: 44px;
  cursor: pointer;
  font-weight: 600;
}
.membership-disclosure > p {
  max-width: 80ch;
  margin-bottom: 0.75rem;
}
.membership-topup-options {
  display: grid;
  gap: 0.75rem;
  margin-block: 0.75rem;
}
.membership-topup {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding-block: 0.75rem;
  border-bottom: 1px solid var(--ui-border);
}
.membership-current[data-tier='enhanced'] strong {
  color: #6d28d9;
}
.membership-current:is([data-tier='pro'], [data-tier='pro-plus']) strong {
  color: #924e11;
}
:global(.dark .membership-plan) {
  --plan-accent: #c1a3ff;
  --plan-bg: #20192f;
  --plan-border: #50406c;
}
:global(.dark .membership-plan:is([data-tier='pro'], [data-tier='pro-plus'])) {
  --plan-accent: #ffc878;
  --plan-bg: #2c2215;
  --plan-border: #6b512e;
}
:global(.dark .membership-current[data-tier='enhanced'] strong) {
  color: #c1a3ff;
}
:global(
  .dark .membership-current:is([data-tier='pro'], [data-tier='pro-plus']) strong
) {
  color: #ffc878;
}
@media (min-width: 640px) {
  .membership {
    padding: 1.5rem;
  }
}
</style>
