<template>
  <div v-if="product" class="product-detail">
    <div class="page-head mb-5">
      <div>
        <h2 class="mb-1">{{ product.productName }}</h2>
        <p class="mb-1">Mô tả: {{ product.description || "—" }}</p>
        <p class="mb-1">Thương hiệu: {{ product.brandName || "—" }}</p>
        <p>Chất liệu: {{ product.materialName || "—" }}</p>
      </div>

      <v-btn color="primary" @click="openAddVariantDialog">
        Thêm biến thể sản phẩm
      </v-btn>
    </div>

    <!-- Filter and Search Section -->
    <v-card class="mb-5 filter-card" elevation="0" border>
      <v-card-text class="pa-5">
        <!-- Search Box and Price Range Row -->
        <div class="search-price-row mb-5">
          <!-- Search Box -->
          <div class="search-section">
            <v-text-field
              v-model="searchQuery"
              placeholder="Nhập mã sản phẩm để tìm..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              class="search-field"
            />
          </div>

          <!-- Price Range Slider -->
          <div class="price-range-section">
            <div class="price-header">
              <span class="price-label">{{ formatPrice(filterPriceMin || 0) }} VND</span>
              <span class="price-label">{{ formatPrice(filterPriceMax || 10000000) }} VND</span>
            </div>
            <div class="range-slider-container">
              <input
                type="range"
                v-model.number="filterPriceMin"
                min="0"
                max="10000000"
                class="range-slider range-slider-min"
              />
              <input
                type="range"
                v-model.number="filterPriceMax"
                min="0"
                max="10000000"
                class="range-slider range-slider-max"
              />
              <div class="range-track">
                <div 
                  class="range-fill"
                  :style="{
                    left: ((filterPriceMin || 0) / 10000000) * 100 + '%',
                    right: (1 - ((filterPriceMax || 10000000) / 10000000)) * 100 + '%'
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters Row -->
        <div class="filters-row mb-4">
          <!-- Status Filter -->
          <div class="filter-item">
            <v-select
              v-model="filterStatus"
              :items="statusOptions"
              label="Trạng thái"
              multiple
              chips
              variant="outlined"
              density="compact"
              clearable
              class="filter-dropdown"
            />
          </div>

          <!-- Stock Filter -->
          <div class="filter-item">
            <v-select
              v-model="filterStock"
              :items="stockOptions"
              label="Tồn kho"
              variant="outlined"
              density="compact"
              clearable
              class="filter-dropdown"
            />
          </div>

          <!-- Color Filter -->
          <div class="filter-item">
            <v-select
              v-model="filterColors"
              :items="colors"
              item-title="colorName"
              item-value="colorID"
              label="Màu sắc"
              multiple
              chips
              variant="outlined"
              density="compact"
              clearable
              class="filter-dropdown"
            />
          </div>

          <!-- Size Filter -->
          <div class="filter-item">
            <v-select
              v-model="filterSizes"
              :items="sizes"
              item-title="sizeName"
              item-value="sizeID"
              label="Size"
              multiple
              chips
              variant="outlined"
              density="compact"
              clearable
              class="filter-dropdown"
            />
          </div>
        </div>

        <!-- Results Counter and Clear Button -->
        <div class="filter-results">
          <span class="results-text">Hiển thị <strong>{{ filteredGroupCount }}</strong> nhóm màu</span>
          <v-btn
            color="orange"
            variant="tonal"
            @click="clearFilters"
            size="small"
            class="clear-btn"
          >
            Xóa bộ lọc
          </v-btn>
        </div>
      </v-card-text>
    </v-card>


    <!-- <v-card  -->
    <VariantColorTable
      v-for="group in groupedByColor"
      :key="group.colorID"
      :group="group"
      @edit="startEdit"
      @delete="deleteProductColor"
      @set-representative="setRepresentativeVariant"
    />

    <VariantDialog
      v-model:open="dialogAddVariant"
      mode="add"
      :colors="colors"
      :sizes="sizes"
      :variant="newVariantPreview"
      @submit="addProductColor"
    />

    <VariantDialog
      v-model:open="dialogEdit"
      mode="edit"
      :colors="colors"
      :sizes="sizes"
      :variant="editVariant"
      @submit="saveEdit"
      @delete-image="deleteImage"
      @set-main="setMainImage"
    />

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script>
import axios from "axios";
import VariantColorTable from "@/pages/admin/product/VariantColorTable.vue";
import VariantDialog from "@/pages/admin/product/VariantDialog.vue";

