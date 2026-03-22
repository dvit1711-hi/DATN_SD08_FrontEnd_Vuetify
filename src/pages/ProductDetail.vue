<template>
  <v-container class="py-8" v-if="product">
    <v-row>
      <!-- Thumbnails dọc bên trái -->
      <v-col cols="2">
        <v-row class="gap-2">
          <v-img
            v-for="(img, index) in images"
            :key="index"
            :src="img"
            height="80"
            width="80"
            class="thumb-img rounded cursor-pointer"
            :class="{ 'thumb-active': mainImage === img }"
            @click="mainImage = img"
          />
        </v-row>
      </v-col>

      <!-- Ảnh lớn -->
      <v-col cols="5">
        <v-img
          :src="mainImage"
          height="500"
          class="rounded"
          contain
        />
      </v-col>

      <!-- Thông tin sản phẩm -->
      <v-col cols="5">
        <div>
          <h1 class="text-h4 font-weight-bold mb-2">{{ product.productName }}</h1>
          <p class="text-body-2 text-grey mb-2">Mã sản phẩm: #{{ product.productID }}</p>
          <div class="price mb-4 text-h5 font-weight-bold text-primary">
            {{ formatPrice(product.price) }}đ
          </div>

          <!-- Chọn màu -->
          <div class="mb-4">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">Chọn màu sắc</h3>
            <div class="d-flex gap-2">
              <button
                v-for="c in product.colors"
                :key="c.productColorID"
                class="color-btn"
                :style="{ backgroundColor: c.colorCode }"
                :class="{ 'color-btn-active': selectedColor?.productColorID === c.productColorID }"
                @click="changeColor(c)"
              />
            </div>
          </div>

          <!-- Nút hành động -->
          <v-row class="gap-3">
            <v-col cols="6">
              <v-btn color="primary" block prepend-icon="mdi-shopping-cart">
                Thêm vào giỏ hàng
              </v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn color="secondary" block outlined prepend-icon="mdi-heart-outline">
                Yêu thích
              </v-btn>
            </v-col>
          </v-row>

          <!-- Mô tả sản phẩm -->
          <v-card class="mt-4 pa-4" outlined>
            <h3 class="text-subtitle-1 font-weight-bold mb-2">Mô tả sản phẩm</h3>
            <p>{{ product.description || 'Không có mô tả' }}</p>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from "@/stores/user"
import axios from "axios"

const route = useRoute()
const product = ref(null)
const images = ref([])
const mainImage = ref("")
const selectedColor = ref(null)
const quantity = ref(1)
const isLoading = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref("")
const snackbarColor = ref("success")

onMounted(async () => {
  try {
    const productID = route.params.id
    const res = await axios.get(`http://localhost:8080/api/product/detail/${productID}`)
    product.value = res.data

    if (product.value.colors.length) {
      selectedColor.value = product.value.colors[0]
      images.value = selectedColor.value.images || []
      mainImage.value = images.value[0] || ""
    }
  } catch (error) {
    console.error(error)
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

async function handleAddToCart() {
  // Check if user is logged in
  if (!userStore.isLoggedIn) {
    snackbarMessage.value = "Vui lòng đăng nhập để thêm vào giỏ hàng"
    snackbarColor.value = "warning"
    showSnackbar.value = true
    setTimeout(() => {
      router.push("/login")
    }, 1500)
    return
  }

  if (!selectedColor.value) {
    snackbarMessage.value = "Vui lòng chọn màu sắc"
    snackbarColor.value = "error"
    showSnackbar.value = true
    return
  }

  if (quantity.value < 1) {
    snackbarMessage.value = "Số lượng phải lớn hơn 0"
    snackbarColor.value = "error"
    showSnackbar.value = true
    return
  }

  isLoading.value = true
  try {
    // Call backend API to add to cart
    await userStore.addToCartAPI(
      selectedColor.value.productColorID,
      quantity.value
    )

    snackbarMessage.value = `Đã thêm ${quantity.value} sản phẩm "${product.value.productName}" vào giỏ hàng`
    snackbarColor.value = "success"
    showSnackbar.value = true

    // Reset quantity
    quantity.value = 1
  } catch (error) {
    console.error("Lỗi thêm vào giỏ:", error)
    
    if (error.message.includes("đăng nhập")) {
      snackbarMessage.value = "Vui lòng đăng nhập trước"
      snackbarColor.value = "warning"
      setTimeout(() => {
        router.push("/login")
      }, 1500)
    } else {
      snackbarMessage.value = "Thêm vào giỏ hàng thất bại. Vui lòng thử lại"
      snackbarColor.value = "error"
    }
    showSnackbar.value = true
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.thumb-img {
  border: 2px solid rgba(205, 186, 150, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.thumb-img:hover {
  border-color: #CDBA96;
  box-shadow: 0 0 6px rgba(205, 186, 150, 0.4);
}
.thumb-active {
  border-color: #CDBA96;
  box-shadow: 0 0 8px rgba(205, 186, 150, 0.5);
}

.color-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #ccc;
  cursor: pointer;
  transition: all 0.2s;
}
.color-btn:hover {
  transform: scale(1.1);
  border-color: #CDBA96;
}
.color-btn-active {
  border-color: #CDBA96;
  box-shadow: 0 0 6px rgba(205, 186, 150, 0.5);
}
</style>