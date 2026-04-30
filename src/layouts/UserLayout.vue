<template>
    <v-app :theme="appTheme" :class="['app-root', appTheme]">
        <Header />

        <v-main class="main-content">
            <router-view />
        </v-main>

        <Footer />
    </v-app>
</template>

<script setup lang="ts">
import Header from '@/layouts/components/Header.vue'
import Footer from '@/layouts/components/Footer.vue'
import { useAppSettings } from '@/composables/useAppSettings'

const { appTheme } = useAppSettings()
</script>

<style scoped>
.app-root {
    min-height: 100vh;
}

.main-content {
    transition: background-color 0.25s ease, color 0.25s ease;
}

.light .main-content {
    background-color: #ffffff;
    color: #111111;
}

.dark .main-content {
    background-color: #121212;
    color: #f5f5f5;
}
</style>