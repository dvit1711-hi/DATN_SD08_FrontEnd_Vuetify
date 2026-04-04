<template>
  <v-container fluid class="py-8">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold mb-2">Quản lý sản phẩm</h1>
      <p class="text-subtitle-1 text-grey">
        Thêm, chỉnh sửa và quản lý sản phẩm
      </p>
    </div>

    <v-btn
      color="primary"
      size="large"
      prepend-icon="mdi-plus"
      class="mb-6"
      @click="openCreateForm"
    >
      Thêm sản phẩm
    </v-btn>

    <v-dialog v-model="showAddForm" max-width="720">
      <v-card class="rounded-lg">
        <v-card-title class="text-h6 font-weight-bold bg-background pa-6">
          {{ form.productID ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới" }}
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="form.productName"
                label="Tên sản phẩm"
                variant="outlined"
                hide-details
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                label="Mô tả"
                variant="outlined"
                rows="3"
                hide-details
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="form.brandID"
                :items="brands"
                item-title="name"
                item-value="brandID"
                label="Thương hiệu"
                variant="outlined"
                hide-details
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="form.materialID"
                :items="materials"
                item-title="materialName"
                item-value="materialID"
                label="Chất liệu"
                variant="outlined"
                hide-details
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="form.status"
                :items="['ACTIVE', 'INACTIVE']"
                label="Trạng thái"
                variant="outlined"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-6 justify-end gap-3">
          <v-btn variant="outlined" @click="cancelForm">Hủy</v-btn>
          <v-btn color="primary" @click="saveProduct">
            {{ form.productID ? "Cập nhật" : "Lưu" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card class="rounded-lg" elevation="0" border>
      <v-card-text class="pa-6">
        <v-data-table
          :headers="headers"
          :items="products"
          :items-per-page="10"
          class="table-modern"
        >
          <template #item.productName="{ item }">
            <div class="font-weight-bold">{{ item.productName }}</div>
          </template>

          <template #item.status="{ item }">
            <v-chip
              size="small"
              :color="item.status === 'ACTIVE' ? 'success' : 'error'"
              variant="flat"
            >
              {{ item.status === "ACTIVE" ? "Kích hoạt" : "Tắt" }}
            </v-chip>
          </template>

          <template #item.name="{ item }">
            {{ item.name || "—" }}
          </template>

          <template #item.materialName="{ item }">
            {{ item.materialName || "—" }}
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex gap-2">
              <v-btn
                icon
                size="small"
                variant="text"
                color="primary"
                @click="editProduct(item)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>

              <v-btn
                icon
                size="small"
                variant="text"
                color="info"
                @click="goToDetail(item.productID)"
              >
                <v-icon>mdi-eye</v-icon>
              </v-btn>

              <v-btn
                icon
                size="small"
                variant="text"
                color="error"
                @click="deleteProduct(item.productID)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import productApi from "@/api/productApi";
import materialApi from "@/api/materialApi";
import axios from "axios";

const router = useRouter();
const products = ref([]);
const brands = ref([]);
const materials = ref([]);
const showAddForm = ref(false);

const defaultForm = () => ({
  productID: null,
  productName: "",
  description: "",
  brandID: null,
  materialID: null,
  status: "ACTIVE",
});

const form = ref(defaultForm());

const headers = [
  { title: "STT", key: "productID", width: "80px" },
  { title: "Tên sản phẩm", key: "productName" },
  { title: "Mô tả", key: "description", width: "240px" },
  { title: "Thương hiệu", key: "name" },
  { title: "Chất liệu", key: "materialName" },
  { title: "Trạng thái", key: "status", width: "120px" },
  { title: "Thao tác", key: "actions", width: "150px", sortable: false },
];

onMounted(() => {
  loadProducts();
  loadBrands();
  loadMaterials();
});

const loadProducts = async () => {
  try {
    const res = await productApi.getAll();
    products.value = res.data || [];
  } catch (err) {
    console.error("Lỗi tải sản phẩm:", err);
  }
};

const loadBrands = async () => {
  try {
    const res = await axios.get("http://localhost:8080/api/brands/active");
    brands.value = res.data || [];
  } catch (err) {
    console.error("Lỗi tải thương hiệu:", err);
  }
};

const loadMaterials = async () => {
  try {
    const res = await axios.get("http://localhost:8080/api/material/active");
    materials.value = res.data || [];
  } catch (err) {
    console.error("Lỗi tải chất liệu:", err);
  }
};

const openCreateForm = () => {
  form.value = defaultForm();
  showAddForm.value = true;
};

const saveProduct = async () => {
  if (!form.value.productName || form.value.productName.trim() === "") {
    alert("Vui lòng nhập tên sản phẩm");
    return;
  }

  if (!form.value.brandID) {
    alert("Vui lòng chọn thương hiệu");
    return;
  }

  if (!form.value.materialID) {
    alert("Vui lòng chọn chất liệu");
    return;
  }

  if (!["ACTIVE", "INACTIVE"].includes(form.value.status)) {
    alert("Trạng thái không hợp lệ");
    return;
  }

  const payload = {
    productName: form.value.productName,
    description: form.value.description,
    brandID: form.value.brandID,
    materialID: form.value.materialID,
    status: form.value.status,
  };

  try {
    if (form.value.productID) {
      await productApi.update(form.value.productID, payload);
    } else {
      await productApi.create(payload);
    }

    await loadProducts();
    cancelForm();
  } catch (err) {
    console.error("Lỗi lưu sản phẩm:", err);
  }
};

const editProduct = (p) => {
  form.value = {
    productID: p.productID,
    productName: p.productName,
    description: p.description,
    brandID: p.brandID,
    materialID: p.materialID,
    status: p.status || "ACTIVE",
  };
  showAddForm.value = true;
};

const cancelForm = () => {
  form.value = defaultForm();
  showAddForm.value = false;
};

const deleteProduct = async (id) => {
  if (!confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;

  try {
    await productApi.delete(id);
    await loadProducts();
  } catch (err) {
    console.error("Lỗi xóa:", err);
  }
};

const goToDetail = (productId) => {
  router.push({
    name: "AdminProductDetail",
    params: { id: productId },
  });
};
</script>

<style scoped>
:deep(.bg-background) {
  background-color: #f5deb3;
}

.table-modern :deep(.v-table__wrapper) {
  border-radius: 8px;
  border: 1px solid rgba(205, 186, 150, 0.1);
}

:deep(.v-table__wrapper tbody tr) {
  border-bottom: 1px solid rgba(205, 186, 150, 0.08);
  transition: background-color 0.2s ease;
}

:deep(.v-table__wrapper tbody tr:hover) {
  background-color: rgba(245, 222, 179, 0.5);
}

:deep(.v-card) {
  border-radius: 8px !important;
}
</style>