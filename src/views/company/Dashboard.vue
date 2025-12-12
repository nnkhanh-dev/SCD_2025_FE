<script setup>
import { ref, computed } from "vue";
// Import Sidebar component (Giữ nguyên đường dẫn của bạn)
import CompanySidebar from "@/common/company/sidebar.vue";
import router from "../../router";

// --- STATE ---
const isSidebarOpen = ref(false);

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
    title: "Vị trí đang mở",
    value: 68,
    trend: 8,
    trendType: "up",
    color: "emerald", // Đổi green thành emerald cho sang hơn
    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
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
    title: "Đã tuyển dụng",
    value: 42,
    trend: 18,
    trendType: "up",
    color: "amber", // Đổi orange thành amber
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
]);

const recentJobs = ref([
  {
    title: "Senior Frontend Dev",
    type: "Full-time • Remote",
    department: "Engineering",
    applicants: [
      "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff",
      "https://ui-avatars.com/api/?name=Jane+Smith&background=random",
      "https://ui-avatars.com/api/?name=Mike+Ross&background=random",
    ],
    totalApplicants: 15,
    status: "open",
    published: "2 giờ trước",
  },
  {
    title: "UX/UI Designer",
    type: "Full-time • Onsite",
    department: "Design",
    applicants: [
      "https://ui-avatars.com/api/?name=Alice+W&background=random",
      "https://ui-avatars.com/api/?name=Bob+M&background=random",
    ],
    totalApplicants: 10,
    status: "open",
    published: "1 ngày trước",
  },
  {
    title: "Marketing Manager",
    type: "Full-time • Hybrid",
    department: "Marketing",
    applicants: [
      "https://ui-avatars.com/api/?name=Sarah+K&background=random",
      "https://ui-avatars.com/api/?name=Tom+H&background=random",
    ],
    totalApplicants: 8,
    status: "reviewing",
    published: "3 ngày trước",
  },
  {
    title: "Backend Lead",
    type: "Full-time • Remote",
    department: "Engineering",
    applicants: ["https://ui-avatars.com/api/?name=Dev+Guy&background=random"],
    totalApplicants: 25,
    status: "closed",
    published: "1 tuần trước",
  },
  {
    title: "HR Specialist",
    type: "Part-time • Onsite",
    department: "Human Resource",
    applicants: ["https://ui-avatars.com/api/?name=HR+Girl&background=random"],
    totalApplicants: 5,
    status: "closed",
    published: "2 tuần trước",
  },
]);

