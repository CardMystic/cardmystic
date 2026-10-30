<script setup lang="ts">
import benchmark from '~~/public/benchmarks/search-quality-graded-2026-09-28.json';
import type { BillingStatus } from '~/models/searchAccessModel';
import {
  enhancedTopUpPrice,
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

    <div class="membership-account">
      <div class="membership-account-heading">
        <div>
          <p v-if="loading || pending" role="status">
            Checking your membership...
          </p>
          <p v-else-if="accessError || (session && !verified)" role="alert">
            Your membership could not be verified. Refresh to try again.
          </p>
          <p
            v-else-if="access"
            class="membership-current"
            :data-tier="access.tier"
          >
            Current Search Membership:
            <strong>{{ tierLabels[access.tier] }}</strong>
            <span class="membership-separator" aria-hidden="true">|</span>
            <span v-if="access.tier === 'enhanced'"
              >Unlimited Enhanced searches</span
            >
            <NuxtLink v-else-if="!access.authenticated" :to="signInUrl">
              Sign in for enhanced searches
            </NuxtLink>
            <span v-else
              >{{ access.enhancedRemaining?.toLocaleString('en-US') }} left
              today</span
            >
            <template v-if="access.enhancedTopUpRemaining > 0">
              <span class="membership-separator" aria-hidden="true">|</span>
              <span
                >{{
                  access.enhancedTopUpRemaining.toLocaleString('en-US')
                }}
                purchased</span
              >
            </template>
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
            title="Refresh search membership"
            @click="session ? load() : refresh()"
          >
            <UIcon
              name="i-lucide-refresh-cw"
              class="size-5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>

    <div class="membership-offer">
      <h2>CardMystic Enhanced</h2>
      <p class="membership-muted">
        Get better search results with relevance reranking.
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
          <li><strong>Unlimited</strong> Enhanced searches</li>
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
        <MembershipSearchEvidence />
      </article>
    </div>
    <p class="membership-muted">
      Renews monthly at the prices above; cancel anytime in Stripe. Prices are
      in USD. Applicable tax is calculated at checkout.
    </p>

    <section
      class="membership-topups"
      aria-labelledby="membership-topups-title"
    >
      <p id="membership-topups-title">Or one time purchase:</p>
      <a v-if="!session" :href="signInUrl">
        Buy 500 Enhanced searches for ${{ enhancedTopUpPrice }}
      </a>
      <button
        v-else-if="billing?.enhancedTopUpAvailable"
        type="button"
        :disabled="busy || loading"
        @click="openStripe('enhanced-topup')"
      >
        Buy 500 Enhanced searches for ${{ enhancedTopUpPrice }}
      </button>
      <p v-else class="membership-muted">
        {{ loading ? 'Checking availability...' : 'Top-up unavailable' }}
      </p>
    </section>
    <p class="membership-muted">
      Before buying, review our
      <NuxtLink to="/terms" class="underline">Terms of Service</NuxtLink>,
      <NuxtLink to="/billing-policy" class="underline"
        >Billing &amp; Refunds</NuxtLink
      >, and
      <NuxtLink to="/privacyPolicy" class="underline">Privacy Policy</NuxtLink>.
    </p>
    <details class="membership-disclosure membership-faq">
      <summary>
        <UIcon name="i-lucide-chevron-right" aria-hidden="true" />
        <span>Frequently Asked Questions</span>
      </summary>
      <details class="membership-disclosure">
        <summary>
          <UIcon name="i-lucide-chevron-right" aria-hidden="true" /><span
            >What does Enhanced search do?</span
          >
        </summary>
        <p>
          Enhanced takes the cards found by your search and puts the better
          matches closer to the top. Normal uses the original order. You can
          switch between them with the Search mode dropdown.
        </p>
      </details>
      <details class="membership-disclosure">
        <summary>
          <UIcon name="i-lucide-chevron-right" aria-hidden="true" /><span
            >Why does it cost money?</span
          >
        </summary>
        <p>
          We use a third-party API to improve the search results, and it isn't
          free. Memberships and top-ups help us pay for it. Normal searches are
          still free.
        </p>
      </details>
      <details class="membership-disclosure">
        <summary>
          <UIcon name="i-lucide-chevron-right" aria-hidden="true" /><span
            >How many searches do I get, and when do they reset?</span
          >
        </summary>
        <p>
          Sign in to get 10 free Enhanced searches a day. With an Enhanced
          membership, you get unlimited Enhanced searches, including during your
          free month.
        </p>
        <p>
          The free daily searches reset at midnight UTC. Enhanced members don't
          have a search limit or a monthly reset.
        </p>
        <p>
          You can use Normal search without an account. Enhanced search requires
          you to sign in.
        </p>
      </details>
      <details class="membership-disclosure">
        <summary>
          <UIcon name="i-lucide-chevron-right" aria-hidden="true" /><span
            >What happens if I run out?</span
          >
        </summary>
        <p>
          You can keep searching in Normal mode for free. If you want more
          Enhanced searches, you can upgrade or buy a top-up.
        </p>
        <p>
          Top-ups are a one-time purchase, and you don't need a subscription to
          buy one. Unused top-up searches carry forward. We use your free daily
          searches first, then your top-up searches. While your Enhanced
          membership is active, your top-up credits aren't used.
        </p>
      </details>
      <details class="membership-disclosure">
        <summary>
          <UIcon name="i-lucide-chevron-right" aria-hidden="true" /><span
            >How do you measure the ranking score?</span
          >
        </summary>
        <p>
          We ran the same {{ benchmark.scoredQueries }} searches in Normal and
          Enhanced mode and used AI to help grade the first 10 results. Better
          matches closer to the top earn a higher score.
        </p>
        <p>
          The chart shows that score out of 100. A score of 80 doesn't mean 80%
          of searches are right. It measures how well the cards we reviewed were
          ordered, and your results will vary.
        </p>
        <p>
          These tests were run on September 28, 2026, for natural-language
          searches.
        </p>
        <p>
          <a href="/benchmarks/search-quality-graded-2026-09-28.json" download
            >See the test data and how we scored it</a
          >
        </p>
      </details>
      <details class="membership-disclosure">
        <summary>
          <UIcon name="i-lucide-chevron-right" aria-hidden="true" /><span
            >Can I cancel my membership?</span
          >
        </summary>
        <p>
          Yes. Use the billing button at the top of this page to open Stripe and
          manage or cancel your subscription.
        </p>
      </details>
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
.membership-muted {
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
  padding: 1.25rem;
  border: 1px solid color-mix(in srgb, var(--ui-info) 30%, var(--ui-border));
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--ui-info) 8%, var(--ui-bg));
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
  flex: 1 1 12rem;
  min-width: 0;
}
.membership-account-actions {
  margin-left: auto;
}
.membership-account-actions button {
  font-size: 0.875rem;
}
.membership-current strong {
  font-size: 1.125rem;
}
.membership-current {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.5rem;
}
.membership-separator {
  color: var(--ui-text-muted);
}
.membership .membership-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  padding: 0;
  flex-shrink: 0;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  list-style: none;
  padding: 0.875rem 0;
  min-height: 44px;
  cursor: pointer;
  font-weight: 600;
}
.membership-disclosure > summary::-webkit-details-marker {
  display: none;
}
.membership-disclosure > summary > .iconify {
  flex-shrink: 0;
}
.membership-disclosure[open] > summary > .iconify {
  transform: rotate(90deg);
}
.membership-disclosure > p {
  max-width: 80ch;
  margin: 0 0 0.875rem;
}
.membership-faq > summary {
  font-size: 1.125rem;
}
.membership-faq > .membership-disclosure {
  margin-left: 1.5rem;
}
.membership-topups {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.membership .membership-topups :is(a, button) {
  padding: 0.625rem 0.875rem;
  border: 1px solid #c1a3ff;
  border-radius: 6px;
  background: #c1a3ff;
  color: #24113f;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
}
.membership .membership-topups :is(a, button):not(:disabled):hover {
  background: #c1a3ff;
  filter: brightness(0.95);
}
.membership-current[data-tier='enhanced'] strong {
  color: #6d28d9;
}
:global(.dark .membership-plan) {
  --plan-accent: #c1a3ff;
  --plan-bg: #20192f;
  --plan-border: #50406c;
}
:global(.dark .membership-current[data-tier='enhanced'] strong) {
  color: #c1a3ff;
}
@media (min-width: 640px) {
  .membership {
    padding: 1.5rem;
  }
}
</style>
