<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// --- STATE ---
const isMobileMenuOpen = ref(false);
const isLoggedIn = ref(false);
const userName = ref("");
const userScope = ref("");

// --- DATA ---
const navLinks = [
  { name: "Về chúng tôi", href: "#" },
  { name: "Tính năng", href: "#" },
  { name: "Liên hệ", href: "#" },
  { name: "Hỗ trợ", href: "#" },
];

const features = [
  {
    title: "Tìm kiếm thông minh",
    description:
      "Hệ thống AI giúp kết nối chính xác giữa doanh nghiệp và ứng viên",
    iconPath:
      "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
    colorClass: "text-blue-600",
    bgClass: "bg-blue-100",
  },
  {
    title: "An toàn và bảo mật",
    description: "Dữ liệu của bạn sẽ được bảo mật hoàn toàn",
    iconPath:
      "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z",
    colorClass: "text-blue-600",
    bgClass: "bg-blue-100",
  },
  {
    title: "Phân tích chi tiết",
    description: "Báo cáo và thống kê giúp tối ưu hóa quá trình tuyển dụng",
    iconPath:
      "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    colorClass: "text-purple-600",
    bgClass: "bg-purple-100",
  },
];

// --- UTILS: PARSE JWT ---
// Hàm giải mã JWT để lấy thông tin user mà không cần gọi API
const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// --- LOGIC ---
onMounted(() => {
  const token = localStorage.getItem("token");
  if (token) {
    const decoded = parseJwt(token);
    if (decoded) {
      isLoggedIn.value = true;
      // Lấy tên: thường nằm ở claim 'unique_name', 'name' hoặc 'sub'
      // Lưu ý: Tùy config BE, key có thể là 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
      userName.value =
        decoded.unique_name || decoded.name || decoded.sub || "User";

      // Lấy Scope để điều hướng
      userScope.value = decoded.scope || localStorage.getItem("userScope");
    }
  }
});

const toggleMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const handleLogin = () => {
  router.push({ name: "Login" });
};

// Logic điều hướng khi click vào thẻ Doanh nghiệp hoặc Sinh viên
const handleRoleNavigation = () => {
  if (!isLoggedIn.value) {
    // Chưa đăng nhập -> Chuyển sang trang Login
    router.push({ name: "Login" });
  } else {
    // Đã đăng nhập -> Chuyển về Dashboard dựa theo Scope của user
    // Bất kể click vào "Doanh nghiệp" hay "Sinh viên", hệ thống sẽ đưa về đúng Dashboard của họ
    switch (userScope.value) {
      case "Company":
        router.push({ name: "CompanyDashboard" });
        break;
      case "Student":
        router.push({ name: "student_dashboard" });
        break;
      case "Admin":
        router.push({ name: "admin_dashboard" });
        break;
      default:
        // Scope lạ hoặc lỗi -> Về trang chủ hoặc thông báo
        console.warn("Unknown scope:", userScope.value);
        break;
    }
  }
};
</script>

