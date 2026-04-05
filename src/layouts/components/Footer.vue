<template>
    <v-footer class="text-center d-flex flex-column ga-2 py-4 footer-custom">
        <div class="d-flex ga-3">
            <v-btn v-for="icon in icons" :key="icon" :icon="icon" density="comfortable" variant="text"></v-btn>
        </div>

        <v-divider class="my-2" thickness="2" width="50"></v-divider>

        <div class="text-body-small font-weight-regular opacity-80 footer-text">
            Chúng tôi luôn nỗ lực mang đến những trải nghiệm mua sắm tốt nhất.
            Cảm ơn bạn đã lựa chọn và đồng hành cùng chúng tôi.
        </div>

        <v-divider></v-divider>

        <div class="footer-text">
            {{ new Date().getFullYear() }} — <strong>DvtdHup</strong>
        </div>
    </v-footer>
</template>
<script setup>
const icons = [
    'mdi-github',
    'mdi-facebook',
    'mdi-google',
]
</script>

<style scoped>
:deep(.footer-custom) {
  background-color: #F5DEB3 !important;
  border-top: 1px solid rgba(205, 186, 150, 0.2) !important;
  color: #000000 !important;
}

:deep(.footer-text) {
  color: #000000 !important;
}

:deep(.text-body-small) {
  color: #000000 !important;
}

:deep(.v-btn) {
  color: #000000 !important;
}

:deep(.v-btn:hover) {
  color: #8B4513 !important;
}

:deep(.v-divider) {
  border-color: rgba(0, 0, 0, 0.12) !important;
}
</style>