<template>
  <v-app>
    <v-layout>
      <!-- Sidebar -->
      <v-navigation-drawer v-model="drawer">
        <v-list density="compact" nav>
          <v-list-item
            v-for="item in items"
            :key="item.title"
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            link
          />
        </v-list>
      </v-navigation-drawer>

      <!-- Header -->
      <v-app-bar flat border="b">
        <v-app-bar-nav-icon
          v-if="$vuetify.display.smAndDown"
          @click="drawer = !drawer"
        />

        <v-app-bar-title>Baseball Cap Shop</v-app-bar-title>

        <template #append>
          <v-btn icon>
            <v-avatar
              image="https://cdn.vuetifyjs.com/images/john.png"
              size="32"
            />

            <v-menu activator="parent">
              <v-list density="compact">
                <v-list-item title="Account" to="/account" />
                <v-list-item title="Settings" to="/accountSecurity" />
                <v-list-item title="Logout" />
              </v-list>
            </v-menu>
          </v-btn>
        </template>
      </v-app-bar>

      <!-- Page Content -->
      <v-main>
        <v-container>
          <router-view />
        </v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'

const drawer = ref(true)

const items = [
  {
    title: 'Home',
    icon: 'mdi-home',
    to: '/'
  },
  {
    title: 'Products',
    icon: 'mdi-hanger',
    to: '/products'
  },
  {
    title: 'Admin',
    children:[
      {
      title: 'Admin Products',
      icon: 'mdi-database',
      to: '/products/list',
      },
      {
      title: 'Admin Account',
      icon: 'mdi-database',
      to: '/accountList',
      },
    ]

  },
  {
    title: 'Login',
    icon: 'mdi-login',
    to: '/login'
  },
  {
    title: 'Register',
    icon: 'mdi-account-plus',
    to: '/register'
  }
]
</script>
