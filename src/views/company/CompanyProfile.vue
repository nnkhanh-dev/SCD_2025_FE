<script setup>
import { ref, onMounted, reactive, computed } from "vue";
import Sidebar from "@/common/company/sidebar.vue";
import { companyService } from "@/services/company/companyService";

// --- Constants ---
// Bạn có thể chuyển cái này vào file .env (import.meta.env.VITE_API_URL) để chuyên nghiệp hơn
const API_BASE_URL = "https://kodopo.tech";

// --- State ---
const isSidebarOpen = ref(false);
const isLoading = ref(false);
const isFetching = ref(true);
const fileInput = ref(null);

// Form State
const form = reactive({
  companyName: "",
  companyWebsite: "",
  location: "",
  descriptions: "",
  logoUrl: "", // Sẽ lưu URL đầy đủ (Base + Relative Path)
  logoPreview: null,
});

// Error State
const errors = reactive({
  companyName: "",
  companyWebsite: "",
  location: "",
  descriptions: "",
});

const selectedFile = ref(null);

// --- Toast State ---
const toast = reactive({ show: false, message: "", type: "success" });
let toastTimeout = null;

// --- Computed: Độ hoàn thiện hồ sơ ---
const profileCompleteness = computed(() => {
  let score = 0;
  if (form.companyName && !errors.companyName) score += 25;
  if (form.location && !errors.location) score += 25;
  if (form.descriptions && !errors.descriptions) score += 25;
  if (form.logoUrl || form.logoPreview) score += 25;
  return score;
});

// --- Validation Logic ---
const validateUrl = (url) => {
  if (!url) return true;
  const pattern =
    /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  return pattern.test(url);
};

const validateField = (field) => {
  switch (field) {
    case "companyName":
      errors.companyName = form.companyName.trim()
        ? ""
        : "Tên công ty là bắt buộc.";
      break;
    case "location":
      errors.location = form.location.trim()
        ? ""
        : "Vui lòng nhập địa chỉ trụ sở.";
      break;
    case "companyWebsite":
      if (form.companyWebsite && !validateUrl(form.companyWebsite)) {
        errors.companyWebsite =
          "Website không đúng định dạng (VD: https://google.com)";
      } else {
        errors.companyWebsite = "";
      }
      break;
    case "descriptions":
      if (!form.descriptions.trim()) {
        errors.descriptions = "Vui lòng nhập mô tả giới thiệu.";
      } else if (form.descriptions.length < 50) {
        errors.descriptions = `Mô tả quá ngắn (${form.descriptions.length}/50 ký tự).`;
      } else {
        errors.descriptions = "";
      }
      break;
  }
};

const validateForm = () => {
  validateField("companyName");
  validateField("location");
  validateField("companyWebsite");
  validateField("descriptions");
  return !Object.values(errors).some((error) => error !== "");
};

// --- Actions ---
const showToast = (message, type = "success") => {
  toast.show = true;
  toast.message = message;
  toast.type = type;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.show = false;
  }, 4000);
};

const triggerFileInput = () => fileInput.value.click();

const onFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (!file.type.match("image.*")) {
      showToast("Vui lòng chọn file hình ảnh (JPG, PNG)", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Kích thước ảnh tối đa là 5MB", "error");
      return;
    }
    selectedFile.value = file;
    form.logoPreview = URL.createObjectURL(file);
  }
};

const removeLogo = () => {
  selectedFile.value = null;
  form.logoPreview = null;
  form.logoUrl = "";
  if (fileInput.value) fileInput.value.value = "";
};

