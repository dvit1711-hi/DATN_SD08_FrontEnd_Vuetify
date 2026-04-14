<template>
  <div>
    <!-- Nút mở bộ lọc -->
    <v-btn
      variant="outlined"
      class="filter-open-btn"
      @click="open = true"
    >
      Bộ lọc
      <v-icon end>mdi-tune-variant</v-icon>
    </v-btn>

    <v-navigation-drawer
      v-model="open"
      location="right"
      temporary
      width="420"
      class="filter-drawer"
    >
      <div class="filter-panel">
        <div class="filter-header">
          <div class="text-h6 font-weight-bold">Bộ lọc</div>
          <v-btn icon="mdi-close" variant="text" @click="open = false" />
        </div>

        <v-divider />

        <div class="filter-body">
          <!-- Màu sắc -->
          <div class="filter-group">
            <button class="filter-group-title" @click="toggleSection('colors')">
              <span>Màu sắc</span>
              <v-icon>
                {{ expanded.colors ? "mdi-chevron-up" : "mdi-chevron-down" }}
              </v-icon>
            </button>

            <div v-show="expanded.colors" class="filter-group-content">
              <div class="color-grid">
                <button
                  v-for="color in colors"
                  :key="color.value"
                  class="color-circle"
                  :class="{ active: localFilters.selectedColors.includes(color.value) }"
                  :style="{ backgroundColor: color.colorCode || '#ddd' }"
                  :title="color.label"
                  @click="toggleColor(color.value)"
                />
              </div>
            </div>
          </div>

          <v-divider class="my-4" />

          <!-- Thương hiệu -->
          <div class="filter-group">
            <button class="filter-group-title" @click="toggleSection('brands')">
              <span>Thương hiệu</span>
              <v-icon>
                {{ expanded.brands ? "mdi-chevron-up" : "mdi-chevron-down" }}
              </v-icon>
            </button>

            <div v-show="expanded.brands" class="filter-group-content">
              <div class="chip-list">
                <button
                  v-for="brand in brands"
                  :key="brand.value"
                  class="filter-chip"
                  :class="{ active: localFilters.selectedBrands.includes(brand.value) }"
                  @click="toggleArrayValue(localFilters.selectedBrands, brand.value)"
                >
                  {{ brand.label }}
                </button>
              </div>
            </div>
          </div>

          <v-divider class="my-4" />

          <!-- Chất liệu -->
          <div class="filter-group">
            <button class="filter-group-title" @click="toggleSection('materials')">
              <span>Chất liệu</span>
              <v-icon>
                {{ expanded.materials ? "mdi-chevron-up" : "mdi-chevron-down" }}
              </v-icon>
            </button>

            <div v-show="expanded.materials" class="filter-group-content">
              <div class="chip-list">
                <button
                  v-for="material in materials"
                  :key="material.value"
                  class="filter-chip"
                  :class="{ active: localFilters.selectedMaterials.includes(material.value) }"
                  @click="toggleArrayValue(localFilters.selectedMaterials, material.value)"
                >
                  {{ material.label }}
                </button>
              </div>
            </div>
          </div>

          <v-divider class="my-4" />

          <!-- Kích thước -->
          <div class="filter-group">
            <button class="filter-group-title" @click="toggleSection('sizes')">
              <span>Kích thước</span>
              <v-icon>
                {{ expanded.sizes ? "mdi-chevron-up" : "mdi-chevron-down" }}
              </v-icon>
            </button>

            <div v-show="expanded.sizes" class="filter-group-content">
              <div class="chip-list">
                <button
                  v-for="size in sizes"
                  :key="size.value"
                  class="filter-chip"
                  :class="{ active: localFilters.selectedSizes.includes(size.value) }"
                  @click="toggleArrayValue(localFilters.selectedSizes, size.value)"
                >
                  {{ size.label }}
                </button>
              </div>
            </div>
          </div>

          <v-divider class="my-4" />

          <!-- Giá -->
          <div class="filter-group">
            <button class="filter-group-title" @click="toggleSection('prices')">
              <span>Giá</span>
              <v-icon>
                {{ expanded.prices ? "mdi-chevron-up" : "mdi-chevron-down" }}
              </v-icon>
            </button>

            <div v-show="expanded.prices" class="filter-group-content">
              <div class="price-list">
                <label
                  v-for="option in priceOptions"
                  :key="option.value"
                  class="price-option"
                >
                  <input
                    type="checkbox"
                    :checked="localFilters.selectedPriceKeys.includes(option.value)"
                    @change="toggleArrayValue(localFilters.selectedPriceKeys, option.value)"
                  />
                  <span>{{ option.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="selected-filters">
          <button class="clear-btn" @click="resetFilters">
            Xóa lọc
            <v-icon size="16">mdi-refresh</v-icon>
          </button>

          <div class="selected-chip-list">
            <span
              v-for="chip in selectedFilterChips"
              :key="chip.key"
              class="selected-chip"
            >
              {{ chip.label }}
              <button class="selected-chip-close" @click="removeChip(chip)">
                ×
              </button>
            </span>
          </div>
        </div>

        <div class="filter-footer">
          <v-btn
            color="black"
            block
            size="large"
            class="view-result-btn"
            @click="applyFilters"
          >
            Xem {{ resultCount }} sản phẩm
          </v-btn>
        </div>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import brandApi from "@/api/brandApi";
import colorApi from "@/api/colorApi";
import materialApi from "@/api/materialApi";
import sizeApi from "@/api/sizeApi";

const props = defineProps({
  resultCount: {
    type: Number,
    default: 0,
  },
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "apply"]);

const open = ref(false);

const brands = ref([]);
const colors = ref([]);
const materials = ref([]);
const sizes = ref([]);

const expanded = ref({
  colors: true,
  brands: true,
  materials: true,
  sizes: false,
  prices: true,
});

const priceOptions = [
  { value: "under1m", label: "Dưới 1,000,000đ", min: 0, max: 1000000 },
  { value: "1m-2m", label: "1,000,000đ - 2,000,000đ", min: 1000000, max: 2000000 },
  { value: "2m-3m", label: "2,000,000đ - 3,000,000đ", min: 2000000, max: 3000000 },
  { value: "above3m", label: "Trên 3,000,000đ", min: 3000000, max: 10000000 },
];

const defaultFilters = () => ({
  selectedBrands: [],
  selectedColors: [],
  selectedMaterials: [],
  selectedSizes: [],
  selectedPriceKeys: [],
});

const localFilters = ref(defaultFilters());

watch(
  () => props.modelValue,
  (val) => {
    localFilters.value = {
      selectedBrands: [...(val.selectedBrands || [])],
      selectedColors: [...(val.selectedColors || [])],
      selectedMaterials: [...(val.selectedMaterials || [])],
      selectedSizes: [...(val.selectedSizes || [])],
      selectedPriceKeys: [...(val.selectedPriceKeys || [])],
    };
  },
  { immediate: true, deep: true }
);

const toggleSection = (key) => {
  expanded.value[key] = !expanded.value[key];
};

const toggleArrayValue = (arr, value) => {
  const idx = arr.indexOf(value);
  if (idx > -1) arr.splice(idx, 1);
  else arr.push(value);
};

const toggleColor = (value) => {
  toggleArrayValue(localFilters.value.selectedColors, value);
};

const selectedFilterChips = computed(() => {
  const chips = [];

  brands.value.forEach((item) => {
    if (localFilters.value.selectedBrands.includes(item.value)) {
      chips.push({ type: "brand", value: item.value, label: item.label, key: `brand-${item.value}` });
    }
  });

  colors.value.forEach((item) => {
    if (localFilters.value.selectedColors.includes(item.value)) {
      chips.push({ type: "color", value: item.value, label: item.label, key: `color-${item.value}` });
    }
  });

  materials.value.forEach((item) => {
    if (localFilters.value.selectedMaterials.includes(item.value)) {
      chips.push({ type: "material", value: item.value, label: item.label, key: `material-${item.value}` });
    }
  });

  sizes.value.forEach((item) => {
    if (localFilters.value.selectedSizes.includes(item.value)) {
      chips.push({ type: "size", value: item.value, label: item.label, key: `size-${item.value}` });
    }
  });

  priceOptions.forEach((item) => {
    if (localFilters.value.selectedPriceKeys.includes(item.value)) {
      chips.push({ type: "price", value: item.value, label: item.label, key: `price-${item.value}` });
    }
  });

  return chips;
});

const removeChip = (chip) => {
  if (chip.type === "brand") {
    localFilters.value.selectedBrands = localFilters.value.selectedBrands.filter((v) => v !== chip.value);
  }
  if (chip.type === "color") {
    localFilters.value.selectedColors = localFilters.value.selectedColors.filter((v) => v !== chip.value);
  }
  if (chip.type === "material") {
    localFilters.value.selectedMaterials = localFilters.value.selectedMaterials.filter((v) => v !== chip.value);
  }
  if (chip.type === "size") {
    localFilters.value.selectedSizes = localFilters.value.selectedSizes.filter((v) => v !== chip.value);
  }
  if (chip.type === "price") {
    localFilters.value.selectedPriceKeys = localFilters.value.selectedPriceKeys.filter((v) => v !== chip.value);
  }
};

const resetFilters = () => {
  localFilters.value = defaultFilters();
};

const applyFilters = () => {
  emit("update:modelValue", { ...localFilters.value });
  emit("apply", { ...localFilters.value });
  open.value = false;
};

const loadFilterData = async () => {
  const [brandRes, colorRes, materialRes, sizeRes] = await Promise.all([
    brandApi.getAllActive(),
    colorApi.getAllActive(),
    materialApi.getAllActive(),
    sizeApi.getAllActive(),
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
};

onMounted(loadFilterData);
</script>

<style scoped>
.filter-open-btn {
  min-width: 120px;
  text-transform: none;
}

.filter-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 12px;
}

.filter-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px 20px;
}

.filter-group-title {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
  border: none;
  font-size: 16px;
  font-weight: 700;
  padding: 0;
  cursor: pointer;
}

.filter-group-content {
  padding-top: 14px;
}

.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.color-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid #ddd;
  cursor: pointer;
}

.color-circle.active {
  box-shadow: 0 0 0 3px #111 inset;
}

.chip-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-chip {
  min-height: 40px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
  font-weight: 500;
}

.filter-chip.active {
  background: #000;
  color: #fff;
  border-color: #000;
}

.price-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.price-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.selected-filters {
  padding: 16px 20px 10px;
  border-top: 1px solid #eee;
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  margin-bottom: 12px;
}

.selected-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.selected-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: #000;
  color: #fff;
  font-size: 14px;
}

.selected-chip-close {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.filter-footer {
  padding: 16px 20px 20px;
  border-top: 1px solid #eee;
  background: #fff;
}

.view-result-btn {
  text-transform: none;
  font-weight: 700;
}
</style>