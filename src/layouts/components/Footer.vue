<template>
    <v-footer class="text-center d-flex flex-column ga-2 py-4" color="indigo-lighten-1">
        <div class="d-flex ga-3">
            <v-btn v-for="icon in icons" :key="icon" :icon="icon" density="comfortable" variant="text"></v-btn>
        </div>

        <v-divider class="my-2" thickness="2" width="50"></v-divider>

        <div class="text-body-small font-weight-regular opacity-60">
            Chúng tôi luôn nỗ lực mang đến những trải nghiệm mua sắm tốt nhất.
            Cảm ơn bạn đã lựa chọn và đồng hành cùng chúng tôi.
        </div>

        <v-divider></v-divider>

        <div>
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