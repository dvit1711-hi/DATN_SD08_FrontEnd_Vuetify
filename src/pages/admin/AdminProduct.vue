<template>
  <v-container fluid class="py-8">
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="2500"
      location="top right"
    >
      {{ snackbar.text }}
    </v-snackbar>

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
              <v-autocomplete
                v-model="form.materialID"
                v-model:search="materialSearch"
                :items="filteredMaterials"
                item-title="materialName"
                item-value="materialID"
                label="Chất liệu"
                variant="outlined"
                hide-details
                clearable
                no-filter
                :menu-props="{ maxHeight: 260 }"
                @update:model-value="handleMaterialChange"
                @click:clear="clearMaterial"
                @keydown.enter.prevent="handleMaterialEnter"
              >

                <template #no-data>
                  <v-list-item
                    v-if="canCreateMaterial"
                    class="create-material-item"
                    @mousedown.prevent
                    @click="createQuickMaterial(materialSearch)"
                  >
                    <template #prepend>
                      <v-icon color="primary">mdi-plus-circle</v-icon>
                    </template>

                    <v-list-item-title>
                      Thêm mới "{{ materialSearch.trim() }}"
                    </v-list-item-title>
                  </v-list-item>

                  <v-list-item v-else>
                    <v-list-item-title>Không có chất liệu</v-list-item-title>
                  </v-list-item>
                </template>
              </v-autocomplete>
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

          <template #item.variantCount="{ item }">
            {{ item.variantCount ?? 0 }}
          </template>

          <template #item.totalStock="{ item }">
            {{ item.totalStock ?? 0 }}
          </template>

          <template #item.inStock="{ item }">
            <v-chip
              size="small"
              :color="item.inStock ? 'success' : 'error'"
              variant="flat"
            >
              {{ item.inStock ? "Còn hàng" : "Hết hàng" }}
            </v-chip>
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
import { ref, onMounted, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import productApi from "@/api/productApi";
import materialApi from "@/api/materialApi";
import axios from "axios";

const router = useRouter();

const CREATE_MATERIAL_VALUE = "__create_material__";

const products = ref([]);
const brands = ref([]);
const materials = ref([]);
const showAddForm = ref(false);
const materialSearch = ref("");

const snackbar = ref({
  show: false,
  text: "",
  color: "success",
});

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
  { title: "Số biến thể", key: "variantCount", width: "120px" },
  { title: "Tổng tồn kho", key: "totalStock", width: "120px" },
  { title: "Kho", key: "inStock", width: "120px" },
  { title: "Trạng thái", key: "status", width: "120px" },
  { title: "Thao tác", key: "actions", width: "150px", sortable: false },
];

onMounted(() => {
  loadProducts();
  loadBrands();
  loadMaterials();
});

const showMessage = (text, color = "success") => {
  snackbar.value = {
    show: true,
    text,
    color,
  };
};

const getMaterialId = (material) => {
  return material?.materialID ?? material?.materialId ?? material?.id ?? null;
};

const normalizeMaterial = (material) => {
  if (!material) return null;

  return {
    ...material,
    materialID: getMaterialId(material),
    materialName: material.materialName ?? material.name ?? "",
  };
};

const loadProducts = async () => {
  try {
    const res = await productApi.getAll();
    products.value = res.data || [];
  } catch (err) {
    console.error("Lỗi tải sản phẩm:", err);
    showMessage("Không thể tải danh sách sản phẩm", "error");
  }
};

const loadBrands = async () => {
  try {
    const res = await axios.get("http://localhost:8080/api/brands/active");
    brands.value = res.data || [];
  } catch (err) {
    console.error("Lỗi tải thương hiệu:", err);
    showMessage("Không thể tải thương hiệu", "error");
  }
};

const loadMaterials = async () => {
  try {
    const res = await materialApi.getAllActive();
    materials.value = (res.data || []).map(normalizeMaterial);
  } catch (err) {
    console.error("Lỗi tải chất liệu:", err);
    showMessage("Không thể tải chất liệu", "error");
  }
};

const filteredMaterials = computed(() => {
  const keyword = materialSearch.value?.trim();

  if (!keyword) return materials.value;

  const lowerKeyword = keyword.toLowerCase();

  return materials.value.filter((m) =>
    String(m.materialName || "")
      .trim()
      .toLowerCase()
      .includes(lowerKeyword),
  );
});

const canCreateMaterial = computed(() => {
  const keyword = materialSearch.value?.trim();

  if (!keyword) return false;

  return !materials.value.some(
    (m) =>
      String(m.materialName || "")
        .trim()
        .toLowerCase() === keyword.toLowerCase(),
  );
});

const findMaterialById = (id) => {
  return materials.value.find((m) => String(m.materialID) === String(id));
};

const findMaterialByName = (name) => {
  const keyword = String(name || "")
    .trim()
    .toLowerCase();

  if (!keyword) return null;

  return materials.value.find(
    (m) =>
      String(m.materialName || "")
        .trim()
        .toLowerCase() === keyword,
  );
};

