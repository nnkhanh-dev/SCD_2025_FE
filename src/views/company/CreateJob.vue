<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import Sidebar from "@/common/company/sidebar.vue";
import { jobService } from "@/services";

// --- CKEDITOR 4 ---
import CKEditor from "@mayasabha/ckeditor4-vue3";
const Ckeditor = CKEditor.component;

const router = useRouter();
const route = useRoute();

// Kiểm tra xem có phải đang edit không
const isEditMode = computed(() => !!route.params.id);

// --- CKEditor 4 Config ---
const editorUrl = "https://cdn.ckeditor.com/4.22.1/full/ckeditor.js";
const editorConfig = {
  versionCheck: false,
  language: "vi",
  height: 200,
  removePlugins: "elementspath,resize,about",
  resize_enabled: false,
  toolbar: [
    { name: "basicstyles", items: ["Bold", "Italic", "Underline", "Strike"] },
    {
      name: "paragraph",
      items: [
        "NumberedList",
        "BulletedList",
        "-",
        "JustifyLeft",
        "JustifyCenter",
        "JustifyRight",
      ],
    },
    { name: "links", items: ["Link", "Unlink"] },
    { name: "styles", items: ["Format", "Font", "FontSize"] },
    { name: "colors", items: ["TextColor", "BGColor"] },
    { name: "tools", items: ["Maximize", "Undo", "Redo"] },
  ],
};

// --- State ---
const isSidebarOpen = ref(false);
const toggleSidebar = () => (isSidebarOpen.value = !isSidebarOpen.value);
const isLoading = ref(false);
const globalErrorMessage = ref("");
const categories = ref([]);
const isCategoriesLoading = ref(false);

// --- Form Data ---
const formData = reactive({
  title: "",
  location: "",
  salaryMin: "",
  salaryMax: "",
  benefits: "",
  description: "",
  requirements: "",
  plusPoints: "",
  category: "",
  workingDays: "",
  workingHours: "",
  status: "Active", // Mặc định
});

const errors = reactive({
  title: "",
  location: "",
  category: "",
  description: "",
  requirements: "",
  benefits: "",
  salaryMin: "",
  salaryMax: "",
  workingDays: "",
  workingHours: "",
});

// --- LOAD DATA CHO EDIT ---
const fetchJobDetails = async (id) => {
  isLoading.value = true;
  try {
    const job = await jobService.getJobById(id);

    // Fill data vào form
    formData.title = job.title;
    formData.location = job.location;
    formData.category = job.categoryId;
    formData.description = job.description;
    formData.requirements = job.requirements;
    formData.benefits = job.benefits;
    formData.plusPoints = job.niceToHave;
    formData.workingDays = job.dayOfWeek;
    formData.workingHours = job.timeOfDay;
    // Cập nhật status hiện tại để hiển thị lên Dropdown
    formData.status = job.status;

    if (job.salaryRange && job.salaryRange.includes("-")) {
      const parts = job.salaryRange.replace(" VND", "").split("-");
      if (parts.length === 2) {
        const rawMin = parts[0].trim().replace(/\./g, "");
        const rawMax = parts[1].trim().replace(/\./g, "");
        formData.salaryMin = parseInt(rawMin) || "";
        formData.salaryMax = parseInt(rawMax) || "";
      }
    }
  } catch (error) {
    console.error("Error loading job:", error);
    globalErrorMessage.value =
      "Không thể tải thông tin công việc để chỉnh sửa.";
  } finally {
    isLoading.value = false;
  }
};

