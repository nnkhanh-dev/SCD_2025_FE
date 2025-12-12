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
const invitations = ref([]);
const selectedStatus = ref("all"); // all, Pending, Accepted, Rejected
const showDetailModal = ref(false);
const selectedInvitation = ref(null);
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

const showConfirm = (title, message, onConfirm, onCancel = null) => {
  modalConfig.value = {
    title,
    message,
    type: "confirm",
    icon: "question",
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

// Stats computed
const stats = computed(() => {
  return [
    {
      title: "Tổng lời mời",
      value: invitations.value.length,
      icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Chờ phản hồi",
      value: invitations.value.filter((inv) => inv.status === "Pending").length,
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Đã chấp nhận",
      value: invitations.value.filter((inv) => inv.status === "Accepted").length,
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Đã từ chối",
      value: invitations.value.filter((inv) => inv.status === "Rejected").length,
      icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];
});

// Filtered invitations
const filteredInvitations = computed(() => {
  if (selectedStatus.value === "all") {
    return invitations.value;
  }
  return invitations.value.filter((inv) => inv.status === selectedStatus.value);
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
const fetchInvitations = async () => {
  try {
    isLoading.value = true;
    const response = await studentService.getMyInvitations();
    invitations.value = response || [];
  } catch (error) {
    console.error("Error fetching invitations:", error);
    toast.error("Không thể tải danh sách lời mời");
  } finally {
    isLoading.value = false;
  }
};

const handleRespond = async (invitation, status) => {
  if (invitation.status !== "Pending") {
    showAlert("Không thể phản hồi", "Chỉ có thể phản hồi lời mời đang chờ xử lý", "warning");
    return;
  }

  const actionText = status === "Accepted" ? "chấp nhận" : "từ chối";
  const icon = status === "Accepted" ? "success" : "error";
  
  showConfirm(
    `Xác nhận ${actionText} lời mời`,
    `Bạn có chắc muốn ${actionText} lời mời từ "${invitation.companyName}"?`,
    async () => {
      try {
        isResponding.value = true;
        await studentService.respondInvitation(invitation.id, status);
        toast.success(`Đã ${actionText} lời mời thành công`);
        await fetchInvitations(); // Refresh list
        if (showDetailModal.value) {
          showDetailModal.value = false;
        }
      } catch (error) {
        console.error("Error responding to invitation:", error);
        showAlert(
          `Lỗi ${actionText} lời mời`,
          error.response?.data?.message || `Không thể ${actionText} lời mời`,
          "error"
        );
      } finally {
        isResponding.value = false;
      }
    }
  );
};

const viewDetail = (invitation) => {
  selectedInvitation.value = invitation;
  showDetailModal.value = true;
};

// Load data on mount
onMounted(() => {
  fetchInvitations();
});
</script>

<template>
  <div class="flex h-screen bg-gray-50 font-sans">
    <StudentSidebar
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
                LỜI MỜI PHỎNG VẤN
              </h2>
              <p class="text-xs md:text-sm text-gray-500 mt-1 hidden sm:block">
                Quản lý lời mời phỏng vấn từ các công ty
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
        <div class="mb-6 flex gap-2 overflow-x-auto pb-2">
          <button
            @click="selectedStatus = 'all'"
            :class="[
              'whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all',
              selectedStatus === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200',
            ]"
          >
            Tất cả ({{ invitations.length }})
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
            Chờ phản hồi ({{ invitations.filter(i => i.status === 'Pending').length }})
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
            Đã chấp nhận ({{ invitations.filter(i => i.status === 'Accepted').length }})
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
            Đã từ chối ({{ invitations.filter(i => i.status === 'Rejected').length }})
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center items-center py-20">
          <div
            class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"
          ></div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="filteredInvitations.length === 0"
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
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            ></path>
          </svg>
          <p class="text-lg font-semibold text-gray-600 mb-2">
            {{ selectedStatus === 'all' ? 'Chưa có lời mời nào' : 'Không có lời mời phù hợp với bộ lọc' }}
          </p>
          <p class="text-sm text-gray-400">
            {{ selectedStatus === 'all' ? 'Các lời mời phỏng vấn từ công ty sẽ xuất hiện ở đây' : 'Thử chọn bộ lọc khác' }}
          </p>
        </div>

        <!-- Invitations List -->
        <div v-else class="space-y-4">
          <div
            v-for="inv in filteredInvitations"
            :key="inv.id"
            class="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group"
          >
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <!-- Job Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start gap-4">
                  <div
                    class="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0"
                  >
                    {{ inv.companyName?.charAt(0) || "C" }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3
                      class="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-1"
                    >
                      {{ inv.jobTitle }}
                    </h3>
                    <p class="text-sm text-gray-600 mb-2">
                      <span class="font-semibold">{{ inv.companyName }}</span> mời bạn phỏng vấn
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
                        Nhận lời mời: {{ formatDate(inv.createdAt) }}
                      </span>
                      <span
                        v-if="inv.updatedAt !== inv.createdAt"
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
                        Phản hồi: {{ formatDate(inv.updatedAt) }}
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
                    getStatusColor(inv.status),
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
                      :d="getStatusIcon(inv.status)"
                    />
                  </svg>
                  {{ getStatusText(inv.status) }}
                </div>

                <div class="flex gap-2">
                  <button
                    @click="viewDetail(inv)"
                    class="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Xem chi tiết
                  </button>
                  <button
                    v-if="inv.status === 'Pending'"
                    @click="handleRespond(inv, 'Accepted')"
                    :disabled="isResponding"
                    class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Chấp nhận
                  </button>
                  <button
                    v-if="inv.status === 'Pending'"
                    @click="handleRespond(inv, 'Rejected')"
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
        v-if="showDetailModal && selectedInvitation"
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
          <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-pink-50">
            <h3 class="text-xl font-bold text-gray-900">Chi tiết lời mời</h3>
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
            <!-- Company & Job Info -->
            <div class="flex items-start gap-4">
              <div
                class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md"
              >
                {{ selectedInvitation.companyName?.charAt(0) || "C" }}
              </div>
              <div class="flex-1">
                <h4 class="text-lg font-bold text-gray-900">
                  {{ selectedInvitation.jobTitle }}
                </h4>
                <p class="text-gray-600">{{ selectedInvitation.companyName }}</p>
              </div>
            </div>

            <!-- Status -->
            <div>
              <label class="block text-sm font-semibold text-gray-500 mb-2">Trạng thái</label>
              <div
                :class="[
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border',
                  getStatusColor(selectedInvitation.status),
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
                    :d="getStatusIcon(selectedInvitation.status)"
                  />
                </svg>
                {{ getStatusText(selectedInvitation.status) }}
              </div>
            </div>

            <!-- Timeline -->
            <div>
              <label class="block text-sm font-semibold text-gray-500 mb-3">Lịch sử</label>
              <div class="space-y-3">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">Nhận lời mời phỏng vấn</p>
                    <p class="text-sm text-gray-500">{{ formatDate(selectedInvitation.createdAt) }}</p>
                  </div>
                </div>

                <div
                  v-if="selectedInvitation.updatedAt !== selectedInvitation.createdAt"
                  class="flex items-start gap-3"
                >
                  <div
                    :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                      selectedInvitation.status === 'Accepted' ? 'bg-green-100' : 'bg-red-100',
                    ]"
                  >
                    <svg
                      :class="['w-4 h-4', selectedInvitation.status === 'Accepted' ? 'text-green-600' : 'text-red-600']"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        :d="getStatusIcon(selectedInvitation.status)"
                      />
                    </svg>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">
                      {{ selectedInvitation.status === 'Accepted' ? 'Đã chấp nhận lời mời' : 'Đã từ chối lời mời' }}
                    </p>
                    <p class="text-sm text-gray-500">{{ formatDate(selectedInvitation.updatedAt) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Additional Info -->
            <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label class="block text-xs font-semibold text-gray-500 mb-1">ID lời mời</label>
                <p class="text-sm font-medium text-gray-900">#{{ selectedInvitation.id }}</p>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 mb-1">Loại</label>
                <p class="text-sm font-medium text-gray-900">Invitation</p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
            <button
              v-if="selectedInvitation.status === 'Pending'"
              @click="handleRespond(selectedInvitation, 'Accepted')"
              :disabled="isResponding"
              class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              Chấp nhận
            </button>
            <button
              v-if="selectedInvitation.status === 'Pending'"
              @click="handleRespond(selectedInvitation, 'Rejected')"
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
