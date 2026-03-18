<template>
  <v-app>
    <v-layout>
      <!-- Sidebar -->
      <v-navigation-drawer v-model="drawer">
        <v-list density="compact" nav>
          <template v-for="item in items" :key="item.title">
            <!-- Item thường -->
            <v-list-item
              v-if="!item.children"
              :to="item.to"
              :prepend-icon="item.icon"
              :title="item.title"
              link
            />

            <!-- Item có menu con -->
            <v-list-group v-else value="Admin">
              <template #activator="{ props }">
                <v-list-item
                  v-bind="props"
                  :title="item.title"
                  prepend-icon="mdi-shield-account"
                />
              </template>

              <v-list-item
                v-for="child in item.children"
                :key="child.title"
                :to="child.to"
                :prepend-icon="child.icon"
                :title="child.title"
                link
              />
            </v-list-group>
          </template>
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
  <Footer></Footer>
</template>

<script setup>
import { ref } from 'vue'
import Footer from './layouts/components/Footer.vue';

const drawer = ref(true)

const items = [
  {
    title: 'Home',
    icon: 'mdi-home',
    to: '/',
  },
  {
    title: 'Products',
    icon: 'mdi-hanger',
    to: '/',
  },
  {
    title: 'Admin',
    children: [
      {
        title: 'Admin Products',
        icon: 'mdi-database',
        to: '/products/list',
      },
      {
        title: 'Admin Account',
        icon: 'mdi-account-cog',
        to: '/accountList',
      },
    ],
  },
  {
    title: 'Login',
    icon: 'mdi-login',
    to: '/login',
  },
  {
    title: 'Register',
    icon: 'mdi-account-plus',
    to: '/register',
  },
]
</script>