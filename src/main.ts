/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'

import App from './App.vue'
import { registerPlugins } from '@/plugins'

import i18n from './i18n'

import 'unfonts.css'

const app = createApp(App)

registerPlugins(app)

app.use(i18n)

app.mount('#app')