<template>
  <div class="bg-gray-50 min-h-screen font-sans">
    <nav class="bg-white shadow-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div
            class="flex items-center space-x-2 cursor-pointer"
            @click="router.push({ name: 'Home' })"
          >
            <div
              class="transition-transform hover:scale-105"
            >
              <img
                src="/logo_connect_edu.png"
                alt="ConnectEdu Logo"
                class="w-16 h-16 object-contain"
              />
            </div>
            <span class="text-xl font-bold bg-gradient-to-r from-[#2563EB] to-[#4F46E5] bg-clip-text text-transparent">SURS</span>
          </div>

          <div class="hidden md:flex items-center space-x-8">
            <a
              v-for="(link, index) in navLinks"
              :key="index"
              :href="link.href"
              class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              {{ link.name }}
            </a>

            <div class="ml-4 pl-4 border-l border-gray-200">
              <template v-if="!isLoggedIn">
                <button
                  @click="handleLogin"
                  class="bg-blue-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-blue-500/30 flex items-center gap-2"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Đăng nhập
                </button>
              </template>
              <template v-else>
                <div
                  class="flex items-center gap-3 cursor-pointer"
                  @click="handleRoleNavigation"
                >
                  <div class="text-right hidden lg:block">
                    <p class="text-xs text-gray-500">Xin chào,</p>
                    <p
                      class="text-sm font-bold text-blue-600 max-w-[150px] truncate"
                    >
                      {{ userName }}
                    </p>
                  </div>
                  <div
                    class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm"
                  >
                    {{ userName.charAt(0).toUpperCase() }}
                  </div>
                </div>
              </template>
            </div>
          </div>

          <button
            @click="toggleMenu"
            class="md:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none"
          >
            <svg
              class="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                v-if="!isMobileMenuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform -translate-y-2 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-2 opacity-0"
      >
        <div
          v-show="isMobileMenuOpen"
          class="md:hidden border-t border-gray-100 bg-white shadow-lg absolute w-full z-40"
        >
          <div class="px-2 pt-2 pb-3 space-y-1">
            <a
              v-for="(link, index) in navLinks"
              :key="index"
              :href="link.href"
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              {{ link.name }}
            </a>

            <div class="border-t border-gray-100 mt-2 pt-2 px-3">
              <template v-if="!isLoggedIn">
                <button
                  @click="handleLogin"
                  class="w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Đăng nhập
                </button>
              </template>
              <template v-else>
                <div
                  class="flex items-center gap-3 py-2"
                  @click="handleRoleNavigation"
                >
                  <div
                    class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold"
                  >
                    {{ userName.charAt(0).toUpperCase() }}
                  </div>
                  <span class="font-bold text-gray-800">{{ userName }}</span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </transition>
    </nav>

    <section class="mx-auto px-4 sm:px-6 lg:px-40 py-12 lg:py-20 bg-gradient-to-br from-[#EFF6FF] via-[#FFFFFF] to-[#EEF2FF]">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <div class="space-y-6 text-left">
          <p class="text-blue-600 font-medium text-lg tracking-wide uppercase bg-blue-100 px-4 py-2 rounded-full w-fit">
            Kết nối tương lai nghề nghiệp
          </p>
          <h1
            class="text-3xl sm:text-4xl font-extrabold leading-tight text-gray-900"
          >
            Cầu nối giữa <br class="hidden lg:block" />
            <span class="text-blue-600">Doanh nghiệp</span> và
            <span class="text-purple-600">Sinh viên</span>
          </h1>
          <p class="text-gray-600 text-lg leading-relaxed">
            Nền tảng kết nối hàng đầu giúp sinh viên tìm kiếm cơ hội thực tập,
            việc làm và doanh nghiệp tìm kiếm nhân tài trẻ tài năng một cách
            nhanh chóng và hiệu quả.
          </p>

          <div class="flex flex-col sm:flex-row gap-6 pt-4">
            <div class="flex items-center space-x-2 group cursor-default">
              <div
                class="p-1 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors"
              >
                <svg
                  class="w-5 h-5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  />
                </svg>
              </div>
              <span class="text-gray-700 font-medium">Miễn phí đăng ký</span>
            </div>
            <div class="flex items-center space-x-2 group cursor-default">
              <div
                class="p-1 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors"
              >
                <svg
                  class="w-5 h-5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  />
                </svg>
              </div>
              <span class="text-gray-700 font-medium">Kết nối nhanh chóng</span>
            </div>
          </div>

          <div class="pt-6">
            <button
              @click="handleRoleNavigation"
              class="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/30"
            >
              Bắt đầu ngay
            </button>
          </div>
        </div>

        <div class="space-y-6">
          <div
            @click="handleRoleNavigation"
            class="bg-white rounded-2xl py-6 px-2 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-transparent hover:border-blue-100"
          >
            <div class="flex">
              <div class="w-[40%] flex items-center justify-center">
                <img
                  src="/company_landingpage.png"
                  alt="Doanh nghiệp"
                  class="w-[75%] mb-4 object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <div class="flex-1 text-left">
                <h3
                  class="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors"
                >
                  Doanh nghiệp
                </h3>
                <p class="text-gray-600 mb-4">
                  Đăng tin tuyển dụng, tìm kiếm ứng viên tiềm năng và xây dựng
                  đội ngũ nhân sự chất lượng cao.
                </p>
              </div>
              <svg
                class="w-6 h-6 text-gray-300 group-hover:text-blue-600 transition-colors transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>

          <div
            @click="handleRoleNavigation"
            class="bg-white rounded-2xl py-6 px-2 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-transparent hover:border-purple-100"
          >
            <div class="flex">
              <div class="w-[40%] flex items-center justify-center">
                <img
                  src="/student_landingpage.png"
                  alt="Sinh viên"
                  class="w-[70%] mb-4 object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <div class="flex-1 text-left">
                <h3
                  class="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors"
                >
                  Sinh viên
                </h3>
                <p class="text-gray-600 mb-4">
                  Tìm kiếm cơ hội thực tập, việc làm phù hợp và phát triển sự
                  nghiệp của bạn ngay từ bây giờ.
                </p>
              </div>
              <svg
                class="w-6 h-6 text-gray-300 group-hover:text-blue-600 transition-colors transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-3 gap-8">
          <div
            v-for="(feature, index) in features"
            :key="index"
            class="text-center group hover:-translate-y-2 transition-transform duration-300"
          >
            <div
              :class="[
                feature.bgClass,
                'rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:shadow-lg transition-all',
              ]"
            >
              <svg
                :class="['w-8 h-8', feature.colorClass]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path :d="feature.iconPath" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">
              {{ feature.title }}
            </h3>
            <p class="text-gray-600 px-4">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <footer class="bg-white border-t border-gray-200 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="flex items-center space-x-2 mb-4 md:mb-0">
            <div class="bg-blue-600 rounded-lg p-2">
              <svg
                class="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
                />
              </svg>
            </div>
            <span class="text-lg font-bold text-gray-900">ConnectEdu</span>
          </div>
          <p
            class="text-gray-600 text-sm hover:text-blue-600 transition-colors"
          >
            © 2024 ConnectEdu. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Tailwind CSS đã xử lý phần lớn style */
</style>
