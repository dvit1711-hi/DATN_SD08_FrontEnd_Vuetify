<template>
    <v-app>
        <Header />
        <v-main>
            <router-view />
        </v-main>
        <Footer />
    </v-app>
</template>

<script setup lang="ts">
import Header from '@/layouts/components/Header.vue'
import Footer from '@/layouts/components/Footer.vue'
</script>

<style scoped>
.v-main {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    padding: 20px;
}
</style>
