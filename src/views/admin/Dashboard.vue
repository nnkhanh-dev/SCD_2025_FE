<script setup>
import { ref } from "vue";
// Đảm bảo đường dẫn import đúng với cấu trúc dự án của bạn
import AdminSidebar from "@/common/admin/sidebar.vue";

// --- STATE QUẢN LÝ ---
const isSidebarOpen = ref(false); // State đóng mở menu mobile

// --- DATA ---
const stats = ref([
  {
    title: "Tổng đơn tuyển",
    value: 248,
    trend: 12,
    trendType: "up",
    color: "blue",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    title: "Đang mở",
    value: 68,
    trend: 8,
    trendType: "up",
    color: "green",
    icon: "M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z",
  },
  {
    title: "Ứng viên mới",
    value: "1,429",
    trend: 3,
    trendType: "down",
    color: "purple",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    title: "Đã tuyển",
    value: 42,
    trend: 18,
    trendType: "up",
    color: "orange",
    icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
  },
]);

const recentJobs = ref([
  {
    title: "Senior Frontend Dev",
    type: "Full-time • Remote",
    department: "Công nghệ",
    applicants: [
      "https://ui-avatars.com/api/?name=U1&bg=random",
      "https://ui-avatars.com/api/?name=U2&bg=random",
      "https://ui-avatars.com/api/?name=U3&bg=random",
    ],
    totalApplicants: 15,
    status: "open",
    deadline: "15/01/2025",
  },
  {
    title: "UX/UI Designer",
    type: "Full-time • Onsite",
    department: "Thiết kế",
    applicants: [
      "https://ui-avatars.com/api/?name=U4&bg=random",
      "https://ui-avatars.com/api/?name=U5&bg=random",
    ],
    totalApplicants: 10,
    status: "open",
    deadline: "20/01/2025",
  },
  {
    title: "Marketing Manager",
    type: "Full-time • Hybrid",
    department: "Marketing",
    applicants: [
      "https://ui-avatars.com/api/?name=U6&bg=random",
      "https://ui-avatars.com/api/?name=U7&bg=random",
    ],
    totalApplicants: 8,
    status: "reviewing",
    deadline: "10/01/2025",
  },
  {
    title: "Backend Lead",
    type: "Full-time • Remote",
    department: "Công nghệ",
    applicants: [
      "https://ui-avatars.com/api/?name=U8&bg=random",
      "https://ui-avatars.com/api/?name=U9&bg=random",
    ],
    totalApplicants: 25,
    status: "closed",
    deadline: "05/01/2025",
  },
  {
    title: "HR Specialist",
    type: "Part-time • Onsite",
    department: "Nhân sự",
    applicants: ["https://ui-avatars.com/api/?name=U10&bg=random"],
    totalApplicants: 5,
    status: "closed",
    deadline: "05/01/2025",
  },
]);

