<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
// Import thư viện PDF & Excel
import VuePdfEmbed from "vue-pdf-embed";
import * as XLSX from "xlsx";

// --- 1. IMPORTS SERVICES ---
import { jobService } from "@/services/company/jobService";
import { companyService } from "@/services/company/companyService";
import { studentService } from "@/services/student/studentService";
import CompanySidebar from "@/common/company/sidebar.vue";
import { toast } from "vue3-toastify";

const router = useRouter();
const route = useRoute();

// --- 2. LAYOUT STATE ---
const isSidebarOpen = ref(false);
const currentHour = new Date().getHours();
const greeting = computed(() => {
  if (currentHour < 12) return "Chào buổi sáng";
  if (currentHour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
});

// --- 3. STATE QUẢN LÝ DỮ LIỆU ---
const activeTab = ref("students");
const students = ref([]);
const isLoading = ref(false);
const jobId = route.params.id || 1;

// State cho Modal Chi tiết
const showDetailModal = ref(false);
const selectedStudentDetail = ref(null);
const isLoadingDetail = ref(false);

// State expand card (hover nhỏ)
const expandedStudentId = ref(null);

// State cho PDF Viewer
const showPdfModal = ref(false);
const pdfUrl = ref("");
const isPdfLoading = ref(false);
const pdfPage = ref(1);
const pdfPageCount = ref(1);

// State cho Custom Modal (Alert/Confirm)
const showCustomModal = ref(false);
const modalConfig = ref({
  title: "",
  message: "",
  type: "confirm", // "confirm" or "alert"
  icon: "question", // "question", "error", "success", "warning"
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

// --- 4. HÀM MAPPING DATA ---
const mapStudentData = (apiData) => {
  return apiData.map((item) => {
    const score = item.similarityScore || 0;
    let matchColor = "blue";
    if (score >= 80) matchColor = "green";
    else if (score >= 50) matchColor = "yellow";

    return {
      id: item.id,
      name: item.name,
      match: score,
      matchColor: matchColor,
      badgeClass: `bg-${matchColor}-100 text-${matchColor}-700`,
      major: item.major,
      year: item.yearOfStudy,
      gpa: item.gpa,
      avatar:
        item.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          item.name
        )}&background=random`,
      certificates: item.certifications,
      achievements: item.archievements,
      experience: item.experiences,
      projects: item.projects,
      resumeUrl: item.resumeUrl,
      isStarred: false, // Default state
    };
  });
};

// --- 5. GỌI API ---
const fetchCandidates = async () => {
  isLoading.value = true;
  try {
    const response = await jobService.getCandidateSuggestions(jobId);
    const data = response.data || response;
    students.value = mapStudentData(data);
  } catch (error) {
    console.error("Lỗi tải ứng viên:", error);
  } finally {
    isLoading.value = false;
  }
};

const openStudentDetailParams = async (id) => {
  showDetailModal.value = true;
  isLoadingDetail.value = true;
  selectedStudentDetail.value = null;

  try {
    const response = await studentService.getStudentById(id);
    selectedStudentDetail.value = response.data || response;
  } catch (error) {
    console.error("Lỗi tải chi tiết:", error);
    showAlert("Lỗi tải dữ liệu", "Không thể tải thông tin chi tiết ứng viên.", "error");
    showDetailModal.value = false;
  } finally {
    isLoadingDetail.value = false;
  }
};

onMounted(() => {
  fetchCandidates();
});

// --- 6. LOGIC UI ---
const handleExpand = (id) => {
  expandedStudentId.value = expandedStudentId.value === id ? null : id;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedStudentDetail.value = null;
};

// --- 7. LOGIC PDF ---
const openPdfViewer = (url) => {
  if (!url) {
    showAlert("CV không khả dụng", "Ứng viên này chưa cập nhật CV.", "warning");
    return;
  }
  pdfUrl.value = url;
  showPdfModal.value = true;
  isPdfLoading.value = true;
  pdfPage.value = 1;
};

const closePdfViewer = () => {
  showPdfModal.value = false;
  pdfUrl.value = "";
  // Không cần đóng Modal Detail, nó sẽ hiện lại
};

const handlePdfLoaded = (doc) => {
  isPdfLoading.value = false;
  pdfPageCount.value = doc.numPages;
};

const handlePdfError = () => {
  isPdfLoading.value = false;
  showAlert("Lỗi tải PDF", "Không thể tải file PDF. Có thể do lỗi mạng hoặc file hỏng.", "error");
  closePdfViewer();
};

// --- 8. LOGIC EXCEL ---
const exportToExcel = () => {
  if (students.value.length === 0) {
    showAlert("Không có dữ liệu", "Không có dữ liệu để xuất!", "warning");
    return;
  }

  const dataToExport = students.value.map((s) => ({
    ID: s.id,
    "Họ tên": s.name,
    Ngành: s.major,
    Năm: s.year,
    GPA: s.gpa,
    "Độ phù hợp": `${s.match}%`,
    "Kinh nghiệm": s.experience,
    "Dự án": s.projects,
    "CV Link": s.resumeUrl || "N/A",
  }));

  const ws = XLSX.utils.json_to_sheet(dataToExport);

  // Chỉnh độ rộng cột
  ws["!cols"] = [
    { wch: 5 }, // ID
    { wch: 25 }, // Name
    { wch: 25 }, // Major
    { wch: 5 }, // Year
    { wch: 5 }, // GPA
    { wch: 10 }, // Match
    { wch: 40 }, // Exp
    { wch: 40 }, // Project
    { wch: 30 }, // Link
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ứng viên");
  XLSX.writeFile(wb, `Danh_sach_ung_vien_Job_${jobId}.xlsx`);
};

// --- 9. PAGINATION & ACTIONS ---
const itemsPerPage = 20;
const currentPage = ref(1);
const totalPages = computed(
  () => Math.ceil(students.value.length / itemsPerPage) || 1
);

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return students.value.slice(start, end);
});

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    const listElement = document.querySelector("main");
    if (listElement) listElement.scrollTop = 0;
  }
};

const isSendingInvitation = ref(false);

const sendInvitation = (student) => {
  showConfirm(
    "Xác nhận gửi lời mời",
    `Bạn có chắc muốn gửi lời mời phỏng vấn cho "${student.name}"?`,
    async () => {
      try {
        isSendingInvitation.value = true;
        const studentDetail = await studentService.getStudentById(student.id);
        const studentUserId = studentDetail.userId || studentDetail.data?.userId;
        
        if (!studentUserId) {
          toast.error("Không thể lấy thông tin ứng viên");
          return;
        }

        await companyService.sendInvitation(studentUserId, jobId);
        toast.success(`Đã gửi lời mời phỏng vấn cho ${student.name}`);
      } catch (error) {
        console.error("Error sending invitation:", error);
        const errorMessage = error.response?.data?.message || "Không thể gửi lời mời phỏng vấn";
        toast.error(errorMessage);
      } finally {
        isSendingInvitation.value = false;
      }
    }
  );
};

const handleAction = (action, studentName) => {
  showAlert("Thao tác", `Đang thực hiện: ${action} - Ứng viên: ${studentName}`, "success");
};

const toggleStar = (student, event) => {
  event.stopPropagation();
  student.isStarred = !student.isStarred;
};

const onLogout = () => {
  showConfirm(
    "Xác nhận đăng xuất",
    "Bạn có chắc muốn đăng xuất?",
    () => {
      console.log("Logged out");
    }
  );
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
      <main
        class="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC] relative"
      >
        <div class="relative mb-24">
          <div
            class="bg-gradient-to-r from-blue-600 to-indigo-700 py-8 px-4 sm:px-6 lg:px-8"
          >
            <div
              class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6"
            >
              <div>
                <h1 class="text-3xl font-bold text-white mb-2">
                  Sinh viên phù hợp
                </h1>
                <p class="text-blue-100">
                  {{ greeting }}, tìm kiếm nhân tài ngay hôm nay! 🚀
                </p>
              </div>

              <div
                class="flex items-center gap-3 sm:gap-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 pr-6"
              >
                <div class="flex items-center gap-3 opacity-60">
                  <div
                    class="w-8 h-8 rounded-lg bg-blue-800/50 flex items-center justify-center border border-white/10"
                  >
                    <svg
                      class="w-4 h-4 text-blue-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <span
                    class="text-sm font-medium text-blue-100 hidden sm:block"
                    >Tạo đơn tuyển dụng</span
                  >
                </div>
                <svg
                  class="w-5 h-5 text-blue-300/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shadow-lg shadow-black/5 border border-white/30"
                  >
                    <svg
                      class="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path
                        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                      />
                    </svg>
                  </div>
                  <span class="text-sm font-bold text-white"
                    >Tìm ứng viên phù hợp</span
                  >
                </div>
              </div>
            </div>
          </div>

          <div
            class="absolute -bottom-12 left-0 right-0 px-16 sm:px-18 lg:px-20"
          >
            <div class="max-w-7xl mx-auto">
              <div
                class="bg-white rounded-xl shadow-lg shadow-slate-200/50 p-4 border border-slate-100"
              >
                <div class="flex flex-wrap gap-4 items-center">
                  <button
                    @click="activeTab = 'students'"
                    class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    :class="
                      activeTab === 'students'
                        ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                        : 'text-slate-600 hover:bg-slate-50'
                    "
                  >
                    <svg
                      class="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"
                      />
                    </svg>
                    <span>Tất cả</span>
                    <span
                      class="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs"
                      >{{ students.length }}</span
                    >
                  </button>
                  <button
                    @click="activeTab = 'shortlisted'"
                    class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    :class="
                      activeTab === 'shortlisted'
                        ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200'
                        : 'text-slate-600 hover:bg-slate-50'
                    "
                  >
                    <svg
                      class="w-5 h-5 text-amber-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                    <span>Đã lưu</span>
                    <span
                      class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs"
                      >0</span
                    >
                  </button>

                  <div
                    class="ml-auto flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0"
                  >
                    <button
                      @click="exportToExcel"
                      class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
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
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        ></path>
                      </svg>
                      Xuất Excel
                    </button>

                    <select
                      class="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                    >
                      <option>Độ phù hợp giảm dần</option>
                      <option>GPA cao nhất</option>
                      <option>Mới cập nhật</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="px-16 sm:px-18 lg:px-20 pb-12">
          <div class="max-w-7xl mx-auto">
            <div v-if="isLoading" class="flex justify-center items-center h-64">
              <div
                class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
              ></div>
            </div>

            <div v-else-if="students.length === 0" class="text-center py-12">
              <p class="text-slate-500">
                Chưa tìm thấy ứng viên phù hợp cho công việc này.
              </p>
            </div>

            <div
              v-else
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-8"
            >
              <div
                v-for="(student, index) in paginatedStudents"
                :key="student.id"
                class="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full relative"
                :style="{ zIndex: paginatedStudents.length - index }"
                @mouseleave="expandedStudentId = null"
              >
                <div
                  class="w-full h-full overflow-hidden relative p-6 flex flex-col"
                >
                  <div
                    class="absolute inset-0 bg-white z-[50] transition-all duration-700 ease-in-out rounded-2xl"
                    :class="
                      expandedStudentId === student.id
                        ? '[clip-path:circle(150%_at_100%_100%)]'
                        : '[clip-path:circle(0%_at_100%_100%)]'
                    "
                  >
                    <div
                      class="p-6 flex flex-col gap-4 h-full transition-opacity duration-500 delay-300"
                      :class="
                        expandedStudentId === student.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      "
                    >
                      <div
                        class="space-y-3 overflow-y-auto flex-1 custom-scrollbar"
                      >
                        <div>
                          <h5
                            class="text-xs font-bold text-blue-600 uppercase mb-1 flex items-center gap-1"
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
                                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            Kinh nghiệm
                          </h5>
                          <p
                            class="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-3"
                          >
                            {{ student.experience || "Chưa cập nhật" }}
                          </p>
                        </div>
                        <div>
                          <h5
                            class="text-xs font-bold text-purple-600 uppercase mb-1 flex items-center gap-1"
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
                                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                              />
                            </svg>
                            Dự án
                          </h5>
                          <p
                            class="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-3"
                          >
                            {{ student.projects || "Chưa cập nhật" }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="flex justify-between mb-2 items-center gap-2">
                    <button
                      class="p-1 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
                      @click="toggleStar(student, $event)"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 transition-colors duration-200"
                        :class="
                          student.isStarred
                            ? 'text-yellow-400 fill-current'
                            : 'text-slate-300 hover:text-yellow-400'
                        "
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                    <div
                      class="text-xs px-2.5 py-1 rounded-full font-bold shadow-sm"
                      :class="student.badgeClass"
                    >
                      {{ Number(student.match).toFixed(1) * 100 }}%
                    </div>
                  </div>

                  <div class="flex items-center gap-4 mb-5">
                    <div class="relative flex-none">
                      <img
                        :src="student.avatar"
                        :alt="student.name"
                        class="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform"
                      />
                      <div
                        class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"
                      ></div>
                    </div>
                    <div class="min-w-0">
                      <h3
                        class="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-start line-clamp-2"
                      >
                        {{ student.name }}
                      </h3>
                    </div>
                  </div>

                  <div class="flex-1 space-y-3">
                    <div class="flex justify-start gap-2">
                      <p
                        class="text-sm text-slate-500 truncate"
                        :title="student.major"
                      >
                        {{ student.major }}
                      </p>
                    </div>
                    <div class="flex items-center text-sm text-slate-600">
                      <span class="font-medium mr-2"
                        >Năm: {{ student.year }}</span
                      >
                      <span
                        class="w-1 h-1 bg-slate-300 rounded-full mr-2"
                      ></span>
                      <span class="font-medium text-slate-800"
                        >GPA: {{ student.gpa }}</span
                      >
                    </div>
                    <div class="flex flex-wrap gap-2 pt-1">

                      <!-- Certificates -->
                      <template v-if="student.certificates">
                        <span
                          v-for="(c, index) in student.certificates.split(';')"
                          :key="'cert-' + index"
                          class="inline-block px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 truncate max-w-[45%]"
                        >
                          {{ c.trim() }}
                        </span>
                      </template>

                      <!-- Achievements -->
                      <template v-if="student.achievements">
                        <span
                          v-for="(a, index) in student.achievements.split(';')"
                          :key="'ach-' + index"
                          class="inline-block px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 truncate max-w-[45%]"
                        >
                          {{ a.trim() }}
                        </span>
                      </template>
                    </div>
                  </div>
                </div>

                <div
                  class="flex flex-col gap-2 shrink-0 absolute -right-20 bottom-5 transition-all duration-200 z-[60] pl-2 w-26"
                >
                  <button
                    @click.stop="openStudentDetailParams(student.id)"
                    class="group/btn w-8 hover:w-26 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-r-lg shadow-lg hover:bg-slate-50 hover:text-blue-600 transition-all duration-300 flex items-center relative justify-start px-2 overflow-hidden whitespace-nowrap cursor-pointer"
                  >
                    <svg
                      class="w-4 h-4 shrink-0 absolute left-2 top-1/2 -translate-y-1/2 group-hover/btn:left-[calc(100%-1.5rem)] transition-all duration-300 ease-in-out"
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
                    <span
                      class="opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                      >Chi tiết</span
                    >
                  </button>

                  <button
                    @click.stop="openPdfViewer(student.resumeUrl)"
                    class="group/btn w-8 hover:w-26 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-r-lg shadow-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all duration-300 flex items-center relative justify-start px-2 overflow-hidden whitespace-nowrap cursor-pointer"
                  >
                    <svg
                      class="w-4 h-4 shrink-0 absolute left-2 top-1/2 -translate-y-1/2 group-hover/btn:left-[calc(100%-1.5rem)] transition-all duration-300 ease-in-out"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span
                      class="opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                      >Xem CV</span
                    >
                  </button>

                  <button
                    @click.stop="sendInvitation(student)"
                    :disabled="isSendingInvitation"
                    class="group/btn w-8 hover:w-26 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-r-lg shadow-lg hover:bg-green-50 hover:text-green-600 hover:border-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center relative justify-start px-2 overflow-hidden whitespace-nowrap cursor-pointer"
                  >
                    <svg
                      class="w-4 h-4 shrink-0 absolute left-2 top-1/2 -translate-y-1/2 group-hover/btn:left-[calc(100%-1.5rem)] transition-all duration-300 ease-in-out"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                    <span
                      class="opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                      >{{ isSendingInvitation ? 'Đang gửi...' : 'Tuyển dụng' }}</span
                    >
                  </button>
                </div>
              </div>
            </div>

            <div
              v-if="!isLoading && students.length > 0"
              class="flex justify-center items-center gap-2 mt-12"
            >
              <button
                @click="changePage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
              <button
                v-for="page in totalPages"
                :key="page"
                @click="changePage(page)"
                class="w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-all"
                :class="
                  currentPage === page
                    ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30'
                    : 'border border-slate-200 hover:bg-white hover:shadow-sm text-slate-600'
                "
              >
                {{ page }}
              </button>
              <button
                @click="changePage(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>

    <Teleport to="body">
      <div
        v-if="showDetailModal"
        class="fixed inset-0 z-[9999] overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          @click="closeDetailModal"
        ></div>
        <div
          class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0"
        >
          <div
            class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-slate-100"
          >
            <div
              v-if="isLoadingDetail"
              class="p-12 flex flex-col items-center justify-center"
            >
              <div
                class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"
              ></div>
              <p class="text-slate-500">Đang tải hồ sơ ứng viên...</p>
            </div>
            <div v-else-if="selectedStudentDetail" class="bg-white">
              <div
                class="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 relative"
              >
                <button
                  @click="closeDetailModal"
                  class="absolute top-4 right-4 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-2 transition-colors"
                >
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
              <div class="px-8 pb-8">
                <div
                  class="relative flex flex-col sm:flex-row items-end sm:items-center -mt-12 mb-6 gap-6"
                >
                  <img
                    :src="
                      selectedStudentDetail.resumeUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        selectedStudentDetail.name
                      )}&size=128`
                    "
                    class="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white object-cover"
                  />
                  <div class="mb-2">
                    <h2 class="text-2xl font-bold text-slate-800 text-white">
                      {{ selectedStudentDetail.name }}
                    </h2>
                    <div
                      class="flex flex-wrap items-center gap-3 text-sm text-slate-600 mt-1"
                    >
                      <span class="flex items-center gap-1">
                        <svg
                          class="w-4 h-4 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        {{ selectedStudentDetail.major }}
                      </span>
                      <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span>Năm {{ selectedStudentDetail.yearOfStudy }}</span>
                      <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span class="font-bold text-blue-600"
                        >GPA: {{ selectedStudentDetail.gpa }}</span
                      >
                    </div>
                  </div>
                  <div class="sm:ml-auto mb-2 flex gap-3">
                    <button
                      @click="openPdfViewer(selectedStudentDetail.resumeUrl)"
                      class="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm flex items-center gap-2"
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      Xem CV
                    </button>
                    <button
                      class="px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors shadow-sm shadow-green-500/30 text-sm"
                    >
                      Tuyển dụng ngay
                    </button>
                  </div>
                </div>
                <hr class="border-slate-100 mb-6" />
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div class="space-y-6">
                    <div>
                      <h3
                        class="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2"
                      >
                        <svg
                          class="w-5 h-5 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Kỹ năng
                      </h3>
                      <div class="flex flex-wrap gap-2">
                        <span
                          v-for="skill in selectedStudentDetail.skills
                            ? selectedStudentDetail.skills.split(',')
                            : []"
                          :key="skill"
                          class="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-md font-medium"
                          >{{ skill.trim() }}</span
                        >
                        <span
                          v-if="!selectedStudentDetail.skills"
                          class="text-sm text-slate-500 italic"
                          >Chưa cập nhật</span
                        >
                      </div>
                    </div>
                    <div>
                      <h3
                        class="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2"
                      >
                        <svg
                          class="w-5 h-5 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 14l9-5-9-5-9 5 9 5z"
                          />
                          <path
                            d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                          />
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                          />
                        </svg>
                        Giải thưởng
                      </h3>
                      <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700">
                      <div v-if="selectedStudentDetail.archievements">
                        <div
                          v-for="(item, i) in selectedStudentDetail.archievements.split(';')"
                          :key="i"
                          class="whitespace-pre-line"
                        >
                          • {{ item.trim() }}
                        </div>
                      </div>

                      <div v-else>
                        Chưa cập nhật
                      </div>
                      </div>

                    </div>
                    <div>
                      <h3
                        class="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2"
                      >
                        <svg
                          class="w-5 h-5 text-blue-500"
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
                        Chứng chỉ
                      </h3>
                      <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700">
                      <div v-if="selectedStudentDetail.certifications">
                        <div
                          v-for="(item, i) in selectedStudentDetail.certifications.split(';')"
                          :key="i"
                          class="whitespace-pre-line"
                        >
                          • {{ item.trim() }}
                        </div>
                      </div>

                      <div v-else>
                        Chưa cập nhật
                      </div>
                    </div>

                    </div>
                  </div>
                  <div class="space-y-6">
                    <div>
                      <h3
                        class="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2"
                      >
                        <svg
                          class="w-5 h-5 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        Kinh nghiệm
                      </h3>
                      <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700">
                        <div v-if="selectedStudentDetail.experiences">
                          <div
                            v-for="(item, i) in selectedStudentDetail.experiences.split(';')"
                            :key="i"
                            class="whitespace-pre-line"
                          >
                            • {{ item.trim() }}
                          </div>
                        </div>

                        <div v-else>
                          Chưa cập nhật
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3
                        class="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2"
                      >
                        <svg
                          class="w-5 h-5 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                          />
                        </svg>
                        Dự án
                      </h3>
                      <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700">
                        <div v-if="selectedStudentDetail.projects">
                          <div
                            v-for="(item, i) in selectedStudentDetail.projects.split(';')"
                            :key="i"
                            class="whitespace-pre-line"
                          >
                            • {{ item.trim() }}
                          </div>
                        </div>

                        <div v-else>
                          Chưa cập nhật
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showPdfModal"
        class="fixed inset-0 z-[10000] flex flex-col bg-slate-900/95 backdrop-blur-sm animate-fade-in"
      >
        <div
          class="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 sm:px-6 shadow-lg shrink-0"
        >
          <div class="flex items-center gap-4">
            <button
              @click="closePdfViewer"
              class="flex items-center gap-2 text-white hover:text-blue-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span class="font-medium text-sm">Quay lại chi tiết</span>
            </button>
            <div class="h-6 w-px bg-slate-600 mx-2"></div>
            <span
              class="text-slate-300 text-sm font-medium truncate max-w-[200px]"
              >CV Ứng viên</span
            >
          </div>
          <div class="flex items-center gap-2">
            <a
              :href="pdfUrl"
              download
              target="_blank"
              class="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="Tải xuống"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </a>
            <button
              @click="closePdfViewer"
              class="p-2 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
        </div>

        <div
          class="flex-1 overflow-y-auto bg-slate-900 flex justify-center p-4 sm:p-8 custom-scrollbar relative"
        >
          <div
            v-if="isPdfLoading"
            class="absolute inset-0 flex items-center justify-center z-10"
          >
            <div class="flex flex-col items-center gap-3">
              <div
                class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"
              ></div>
              <span class="text-slate-400 text-sm">Đang tải tài liệu...</span>
            </div>
          </div>
          <div class="shadow-2xl max-w-4xl w-full">
            <VuePdfEmbed
              :source="pdfUrl"
              class="w-full bg-white rounded-sm"
              @loaded="handlePdfLoaded"
              @load-error="handlePdfError"
            />
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
                <!-- Question Icon -->
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
                <!-- Error Icon -->
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
                <!-- Success Icon -->
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
                <!-- Warning Icon -->
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

/* PDF Scrollbar Dark Mode */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #0f172a;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #475569;
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