export default {
  name: "AdminProductDetail",
  components: {
    VariantColorTable,
    VariantDialog,
  },
  props: ["id"],
  data() {
    return {
      product: null,
      colors: [],
      sizes: [],
      dialogEdit: false,
      dialogAddVariant: false,
      editVariant: null,
      snackbar: false,
      snackbarMessage: "",
      snackbarColor: "success",
      newVariantPreview: {
        colorID: null,
        sizeID: null,
        price: 0,
        stockQuantity: 0,
        status: "ACTIVE",
        isRepresentative: false,
        images: [],
      },
      // Filter and Search Data
      searchQuery: "",
      filterStatus: [],
      filterStock: null,
      filterSizes: [],
      filterPriceMin: 0,
      filterPriceMax: 10000000,
      filterColors: [],
      statusOptions: [
        { title: "Hoạt động", value: "ACTIVE" },
        { title: "Không hoạt động", value: "INACTIVE" },
      ],
      stockOptions: [
        { title: "Còn hàng", value: "inStock" },
        { title: "Hết hàng", value: "outOfStock" },
      ],
    };
  },

  computed: {
    rangeFillStyle() {
      const min = (this.filterPriceMin || 0) / 10000000 * 100;
      const max = (this.filterPriceMax || 10000000) / 10000000 * 100;
      return {
        left: min + '%',
        right: (100 - max) + '%'
      };
    },

    groupedByColor() {
      if (!this.product?.colors?.length) return [];

      // Filter variants based on search and filter criteria
      const filteredVariants = this.product.colors.filter((variant) => {
        // Search filter
        const searchLower = this.searchQuery.toLowerCase();
        const matchesSearch =
          !this.searchQuery ||
          (variant.colorName?.toLowerCase().includes(searchLower) ?? false) ||
          (variant.sizeName?.toLowerCase().includes(searchLower) ?? false) ||
          (variant.productColorCode?.toLowerCase().includes(searchLower) ?? false);

        if (!matchesSearch) return false;

        // Status filter
        if (
          this.filterStatus.length > 0 &&
          !this.filterStatus.includes(variant.status || "ACTIVE")
        ) {
          return false;
        }

        // Stock filter
        if (this.filterStock === "inStock" && variant.stockQuantity === 0) {
          return false;
        }
        if (this.filterStock === "outOfStock" && variant.stockQuantity > 0) {
          return false;
        }

        // Size filter
        if (
          this.filterSizes.length > 0 &&
          !this.filterSizes.includes(variant.sizeID)
        ) {
          return false;
        }

        // Price range filter
        if (this.filterPriceMin > 0 && variant.price < this.filterPriceMin) {
          return false;
        }
        if (this.filterPriceMax < 10000000 && variant.price > this.filterPriceMax) {
          return false;
        }

        // Color filter
        if (
          this.filterColors.length > 0 &&
          !this.filterColors.includes(variant.colorID)
        ) {
          return false;
        }

        return true;
      });

      // Group by color
      const groups = new Map();

      for (const variant of filteredVariants) {
        const colorId = variant.colorID;

        if (!groups.has(colorId)) {
          groups.set(colorId, {
            colorID: colorId,
            colorName: variant.colorName,
            colorCode: variant.colorCode,
            items: [],
            mainImageUrl: null,
          });
        }

        const group = groups.get(colorId);
        group.items.push(variant);
      }

      const groupList = Array.from(groups.values()).map((group) => {
        const sortedItems = [...group.items].sort((a, b) => {
          const aRepresentative = a?.isRepresentative ? 0 : 1;
          const bRepresentative = b?.isRepresentative ? 0 : 1;
          if (aRepresentative !== bRepresentative)
            return aRepresentative - bRepresentative;

          const aActive = String(a?.status || "").toUpperCase() === "ACTIVE" ? 0 : 1;
          const bActive = String(b?.status || "").toUpperCase() === "ACTIVE" ? 0 : 1;
          if (aActive !== bActive) return aActive - bActive;

          return Number(a?.productColorID || 0) - Number(b?.productColorID || 0);
        });

        group.items = sortedItems;

        const representativeVariant =
          sortedItems.find((item) => item.isRepresentative) || sortedItems[0];

        const repMainImage = (representativeVariant?.images || []).find(
          (img) => img.isMain
        );
        if (repMainImage?.imageUrl) {
          group.mainImageUrl = repMainImage.imageUrl;
        } else if (representativeVariant?.images?.length) {
          group.mainImageUrl = representativeVariant.images[0].imageUrl;
        }

        return group;
      });

      return groupList.sort((a, b) =>
        String(a.colorName || "").localeCompare(String(b.colorName || ""), "vi")
      );
    },

    filteredGroupCount() {
      return this.groupedByColor.length;
    },
  },

  mounted() {
    this.loadProductDetail();
    this.loadColors();
    this.loadSizes();
  },

  watch: {
    filterPriceMin(newVal) {
      if (newVal > this.filterPriceMax) {
        this.filterPriceMax = newVal;
      }
    },
    filterPriceMax(newVal) {
      if (newVal < this.filterPriceMin) {
        this.filterPriceMin = newVal;
      }
    },
  },

  methods: {
    clearFilters() {
      this.searchQuery = "";
      this.filterStatus = [];
      this.filterStock = null;
      this.filterSizes = [];
      this.filterPriceMin = 0;
      this.filterPriceMax = 10000000;
      this.filterColors = [];
    },

    showSnackbar(message, color = "success") {
      this.snackbarMessage = message;
      this.snackbarColor = color;
      this.snackbar = true;
    },

    getResponseMessage(data, fallback) {
      if (typeof data === "string") return data;
      if (!data) return fallback;
      if (typeof data.message === "string") return data.message;
      if (typeof data.error === "string") return data.error;
      return fallback;
    },

    loadProductDetail() {
      axios
        .get(`http://localhost:8080/api/product/detail/${this.id}`)
        .then((res) => {
          this.product = res.data;
        })
        .catch((err) => {
          console.error(err);
          this.showSnackbar(
            this.getResponseMessage(
              err?.response?.data || err?.message,
              "Không tải được chi tiết sản phẩm",
            ),
            "error",
          );
        });
    },

    loadColors() {
      axios
        .get("http://localhost:8080/api/color/active")
        .then((res) => {
          this.colors = res.data || [];
        })
        .catch((err) => {
          console.error(err);
          this.showSnackbar(
            this.getResponseMessage(
              err?.response?.data || err?.message,
              "Không tải được danh sách màu",
            ),
            "error",
          );
        });
    },

    loadSizes() {
      axios
        .get("http://localhost:8080/api/size/active")
        .then((res) => {
          this.sizes = res.data || [];
        })
        .catch((err) => {
          console.error(err);
          this.showSnackbar(
            this.getResponseMessage(
              err?.response?.data || err?.message,
              "Không tải được danh sách size",
            ),
            "error",
          );
        });
    },

    formatPrice(price) {
      return new Intl.NumberFormat("vi-VN").format(Number(price) || 0);
    },

    openAddVariantDialog() {
      this.newVariantPreview = {
        colorID: null,
        sizeID: null,
        price: 0,
        stockQuantity: 0,
        status: "ACTIVE",
        isRepresentative: false,
        images: [],
      };
      this.dialogAddVariant = true;
    },

    async addProductColor({ form, files }) {
      try {
        if (!form.colorID) {
          this.showSnackbar("Vui lòng chọn màu!", "warning");
          return;
        }
        if (!form.sizeID) {
          this.showSnackbar("Vui lòng chọn size!", "warning");
          return;
        }
        if (form.price == null || form.price < 0) {
          this.showSnackbar("Giá phải lớn hơn hoặc bằng 0", "warning");
          return;
        }
        if (form.stockQuantity < 0) {
          this.showSnackbar("Stock phải lớn hơn hoặc bằng 0", "warning");
          return;
        }
        if ((files?.length || 0) > 5) {
          this.showSnackbar("Mỗi biến thể chỉ được tối đa 5 ảnh", "warning");
          return;
        }

        const payload = {
          ...form,
          isRepresentative: Boolean(form.isRepresentative),
        };

        const res = await axios.post(
          `http://localhost:8080/api/product-color/${this.id}/color`,
          payload,
        );

        const createdVariantId =
          res?.data?.data ||
          res?.data?.result ||
          res?.data?.id ||
          res?.data?.productColorID;

        if (createdVariantId && files?.length) {
          for (const file of files) {
            await axios.post(
              `http://localhost:8080/api/image/color/${createdVariantId}/image`,
              {
                imageUrl: `/images/${file.name}`,
                isMain: false,
              },
            );
          }
        }

        this.dialogAddVariant = false;
        this.showSnackbar(
          this.getResponseMessage(res?.data, "Thêm biến thể thành công"),
        );
        this.loadProductDetail();
      } catch (err) {
        console.error(err);
        this.showSnackbar(
          this.getResponseMessage(
            err?.response?.data || err?.message,
            "Thêm biến thể thất bại",
          ),
          "error",
        );
      }
    },

    startEdit(variant) {
      this.editVariant = JSON.parse(JSON.stringify(variant));
      this.dialogEdit = true;
    },

    async saveEdit({ form, files }) {
      try {
        if (!this.editVariant?.productColorID) return;

        if (!form.colorID) {
          this.showSnackbar("Vui lòng chọn màu!", "warning");
          return;
        }
        if (!form.sizeID) {
          this.showSnackbar("Vui lòng chọn size!", "warning");
          return;
        }
        if (form.price == null || form.price < 0) {
          this.showSnackbar("Giá phải lớn hơn hoặc bằng 0", "warning");
          return;
        }
        if (form.stockQuantity < 0) {
          this.showSnackbar("Stock phải lớn hơn hoặc bằng 0", "warning");
          return;
        }
        if ((files?.length || 0) > 5) {
          this.showSnackbar("Tối đa là 5 ảnh", "warning");
          return;
        }

        const payload = {
          ...form,
          isRepresentative: Boolean(form.isRepresentative),
        };

        await axios.put(
          `http://localhost:8080/api/product-color/${this.editVariant.productColorID}`,
          payload,
        );

        if (files?.length) {
          for (const file of files) {
            await axios.post(
              `http://localhost:8080/api/image/color/${this.editVariant.productColorID}/image`,
              {
                imageUrl: `/images/${file.name}`,
                isMain: false,
              },
            );
          }
        }

        this.dialogEdit = false;
        this.editVariant = null;
        this.showSnackbar("Cập nhật biến thể thành công");
        this.loadProductDetail();
      } catch (err) {
        console.error(err);
        this.showSnackbar(
          this.getResponseMessage(
            err?.response?.data || err?.message,
            "Cập nhật thất bại",
          ),
          "error",
        );
      }
    },

    async setRepresentativeVariant(variant) {
      try {
        const payload = {
          colorID: variant.colorID,
          sizeID: variant.sizeID,
          price: variant.price,
          stockQuantity: variant.stockQuantity,
          status: variant.status || "ACTIVE",
          isRepresentative: true,
        };

        await axios.put(
          `http://localhost:8080/api/product-color/${variant.productColorID}`,
          payload,
        );

        this.showSnackbar("Đã cập nhật biến thể đại diện");
        this.loadProductDetail();

        if (this.editVariant?.productColorID === variant.productColorID) {
          this.editVariant = {
            ...this.editVariant,
            isRepresentative: true,
          };
        }
      } catch (err) {
        console.error(err);
        this.showSnackbar(
          this.getResponseMessage(
            err?.response?.data || err?.message,
            "Đặt biến thể đại diện thất bại",
          ),
          "error",
        );
      }
    },

    async deleteProductColor(variant) {
      if (
        !confirm(
          `Bạn chắc chắn muốn xóa biến thể ${variant.colorName} - ${variant.sizeName}?`,
        )
      ) {
        return;
      }

      try {
        const res = await axios.delete(
          `http://localhost:8080/api/product-color/${variant.productColorID}`,
        );
        this.showSnackbar(
          this.getResponseMessage(res?.data, "Xử lý biến thể thành công"),
        );
        this.loadProductDetail();
      } catch (err) {
        console.error(err);
        this.showSnackbar(
          this.getResponseMessage(
            err?.response?.data || err?.message,
            "Xóa biến thể thất bại",
          ),
          "error",
        );
      }
    },

    async deleteImage(image) {
      if (!confirm("Bạn có chắc muốn xóa ảnh này không?")) return;

      try {
        await axios.delete(`http://localhost:8080/api/image/${image.imageID}`);
        this.showSnackbar("Xóa ảnh thành công");
        this.loadProductDetail();

        if (this.editVariant?.productColorID) {
          const fresh = await axios.get(
            `http://localhost:8080/api/product/detail/${this.id}`,
          );
          this.product = fresh.data;
          const current = this.product.colors.find(
            (v) => v.productColorID === this.editVariant.productColorID,
          );
          this.editVariant = current
            ? JSON.parse(JSON.stringify(current))
            : null;
        }
      } catch (err) {
        console.error(err);
        this.showSnackbar(
          this.getResponseMessage(
            err?.response?.data || err?.message,
            "Xóa ảnh thất bại",
          ),
          "error",
        );
      }
    },

    async setMainImage(image) {
      try {
        await axios.put(
          `http://localhost:8080/api/image/${image.imageID}/set-main`,
        );
        this.showSnackbar("Đã cập nhật ảnh chính");
        this.loadProductDetail();

        if (this.editVariant?.productColorID) {
          const fresh = await axios.get(
            `http://localhost:8080/api/product/detail/${this.id}`,
          );
          this.product = fresh.data;
          const current = this.product.colors.find(
            (v) => v.productColorID === this.editVariant.productColorID,
          );
          this.editVariant = current
            ? JSON.parse(JSON.stringify(current))
            : null;
        }
      } catch (err) {
        console.error(err);
        this.showSnackbar(
          this.getResponseMessage(
            err?.response?.data || err?.message,
            "Đặt ảnh chính thất bại",
          ),
          "error",
        );
      }
    },
  },
};
</script>

