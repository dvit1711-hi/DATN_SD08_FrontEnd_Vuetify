<template>
  <v-dialog v-model="localOpen" max-width="600" persistent>
    <v-card class="rounded-xl">
      <!-- Header -->
      <v-card-title class="pa-5 pb-3 d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <v-icon color="primary">mdi-image-multiple</v-icon>
          <span class="text-subtitle-1 font-weight-bold">Chọn ảnh biến thể</span>
        </div>
        <v-chip size="small" :color="images.length >= MAX ? 'error' : 'primary'" variant="tonal">
          {{ images.length }} / {{ MAX }}
        </v-chip>
      </v-card-title>
      <v-divider />

      <v-card-text class="pa-5">
        <!-- Upload zone -->
        <div
          class="upload-zone"
          :class="{
            'upload-zone--active': isDragging,
            'upload-zone--full':   images.length >= MAX,
          }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDrop"
          @click="images.length < MAX && $refs.fileInput.click()"
        >
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*"
            class="d-none"
            @change="onFileInputChange"
          />

          <div v-if="images.length >= MAX" class="upload-zone-content text-grey">
            <v-icon size="36" color="grey-lighten-1">mdi-image-off</v-icon>
            <p class="text-body-2 mt-2">Đã đạt giới hạn {{ MAX }} ảnh</p>
          </div>
          <div v-else class="upload-zone-content">
            <v-icon size="36" :color="isDragging ? 'primary' : 'grey-lighten-1'">
              mdi-cloud-upload-outline
            </v-icon>
            <p class="text-body-2 mt-2 font-weight-medium" :class="isDragging ? 'text-primary' : 'text-grey'">
              {{ isDragging ? 'Thả ảnh vào đây' : 'Nhấn hoặc kéo thả ảnh vào đây' }}
            </p>
            <p class="text-caption text-grey">
              PNG, JPG, WEBP · Tối đa {{ MAX }} ảnh · Còn {{ MAX - images.length }} slot
            </p>
          </div>
        </div>

        <!-- Preview grid -->
        <div v-if="images.length" class="mt-5">
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-body-2 font-weight-medium">Ảnh đã chọn</span>
            <v-btn
              size="x-small"
              color="error"
              variant="tonal"
              prepend-icon="mdi-delete-sweep"
              @click="clearAll"
            >
              Xóa tất cả
            </v-btn>
          </div>

          <div class="image-grid">
            <div
              v-for="(img, idx) in images"
              :key="img.id"
              class="image-item"
              :class="{ 'image-item--main': img.isMain }"
            >
              <!-- Preview -->
              <div class="image-thumb-wrapper">
                <img :src="img.preview" class="image-thumb" />

                <!-- Main badge -->
                <div v-if="img.isMain" class="main-badge">
                  <v-icon size="10" color="white">mdi-star</v-icon>
                  <span>Chính</span>
                </div>

                <!-- Overlay actions -->
                <div class="image-overlay">
                  <v-btn
                    v-if="!img.isMain"
                    icon
                    size="x-small"
                    color="white"
                    variant="flat"
                    class="overlay-btn"
                    title="Đặt làm ảnh chính"
                    @click="setMain(idx)"
                  >
                    <v-icon size="14" color="warning">mdi-star</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="x-small"
                    color="white"
                    variant="flat"
                    class="overlay-btn"
                    title="Xóa ảnh"
                    @click="removeImage(idx)"
                  >
                    <v-icon size="14" color="error">mdi-delete</v-icon>
                  </v-btn>
                </div>
              </div>

              <!-- Filename -->
              <p class="image-name text-caption text-grey text-truncate mt-1">
                {{ img.file.name }}
              </p>
            </div>

            <!-- Add more slot (nếu còn chỗ) -->
            <div
              v-if="images.length < MAX"
              class="image-item image-item--add"
              @click="$refs.fileInput.click()"
            >
              <div class="image-thumb-wrapper add-slot">
                <v-icon size="28" color="grey-lighten-1">mdi-plus</v-icon>
                <span class="text-caption text-grey mt-1">Thêm ảnh</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Info -->
        <v-alert
          v-if="images.length"
          type="info"
          variant="tonal"
          density="compact"
          class="mt-4"
          text="Nhấn ⭐ trên ảnh để đặt làm ảnh chính. Ảnh chính hiển thị đầu tiên trong danh sách."
        />
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 justify-end gap-3">
        <v-btn variant="text" @click="handleCancel">Hủy</v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-check"
          :disabled="images.length === 0"
          @click="handleConfirm"
        >
          Xác nhận ({{ images.length }} ảnh)
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// ─── Props & Emits ────────────────────────────────────────
const props = defineProps({
  open:        { type: Boolean, default: false },
  // Truyền vào ảnh đã có sẵn (khi mở lại dialog)
  initialFiles: { type: Array, default: () => [] },
  maxImages:   { type: Number, default: 5 },
})

