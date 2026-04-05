<template>
    <div class="home-page">
        <div class="banner-wrapper">
            <v-window v-model="slide" show-arrows class="banner-window">
                <v-window-item v-for="(banner, index) in banners" :key="index">
                    <div class="banner-item">
                        <v-img :src="banner" class="banner-image" cover />

                        <div class="banner-overlay">
                            <div class="banner-content">
                                <h1>Baseball Cap Shop</h1>
                                <p>
                                    Bộ sưu tập mũ phong cách trẻ trung, hiện đại và cá tính.
                                </p>
                                <v-btn color="white" class="banner-btn" rounded="xl">
                                    Mua ngay
                                </v-btn>
                            </div>
                        </div>
                    </div>
                </v-window-item>
            </v-window>
        </div>

        <div class="content-box">
            <h2 class="mb-4">Trang chủ</h2>
            <p>Đây là trang chủ sau khi đăng nhập.</p>
        </div>
        <!-- <router-link to="/products">Đi đến trang giới thiệu</router-link> -->
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const slide = ref(0)

const banners = [
    '/images/a2.jpg',
    '/images/a1.jpg',
    '/images/a3.jpg'
]

let interval = null

onMounted(() => {
    interval = setInterval(() => {
        slide.value = (slide.value + 1) % banners.length
    }, 3000)
})

onBeforeUnmount(() => {
    clearInterval(interval)
})
</script>

<style scoped>
.home-page {
    background: #e6d3ab;
    min-height: 100vh;
}

.banner-wrapper {
    padding: 16px 24px 0;
}

.banner-window {
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.banner-item {
    position: relative;
    height: 720px;
}

.banner-image {
    width: 100%;
    height: 100%;
}

.banner-image :deep(img) {
    object-fit: cover;
    object-position: center center;
}

.banner-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    padding: 0 60px;
    background: linear-gradient(90deg,
            rgba(0, 0, 0, 0.45) 0%,
            rgba(0, 0, 0, 0.18) 40%,
            rgba(0, 0, 0, 0.02) 100%);
}

.banner-content {
    max-width: 500px;
    color: white;
}

.banner-content h1 {
    font-size: 42px;
    font-weight: 800;
    margin-bottom: 14px;
    line-height: 1.2;
}

.banner-content p {
    font-size: 18px;
    margin-bottom: 22px;
    opacity: 0.95;
}

.banner-btn {
    color: #222 !important;
    font-weight: 700;
    padding: 0 22px;
}

.content-box {
    padding: 28px 24px 40px;
}

.content-box h2 {
    font-size: 40px;
    font-weight: 800;
    color: #222;
}

.content-box p {
    font-size: 17px;
    color: #333;
}

.banner-window :deep(.v-window__left),
.banner-window :deep(.v-window__right) {
    width: 48px;
    height: 48px;
margin: 0 14px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}

.banner-window :deep(.v-btn__content) {
    color: #222;
}

@media (max-width: 960px) {
    .banner-item {
        height: 00px;
    }

    .banner-overlay {
        padding: 0 24px;
    }

    .banner-content h1 {
        font-size: 28px;
    }

    .banner-content p {
        font-size: 15px;
    }
}
</style>