const clearMaterial = () => {
  form.value.materialID = null;
  materialSearch.value = "";
};

const handleMaterialChange = async (value) => {
  if (!value) {
    clearMaterial();
    return;
  }

  if (value === CREATE_MATERIAL_VALUE) {
    await createQuickMaterial(materialSearch.value);
    return;
  }

  const selected = findMaterialById(value);

  if (selected) {
    form.value.materialID = selected.materialID;
    await nextTick();
    materialSearch.value = selected.materialName;
  }
};

const handleMaterialEnter = async () => {
  const keyword = materialSearch.value?.trim();

  if (!keyword) return;

  const existed = findMaterialByName(keyword);

  if (existed) {
    form.value.materialID = existed.materialID;
    await nextTick();
    materialSearch.value = existed.materialName;
    return;
  }

  await createQuickMaterial(keyword);
};

const createQuickMaterial = async (name) => {
  const materialName = String(name || "").trim();

  if (!materialName) {
    showMessage("Vui lòng nhập tên chất liệu", "warning");
    return;
  }

  const existed = findMaterialByName(materialName);

  if (existed) {
    form.value.materialID = existed.materialID;
    await nextTick();
    materialSearch.value = existed.materialName;
    showMessage(
      `Chất liệu "${existed.materialName}" đã tồn tại, đã chọn lại`,
      "info",
    );
    return;
  }

  try {
    form.value.materialID = null;

    const res = await materialApi.create({
      materialName,
      status: "ACTIVE",
    });

    await loadMaterials();

    const createdMaterial =
      findMaterialByName(materialName) || normalizeMaterial(res.data);

    if (!createdMaterial?.materialID) {
      showMessage("Đã thêm chất liệu nhưng không lấy được ID", "error");
      return;
    }

    form.value.materialID = createdMaterial.materialID;

    await nextTick();

    materialSearch.value = createdMaterial.materialName;

    showMessage(
      `Đã thêm chất liệu "${createdMaterial.materialName}"`,
      "success",
    );
  } catch (err) {
    console.error("Lỗi thêm nhanh chất liệu:", err);

    form.value.materialID = null;

    showMessage(
      err?.response?.data?.message ||
        err?.response?.data ||
        "Không thể thêm chất liệu",
      "error",
    );
  }
};

const openCreateForm = () => {
  form.value = defaultForm();
  materialSearch.value = "";
  showAddForm.value = true;
};

const saveProduct = async () => {
  if (!form.value.productName || form.value.productName.trim() === "") {
    showMessage("Vui lòng nhập tên sản phẩm", "warning");
    return;
  }

  if (!form.value.brandID) {
    showMessage("Vui lòng chọn thương hiệu", "warning");
    return;
  }

  if (
    !form.value.materialID ||
    form.value.materialID === CREATE_MATERIAL_VALUE
  ) {
    showMessage("Vui lòng chọn chất liệu", "warning");
    return;
  }

  if (!["ACTIVE", "INACTIVE"].includes(form.value.status)) {
    showMessage("Trạng thái không hợp lệ", "warning");
    return;
  }

  const payload = {
    productName: form.value.productName.trim(),
    description: form.value.description,
    brandID: form.value.brandID,
    materialID: form.value.materialID,
    status: form.value.status,
  };

  try {
    if (form.value.productID) {
      await productApi.update(form.value.productID, payload);
      showMessage("Cập nhật sản phẩm thành công", "success");
    } else {
      await productApi.create(payload);
      showMessage("Thêm sản phẩm thành công", "success");
    }

    await loadProducts();
    cancelForm();
  } catch (err) {
    console.error("Lỗi lưu sản phẩm:", err);

    showMessage(
      err?.response?.data?.message ||
        err?.response?.data ||
        "Không thể lưu sản phẩm",
      "error",
    );
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

  const selected =
    findMaterialById(p.materialID) ||
    normalizeMaterial({
      materialID: p.materialID,
      materialName: p.materialName,
    });

  materialSearch.value = selected?.materialName || "";

  showAddForm.value = true;
};

const cancelForm = () => {
  form.value = defaultForm();
  materialSearch.value = "";
  showAddForm.value = false;
};

const deleteProduct = async (id) => {
  if (!confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;

  try {
    await productApi.delete(id);
    await loadProducts();
    showMessage("Xóa sản phẩm thành công", "success");
  } catch (err) {
    console.error("Lỗi xóa:", err);

    showMessage(
      err?.response?.data?.message ||
        err?.response?.data ||
        "Không thể xóa sản phẩm",
      "error",
    );
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

.create-material-item {
  color: #fb8c00;
  font-weight: 700;
}

.create-material-item :deep(.v-list-item-title) {
  color: #fb8c00;
  font-weight: 700;
}
.create-material-item {
  color: #fb8c00;
  font-weight: 700;
}

.create-material-item :deep(.v-list-item-title) {
  color: #fb8c00;
  font-weight: 700;
}
</style>