const activities = ref([
  {
    title: "Ứng viên nộp hồ sơ",
    desc: "Nguyễn Thị B nộp đơn cho vị trí Senior Frontend Dev",
    time: "2 phút trước",
    color: "blue",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  {
    title: "Lịch phỏng vấn mới",
    desc: "Phỏng vấn với Lê Thị C lúc 14:00",
    time: "1 giờ trước",
    color: "purple",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    title: "Đánh giá hoàn tất",
    desc: "Trưởng phòng đã đánh giá hồ sơ #ID92",
    time: "3 giờ trước",
    color: "green",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
]);

// Helper Functions
const getBgColor = (color) => {
  const map = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return map[color] || "bg-gray-50";
};

const getStatusStyle = (status) => {
  const map = {
    open: {
      class: "bg-green-100 text-green-700 ring-1 ring-green-600/20",
      label: "Đang mở",
    },
    reviewing: {
      class: "bg-orange-100 text-orange-700 ring-1 ring-orange-600/20",
      label: "Đang xét",
    },
    closed: {
      class: "bg-gray-100 text-gray-600 ring-1 ring-gray-600/10",
      label: "Đã đóng",
    },
  };
  return map[status] || { class: "bg-gray-100 label: Khác" };
};

const onLogout = () => {
  if (confirm("Đăng xuất?")) console.log("Logged out");
};
</script>

<template>
  <div class="flex h-screen bg-gray-50 font-sans overflow-hidden">
    <AdminSidebar
      :is-open="isSidebarOpen"
      @close-sidebar="isSidebarOpen = false"
      @logout="onLogout"
    />

    <div
      class="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-in-out"
    >
      <header
        class="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm shrink-0"
      >
        <div
          class="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4"
        >
          <div class="flex items-center gap-4">
            <button
              @click="isSidebarOpen = true"
              class="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </button>

            <div>
              <h2
                class="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight"
              >
                Tổng quan
              </h2>
              <p class="hidden sm:block text-sm text-gray-500 mt-0.5">
                Chào mừng trở lại, chúc bạn một ngày tốt lành!
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="relative hidden lg:block mr-2">
              <span
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
              <input
                type="text"
                class="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 transition-all"
                placeholder="Tìm kiếm..."
              />
            </div>

            <button
              class="relative p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
            >
              <span
                class="absolute top-2 right-2.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"
              ></span>
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
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            <button
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md transition-all whitespace-nowrap"
            >
              <svg
                class="w-5 h-5 hidden sm:block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Đăng tin</span>
            </button>
          </div>
        </div>
      </header>

      <main
        class="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]"
      >
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8"
        >
          <div
            v-for="(item, index) in stats"
            :key="index"
            class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
          >
            <div class="flex justify-between items-start mb-4">
              <span class="text-gray-500 text-sm font-semibold">{{
                item.title
              }}</span>
              <div class="p-2.5 rounded-xl" :class="getBgColor(item.color)">
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
                    :d="item.icon"
                  />
                </svg>
              </div>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-1">
              {{ item.value }}
            </h3>
            <div class="flex items-center text-sm">
              <span
                class="flex items-center font-bold"
                :class="
                  item.trendType === 'up' ? 'text-green-500' : 'text-red-500'
                "
              >
                <svg
                  class="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    v-if="item.trendType === 'up'"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                  <path
                    v-else
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
                {{ item.trend }}%
              </span>
              <span class="text-gray-400 ml-2">tháng trước</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col xl:flex-row gap-6">
          <div
            class="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-w-0"
          >
            <div
              class="flex items-center justify-between p-5 border-b border-gray-100"
            >
              <h3 class="text-lg font-bold text-gray-900">Tin tuyển dụng</h3>
              <button class="text-sm text-blue-600 hover:underline font-medium">
                Xem tất cả
              </button>
            </div>

            <div class="overflow-x-auto custom-scrollbar">
              <table class="w-full min-w-[700px]">
                <thead
                  class="bg-gray-50 text-xs text-gray-500 font-semibold uppercase text-left"
                >
                  <tr>
                    <th class="px-6 py-4">Vị trí</th>
                    <th class="px-6 py-4">Phòng ban</th>
                    <th class="px-6 py-4">Ứng viên</th>
                    <th class="px-6 py-4">Trạng thái</th>
                    <th class="px-6 py-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr
                    v-for="(job, index) in recentJobs"
                    :key="index"
                    class="hover:bg-gray-50 transition-colors"
                  >
                    <td class="px-6 py-4">
                      <div class="font-bold text-gray-900 text-sm">
                        {{ job.title }}
                      </div>
                      <div class="text-xs text-gray-500 mt-0.5">
                        {{ job.type }}
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600">
                      {{ job.department }}
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex -space-x-2">
                        <img
                          v-for="(img, idx) in job.applicants"
                          :key="idx"
                          :src="img"
                          class="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          alt="U"
                        />
                        <div
                          v-if="job.totalApplicants > job.applicants.length"
                          class="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600"
                        >
                          +{{ job.totalApplicants - job.applicants.length }}
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class="px-2.5 py-1 rounded-full text-xs font-semibold"
                        :class="getStatusStyle(job.status).class"
                      >
                        {{ getStatusStyle(job.status).label }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <button
                        class="text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50"
                      >
                        <svg
                          class="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="w-full xl:w-80 shrink-0">
            <div
              class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm sticky top-6"
            >
              <h3 class="text-lg font-bold text-gray-900 mb-5">
                Hoạt động mới
              </h3>
              <div class="space-y-6">
                <div
                  v-for="(act, index) in activities"
                  :key="index"
                  class="flex gap-4"
                >
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    :class="getBgColor(act.color)"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path :d="act.icon" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-gray-900 line-clamp-1">
                      {{ act.title }}
                    </p>
                    <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {{ act.desc }}
                    </p>
                    <span class="text-xs text-gray-400 mt-1 block">{{
                      act.time
                    }}</span>
                  </div>
                </div>
              </div>
              <button
                class="w-full mt-6 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Xem tất cả
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Scrollbar tinh tế */
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: #94a3b8;
}
</style>
