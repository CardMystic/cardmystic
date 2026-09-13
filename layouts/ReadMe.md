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

- Use the `editor` layout for article editing and primers. It keeps the navbar and footer while allowing the editor and split preview to use the full page width. The primer page centers and constrains its content in viewing mode.
