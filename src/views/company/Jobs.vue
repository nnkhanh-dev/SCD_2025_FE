<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import Sidebar from "@/common/company/sidebar.vue";
import { jobService } from "@/services";

const router = useRouter();

// --- State ---
const isSidebarOpen = ref(false);
const jobs = ref([]);
const isLoading = ref(false);
const errorMessage = ref(""); // Dùng cho lỗi lớn
const selectedJob = ref(null);
const showDetailModal = ref(false);
const showDeleteModal = ref(false);
const jobToDelete = ref(null);

// --- Toast State ---
const toast = ref({ show: false, message: "", type: "success" });
let toastTimeout = null;

// --- Search & Filter ---
const searchQuery = ref("");
const statusFilter = ref("");

// --- Computed ---
const filteredJobs = computed(() => {
  let filtered = jobs.value;

  // Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (job) =>
        job.title.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query) ||
        job.categoryName?.toLowerCase().includes(query)
    );
  }

  // Filter
  if (statusFilter.value) {
    filtered = filtered.filter((job) => job.status === statusFilter.value);
  }

  return filtered;
});

const jobStats = computed(() => {
  return {
    total: jobs.value.length,
    active: jobs.value.filter((j) => j.status === "Active").length,
    inactive: jobs.value.filter((j) => j.status === "Inactive").length,
    closed: jobs.value.filter((j) => j.status === "Closed").length,
  };
});

// --- Actions ---
const showToast = (message, type = "success") => {
  toast.value = { show: true, message, type };
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.value.show = false;
  }, 3000);
};

const fetchJobs = async () => {
  isLoading.value = true;
  try {
    const response = await jobService.getMyJobs();
    jobs.value = response || [];
  } catch (error) {
    console.error(error);
    errorMessage.value = "Không thể tải danh sách tin tuyển dụng";
  } finally {
    isLoading.value = false;
  }
};

const viewJobDetail = async (jobId) => {
  try {
    const response = await jobService.getJobById(jobId);
    selectedJob.value = response;
    showDetailModal.value = true;
  } catch (error) {
    console.error(error);
    showToast("Lỗi tải chi tiết tin", "error");
  }
};

const editJob = (jobId) => {
  router.push(`/company/jobs/edit/${jobId}`);
};

const confirmDelete = (job) => {
  jobToDelete.value = job;
  showDeleteModal.value = true;
};

const deleteJob = async () => {
  if (!jobToDelete.value) return;
  try {
    await jobService.deleteJob(jobToDelete.value.id);
    jobs.value = jobs.value.filter((j) => j.id !== jobToDelete.value.id);
    showDeleteModal.value = false;
    jobToDelete.value = null;
    showToast("Đã xóa tin tuyển dụng thành công!", "success");
  } catch (error) {
    console.error(error);
    showToast("Không thể xóa tin tuyển dụng. Vui lòng thử lại.", "error");
  }
};

// --- Helpers ---
const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getStatusBadge = (status) => {
  // UX Improvement: Màu sắc đậm hơn, border rõ ràng hơn
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Inactive":
      return "bg-slate-100 text-slate-600 border-slate-200";
    case "Closed":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "Active":
      return "Đang hiển thị";
    case "Inactive":
      return "Bản nháp";
    case "Closed":
      return "Đóng";
    default:
      return "Đang xử lý";
  }
};

onMounted(() => {
  fetchJobs();
});
</script>

