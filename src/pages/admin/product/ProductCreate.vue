<template>
  <v-container fluid class="py-8 product-create-page">
    <v-snackbar v-model="snackbar" location="top right" :timeout="2500" content-class="custom-snackbar">
      <div class="toast-wrapper">
        <div class="toast-content">
          <v-icon :color="snackbarColor" size="22">
            {{ snackbarIcon }}
          </v-icon>

          <span class="toast-text">
            {{ message }}
          </span>
        </div>

        <v-btn icon="mdi-close" size="x-small" variant="text" @click="snackbar = false" />
      </div>

      <div class="toast-progress" :class="snackbarColor"></div>
    </v-snackbar>

    <!-- Header -->
    <div class="mb-6 d-flex align-center justify-space-between">
      <div>
        <div class="d-flex align-center gap-2 mb-1">
          <v-btn icon variant="text" size="small" @click="$router.back()">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <h1 class="text-h5 font-weight-bold">Thêm sản phẩm mới</h1>
        </div>
        <p class="text-body-2 text-grey ms-10">
          Điền thông tin sản phẩm và thiết lập biến thể
        </p>
      </div>
      <div class="d-flex gap-3">
        <v-btn variant="outlined" @click="$router.back()">Hủy</v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-content-save"
          :loading="saving"
          @click="handleSave"
        >
          Lưu sản phẩm
        </v-btn>
      </div>
    </div>

    <!-- ✅ Banner lỗi validate tổng hợp -->
    <v-alert
      v-if="validationErrors.length"
      type="error"
      variant="tonal"
      class="mb-4 rounded-xl"
      closable
      @click:close="validationErrors = []"
    >
      <div class="font-weight-bold mb-1">Vui lòng kiểm tra lại thông tin:</div>
      <ul class="ps-4">
        <li v-for="err in validationErrors" :key="err">{{ err }}</li>
      </ul>
    </v-alert>

    <v-row>
      <!-- LEFT -->
      <v-col cols="12" lg="4">
        <v-card class="rounded-xl mb-4" elevation="0" border>
          <v-card-title class="pa-5 pb-3 text-subtitle-1 font-weight-bold">
            <v-icon size="18" class="me-2 text-primary"
              >mdi-information-outline</v-icon
            >
            Thông tin sản phẩm
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-5">
            <!-- ✅ Tên sản phẩm với trạng thái lỗi và kiểm tra trùng -->
            <v-text-field
              v-model="form.productName"
              label="Tên sản phẩm *"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hide-details="auto"
              :error="fieldErrors.productName"
              :error-messages="
                fieldErrors.productName ? fieldErrors.productNameMsg : ''
              "
              :loading="checkingName"
              :hint="nameAvailable === true ? '' : ''"
              @blur="onProductNameBlur"
              @input="onProductNameInput"
            >
              <template v-if="nameAvailable === true" #append-inner>
                <v-icon color="success" size="18">mdi-check-circle</v-icon>
              </template>
            </v-text-field>
            <v-textarea
              v-model="form.description"
              label="Mô tả"
              variant="outlined"
              rows="3"
              density="comfortable"
              class="mb-3"
              hide-details
            />
            <v-select
              v-model="form.brandID"
              :items="brands"
              item-title="name"
              item-value="brandID"
              label="Thương hiệu *"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hide-details="auto"
              :error="fieldErrors.brandID"
              :error-messages="
                fieldErrors.brandID ? 'Vui lòng chọn thương hiệu' : ''
              "
              @update:model-value="fieldErrors.brandID = false"
            />
            <v-autocomplete
              v-model="form.materialID"
              v-model:search="materialSearch"
              :items="filteredMaterials"
              item-title="materialName"
              item-value="materialID"
              label="Chất liệu *"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hide-details="auto"
              clearable
              no-filter
              :menu-props="{ maxHeight: 240 }"
              :error="fieldErrors.materialID"
              :error-messages="
                fieldErrors.materialID ? 'Vui lòng chọn chất liệu' : ''
              "
              @update:model-value="
                (v) => {
                  handleMaterialChange(v);
                  fieldErrors.materialID = false;
                }
              "
              @click:clear="clearMaterial"
              @keydown.enter.prevent="handleMaterialEnter"
            >
              <template #no-data>
                <v-list-item
                  v-if="canCreateMaterial"
                  class="text-orange font-weight-bold"
                  @mousedown.prevent
                  @click="createQuickMaterial(materialSearch)"
                >
                  <template #prepend
                    ><v-icon color="orange">mdi-plus-circle</v-icon></template
                  >
                  <v-list-item-title
                    >Thêm mới "{{ materialSearch?.trim() }}"</v-list-item-title
                  >
                </v-list-item>
                <v-list-item v-else>
                  <v-list-item-title>Không có chất liệu</v-list-item-title>
                </v-list-item>
              </template>
            </v-autocomplete>
            <v-select
              v-model="form.status"
              :items="['ACTIVE', 'INACTIVE']"
              label="Trạng thái"
              variant="outlined"
              density="comfortable"
              hide-details
            >
              <template #selection>
                <v-chip
                  size="small"
                  :color="form.status === 'ACTIVE' ? 'success' : 'error'"
                  variant="flat"
                >
                  {{ form.status === "ACTIVE" ? "Đang hoạt động" : "Tắt" }}
                </v-chip>
              </template>
            </v-select>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- RIGHT -->
      <v-col cols="12" lg="8">
        <v-card
          class="rounded-xl mb-4"
          elevation="0"
          border
          :style="
            fieldErrors.colors || fieldErrors.sizes
              ? 'border-color: rgb(var(--v-theme-error)) !important'
              : ''
          "
        >
          <v-card-title class="pa-5 pb-3 text-subtitle-1 font-weight-bold">
            <v-icon size="18" class="me-2 text-primary">mdi-palette</v-icon>
            Màu sắc &amp; kích cỡ
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-5">
            <!-- Colors -->
            <div class="d-flex align-center gap-2 mb-2 flex-wrap">
              <span
                class="text-body-2 font-weight-medium text-red"
                style="min-width: 80px"
                >*Màu sắc :</span
              >
              <div class="color-chip-list">
                <div
                  v-for="color in selectedColors"
                  :key="color.colorID"
                  class="color-chip-item"
                >
                  <div
                    class="color-chip"
                    :style="{ backgroundColor: color.colorCode || '#ccc' }"
                  >
                    <v-btn
                      icon
                      size="x-small"
                      class="chip-remove"
                      @click="removeColor(color)"
                    >
                      <v-icon size="12" color="white">mdi-close</v-icon>
                    </v-btn>
                  </div>
                  <span
                    class="text-caption text-center mt-1"
                    style="
                      max-width: 52px;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    "
                  >
                    {{ color.colorName }}
                  </span>
                </div>
                <v-btn
                  icon
                  color="orange"
                  variant="flat"
                  size="small"
                  style="border-radius: 8px"
                  @click="colorPickerOpen = true"
                >
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </div>
            </div>
            <!-- ✅ Error hint cho màu -->
            <div
              v-if="fieldErrors.colors"
              class="text-caption text-error mb-3 ms-1"
            >
              <v-icon size="12" color="error">mdi-alert-circle</v-icon>
              Vui lòng chọn ít nhất một màu sắc
            </div>

            <!-- Sizes -->
            <div class="d-flex align-center gap-2 flex-wrap">
              <span
                class="text-body-2 font-weight-medium text-red"
                style="min-width: 80px"
                >*Kích cỡ :</span
              >
              <div class="size-chip-list">
                <div
                  v-for="size in selectedSizes"
                  :key="size.sizeID"
                  class="size-chip-item"
                >
                  <div class="size-chip">
                    <span>{{ size.sizeName }}</span>
                    <v-btn
                      icon
                      size="x-small"
                      class="chip-remove size-chip-remove"
                      @click="removeSize(size)"
                    >
                      <v-icon size="12" color="white">mdi-close</v-icon>
                    </v-btn>
                  </div>
                </div>
                <v-btn
                  icon
                  color="orange"
                  variant="flat"
                  size="small"
                  style="border-radius: 8px"
                  @click="sizePickerOpen = true"
                >
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </div>
            </div>
            <!-- ✅ Error hint cho kích cỡ -->
            <div
              v-if="fieldErrors.sizes"
              class="text-caption text-error mt-2 ms-1"
            >
              <v-icon size="12" color="error">mdi-alert-circle</v-icon>
              Vui lòng chọn ít nhất một kích cỡ
            </div>
          </v-card-text>
        </v-card>

        <!-- Variant tables -->
        <div v-if="variantMatrix.length">
          <!-- ✅ Summary lỗi biến thể -->
          <v-alert
            v-if="fieldErrors.variantRows"
            type="warning"
            variant="tonal"
            class="mb-3 rounded-xl"
            density="compact"
          >
            <v-icon size="16" class="me-1">mdi-table-alert</v-icon>
            Một số biến thể có giá hoặc số lượng không hợp lệ (ô được tô đỏ).
            Vui lòng kiểm tra lại.
          </v-alert>

          <div
            v-for="colorGroup in variantMatrix"
            :key="colorGroup.colorID"
            class="mb-4"
          >
            <v-card class="rounded-xl" elevation="0" border>
              <div class="d-flex align-center justify-space-between px-5 py-3">
                <div class="d-flex align-center gap-2">
                  <span
                    class="color-dot"
                    :style="{ backgroundColor: colorGroup.colorCode || '#ccc' }"
                  />
                  <span class="text-subtitle-2 font-weight-bold">
                    Danh sách sản phẩm màu {{ colorGroup.colorName }}
                  </span>
                  <!-- ✅ Badge lỗi theo nhóm màu -->
                  <v-chip
                    v-if="groupHasError(colorGroup)"
                    size="x-small"
                    color="error"
                    variant="flat"
                  >
                    <v-icon start size="10">mdi-alert</v-icon>
                    Có lỗi nhập liệu
                  </v-chip>
                </div>
                <v-btn
                  size="small"
                  color="warning"
                  variant="tonal"
                  prepend-icon="mdi-restore"
                  @click="resetColorGroup(colorGroup.colorID)"
                >
                  Khôi phục
                </v-btn>
              </div>
              <v-divider />
              <div class="pa-0">
                <table class="variant-table w-100">
                  <thead>
                    <tr>
                      <th width="160">Sản phẩm</th>
                      <th width="90">Kích cỡ</th>
                      <th width="120">Số lượng</th>
                      <th width="180">Giá</th>
                      <th width="40"></th>
                      <th width="180">Ảnh</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in colorGroup.rows"
                      :key="row.key"
                      :class="{ 'row-deleted': row.deleted }"
                    >
                      <td>
                        <span class="text-body-2 font-weight-medium">
                          {{ form.productName || "Sản phẩm" }}
                        </span>
                      </td>
                      <td class="text-center">
                        <span class="text-body-2">{{ row.sizeName }}</span>
                      </td>
                      <!-- ✅ Số lượng với highlight lỗi -->
                      <td>
                        <v-text-field
                          v-model.number="row.stockQuantity"
                          type="number"
                          variant="outlined"
                          density="compact"
                          hide-details
                          style="width: 90px"
                          :disabled="row.deleted"
                          :error="!row.deleted && row.quantityError"
                          min="0"
                          @keypress="onlyNumber"
                          @input="
                            row.quantityError = false;
                            fieldErrors.variantRows = hasAnyRowError();
                          "
                        />
                      </td>
                      <!-- ✅ Giá với highlight lỗi -->
                      <td>
                        <v-text-field
                          v-model.number="row.price"
                          type="number"
                          variant="outlined"
                          density="compact"
                          hide-details
                          style="width: 170px"
                          suffix="đ"
                          :disabled="row.deleted"
                          :error="!row.deleted && row.priceError"
                          min="1"
                          @keypress="onlyNumber"
                          @input="
                            row.priceError = false;
                            fieldErrors.variantRows = hasAnyRowError();
                          "
                        />
                      </td>
                      <td class="text-center">
                        <v-btn
                          icon
                          size="small"
                          variant="text"
                          :color="row.deleted ? 'success' : 'error'"
                          @click="toggleRowDelete(row)"
                        >
                          <v-icon size="18">{{
                            row.deleted ? "mdi-restore" : "mdi-delete"
                          }}</v-icon>
                        </v-btn>
                      </td>
                      <!-- Image cell -->
                      <td>
                        <div
                          class="image-upload-cell"
                          @click="!row.deleted && openImagePicker(row)"
                        >
                          <div
                            v-if="row.imagePreview"
                            class="image-preview-wrapper"
                          >
                            <img
                              :src="row.imagePreview"
                              class="image-preview-thumb"
                            />
                            <div
                              v-if="row.imageFiles.length > 1"
                              class="img-count-badge"
                            >
                              +{{ row.imageFiles.length - 1 }}
                            </div>
                            <v-btn
                              icon
                              size="x-small"
                              class="remove-img-btn"
                              color="error"
                              variant="flat"
                              @click.stop="removeAllImages(row)"
                            >
                              <v-icon size="12">mdi-close</v-icon>
                            </v-btn>
                          </div>
                          <div
                            v-else
                            class="upload-placeholder"
                            :class="{
                              'upload-placeholder--disabled': row.deleted,
                            }"
                          >
                            <v-icon size="20" color="grey"
                              >mdi-image-plus</v-icon
                            >
                            <span class="text-caption text-grey">Chọn ảnh</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </v-card>
          </div>
        </div>

        <!-- Empty -->
        <v-card
          v-else
          class="rounded-xl text-center py-12"
          elevation="0"
          border
          style="border-style: dashed"
        >
          <v-icon size="48" color="grey-lighten-1">mdi-table-plus</v-icon>
          <p class="text-body-2 text-grey mt-3">
            Chọn màu sắc và kích cỡ để tạo bảng biến thể
          </p>
        </v-card>
      </v-col>
    </v-row>

    <!-- Color Picker Dialog -->
    <v-dialog v-model="colorPickerOpen" max-width="440">
      <v-card class="rounded-xl">
        <v-card-title class="pa-5 text-subtitle-1 font-weight-bold"
          >Chọn màu sắc</v-card-title
        >
        <v-divider />
        <v-card-text class="pa-5">
          <v-text-field
            v-model="colorSearch"
            placeholder="Tìm màu..."
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-magnify"
            hide-details
            class="mb-3"
            clearable
          />
          <div class="color-picker-grid">
            <div
              v-for="color in filteredColorOptions"
              :key="color.colorID"
              class="color-picker-item"
              :class="{ 'color-picker-item--selected': isColorSelected(color) }"
              @click="toggleColor(color)"
            >
              <span
                class="color-picker-swatch"
                :style="{ backgroundColor: color.colorCode || '#ccc' }"
              />
              <span class="text-caption">{{ color.colorName }}</span>
              <v-icon
                v-if="isColorSelected(color)"
                size="14"
                color="primary"
                class="ms-auto"
                >mdi-check</v-icon
              >
            </div>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 justify-end">
          <v-btn variant="text" @click="colorPickerOpen = false">Đóng</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Size Picker Dialog -->
    <v-dialog v-model="sizePickerOpen" max-width="380">
      <v-card class="rounded-xl">
        <v-card-title class="pa-5 text-subtitle-1 font-weight-bold"
          >Chọn kích cỡ</v-card-title
        >
        <v-divider />
        <v-card-text class="pa-5">
          <div class="size-picker-grid">
            <div
              v-for="size in allSizes"
              :key="size.sizeID"
              class="size-picker-item"
              :class="{ 'size-picker-item--selected': isSizeSelected(size) }"
              @click="toggleSize(size)"
            >
              <span>{{ size.sizeName }}</span>
              <v-icon v-if="isSizeSelected(size)" size="14" color="primary"
                >mdi-check</v-icon
              >
            </div>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 justify-end">
          <v-btn variant="text" @click="sizePickerOpen = false">Đóng</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Image Picker Dialog -->
    <ImagePickerDialog
      v-model:open="imagePickerOpen"
      :initial-files="currentRow?.imageFiles ?? []"
      :max-images="5"
      @confirm="handleImageConfirm"
      @cancel="currentRow = null"
    />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import productApi from "@/api/productApi";
