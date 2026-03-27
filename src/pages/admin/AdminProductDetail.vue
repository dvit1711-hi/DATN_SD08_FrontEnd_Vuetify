<template>
  <div v-if="product" class="product-detail">
    <h2>{{ product.productName }}</h2>
    <p>{{ product.description }}</p>
    <p>Price: {{ product.price }}</p>

    <!-- ==== Thêm Màu sản phẩm (ProductColor) ==== -->
    <div class="add-color card mb-3 pa-3">
      <h3>Thêm màu sản phẩm</h3>

      <v-row dense align="center" class="mb-2">
        <v-col cols="12" md="6">
          <v-select
            v-model="newColor.colorId"
            :items="colors"
            item-title="colorName"
            item-value="colorId"
            label="Select color"
            placeholder="Select color"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            class="input-field"
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-text-field
            v-model="newColor.stockQuantity"
            type="number"
            label="Stock quantity"
            placeholder="Stock quantity"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            class="input-field"
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-btn
            color="primary"
            block
            height="48"
            class="text-none"
            @click="addProductColor"
          >
            Thêm màu
          </v-btn>
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
        <div class="color-header">
          <div class="color-item">
            <div
              class="color-box"
              :style="{ backgroundColor: color.colorCode }"
            ></div>
            <span class="color-name">{{ color.colorName }}</span>
          </div>

          <v-btn
            color="error"
            size="small"
            variant="tonal"
            class="delete-color-btn"
            @click="deleteProductColor(color.productColorID)"
          >
            Xóa màu
          </v-btn>
        </div>

        <p class="stock-text">Stock quantity: {{ color.stockQuantity }}</p>
        <p>Ảnh:</p>

        <div class="image-gallery">
          <img
            v-for="(img, index) in color.images"
            :key="index"
            :src="`${img}`"
            class="product-image"
          />
        </div>

        <div class="add-image">
          <input
            type="file"
            :id="'file-' + color.productColorID"
            @change="onFileSelected($event, color.productColorID)"
            accept="image/*"
            class="file-input"
          />

          <v-btn
            color="success"
            variant="tonal"
            class="action-btn"
            @click="addImage(color.productColorID)"
            :disabled="
              color.images.length >= 5 || !selectedFiles[color.productColorID]
            "
          >
            Thêm ảnh
          </v-btn>

          <v-btn
            color="error"
            variant="tonal"
            class="action-btn"
            @click="deleteAllImages(color.productColorID)"
            :disabled="!color.images || color.images.length === 0"
          >
            Xóa ảnh
          </v-btn>

          <span v-if="color.images.length >= 5" class="limit-text">
            Tối đa là 5 ảnh
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
      console.log("Product ID:", this.id);
      console.log("New Color:", this.newColor);
      if (!this.newColor.colorId) {
        alert("Chọn màu!");
        return;
      }
      if (this.newColor.stockQuantity < 0) {
        alert("Stock phải >=0");
        return;
      }
      if (!this.newColor.colorId) return;
      axios
        .post(
          `http://localhost:8080/api/product-color/${this.id}/color`,
          this.newColor,
        )
        .then(() => {
          this.newColor = { colorId: null, stockQuantity: 0 };
          this.loadProductDetail();
        })
        .catch((err) => console.error(err));
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
        .post(`http://localhost:8080/api/image/color/${colorId}/image`, {
          imageUrl: `/images/${file.name}`, // lưu tên file, frontend sẽ load từ /images/
          isMain: false,
        })
        .then(() => {
          this.selectedFiles[colorId] = null;
          this.loadProductDetail();
        });
    },
    deleteProductColor(productColorId) {
      if (!confirm("Bạn chắc có muốn xóa màu này không?")) return;
      axios
        .delete(
          `http://localhost:8080/api/product-color/color/${productColorId}`,
        )
        .then(() => this.loadProductDetail())
        .catch((err) => console.error(err));
    },
    deleteAllImages(productColorId) {
      if (!confirm("Bạn có chắc muốn xóa tất cả ảnh của màu này không?"))
        return;

      axios
        .delete(
          `http://localhost:8080/api/image/product-color/${productColorId}`,
        )
        .then(() => {
          this.loadProductDetail();
        })
        .catch((err) => {
          console.error(err);
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
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.action-btn {
  min-width: 110px;
  height: 38px;
  border-radius: 10px;
  font-weight: 600;
  text-transform: none;
}

.file-input {
  padding: 6px;
  border: 1px solid #dcdcdc;
  border-radius: 8px;
  background: #fff;
}

.limit-text {
  color: #d32f2f;
  font-size: 0.9em;
  font-weight: 500;
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

.color-select {
  margin-top: 4px;
}
.stock-text {
  margin: 6px 0 10px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.color-card {
  position: relative;
  padding: 16px;
  border-radius: 12px;
  background: #f9f9f9;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.color-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.delete-color-btn {
  min-width: auto;
}

.color-name {
  font-weight: 600;
  font-size: 16px;
}

.color-box {
  width: 24px;
  height: 24px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.stock-text {
  margin: 6px 0 10px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.color-card {
  position: relative;
}

.delete-color-btn {
  position: absolute;
  top: 12px;
  right: 12px;
}
</style>
