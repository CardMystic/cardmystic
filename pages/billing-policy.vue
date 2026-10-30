<script setup lang="ts">
import { enhancedTopUpPrice, membershipPlans } from '~/utils/membershipPlans';
const monthlyPrice = membershipPlans[0].price.toFixed(2);
const topUpPrice = enhancedTopUpPrice.toFixed(2);
</script>

<template>
  <PolicyPage
    title="Billing, Cancellation &amp; Refunds"
    description="How CardMystic memberships and search top-ups are delivered, billed, canceled, and refunded."
    path="/billing-policy"
  >
    <section>
      <h2>What you are buying</h2>
      <p>
        Card information, card images, and Normal search are free to access
        without an account. Memberships and top-ups pay for Enhanced search,
        which uses a third-party API to put better matches closer to the top.
        Our provider charges us for the ranking requests we send to it. Payments
        help cover those API costs and the cost of running CardMystic.
      </p>
      <ul>
        <li>
          <strong>Enhanced membership:</strong> ${{ monthlyPrice }} USD per
          month for unlimited Enhanced searches while your membership is active.
          It renews automatically each month until you cancel.
        </li>
        <li>
          <strong>Search top-up:</strong> ${{ topUpPrice }} USD for 500 Enhanced
          searches. This is a one-time purchase with no subscription required
          and no automatic top-up purchases.
        </li>
      </ul>
      <p>
        Prices on CardMystic are in USD. Applicable tax is shown at checkout.
        Stripe may offer a local currency; review the final amount and currency
        before confirming your purchase.
      </p>
    </section>
    <section>
      <h2>Free month and renewals</h2>
      <p>
        Eligible accounts receive one free calendar month of Enhanced
        membership. A payment method is required. Checkout shows the exact trial
        end and the recurring price. Unless you cancel before the trial ends,
        your payment method will be charged for the first paid month, then each
        month until canceled.
      </p>
      <p>
        The free month is available once per CardMystic account. Canceling and
        starting again does not give you another free month. A calendar month is
        not always 30 days; use the date in checkout and your confirmation.
      </p>
    </section>
    <section>
      <h2>Delivery and fulfillment</h2>
      <p>
        These are digital features delivered to the CardMystic account you use
        at checkout. Nothing is shipped, and there are no shipping charges or
        physical returns. You need an internet connection and a compatible web
        browser to use them.
      </p>
      <p>
        Enhanced access or top-up credits are normally available within a few
        minutes after Stripe confirms a successful payment or eligible trial.
        Returning to CardMystic by itself does not confirm payment. You can
        check the status and refresh it on the
        <NuxtLink to="/memberships">Membership page</NuxtLink>.
      </p>
      <p>
        If a confirmed purchase has not appeared, contact
        <a href="mailto:thecardmystic@gmail.com">thecardmystic@gmail.com</a>
        with your account email and receipt or order reference. Please do not
        buy it again to try to fix missing access. We will investigate the
        delivery problem and help restore access or resolve the payment.
      </p>
    </section>
    <section>
      <h2>How search credits work</h2>
      <p>
        Signed-in accounts receive 10 free Enhanced searches per day, resetting
        at midnight UTC. Guests can use Normal search. When you do not have an
        active Enhanced membership, free daily searches are used before
        purchased credits. Unused top-up credits carry forward; they do not
        reset each day or month. Active Enhanced members do not spend their
        top-up credits.
      </p>
      <p>
        Without an active Enhanced membership, a successful Enhanced search uses
        one search from your available allowance, including when it returns
        previously cached results. Failed searches and searches that fall back
        to Normal do not spend Enhanced credits. Limits on how quickly you can
        send requests apply to every plan, including unlimited membership.
      </p>
      <p>
        Credits belong to your account and are for searches on CardMystic. They
        cannot be transferred, resold, or exchanged for cash, except where a
        refund or applicable law requires otherwise.
      </p>
    </section>
    <section>
      <h2>How to cancel</h2>
      <ol>
        <li>
          Sign in and open the
          <NuxtLink to="/memberships">Membership page</NuxtLink>.
        </li>
        <li>
          Select <strong>Change or cancel membership</strong> to open Stripe's
          billing portal.
        </li>
        <li>
          Complete the cancellation and check the confirmation and access end
          date.
        </li>
      </ol>
      <p>
        Cancel before the next charge to stop the next renewal. A normal
        cancellation takes effect at the end of your current paid period or
        trial, and Enhanced remains available until that date. There is no
        cancellation fee. Afterward, you can still use Normal search, your
        signed-in daily allowance, and any remaining purchased credits.
      </p>
      <p>
        Closing checkout, signing out, or stopping use of CardMystic does not
        cancel a membership. Cancellation does not automatically refund a
        previous payment. If you cannot access the portal, contact us or
        <a href="https://support.link.com/topics/sold-through-link"
          >Link support</a
        >
        for help. You can also manage eligible orders through
        <a href="https://link.com">Link</a>.
      </p>
    </section>
    <section>
      <h2>Refund requests</h2>
      <p>
        We review refund requests case by case. Tell us what happened, the
        account email used for the purchase, and the receipt or order reference.
        This includes duplicate charges, missing access, and paid features that
        did not work. There is no additional blanket money-back guarantee for a
        change of mind or unused membership time.
      </p>
      <p>
        Send requests to
        <a href="mailto:thecardmystic@gmail.com">thecardmystic@gmail.com</a>
        or
        <a href="https://support.link.com/topics/sold-through-link"
          >Link support</a
        >. Do not send your password, full card number, or card security code.
        Approved refunds go through Stripe to the original payment method; when
        they appear depends on your bank or payment provider.
      </p>
      <p>
        Payments are sold through Link using Stripe Managed Payments. Stripe may
        issue refunds under its own rules, including in certain cases within 60
        days of a payment. This is not an automatic 60-day money-back guarantee.
        If Link's refund policy gives you greater protection than this policy,
        Link's policy applies.
      </p>
      <p>
        Nothing here limits refunds, cooling-off rights, or other remedies
        required by law or the
        <a href="https://link.com/terms">Sold Through Link terms</a>. Those
        terms include cooling-off rights for consumers in the EU and UK. Contact
        Link support to exercise applicable rights.
      </p>
    </section>
    <section>
      <h2>Access after a refund or payment problem</h2>
      <p>
        A refunded or disputed membership payment can remove the Enhanced access
        provided by that payment. Refunding a membership payment and canceling
        future renewals are separate actions; check your cancellation
        confirmation if you also want to stop future charges.
      </p>
      <p>
        A refunded or disputed top-up is removed from your credit balance. This
        applies to the entire pack even if the refund is partial. If credits
        from that pack were already used, they are deducted from later top-up
        credits. We do not charge your payment method automatically to replace
        them. Contact us if an adjustment looks wrong.
      </p>
      <p>
        If a renewal payment fails, Enhanced access may stop. You can update the
        subscription's payment method through the billing portal. Normal search
        remains available.
      </p>
    </section>
    <section>
      <h2>Who to contact</h2>
      <p>
        CardMystic is operated by Fiasco Games LLC. For search, account, or
        delivery problems, email
        <a href="mailto:thecardmystic@gmail.com">thecardmystic@gmail.com</a>.
        For payment, receipt, or subscription questions, you can also use
        <a href="https://support.link.com/topics/sold-through-link"
          >Link support</a
        >. Your statement may show a charge beginning with LINK.COM followed by
        a business descriptor.
      </p>
      <p>
        See our <NuxtLink to="/terms">Terms of Service</NuxtLink> and
        <NuxtLink to="/privacyPolicy">Privacy Policy</NuxtLink> for service and
        data-handling details.
      </p>
    </section>
  </PolicyPage>
</template>
