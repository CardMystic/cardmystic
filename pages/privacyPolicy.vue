<template>
  <div class="flex items-center flex-col py-8 w-full">
    <UCard class="mb-6 p-2 max-w-[600px] shadow-xl rounded-xl">
      <div class="text-2xl font-bold">
        🔒 Privacy Policy
      </div>

      <div class="mt-2 text-base">
        <p>
          This Privacy Policy explains how CardMystic (“we”, “us”, or “our”) collects,
          uses, stores, and protects information when you use our website. We are committed
          to transparency and the responsible handling of user data.
        </p>
        <p class="mt-4">
          CardMystic collects analytics data through Microsoft Clarity and stores user
          account information, card lists, and search data in our Supabase database.
        </p>
      </div>
    </UCard>

    <UCard class="mb-6 p-2 max-w-150 shadow-xl rounded-xl">
      <div class="text-2xl font-bold">
        📊 Information We Collect
      </div>

      <div class="mt-2 text-base">
        <p class="font-semibold">
          1. Analytics & Search Data
        </p>
        <p class="mt-2">
          We collect the following information to improve our service:
        </p>
        <ul class="list-disc ml-6 mt-4">
          <li><strong>Search queries:</strong> All search queries you submit are tracked and stored for training
            purposes to improve our AI search models</li>
          <li><strong>Card interaction feedback:</strong> Dislike clicks on card search results to help refine search
            quality and relevance</li>
        </ul>

        <p class="mt-6">
          We also use Microsoft Clarity to collect anonymized analytics, which may include:
        </p>
        <ul class="list-disc ml-6 mt-4">
          <li>Device and browser details</li>
          <li>Interaction data (clicks, scrolls, navigation)</li>
          <li>Region-level location information</li>
          <li>Session recordings of page interactions</li>
        </ul>

        <p class="mt-6 font-semibold">
          2. User Account Data
        </p>
        <p class="mt-2">
          When you create an account, we collect and store the following:
        </p>
        <ul class="list-disc ml-6 mt-4">
          <li>Email address</li>
          <li>Username</li>
          <li>Name or display name</li>
          <li>Password (securely hashed and never stored in plain text)</li>
        </ul>

        <p class="mt-6 font-semibold">
          3. Card Lists & User Content
        </p>
        <p class="mt-2">
          When you use our card list feature, we store:
        </p>
        <ul class="list-disc ml-6 mt-4">
          <li>Card list names and descriptions</li>
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
      <div class="text-2xl font-bold">
        🛡️ How We Use Your Information
      </div>

      <div class="mt-2 text-base">
        <p class="font-semibold">
          For search queries and feedback:
        </p>
        <ul class="list-disc ml-6 mt-4">
          <li>Training and improving our AI search models</li>
          <li>Refining search result relevance and quality</li>
          <li>Understanding user preferences and search patterns</li>
        </ul>

        <p class="mt-6 font-semibold">
          For analytics:
        </p>
        <ul class="list-disc ml-6 mt-4">
          <li>Understanding site performance and usage patterns</li>
          <li>Improving overall user experience</li>
        </ul>

        <p class="mt-6 font-semibold">
          For user accounts:
        </p>
        <ul class="list-disc ml-6 mt-4">
          <li>Creating and managing your user profile</li>
          <li>Authenticating and securing your account</li>
          <li>Storing and organizing your card lists and collections</li>
          <li>Providing personalized site features and recommendations</li>
          <li>Communicating with you about your account or service updates</li>
        </ul>

        <p class="mt-4">
          We do not sell, rent, or share your personal information with third parties.
        </p>
      </div>
    </UCard>

    <UCard class="mb-6 p-2 max-w-150 shadow-xl rounded-xl">
      <div class="text-2xl font-bold">
        🔐 Data Security
      </div>

      <div class="mt-2 text-base">
        <p>
          We take security seriously. User passwords are securely hashed using
          industry-standard best practices. Personal information is protected through
          technical and administrative safeguards to prevent unauthorized access,
          disclosure, or misuse.
        </p>
        <p class="mt-4">
          User data including account information, card lists, and search history is
          stored securely in our Supabase database with row-level security policies
          ensuring users can only access their own data.
        </p>
        <p class="mt-4">
          Analytics data handled by Microsoft Clarity is processed according to
          Microsoft's security standards.
        </p>
      </div>
    </UCard>

    <UCard class="mb-6 p-2 max-w-150 shadow-xl rounded-xl">
      <div class="text-2xl font-bold">
        🧩 Third-Party Services
      </div>

      <div class="mt-2 text-base">
        <p>
          We use Microsoft Clarity for analytics. Their policies apply to the collection
          and processing of analytics data:
        </p>
        <ul class="list-disc ml-6 mt-4">
          <li>
            <a href="https://clarity.microsoft.com/terms" target="_blank" class="text-primary underline">
              Clarity Terms
            </a>
          </li>
          <li>
            <a href="https://privacy.microsoft.com/" target="_blank" class="text-primary underline">
              Microsoft Privacy Statement
            </a>
          </li>
        </ul>
        <p class="mt-4">
          No personal user data (email, username, etc.) is ever shared with Microsoft Clarity.
        </p>
        <p class="mt-4">
          Card data displayed on CardMystic is sourced from
          <a href="https://scryfall.com" target="_blank" class="text-primary underline">Scryfall</a>.
          No personal data is shared with Scryfall.
        </p>
      </div>
    </UCard>

    <UCard class="mb-6 p-2 max-w-150 shadow-xl rounded-xl">
      <div class="text-2xl font-bold">
        🔁 Changes to This Policy
      </div>

      <div class="mt-2 text-base">
        <p>
          We may update this Privacy Policy as we launch new features. Any changes will
          be reflected on this page with an updated "Last Updated" date.
        </p>
      </div>
    </UCard>

    <UCard class="p-2 max-w-150 shadow-xl rounded-xl">
      <div class="text-2xl font-bold">
        💬 Contact Us
      </div>

      <div class="mt-2 text-base">
        <p>
          If you have any questions about this Privacy Policy or how your information is
          handled, don't hesitate to reach out to us!
        </p>
        <p class="mt-4">
          📧 Email:
          <a href="mailto:thecardmystic@gmail.com" class="text-primary hover:underline">
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