<template>
  <div
    class="flex w-full h-full bg-[#F1F5F9] font-sans text-slate-600 selection:bg-blue-100"
  >
    <Sidebar :is-open="isSidebarOpen" @close-sidebar="isSidebarOpen = false" />

    <main
      class="flex-1 flex flex-col w-screen h-full relative transition-all duration-300"
    >
      <header
        class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm"
      >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="h-16 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <button
                @click="isSidebarOpen = !isSidebarOpen"
                class="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
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
                <h1 class="text-xl font-bold text-slate-900 tracking-tight">
                  Quản lý tuyển dụng
                </h1>
              </div>
            </div>

            <button
              @click="router.push('/company/jobs/create')"
              class="group relative inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
            >
              <svg
                class="w-5 h-5 mr-1.5"
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
              Tạo tin mới
            </button>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto scroll-smooth p-4 sm:p-6 lg:p-8">
        <div class="max-w-7xl mx-auto">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div
              class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div class="p-3 rounded-full bg-blue-50 text-blue-600">
                <svg
                  class="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500 uppercase">
                  Tổng tin đăng
                </p>
                <p class="text-2xl font-bold text-slate-900">
                  {{ jobStats.total }}
                </p>
              </div>
            </div>
            <div
              class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div class="p-3 rounded-full bg-emerald-50 text-emerald-600">
                <svg
                  class="w-8 h-8"
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
              <div>
                <p class="text-sm font-medium text-slate-500 uppercase">
                  Đang hiển thị
                </p>
                <p class="text-2xl font-bold text-slate-900">
                  {{ jobStats.active }}
                </p>
              </div>
            </div>
            <div
              class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div class="p-3 rounded-full bg-red-100 text-slate-600">
                <svg
                  class="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500 uppercase">
                  Đã đóng / Nháp
                </p>
                <p class="text-2xl font-bold text-slate-900">
                  {{ jobStats.inactive + jobStats.closed }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 mb-6">
            <div class="relative flex-1">
              <span
                class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
              <input
                v-model="searchQuery"
                type="text"
                class="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                placeholder="Tìm kiếm tin tuyển dụng..."
              />
            </div>
            <select
              v-model="statusFilter"
              class="w-full sm:w-48 px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Active">Đang hiển thị</option>
              <option value="Inactive">Bản nháp</option>
              <option value="Closed">Đã đóng</option>
            </select>
          </div>

          <div
            class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div
              v-if="isLoading"
              class="flex flex-col items-center justify-center py-20"
            >
              <div
                class="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"
              ></div>
              <span class="text-slate-500 text-sm">Đang tải dữ liệu...</span>
            </div>

            <div
              v-else-if="filteredJobs.length === 0"
              class="flex flex-col items-center justify-center py-20 text-center"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/7486/7486744.png"
                alt="Empty"
                class="w-24 h-24 mb-4 opacity-50"
              />
              <h3 class="text-lg font-medium text-slate-900">
                Chưa có tin tuyển dụng nào
              </h3>
              <p class="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                Hãy tạo tin tuyển dụng mới hoặc thay đổi bộ lọc tìm kiếm của
                bạn.
              </p>
              <button
                v-if="searchQuery || statusFilter"
                @click="
                  searchQuery = '';
                  statusFilter = '';
                "
                class="mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
              >
                Xóa bộ lọc
              </button>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-[40%]"
                    >
                      Công việc / Ngành nghề
                    </th>
                    <th
                      scope="col"
                      class="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                      Mức lương
                    </th>
                    <th
                      scope="col"
                      class="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                      Trạng thái
                    </th>
                    <th
                      scope="col"
                      class="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  <tr
                    v-for="job in filteredJobs"
                    :key="job.id"
                    class="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td class="px-6 py-4 align-middle">
                      <div class="flex items-start">
                        <div
                          class="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg shadow-sm mt-1"
                        >
                          {{ job.title.charAt(0).toUpperCase() }}
                        </div>
                        <div class="ml-4 flex-1">
                          <div
                            class="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors break-words line-clamp-2 text-left"
                            :title="job.title"
                          >
                            {{ job.title }}
                          </div>
                          <div
                            class="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1 text-xs text-slate-500"
                          >
                            <span class="flex items-center gap-1">
                              <svg
                                class="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                              {{ job.categoryName || "Chưa phân loại" }}
                            </span>
                            <span class="flex items-center gap-1">
                              <svg
                                class="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {{ job.location }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td class="px-6 py-4 align-middle text-center">
                      <span
                        class="inline-block px-3 py-1 rounded bg-slate-100 text-slate-700 text-xs font-bold font-mono border border-slate-200 whitespace-nowrap"
                      >
                        {{ job.salaryRange }}
                      </span>
                    </td>

                    <td class="px-6 py-4 align-middle text-center">
                      <div class="flex flex-col items-center">
                        <span
                          class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border"
                          :class="getStatusBadge(job.status)"
                        >
                          {{ getStatusText(job.status) }}
                        </span>
                        <span class="text-[10px] text-slate-400 mt-1">
                          {{ formatDate(job.createdAt) }}
                        </span>
                      </div>
                    </td>

                    <td class="px-6 py-4 align-middle text-center">
                      <div class="flex items-center justify-center gap-2">
                        <div class="relative group/tooltip">
                          <button
                            @click="
                              router.push(`/company/jobs/${job.id}/candidates`)
                            "
                            class="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all"
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
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                          </button>
                        </div>

                        <button
                          @click="viewJobDetail(job.id)"
                          class="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>

                        <button
                          @click="editJob(job.id)"
                          class="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>

                        <button
                          @click="confirmDelete(job)"
                          class="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div
      v-if="showDetailModal && selectedJob"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-scale-in"
      >
        <div
          class="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-6 text-white shrink-0 relative"
        >
          <button
            @click="showDetailModal = false"
            class="absolute top-4 right-4 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
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
          <div class="flex items-start gap-4 pr-8">
            <div
              class="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold border border-white/30 shadow-inner"
            >
              {{ selectedJob.title.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h2 class="text-2xl font-bold leading-tight">
                {{ selectedJob.title }}
              </h2>
              <div class="flex flex-wrap items-center gap-3 mt-2 text-blue-100">
                <span class="flex items-center text-sm">
                  <svg
                    class="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  {{ selectedJob.categoryName }}
                </span>
                <span class="w-1 h-1 bg-blue-300 rounded-full"></span>
                <span class="flex items-center text-sm">
                  <svg
                    class="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {{ formatDate(selectedJob.createdAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto bg-slate-50 p-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
              <div
                class="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
              >
                <h3
                  class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3"
                >
                  Mô tả công việc
                </h3>
                <div
                  v-html="selectedJob.description"
                  class="prose prose-sm prose-slate max-w-none text-slate-700"
                ></div>
              </div>

              <div
                class="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
              >
                <h3
                  class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3"
                >
                  Yêu cầu ứng viên
                </h3>
                <div
                  v-html="selectedJob.requirements"
                  class="prose prose-sm prose-slate max-w-none text-slate-700"
                ></div>
              </div>

              <div
                class="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
              >
                <h3
                  class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3"
                >
                  Quyền lợi
                </h3>
                <div
                  v-html="selectedJob.benefits"
                  class="prose prose-sm prose-slate max-w-none text-slate-700"
                ></div>
              </div>
            </div>

            <div class="space-y-4">
              <div
                class="bg-white p-5 rounded-xl shadow-sm border border-slate-200"
              >
                <h3 class="font-bold text-slate-900 mb-4 pb-2 border-b">
                  Thông tin chung
                </h3>
                <div class="space-y-4">
                  <div>
                    <span class="text-xs text-slate-500 block mb-1"
                      >Mức lương</span
                    >
                    <span
                      class="font-mono text-blue-600 font-bold text-lg bg-blue-50 px-2 py-1 rounded"
                    >
                      {{ selectedJob.salaryRange }}
                    </span>
                  </div>
                  <div>
                    <span class="text-xs text-slate-500 block mb-1"
                      >Địa điểm</span
                    >
                    <span class="text-slate-800 font-medium">{{
                      selectedJob.location
                    }}</span>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="text-xs text-slate-500 block mb-1"
                        >Ngày làm</span
                      >
                      <span class="text-slate-800 text-sm font-medium">{{
                        selectedJob.dayOfWeek
                      }}</span>
                    </div>
                    <div>
                      <span class="text-xs text-slate-500 block mb-1"
                        >Giờ làm</span
                      >
                      <span class="text-slate-800 text-sm font-medium">{{
                        selectedJob.timeOfDay
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="bg-white p-5 rounded-xl shadow-sm border border-slate-200"
              >
                <span class="text-xs text-slate-500 block mb-2"
                  >Trạng thái hiện tại</span
                >
                <div
                  class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold border w-full justify-center"
                  :class="getStatusBadge(selectedJob.status)"
                >
                  {{ getStatusText(selectedJob.status) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3"
        >
          <button
            @click="showDetailModal = false"
            class="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Đóng
          </button>
          <button
            @click="
              showDetailModal = false;
              editJob(selectedJob.id);
            "
            class="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            Chỉnh sửa tin
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDeleteModal && jobToDelete"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-scale-in"
      >
        <div class="text-center mb-6">
          <div
            class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4"
          >
            <svg
              class="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 class="text-lg leading-6 font-bold text-slate-900">
            Xóa tin tuyển dụng?
          </h3>
          <p class="text-sm text-slate-500 mt-2">
            Bạn có chắc chắn muốn xóa tin
            <span class="font-bold text-slate-800"
              >"{{ jobToDelete.title }}"</span
            >
            không? Dữ liệu này sẽ không thể khôi phục.
          </p>
        </div>

        <div class="flex gap-3">
          <button
            @click="showDeleteModal = false"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            @click="deleteJob"
            class="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all"
          >
            Xóa ngay
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="toast.show"
      class="fixed bottom-6 right-6 z-[60] animate-fade-in-up"
    >
      <div
        class="flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-xl border-l-4"
        :class="
          toast.type === 'success' ? 'border-emerald-500' : 'border-red-500'
        "
        role="alert"
      >
        <div
          class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg"
          :class="
            toast.type === 'success'
              ? 'text-emerald-500 bg-emerald-100'
              : 'text-red-500 bg-red-100'
          "
        >
          <svg
            v-if="toast.type === 'success'"
            class="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"
            />
          </svg>
          <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z"
            />
          </svg>
        </div>
        <div class="ml-3 text-sm font-medium text-slate-800">
          {{ toast.message }}
        </div>
        <button
          @click="toast.show = false"
          type="button"
          class="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8"
        >
          <span class="sr-only">Close</span>
          <svg
            class="w-3 h-3"
            fill="none"
            viewBox="0 0 14 14"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M1 1l6 6m0 0l6 6M7 7l6-6M7 7l-6 6"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes scale-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
.animate-scale-in {
  animation: scale-in 0.2s ease-out forwards;
}

@keyframes fade-in-up {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.animate-fade-in-up {
  animation: fade-in-up 0.3s ease-out forwards;
}

/* Scrollbar tùy chỉnh cho đẹp hơn */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
