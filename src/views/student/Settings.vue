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
const isSaving = ref(false);
const studentProfile = ref(null);
const isEditMode = ref(false);
const updateMethod = ref("manual"); // 'manual' or 'pdf'

// Form data
const formData = ref({
  name: "",
  gpa: null,
  skills: "",
  major: "",
  yearOfStudy: null,
  languages: "",
  certifications: "",
  experiences: "",
  projects: "",
  educations: "",
  archievements: "",
});

const resumeFile = ref(null);
const resumeFileName = ref("");

// Computed to check if profile exists
const hasProfile = computed(() => studentProfile.value !== null);

// Handle file upload
const handleResumeUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (file.type !== "application/pdf") {
    toast.error("Chỉ chấp nhận file PDF!");
    event.target.value = "";
    return;
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error("File không được vượt quá 5MB!");
    event.target.value = "";
    return;
  }

  resumeFile.value = file;
  resumeFileName.value = file.name;
};

// Toggle edit mode
const toggleEditMode = () => {
  if (!isEditMode.value) {
    // Entering edit mode, populate form with current data
    if (studentProfile.value) {
      formData.value = {
        name: studentProfile.value.name || "",
        gpa: studentProfile.value.gpa || null,
        skills: studentProfile.value.skills || "",
        major: studentProfile.value.major || "",
        yearOfStudy: studentProfile.value.yearOfStudy || null,
        languages: studentProfile.value.languages || "",
        certifications: studentProfile.value.certifications || "",
        experiences: studentProfile.value.experiences || "",
        projects: studentProfile.value.projects || "",
        educations: studentProfile.value.educations || "",
        archievements: studentProfile.value.archievements || "",
      };
    }
  }
  isEditMode.value = !isEditMode.value;
  updateMethod.value = "manual";
  resumeFile.value = null;
  resumeFileName.value = "";
};

// Cancel edit
const cancelEdit = () => {
  isEditMode.value = false;
  updateMethod.value = "manual";
  resumeFile.value = null;
  resumeFileName.value = "";
  formData.value = {
    name: "",
    gpa: null,
    skills: "",
    major: "",
    yearOfStudy: null,
    languages: "",
    certifications: "",
    experiences: "",
    projects: "",
    educations: "",
    archievements: "",
  };
};

// Save profile
const saveProfile = async () => {
  try {
    isSaving.value = true;

    const submitFormData = new FormData();

    if (updateMethod.value === "pdf") {
      // PDF upload mode
      if (!resumeFile.value) {
        toast.error("Vui lòng chọn file CV!");
        return;
      }
      submitFormData.append("resumeFile", resumeFile.value);
      // Add minimal required fields if needed
      submitFormData.append("Name", formData.value.name || "");
    } else {
      // Manual input mode
      if (!formData.value.name.trim()) {
        toast.error("Vui lòng nhập họ tên!");
        return;
      }

      // Append all form fields
      submitFormData.append("Name", formData.value.name);
      if (formData.value.gpa) submitFormData.append("GPA", formData.value.gpa);
      if (formData.value.skills) submitFormData.append("Skills", formData.value.skills);
      if (formData.value.major) submitFormData.append("Major", formData.value.major);
      if (formData.value.yearOfStudy) submitFormData.append("YearOfStudy", formData.value.yearOfStudy);
      if (formData.value.languages) submitFormData.append("Languages", formData.value.languages);
      if (formData.value.certifications) submitFormData.append("Certifications", formData.value.certifications);
      if (formData.value.experiences) submitFormData.append("Experiences", formData.value.experiences);
      if (formData.value.projects) submitFormData.append("Projects", formData.value.projects);
      if (formData.value.educations) submitFormData.append("Educations", formData.value.educations);
      if (formData.value.archievements) submitFormData.append("Archievements", formData.value.archievements);
    }

    const response = await studentService.createOrUpdateStudentInfo(submitFormData);
    studentProfile.value = response;
    
    toast.success(hasProfile.value ? "Cập nhật hồ sơ thành công!" : "Tạo hồ sơ thành công!");
    isEditMode.value = false;
    
    // Refresh profile data
    await fetchProfile();
  } catch (error) {
    console.error("Error saving profile:", error);
    toast.error(error.response?.data?.Message || "Không thể lưu hồ sơ. Vui lòng thử lại.");
  } finally {
    isSaving.value = false;
  }
};

// Fetch student profile
const fetchProfile = async () => {
  try {
    isLoading.value = true;
    const profile = await studentService.getMyProfile();
    studentProfile.value = profile;
  } catch (error) {
    if (error.response?.status === 404) {
      // Profile doesn't exist yet
      studentProfile.value = null;
    } else {
      console.error("Error fetching profile:", error);
      toast.error("Không thể tải thông tin hồ sơ");
    }
  } finally {
    isLoading.value = false;
  }
};

