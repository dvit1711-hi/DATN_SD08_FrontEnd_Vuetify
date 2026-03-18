<template>
  <div>
    <button class="btn btn-success mb-2" @click="showAddForm = true">
      Add Product
    </button>

    <!-- Form Add / Edit Product -->
    <div v-if="showAddForm" class="card p-3 mb-3">
      <h3>{{ form.productID ? "Edit Product" : "Add Product" }}</h3>
      <input v-model="form.productName" placeholder="Product Name" />
      <input v-model="form.description" placeholder="Description" />
      <input type="number" v-model="form.price" placeholder="Price" />
      <select v-model="form.brandID">
  <option disabled value="">Select Brand</option>
  <option v-for="b in brands" :key="b.brandID" :value="b.brandID">
    {{ b.name }}
  </option>
</select>
      <select v-model="form.status">
        <option value="ACTIVE">ACTIVE</option>
        <option value="INACTIVE">INACTIVE</option>
      </select>

      <button class="btn btn-primary" @click="saveProduct">Save</button>
      <button class="btn btn-secondary" @click="cancelForm">Cancel</button>
    </div>

    <!-- Table Product -->
    <v-table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Name</th>
          <th>Description</th>
          <th>Price</th>
          <th>Status</th>
          <th>Brand</th>
          <th>Activity</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(p, index) in products" :key="p.productID">
          <td>{{ index + 1 }}</td>
          <td>{{ p.productName }}</td>
          <td>{{ p.description }}</td>
          <td>{{ p.price }}</td>
          <td>{{ p.status }}</td>
          <td>{{ p.name }}</td>
          <td>
            <v-btn class="btn btn-warning btn-sm" @click="editProduct(p)"
              >Edit</v-btn
            >
            <v-btn
              class="btn btn-danger btn-sm"
              @click="deleteProduct(p.productID)"
              >Delete</v-btn
            >
            <v-btn class="btn btn-info btn-sm" @click="goToDetail(p.productID)"
              >Detail</v-btn
            >
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
<script>
import axios from 'axios'

export default {
  data() {
    return {
      products: [],
      brands: [],
      form: {},
      showAddForm: false
    }
  },
  mounted() {
    this.loadProducts()
    this.loadBrands()
  },
  methods: {
    loadProducts() {
      axios.get('http://localhost:8080/api/product')
        .then(res => this.products = res.data)
    },
    loadBrands() {
      axios.get('http://localhost:8080/api/brands') // endpoint brand
        .then(res => this.brands = res.data)
    },

    saveProduct() {
      if (this.form.productID) {
        // Update product
        axios
          .put(
            `http://localhost:8080/api/product/${this.form.productID}`,
            this.form,
          )
          .then(() => {
            this.loadProducts();
            this.cancelForm();
          });
      } else {
        // Add new product
        axios.post("http://localhost:8080/api/product", this.form).then(() => {
          this.loadProducts();
          this.cancelForm();
        });
      }
    },

    editProduct(p) {
      this.form = { ...p, brandID: p.brand?.brandID };
      this.showAddForm = true;
    },

    cancelForm() {
      this.form = {};
      this.showAddForm = false;
    },

    deleteProduct(id) {
      axios
        .delete(`http://localhost:8080/api/product/${id}`)
        .then(() => this.loadProducts());
    },

    goToDetail(productId) {
      this.$router.push({
        name: "AdminProductDetail",
        params: { id: productId },
      });
    },
  },
};
</script>

<style>
.modal {
  position: fixed;
  background: white;
  border: 1px solid #ccc;
  padding: 20px;
  top: 20%;
  left: 30%;
  width: 40%;
  z-index: 100;
}
</style>
