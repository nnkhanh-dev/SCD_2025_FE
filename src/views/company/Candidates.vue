<script setup>
import { ref, onMounted, computed } from "vue";
import { toast } from "vue3-toastify";
import CompanySidebar from "@/common/company/sidebar.vue";
import { companyService } from "@/services/company/companyService";

// --- STATE QUẢN LÝ MOBILE SIDEBAR ---
const isSidebarOpen = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// --- STATE MANAGEMENT ---
const isLoading = ref(false);
const applications = ref([]);
const selectedStatus = ref("all"); // all, Pending, Accepted, Rejected
const selectedJob = ref("all"); // all, or jobId
const showDetailModal = ref(false);
const selectedApplication = ref(null);
const isResponding = ref(false);

// Custom Modal state
const showCustomModal = ref(false);
const modalConfig = ref({
  title: "",
  message: "",
  type: "confirm",
  icon: "question",
  confirmText: "Xác nhận",
  cancelText: "Hủy",
  onConfirm: null,
  onCancel: null,
});

const showConfirm = (title, message, onConfirm, onCancel = null, icon = "question") => {
  modalConfig.value = {
    title,
    message,
    type: "confirm",
    icon,
    confirmText: "Xác nhận",
    cancelText: "Hủy",
    onConfirm,
    onCancel,
  };
  showCustomModal.value = true;
};

const showAlert = (title, message, icon = "error") => {
  modalConfig.value = {
    title,
    message,
    type: "alert",
    icon,
    confirmText: "Đóng",
    onConfirm: null,
    onCancel: null,
  };
  showCustomModal.value = true;
};

const handleModalConfirm = () => {
  showCustomModal.value = false;
  if (modalConfig.value.onConfirm) {
    modalConfig.value.onConfirm();
  }
};

const handleModalCancel = () => {
  showCustomModal.value = false;
  if (modalConfig.value.onCancel) {
    modalConfig.value.onCancel();
  }
};

// Get unique jobs from applications
const jobs = computed(() => {
  const uniqueJobs = new Map();
  applications.value.forEach((app) => {
    if (!uniqueJobs.has(app.jobId)) {
      uniqueJobs.set(app.jobId, {
        id: app.jobId,
        title: app.jobTitle,
      });
    }
  });
  return Array.from(uniqueJobs.values());
});

