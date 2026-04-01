<template>
  <div v-if="product" class="product-detail">
    <h2>{{ product.productName }}</h2>
    <p>{{ product.description }}</p>
    <p>Thương hiệu: {{ product.brandName || "—" }}</p>
    <p>Chất liệu: {{ product.materialName || "—" }}</p>

    <div class="header-actions mb-3">
      <v-btn color="primary" @click="openAddVariantDialog">
        Thêm biến thể sản phẩm
      </v-btn>
    </div>

    <div class="color-list">
      <div
        v-for="variant in sortedVariants"
        :key="variant.productColorID"
        class="color-card card mb-3"
      >
        <div class="color-header">
          <div class="color-item">
            <div
              class="color-box"
              :style="{ backgroundColor: variant.colorCode }"
            ></div>
            <span class="color-name">
              {{ variant.colorName }} - Size {{ variant.sizeName || "—" }}
            </span>
          </div>

          <div class="action-buttons">
            <v-btn
              color="warning"
              size="small"
              variant="tonal"
              class="action-color-btn"
              @click="startEdit(variant)"
            >
              Sửa
            </v-btn>

            <v-btn
              color="error"
              size="small"
              variant="tonal"
              class="delete-color-btn"
              @click="deleteProductColor(variant.productColorID)"
            >
              Xóa
            </v-btn>
          </div>
        </div>

        <p class="stock-text">Giá: {{ formatPrice(variant.price) }}đ</p>
        <p class="stock-text">Stock quantity: {{ variant.stockQuantity }}</p>
        <p>Ảnh:</p>

        <div class="image-gallery">
          <img
            v-for="(img, index) in variant.images"
            :key="index"
            :src="img"
            class="product-image"
          />
        </div>

        <div class="add-image">
          <input
            type="file"
            :id="'file-' + variant.productColorID"
            @change="onFileSelected($event, variant.productColorID)"
            accept="image/*"
            class="file-input"
          />

          <v-btn
            color="success"
            variant="tonal"
            class="action-btn"
            @click="addImage(variant.productColorID)"
            :disabled="
              variant.images.length >= 5 ||
              !selectedFiles[variant.productColorID]
            "
          >
            Thêm ảnh
          </v-btn>

          <v-btn
            color="error"
            variant="tonal"
            class="action-btn"
            @click="deleteAllImages(variant.productColorID)"
            :disabled="!variant.images || variant.images.length === 0"
          >
            Xóa ảnh
          </v-btn>

          <span v-if="variant.images.length >= 5" class="limit-text">
            Tối đa là 5 ảnh
          </span>
        </div>
      </div>
    </div>

    <!-- Dialog sửa thông tin biến thể -->
    <v-dialog v-model="dialogEdit" width="500px">
      <v-card v-if="editingVariantId">
        <v-card-title class="text-h6 font-weight-bold">
          Sửa thông tin - {{ editData.colorName }} - Size {{ editData.sizeName }}
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <v-select
            v-model="editData.colorID"
            :items="colors"
            item-title="colorName"
            item-value="colorID"
            label="Chọn màu"
            variant="outlined"
            density="compact"
            class="mb-3"
          />

          <v-select
            v-model="editData.sizeID"
            :items="sizes"
            item-title="sizeName"
            item-value="sizeID"
            label="Chọn size"
            variant="outlined"
            density="compact"
            class="mb-3"
          />

          <v-text-field
            v-model.number="editData.price"
            type="number"
            label="Giá"
            variant="outlined"
            density="compact"
            class="mb-3"
          />

          <v-text-field
            v-model.number="editData.stockQuantity"
            type="number"
            label="Stock Quantity"
            variant="outlined"
            density="compact"
          />
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="cancelEdit">
            Hủy
          </v-btn>
          <v-btn color="success" variant="raised" @click="saveEdit">
            Lưu
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog thêm biến thể sản phẩm -->
    <v-dialog v-model="dialogAddVariant" width="500px">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">
          Thêm biến thể sản phẩm
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <v-select
            v-model="newVariant.colorID"
            :items="colors"
            item-title="colorName"
            item-value="colorID"
            label="Chọn màu"
            variant="outlined"
            density="compact"
            class="mb-3"
          />

          <v-select
            v-model="newVariant.sizeID"
            :items="sizes"
            item-title="sizeName"
            item-value="sizeID"
            label="Chọn size"
            variant="outlined"
            density="compact"
            class="mb-3"
          />

          <v-text-field
            v-model.number="newVariant.price"
            type="number"
            label="Giá"
            variant="outlined"
            density="compact"
            class="mb-3"
          />

          <v-text-field
            v-model.number="newVariant.stockQuantity"
            type="number"
            label="Stock Quantity"
            variant="outlined"
            density="compact"
          />
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="cancelAddVariant">
            Hủy
          </v-btn>
          <v-btn color="primary" variant="raised" @click="addProductColor">
            Thêm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from "axios";

