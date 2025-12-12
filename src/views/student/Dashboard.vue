<script setup>
import { ref, onMounted, computed } from "vue";
import { toast } from "vue3-toastify";
import StudentSidebar from "@/common/student/sidebar.vue";
import { studentService } from "@/services/student/studentService";

// --- STATE QUẢN LÝ MOBILE SIDEBAR ---
const isSidebarOpen = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// --- STATE MANAGEMENT ---
const isLoading = ref(false);
const studentProfile = ref(null);
const jobSuggestions = ref([]);

// Computed stats based on real data
const stats = computed(() => [
  {
    title: "Việc làm phù hợp",
    value: jobSuggestions.value.length.toString(),
    trend: "+12%",
    trendLabel: "mới hôm nay",
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    title: "Đã ứng tuyển",
    value: "12",
    trend: "2",
    trendLabel: "đang chờ phỏng vấn",
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    title: "Lượt xem hồ sơ",
    value: "48",
    trend: "+8%",
    trendLabel: "tuần này",
    iconColor: "text-purple-600",
    bgColor: "bg-purple-50",
    icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  },
]);

// Computed average match score
const averageMatchScore = computed(() => {
  if (jobSuggestions.value.length === 0) return 0;
  const total = jobSuggestions.value.reduce((sum, job) => sum + (job.similarityScore * 100), 0);
  return Math.round(total / jobSuggestions.value.length);
});

// Computed jobs from API data
const jobs = computed(() => {
  return jobSuggestions.value.map(job => ({
    id: job.id,
    title: job.title,
    location: `${job.location} • ${job.dayOfWeek || 'Full-time'}`,
    company: job.companyName,
    match: Math.round(job.similarityScore * 100), // Convert to percentage
    salary: job.salaryRange,
    status: job.status,
    categoryName: job.categoryName,
  }));
});

// 3. Dữ liệu Lịch trình
const schedule = ref([
  {
    title: "Phỏng vấn kỹ thuật",
    company: "DataFlow Solutions",
    time: "Ngày mai, 14:00",
    type: "interview", // interview | view
  },
  {
    title: "Phỏng vấn văn hóa",
    company: "TechCorp Inc.",
    time: "Thứ 6, 09:30",
    type: "interview",
  },
  {
    title: "Hồ sơ được xem",
    company: "CloudTech Corp đã xem hồ sơ",
    time: "2 giờ trước",
    type: "view",
  },
]);

// Helper function để lấy màu badge độ phù hợp
const getMatchColor = (score) => {
  if (score >= 90) return "bg-green-100 text-green-700";
  if (score >= 80) return "bg-blue-100 text-blue-700";
  return "bg-yellow-100 text-yellow-700";
};

// Fetch student profile and job suggestions
const fetchJobSuggestions = async () => {
  try {
    isLoading.value = true;
    
    // Get student profile first to get studentInfoId
    const profile = await studentService.getMyProfile();
    studentProfile.value = profile;
    
    if (profile && profile.id) {
      // Fetch job suggestions
      const suggestions = await studentService.getJobSuggestions(profile.id);
      jobSuggestions.value = suggestions || [];
    }
  } catch (error) {
    console.error("Error fetching job suggestions:", error);
    toast.error("Không thể tải danh sách việc làm đề xuất");
  } finally {
    isLoading.value = false;
  }
};

// Load data on component mount
onMounted(() => {
  fetchJobSuggestions();
});
</script>

