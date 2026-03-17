<template>
  <div v-if="product" class="product-detail">
    <h2>{{ product.productName }}</h2>
    <p>{{ product.description }}</p>
    <p>Price: {{ product.price }}</p>

    <!-- ==== Thêm Màu sản phẩm (ProductColor) ==== -->
    <div class="add-color card mb-3 pa-3">
      <h3>Add Product Color</h3>

      <v-row dense align="center" class="mb-2">
        <!-- Chọn màu -->
        <v-col cols="6">
          <select v-model="newColor.colorId">
            <option disabled value="">Select Color</option>
            <option v-for="c in colors" :key="c.colorID" :value="c.colorID">
              {{ c.colorName }}
            </option>
          </select>
        </v-col>

        <!-- Nhập stock -->
        <v-col cols="3">
          <v-text-field
            type="number"
            v-model="newColor.stockQuantity"
            label="Stock Quantity"
            dense
            outlined
          ></v-text-field>
        </v-col>

        <!-- Nút Add -->
        <v-col cols="3">
          <v-btn color="primary" class="ma-0" @click="addProductColor"
            >Add Color</v-btn
          >
        </v-col>
      </v-row>
    </div>

    <!-- ==== Danh sách màu và ảnh ==== -->
    <div class="color-list">
      <div
        v-for="color in product.colors"
        :key="color.productColorID"
        class="color-card card mb-3"
      >
        <div class="color-item">
          <div
            class="color-box"
            :style="{ backgroundColor: color.colorCode }"
          ></div>
          <span class="color-name">{{ color.colorName }}</span>
        </div>
        <p>Images:</p>

        <!-- Hiển thị ảnh hiện có -->
        <div class="image-gallery">
          <img
            v-for="(img, index) in color.images"
            :key="index"
            :src="`${img}`"
            class="product-image"
          />
        </div>

        <!-- ==== Thêm ảnh mới ==== -->
        <div class="add-image">
          <input
            type="file"
            :id="'file-' + color.productColorID"
            @change="onFileSelected($event, color.productColorID)"
            accept="D:\SOF203_JAVA3\DATN\FrontEnd\Project_DATN_SD08_BaseBalllCapSales_FrontEnd\vuetify-project\public\images"
          />
          <v-btn
            color="success"
            @click="addImage(color.productColorID)"
            :disabled="
              color.images.length >= 6 || !selectedFiles[color.productColorID]
            "
          >
            Add Image
          </v-btn>
          <span v-if="color.images.length >= 6" class="limit-text">
            Max 6 images per color
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  props: ["id"],
  data() {
    return {
      product: null,
      colors: [], // từ table Colors
      newColor: { colorId: null, stockQuantity: 0 },
      selectedFiles: {}, // lưu file được chọn cho từng color
    };
  },
  mounted() {
    this.loadProductDetail();
    this.loadColors();
  },
  methods: {
    loadProductDetail() {
      axios
        .get(`http://localhost:8080/api/product/detail/${this.id}`)
        .then((res) => {
          this.product = res.data;

          // Sắp xếp: màu mới thêm ở trên cùng
          this.product.colors.sort(
            (a, b) => b.productColorID - a.productColorID,
          );
        });
    },
    loadColors() {
      axios.get("http://localhost:8080/api/color").then((res) => {
        this.colors = res.data;
      });
    },
    addProductColor() {
      if (!this.newColor.colorId) return;
      axios
        .post(
          `http://localhost:8080/api/product-color/${this.id}/color`,
          this.newColor,
        )
        .then(() => {
          this.newColor = { colorId: null, stockQuantity: 0 };
          this.loadProductDetail();
        });
    },

    onFileSelected(event, colorId) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFiles = {
          ...this.selectedFiles,
          [colorId]: file,
        };
      }
    },

    addImage(colorId) {
      const file = this.selectedFiles[colorId];
      if (!file) return;

      // Tạo FormData gửi file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("isMain", false);

      // API giả lập: lưu ảnh trong /public/images
      axios
        .post(
          `http://localhost:8080/api/image/color/${colorId}/image`,
          {
            imageUrl: `/images/${file.name}`, // lưu tên file, frontend sẽ load từ /images/
            isMain: false,
          },
        )
        .then(() => {
          this.selectedFiles[colorId] = null;
          this.loadProductDetail();
        });
    },
  },
};
</script>

<style scoped>
.product-detail {
  max-width: 900px;
  margin: auto;
  font-family: Arial, sans-serif;
}

.add-color,
.color-card {
  padding: 16px;
  border-radius: 8px;
  background: #f9f9f9;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.color-name {
  font-weight: bold;
  margin-bottom: 8px;
}

.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.product-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.add-image {
  display: flex;
  align-items: center;
  gap: 8px;
}

.limit-text {
  color: red;
  font-size: 0.9em;
}
.color-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.color-box {
  width: 24px;
  height: 24px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 8px;
}
</style>
