<template>
  <div class="product-detail" v-if="product">

    <div class="left">

      <!-- thumbnails -->
      <div class="thumbs">
        <img v-for="img in images" :key="img" :src="img" class="thumb" @click="mainImage = img" />
      </div>

      <!-- main image -->
      <div class="main-image">
        <img :src="mainImage" />
      </div>

    </div>

    <div class="right">

      <h2>{{ product.productName }}</h2>

      <p class="price">{{ formatPrice(product.price) }}đ</p>

      <h3>Màu sắc</h3>

      <div class="colors">
        <button v-for="c in product.colors" :key="c.productColorID" class="color-btn"
          :style="{ background: c.colorCode }" @click="changeColor(c)"></button>
      </div>

      <button class="add-cart">
        Thêm vào giỏ hàng
      </button>

    </div>

  </div>
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

  const productID = route.params.id

  const res = await axios.get(
    `http://localhost:8080/api/product/detail/${productID}`
  )

  product.value = res.data

  selectedColor.value = product.value.colors[0]

  images.value = selectedColor.value.images

  mainImage.value = images.value[0]

})

function changeColor(color) {

  selectedColor.value = color

  images.value = color.images

  mainImage.value = images.value[0]

}

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price)
}

</script>

<style scoped>
.product-detail {
  display: flex;
  gap: 40px;
  padding: 40px;
}

.left {
  display: flex;
  gap: 20px;
}

.thumbs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.thumb {
  width: 70px;
  height: 70px;
  object-fit: cover;
  cursor: pointer;
  border: 1px solid #ddd;
}

.main-image img {
  width: 400px;
}

.right {
  max-width: 400px;
}

.price {
  color: red;
  font-size: 22px;
  margin: 15px 0;
}

.colors {
  display: flex;
  gap: 10px;
  margin: 10px 0 20px;
}

.color-btn {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  border: 2px solid #ddd;
  cursor: pointer;
}

.add-cart {
  padding: 12px 25px;
  background: black;
  color: white;
  border: none;
  cursor: pointer;
}

.add-cart:hover {
  background: #333;
}
</style>