const emit = defineEmits(['update:open', 'confirm', 'cancel'])

// ─── Constants ────────────────────────────────────────────
const MAX = computed(() => props.maxImages)

// ─── State ────────────────────────────────────────────────
const localOpen  = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const isDragging = ref(false)
const fileInput  = ref(null)

// images: [{ id, file, preview, isMain }]
const images = ref([])

let _idCounter = 0
const makeId = () => `img_${++_idCounter}_${Date.now()}`

// ─── Sync initialFiles khi dialog mở ─────────────────────
watch(
  () => props.open,
  (opened) => {
    if (!opened) return
    // Load lại từ initialFiles
    images.value = props.initialFiles.map((f, i) => ({
      id:     makeId(),
      file:   f.file,
      preview: f.preview ?? URL.createObjectURL(f.file),
      isMain: f.isMain ?? i === 0,
    }))
    // Đảm bảo có đúng 1 ảnh main
    ensureOneMain()
  },
)

// ─── Helpers ──────────────────────────────────────────────
const ensureOneMain = () => {
  if (!images.value.length) return
  const hasMain = images.value.some(i => i.isMain)
  if (!hasMain) images.value[0].isMain = true
}

const addFiles = (fileList) => {
  const remaining = MAX.value - images.value.length
  if (remaining <= 0) return

  const accepted = Array.from(fileList)
    .filter(f => f.type.startsWith('image/'))
    .slice(0, remaining)

  for (const file of accepted) {
    images.value.push({
      id:      makeId(),
      file,
      preview: URL.createObjectURL(file),
      isMain:  images.value.length === 0, // đầu tiên = main
    })
  }
}

// ─── Handlers ─────────────────────────────────────────────
const onFileInputChange = (e) => {
  addFiles(e.target.files)
  e.target.value = ''
}

const onDrop = (e) => {
  isDragging.value = false
  addFiles(e.dataTransfer.files)
}

const setMain = (idx) => {
  images.value.forEach((img, i) => { img.isMain = i === idx })
}

const removeImage = (idx) => {
  const wasMain = images.value[idx].isMain
  URL.revokeObjectURL(images.value[idx].preview)
  images.value.splice(idx, 1)
  if (wasMain) ensureOneMain()
}

const clearAll = () => {
  images.value.forEach(img => URL.revokeObjectURL(img.preview))
  images.value = []
}

const handleCancel = () => {
  emit('cancel')
  localOpen.value = false
}

const handleConfirm = () => {
  // Emit danh sách { file, preview, isMain } đã sắp xếp: ảnh chính lên đầu
  const sorted = [
    ...images.value.filter(i => i.isMain),
    ...images.value.filter(i => !i.isMain),
  ]
  emit('confirm', sorted.map(i => ({
    file:    i.file,
    preview: i.preview,
    isMain:  i.isMain,
  })))
  localOpen.value = false
}
</script>

<style scoped>
/* ── Upload zone ── */
.upload-zone {
  border: 2px dashed #ccc;
  border-radius: 12px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-zone:hover:not(.upload-zone--full) {
  border-color: #1976d2;
  background: #e3f2fd;
}

.upload-zone--active {
  border-color: #1976d2 !important;
  background:   #e3f2fd !important;
}

.upload-zone--full {
  cursor: not-allowed;
  opacity: 0.6;
}

.upload-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  text-align: center;
}

/* ── Image grid ── */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.image-item {
  display: flex;
  flex-direction: column;
}

.image-thumb-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
  background: #f5f5f5;
}

.image-item--main .image-thumb-wrapper {
  border-color: #f9a825;
  box-shadow: 0 0 0 2px #f9a82540;
}

.image-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Main badge */
.main-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  background: #f9a825;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 2px;
}

/* Overlay */
.image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 8px;
}

.image-thumb-wrapper:hover .image-overlay {
  opacity: 1;
}

.overlay-btn {
  width: 28px !important;
  height: 28px !important;
}

/* Filename */
.image-name {
  max-width: 100%;
  display: block;
  line-height: 1.2;
}

/* Add slot */
.image-item--add .image-thumb-wrapper {
  border-style: dashed;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.add-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-slot:hover {
  border-color: #1976d2;
  background: #e3f2fd;
}
</style>