export default {
  props: ["id"],
  data() {
    return {
      product: null,
      colors: [],
      sizes: [],
      newVariant: {
        colorID: null,
        sizeID: null,
        price: 0,
        stockQuantity: 0,
      },
      selectedFiles: {},
      dialogEdit: false,
      editingVariantId: null,
      editData: {},
      dialogAddVariant: false,
    };
  },
  computed: {
    sortedVariants() {
      if (!this.product?.colors) return [];
      return [...this.product.colors].sort(
        (a, b) => b.productColorID - a.productColorID,
      );
    },
  },
  mounted() {
    this.loadProductDetail();
    this.loadColors();
    this.loadSizes();
  },
  methods: {
    formatPrice(price) {
      return new Intl.NumberFormat("vi-VN").format(Number(price) || 0);
    },

    loadProductDetail() {
      axios
        .get(`http://localhost:8080/api/product/detail/${this.id}`)
        .then((res) => {
          this.product = res.data;
        })
        .catch((err) => console.error(err));
    },

    loadColors() {
      axios.get("http://localhost:8080/api/color").then((res) => {
        this.colors = (res.data || []).map((c) => ({
          ...c,
          value: Number(c.colorID ?? c.colorID),
        }));
        console.log("colors:", this.colors);
      });
    },
    loadSizes() {
      axios.get("http://localhost:8080/api/size").then((res) => {
        this.sizes = (res.data || []).map((s) => ({
          ...s,
          value: Number(s.sizeID ?? s.id),
        }));
        console.log("sizes:", this.sizes);
      });
    },

    addProductColor() {
      if (!this.newVariant.colorID) {
        alert("Chọn màu!");
        return;
      }

      if (!this.newVariant.sizeID) {
        alert("Chọn size!");
        return;
      }

      if (this.newVariant.price == null || this.newVariant.price < 0) {
        alert("Giá phải >= 0");
        return;
      }

      if (this.newVariant.stockQuantity < 0) {
        alert("Stock phải >= 0");
        return;
      }

      axios
        .post(
          `http://localhost:8080/api/product-color/${this.id}/color`,
          this.newVariant,
        )
        .then(() => {
          this.newVariant = {
            colorID: null,
            sizeID: null,
            price: 0,
            stockQuantity: 0,
          };
          this.dialogAddVariant = false;
          this.loadProductDetail();
        })
        .catch((err) => console.error(err));
    },

    openAddVariantDialog() {
      this.dialogAddVariant = true;
    },

    cancelAddVariant() {
      this.dialogAddVariant = false;
      this.newVariant = {
        colorID: null,
        sizeID: null,
        price: 0,
        stockQuantity: 0,
      };
    },

    onFileSelected(event, productColorId) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFiles = {
          ...this.selectedFiles,
          [productColorId]: file,
        };
      }
    },

    addImage(productColorId) {
      const file = this.selectedFiles[productColorId];
      if (!file) return;

      axios
        .post(`http://localhost:8080/api/image/color/${productColorId}/image`, {
          imageUrl: `/images/${file.name}`,
          isMain: false,
        })
        .then(() => {
          this.selectedFiles[productColorId] = null;
          this.loadProductDetail();
        })
        .catch((err) => console.error(err));
    },

    deleteProductColor(productColorId) {
      if (!confirm("Bạn chắc có muốn xóa biến thể này không?")) return;

      axios
        .delete(`http://localhost:8080/api/product-color/${productColorId}`)
        .then(() => this.loadProductDetail())
        .catch((err) => console.error(err));
    },

    deleteAllImages(productColorId) {
      if (!confirm("Bạn có chắc muốn xóa tất cả ảnh của biến thể này không?"))
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

    startEdit(variant) {
      this.editingVariantId = variant.productColorID;
      this.editData = {
        colorID: variant.colorID,
        sizeID: variant.sizeID,
        colorName: variant.colorName,
        sizeName: variant.sizeName,
        price: variant.price,
        stockQuantity: variant.stockQuantity,
      };
      this.dialogEdit = true;
    },

    cancelEdit() {
      this.dialogEdit = false;
      this.editingVariantId = null;
      this.editData = {};
    },

    saveEdit() {
      if (!this.editData.colorID) {
        alert("Chọn màu!");
        return;
      }

      if (!this.editData.sizeID) {
        alert("Chọn size!");
        return;
      }

      if (this.editData.price == null || this.editData.price < 0) {
        alert("Giá phải >= 0");
        return;
      }

      if (this.editData.stockQuantity < 0) {
        alert("Stock phải >= 0");
        return;
      }

      axios
        .put(
          `http://localhost:8080/api/product-color/${this.editingVariantId}`,
          {
            colorID: this.editData.colorID,
            sizeID: this.editData.sizeID,
            price: this.editData.price,
            stockQuantity: this.editData.stockQuantity,
          },
        )
        .then(() => {
          this.dialogEdit = false;
          this.editingVariantId = null;
          this.editData = {};
          this.loadProductDetail();
        })
        .catch((err) => {
          console.error(err);
          alert("Cập nhật thất bại");
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

.header-actions {
  margin: 16px 0;
}

.add-color,
.color-card {
  padding: 16px;
  border-radius: 8px;
  background: #f9f9f9;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
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

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-color-btn {
  min-width: 60px;
}

.delete-color-btn {
  min-width: 60px;
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
</style>
