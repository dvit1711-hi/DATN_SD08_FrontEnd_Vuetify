<template>
  <section class="product-detail-tabs">
    <div class="product-detail-tabs__nav">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="product-detail-tabs__btn"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="product-detail-tabs__content">
      <!-- THÔNG TIN SẢN PHẨM -->
      <div v-if="activeTab === 'info'" class="product-detail-tabs__panel">
        <h3 class="product-detail-tabs__title">Thông tin sản phẩm</h3>

        <ul class="product-detail-tabs__list">
          <li><strong>Tên sản phẩm:</strong> {{ product?.productName || "Đang cập nhật" }}</li>
          <li><strong>Thương hiệu:</strong> {{ product?.brandName || "Đang cập nhật" }}</li>
          <li><strong>Chất liệu:</strong> {{ product?.materialName || "Đang cập nhật" }}</li>
          <li><strong>Giới tính:</strong> {{ product?.gender || "Unisex" }}</li>
          <li>
            <strong>Màu sắc:</strong>
            {{ selectedVariant?.colorName || product?.colorName || "Đang cập nhật" }}
          </li>
          <li>
            <strong>Kích thước:</strong>
            {{ selectedVariant?.sizeName || "Đang cập nhật" }}
          </li>
          <li>
            <strong>Xu hướng theo mùa:</strong>
            {{ product?.seasonTrend || "Sử dụng được tất cả các mùa trong năm" }}
          </li>
          <li>
            <strong>Phù hợp sử dụng:</strong>
            {{ product?.occasions || "Đi chơi, hoạt động ngoài trời, tập luyện" }}
          </li>
        </ul>

        <div class="product-detail-tabs__desc" v-if="product?.description">
          <h4>Mô tả</h4>
          <p>{{ product.description }}</p>
        </div>
      </div>

      <!-- HƯỚNG DẪN BẢO QUẢN -->
      <div v-else-if="activeTab === 'care'" class="product-detail-tabs__panel">
        <h3 class="product-detail-tabs__title">Hướng dẫn bảo quản</h3>

        <ul class="product-detail-tabs__list">
          <li>Vệ sinh bằng khăn ẩm mềm.</li>
          <li>Không sử dụng chất tẩy rửa mạnh lên bề mặt sản phẩm.</li>
          <li>Bảo quản sản phẩm nơi khô ráo, thoáng mát.</li>
          <li>Tránh phơi trực tiếp dưới nắng gắt trong thời gian dài.</li>
          <li>Không gấp ép mạnh làm mất form nón.</li>
          <li>Xem thêm hướng dẫn chi tiết trên tag sản phẩm nếu có.</li>
        </ul>
      </div>

      <!-- CHÍNH SÁCH ĐỔI TRẢ -->
      <div v-else-if="activeTab === 'return'" class="product-detail-tabs__panel">
        <h3 class="product-detail-tabs__title">Chính sách đổi trả</h3>

        <ul class="product-detail-tabs__list">
          <li>Hỗ trợ đổi sản phẩm nếu còn mới và chưa qua sử dụng.</li>
          <li>Sản phẩm đổi trả cần còn tem, nhãn và phụ kiện đi kèm.</li>
          <li>Không áp dụng đổi trả với sản phẩm hư hỏng do người dùng.</li>
          <li>Khuyến khích giữ lại hóa đơn hoặc thông tin đơn hàng để đối chiếu.</li>
          <li>Thời gian xử lý đổi trả tùy theo chính sách cửa hàng của bạn.</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  product: {
    type: Object,
    default: () => ({}),
  },
  selectedVariant: {
    type: Object,
    default: () => null,
  },
});

const activeTab = ref("info");

const tabs = [
  { label: "THÔNG TIN SẢN PHẨM", value: "info" },
  { label: "HƯỚNG DẪN BẢO QUẢN", value: "care" },
  { label: "CHÍNH SÁCH ĐỔI TRẢ", value: "return" },
];
</script>

<style scoped src="@/assets/css/product-detail-tabs.css"></style>