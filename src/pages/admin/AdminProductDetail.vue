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

    <VariantColorTable
      v-for="group in groupedByColor"
      :key="group.colorID"
      :group="group"
      @edit="startEdit"
      @delete="deleteProductColor"
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
        images: [],
      },
    };
  },

  computed: {
    groupedByColor() {
      if (!this.product?.colors?.length) return [];

      const groups = new Map();

      for (const variant of this.product.colors) {
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

        const mainImage = (variant.images || []).find((img) => img.isMain);
        if (!group.mainImageUrl && mainImage?.imageUrl) {
          group.mainImageUrl = mainImage.imageUrl;
        }

        if (!group.mainImageUrl && variant.images?.length) {
          group.mainImageUrl = variant.images[0].imageUrl;
        }
      }

      return Array.from(groups.values()).sort((a, b) =>
        a.colorName.localeCompare(b.colorName),
      );
    },
  },

  mounted() {
    this.loadProductDetail();
    this.loadColors();
    this.loadSizes();
  },

  methods: {
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
        images: [],
      };
      this.dialogAddVariant = true;
    },

    async addProductColor({ form, files }) {
      try {
        if (!form.colorID) {
          this.showSnackbar("Chọn màu!", "warning");
          return;
        }
        if (!form.sizeID) {
          this.showSnackbar("Chọn size!", "warning");
          return;
        }
        if (form.price == null || form.price < 0) {
          this.showSnackbar("Giá phải >= 0", "warning");
          return;
        }
        if (form.stockQuantity < 0) {
          this.showSnackbar("Stock phải >= 0", "warning");
          return;
        }
        if ((files?.length || 0) > 5) {
          this.showSnackbar("Mỗi biến thể chỉ được tối đa 5 ảnh", "warning");
          return;
        }

        const res = await axios.post(
          `http://localhost:8080/api/product-color/${this.id}/color`,
          form,
        );

        const createdVariantId = res?.data?.id || res?.data?.productColorID;

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
          this.showSnackbar("Chọn màu!", "warning");
          return;
        }
        if (!form.sizeID) {
          this.showSnackbar("Chọn size!", "warning");
          return;
        }
        if (form.price == null || form.price < 0) {
          this.showSnackbar("Giá phải >= 0", "warning");
          return;
        }
        if (form.stockQuantity < 0) {
          this.showSnackbar("Stock phải >= 0", "warning");
          return;
        }
        if ((files?.length || 0) > 5) {
          this.showSnackbar("Mỗi biến thể chỉ được tối đa 5 ảnh", "warning");
          return;
        }

        await axios.put(
          `http://localhost:8080/api/product-color/${this.editVariant.productColorID}`,
          form,
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
</style>