<style scoped>
.product-detail {
  max-width: 1180px;
  margin: auto;
  padding: 12px 0 32px;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

/* Filter Card Styles */
.filter-card {
  background: white;
  border-radius: 12px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Search and Price Row */
.search-price-row {
  display: flex;
  gap: 24px;
  justify-content: flex; /* đẩy sang phải */
  gap: 450px; /* giảm khoảng cách */
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.search-section {
  flex: 0 0 auto;
  min-width: 280px;
  width: 100%;
  max-width: 340px;
}

.search-field {
  width: 100%;
}

.search-field :deep(.v-field__input) {
  font-size: 14px;
}

.search-field :deep(.v-field) {
  border-radius: 8px;
}

/* Price Range Section */
.price-range-section {
      justify-content: flex-end; /* đẩy sang phải */
  flex: 0 0 auto;
  width: 340px;
  padding: 0;
}

.price-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 0 4px;
}

.price-label {
  font-size: 13px;
  font-weight: 600;
  color: #ff9800;
}

.range-slider-container {
  position: relative;
  height: 40px;
  margin: 0 auto;
  display: flex;
  align-items: center;
}

.range-track {
  position: absolute;
  left: 0;
  right: 0;
  height: 6px;
  background: #e0e0e0;
  border-radius: 4px;
  pointer-events: none;
}

.range-fill {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #ff9800, #ffc107);
  border-radius: 4px;
}

.range-slider {
  position: absolute;
  width: 100%;
  height: 40px;
  top: 0;
  left: 0;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
  z-index: 5;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff9800;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 2px 4px rgba(255, 152, 0, 0.3);
  border: 2px solid white;
}

.range-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff9800;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 2px 4px rgba(255, 152, 0, 0.3);
  border: 2px solid white;
}

.range-slider::-webkit-slider-runnable-track {
  background: transparent;
  border: none;
}

.range-slider::-moz-range-track {
  background: transparent;
  border: none;
}

/* Filters Rows */
.filters-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.filter-item {
  display: flex;
  flex-direction: column;
}

.filter-dropdown {
  width: 100%;
}

.filter-dropdown :deep(.v-field) {
  border-radius: 6px;
  border-color: #e0e0e0;
}

.filter-dropdown :deep(.v-field__outline__start::before),
.filter-dropdown :deep(.v-field__outline__end::before) {
  border-color: #e0e0e0;
}

.filter-dropdown :deep(.v-field__input) {
  font-size: 13px;
  color: #666;
}

.filter-dropdown :deep(.v-field--focused .v-field__outline__start::before),
.filter-dropdown :deep(.v-field--focused .v-field__outline__end::before) {
  border-color: #ff9800 !important;
}

.clear-btn {
  font-weight: 600;
  text-transform: none;
  background: #fff3e0 !important;
  color: #ff9800 !important;
  border: 1px solid #ffe0b2 !important;
}

.clear-btn:hover {
  background: #ffe0b2 !important;
}

/* Results Counter */
.filter-results {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  flex-wrap: wrap;
}

.results-text {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.results-text strong {
  color: #ff9800;
  font-weight: 700;
}

/* Responsive design */
@media (max-width: 768px) {
  .filters-row {
    grid-template-columns: 1fr;
  }

  .search-field {
    max-width: 100%;
  }

  .price-header {
    font-size: 12px;
  }
}
</style>