// --- Validation Function ---
const validateForm = () => {
  let isValid = true;
  Object.keys(errors).forEach((key) => (errors[key] = ""));
  globalErrorMessage.value = "";
  const stripHtml = (html) =>
    !html
      ? ""
      : html
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, "")
          .trim();

  if (!formData.title.trim()) {
    errors.title = "Vui lòng nhập tiêu đề công việc";
    isValid = false;
  }
  if (!formData.location.trim()) {
    errors.location = "Vui lòng nhập địa điểm làm việc";
    isValid = false;
  }
  if (!formData.category) {
    errors.category = "Vui lòng chọn ngành nghề";
    isValid = false;
  }
  if (!formData.description || stripHtml(formData.description) === "") {
    errors.description = "Vui lòng nhập mô tả công việc";
    isValid = false;
  }
  if (!formData.requirements || stripHtml(formData.requirements) === "") {
    errors.requirements = "Vui lòng nhập yêu cầu ứng viên";
    isValid = false;
  }
  if (!formData.benefits || stripHtml(formData.benefits) === "") {
    errors.benefits = "Vui lòng nhập thông tin phúc lợi";
    isValid = false;
  }
  if (!formData.salaryMin && formData.salaryMin !== 0) {
    errors.salaryMin = "Nhập lương tối thiểu";
    isValid = false;
  }
  if (!formData.salaryMax && formData.salaryMax !== 0) {
    errors.salaryMax = "Nhập lương tối đa";
    isValid = false;
  } else if (parseInt(formData.salaryMax) < parseInt(formData.salaryMin)) {
    errors.salaryMax = "Lương tối đa phải lớn hơn tối thiểu";
    isValid = false;
  }
  if (!formData.workingDays.trim()) {
    errors.workingDays = "Vui lòng nhập ngày làm việc";
    isValid = false;
  }
  if (!formData.workingHours.trim()) {
    errors.workingHours = "Vui lòng nhập giờ làm việc";
    isValid = false;
  }

  return isValid;
};

// --- Transform & Submit ---
const transformFormData = (statusOverride) => {
  const min = formData.salaryMin
    ? `${parseInt(formData.salaryMin).toLocaleString("vi-VN")}`
    : "0";
  const max = formData.salaryMax
    ? `${parseInt(formData.salaryMax).toLocaleString("vi-VN")}`
    : "0";

  // Logic xác định status:
  // - Nếu có statusOverride (từ nút bấm Lưu nháp/Đăng tin ở chế độ tạo): dùng nó.
  // - Nếu không (chế độ Edit): dùng formData.status từ Dropdown.
  const finalStatus = statusOverride || formData.status;

  return {
    title: formData.title.trim(),
    description: formData.description,
    salaryRange: `${min} - ${max} VND`,
    dayOfWeek: formData.workingDays.trim(),
    timeOfDay: formData.workingHours.trim(),
    benefits: formData.benefits,
    requirements: formData.requirements,
    niceToHave: formData.plusPoints || "",
    location: formData.location.trim(),
    status: finalStatus,
    categoryId: parseInt(formData.category) || 0,
  };
};

