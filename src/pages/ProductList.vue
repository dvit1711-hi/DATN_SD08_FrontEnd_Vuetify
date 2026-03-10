<template>
  <v-container>
    <h2>Danh sách sản phẩm</h2>

    <v-row>
      <v-col v-for="p in products" :key="p.productID" cols="12" md="4" lg="3">
        <v-sheet class="pa-4" color="grey-lighten-4">
          <v-sheet elevation="3" class="text-center pa-4">
            <router-link :to="'/products/' + p.productID">
              <img
                :src="p.mainImage"
                style="width: 100%; height: 200px; object-fit: cover"
              />
              <h3>{{ p.productName }}</h3>
            </router-link>

            <p class="text-red">{{ formatPrice(p.price) }}đ</p>
            <div class="colors">
              <div class="colors">
                <button
                  v-for="c in p.colors"
                  :key="c.colorName"
                  class="color-btn"
                  :style="{ background: c.colorCode }"
                ></button>
              </div>
            </div>

            <v-btn color="primary" @click="addToCart(p)"> Thêm vào giỏ </v-btn>
          </v-sheet>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import productApi from "@/api/productApi";

const products = ref([]);

onMounted(async () => {
  const res = await productApi.getAllCart();
  products.value = res.data;
});

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN").format(price);
};

function addToCart(product) {
  alert("Đã thêm vào giỏ: " + product.productName);
}
</script>
<style scoped>
.colors{
  margin-top:10px;
}

.color-btn{
  width:18px;
  height:18px;
  border-radius:50%;
  border:1px solid #ccc;
  margin:3px;
}
</style>