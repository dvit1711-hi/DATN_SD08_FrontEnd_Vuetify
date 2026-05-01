import { createI18n } from 'vue-i18n'

const savedLanguage = localStorage.getItem('language') || 'vi'

const messages = {
  vi: {
    common: {
      language: 'Ngôn ngữ',
      vietnamese: 'Tiếng Việt',
      english: 'English',
      light: 'Sáng',
      dark: 'Tối',
      theme: 'Giao diện',

      home: 'Trang Chủ',
      products: 'Sản Phẩm',
      category: 'Danh Mục',
      review: 'Đánh giá',
      purchaseHistory: 'Lịch sử mua hàng',
      promotion: 'Khuyến Mãi & Mã Giảm Giá',
      search: 'Tìm kiếm',

      cart: 'Giỏ Hàng',
      login: 'Đăng Nhập',
      register: 'Đăng Ký',
      logout: 'Đăng Xuất',
      setting: 'Cài đặt',
      accountSecurity: 'Bảo mật Tài khoản',
      accountSetting: 'Cài đặt Tài khoản',

      sellerChannel: 'Kênh Người Bán',
      staffChannel: 'Kênh Nhân Viên',
      staffSaleChannel: 'Kênh nhân viên bán hàng',

      hello: 'Xin chào',
      admin: 'Admin',
      staff: 'Staff',

      newOrder: 'Đơn hàng mới',
      newOrderCount: '2 đơn',
      outOfStockProduct: 'Sản phẩm hết hàng',
      outOfStockCount: '1 sản phẩm',
      viewAll: 'Xem tất cả',

      adminHome: 'Home',
      productList: 'Danh sách sản phẩm',
      accountList: 'Danh sách tài khoản',
      discountManager: 'Discount Manager',
      discountProduct: 'Giảm giá biến thể màu',
      statistics: 'Thống kê',
      paymentConfirm: 'Xác nhận thanh toán',
      brandMaterial: 'Brand & Material',
      colorSize: 'Color & Size',
      posSale: 'Bán hàng tại quầy',
      staffReport: 'Báo cáo nhân viên',
      myReport: 'Báo cáo của tôi',
      backToStore: 'Quay về cửa hàng',
    },
  },

  en: {
    common: {
      language: 'Language',
      vietnamese: 'Vietnamese',
      english: 'English',
      light: 'Light',
      dark: 'Dark',
      theme: 'Theme',

      home: 'Home',
      products: 'Products',
      category: 'Category',
      review: 'Reviews',
      purchaseHistory: 'Purchase History',
      promotion: 'Promotions & Coupons',
      search: 'Search',

      cart: 'Cart',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      setting: 'Settings',
      accountSecurity: 'Account Security',
      accountSetting: 'Account Settings',

      sellerChannel: 'Seller Channel',
      staffChannel: 'Staff Channel',
      staffSaleChannel: 'Staff Sales Channel',

      hello: 'Hello',
      admin: 'Admin',
      staff: 'Staff',

      newOrder: 'New orders',
      newOrderCount: '2 orders',
      outOfStockProduct: 'Out of stock products',
      outOfStockCount: '1 product',
      viewAll: 'View all',

      adminHome: 'Home',
      productList: 'Product List',
      accountList: 'Account List',
      discountManager: 'Discount Manager',
      discountProduct: 'Variant Discount',
      statistics: 'Statistics',
      paymentConfirm: 'Payment Confirmation',
      brandMaterial: 'Brand & Material',
      colorSize: 'Color & Size',
      posSale: 'POS Sale',
      staffReport: 'Staff Report',
      myReport: 'My Report',
      backToStore: 'Back to Store',
    },
  },
}

const i18n = createI18n({
  legacy: false,
  locale: savedLanguage,
  fallbackLocale: 'vi',
  messages,
})

export default i18n