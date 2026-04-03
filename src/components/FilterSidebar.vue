<template>
  <v-card class="filter-sidebar" variant="outlined">
    <!-- Filter Title & Reset Button -->
    <v-card-title class="d-flex justify-space-between align-center pb-2">
      <span>Bộ lọc sản phẩm</span>
      <v-btn
        size="x-small"
        variant="text"
        color="primary"
        @click="resetFilters"
      >
        Reset
      </v-btn>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-4">
      <!-- Price Range Filter -->
      <div class="filter-section mb-6">
        <h4 class="text-subtitle-2 font-weight-bold mb-3">Khoảng giá</h4>
        <v-range-slider
          v-model="filters.priceRange"
          :min="0"
          :max="100000000"
          :step="50000"
          label="Giá"
          class="mb-3"
          @update:model-value="applyFilters"
        />
        <div class="text-caption text-grey d-flex justify-space-between">
          <span>{{ formatPrice(filters.priceRange[0]) }}đ</span>
          <span>{{ formatPrice(filters.priceRange[1]) }}đ</span>
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- Brand Filter -->
      <div class="filter-section mb-6">
        <h4 class="text-subtitle-2 font-weight-bold mb-3">Thương hiệu</h4>
        <v-autocomplete
          v-model="filters.selectedBrands"
          :items="brands"
          item-title="label"
          item-value="value"
          multiple
          chips
          clearable
          placeholder="Chọn thương hiệu"
          @update:model-value="applyFilters"
          :loading="loadingBrands"
        />
      </div>

      <v-divider class="my-4" />

      <!-- Color Filter -->
      <div class="filter-section mb-6">
        <h4 class="text-subtitle-2 font-weight-bold mb-3">Màu sắc</h4>
        <div class="color-filter d-flex gap-2 flex-wrap">
          <button
            v-for="color in colors"
            :key="color.value"
            :title="color.label"
            class="color-circle"
            :class="{ active: filters.selectedColors.includes(color.value) }"
            :style="{ backgroundColor: color.colorCode }"
            @click="toggleColorFilter(color.value)"
          />
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- Material Filter -->
      <div class="filter-section mb-6">
        <h4 class="text-subtitle-2 font-weight-bold mb-3">Chất liệu</h4>
        <div class="material-filter">
          <v-checkbox
            v-for="material in materials"
            :key="material.value"
            v-model="filters.selectedMaterials"
            :label="material.label"
            :value="material.value"
            @update:model-value="applyFilters"
          />
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- Size Filter -->
      <div class="filter-section mb-6">
        <h4 class="text-subtitle-2 font-weight-bold mb-3">Kích cỡ</h4>
        <div class="size-filter">
          <v-checkbox
            v-for="size in sizes"
            :key="size.value"
            v-model="filters.selectedSizes"
            :label="size.label"
            :value="size.value"
            @update:model-value="applyFilters"
          />
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- Rating Filter -->
      <!-- <div class="filter-section mb-4">
        <h4 class="text-subtitle-2 font-weight-bold mb-3">Đánh giá</h4>
        <div class="rating-filter">
          <v-checkbox
            v-for="star in [5, 4, 3, 2, 1]"
            :key="star"
            v-model="filters.selectedRatings"
            @update:model-value="applyFilters"
          >
            <template #label>
              <div class="d-flex align-center gap-1">
                <span>{{ star }}</span>
                <v-rating
                  :model-value="star"
                  :length="5"
                  readonly
                  size="x-small"
                  active-color="amber"
                />
              </div>
            </template>
            <template #prepend>
              <input
                type="checkbox"
                style="cursor: pointer"
                :checked="filters.selectedRatings.includes(star)"
              />
            </template>
          </v-checkbox>
        </div>
      </div> -->
    </v-card-text>

    <!-- Apply Button -->
    <v-divider />
    <v-card-actions>
      <v-btn color="primary" variant="flat" block @click="applyFilters">
        Áp dụng bộ lọc
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import brandApi from "@/api/brandApi";
import colorApi from "@/api/colorApi";
import materialApi from "@/api/materialApi";
import sizeApi from "@/api/sizeApi";

const emit = defineEmits(["filter-changed"]);

const brands = ref([]);
const colors = ref([]);
const materials = ref([]);
const sizes = ref([]);

const loadingBrands = ref(false);

const filters = ref({
  priceRange: [0, 100000000],
  selectedBrands: [],
  selectedColors: [],
  selectedMaterials: [],
  selectedSizes: [],
  selectedRatings: [],
});

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN").format(price);
};

const toggleColorFilter = (colorId) => {
  const index = filters.value.selectedColors.indexOf(colorId);
  if (index > -1) {
    filters.value.selectedColors.splice(index, 1);
  } else {
    filters.value.selectedColors.push(colorId);
  }
  applyFilters();
};

const applyFilters = () => {
  emit("filter-changed", {
    priceRange: filters.value.priceRange,
    brands: filters.value.selectedBrands,
    colors: filters.value.selectedColors,
    materials: filters.value.selectedMaterials,
    sizes: filters.value.selectedSizes,
    ratings: filters.value.selectedRatings,
  });
};

const resetFilters = () => {
  filters.value = {
    priceRange: [0, 10000000],
    selectedBrands: [],
    selectedColors: [],
    selectedMaterials: [],
    selectedSizes: [],
    selectedRatings: [],
  };
  applyFilters();
};

const loadFilterData = async () => {
  try {
    loadingBrands.value = true;
    const [brandRes, colorRes, materialRes, sizeRes] = await Promise.all([
      brandApi.getAll(),
      colorApi.getAll(),
      materialApi.getAll(),
      sizeApi.getAll(),
    ]);

    brands.value = (brandRes.data || []).map((b) => ({
      ...b,
      value: Number(b.brandID ?? b.id),
      label: b.name ?? b.brandName,
    }));

    colors.value = (colorRes.data || []).map((c) => ({
      ...c,
      value: Number(c.colorID ?? c.id),
      label: c.colorName,
    }));

    materials.value = (materialRes.data || []).map((m) => ({
      ...m,
      value: Number(m.materialID ?? m.id),
      label: m.materialName ?? m.name,
    }));

    sizes.value = (sizeRes.data || []).map((s) => ({
      ...s,
      value: Number(s.sizeID ?? s.id),
      label: s.sizeName,
    }));
  } catch (error) {
    console.error("Lỗi tải dữ liệu bộ lọc:", error);
  } finally {
    loadingBrands.value = false;
  }
};

onMounted(loadFilterData);
</script>

<style scoped>
.filter-sidebar {
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  border-radius: 16px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
}

.filter-section {
  margin-bottom: 1.5rem;
}

.filter-section h4 {
  font-size: 14px;
  color: #5f4b32;
  letter-spacing: 0.2px;
}

.color-filter {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.color-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid rgba(205, 186, 150, 0.35);
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-circle:hover {
  border-color: #cdba96;
  box-shadow: 0 0 10px rgba(205, 186, 150, 0.35);
  transform: scale(1.08);
}

.color-circle.active {
  border-color: #b8955c;
  box-shadow: 0 0 0 3px rgba(205, 186, 150, 0.25);
  transform: scale(1.1);
}

.material-filter .v-checkbox,
.size-filter .v-checkbox,
.rating-filter .v-checkbox {
  margin-bottom: 4px;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(205, 186, 150, 0.08);
}

::-webkit-scrollbar-thumb {
  background: rgba(205, 186, 150, 0.35);
  border-radius: 3px;
}
</style>
