<template>
  <div class="flex items-center flex-col py-8 w-full">
    <UCard class="mb-6 p-2 max-w-[600px] shadow-xl rounded-xl">
      <div class="text-2xl font-bold">🔒 Privacy Policy</div>

      <div class="mt-2 text-base">
        <p>
          This Privacy Policy explains how CardMystic (“we”, “us”, or “our”)
          collects, uses, stores, and protects information when you use our
          website. We are committed to transparency and the responsible handling
          of user data.
        </p>
        <p class="mt-4">
          CardMystic stores user account information, decklists, and search data
          in our Supabase database.
        </p>
      </div>
    </UCard>

    <UCard class="mb-6 p-2 max-w-150 shadow-xl rounded-xl">
      <div class="text-2xl font-bold">📊 Information We Collect</div>

      <div class="mt-2 text-base">
        <p class="font-semibold">1. Analytics & Search Data</p>
        <p class="mt-2">
          We collect the following information to improve our service:
        </p>
        <ul class="list-disc ml-6 mt-4">
          <li>
            <strong>Search queries:</strong> All search queries you submit are
            tracked and stored for training purposes to improve our search
            models
          </li>
          <li>
            <strong>Card interaction feedback:</strong> Dislike clicks on card
            search results to help refine search quality and relevance
          </li>
        </ul>

        <p class="mt-6 font-semibold">2. User Account Data</p>
        <p class="mt-2">
          When you create an account, we collect and store the following:
        </p>
        <ul class="list-disc ml-6 mt-4">
          <li>Email address</li>
          <li>Username</li>
          <li>Name or display name</li>
          <li>Password (securely hashed and never stored in plain text)</li>
        </ul>

        <p class="mt-6 font-semibold">3. Decklists & User Content</p>
        <p class="mt-2">When you use our decklist feature, we store:</p>
        <ul class="list-disc ml-6 mt-4">
          <li>Decklist names and descriptions</li>
          <li>Cards saved to your lists (referenced by card ID)</li>
          <li>Commander designations within your lists</li>
          <li>Search and card view history</li>
        </ul>

        <p class="mt-4">
          This information allows you to save preferences, manage collections,
          and access personalized features on CardMystic.
        </p>
      </div>
    </UCard>

    <UCard class="mb-6 p-2 max-w-150 shadow-xl rounded-xl">
      <div class="text-2xl font-bold">🛡️ How We Use Your Information</div>

      <div class="mt-2 text-base">
        <p class="font-semibold">For search queries and feedback:</p>
        <ul class="list-disc ml-6 mt-4">
          <li>Training and improving our search models</li>
          <li>Refining search result relevance and quality</li>
          <li>Understanding user preferences and search patterns</li>
        </ul>

        <p class="mt-6 font-semibold">For user accounts:</p>
        <ul class="list-disc ml-6 mt-4">
          <li>Creating and managing your user profile</li>
          <li>Authenticating and securing your account</li>
          <li>Storing and organizing your decklists and collections</li>
          <li>Providing personalized site features and recommendations</li>
          <li>Communicating with you about your account or service updates</li>
        </ul>

        <p class="mt-4">
          We do not sell or rent your personal information. We use service
          providers, including Supabase and PostHog, to operate the site and
          understand how it is used.
        </p>
      </div>
    </UCard>

    <UCard class="mb-6 p-2 max-w-150 shadow-xl rounded-xl">
      <div class="text-2xl font-bold">🔐 Data Security</div>

      <div class="mt-2 text-base">
        <p>
          We take security seriously. User passwords are securely hashed using
          industry-standard best practices. Personal information is protected
          through technical and administrative safeguards to prevent
          unauthorized access, disclosure, or misuse.
        </p>
        <p class="mt-4">
          User data including account information, decklists, and search history
          is stored securely in our Supabase database with row-level security
          policies ensuring users can only access their own data.
        </p>
      </div>
    </UCard>

    <UCard class="mb-6 p-2 max-w-150 shadow-xl rounded-xl">
      <div class="text-2xl font-bold">🧩 Third-Party Services</div>

      <div class="mt-2 text-base">
        <p class="mb-4">
          With your Analytics consent, we use PostHog to understand page visits
          and interactions, using cookies and browser storage. Analytics data is
          sent to PostHog's US service to help us improve CardMystic. We do not
          associate these events with your account ID, and session replay is
          disabled.
        </p>
        <p>
          Card data displayed on CardMystic is sourced from
          <a
            href="https://scryfall.com"
            target="_blank"
            class="text-primary underline"
            >Scryfall</a
          >. No personal data is shared with Scryfall.
        </p>
      </div>
    </UCard>

    <UCard class="mb-6 p-2 max-w-150 shadow-xl rounded-xl">
      <div class="text-2xl font-bold">Advertising & Cookie Choices</div>
      <div class="mt-2 text-base space-y-4">
        <p>
          With your Advertising consent, Google Ads measures conversions such as
          signups and searches. Google Ads and PostHog are not enabled until you
          accept their respective categories. Session replay and advertising
          personalization are disabled.
        </p>
        <p>
          Choose Accept all, Reject optional, or Customize in the privacy
          banner. You can change or withdraw your choices at any time using
          Cookie settings in the footer. We remember your choice in this browser
          for up to six months. Sign-in and requested display preferences work
          independently of these optional choices.
        </p>
        <p>
          Separately, we estimate daily visitors, including guests, without
          cookies. For this metric, the backend uses a daily-changing salted
          hash of IP address and browser information; it does not store raw IP
          addresses or account IDs in the metric. Daily hashes and salts expire
          within 48 hours, while aggregate daily totals are retained. This
          estimate runs independently of optional PostHog and Google Ads
          tracking and does not recognize visitors across days.
        </p>
        <p>
          Learn how Google processes data in its
          <a
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noopener"
            class="text-primary underline"
            >partner sites policy</a
          >.
        </p>
      </div>
    </UCard>

    <UCard class="mb-6 p-2 max-w-150 shadow-xl rounded-xl">
      <div class="text-2xl font-bold">�🔁 Changes to This Policy</div>

      <div class="mt-2 text-base">
        <p>
          We may update this Privacy Policy as we launch new features. Any
          changes will be reflected on this page with an updated "Last Updated"
          date.
        </p>
      </div>
    </UCard>

    <UCard class="p-2 max-w-150 shadow-xl rounded-xl">
      <div class="text-2xl font-bold">💬 Contact Us</div>

      <div class="mt-2 text-base">
        <p>
          If you have any questions about this Privacy Policy or how your
          information is handled, don't hesitate to reach out to us!
        </p>
        <p class="mt-4">
          📧 Email:
          <a
            href="mailto:thecardmystic@gmail.com"
            class="text-primary hover:underline"
          >
            thecardmystic@gmail.com
          </a>
        </p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Privacy Policy - CardMystic' });

const { setPageInfo } = usePageInfo();
setPageInfo({
  page_url: '/privacy',
  page_name: 'Privacy Policy Page',
  query: '',
  card_name: '',
  filters: undefined,
});
</script>

<style scoped style="scss"></style>
