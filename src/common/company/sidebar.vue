<script setup>
import { ref, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { logoutUser } from "../../services/common/authService";
import { toast } from "vue3-toastify";

const route = useRoute();
const router = useRouter();
const emit = defineEmits(["logout", "close-sidebar"]);

const props = defineProps({
  isOpen: { type: Boolean, default: false }, // Dùng cho mobile drawer
});

// Logout
// Xử lý sự kiện khi click vào Menu
const handleClick = async (item) => {
  // Nếu là nút Đăng xuất
  if (item.action === "logout") {
    // 1. Hiển thị thông báo thành công
    toast.success("Đăng xuất thành công! Hẹn gặp lại.");

    // 2. Đợi 1.5s cho người dùng đọc thông báo rồi mới thực hiện logout
    setTimeout(async () => {
      await logoutUser(); // Hàm này sẽ xóa token và reload về trang Login
    }, 1500);
  } else {
    // Nếu là các menu khác -> Chuyển trang bình thường
    router.push(item.href);
    emit("close-sidebar"); // Đóng sidebar nếu đang ở mobile
  }
};

// --- STATE QUẢN LÝ THU NHỎ (COLLAPSE) ---
const isCollapsed = ref(false); // Mặc định là mở rộng

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// --- DATA MENU ---
// Thêm trường isActive
const mainMenu = ref([
  {
    name: "Tổng quan",
    href: "/company/dashboard",
    icon: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z",
    isActive: false,
  },
  {
    name: "Tin tuyển dụng",
    href: "/company/jobs",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    isActive: false,
  },
  {
    name: "Ứng viên",
    href: "/company/candidates",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    isActive: false,
  },
  {
    name: "Lời mời",
    href: "/company/interviews",
    // Icon Document/File
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    isActive: false,
  }
]);

const systemMenu = ref([
  {
    name: "Cài đặt",
    href: "/company/settings",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    isActive: false,
  },
  {
    name: "Đăng xuất",
    action: "logout",
    icon: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
    isActive: false,
  },
]);

const currentUser = {
  name: "Nguyễn Văn A",
  role: "HR Manager",
  avatar:
    "https://ui-avatars.com/api/?name=Nguyen+Van+A&background=0D8ABC&color=fff",
};

// --- LOGIC ---
watchEffect(() => {
  const currentPath = route.path;
  mainMenu.value.forEach(
    (item) => (item.isActive = currentPath.includes(item.href))
  );
  systemMenu.value.forEach((item) => {
    if (item.href) item.isActive = currentPath.includes(item.href);
  });
});
</script>

<template>
  <div>
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden transition-opacity"
      @click="$emit('close-sidebar')"
    ></div>

    <aside
      class="fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-100 shadow-2xl md:shadow-none transition-all duration-300 ease-in-out md:static md:flex md:flex-col"
      :class="[
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0', // Mobile Drawer Logic
        isCollapsed ? 'md:w-30' : 'md:w-72', // Desktop Collapse Logic
        'w-72', // Mobile width fixed
      ]"
    >
      <div class="flex flex-col h-full overflow-hidden">
        <div
          class="h-20 flex items-center justify-between px-6 border-b border-transparent relative shrink-0"
          :class="isCollapsed ? 'justify-center px-0' : ''"
        >
          <div
            class="flex items-center gap-3 overflow-hidden whitespace-nowrap"
          >
            <div
              class="transition-transform hover:scale-105"
            >
              <img
                src="/logo_connect_edu.png"
                alt="SURS Logo"
                class="w-16 h-16 object-contain"
              />
            </div>

            <div
              class="transition-all duration-300 ease-in-out origin-left"
              :class="
                isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'
              "
            >
              <h1
                class="text-xl font-bold tracking-tight leading-none bg-gradient-to-r from-[#2563EB] to-[#4F46E5] bg-clip-text text-transparent text-left"
              >
                SURS
              </h1>
              <p
                class="text-[10px] font-semibold uppercase tracking-wider mt-0.5 text-left"
              >
                Nhà tuyển dụng
              </p>
            </div>
          </div>

          <button
            @click="toggleCollapse"
            class="hidden fixed right-1 md:flex text-slate-400 hover:text-blue-600 transition-colors duration-200 p-1"
            :title="isCollapsed ? 'Mở rộng' : 'Thu gọn'"
          >
            <svg
              v-if="!isCollapsed"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>

            <svg
              v-else
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>

          <button
            @click="$emit('close-sidebar')"
            class="md:hidden p-1 text-slate-400 hover:text-slate-600"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <button
            @click="$emit('close-sidebar')"
            class="md:hidden text-gray-400 hover:text-gray-600"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav
          class="flex-1 px-3 space-y-1 mt-4 overflow-y-auto custom-scrollbar overflow-x-hidden"
        >
          <a
            v-for="(item, index) in mainMenu"
            :key="index"
            href="#"
            @click.prevent="handleClick(item)"
            class="flex items-center py-3 rounded-xl font-medium transition-all duration-200 group relative"
            :class="[
              isCollapsed ? 'justify-center px-0' : 'justify-start px-3 gap-3', // Căn chỉnh dựa trên collapsed
              item.isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
            ]"
            :title="isCollapsed ? item.name : ''"
          >
            <div
              v-if="item.isActive"
              class="absolute left-0 top-1/2 -translate-y-1/2 bg-blue-600 rounded-r-full transition-all duration-300"
              :class="isCollapsed ? 'w-1 h-2 rounded-full left-1' : 'w-1 h-6'"
            ></div>

            <svg
              class="w-6 h-6 transition-colors duration-200 shrink-0"
              :class="
                item.isActive
                  ? 'text-blue-600'
                  : 'text-gray-400 group-hover:text-gray-600'
              "
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="item.icon"
              />
            </svg>

            <span
              class="whitespace-nowrap transition-all duration-200"
              :class="
                isCollapsed
                  ? 'w-0 opacity-0 hidden'
                  : 'w-auto opacity-100 block'
              "
            >
              {{ item.name }}
            </span>
          </a>

          <div class="my-4 border-t border-gray-100 mx-2"></div>

          <a
            v-for="(item, index) in systemMenu"
            :key="'sys-' + index"
            href="#"
            @click.prevent="handleClick(item)"
            class="flex items-center py-3 rounded-xl font-medium transition-all duration-200 group relative"
            :class="[
              isCollapsed ? 'justify-center px-0' : 'justify-start px-3 gap-3',
              item.action === 'logout'
                ? 'text-red-500 hover:bg-red-50 hover:text-red-600'
                : item.isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
            ]"
            :title="isCollapsed ? item.name : ''"
          >
            <div
              v-if="item.isActive && item.action !== 'logout'"
              class="absolute left-0 top-1/2 -translate-y-1/2 bg-blue-600 rounded-r-full transition-all duration-300"
              :class="isCollapsed ? 'w-1 h-2 rounded-full left-1' : 'w-1 h-6'"
            ></div>

            <svg
              class="w-6 h-6 transition-colors duration-200 shrink-0"
              :class="
                item.action === 'logout'
                  ? 'text-red-400 group-hover:text-red-500'
                  : item.isActive
                  ? 'text-blue-600'
                  : 'text-gray-400 group-hover:text-gray-600'
              "
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="item.icon"
              />
            </svg>

            <span
              class="whitespace-nowrap transition-all duration-200"
              :class="
                isCollapsed
                  ? 'w-0 opacity-0 hidden'
                  : 'w-auto opacity-100 block'
              "
            >
              {{ item.name }}
            </span>
          </a>
        </nav>

        <div class="px-4 py-2 border-t border-gray-100 bg-gray-50/30">
          <div
            class="flex items-center rounded-xl cursor-pointer hover:bg-white hover:shadow-md transition-all group border border-transparent hover:border-gray-100"
            :class="isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'"
          >
            <div class="relative shrink-0">
              <img
                :src="currentUser.avatar"
                alt="Avatar"
                class="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm transition-transform group-hover:scale-105"
              />
              <span
                class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"
              ></span>
            </div>

            <div
              class="flex-1 min-w-0 transition-all duration-300 overflow-hidden"
              :class="
                isCollapsed
                  ? 'w-0 opacity-0 hidden'
                  : 'w-auto opacity-100 block'
              "
            >
              <p
                class="text-sm font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors"
              >
                {{ currentUser.name }}
              </p>
              <p class="text-[11px] text-gray-500 truncate font-medium">
                {{ currentUser.role }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 0px; /* Ẩn scrollbar để đẹp hơn, vẫn scroll được */
}
.custom-scrollbar:hover::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
</style>