const handleSave = async (statusOverride = null) => {
  if (!validateForm()) {
    const firstError = document.querySelector(".text-red-500");
    if (firstError)
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  isLoading.value = true;
  try {
    const jobData = transformFormData(statusOverride);
    let response;

    if (isEditMode.value) {
      // API Update
      response = await jobService.updateJob(route.params.id, jobData);
    } else {
      // API Create
      response = await jobService.createJob(jobData);
    }

    // Redirect
    if (isEditMode.value) {
      router.push({ name: "CompanyJobs" });
    } else {
      const newJobId = response?.id || response?.data?.id;
      if (newJobId) router.push(`/company/jobs/${newJobId}/candidates`);
      else router.push({ name: "CompanyJobs" });
    }
  } catch (error) {
    console.error("Error saving job:", error);
    globalErrorMessage.value = "Có lỗi xảy ra. Vui lòng thử lại.";
  } finally {
    isLoading.value = false;
  }
};

const fetchCategories = async () => {
  isCategoriesLoading.value = true;
  try {
    const response = await jobService.getCategories();
    categories.value = response || [];
  } catch (error) {
    console.error(error);
  } finally {
    isCategoriesLoading.value = false;
  }
};

onMounted(() => {
  fetchCategories();
  if (route.params.id) {
    fetchJobDetails(route.params.id);
  }
});
</script>

<template>
  <div
    class="flex h-screen bg-[#F1F5F9] font-sans overflow-hidden text-slate-600"
  >
    <Sidebar :is-open="isSidebarOpen" @close-sidebar="isSidebarOpen = false" />
    <main
      class="flex-1 flex flex-col h-screen relative transition-all duration-300"
    >
      <div
            class="bg-gradient-to-r from-blue-600 to-indigo-700 py-8 px-4 sm:px-6 lg:px-8"
          >
            <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h1 class="text-3xl font-bold text-white mb-2">
                  Tạo đơn tuyển dụng
                </h1>
                <p class="text-blue-100">
                  Điền thông tin chi tiết vị trí công việc
                </p>
              </div>

              <!-- Status Stepper -->
              <div class="flex items-center gap-3 sm:gap-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 pr-6">
                <!-- Step 1: Create Job (Active) -->
                 <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shadow-lg shadow-black/5 border border-white/30">
                        <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <span class="text-sm font-bold text-white hidden sm:block">Tạo đơn tuyển dụng</span>
                 </div>

                 <!-- Arrow Separator -->
                 <svg class="w-5 h-5 text-blue-300/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                 </svg>

                 <!-- Step 2: Find Candidates -->
                 <div class="flex items-center gap-3 opacity-60">
                    <div class="w-8 h-8 rounded-lg bg-blue-800/50 flex items-center justify-center border border-white/10">
                        <svg class="w-4 h-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path d="M12 14l9-5-9-5-9 5 9 5z" />
                           <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                    </div>
                    <span class="text-sm font-medium text-blue-100">Tìm ứng viên phù hợp</span>
                 </div>
              </div>
            </div>
          </div>

      <div class="flex-1 overflow-y-auto scroll-smooth bg-[#F8FAFC]">
        <div
          v-if="globalErrorMessage"
          class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4"
        >
          <div
            class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-pulse"
          >
            <span class="font-medium">{{ globalErrorMessage }}</span>
            <button
              @click="globalErrorMessage = ''"
              class="ml-auto text-red-700 hover:text-red-900"
            >
              ✕
            </button>
          </div>
        </div>

        <form class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div class="lg:col-span-8 space-y-6">
              <section
                class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div
                  class="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-white"
                >
                  <div class="text-left">
                    <h3 class="font-bold text-slate-800 text-base">
                      Thông tin cơ bản
                    </h3>
                  </div>
                </div>
                <div class="p-6 space-y-5 text-left">
                  <div>
                    <label
                      class="block text-sm font-semibold text-slate-700 mb-1.5 text-left"
                      >Tiêu đề công việc
                      <span class="text-red-500">*</span></label
                    >
                    <input
                      v-model="formData.title"
                      type="text"
                      @input="errors.title = ''"
                      class="w-full px-4 py-2.5 rounded-lg border bg-white outline-none"
                      :class="
                        errors.title ? 'border-red-500' : 'border-slate-300'
                      "
                    />
                    <p v-if="errors.title" class="text-xs text-red-500 mt-1">
                      {{ errors.title }}
                    </p>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label
                        class="block text-sm font-semibold text-slate-700 mb-1.5 text-left"
                        >Địa điểm làm việc
                        <span class="text-red-500">*</span></label
                      >
                      <input
                        v-model="formData.location"
                        type="text"
                        @input="errors.location = ''"
                        class="w-full px-4 py-2.5 rounded-lg border bg-white outline-none"
                        :class="
                          errors.location
                            ? 'border-red-500'
                            : 'border-slate-300'
                        "
                      />
                      <p
                        v-if="errors.location"
                        class="text-xs text-red-500 mt-1"
                      >
                        {{ errors.location }}
                      </p>
                    </div>
                    <div>
                      <label
                        class="block text-sm font-semibold text-slate-700 mb-1.5 text-left"
                        >Ngành nghề <span class="text-red-500">*</span></label
                      >
                      <select
                        v-model="formData.category"
                        class="w-full px-4 py-2.5 rounded-lg border bg-white outline-none"
                        :class="
                          errors.category
                            ? 'border-red-500'
                            : 'border-slate-300'
                        "
                      >
                        <option value="" disabled selected>
                          Chọn ngành nghề
                        </option>
                        <option
                          v-for="c in categories"
                          :key="c.id"
                          :value="c.id"
                        >
                          {{ c.name }}
                        </option>
                      </select>
                      <p
                        v-if="errors.category"
                        class="text-xs text-red-500 mt-1"
                      >
                        {{ errors.category }}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section
                class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div class="p-6 space-y-6 text-left">
                  <div>
                    <label
                      class="block text-sm font-semibold text-slate-700 mb-2"
                      >Mô tả công việc
                      <span class="text-red-500">*</span></label
                    >
                    <div
                      class="rounded-lg overflow-hidden border"
                      :class="
                        errors.description
                          ? 'border-red-500'
                          : 'border-slate-300'
                      "
                    >
                      <Ckeditor
                        v-model="formData.description"
                        :config="editorConfig"
                        :editor-url="editorUrl"
                        @input="errors.description = ''"
                      />
                    </div>
                    <p
                      v-if="errors.description"
                      class="text-xs text-red-500 mt-1"
                    >
                      {{ errors.description }}
                    </p>
                  </div>
                  <div>
                    <label
                      class="block text-sm font-semibold text-slate-700 mb-2"
                      >Yêu cầu ứng viên
                      <span class="text-red-500">*</span></label
                    >
                    <div
                      class="rounded-lg overflow-hidden border"
                      :class="
                        errors.requirements
                          ? 'border-red-500'
                          : 'border-slate-300'
                      "
                    >
                      <Ckeditor
                        v-model="formData.requirements"
                        :config="editorConfig"
                        :editor-url="editorUrl"
                        @input="errors.requirements = ''"
                      />
                    </div>
                    <p
                      v-if="errors.requirements"
                      class="text-xs text-red-500 mt-1"
                    >
                      {{ errors.requirements }}
                    </p>
                  </div>
                  <div>
                    <label
                      class="block text-sm font-semibold text-slate-700 mb-2"
                      >Điểm cộng</label
                    >
                    <div
                      class="rounded-lg overflow-hidden border border-slate-300"
                    >
                      <Ckeditor
                        v-model="formData.plusPoints"
                        :config="editorConfig"
                        :editor-url="editorUrl"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section
                class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div class="p-6 space-y-6 text-left">
                  <label class="block text-sm font-semibold text-slate-700 mb-2"
                    >Phúc lợi <span class="text-red-500">*</span></label
                  >
                  <div
                    class="rounded-lg overflow-hidden border"
                    :class="
                      errors.benefits ? 'border-red-500' : 'border-slate-300'
                    "
                  >
                    <Ckeditor
                      v-model="formData.benefits"
                      :config="editorConfig"
                      :editor-url="editorUrl"
                      @input="errors.benefits = ''"
                    />
                  </div>
                  <p v-if="errors.benefits" class="text-xs text-red-500 mt-1">
                    {{ errors.benefits }}
                  </p>
                </div>
              </section>
            </div>

            <div class="lg:col-span-4 space-y-6 lg:sticky h-fit">
              <div
                v-if="isEditMode"
                class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div
                  class="px-5 py-4 border-b border-slate-100 bg-blue-50/50 text-left"
                >
                  <h4 class="font-bold text-slate-800 text-sm">
                    Trạng thái hiển thị
                  </h4>
                </div>
                <div class="p-5">
                  <div class="relative">
                    <select
                      v-model="formData.status"
                      class="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-medium"
                      :class="{
                        'text-green-600 bg-green-50/30':
                          formData.status === 'Active',
                        'text-gray-600 bg-gray-50/30':
                          formData.status === 'Inactive',
                        'text-amber-600 bg-amber-50/30':
                          formData.status === 'Closed',
                      }"
                    >
                      <option value="Active">Mở</option>
                      <option value="Closed">Đóng </option>
                      <option value="Inactive">Bản nháp</option>
                    </select>
                    <div
                      class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500"
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
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                  <p class="text-xs text-slate-500 mt-2 text-left">
                    * Active: Ứng viên có thể nhìn thấy và ứng tuyển.<br />
                    * Inactive: Tạm ẩn khỏi danh sách tìm kiếm.<br />
                    * Temp: Lưu nháp, chưa công khai.
                  </p>
                </div>
              </div>

              <div
                class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4"
              >
                <div>
                  <label
                    class="block text-xs font-semibold text-slate-500 mb-1.5 text-left"
                    >Lương tối thiểu <span class="text-red-500">*</span></label
                  >
                  <input
                    v-model="formData.salaryMin"
                    type="number"
                    class="w-full px-3 py-2 border rounded-md"
                    :class="
                      errors.salaryMin ? 'border-red-500' : 'border-slate-300'
                    "
                    placeholder="0"
                  />
                  <p v-if="errors.salaryMin" class="text-xs text-red-500 mt-1">
                    {{ errors.salaryMin }}
                  </p>
                </div>
                <div>
                  <label
                    class="block text-xs font-semibold text-slate-500 mb-1.5 text-left"
                    >Lương tối đa <span class="text-red-500">*</span></label
                  >
                  <input
                    v-model="formData.salaryMax"
                    type="number"
                    class="w-full px-3 py-2 border rounded-md"
                    :class="
                      errors.salaryMax ? 'border-red-500' : 'border-slate-300'
                    "
                    placeholder="0"
                  />
                  <p v-if="errors.salaryMax" class="text-xs text-red-500 mt-1">
                    {{ errors.salaryMax }}
                  </p>
                </div>
              </div>

              <div
                class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4"
              >
                <div>
                  <label
                    class="block text-xs font-semibold text-slate-500 mb-1.5 text-left"
                    >Ngày làm việc <span class="text-red-500">*</span></label
                  >
                  <input
                    v-model="formData.workingDays"
                    type="text"
                    class="w-full px-3 py-2 border rounded-md"
                    :class="
                      errors.workingDays ? 'border-red-500' : 'border-slate-300'
                    "
                    placeholder="T2-T6"
                  />
                  <p
                    v-if="errors.workingDays"
                    class="text-xs text-red-500 mt-1"
                  >
                    {{ errors.workingDays }}
                  </p>
                </div>
                <div>
                  <label
                    class="block text-xs font-semibold text-slate-500 mb-1.5 text-left"
                    >Giờ làm việc <span class="text-red-500">*</span></label
                  >
                  <input
                    v-model="formData.workingHours"
                    type="text"
                    class="w-full px-3 py-2 border rounded-md"
                    :class="
                      errors.workingHours
                        ? 'border-red-500'
                        : 'border-slate-300'
                    "
                    placeholder="8:00 - 17:00"
                  />
                  <p
                    v-if="errors.workingHours"
                    class="text-xs text-red-500 mt-1"
                  >
                    {{ errors.workingHours }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <footer
        class="absolute bottom-0 w-full bg-white border-t border-slate-200 z-40 px-6 py-4 shadow-lg"
      >
        <div
          class="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <div class="text-sm text-slate-500 hidden sm:block">
            <span class="text-red-500">*</span> Thông tin bắt buộc
          </div>
          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              :disabled="isLoading"
              @click="router.push({ name: 'CompanyDashboard' })"
              class="cursor-pointer px-5 py-2.5 rounded-lg text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 font-medium text-sm transition-all disabled:opacity-50"
            >
              Hủy
            </button>

            <template v-if="!isEditMode">
              <button
                type="button"
                @click="handleSave('Temp')"
                :disabled="isLoading"
                class="cursor-pointer px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-green-50 hover:bg-green-100 hover:border-green-300 font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
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
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                Lưu nháp
              </button>
              <button
                @click="handleSave('Active')"
                :disabled="isLoading"
                class="cursor-pointer px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <svg
                  v-if="!isLoading"
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                {{ isLoading ? "Đang xử lý..." : "Đăng tin" }}
              </button>
            </template>

            <template v-else>
              <button
                @click="handleSave()"
                :disabled="isLoading"
                class="cursor-pointer px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <svg
                  v-if="!isLoading"
                  class="w-4 h-4"
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
                {{ isLoading ? "Đang xử lý..." : "Lưu thay đổi" }}
              </button>
            </template>
          </div>
        </div>
      </footer>
    </main>
  </div>
</template>