// Stats computed
const stats = computed(() => {
  return [
    {
      title: "Tổng ứng viên",
      value: applications.value.length,
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Chờ phản hồi",
      value: applications.value.filter((app) => app.status === "Pending").length,
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Đã chấp nhận",
      value: applications.value.filter((app) => app.status === "Accepted").length,
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Đã từ chối",
      value: applications.value.filter((app) => app.status === "Rejected").length,
      icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];
});

// Filtered applications
const filteredApplications = computed(() => {
  let filtered = applications.value;

  // Filter by status
  if (selectedStatus.value !== "all") {
    filtered = filtered.filter((app) => app.status === selectedStatus.value);
  }

  // Filter by job
  if (selectedJob.value !== "all") {
    filtered = filtered.filter((app) => app.jobId === parseInt(selectedJob.value));
  }

  return filtered;
});

// Helper functions
const getStatusColor = (status) => {
  const colors = {
    Pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Accepted: "bg-green-50 text-green-700 border-green-200",
    Rejected: "bg-red-50 text-red-700 border-red-200",
  };
  return colors[status] || "bg-gray-50 text-gray-700 border-gray-200";
};

const getStatusIcon = (status) => {
  const icons = {
    Pending: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    Accepted: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    Rejected: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  };
  return icons[status] || "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
};

const getStatusText = (status) => {
  const texts = {
    Pending: "Chờ phản hồi",
    Accepted: "Đã chấp nhận",
    Rejected: "Đã từ chối",
  };
  return texts[status] || status;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// API Actions
const fetchApplications = async () => {
  try {
    isLoading.value = true;
    const response = await companyService.getAllReceivedApplications();
    applications.value = response || [];
  } catch (error) {
    console.error("Error fetching applications:", error);
    toast.error("Không thể tải danh sách ứng viên");
  } finally {
    isLoading.value = false;
  }
};

const handleRespond = async (application, status) => {
  if (application.status !== "Pending") {
    showAlert("Không thể phản hồi", "Chỉ có thể phản hồi đơn đang chờ xử lý", "warning");
    return;
  }

  const actionText = status === "Accepted" ? "chấp nhận" : "từ chối";
  const icon = status === "Accepted" ? "success" : "error";
  
  showConfirm(
    `Xác nhận ${actionText} ứng viên`,
    `Bạn có chắc muốn ${actionText} ứng viên "${application.studentName}"?`,
    async () => {
      try {
        isResponding.value = true;
        
        // Dùng API riêng cho Accept/Reject (không cần body)
        if (status === "Accepted") {
          await companyService.acceptApplication(application.id);
        } else {
          await companyService.rejectApplication(application.id);
        }
        
        toast.success(`Đã ${actionText} ứng viên thành công`);
        await fetchApplications(); // Refresh list
        if (showDetailModal.value) {
          showDetailModal.value = false;
        }
      } catch (error) {
        console.error("Error responding to application:", error);
        showAlert(
          `Lỗi ${actionText} ứng viên`,
          error.response?.data?.message || `Không thể ${actionText} ứng viên`,
          "error"
        );
      } finally {
        isResponding.value = false;
      }
    },
    null,
    icon  // ← Truyền icon (success/error) vào showConfirm
  );
};

const viewDetail = (application) => {
  selectedApplication.value = application;
  showDetailModal.value = true;
};

// Load data on mount
onMounted(() => {
  fetchApplications();
});
</script>

<template>
  <div class="flex h-screen bg-gray-50 font-sans">
    <CompanySidebar
      :is-open="isSidebarOpen"
      @close-sidebar="isSidebarOpen = false"
    />

    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
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
              <h2 class="text-xl md:text-2xl font-bold text-gray-900">
                QUẢN LÝ ỨNG VIÊN
              </h2>
              <p class="text-xs md:text-sm text-gray-500 mt-1 hidden sm:block">
                Danh sách ứng viên đã ứng tuyển vào các vị trí của công ty
              </p>
            </div>
          </div>
        </div>
      </header>

      <main
        class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-8"
      >
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div
            v-for="(stat, index) in stats"
            :key="index"
            class="bg-white border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="text-gray-500 text-xs md:text-sm font-medium">{{
                stat.title
              }}</span>
              <div :class="['p-2 rounded-lg', stat.bgColor]">
                <svg
                  :class="['w-5 h-5', stat.color]"
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
            <h3 class="text-2xl md:text-3xl font-bold text-gray-900">
              {{ stat.value }}
            </h3>
          </div>
        </div>

        <!-- Filters -->
        <div class="mb-6 flex flex-col md:flex-row gap-4">
          <!-- Status Filter -->
          <div class="flex gap-2 overflow-x-auto pb-2 flex-1">
            <button
              @click="selectedStatus = 'all'"
              :class="[
                'whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all',
                selectedStatus === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200',
              ]"
            >
              Tất cả ({{ applications.length }})
            </button>
            <button
              @click="selectedStatus = 'Pending'"
              :class="[
                'whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all',
                selectedStatus === 'Pending'
                  ? 'bg-yellow-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200',
              ]"
            >
              Chờ phản hồi ({{ applications.filter(a => a.status === 'Pending').length }})
            </button>
            <button
              @click="selectedStatus = 'Accepted'"
              :class="[
                'whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all',
                selectedStatus === 'Accepted'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200',
              ]"
            >
              Đã chấp nhận ({{ applications.filter(a => a.status === 'Accepted').length }})
            </button>
            <button
              @click="selectedStatus = 'Rejected'"
              :class="[
                'whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all',
                selectedStatus === 'Rejected'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200',
              ]"
            >
              Đã từ chối ({{ applications.filter(a => a.status === 'Rejected').length }})
            </button>
          </div>

          <!-- Job Filter -->
          <select
            v-model="selectedJob"
            class="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          >
            <option value="all">Tất cả vị trí</option>
            <option v-for="job in jobs" :key="job.id" :value="job.id">
              {{ job.title }}
            </option>
          </select>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center items-center py-20">
          <div
            class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"
          ></div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="filteredApplications.length === 0"
          class="text-center py-20 bg-white rounded-2xl border border-gray-200"
        >
          <svg
            class="w-20 h-20 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            ></path>
          </svg>
          <p class="text-lg font-semibold text-gray-600 mb-2">
            {{ selectedStatus === 'all' && selectedJob === 'all' ? 'Chưa có ứng viên nào' : 'Không có ứng viên phù hợp với bộ lọc' }}
          </p>
          <p class="text-sm text-gray-400">
            {{ selectedStatus === 'all' && selectedJob === 'all' ? 'Các ứng viên sẽ xuất hiện ở đây khi họ ứng tuyển' : 'Thử chọn bộ lọc khác' }}
          </p>
        </div>

        <!-- Applications List -->
        <div v-else class="space-y-4">
          <div
            v-for="app in filteredApplications"
            :key="app.id"
            class="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group"
          >
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <!-- Candidate Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start gap-4">
                  <div
                    class="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0"
                  >
                    {{ app.studentName?.charAt(0) || "U" }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3
                      class="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1"
                    >
                      {{ app.studentName }}
                    </h3>
                    <p class="text-sm text-gray-600 mb-2">
                      Ứng tuyển: <span class="font-semibold">{{ app.jobTitle }}</span>
                    </p>
                    <div class="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span class="flex items-center gap-1">
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Nộp đơn: {{ formatDate(app.createdAt) }}
                      </span>
                      <span
                        v-if="app.updatedAt !== app.createdAt"
                        class="flex items-center gap-1"
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
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Phản hồi: {{ formatDate(app.updatedAt) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Status & Actions -->
              <div class="flex flex-col md:flex-row items-start md:items-center gap-3">
                <div
                  :class="[
                    'px-4 py-2 rounded-lg text-sm font-bold border flex items-center gap-2',
                    getStatusColor(app.status),
                  ]"
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
                      :d="getStatusIcon(app.status)"
                    />
                  </svg>
                  {{ getStatusText(app.status) }}
                </div>

                <div class="flex gap-2">
                  <button
                    @click="viewDetail(app)"
                    class="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Xem chi tiết
                  </button>
                  <button
                    v-if="app.status === 'Pending'"
                    @click="handleRespond(app, 'Accepted')"
                    :disabled="isResponding"
                    class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Chấp nhận
                  </button>
                  <button
                    v-if="app.status === 'Pending'"
                    @click="handleRespond(app, 'Rejected')"
                    :disabled="isResponding"
                    class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div
        v-if="showDetailModal && selectedApplication"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <div
          class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
          @click="showDetailModal = false"
        ></div>
        <div
          class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden animate-fade-in-up"
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50">
            <h3 class="text-xl font-bold text-gray-900">Chi tiết ứng viên</h3>
            <button
              @click="showDetailModal = false"
              class="p-2 rounded-full hover:bg-white/50 text-gray-400 hover:text-gray-600 transition-colors"
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

          <!-- Content -->
          <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <!-- Candidate Info -->
            <div class="flex items-start gap-4">
              <div
                class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md"
              >
                {{ selectedApplication.studentName?.charAt(0) || "U" }}
              </div>
              <div class="flex-1">
                <h4 class="text-lg font-bold text-gray-900">
                  {{ selectedApplication.studentName }}
                </h4>
                <p class="text-gray-600">Ứng tuyển: {{ selectedApplication.jobTitle }}</p>
              </div>
            </div>

            <!-- Status -->
            <div>
              <label class="block text-sm font-semibold text-gray-500 mb-2">Trạng thái</label>
              <div
                :class="[
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border',
                  getStatusColor(selectedApplication.status),
                ]"
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
                    :d="getStatusIcon(selectedApplication.status)"
                  />
                </svg>
                {{ getStatusText(selectedApplication.status) }}
              </div>
            </div>

            <!-- Timeline -->
            <div>
              <label class="block text-sm font-semibold text-gray-500 mb-3">Lịch sử</label>
              <div class="space-y-3">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">Nộp đơn ứng tuyển</p>
                    <p class="text-sm text-gray-500">{{ formatDate(selectedApplication.createdAt) }}</p>
                  </div>
                </div>

                <div
                  v-if="selectedApplication.updatedAt !== selectedApplication.createdAt"
                  class="flex items-start gap-3"
                >
                  <div
                    :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                      selectedApplication.status === 'Accepted' ? 'bg-green-100' : 'bg-red-100',
                    ]"
                  >
                    <svg
                      :class="['w-4 h-4', selectedApplication.status === 'Accepted' ? 'text-green-600' : 'text-red-600']"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        :d="getStatusIcon(selectedApplication.status)"
                      />
                    </svg>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">
                      {{ selectedApplication.status === 'Accepted' ? 'Đơn được chấp nhận' : 'Đơn bị từ chối' }}
                    </p>
                    <p class="text-sm text-gray-500">{{ formatDate(selectedApplication.updatedAt) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Additional Info -->
            <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label class="block text-xs font-semibold text-gray-500 mb-1">ID đơn ứng tuyển</label>
                <p class="text-sm font-medium text-gray-900">#{{ selectedApplication.id }}</p>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 mb-1">Loại</label>
                <p class="text-sm font-medium text-gray-900">Application</p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
            <button
              v-if="selectedApplication.status === 'Pending'"
              @click="handleRespond(selectedApplication, 'Accepted')"
              :disabled="isResponding"
              class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              Chấp nhận
            </button>
            <button
              v-if="selectedApplication.status === 'Pending'"
              @click="handleRespond(selectedApplication, 'Rejected')"
              :disabled="isResponding"
              class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              Từ chối
            </button>
            <button
              @click="showDetailModal = false"
              class="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Custom Confirm/Alert Modal -->
    <Teleport to="body">
      <div
        v-if="showCustomModal"
        class="fixed inset-0 z-[10001] flex items-center justify-center p-4 animate-fade-in"
      >
        <div
          class="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
          @click="handleModalCancel"
        ></div>
        <div
          class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scale-in"
        >
          <!-- Header with Icon -->
          <div class="p-6 pb-4">
            <div class="flex items-start gap-4">
              <!-- Icon -->
              <div
                :class="[
                  'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                  modalConfig.icon === 'question' ? 'bg-blue-100' : '',
                  modalConfig.icon === 'error' ? 'bg-red-100' : '',
                  modalConfig.icon === 'success' ? 'bg-green-100' : '',
                  modalConfig.icon === 'warning' ? 'bg-yellow-100' : '',
                ]"
              >
                <svg
                  v-if="modalConfig.icon === 'question'"
                  class="w-6 h-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <svg
                  v-if="modalConfig.icon === 'error'"
                  class="w-6 h-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <svg
                  v-if="modalConfig.icon === 'success'"
                  class="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <svg
                  v-if="modalConfig.icon === 'warning'"
                  class="w-6 h-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              
              <!-- Content -->
              <div class="flex-1">
                <h3 class="text-lg font-bold text-slate-900 mb-1">
                  {{ modalConfig.title }}
                </h3>
                <p class="text-sm text-slate-600 leading-relaxed">
                  {{ modalConfig.message }}
                </p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div
            class="px-6 py-4 bg-slate-50 rounded-b-2xl flex gap-3 justify-end border-t border-slate-100"
          >
            <button
              v-if="modalConfig.type === 'confirm'"
              @click="handleModalCancel"
              class="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {{ modalConfig.cancelText }}
            </button>
            <button
              @click="handleModalConfirm"
              :class="[
                'px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all shadow-lg',
                modalConfig.icon === 'question' || modalConfig.icon === 'success'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                  : '',
                modalConfig.icon === 'error'
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                  : '',
                modalConfig.icon === 'warning'
                  ? 'bg-yellow-600 hover:bg-yellow-700 shadow-yellow-500/30'
                  : '',
              ]"
            >
              {{ modalConfig.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

body {
  font-family: "Inter", sans-serif;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out forwards;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-fade-in {
  animation: fade-in 0.2s ease-out forwards;
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-scale-in {
  animation: scale-in 0.2s ease-out forwards;
}
</style>