const fetchCompanyInfo = async () => {
  isFetching.value = true;
  try {
    const data = await companyService.getMyCompanyInfo();
    if (data) {
      form.companyName = data.companyName || data.CompanyName || "";
      form.companyWebsite = data.companyWebsite || data.CompanyWebsite || "";
      form.location = data.location || data.Location || "";
      // Xử lý cả 2 trường descriptions và description (do response có cả 2)
      form.descriptions =
        data.descriptions ||
        data.Descriptions ||
        data.description ||
        data.Description ||
        "";

      // --- XỬ LÝ LOGO URL ---
      // AxiosClient đã tự động xử lý logoUrl, chỉ cần gán trực tiếp
      form.logoUrl = data.logoUrl || data.LogoUrl || "";
    }
  } catch (error) {
    console.log("New profile or error fetching");
  } finally {
    isFetching.value = false;
  }
};

const saveCompanyInfo = async () => {
  if (!validateForm()) {
    showToast("Vui lòng kiểm tra lại các trường báo lỗi.", "error");
    return;
  }

  isLoading.value = true;
  try {
    const formData = new FormData();
    formData.append("CompanyName", form.companyName);
    formData.append("CompanyWebsite", form.companyWebsite || "");
    formData.append("Location", form.location || "");
    formData.append("Descriptions", form.descriptions || "");
    // Backend cũng map vào field Description nên có thể gửi cả 2 để chắc chắn
    formData.append("Description", form.descriptions || "");

    if (selectedFile.value) {
      formData.append("logoFile", selectedFile.value);
    }
    // Nếu không chọn file mới và backend cần URL cũ, hãy gửi lại path tương đối nếu cần
    // Tuy nhiên với multipart/form-data, thường backend sẽ check nếu logoFile null thì giữ nguyên ảnh cũ.

    await companyService.updateCompanyInfo(formData);

    // Load lại dữ liệu để cập nhật URL ảnh mới nhất từ server
    await fetchCompanyInfo();
    showToast("Cập nhật hồ sơ công ty thành công!", "success");
  } catch (error) {
    console.error(error);

    let errorMsg = "Lỗi cập nhật thông tin. Vui lòng thử lại.";

    if (error.response && error.response.data) {
      const data = error.response.data;
      if (data.errors) {
        const firstErrorKey = Object.keys(data.errors)[0];
        if (firstErrorKey && data.errors[firstErrorKey].length > 0) {
          const fieldName =
            firstErrorKey.charAt(0).toLowerCase() + firstErrorKey.slice(1);
          if (errors.hasOwnProperty(fieldName)) {
            errors[fieldName] = data.errors[firstErrorKey][0];
          }
          errorMsg = data.errors[firstErrorKey][0];
        }
      } else if (data.title) {
        errorMsg = data.title;
      }
    }

    showToast(errorMsg, "error");
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchCompanyInfo();
});
</script>

