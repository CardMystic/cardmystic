<template>
  <PolicyPage
    title="Privacy Policy"
    description="How CardMystic handles account information, searches, payments, and privacy choices."
    path="/privacyPolicy"
  >
    <section>
      <h2>Who handles your information</h2>
      <p>
        CardMystic is operated by Fiasco Games LLC. This policy explains how we
        use information when you visit CardMystic, create an account, or buy a
        membership or search credits. For privacy questions, contact
        <a href="mailto:thecardmystic@gmail.com">thecardmystic@gmail.com</a>.
      </p>
    </section>
    <section>
      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account information:</strong> your email, username, profile
          details, and authentication information. Supabase manages sign-in;
          passwords are hashed rather than stored in plain text.
        </li>
        <li>
          <strong>Content and activity:</strong> decks, descriptions, articles,
          comments, follows, saved items, and account search and card-view
          history when you use those features. Content you make public can be
          viewed by others.
        </li>
        <li>
          <strong>Search information:</strong> the queries, selected cards,
          filters, and deck information needed to return results. We also
          collect query counts and result feedback to understand usage and
          improve our search models.
        </li>
        <li>
          <strong>Billing records:</strong> references to your Stripe customer,
          subscription, checkout, and payment events; membership and trial
          status; access dates; purchased-credit balances; and daily free-search
          counts. We link these records to your CardMystic account.
        </li>
        <li>
          <strong>Technical and support information:</strong> browser and
          connection information, including IP addresses used to serve requests
          and enforce rate limits, error logs, and messages you send us.
        </li>
      </ul>
      <p>
        Some preferences and features, including the clipboard and cookie
        choices, use storage in your browser. Account data, saved content,
        history, and billing records use our service providers, including
        Supabase. Search metrics and operational data also use services such as
        Upstash and our hosting providers.
      </p>
    </section>
    <section>
      <h2>Payments through Stripe and Link</h2>
      <p>
        CardMystic uses Stripe Managed Payments, sold through Link. Stripe
        handles checkout, recurring payments, receipts, and transaction support.
        Stripe collects the payment and billing information you provide, which
        can include your name, email, billing address, and payment method.
      </p>
      <p>
        We send account and purchase references to Stripe to connect a purchase
        to the right CardMystic account. Stripe provides payment, subscription,
        refund, and dispute information so we can grant access, maintain credit
        balances, prevent fraud, and help with support. Billing contact
        information, receipts, and limited payment-method details may also be
        available to us through Stripe.
      </p>
      <p>
        We do not store full payment-card numbers or card security codes in
        CardMystic's database. Stripe and Link handle personal data under their
        own policies, including for payment security and legal obligations. See
        the <a href="https://stripe.com/privacy">Stripe Privacy Policy</a> and
        <a href="https://link.com/privacy">Link Privacy Policy</a>.
      </p>
    </section>
    <section>
      <h2>Enhanced search and other providers</h2>
      <p>
        Enhanced search uses a third-party ranking service. We send the search
        description or selected card text and candidate card information to the
        configured provider, OpenRouter or Typesafe, to rank results. These
        requests do not include your account login or payment details.
        Information you type into a search can be included, so please do not put
        passwords, payment information, or other sensitive information into
        search queries.
      </p>
      <p>
        Card data and images come from Scryfall and other external sources. When
        your browser loads external images or you follow an external link, the
        destination can receive connection information such as your IP address
        and browser information. Those providers have their own privacy
        policies. Google reCAPTCHA also helps protect account actions from
        abuse.
      </p>
    </section>
    <section>
      <h2>How we use and share information</h2>
      <p>
        We use information to run CardMystic, authenticate accounts, save your
        content, return and improve search results, provide paid features,
        respond to support requests, prevent abuse, and meet legal obligations.
        Providers receive the information needed to perform these functions. We
        may also disclose information when legally required or necessary to
        protect users and the service.
      </p>
      <p>
        We do not sell or rent account or billing records. Optional analytics
        and advertising measurement are described below and depend on your
        cookie choices.
      </p>
    </section>
    <section>
      <h2>Analytics, advertising, and cookie choices</h2>
      <p>
        With your Analytics consent, PostHog measures page visits and
        interactions using cookies and browser storage. Data goes to PostHog's
        US service. We do not attach your account ID to these events, and
        session replay is disabled.
      </p>
      <p>
        With your Advertising consent, Google Ads measures conversions such as
        signups and searches. Advertising personalization is disabled. PostHog
        and Google Ads are not enabled until you accept their respective
        categories.
      </p>
      <p>
        Use the privacy banner to accept, reject, or customize optional
        tracking. You can change or withdraw consent using
        <strong>Cookie settings</strong> in the footer. Your choice is kept in
        this browser for up to six months. Sign-in, security, billing, and
        requested preferences work independently of optional tracking.
      </p>
      <p>
        Separately, we estimate daily visitors without cookies using a
        daily-changing salted hash of IP address and browser information. This
        metric does not store raw IP addresses or account IDs. Its daily hashes
        and salts expire within 48 hours; aggregate daily totals are retained.
        This estimate does not recognize visitors across days and runs
        independently of optional analytics and advertising. Technical request
        processing and security logs are separate from this metric.
      </p>
      <p>
        See
        <a href="https://policies.google.com/technologies/partner-sites"
          >Google's partner sites policy</a
        >
        for its data-handling information.
      </p>
    </section>
    <section>
      <h2>Retention and security</h2>
      <p>
        We keep information as needed to provide the features you use,
        administer purchases and refunds, resolve disputes, prevent abuse, and
        meet legal obligations. Canceling a membership does not itself delete
        your account or billing history. We do not promise immediate deletion of
        records that must be retained for these purposes.
      </p>
      <p>
        We use access controls and other safeguards to protect information.
        Private account and billing data have restricted access; public content
        is shared according to the feature's visibility settings. No online
        service can guarantee absolute security. Our providers may process
        information outside your country, including in the United States.
      </p>
    </section>
    <section>
      <h2>Your choices and requests</h2>
      <p>
        You can update account details and manage saved content and history
        through the site. To request access to, correction of, or deletion of
        personal information, email
        <a href="mailto:thecardmystic@gmail.com">thecardmystic@gmail.com</a>. We
        may need to verify your identity before acting on a request.
      </p>
      <p>
        Depending on where you live, you may have additional rights to object to
        or restrict processing, receive a copy of your information, or complain
        to a data protection authority. Contact us to exercise applicable
        rights. Stripe and Link handle requests about records they independently
        maintain through their own privacy channels.
      </p>
    </section>
    <section>
      <h2>Changes to this policy</h2>
      <p>
        We update this page as our service and data practices change. The date
        at the top identifies the latest update. We will provide notice of
        material changes and request consent when required.
      </p>
    </section>
  </PolicyPage>
</template>