import productColorApi from "@/api/productColorApi";
import materialApi from "@/api/materialApi";
import ImagePickerDialog from "@/components/product/ImagePickerDialog.vue";

const router = useRouter();
const BASE_URL = "http://localhost:8080/api";
const COLOR_API = `${BASE_URL}/color`;
const SIZE_API = `${BASE_URL}/size`;

// ─── State ────────────────────────────────────────────────
const saving = ref(false);
const snackbar = ref(false);
const message = ref("");
const snackbarColor = ref("success");
const snackbarIcon = ref("mdi-check-circle");
const brands = ref([]);
const allColors = ref([]);
const allSizes = ref([]);
const materials = ref([]);
const materialSearch = ref("");

// ✅ Kiểm tra tên trùng
const checkingName = ref(false);
const nameAvailable = ref(null); // null = chưa check, true = ok, false = trùng
let nameCheckTimer = null;

// ✅ Lỗi từng trường (inline highlight)
const fieldErrors = ref({
  productName: false,
  productNameMsg: "",
  brandID: false,
  materialID: false,
  colors: false,
  sizes: false,
  variantRows: false, // có ít nhất 1 row lỗi giá/số lượng
});

// ✅ Danh sách lỗi tổng hợp hiển thị ở banner
const validationErrors = ref([]);