<template>
  <div class="flex h-screen bg-gray-50 font-sans">
    <StudentSidebar
      :is-open="isSidebarOpen"
      @close-sidebar="isSidebarOpen = false"
    />

    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div class="flex items-center justify-between px-4 md:px-8 py-4">
          <div class="flex items-center gap-4">
            <button
              @click="toggleSidebar"
              class="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div>
              <h2 class="text-xl text-start md:text-2xl font-bold text-gray-900">
                TỔNG QUAN
              </h2>
              <p class="text-xs md:text-sm text-gray-500 mt-1 hidden sm:block">
                Chào {{ studentProfile?.name || 'bạn' }}! Đây là các cơ hội việc làm mới nhất dành cho bạn.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3 md:gap-6">
            <div class="relative hidden sm:block group">
              <span
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <svg
                  class="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors"
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
                class="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64 transition-all"
                placeholder="Tìm kiếm công việc..."
              />
            </div>

            <button
              class="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
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
              class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm shadow-blue-200"
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span class="hidden md:inline">Cập nhật hồ sơ</span>
              <span class="md:hidden">Update</span>
            </button>
          </div>
        </div>
      </header>

      <main
        class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-8"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            v-for="(stat, index) in stats"
            :key="index"
            class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div class="flex justify-between items-start mb-4">
              <span class="text-gray-500 text-sm font-medium">{{
                stat.title
              }}</span>
              <div :class="['p-2 rounded-lg', stat.bgColor]">
                <svg
                  :class="['w-6 h-6', stat.iconColor]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    :d="stat.icon"
                  />
                </svg>
              </div>
            </div>
            <h3 class="text-3xl font-bold text-gray-900 mb-1">
              {{ stat.value }}
            </h3>
            <div class="flex items-center text-sm">
              <span
                class="text-green-500 flex items-center font-medium bg-green-50 px-1.5 py-0.5 rounded"
              >
                <svg
                  class="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
                {{ stat.trend }}
              </span>
              <span class="text-gray-400 ml-2 text-xs">{{
                stat.trendLabel
              }}</span>
            </div>
          </div>

          <div
            class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div class="flex justify-between items-start mb-4">
              <span class="text-gray-500 text-sm font-medium"
                >Độ phù hợp TB</span
              >
              <div class="p-2 bg-orange-50 rounded-lg">
                <svg
                  class="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h3 class="text-3xl font-bold text-gray-900 mb-1">{{ averageMatchScore }}%</h3>
            <div class="w-full bg-gray-100 rounded-full h-2 mt-3">
              <div
                class="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-1000"
                :style="`width: ${averageMatchScore}%`"
              ></div>
            </div>
          </div>
        </div>

        <div class="flex flex-col xl:flex-row gap-6">
          <div
            class="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm min-w-0"
          >
            <div
              class="flex justify-between items-center p-6 border-b border-gray-200"
            >
              <h3 class="text-lg font-bold text-gray-900">Việc làm đề xuất</h3>
              <div class="flex items-center gap-2">
                <button
                  class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  Phù hợp nhất
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <a
                  href="#"
                  class="text-sm font-semibold text-blue-600 hover:text-blue-700 ml-2 whitespace-nowrap"
                  >Xem tất cả</a
                >
              </div>
            </div>

            <div class="overflow-x-auto">
              <div v-if="isLoading" class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <div v-else-if="jobs.length === 0" class="text-center py-12 text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
                <p class="text-lg font-medium">Chưa có việc làm đề xuất</p>
                <p class="text-sm mt-2">Vui lòng cập nhật hồ sơ để nhận đề xuất việc làm phù hợp</p>
              </div>
              <table v-else class="w-full min-w-[700px]">
                <thead
                  class="bg-gray-50/50 text-xs text-gray-500 font-semibold uppercase tracking-wider text-left"
                >
                  <tr>
                    <th class="px-6 py-4 rounded-tl-lg">Vị trí</th>
                    <th class="px-6 py-4">Công ty</th>
                    <th class="px-6 py-4">Độ phù hợp</th>
                    <th class="px-6 py-4 text-center">Lương</th>
                    <th class="px-6 py-4 text-center rounded-tr-lg">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr
                    v-for="job in jobs"
                    :key="job.id"
                    class="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td class="px-6 py-4 text-left">
                      <div class="flex flex-col">
                        <span
                          class="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors"
                          >{{ job.title }}</span
                        >
                        <span class="text-xs text-gray-500 mt-0.5">{{
                          job.location
                        }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600 font-medium text-left">
                      {{ job.company }}
                    </td>
                    <td class="px-6 py-4">
                      <span
                        :class="[
                          'px-2.5 py-1 rounded-full text-xs font-bold border',
                          getMatchColor(job.match),
                          'border-transparent bg-opacity-50',
                        ]"
                      >
                        {{ job.match }}% Match
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600 font-medium">
                      {{ job.salary }}
                    </td>
                    <td class="px-6 py-4 text-center">
                      <button
                        class="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        Ứng tuyển
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="p-4 border-t border-gray-200 flex justify-center">
              <button
                class="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors"
              >
                Tải thêm việc làm...
              </button>
            </div>
          </div>

          <div class="w-full xl:w-80 shrink-0">
            <div
              class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm xl:sticky xl:top-24"
            >
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-bold text-gray-900">Lịch trình</h3>
                <button class="text-gray-400 hover:text-blue-600">
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
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    ></path>
                  </svg>
                </button>
              </div>

              <div class="space-y-4">
                <div
                  v-for="(item, index) in schedule"
                  :key="index"
                  :class="[
                    'pl-2 rounded-xl border transition-all hover:shadow-md cursor-pointer',
                    item.type === 'interview'
                      ? 'bg-blue-100 border-blue-100'
                      : 'bg-gray-200 border-gray-200',
                  ]"
                >
                  <div class="flex items-start gap-3 p-2 bg-white rounded-xl">
                    <div
                      :class="[
                        'w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm',
                        item.type === 'interview'
                          ? 'bg-white text-blue-600'
                          : 'bg-white text-green-600',
                      ]"
                    >
                      <svg
                        v-if="item.type === 'interview'"
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        ></path>
                      </svg>
                      <svg
                        v-else
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        ></path>
                      </svg>
                    </div>
                    <div>
                      <p class="text-sm font-bold text-gray-900 line-clamp-1 text-left">
                        {{ item.title }}
                      </p>
                      <p class="text-xs text-gray-500 mt-0.5 line-clamp-1 text-left">
                        {{ item.company }}
                      </p>
                      <span
                        :class="[
                          'text-xs font-semibold mt-2 block',
                          item.type === 'interview'
                            ? 'text-blue-600'
                            : 'text-gray-400',
                        ]"
                        class="text-left"
                      >
                        {{ item.time }}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  class="w-full py-2.5 mt-2 border border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
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
                      d="M12 4v16m8-8H4"
                    ></path>
                  </svg>
                  Thêm nhắc nhở
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style>
/* Đảm bảo Font Inter được load (thường đặt ở App.vue hoặc index.html) */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

body {
  font-family: "Inter", sans-serif;
}
</style>
