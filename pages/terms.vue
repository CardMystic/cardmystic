<script setup lang="ts">
defineOptions({ name: 'TermsOfService' });
</script>

<template>
  <PolicyPage
    title="Terms of Service"
    description="The terms for using CardMystic, including accounts, search memberships, and content you share."
    path="/terms"
  >
    <section>
      <h2>Who we are</h2>
      <p>
        CardMystic is operated by Fiasco Games LLC. We provide online tools for
        finding Magic: The Gathering cards, building decks, and sharing content.
        These terms apply to your use of CardMystic. If you do not agree to
        them, please do not use the service.
      </p>
      <p>
        Our <NuxtLink to="/privacyPolicy">Privacy Policy</NuxtLink> explains how
        we handle information. Our
        <NuxtLink to="/billing-policy"
          >Billing, Cancellation &amp; Refunds policy</NuxtLink
        >
        explains purchases and delivery.
      </p>
    </section>
    <section>
      <h2>Your account</h2>
      <p>
        Provide accurate account information and keep your login details
        private. Contact us if you think someone has accessed your account
        without permission. To make a purchase, you must be legally able to
        enter into the purchase agreement and authorized to use the payment
        method.
      </p>
    </section>
    <section>
      <h2>Search memberships and top-ups</h2>
      <p>
        Enhanced membership provides unlimited Enhanced searches while your
        membership is active, including during an eligible free trial. It is for
        your use through CardMystic, and does not include a separate API, resale
        rights, or permission to share a paid account. Limits on how quickly you
        can send requests still apply to keep the service available to everyone.
      </p>
      <p>
        Memberships renew automatically until canceled. Top-ups are separate
        one-time purchases of search credits. Review the price, trial end,
        renewal terms, and total shown before completing checkout. The
        <NuxtLink to="/billing-policy">billing policy</NuxtLink> explains
        cancellation, credit use, and refunds.
      </p>
      <p>
        Payments use Stripe Managed Payments, sold through Link. Stripe acts as
        the merchant of record for these transactions. The payment terms shown
        at checkout and the <a href="https://link.com/terms">Link terms</a> also
        apply. CardMystic remains responsible for providing its tools and
        helping you use them.
      </p>
    </section>
    <section>
      <h2>Use the service responsibly</h2>
      <ul>
        <li>
          Do not use CardMystic for unlawful activity, fraud, or harassment.
        </li>
        <li>
          Do not bypass access controls, payment checks, or request limits,
          including through automated requests or repeated accounts to abuse
          free trials.
        </li>
        <li>
          Do not interfere with the service, access another person's private
          information, or upload malicious content.
        </li>
        <li>Only post content you have the right to share.</li>
      </ul>
    </section>
    <section>
      <h2>Your decks and other content</h2>
      <p>
        You keep the rights you have in the content you submit. You give us
        permission to store, process, and display it as needed to provide
        CardMystic and follow your visibility choices. Content you make public,
        including public decks, articles, and comments, can be seen by others.
      </p>
      <p>
        We may remove content or restrict accounts that violate these terms or
        put the service or other users at risk. Contact us if you believe we
        made a mistake. If you want to close your account, contact us so we can
        also help you handle any active membership.
      </p>
    </section>
    <section>
      <h2>Search results and availability</h2>
      <p>
        Search results and AI-assisted rankings can be wrong or miss relevant
        cards. Card prices, legality information, and other card data can
        change. Check the original source before relying on that information for
        a purchase or event.
      </p>
      <p>
        Maintenance, outages, and third-party service problems can interrupt
        access. We cannot promise that every search will be accurate or that the
        service will always be available. If a paid feature is not working,
        contact us using the billing policy's support instructions.
      </p>
    </section>
    <section>
      <h2>Third-party content and links</h2>
      <p>
        Magic: The Gathering cards, images, and mana symbols belong to Wizards
        of the Coast and their respective rights holders. CardMystic is an
        independent project and is not affiliated with or endorsed by Wizards of
        the Coast. A membership buys access to CardMystic features, not
        ownership of any card or third-party content.
      </p>
      <p>
        External stores and services have their own terms and policies. Card
        purchases made through those stores are separate from CardMystic
        memberships and top-ups.
      </p>
    </section>
    <section>
      <h2>Changes and your rights</h2>
      <p>
        We may update these terms as the service changes. We will post the
        updated date here and provide notice of material changes affecting paid
        memberships before they take effect, including price changes before a
        future renewal. You can cancel before that renewal.
      </p>
      <p>
        Nothing in these terms removes any consumer guarantees, refund rights,
        or other rights that cannot be excluded under applicable law. If these
        terms conflict with those rights, those rights apply.
      </p>
    </section>
    <section>
      <h2>Contact us</h2>
      <p>
        For questions about CardMystic or these terms, contact Fiasco Games LLC
        at <a href="mailto:thecardmystic@gmail.com">thecardmystic@gmail.com</a>.
      </p>
    </section>
  </PolicyPage>
</template>
