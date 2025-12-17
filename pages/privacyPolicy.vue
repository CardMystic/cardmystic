<template>
  <div class="flex items-center flex-col py-8 w-full">
    <UCard class="mb-6 p-2 max-w-[600px] shadow-xl rounded-xl">
      <UCardTitle class="text-2xl font-bold">
        🔒 Privacy Policy
      </UCardTitle>

      <UCardContent class="mt-2 text-base">
        <p>
          This Privacy Policy explains how CardMystic (“we”, “us”, or “our”) collects,
          uses, stores, and protects information when you use our website. We are committed
          to transparency and the responsible handling of user data.
        </p>
        <p class="mt-4">
          CardMystic currently collects minimal analytics data through Microsoft Clarity.
          In the near future, we will introduce an optional user account system that will
          store basic profile information such as email, username, and name.
        </p>
      </UCardContent>
    </UCard>

    <UCard class="mb-6 p-2 max-w-[600px] shadow-xl rounded-xl">
      <UCardTitle class="text-2xl font-bold">
        📊 Information We Collect
      </UCardTitle>

      <UCardContent class="mt-2 text-base">
        <p class="font-semibold">
          1. Current Data Collection (Analytics Only)
        </p>
        <p class="mt-2">
          We use Microsoft Clarity to collect anonymized analytics, which may include:
        </p>
        <ul class="list-disc ml-6 mt-4">
          <li>Device and browser details</li>
          <li>Interaction data (clicks, scrolls, navigation)</li>
          <li>Region-level location information</li>
          <li>Session recordings of page interactions</li>
        </ul>

        <p class="mt-6 font-semibold">
          2. Future Data Collection (User Accounts)
        </p>
        <p class="mt-2">
          When user accounts become available, we will collect and store the following:
        </p>
        <ul class="list-disc ml-6 mt-4">
          <li>Email address</li>
          <li>Username</li>
          <li>Name or display name</li>
          <li>Password (securely hashed and never stored in plain text)</li>
        </ul>

        <p class="mt-4">
          This information will allow users to save preferences, access personalized
          features, and improve their experience on CardMystic.
        </p>
      </UCardContent>
    </UCard>

    <UCard class="mb-6 p-2 max-w-[600px] shadow-xl rounded-xl">
      <UCardTitle class="text-2xl font-bold">
        🛡️ How We Use Your Information
      </UCardTitle>

      <UCardContent class="mt-2 text-base">
        <p class="font-semibold">
          For analytics:
        </p>
        <ul class="list-disc ml-6 mt-4">
          <li>Understanding site performance and usage patterns</li>
          <li>Improving search quality and user experience</li>
        </ul>

        <p class="mt-6 font-semibold">
          For user accounts (when available):
        </p>
        <ul class="list-disc ml-6 mt-4">
          <li>Creating and managing your user profile</li>
          <li>Authenticating and securing your account</li>
          <li>Providing personalized site features</li>
          <li>Communicating with you about your account or service updates</li>
        </ul>

        <p class="mt-4">
          We do not sell, rent, or share your personal information with third parties.
        </p>
      </UCardContent>
    </UCard>

    <UCard class="mb-6 p-2 max-w-[600px] shadow-xl rounded-xl">
      <UCardTitle class="text-2xl font-bold">
        🔐 Data Security
      </UCardTitle>

      <UCardContent class="mt-2 text-base">
        <p>
          We take security seriously. User passwords will be securely hashed using
          industry-standard best practices. Personal information will be protected through
          technical and administrative safeguards to prevent unauthorized access,
          disclosure, or misuse.
        </p>
        <p class="mt-4">
          Because analytics data is handled exclusively by Microsoft Clarity, it is
          processed according to Microsoft’s security standards.
        </p>
      </UCardContent>
    </UCard>

    <UCard class="mb-6 p-2 max-w-[600px] shadow-xl rounded-xl">
      <UCardTitle class="text-2xl font-bold">
        🧩 Third-Party Services
      </UCardTitle>

      <UCardContent class="mt-2 text-base">
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
      </UCardContent>
    </UCard>

    <UCard class="mb-6 p-2 max-w-[600px] shadow-xl rounded-xl">
      <UCardTitle class="text-2xl font-bold">
        🔁 Changes to This Policy
      </UCardTitle>

      <UCardContent class="mt-2 text-base">
        <p>
          We may update this Privacy Policy as we launch new features, including the
          upcoming user account system. Any changes will be reflected on this page with an
          updated “Last Updated” date.
        </p>
      </UCardContent>
    </UCard>

    <UCard class="p-2 max-w-[600px] shadow-xl rounded-xl">
      <UCardTitle class="text-2xl font-bold">
        💬 Contact Us
      </UCardTitle>

      <UCardContent class="mt-2 text-base">
        <p>
          If you have any questions about this Privacy Policy or how your information is
          handled, please reach out to us.
        </p>
        <p class="mt-4">
          📧 Email:
          <a href="mailto:thecardmystic@gmail.com" class="text-primary hover:underline">
            thecardmystic@gmail.com
          </a>
        </p>
      </UCardContent>
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
