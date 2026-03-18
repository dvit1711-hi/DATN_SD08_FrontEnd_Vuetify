<template>
  <v-container class="py-8" v-if="product">
    <v-row class="mb-8">
      <v-col cols="12" md="6">
        <!-- Main Image -->
        <v-card class="rounded-lg mb-4" elevation="0" border>
          <v-img
            :src="mainImage"
            :alt="product.productName"
            height="500"
            cover
          />
        </v-card>

        <!-- Thumbnails -->
        <div class="d-flex gap-2">
          <v-img
            v-for="img in images"
            :key="img"
            :src="img"
            :alt="product.productName"
            height="100"
            width="100"
            class="thumb-img rounded cursor-pointer"
            :class="{ 'thumb-active': mainImage === img }"
            @click="mainImage = img"
          />
        </div>
      </v-col>

      <!-- Product Info -->
      <v-col cols="12" md="6">
        <div class="mb-4">
          <h1 class="text-h4 font-weight-bold mb-2">{{ product.productName }}</h1>
          <p class="text-body-1 text-grey mb-4">Mã sản phẩm: #{{ product.productID }}</p>
        </div>

        <!-- Price Section -->
        <v-card class="rounded-lg pa-6 mb-6 bg-background" elevation="0" border>
          <div class="text-subtitle-2 text-grey mb-2">Giá</div>
          <div class="text-h5 font-weight-bold text-primary">
            {{ formatPrice(product.price) }}đ
          </div>
        </v-card>

        <!-- Colors Section -->
        <div class="mb-6">
          <h3 class="text-subtitle-1 font-weight-bold mb-3">Chọn màu sắc</h3>
          <div class="d-flex gap-3">
            <button
              v-for="c in product.colors"
              :key="c.productColorID"
              class="color-btn"
              :style="{ background: c.colorCode }"
              :class="{ 'color-btn-active': selectedColor?.productColorID === c.productColorID }"
              @click="changeColor(c)"
              :title="c.colorCode"
            />
          </div>
        </div>

        <!-- Action Buttons -->
        <v-row class="gap-3 mb-6">
          <v-col cols="12" sm="6">
            <v-btn
              color="primary"
              size="large"
              block
              prepend-icon="mdi-shopping-cart"
            >
              Thêm giỏ hàng
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6">
            <v-btn
              color="secondary"
              size="large"
              block
              variant="outlined"
              prepend-icon="mdi-heart-outline"
            >
              Yêu thích
            </v-btn>
          </v-col>
        </v-row>

        <!-- Description -->
        <v-card class="rounded-lg pa-6" elevation="0" border>
          <h3 class="text-subtitle-1 font-weight-bold mb-3">Mô tả sản phẩm</h3>
          <p class="text-body-2 text-grey">
            {{ product.description || 'Không có mô tả' }}
          </p>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <!-- Empty State -->
  <v-container v-else class="d-flex justify-center align-center" style="height: 400px">
    <v-empty-state
      title="Không tìm thấy sản phẩm"
      text="Vui lòng quay lại và thử lại"
      icon="mdi-alert-circle"
    />
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRoute } from "vue-router"
import axios from "axios"

const route = useRoute()

const product = ref(null)
const images = ref([])
const mainImage = ref("")
const selectedColor = ref(null)

onMounted(async () => {
  try {
    const productID = route.params.id

    const res = await axios.get(
      `http://localhost:8080/api/product/detail/${productID}`
    )

    product.value = res.data

    if (product.value.colors && product.value.colors.length > 0) {
      selectedColor.value = product.value.colors[0]
      images.value = selectedColor.value.images || []
      mainImage.value = images.value[0] || product.value.mainImage
    }
  } catch (error) {
    console.error("Lỗi tải sản phẩm:", error)
  }
})

function changeColor(color) {
  selectedColor.value = color
  images.value = color.images || []
  mainImage.value = images.value[0]
}

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price)
}
</script>

<style scoped>
.thumb-img {
  border: 2px solid rgba(205, 186, 150, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
}

.thumb-img:hover {
  border-color: #CDBA96;
  box-shadow: 0 0 8px rgba(205, 186, 150, 0.3);
}

.thumb-active {
  border-color: #CDBA96;
  box-shadow: 0 0 8px rgba(205, 186, 150, 0.5);
}

.color-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid rgba(205, 186, 150, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-btn:hover {
  border-color: #CDBA96;
  box-shadow: 0 0 12px rgba(205, 186, 150, 0.5);
  transform: scale(1.05);
}

.color-btn-active {
  border-color: #CDBA96;
  box-shadow: 0 0 12px rgba(205, 186, 150, 0.6);
}

:deep(.bg-background) {
  background-color: #F5DEB3;
}

:deep(.v-card) {
  border-radius: 8px !important;
}

.cursor-pointer {
  cursor: pointer;
}
</style>