<template>
  <router-view />
</template>


<script setup lang="ts">
// App.vue chỉ render router-view
// Layout được xử lý bởi UserLayout (user pages) và AdminLayout (admin pages)

</script>

<style>
/* Global text color overrides - change grey text to black */

/* Override all text-grey and related classes */
:is(.text-grey, .text-grey-darken-1, .text-grey-darken-2, .text-grey-lighten-1, .text-grey-lighten-2, .text-grey-lighten-3, .text-grey-lighten-4, .text-grey-lighten-5) {
  color: #000000 !important;
}

/* Vuetify deep override */
:deep(.text-grey) {
  color: #000000 !important;
}

:deep(.text-grey-darken-1) {
  color: #000000 !important;
}

:deep(.text-grey-darken-2) {
  color: #000000 !important;
}

:deep(.text-grey-lighten-1) {
  color: #000000 !important;
}

:deep(.text-grey-lighten-2) {
  color: #000000 !important;
}

:deep(.text-grey-lighten-3) {
  color: #000000 !important;
}

:deep(.text-grey-lighten-4) {
  color: #000000 !important;
}

:deep(.text-grey-lighten-5) {
  color: #000000 !important;
}

/* Override subtitle and caption styles */
:deep(.v-list-item__subtitle) {
  color: #000000 !important;
}

/* Ensure body text is black */
:deep(.v-card__text) {
  color: #000000;
}

:deep(.v-card__title) {
  color: #000000;
}

/* Override any grey text in paragraphs */
:deep(p) {
  color: #000000;
}
</style>