// Image picker
const imagePickerOpen = ref(false);
const currentRow = ref(null);

const form = ref({
  productName: "",
  description: "",
  brandID: null,
  materialID: null,
  status: "ACTIVE",
});

const selectedColors = ref([]);
const selectedSizes = ref([]);
const colorPickerOpen = ref(false);
const sizePickerOpen = ref(false);
const colorSearch = ref("");
const variantMatrix = ref([]);

const onlyNumber = (event) => {
  const charCode = event.which || event.keyCode;

  // chỉ cho phép 0-9
  if (charCode < 48 || charCode > 57) {
    event.preventDefault();
  }
};

// ─── Lifecycle ────────────────────────────────────────────
onMounted(() => {
  loadBrands();
  loadMaterials();
  loadColors();
  loadSizes();
});

// ─── Helpers ──────────────────────────────────────────────
const showMessage = (text, type = "success") => {
  message.value = text;
  snackbarColor.value =
    type === "error"
      ? "error"
      : type === "warning"
        ? "warning"
        : "success";
  snackbarIcon.value =
    type === "error"
      ? "mdi-close-circle"
      : type === "warning"
        ? "mdi-alert-circle"
        : "mdi-check-circle";
  snackbar.value = true;
};

// ─── Loaders ──────────────────────────────────────────────
const loadBrands = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/brands/active`);
    brands.value = res.data || [];
  } catch {
    showMessage("Không thể tải thương hiệu", "error");
  }
};

const loadMaterials = async () => {
  try {
    const res = await materialApi.getAllActive();
    materials.value = (res.data || []).map((m) => ({
      ...m,
      materialID: m.materialID ?? m.materialId ?? m.id,
      materialName: m.materialName ?? m.name ?? "",
    }));
  } catch {
    showMessage("Không thể tải chất liệu", "error");
  }
};

const loadColors = async () => {
  try {
    const res = await axios
      .get(`${COLOR_API}/active`)
      .catch(() => axios.get(COLOR_API));
    allColors.value = (res.data || []).map((c) => ({
      ...c,
      colorID: c.colorID ?? c.id,
      colorName: c.colorName ?? c.name ?? "",
      colorCode: c.colorCode ?? c.code ?? "#cccccc",
    }));
  } catch {
    showMessage("Không thể tải màu sắc", "error");
  }
};

const loadSizes = async () => {
  try {
    const res = await axios
      .get(`${SIZE_API}/active`)
      .catch(() => axios.get(SIZE_API));
    allSizes.value = (res.data || []).map((s) => ({
      ...s,
      sizeID: s.sizeID ?? s.id,
      sizeName: s.sizeName ?? s.name ?? "",
    }));
  } catch {
    showMessage("Không thể tải kích cỡ", "error");
  }
};

// ─── ✅ Kiểm tra tên trùng ────────────────────────────────
/**
 * Gọi API kiểm tra tên sản phẩm đã tồn tại chưa.
 * Endpoint gợi ý: GET /api/products/check-name?name=xxx
 * Trả về { exists: true/false } hoặc status 200/409
 * Nếu backend chưa có endpoint này → bỏ qua (catch → nameAvailable = null)
 */
const checkProductNameDuplicate = async (name) => {
  if (!name?.trim()) return;
  checkingName.value = true;
  nameAvailable.value = null;
  try {
    const res = await axios.get(`${BASE_URL}/products/check-name`, {
      params: { name: name.trim() },
    });
    // Backend trả về { exists: boolean } hoặc { available: boolean }
    const data = res.data;
    const exists =
      data?.exists === true ||
      data?.available === false ||
      data?.duplicate === true;
    nameAvailable.value = !exists;
    if (exists) {
      fieldErrors.value.productName = true;
      fieldErrors.value.productNameMsg = `Tên sản phẩm "${name.trim()}" đã tồn tại`;
    } else {
      fieldErrors.value.productName = false;
      fieldErrors.value.productNameMsg = "";
    }
  } catch (err) {
    // Nếu backend trả 409 Conflict → coi là đã tồn tại
    if (err?.response?.status === 409) {
      nameAvailable.value = false;
      fieldErrors.value.productName = true;
      fieldErrors.value.productNameMsg = `Tên sản phẩm "${name.trim()}" đã tồn tại`;
    } else {
      // Endpoint không tồn tại hoặc lỗi khác → bỏ qua, không block
      nameAvailable.value = null;
      fieldErrors.value.productName = false;
    }
  } finally {
    checkingName.value = false;
  }
};

const onProductNameInput = () => {
  // Reset lỗi tức thì khi user gõ
  nameAvailable.value = null;
  fieldErrors.value.productName = false;
  fieldErrors.value.productNameMsg = "";
  // Debounce check tên trùng (gọi sau 600ms không gõ tiếp)
  clearTimeout(nameCheckTimer);
  nameCheckTimer = setTimeout(() => {
    if (form.value.productName?.trim().length >= 2) {
      checkProductNameDuplicate(form.value.productName);
    }
  }, 600);
};

const onProductNameBlur = () => {
  clearTimeout(nameCheckTimer);
  if (form.value.productName?.trim().length >= 2) {
    checkProductNameDuplicate(form.value.productName);
  }
};

// ─── Material helpers ─────────────────────────────────────
const filteredMaterials = computed(() => {
  const kw = materialSearch.value?.trim().toLowerCase();
  if (!kw) return materials.value;
  return materials.value.filter((m) =>
    m.materialName?.toLowerCase().includes(kw),
  );
});

const canCreateMaterial = computed(() => {
  const kw = materialSearch.value?.trim();
  if (!kw) return false;
  return !materials.value.some(
    (m) => m.materialName?.trim().toLowerCase() === kw.toLowerCase(),
  );
});

const handleMaterialChange = async (value) => {
  if (!value) {
    clearMaterial();
    return;
  }
  const found = materials.value.find(
    (m) => String(m.materialID) === String(value),
  );
  if (found) {
    form.value.materialID = found.materialID;
    await nextTick();
    materialSearch.value = found.materialName;
  }
};

const clearMaterial = () => {
  form.value.materialID = null;
  materialSearch.value = "";
};

const handleMaterialEnter = async () => {
  const kw = materialSearch.value?.trim();
  if (!kw) return;
  const found = materials.value.find(
    (m) => m.materialName?.trim().toLowerCase() === kw.toLowerCase(),
  );
  if (found) {
    form.value.materialID = found.materialID;
    await nextTick();
    materialSearch.value = found.materialName;
    return;
  }
  await createQuickMaterial(kw);
};

const createQuickMaterial = async (name) => {
  const materialName = String(name || "").trim();
  if (!materialName) {
    showMessage("Nhập tên chất liệu", "warning");
    return;
  }
  try {
    await materialApi.create({ materialName, status: "ACTIVE" });
    await loadMaterials();
    const created = materials.value.find(
      (m) =>
        m.materialName?.trim().toLowerCase() === materialName.toLowerCase(),
    );
    if (created) {
      form.value.materialID = created.materialID;
      await nextTick();
      materialSearch.value = created.materialName;
      showMessage(`Đã thêm chất liệu "${created.materialName}"`, "success");
    }
  } catch (err) {
    showMessage(
      err?.response?.data?.message || "Không thể thêm chất liệu",
      "error",
    );
  }
};

// ─── Color picker ─────────────────────────────────────────
const filteredColorOptions = computed(() => {
  const kw = colorSearch.value?.trim().toLowerCase();
  if (!kw) return allColors.value;
  return allColors.value.filter((c) => c.colorName?.toLowerCase().includes(kw));
});

const isColorSelected = (color) =>
  selectedColors.value.some((c) => c.colorID === color.colorID);

const toggleColor = (color) => {
  if (isColorSelected(color)) removeColor(color);
  else {
    selectedColors.value.push(color);
    addColorToMatrix(color);
    fieldErrors.value.colors = false;
  }
};

const removeColor = (color) => {
  selectedColors.value = selectedColors.value.filter(
    (c) => c.colorID !== color.colorID,
  );
  variantMatrix.value = variantMatrix.value.filter(
    (g) => g.colorID !== color.colorID,
  );
};

// ─── Size picker ──────────────────────────────────────────
const isSizeSelected = (size) =>
  selectedSizes.value.some((s) => s.sizeID === size.sizeID);

const toggleSize = (size) => {
  if (isSizeSelected(size)) removeSize(size);
  else {
    selectedSizes.value.push(size);
    addSizeToMatrix(size);
    fieldErrors.value.sizes = false;
  }
};

const removeSize = (size) => {
  selectedSizes.value = selectedSizes.value.filter(
    (s) => s.sizeID !== size.sizeID,
  );
  variantMatrix.value.forEach((group) => {
    group.rows = group.rows.filter((r) => r.sizeID !== size.sizeID);
  });
};

// ─── Matrix ───────────────────────────────────────────────
const makeRow = (colorID, size) => ({
  key: `${colorID}_${size.sizeID}`,
  sizeID: size.sizeID,
  sizeName: size.sizeName,
  stockQuantity: 100,
  price: 100000,
  imageFiles: [],
  imagePreview: null,
  deleted: false,
  selected: false,
  // ✅ Trạng thái lỗi validate từng ô
  priceError: false,
  quantityError: false,
});

const addColorToMatrix = (color) => {
  if (variantMatrix.value.find((g) => g.colorID === color.colorID)) return;
  variantMatrix.value.push({
    colorID: color.colorID,
    colorName: color.colorName,
    colorCode: color.colorCode,
    rows: selectedSizes.value.map((size) => makeRow(color.colorID, size)),
  });
};

const addSizeToMatrix = (size) => {
  variantMatrix.value.forEach((group) => {
    if (!group.rows.find((r) => r.sizeID === size.sizeID))
      group.rows.push(makeRow(group.colorID, size));
  });
};

const toggleRowDelete = (row) => {
  row.deleted = !row.deleted;
  // Xóa lỗi của row khi bị ẩn
  if (row.deleted) {
    row.priceError = false;
    row.quantityError = false;
    fieldErrors.value.variantRows = hasAnyRowError();
  }
};

const resetColorGroup = (colorID) => {
  const group = variantMatrix.value.find((g) => g.colorID === colorID);
  if (!group) return;
  group.rows.forEach((r) => {
    r.deleted = false;
    r.stockQuantity = 100;
    r.price = 100000;
    r.priceError = false;
    r.quantityError = false;
    r.imageFiles.forEach((img) => URL.revokeObjectURL(img.preview));
    r.imageFiles = [];
    r.imagePreview = null;
    r.selected = false;
  });
  fieldErrors.value.variantRows = hasAnyRowError();
};

// ✅ Helper: kiểm tra nhóm màu có row nào lỗi không
const groupHasError = (colorGroup) =>
  colorGroup.rows.some((r) => !r.deleted && (r.priceError || r.quantityError));

// ✅ Helper: toàn bộ matrix có lỗi không
const hasAnyRowError = () =>
  variantMatrix.value.some((g) =>
    g.rows.some((r) => !r.deleted && (r.priceError || r.quantityError)),
  );

// ─── Image picker ─────────────────────────────────────────
const openImagePicker = (row) => {
  currentRow.value = row;
  imagePickerOpen.value = true;
};

const handleImageConfirm = (selectedImages) => {
  const row = currentRow.value;
  if (!row) return;
  row.imageFiles.forEach((old) => {
    if (!selectedImages.find((s) => s.preview === old.preview))
      URL.revokeObjectURL(old.preview);
  });
  row.imageFiles = selectedImages;
  const mainImg = selectedImages.find((i) => i.isMain) ?? selectedImages[0];
  row.imagePreview = mainImg?.preview ?? null;
  currentRow.value = null;
};

const removeAllImages = (row) => {
  row.imageFiles.forEach((img) => URL.revokeObjectURL(img.preview));
  row.imageFiles = [];
  row.imagePreview = null;
};

// ─── ✅ Validate toàn bộ TRƯỚC khi gọi bất kỳ API nào ────
/**
 * Trả về true nếu hợp lệ, false nếu có lỗi.
 * Đồng thời cập nhật fieldErrors và validationErrors để UI phản hồi.
 */
const validateAll = () => {
  const errors = [];

  // Reset
  Object.keys(fieldErrors.value).forEach((k) => {
    if (k !== "productNameMsg") fieldErrors.value[k] = false;
  });
  // Giữ lại lỗi tên trùng nếu đang có
  const keepNameError = nameAvailable.value === false;

  // 1. Tên sản phẩm
  if (!form.value.productName?.trim()) {
    fieldErrors.value.productName = true;
    fieldErrors.value.productNameMsg = "Vui lòng nhập tên sản phẩm";
    errors.push("Chưa nhập tên sản phẩm");
  } else if (keepNameError) {
    fieldErrors.value.productName = true;
    errors.push(fieldErrors.value.productNameMsg);
  }

  // 2. Thương hiệu
  if (!form.value.brandID) {
    fieldErrors.value.brandID = true;
    errors.push("Chưa chọn thương hiệu");
  }

  // 3. Chất liệu
  if (!form.value.materialID) {
    fieldErrors.value.materialID = true;
    errors.push("Chưa chọn chất liệu");
  }

  // 4. Màu sắc
  if (selectedColors.value.length === 0) {
    fieldErrors.value.colors = true;
    errors.push("Chưa chọn màu sắc nào");
  }

  // 5. Kích cỡ
  if (selectedSizes.value.length === 0) {
    fieldErrors.value.sizes = true;
    errors.push("Chưa chọn kích cỡ nào");
  }

  // 6. Phải có ít nhất 1 biến thể active
  const activeGroups = variantMatrix.value
    .map((g) => ({ ...g, rows: g.rows.filter((r) => !r.deleted) }))
    .filter((g) => g.rows.length > 0);

  if (
    selectedColors.value.length > 0 &&
    selectedSizes.value.length > 0 &&
    activeGroups.length === 0
  ) {
    errors.push(
      "Tất cả biến thể đã bị xóa. Vui lòng giữ lại ít nhất một biến thể",
    );
  }

  // 7. Validate từng row: giá > 0, số lượng >= 0
  let rowErrorCount = 0;
  variantMatrix.value.forEach((group) => {
    group.rows.forEach((row) => {
      if (row.deleted) return;

      let rowHasError = false;

      // Giá phải > 0
      if (!row.price || row.price <= 0 || isNaN(row.price)) {
        row.priceError = true;
        rowHasError = true;
      }

      // Số lượng phải >= 0 và là số hợp lệ
      if (
        row.stockQuantity === null ||
        row.stockQuantity === undefined ||
        row.stockQuantity < 0 ||
        isNaN(row.stockQuantity)
      ) {
        row.quantityError = true;
        rowHasError = true;
      }

      if (rowHasError) rowErrorCount++;
    });
  });

  if (rowErrorCount > 0) {
    fieldErrors.value.variantRows = true;
    errors.push(
      `${rowErrorCount} biến thể có giá hoặc số lượng không hợp lệ (giá phải > 0, số lượng phải ≥ 0)`,
    );
  }

  validationErrors.value = errors;
  return errors.length === 0;
};

// ─── Save ─────────────────────────────────────────────────
const handleSave = async () => {
  // ✅ BƯỚC 1: Validate TOÀN BỘ trước — không gọi API nếu còn lỗi
  const isValid = validateAll();
  if (!isValid) {
    // Cuộn lên banner lỗi
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  // ✅ BƯỚC 2 (tuỳ chọn): Nếu chưa check tên hoặc đang check → đợi
  if (checkingName.value) {
    showMessage("Đang kiểm tra tên sản phẩm, vui lòng chờ...", "info");
    return;
  }

  const activeGroups = variantMatrix.value
    .map((g) => ({ ...g, rows: g.rows.filter((r) => !r.deleted) }))
    .filter((g) => g.rows.length > 0);

  saving.value = true;
  try {
    // ✅ BƯỚC 3: Tạo sản phẩm — chỉ gọi khi đã validate xong
    const productRes = await productApi.create({
      productName: form.value.productName.trim(),
      description: form.value.description,
      brandID: form.value.brandID,
      materialID: form.value.materialID,
      status: form.value.status,
    });
    const _raw = productRes.data;
    const productID = Number(
      _raw?.id ?? _raw?.productID ?? _raw?.productId ?? _raw?.product_id,
    );
    if (!productID || isNaN(productID))
      throw new Error("Không thể lấy ID sản phẩm");

    // ✅ BƯỚC 4: Tạo biến thể — batch trước, fallback từng cái
    let usedBatch = false;
    if (activeGroups.length > 0) {
      const batchPayload = activeGroups.flatMap((group, gi) =>
        group.rows.map((row, ri) => ({
          colorID: group.colorID,
          sizeID: row.sizeID,
          price: row.price,
          stockQuantity: row.stockQuantity,
          status: "ACTIVE",
          isRepresentative: gi === 0 && ri === 0,
        })),
      );
      try {
        await axios.post(
          `${BASE_URL}/product-color/${productID}/colors/batch`,
          batchPayload,
        );
        usedBatch = true;
      } catch (batchErr) {
        if (batchErr?.response?.status !== 404) throw batchErr;
      }
    }

    if (!usedBatch) {
      let isFirst = true;
      for (const group of activeGroups) {
        for (const row of group.rows) {
          await productColorApi.create(productID, {
            colorID: group.colorID,
            sizeID: row.sizeID,
            price: row.price,
            stockQuantity: row.stockQuantity,
            status: "ACTIVE",
            isRepresentative: isFirst,
          });
          isFirst = false;
        }
      }
    }

    // ✅ BƯỚC 5: Reload detail để lấy productColorID thực tế
    const detailRes = await productApi.getDetail(productID);
    const serverColors = detailRes.data?.colors ?? [];

    // ✅ BƯỚC 6: Upload ảnh
    for (const group of activeGroups) {
      for (const row of group.rows) {
        if (!row.imageFiles?.length) continue;
        const matched = serverColors.find(
          (c) => c.colorID === group.colorID && c.sizeID === row.sizeID,
        );
        if (!matched?.productColorID) continue;
        for (const imgItem of row.imageFiles) {
          await axios
            .post(`${BASE_URL}/image/color/${matched.productColorID}/image`, {
              imageUrl: `/images/${imgItem.file.name}`,
              isMain: !!imgItem.isMain,
            })
            .catch((err) => console.warn("Upload ảnh thất bại:", err));
        }
      }
    }

    showMessage("Tạo sản phẩm thành công!", "success");
    setTimeout(() => router.push({ name: "AdminProducts" }), 1000);
  } catch (err) {
    console.error(err);
    // ✅ Xử lý lỗi tên trùng từ server (fallback)
    const msg = err?.response?.data?.message || err?.response?.data || "";
    if (
      err?.response?.status === 409 ||
      String(msg).toLowerCase().includes("trùng") ||
      String(msg).toLowerCase().includes("duplicate") ||
      String(msg).toLowerCase().includes("exist")
    ) {
      nameAvailable.value = false;
      fieldErrors.value.productName = true;
      fieldErrors.value.productNameMsg = `Tên sản phẩm "${form.value.productName}" đã tồn tại`;
      validationErrors.value = [fieldErrors.value.productNameMsg];
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      showMessage(msg || "Không thể lưu sản phẩm", "error");
    }
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.product-create-page {
  background: #f7f8fa;
  min-height: 100vh;
}

/* Color chips */
.color-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}
.color-chip-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.color-chip {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  position: relative;
  border: 2px solid rgba(0, 0, 0, 0.08);
  cursor: default;
}

/* Size chips */
.size-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.size-chip-item {
  position: relative;
}
.size-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1.5px solid #bbb;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 500;
  background: #fff;
  position: relative;
}

/* Remove btn */
.chip-remove {
  position: absolute !important;
  top: -8px;
  right: -8px;
  background: #f44336 !important;
  width: 18px !important;
  height: 18px !important;
  min-width: unset !important;
  border-radius: 50% !important;
}
.size-chip-remove {
  position: absolute !important;
  top: -8px;
  right: -8px;
  background: #f44336 !important;
  width: 18px !important;
  height: 18px !important;
  min-width: unset !important;
  border-radius: 50% !important;
}

/* Color dot */
.color-dot {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

/* Variant table */
.variant-table {
  border-collapse: collapse;
  font-size: 13px;
}
.variant-table th {
  background: #f5f5f5;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  color: #555;
  border-bottom: 1px solid #e8e8e8;
}
.variant-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}
.variant-table tbody tr:last-child td {
  border-bottom: none;
}
.variant-table tbody tr {
  transition: background 0.15s;
}
.variant-table tbody tr:hover {
  background: #fdf8f0;
}
.row-deleted td {
  opacity: 0.4;
  text-decoration: line-through;
}

/* ✅ Ô lỗi — deepened tô nền nhẹ để không bị che bởi Vuetify error state */
.field-error :deep(.v-field__outline) {
  --v-field-border-opacity: 1;
}
.field-error :deep(.v-field) {
  background: rgba(244, 67, 54, 0.04) !important;
}

/* Image cell */
.image-upload-cell {
  width: 160px;
  height: 80px;
  cursor: pointer;
  position: relative;
}
.upload-placeholder {
  width: 160px;
  height: 80px;
  border: 1.5px dashed #ccc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: #fafafa;
  transition:
    border-color 0.2s,
    background 0.2s;
}
.upload-placeholder:hover {
  border-color: #1976d2;
  background: #e3f2fd;
}
.upload-placeholder--disabled {
  pointer-events: none;
  opacity: 0.4;
}
.image-preview-wrapper {
  position: relative;
  width: 160px;
  height: 80px;
}
.image-preview-thumb {
  width: 160px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}
.img-count-badge {
  position: absolute;
  bottom: 5px;
  left: 5px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 20px;
}
.remove-img-btn {
  position: absolute !important;
  top: -6px;
  right: -6px;
  width: 18px !important;
  height: 18px !important;
  min-width: unset !important;
}

/* Color picker */
.color-picker-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 320px;
  overflow-y: auto;
}
.color-picker-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 13px;
}
.color-picker-item:hover {
  background: #f5f5f5;
}
.color-picker-item--selected {
  background: #e3f2fd;
}
.color-picker-swatch {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1.5px solid rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

/* Size picker */
.size-picker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}
.size-picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s;
}
.size-picker-item:hover {
  border-color: #1976d2;
  background: #e3f2fd;
}
.size-picker-item--selected {
  border-color: #1976d2;
  background: #e3f2fd;
  color: #1976d2;
}

.price-field :deep(.v-field__append-inner) {
  padding-top: 6px;
  font-size: 12px;
  color: #666;
}

/* ✅ Toast styling */
:deep(.custom-snackbar) {
  padding: 0 !important;
  overflow: hidden;
  border-radius: 12px !important;
  background: white !important;
  min-width: 320px;
}

.toast-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 14px 12px;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toast-text {
  color: #444;
  font-size: 15px;
  font-weight: 500;
}

.toast-progress {
  height: 4px;
  width: 100%;
  animation: progress-animation 2.5s linear forwards;
}

.toast-progress.success {
  background: #1db954;
}

.toast-progress.error {
  background: #ef5350;
}

.toast-progress.warning {
  background: #ff9800;
}

@keyframes progress-animation {
  from {
    width: 100%;
  }

  to {
    width: 0%;
  }
}

:deep(.v-snackbar__wrapper) {
  animation: slideIn 0.25s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