const activities = ref([
  {
    title: "Ứng viên nộp hồ sơ",
    desc: "Nguyễn Thị B nộp đơn cho vị trí <span class='font-medium text-slate-800'>Senior Frontend Dev</span>",
    time: "2 phút trước",
    color: "blue",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  {
    title: "Lịch phỏng vấn mới",
    desc: "Phỏng vấn với Lê Thị C lúc 14:00 chiều nay",
    time: "1 giờ trước",
    color: "purple",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    title: "Đánh giá hoàn tất",
    desc: "Trưởng phòng đã duyệt hồ sơ <b>#ID92</b>",
    time: "3 giờ trước",
    color: "emerald",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "Tin tuyển dụng hết hạn",
    desc: "Vị trí <b>Backend Lead</b> đã tự động đóng",
    time: "5 giờ trước",
    color: "gray",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
]);

// --- COMPUTED & HELPERS ---
const currentHour = new Date().getHours();
const greeting = computed(() => {
  if (currentHour < 12) return "Chào buổi sáng";
  if (currentHour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
});

// Helper for Styles
const getStatusStyle = (status) => {
  const map = {
    open: {
      class:
        "bg-emerald-50 text-emerald-700 border border-emerald-200 ring-emerald-600/20",
      label: "Đang mở",
      dot: "bg-emerald-500",
    },
    reviewing: {
      class:
        "bg-amber-50 text-amber-700 border border-amber-200 ring-amber-600/20",
      label: "Đang xét",
      dot: "bg-amber-500",
    },
    closed: {
      class:
        "bg-slate-100 text-slate-600 border border-slate-200 ring-slate-600/10",
      label: "Đã đóng",
      dot: "bg-slate-500",
    },
  };
  return map[status] || { class: "bg-gray-100", label: "Unknown" };
};

const getIconBg = (color) => {
  const map = {
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    purple: "bg-purple-100 text-purple-600",
    amber: "bg-amber-100 text-amber-600",
    gray: "bg-slate-100 text-slate-600",
  };
  return map[color] || map.gray;
};

const onLogout = () => {
  if (confirm("Đăng xuất?")) console.log("Logged out");
};
</script>

<template>
  <div
    class="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden text-slate-600"
  >
    <CompanySidebar
      :is-open="isSidebarOpen"
      @close-sidebar="isSidebarOpen = false"
      @logout="onLogout"
    />

    <div
      class="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300"
    >
      <header
        class="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30"
      >
        <div class="px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <button
                @click="isSidebarOpen = true"
                class="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
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

              <div class="flex flex-col">
                <h1
                  class="text-xl sm:text-2xl font-bold text-start text-slate-800 tracking-tight"
                >
                  TỔNG QUAN
                </h1>
                <p
                  class="hidden sm:block text-xs font-medium text-slate-500 mt-0.5"
                >
                  {{ greeting }}, chúc bạn một ngày làm việc hiệu quả! 🌤️
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3 md:gap-4">
              <div class="relative hidden lg:block group">
                <span
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors"
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
                  class="pl-10 pr-4 py-2.5 w-64 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Tìm kiếm nhanh..."
                />
              </div>

              <button
                class="relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <span
                  class="absolute top-2.5 right-2.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"
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
            </div>
          </div>
        </div>
      </header>

      <main
        class="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6 lg:p-8"
      >
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8"
        >
          <div
            v-for="(item, index) in stats"
            :key="index"
            class="group bg-white rounded-2xl p-5 border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300"
          >
            <div class="flex justify-between items-center mb-2">
              <p class="text-sm font-medium text-slate-500">
                {{ item.title }}
              </p>
              <div
                class="p-3 rounded-xl transition-colors duration-300"
                :class="getIconBg(item.color)"
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
                    :d="item.icon"
                  />
                </svg>
              </div>
            </div>
            <h3 class="text-2xl font-bold text-slate-800 tracking-tight mb-2">
              {{ item.value }}
            </h3>
            <div class="flex items-center gap-2">
              <div
                class="flex items-center px-2 py-1 rounded-full text-xs font-bold"
                :class="
                  item.trendType === 'up'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-rose-50 text-rose-600'
                "
              >
                <svg
                  v-if="item.trendType === 'up'"
                  class="w-4 h-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <svg
                  v-else
                  class="w-4 h-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                </svg>
                {{ item.trend }}%
              </div>
              <p>So với tháng trước</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          <div class="xl:col-span-2 flex flex-col min-w-0">
            <div
              class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1"
            >
              <div
                class="p-6 border-b border-slate-100 flex justify-between items-center bg-white"
              >
                <div>
                  <h3 class="text-lg font-bold text-slate-800">
                    Tin tuyển dụng gần đây
                  </h3>
                  <p class="text-xs text-slate-500 mt-1">
                    Quản lý trạng thái các vị trí đang mở
                  </p>
                </div>
                <button
                  class="text-sm text-blue-600 font-semibold hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                >
                  Xem tất cả
                </button>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead
                    class="bg-slate-50/50 text-xs uppercase text-slate-500 font-semibold"
                  >
                    <tr>
                      <th class="px-6 py-4 rounded-tl-lg">Vị trí công việc</th>
                      <th class="px-6 py-4">Phòng ban</th>
                      <th class="px-6 py-4">Ứng viên</th>
                      <th class="px-6 py-4">Trạng thái</th>
                      <th class="px-6 py-4 text-center rounded-tr-lg">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 text-sm">
                    <tr
                      v-for="(job, index) in recentJobs"
                      :key="index"
                      class="group hover:bg-slate-50/80 transition-colors"
                    >
                      <td class="px-6 py-4">
                        <div class="flex flex-col">
                          <span
                            class="font-bold text-slate-800 group-hover:text-blue-600 transition-colors cursor-pointer"
                            >{{ job.title }}</span
                          >
                          <span class="text-xs text-slate-500 mt-0.5"
                            >{{ job.type }}
                            <span class="mx-1 text-slate-300">•</span>
                            {{ job.published }}</span
                          >
                        </div>
                      </td>
                      <td class="px-6 py-4 text-slate-600 font-medium">
                        {{ job.department }}
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex -space-x-2.5">
                          <img
                            v-for="(img, idx) in job.applicants"
                            :key="idx"
                            :src="img"
                            class="w-8 h-8 rounded-full border-2 border-white ring-1 ring-slate-100 shadow-sm transition-transform hover:scale-110 hover:z-10"
                            alt="Applicant"
                          />
                          <div
                            v-if="job.totalApplicants > job.applicants.length"
                            class="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 ring-1 ring-slate-200"
                          >
                            +{{ job.totalApplicants - job.applicants.length }}
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span
                          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm"
                          :class="getStatusStyle(job.status).class"
                        >
                          <span
                            class="w-1.5 h-1.5 rounded-full"
                            :class="getStatusStyle(job.status).dot"
                          ></span>
                          {{ getStatusStyle(job.status).label }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <button
                          class="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-all"
                        >
                          <svg
                            class="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="xl:col-span-1">
            <div
              class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24"
            >
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-bold text-slate-800">Hoạt động mới</h3>
                <button
                  class="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>

              <div class="relative space-y-0">
                <div
                  class="absolute left-3.5 top-2 bottom-4 w-px bg-slate-100"
                ></div>

                <div
                  v-for="(act, index) in activities"
                  :key="index"
                  class="relative pl-10 pb-6 last:pb-0 group"
                >
                  <div
                    class="absolute left-0 top-0 w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110"
                    :class="getIconBg(act.color)"
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
                        :d="act.icon"
                      />
                    </svg>
                  </div>

                  <div
                    class="pl-2 rounded-xl border border-slate-200 hover:border-slate-300 transition-all"
                    :class="getIconBg(act.color)"
                  >
                    <div class="w-full h-full p-3 rounded-xl bg-white">
                      <p class="text-sm font-bold text-slate-800 text-left">
                        {{ act.title }}
                      </p>
                      <p
                        class="text-xs text-slate-500 mt-1 leading-relaxed text-left"
                        v-html="act.desc"
                      ></p>
                      <span
                        class="text-[10px] font-semibold text-slate-400 mt-2 block flex items-center gap-1"
                      >
                        <svg
                          class="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {{ act.time }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                class="w-full mt-6 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-all"
              >
                Xem toàn bộ nhật ký
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
