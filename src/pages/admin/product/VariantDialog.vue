<template>
  <v-dialog v-model="localOpen" max-width="880" persistent>
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        {{
          mode === "add"
            ? "Thêm biến thể sản phẩm"
            : "Cập nhật biến thể sản phẩm"
        }}
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-5">
        <!-- Variant Preview Section -->
        <div v-if="form.colorID || form.sizeID" class="variant-preview-section mb-5">
          <div class="variant-preview-header">
            <v-icon size="20" color="primary">mdi-palette</v-icon>
            <span class="font-weight-bold">Thông tin biến thể</span>
          </div>
          
          <div class="variant-preview-content">
            <div class="preview-item" v-if="selectedColor">
              <span class="preview-label">Màu:</span>
              <div class="preview-value">
                <span
                  class="color-preview-dot"
                  :style="{ backgroundColor: selectedColor.colorCode || '#ddd' }"
                />
                <span class="font-weight-medium">{{ selectedColor.colorName }}</span>
              </div>
            </div>

            <div class="preview-item" v-if="selectedSize">
              <span class="preview-label">Size:</span>
              <v-chip size="small" variant="outlined" class="preview-value">
                {{ selectedSize.sizeName }}
              </v-chip>
            </div>

            <div class="preview-item" v-if="form.price !== null && form.price !== undefined">
              <span class="preview-label">Giá:</span>
              <span class="preview-value font-weight-bold text-success">
                {{ formatPrice(form.price) }}đ
              </span>
            </div>
          </div>
        </div>

        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.colorID"
              :items="colors"
              item-title="colorName"
              item-value="colorID"
              label="Chọn màu"
              variant="outlined"
              density="comfortable"
              hide-details
            >
              <template #selection>
                <div v-if="selectedColor" class="color-option">
                  <span
                    class="color-swatch"
                    :style="{
                      backgroundColor: selectedColor.colorCode || '#ddd',
                    }"
                  ></span>
                  <span>{{ selectedColor.colorName }}</span>
                </div>
                <span v-else class="text-grey">Chọn màu</span>
              </template>

              <template #item="{ props, item }">
                <v-list-item v-bind="props" class="color-list-item">
                  <template #prepend>
                    <span
                      class="color-swatch-large"
                      :style="{
                        backgroundColor: item?.colorCode || '#ddd',
                      }"
                    ></span>
                  </template>

                  <template #title>
                    {{
                      item?.colorName || item?.title || "Không có tên màu"
                    }}
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="form.sizeID"
              :items="sizes"
              item-title="sizeName"
              item-value="sizeID"
              label="Chọn size"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.price"
              type="number"
              label="Giá"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.stockQuantity"
              type="number"
              label="Số lượng tồn"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              v-model="form.status"
              :items="statusOptions"
              label="Trạng thái"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <v-col cols="12">
            <v-switch
              v-model="form.isRepresentative"
              color="primary"
              inset
              label="Đặt làm biến thể đại diện"
              hide-details
            />
          </v-col>
        </v-row>

        <div class="mt-5">
          <div class="text-subtitle-1 font-weight-bold mb-3">Ảnh biến thể</div>

          <div
            v-if="mode === 'edit' && existingImages.length"
            class="existing-images mb-4"
          >
            <div
              v-for="img in existingImages"
              :key="img.imageID"
              class="image-card"
            >
              <img :src="img.imageUrl" class="dialog-image" />
              <div class="image-actions">
                <v-chip
                  v-if="img.isMain"
                  size="x-small"
                  color="success"
                  variant="flat"
                >
                  Ảnh chính
                </v-chip>
                <v-btn
                  v-else
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  @click="$emit('set-main', img)"
                >
                  Đặt chính
                </v-btn>

                <v-btn
                  size="x-small"
                  color="error"
                  variant="tonal"
                  @click="$emit('delete-image', img)"
                >
                  Xóa
                </v-btn>
              </div>
            </div>
          </div>

          <div class="upload-box">
            <input
              type="file"
              multiple
              accept="image/*"
              @change="onFileChange"
              :disabled="remainingSlots === 0"
            />
            <div class="text-caption text-grey mt-2">
              Tối đa 5 ảnh cho mỗi biến thể. Hiện có {{ totalImagesCount }}/5
              ảnh.
            </div>
          </div>

          <div v-if="newFiles.length" class="new-files-preview mt-4">
            <div
              v-for="(file, index) in newFiles"
              :key="`${file.name}-${index}`"
              class="preview-chip"
            >
              {{ file.name }}
              <v-btn
                icon="mdi-close"
                size="x-small"
                variant="text"
                @click="removeNewFile(index)"
              />
            </div>
          </div>
        </div>

        <!-- Barcode & QR Code Section -->
        <div v-if="showIdentifierSection" class="mt-6">
          <div class="text-subtitle-1 font-weight-bold mb-4">
            <v-icon size="20" color="primary" class="me-2">mdi-qrcode</v-icon>
            Mã định danh sản phẩm
          </div>

          <v-alert type="info" variant="tonal" class="mb-4">
            <v-alert-title>Mã sản phẩm: {{ productColorCodeDisplay }}</v-alert-title>
          </v-alert>

          <v-row class="ga-6">
            <!-- Barcode Section -->
            <v-col cols="12" md="6">
              <div class="code-container">
                <div class="code-label">Mã vạch (Barcode)</div>
                <div class="barcode-wrapper" ref="barcodeContainer">
                  <svg ref="barcodeSvg" />
                </div>
                <div class="code-actions mt-3">
                  <v-btn
                    size="small"
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-printer"
                    @click="printBarcode"
                    class="me-2"
                  >
                    In
                  </v-btn>
                  <v-btn
                    size="small"
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-content-copy"
                    @click="copyToClipboard('barcode')"
                  >
                    Sao chép
                  </v-btn>
                  <v-btn
                    size="small"
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-download"
                    @click="downloadBarcode"
                    class="ms-2"
                  >
                    Tải
                  </v-btn>
                </div>
              </div>
            </v-col>

            <!-- QR Code Section -->
            <v-col cols="12" md="6">
              <div class="code-container">
                <div class="code-label">Mã QR</div>
                <div class="qrcode-wrapper">
                  <canvas ref="qrcodeCanvas" />
                </div>
                <div class="code-actions mt-3">
                  <v-btn
                    size="small"
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-printer"
                    @click="printQRCode"
                    class="me-2"
                  >
                    In
                  </v-btn>
                  <v-btn
                    size="small"
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-content-copy"
                    @click="copyToClipboard('qrcode')"
                  >
                    Sao chép
                  </v-btn>
                  <v-btn
                    size="small"
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-download"
                    @click="downloadQRCode"
                    class="ms-2"
                  >
                    Tải
                  </v-btn>
                </div>
              </div>
            </v-col>
          </v-row>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="handleClose">Hủy</v-btn>
        <v-btn color="primary" @click="submit">
          {{ mode === "add" ? "Thêm" : "Lưu thay đổi" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch, nextTick } from "vue";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

const props = defineProps({
  open: Boolean,
  mode: {
    type: String,
    default: "add",
  },
  colors: {
    type: Array,
    default: () => [],
  },
  sizes: {
    type: Array,
    default: () => [],
  },
  variant: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:open", "submit", "delete-image", "set-main"]);

const localOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const statusOptions = ["ACTIVE", "INACTIVE"];

const defaultForm = () => ({
  colorID: null,
  sizeID: null,
  price: 0,
  stockQuantity: 0,
  status: "ACTIVE",
  isRepresentative: false,
});

const form = ref(defaultForm());
const newFiles = ref([]);
const barcodeSvg = ref(null);
const qrcodeCanvas = ref(null);
const barcodeContainer = ref(null);

const existingImages = computed(() => props.variant?.images || []);
const totalImagesCount = computed(
  () => existingImages.value.length + newFiles.value.length,
);
const remainingSlots = computed(() => Math.max(0, 5 - totalImagesCount.value));

const productColorCodeDisplay = computed(() => {
  return props.variant?.productColorCode || "—";
});

const showIdentifierSection = computed(() => {
  return props.mode === "edit" && props.variant?.productColorCode;
});

watch(
  () => props.variant,
  async (val) => {
    if (!val) {
      form.value = defaultForm();
      newFiles.value = [];
      return;
    }

    form.value = {
      colorID: val.colorID ?? null,
      sizeID: val.sizeID ?? null,
      price: val.price ?? 0,
      stockQuantity: val.stockQuantity ?? 0,
      status: val.status || "ACTIVE",
      isRepresentative: Boolean(val.isRepresentative),
    };

    newFiles.value = [];

    // Generate codes after dialog updates
    if (props.mode === "edit" && val.productColorCode) {
      await nextTick();
      await generateBarcode();
      await generateQRCode();
    }
  },
  { immediate: true },
);

const generateBarcode = async () => {
  try {
    const code = props.variant?.productColorCode || "";
    if (!code || !barcodeSvg.value) return;

    JsBarcode(barcodeSvg.value, code, {
      format: "CODE128",
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 14,
      margin: 10,
    });
  } catch (error) {
    console.error("Error generating barcode:", error);
  }
};

const generateQRCode = async () => {
  try {
    const code = props.variant?.productColorCode || "";
    if (!code || !qrcodeCanvas.value) return;

    await QRCode.toCanvas(qrcodeCanvas.value, code, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
  }
};

const printBarcode = async () => {
  try {
    const code = props.variant?.productColorCode || "";
    const svgElement = barcodeSvg.value;
    if (!svgElement || !code) return;

    const printWindow = window.open("", "", "width=800,height=600");
    const svgString = new XMLSerializer().serializeToString(svgElement);

    printWindow.document.write(`
      <html>
        <head>
          <title>In Mã Vạch - ${code}</title>
          <style>
            body { 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .barcode-print {
              text-align: center;
            }
            svg { 
              max-width: 100%; 
              height: auto;
            }
            .code-text {
              margin-top: 10px;
              font-size: 14px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="barcode-print">
            ${svgString}
            <div class="code-text">${code}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  } catch (error) {
    console.error("Error printing barcode:", error);
  }
};

const printQRCode = async () => {
  try {
    const code = props.variant?.productColorCode || "";
    const canvas = qrcodeCanvas.value;
    if (!canvas || !code) return;

    const printWindow = window.open("", "", "width=800,height=600");
    const imageData = canvas.toDataURL("image/png");

    printWindow.document.write(`
      <html>
        <head>
          <title>In Mã QR - ${code}</title>
          <style>
            body { 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .qr-print {
              text-align: center;
            }
            img { 
              max-width: 400px; 
              height: auto;
              border: 1px solid #ddd;
              padding: 20px;
            }
            .code-text {
              margin-top: 10px;
              font-size: 14px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="qr-print">
            <img src="${imageData}" alt="QR Code" />
            <div class="code-text">${code}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  } catch (error) {
    console.error("Error printing QR code:", error);
  }
};

const downloadBarcode = () => {
  try {
    const code = props.variant?.productColorCode || "";
    const svgElement = barcodeSvg.value;
    if (!svgElement || !code) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barcode_${code}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading barcode:", error);
  }
};

const downloadQRCode = () => {
  try {
    const code = props.variant?.productColorCode || "";
    const canvas = qrcodeCanvas.value;
    if (!canvas || !code) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `qrcode_${code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading QR code:", error);
  }
};

const copyToClipboard = async (type) => {
  try {
    const code = props.variant?.productColorCode || "";
    if (!code) return;

    if (type === "barcode") {
      const canvas = document.createElement("canvas");
      const svgElement = barcodeSvg.value;
      if (!svgElement) return;

      const svgString = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
        });
      };
      img.src =
        "data:image/svg+xml;base64," +
        btoa(unescape(encodeURIComponent(svgString)));
    } else if (type === "qrcode") {
      const canvas = qrcodeCanvas.value;
      if (!canvas) return;

      canvas.toBlob((blob) => {
        navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
      });
    }
  } catch (error) {
    console.error("Error copying to clipboard:", error);
  }
};

const onFileChange = (event) => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  const allowedCount = remainingSlots.value;

  if (allowedCount <= 0) {
    event.target.value = "";
    return;
  }

  const acceptedFiles = files.slice(0, allowedCount);
  newFiles.value = [...newFiles.value, ...acceptedFiles];
  event.target.value = "";
};

const removeNewFile = (index) => {
  newFiles.value.splice(index, 1);
};

const submit = () => {
  if (totalImagesCount.value > 5) return;

  emit("submit", {
    form: { ...form.value },
    files: [...newFiles.value],
  });
};

const handleClose = () => {
  localOpen.value = false;
  newFiles.value = [];
};

const selectedColor = computed(() => {
  return props.colors.find(
    (color) => Number(color.colorID) === Number(form.value.colorID),
  );
});

const selectedSize = computed(() => {
  return props.sizes.find(
    (size) => Number(size.sizeID) === Number(form.value.sizeID),
  );
});

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN").format(Number(price) || 0);
};
</script>

<style scoped>
.existing-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-card {
  width: 120px;
}

.dialog-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: #fff;
}

.image-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.upload-box {
  padding: 14px;
  border: 1px dashed #bbb;
  border-radius: 10px;
  background: #fafafa;
}

.new-files-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preview-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f1f1f1;
  font-size: 13px;
}

.color-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.color-list-item :deep(.v-list-item__prepend) {
  margin-inline-end: 0;
}

.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid #cfcfcf;
  display: inline-block;
  flex-shrink: 0;
}

.color-swatch-large {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid #cfcfcf;
  display: inline-block;
  flex-shrink: 0;
}

.color-item-content {
  display: flex;
  align-items: center;
  gap: 0;
  width: 100%;
}

.color-item-content .ml-2 {
  margin-left: 12px;
}

/* Variant Preview Section */
.variant-preview-section {
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  border-radius: 12px;
  border-left: 4px solid #1976d2;
}

.variant-preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #1976d2;
}

.variant-preview-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.preview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
}

.preview-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.color-preview-dot {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid #999;
  flex-shrink: 0;
}

/* Code Section Styles */
.code-container {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
}

.code-label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.barcode-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
  padding: 12px;
  border-radius: 8px;
  min-height: 140px;
  border: 1px solid #e0e0e0;
}

.qrcode-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
  padding: 12px;
  border-radius: 8px;
  min-height: 240px;
  border: 1px solid #e0e0e0;
}

.code-wrapper canvas {
  max-width: 100%;
  height: auto;
}

.code-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.code-actions .v-btn {
  white-space: nowrap;
}

@media (max-width: 960px) {
  .code-container {
    margin-bottom: 12px;
  }
}
</style>