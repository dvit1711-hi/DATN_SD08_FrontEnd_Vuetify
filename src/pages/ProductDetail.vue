<template>
  <div class="product-detail" v-if="product">

    <div class="left">
      <!-- ảnh lớn -->
      <img class="main-img" :src="product.mainImage" />

      <!-- thumbnail -->
      <div class="thumbs">
        <img
          v-for="i in images"
          :key="i"
          :src="i"
          @click="product.mainImage = i"
        />
      </div>
    </div>

    <div class="right">
      <h1>{{ product.productName }}</h1>

      <p class="price">{{ formatPrice(product.price) }}đ</p>

      <!-- color -->
      <div class="colors">
        <span
          class="color"
          :style="{ background: product.colorCode }"
        ></span>
        {{ product.colorName }}
      </div>

      <!-- size -->
      <div class="sizes">
        <button class="size">F</button>
      </div>

      <!-- button -->
      <div class="buttons">
        <button class="cart" @click="addToCart">THÊM VÀO GIỎ</button>
        <button class="buy">MUA NGAY</button>
      </div>

      <div class="info">
        <h3>Ưu đãi</h3>
        <p>Nhập mã MLBWELCOME giảm 10%</p>
      </div>
    </div>

  </div>
</template>

<script>
import productApi from "../api/productApi"

export default {
  data() {
    return {
      product: null,
      images: []
    }
  },

  methods: {

    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN').format(price)
    },

    addToCart() {
      let cart = JSON.parse(localStorage.getItem("cart") || "[]")

      let item = cart.find(x => x.productID === this.product.productID)

      if (item) item.qty++
      else cart.push({ ...this.product, qty: 1 })

      localStorage.setItem("cart", JSON.stringify(cart))
      alert("Đã thêm vào giỏ hàng")
    }

  },

  mounted() {
    const id = this.$route.params.id

    productApi.getById(id).then(res => {
      this.product = res.data

      this.images = [
        res.data.mainImage,
        res.data.mainImage,
        res.data.mainImage
      ]
    })
  }
}
</script>

<style scoped>

.product-detail{
  display:flex;
  gap:50px;
  padding:40px;
}

.left{
  width:50%;
}

.main-img{
  width:100%;
  border-radius:10px;
}

.thumbs{
  display:flex;
  gap:10px;
  margin-top:10px;
}

.thumbs img{
  width:70px;
  cursor:pointer;
}

.right{
  width:50%;
}

.price{
  font-size:28px;
  font-weight:bold;
  margin:20px 0;
}

.colors{
  margin:20px 0;
}

.color{
  display:inline-block;
  width:30px;
  height:30px;
  border-radius:50%;
  margin-right:10px;
}

.sizes{
  margin:20px 0;
}

.size{
  padding:10px 20px;
  border:1px solid black;
  background:white;
}

.buttons{
  display:flex;
  margin-top:30px;
}

.cart{
  flex:1;
  background:black;
  color:white;
  padding:15px;
  border:none;
}

.buy{
  flex:1;
  background:#c8102e;
  color:white;
  padding:15px;
  border:none;
}

</style>