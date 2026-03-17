<template>
  <div v-if="product">
    <h2>{{ product.productName }}</h2>
    <p>{{ product.description }}</p>
    <p>Price: {{ product.price }}</p>
    
    <h3>Colors</h3>
    <div v-for="color in product.colors" :key="color.productColorID">
      <p>{{ color.colorName }} ({{ color.colorCode }})</p>
      <p>Images:</p>
      <img v-for="img in color.images" :src="img" :key="img" width="100"/>
      
      <input v-model="newImageUrl[color.productColorID]" placeholder="Image URL"/>
      <button @click="addImage(color.productColorID)">Add Image</button>
    </div>

    <h3>Add Product Color</h3>
    <select v-model="newColor.colorId">
      <option v-for="c in colors" :value="c.colorID">{{ c.colorName }}</option>
    </select>
    <input type="number" v-model="newColor.stockQuantity" placeholder="Stock"/>
    <button @click="addProductColor()">Add Color</button>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  props: ['id'], // id từ route param
  data() {
    return {
      product: null,
      colors: [],
      newColor: { colorId: null, stockQuantity: 0 },
      newImageUrl: {}
    }
  },
  mounted() {
    this.loadProductDetail()
    this.loadColors()
  },
  methods: {
    loadProductDetail() {
      axios.get(`http://localhost:8080/api/product/detail/${this.id}`)
        .then(res => this.product = res.data)
    },
    loadColors() {
      axios.get('http://localhost:8080/api/colors')
        .then(res => this.colors = res.data)
    },
    addProductColor() {
      axios.post(`http://localhost:8080/api/product-color/${this.id}/color`, this.newColor)
        .then(() => this.loadProductDetail())
    },
    addImage(productColorID) {
      axios.post(`http://localhost:8080/api/product-color/color/${productColorID}/image`, {
        imageUrl: this.newImageUrl[productColorID],
        isMain: false
      }).then(() => {
        this.loadProductDetail()
        this.newImageUrl[productColorID] = ''
      })
    }
  }
}
</script>