// Load data on component mount
onMounted(() => {
  fetchProfile();
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
                HỒ SƠ SINH VIÊN
              </h2>
              <p class="text-xs md:text-sm text-gray-500 mt-1 hidden sm:block">
                Quản lý thông tin cá nhân và hồ sơ của bạn
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              v-if="hasProfile && !isEditMode"
              @click="toggleEditMode"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
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
              Chỉnh sửa
            </button>
          </div>
        </div>
      </header>

      <main
        class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-8"
      >
        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="flex justify-center items-center py-20"
        >
          <div
            class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"
          ></div>
        </div>

        <!-- No Profile State -->
        <div
          v-else-if="!hasProfile && !isEditMode"
          class="max-w-2xl mx-auto text-center py-16"
        >
          <div class="bg-white rounded-2xl p-12 border border-gray-200 shadow-sm">
            <svg
              class="w-24 h-24 mx-auto mb-6 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <h3 class="text-2xl font-bold text-gray-900 mb-3">
              Chưa có hồ sơ
            </h3>
            <p class="text-gray-500 mb-8">
              Bạn chưa tạo hồ sơ sinh viên. Hãy tạo hồ sơ để nhận được các đề xuất việc làm phù hợp nhất.
            </p>
            <button
              @click="isEditMode = true"
              class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2 transition-colors shadow-md"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Tạo hồ sơ ngay
            </button>
          </div>
        </div>

        <!-- View Mode -->
        <div
          v-else-if="hasProfile && !isEditMode"
          class="max-w-4xl mx-auto space-y-6"
        >
          <!-- Personal Information Card -->
          <div class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg
                class="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Thông tin cá nhân
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="text-sm font-medium text-gray-500">Họ tên</label>
                <p class="mt-1 text-base font-semibold text-gray-900">{{ studentProfile.name || "Chưa cập nhật" }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500">GPA</label>
                <p class="mt-1 text-base font-semibold text-gray-900">{{ studentProfile.gpa || "Chưa cập nhật" }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500">Chuyên ngành</label>
                <p class="mt-1 text-base font-semibold text-gray-900">{{ studentProfile.major || "Chưa cập nhật" }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500">Năm học</label>
                <p class="mt-1 text-base font-semibold text-gray-900">{{ studentProfile.yearOfStudy ? `Năm ${studentProfile.yearOfStudy}` : "Chưa cập nhật" }}</p>
              </div>
            </div>
          </div>

          <!-- Skills Card -->
          <div class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg
                class="w-6 h-6 text-green-600"
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
              Kỹ năng
            </h3>
            <p class="text-gray-700 whitespace-pre-wrap">{{ studentProfile.skills || "Chưa cập nhật" }}</p>
          </div>

          <!-- Languages Card -->
          <div class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg
                class="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
              Ngôn ngữ
            </h3>
            <p class="text-gray-700 whitespace-pre-wrap">{{ studentProfile.languages || "Chưa cập nhật" }}</p>
          </div>

          <!-- Experience & Projects -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Kinh nghiệm</h3>
              <p class="text-gray-700 whitespace-pre-wrap">{{ studentProfile.experiences || "Chưa cập nhật" }}</p>
            </div>
            <div class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Dự án</h3>
              <p class="text-gray-700 whitespace-pre-wrap">{{ studentProfile.projects || "Chưa cập nhật" }}</p>
            </div>
          </div>

          <!-- Certifications & Achievements -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Chứng chỉ</h3>
              <p class="text-gray-700 whitespace-pre-wrap">{{ studentProfile.certifications || "Chưa cập nhật" }}</p>
            </div>
            <div class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Thành tích</h3>
              <p class="text-gray-700 whitespace-pre-wrap">{{ studentProfile.archievements || "Chưa cập nhật" }}</p>
            </div>
          </div>

          <!-- Education & Resume -->
          <div class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Học vấn</h3>
            <p class="text-gray-700 whitespace-pre-wrap mb-6">{{ studentProfile.educations || "Chưa cập nhật" }}</p>
            
            <div v-if="studentProfile.resumeUrl" class="pt-4 border-t border-gray-200">
              <label class="text-sm font-medium text-gray-500">CV đã tải lên</label>
              <a
                :href="studentProfile.resumeUrl"
                target="_blank"
                class="mt-2 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Xem CV
              </a>
            </div>
          </div>
        </div>

        <!-- Edit Mode -->
        <div
          v-else-if="isEditMode"
          class="max-w-4xl mx-auto"
        >
          <div class="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm">
            <!-- Update Method Selection -->
            <div class="mb-8">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Chọn phương thức cập nhật</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  @click="updateMethod = 'manual'"
                  :class="[
                    'p-6 border-2 rounded-xl text-left transition-all',
                    updateMethod === 'manual'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300',
                  ]"
                >
                  <div class="flex items-center gap-3 mb-2">
                    <svg
                      class="w-6 h-6"
                      :class="updateMethod === 'manual' ? 'text-blue-600' : 'text-gray-400'"
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
                    <span
                      class="font-bold"
                      :class="updateMethod === 'manual' ? 'text-blue-600' : 'text-gray-900'"
                    >
                      Nhập tay
                    </span>
                  </div>
                  <p class="text-sm text-gray-600">Điền thông tin chi tiết vào form</p>
                </button>

                <button
                  @click="updateMethod = 'pdf'"
                  :class="[
                    'p-6 border-2 rounded-xl text-left transition-all',
                    updateMethod === 'pdf'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300',
                  ]"
                >
                  <div class="flex items-center gap-3 mb-2">
                    <svg
                      class="w-6 h-6"
                      :class="updateMethod === 'pdf' ? 'text-blue-600' : 'text-gray-400'"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span
                      class="font-bold"
                      :class="updateMethod === 'pdf' ? 'text-blue-600' : 'text-gray-900'"
                    >
                      Upload PDF
                    </span>
                  </div>
                  <p class="text-sm text-gray-600">AI sẽ tự động phân tích CV của bạn</p>
                </button>
              </div>
            </div>

            <!-- Manual Input Form -->
            <div v-if="updateMethod === 'manual'" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Họ tên <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.name"
                    type="text"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">GPA</label>
                  <input
                    v-model.number="formData.gpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="3.5"
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Chuyên ngành</label>
                  <input
                    v-model="formData.major"
                    type="text"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Công nghệ thông tin"
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Năm học</label>
                  <input
                    v-model.number="formData.yearOfStudy"
                    type="number"
                    min="1"
                    max="6"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="3"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Kỹ năng</label>
                <textarea
                  v-model="formData.skills"
                  rows="4"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="JavaScript, React, Node.js, Python..."
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Ngôn ngữ</label>
                <textarea
                  v-model="formData.languages"
                  rows="3"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tiếng Anh (IELTS 7.0), Tiếng Việt (Bản ngữ)"
                ></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Kinh nghiệm</label>
                  <textarea
                    v-model="formData.experiences"
                    rows="4"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mô tả kinh nghiệm làm việc..."
                  ></textarea>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Dự án</label>
                  <textarea
                    v-model="formData.projects"
                    rows="4"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Các dự án đã thực hiện..."
                  ></textarea>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Chứng chỉ</label>
                  <textarea
                    v-model="formData.certifications"
                    rows="4"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="AWS Certified, Google Analytics..."
                  ></textarea>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Thành tích</label>
                  <textarea
                    v-model="formData.archievements"
                    rows="4"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Giải nhất Hackathon 2024..."
                  ></textarea>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Học vấn</label>
                <textarea
                  v-model="formData.educations"
                  rows="3"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Đại học Bách Khoa TP.HCM..."
                ></textarea>
              </div>
            </div>

            <!-- PDF Upload Form -->
            <div v-else class="space-y-6">
              <div class="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  @change="handleResumeUpload"
                  accept="application/pdf"
                  class="hidden"
                  id="resume-upload"
                />
                <label
                  for="resume-upload"
                  class="cursor-pointer"
                >
                  <svg
                    class="w-16 h-16 mx-auto mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p class="text-lg font-semibold text-gray-700 mb-2">
                    <span class="text-blue-600">Click để chọn file</span> hoặc kéo thả
                  </p>
                  <p class="text-sm text-gray-500">
                    Chỉ chấp nhận file PDF, tối đa 5MB
                  </p>
                </label>
              </div>

              <div
                v-if="resumeFileName"
                class="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <svg
                    class="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <p class="font-semibold text-gray-900">{{ resumeFileName }}</p>
                    <p class="text-sm text-gray-500">Sẵn sàng để tải lên</p>
                  </div>
                </div>
                <button
                  @click="resumeFile = null; resumeFileName = ''"
                  class="text-red-600 hover:text-red-700"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                @click="saveProfile"
                :disabled="isSaving"
                class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <svg
                  v-if="!isSaving"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <div
                  v-else
                  class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
                ></div>
                {{ isSaving ? "Đang lưu..." : "Lưu thông tin" }}
              </button>
              <button
                @click="cancelEdit"
                :disabled="isSaving"
                class="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

body {
  font-family: "Inter", sans-serif;
}
</style>
