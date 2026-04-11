<template>
  <v-row class="mt-8">
    <v-col cols="12" md="3">
      <v-card class="sticky-card" elevation="0" border>
        <v-card-item>
          <div class="text-subtitle2 font-weight-bold mb-2">
            Tổng quan đánh giá
          </div>

          <div class="d-flex align-center gap-2 mb-2">
            <div class="text-h5 font-weight-bold">
              {{ averageRating.toFixed(1) }}
            </div>
            <v-rating
              :model-value="averageRating"
              readonly
              size="small"
              color="amber"
            />
          </div>

          <div class="text-caption text-grey mb-4">
            {{ totalReviews }} đánh giá
          </div>

          <div>
            <button
              class="star-filter-btn all-reviews-btn"
              :class="{ active: selectedStarFilter === null }"
              @click="selectedStarFilter = null"
            >
              <v-icon icon="mdi-check-all" size="small" class="mr-1" />
              Tất cả
            </button>

            <button
              v-for="star in [5, 4, 3, 2, 1]"
              :key="star"
              class="star-filter-btn"
              :class="{ active: selectedStarFilter === star }"
              @click="
                selectedStarFilter = selectedStarFilter === star ? null : star
              "
            >
              {{ star }} <v-icon icon="mdi-star" size="small" />
            </button>
          </div>
        </v-card-item>
      </v-card>
    </v-col>

    <v-col cols="12" md="9">
      <div v-if="reviews.length > 0" class="reviews-container">
        <div class="reviews-wrapper pa-6">
          <h2 class="text-h6 font-weight-bold mb-4">
            Đánh giá từ khách hàng
          </h2>

          <div class="reviews-list">
            <v-card
              v-for="review in paginatedReviews"
              :key="review.id"
              class="review-card mb-4"
              elevation="0"
              border
            >
              <v-card-item class="pa-4">
                <div class="d-flex gap-3">
                  <div class="review-avatar-wrapper">
                    <v-avatar size="48" class="review-avatar">
                      <v-img
                        :src="
                          review.userAvatar || getDefaultAvatar(review.username)
                        "
                        :alt="review.username"
                        cover
                      />
                    </v-avatar>
                  </div>

                  <div class="flex-grow-1">
                    <div class="d-flex align-center justify-space-between mb-2">
                      <div>
                        <div class="font-weight-bold text-body-1">
                          {{ review.username }}
                        </div>
                        <div class="text-caption text-grey">
                          {{ formatDate(review.createdAt) }}
                        </div>
                      </div>
                    </div>

                    <v-rating
                      :model-value="review.rating"
                      readonly
                      size="x-small"
                      color="amber"
                      class="mb-2"
                    />

                    <p class="text-body-2 mb-0 review-comment">
                      {{ review.comment }}
                    </p>
                  </div>
                </div>
              </v-card-item>
            </v-card>
          </div>

          <div class="d-flex justify-center mt-6">
            <v-pagination
              v-model="currentPage"
              :length="totalPages"
              :total-visible="5"
              color="primary"
              size="small"
            />
          </div>
        </div>
      </div>

      <div v-else class="reviews-wrapper pa-8 text-center">
        <v-icon icon="mdi-folder-open-outline" size="64" class="text-grey" />
        <p class="text-body-2 text-grey mt-4">Chưa có đánh giá nào</p>
      </div>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import reviewApi from "@/api/ReviewApi";

const props = defineProps({
  productId: {
    type: [Number, String],
    required: true,
  },
});

const reviews = ref([]);
const averageRating = ref(0);
const totalReviews = ref(0);
const selectedStarFilter = ref(null);
const currentPage = ref(1);
const itemsPerPage = 5;

watch(selectedStarFilter, () => {
  currentPage.value = 1;
});

watch(
  () => props.productId,
  async (newProductId) => {
    if (newProductId) {
      await loadReviews(newProductId);
    }
  },
  { immediate: true },
);

onMounted(async () => {
  if (props.productId) {
    await loadReviews(props.productId);
  }
});

const loadReviews = async (productId) => {
  try {
    const response = await reviewApi.getReviewsByProductId(productId);
    reviews.value = response.data || [];
    await loadRatingStats(productId);
  } catch (error) {
    console.error("Failed to load reviews:", error);
    reviews.value = [];
    averageRating.value = 0;
    totalReviews.value = 0;
  }
};

const loadRatingStats = async (productId) => {
  try {
    const avgResponse = await reviewApi.getAverageRatingForProduct(productId);
    const totalResponse = await reviewApi.getTotalReviewsForProduct(productId);

    averageRating.value = avgResponse.data || 0;
    totalReviews.value = totalResponse.data || 0;
  } catch (error) {
    console.error("Failed to load rating stats:", error);
  }
};

const filteredReviews = computed(() => {
  if (!selectedStarFilter.value) return reviews.value;
  return reviews.value.filter((r) => r.rating === selectedStarFilter.value);
});

const totalPages = computed(() => {
  return Math.ceil(filteredReviews.value.length / itemsPerPage) || 1;
});

const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredReviews.value.slice(start, end);
});

const getDefaultAvatar = (username) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=667eea&color=fff&bold=true`;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
</script>

<style scoped src="@/assets/css/product-reviews.css"></style>