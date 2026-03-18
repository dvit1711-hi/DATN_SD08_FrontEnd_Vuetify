/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify'
// Styles
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#CDBA96',      // Burlywood
          secondary: '#FFE7BA',    // Light Wheat
          accent: '#EED8AE',       // Tan
          background: '#F5DEB3',   // Wheat
          surface: '#FFFFFF',
          error: '#C41E3A',
          warning: '#FB8500',
          info: '#6C63FF',
          success: '#06A77D',
        },
      },
    },
  },
})
