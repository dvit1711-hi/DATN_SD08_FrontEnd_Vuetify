<template>
  <v-table>
    <thead>
      <tr>
        <!-- <th class="text-left">STT</th> -->
        <th class="text-left">Name</th>
        <th class="text-left">Description</th>
        <th class="text-left">Price</th>
        <th class="text-left">Status</th>
        <th class="text-left">Brand</th>
        <!-- <th class="text-left">Color</th> -->
        <th class="text-left">Activety</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="p in products" :key="p.productID">
        <!-- <td>{{ p.id }}</td> -->
        <td>{{ p.productName }}</td>
        <td>{{ p.description }}</td>
        <td>{{ p.price }}</td>
        <td>{{ p.status }}</td>
        <td>{{ p.brand.name }}</td>
        <td>
            <button class="btn btn-warning btn-sm" @click="editProduct(p)">Sửa</button>
          </td>
      </tr>
    </tbody>
  </v-table>
</template>

<script>
import productApi from '../../api/productApi.js'
import axios from 'axios'

export default {
  data() {
    return {
      products: [],
      form: null,
    }
  },

  mounted() {
    this.loadProducts()
  },

  methods: {
    loadProducts() {
      productApi.getAll().then((res) => (this.products = res.data))
    },

    newProduct() {
      this.form = {}
    },

    editProduct(p) {
      this.form = { ...p }
    },

    // deleteProduct(id) {
    //   axios.delete('http://localhost:8080/api/product/' + id).then(() => {
    //     this.loadProducts()
    //   })
    // },

    saveProduct() {
      if (this.form.id) {
        axios
          .put('http://localhost:8080/api/product/' + this.form.id, this.form)
          .then(() => this.loadProducts())
      } else {
        axios
          .post('http://localhost:8080/api/product', this.form)
          .then(() => this.loadProducts())
      }

      this.form = null
    },
  },
}
</script>