<template>
  <div
    class="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden text-slate-600"
  >
    <Sidebar :is-open="isSidebarOpen" @close-sidebar="isSidebarOpen = false" />

    <main
      class="flex-1 flex flex-col h-screen relative transition-all duration-300 overflow-hidden"
    >
      <header
        class="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm shrink-0 h-16"
      >
        <div
          class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <button
              @click="isSidebarOpen = !isSidebarOpen"
              class="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
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
            <h1 class="text-lg font-bold text-slate-800 tracking-tight">
              THÔNG TIN CÔNG TY CỦA BẠN
            </h1>
          </div>

          <div class="flex items-center gap-4">
            <button
              @click="saveCompanyInfo"
              :disabled="isLoading || isFetching"
              class="hidden sm:flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 transform active:scale-95"
            >
              <svg
                v-if="isLoading"
                class="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>{{ isLoading ? "Đang lưu..." : "Lưu thay đổi" }}</span>
            </button>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto scroll-smooth bg-[#F8FAFC]">
        <div v-if="isFetching" class="max-w-5xl mx-auto p-6 space-y-6">
          <div class="h-48 bg-slate-200 rounded-2xl animate-pulse"></div>
          <div class="h-10 w-1/3 bg-slate-200 rounded animate-pulse"></div>
          <div class="space-y-4">
            <div class="h-12 bg-slate-200 rounded animate-pulse"></div>
            <div class="h-32 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </div>

        <div v-else class="relative pb-24">
          <div
            class="h-48 md:h-64 w-full bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 relative overflow-hidden"
          >
            <div
              class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"
            ></div>
            <div
              class="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#F8FAFC] to-transparent"
            ></div>
          </div>

          <div class="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-32 z-10">
            <div
              class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-visible"
            >
              <div class="relative px-8 pt-0 pb-10 border-b border-slate-100">
                <div
                  class="flex flex-col md:flex-row items-start md:items-end gap-8"
                >
                  <div class="relative group shrink-0 mx-auto md:mx-0">
                    <div
                      class="w-36 h-36 md:w-44 md:h-44 rounded-2xl border-[6px] border-white shadow-2xl bg-white overflow-hidden cursor-pointer relative z-20 transition-all duration-300 group-hover:shadow-blue-500/20"
                      @click="triggerFileInput"
                    >
                      <img
                        v-if="form.logoPreview || form.logoUrl"
                        :src="form.logoPreview || form.logoUrl"
                        class="w-full h-full object-contain p-2"
                        alt="Logo"
                        @error="
                          $event.target.src =
                            'https://ui-avatars.com/api/?name=' +
                            (form.companyName || 'C') +
                            '&background=f1f5f9&color=64748b&size=256&font-size=0.4'
                        "
                      />
                      <div
                        v-else
                        class="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300 group-hover:bg-slate-100 transition-colors"
                      >
                        <svg
                          class="w-12 h-12 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          ></path>
                        </svg>
                        <span class="text-xs font-bold text-slate-400"
                          >Tải ảnh lên</span
                        >
                      </div>

                      <div
                        class="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]"
                      >
                        <svg
                          class="w-8 h-8 text-white mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span class="text-xs font-bold text-white tracking-wide"
                          >THAY LOGO</span
                        >
                      </div>
                    </div>

                    <button
                      v-if="form.logoPreview || form.logoUrl"
                      @click.stop="removeLogo"
                      class="absolute -top-3 -right-3 z-30 bg-white text-red-500 border border-red-100 rounded-full p-1.5 shadow-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100"
                      title="Xóa logo"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ></path>
                      </svg>
                    </button>

                    <input
                      type="file"
                      ref="fileInput"
                      class="hidden"
                      accept="image/*"
                      @change="onFileChange"
                    />
                  </div>

                  <div class="flex-1 w-full text-center md:text-left pb-2">
                    <h2
                      class="text-3xl font-bold text-slate-800 tracking-tight mb-3"
                    >
                      {{ form.companyName || "Công ty chưa đặt tên" }}
                    </h2>

                    <div
                      class="bg-slate-50 rounded-xl p-4 border border-slate-100 inline-block w-full md:w-auto min-w-[300px]"
                    >
                      <div class="flex justify-between items-center mb-2">
                        <span
                          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                          >Độ hoàn thiện</span
                        >
                        <span
                          class="text-sm font-bold"
                          :class="
                            profileCompleteness === 100
                              ? 'text-emerald-600'
                              : 'text-blue-600'
                          "
                        >
                          {{ profileCompleteness }}%
                        </span>
                      </div>
                      <div
                        class="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden"
                      >
                        <div
                          class="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                          :class="
                            profileCompleteness === 100
                              ? 'bg-emerald-500'
                              : 'bg-blue-500'
                          "
                          :style="{ width: profileCompleteness + '%' }"
                        >
                          <div
                            class="absolute inset-0 bg-white/20 animate-pulse"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="p-8 lg:p-10 space-y-10">
                <div>
                  <h3
                    class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"
                  >
                    <span class="w-1 h-6 bg-blue-600 rounded-full"></span>
                    Thông tin liên hệ
                  </h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div class="group">
                      <label
                        class="block text-sm text-start font-semibold text-slate-700 mb-2"
                      >
                        Tên hiển thị công ty <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="form.companyName"
                        @blur="validateField('companyName')"
                        @input="errors.companyName = ''"
                        type="text"
                        class="block w-full px-4 py-3.5 bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-4"
                        :class="
                          errors.companyName
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10 text-red-900'
                            : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                        "
                        placeholder="Nhập tên công ty chính thức..."
                      />
                      <Transition
                        enter-active-class="transition ease-out duration-200"
                        enter-from-class="opacity-0 -translate-y-1"
                        enter-to-class="opacity-100 translate-y-0"
                      >
                        <p
                          v-if="errors.companyName"
                          class="mt-2 text-xs text-red-600 font-medium flex items-center gap-1.5"
                        >
                          <span class="w-1 h-1 rounded-full bg-red-600"></span>
                          {{ errors.companyName }}
                        </p>
                      </Transition>
                    </div>

                    <div class="group">
                      <label
                        class="block text-sm text-start  font-semibold text-slate-700 mb-2"
                      >
                        Địa chỉ trụ sở <span class="text-red-500">*</span>
                      </label>
                      <div class="relative">
                        <input
                          v-model="form.location"
                          @blur="validateField('location')"
                          @input="errors.location = ''"
                          type="text"
                          class="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-4"
                          :class="
                            errors.location
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10 text-red-900'
                              : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                          "
                          placeholder="Số nhà, đường, quận/huyện..."
                        />
                        <div
                          class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                        >
                          <svg
                            class="h-5 w-5 transition-colors"
                            :class="
                              errors.location
                                ? 'text-red-500'
                                : 'text-slate-400'
                            "
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
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
                        </div>
                      </div>
                      <Transition
                        enter-active-class="transition ease-out duration-200"
                        enter-from-class="opacity-0 -translate-y-1"
                        enter-to-class="opacity-100 translate-y-0"
                      >
                        <p
                          v-if="errors.location"
                          class="mt-2 text-xs text-red-600 font-medium flex items-center gap-1.5"
                        >
                          <span class="w-1 h-1 rounded-full bg-red-600"></span>
                          {{ errors.location }}
                        </p>
                      </Transition>
                    </div>

                    <div class="group md:col-span-2">
                      <label
                        class="block text-sm text-start  font-semibold text-slate-700 mb-2"
                      >
                        Website công ty
                      </label>
                      <div class="relative">
                        <input
                          v-model="form.companyWebsite"
                          @blur="validateField('companyWebsite')"
                          @input="errors.companyWebsite = ''"
                          type="url"
                          class="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-4"
                          :class="
                            errors.companyWebsite
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10 text-red-900 placeholder-red-300'
                              : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
                          "
                          placeholder="https://your-company.com"
                        />
                        <div
                          class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                        >
                          <svg
                            class="h-5 w-5 transition-colors"
                            :class="
                              errors.companyWebsite
                                ? 'text-red-500'
                                : 'text-slate-400'
                            "
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                            />
                          </svg>
                        </div>
                        <div
                          v-if="errors.companyWebsite"
                          class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
                        >
                          <svg
                            class="h-5 w-5 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                      <Transition
                        enter-active-class="transition ease-out duration-200"
                        enter-from-class="opacity-0 -translate-y-1"
                        enter-to-class="opacity-100 translate-y-0"
                      >
                        <p
                          v-if="errors.companyWebsite"
                          class="mt-2 text-xs text-red-600 font-medium flex items-center gap-1.5"
                        >
                          <span class="w-1 h-1 rounded-full bg-red-600"></span>
                          {{ errors.companyWebsite }}
                        </p>
                      </Transition>
                    </div>
                  </div>
                </div>

                <div>
                  <h3
                    class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"
                  >
                    <span class="w-1 h-6 bg-purple-600 rounded-full"></span>
                    Giới thiệu doanh nghiệp
                  </h3>
                  <div class="group">
                    <div class="relative">
                      <textarea
                        v-model="form.descriptions"
                        @blur="validateField('descriptions')"
                        @input="errors.descriptions = ''"
                        rows="8"
                        class="block w-full px-5 py-4 bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-4 resize-y leading-relaxed"
                        :class="
                          errors.descriptions
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                            : 'border-slate-200 focus:border-purple-500 focus:ring-purple-500/10'
                        "
                        placeholder="Chia sẻ về văn hóa, tầm nhìn, sứ mệnh, môi trường làm việc..."
                      ></textarea>
                      <div
                        class="absolute bottom-3 right-3 text-xs font-medium px-2 py-1 rounded bg-white/80 backdrop-blur"
                        :class="
                          form.descriptions.length < 50
                            ? 'text-slate-400'
                            : 'text-emerald-600'
                        "
                      >
                        {{ form.descriptions.length }} ký tự
                      </div>
                    </div>
                    <Transition
                      enter-active-class="transition ease-out duration-200"
                      enter-from-class="opacity-0 -translate-y-1"
                      enter-to-class="opacity-100 translate-y-0"
                    >
                      <p
                        v-if="errors.descriptions"
                        class="mt-2 text-xs text-red-600 font-medium flex items-center gap-1.5"
                      >
                        <span class="w-1 h-1 rounded-full bg-red-600"></span>
                        {{ errors.descriptions }}
                      </p>
                      <p v-else class="mt-2 text-xs text-slate-500">
                        * Viết ít nhất 50 ký tự để thu hút ứng viên tốt hơn.
                      </p>
                    </Transition>
                  </div>
                </div>
              </div>

              <div
                class="bg-slate-50 px-8 py-6 border-t border-slate-100 rounded-b-3xl"
              >
                <div
                  class="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left"
                >
                  <p class="text-xs text-slate-400 max-w-lg">
                    Thông tin này sẽ được sử dụng để hiển thị trên trang hồ sơ
                    công ty và các tin tuyển dụng của bạn.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="sm:hidden fixed bottom-6 left-6 right-6 z-30">
        <button
          @click="saveCompanyInfo"
          :disabled="isLoading || isFetching"
          class="w-full shadow-2xl shadow-blue-600/30 bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70 disabled:grayscale"
        >
          <svg
            v-if="!isLoading"
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
            ></path>
          </svg>
          <svg
            v-else
            class="animate-spin h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {{ isLoading ? "Đang lưu..." : "Lưu hồ sơ" }}
        </button>
      </div>
    </main>

    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="toast.show"
        class="fixed bottom-6 right-6 z-[60] max-w-sm w-full bg-white shadow-2xl rounded-2xl pointer-events-auto ring-1 ring-black/5 overflow-hidden"
      >
        <div class="p-4 flex items-start gap-4">
          <div class="flex-shrink-0 pt-0.5">
            <div
              v-if="toast.type === 'success'"
              class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"
            >
              <svg
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div
              v-else
              class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600"
            >
              <svg
                class="h-6 w-6"
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
            </div>
          </div>
          <div class="flex-1">
            <p class="text-sm font-bold text-slate-900">
              {{
                toast.type === "success" ? "Thành công!" : "Đã có lỗi xảy ra"
              }}
            </p>
            <p class="mt-1 text-sm text-slate-500 leading-relaxed">
              {{ toast.message }}
            </p>
          </div>
          <button
            @click="toast.show = false"
            class="text-slate-400 hover:text-slate-500 transition-colors"
          >
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 10 5.707 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div class="h-1 w-full bg-slate-100">
          <div
            class="h-full transition-all duration-[4000ms] ease-linear w-full origin-left"
            :class="toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'"
            :style="{ transform: toast.show ? 'scaleX(0)' : 'scaleX(1)' }"
          ></div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Scrollbar tinh tế */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
  border: 2px solid #f8fafc;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
