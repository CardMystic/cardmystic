# Layouts

If you want a navbar, footer, or shared styles, wrap <NuxtPage /> with <NuxtLayout />:

```
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

- This will use layouts/default.vue by default.
- You can change layouts per page using:

```
definePageMeta({ layout: 'custom' }) // Uses layouts/custom.vue
```