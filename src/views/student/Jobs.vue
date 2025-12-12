<script setup>
import { ref, onMounted, computed } from "vue";
import { toast } from "vue3-toastify";
import StudentSidebar from "@/common/student/sidebar.vue";
import { studentService } from "@/services/student/studentService";

// --- STATE UI ---
const isSidebarOpen = ref(false);
const isLoading = ref(false);
const showJobModal = ref(false);
const isFetchingDetail = ref(false);

// --- DATA ---
const studentProfile = ref(null);
const jobSuggestions = ref([]);
const selectedJob = ref(null);
const selectedCompany = ref(null);

// --- FILTERS ---
const selectedCategory = ref("all");
const searchQuery = ref("");
const sortBy = ref("match");

const categories = ref([{ id: "all", name: "Tất cả", count: 0 }]);

// --- COMPUTED ---
const filteredJobs = computed(() => {
  let jobs = jobSuggestions.value;

  if (selectedCategory.value !== "all") {
    jobs = jobs.filter((job) => job.categoryId === selectedCategory.value);
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    jobs = jobs.filter(
      (job) =>
        job.title?.toLowerCase().includes(query) ||
        job.companyName?.toLowerCase().includes(query)
    );
  }

  if (sortBy.value === "match") {
    jobs = [...jobs].sort((a, b) => b.similarityScore - a.similarityScore);
  } else if (sortBy.value === "date") {
    jobs = [...jobs].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  } else if (sortBy.value === "salary") {
    jobs = [...jobs].sort((a, b) => {
      const salaryA = parseInt(a.salaryRange?.match(/\d+/)?.[0] || 0);
      const salaryB = parseInt(b.salaryRange?.match(/\d+/)?.[0] || 0);
      return salaryB - salaryA;
    });
  }

  return jobs;
});

// --- HELPER FUNCTIONS ---
const updateCategoryCounts = () => {
  categories.value.forEach((cat) => {
    if (cat.id === "all") {
      cat.count = jobSuggestions.value.length;
    } else {
      cat.count = jobSuggestions.value.filter(
        (job) => job.categoryId === cat.id
      ).length;
    }
  });
};

const getMatchColor = (score) => {
  if (score >= 90) return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (score >= 80) return "bg-blue-50 text-blue-700 border-blue-100";
  return "bg-amber-50 text-amber-700 border-amber-100";
};

const getCategoryIcon = (categoryId) => {
  const icons = [
    "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
    "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
    "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  ];
  const index = typeof categoryId === "number" ? categoryId % icons.length : 0;
  return icons[index];
};

// --- API ACTIONS ---
const fetchCategories = async () => {
  try {
    const response = await studentService.getCategories();
    const apiCategories = response.data || response;
    const mappedCategories = apiCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      count: 0,
    }));
    categories.value = [
      { id: "all", name: "Tất cả", count: 0 },
      ...mappedCategories,
    ];
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
};

const fetchJobSuggestions = async () => {
  try {
    isLoading.value = true;
    const profile = await studentService.getMyProfile();
    studentProfile.value = profile;

    if (profile?.id) {
      const suggestions = await studentService.getJobSuggestions(profile.id);

      // === LOGIC MỚI: Tự động lấy Logo cho từng Job ===
      // Vì API suggestions không trả về logo, ta phải gọi API Company để lấy
      const jobsWithLogo = await Promise.all(
        suggestions.map(async (job) => {
          let logoUrl = null;
          if (job.companyInforId) {
            try {
              const companyRes = await studentService.getCompanyById(
                job.companyInforId
              );
              const companyData = companyRes.data || companyRes;
              logoUrl = companyData.logoUrl;
            } catch (e) {
              // Bỏ qua lỗi nếu không lấy được logo
            }
          }
          return { ...job, logoUrl }; // Gắn logoUrl vào job
        })
      );

      jobSuggestions.value = jobsWithLogo || [];
      updateCategoryCounts();
    }
  } catch (error) {
    console.error(error);
    toast.error("Không thể tải danh sách việc làm.");
  } finally {
    isLoading.value = false;
  }
};

const openJobDetail = async (job) => {
  selectedJob.value = job;
  showJobModal.value = true;
  isFetchingDetail.value = true;
  selectedCompany.value = null;

  try {
    if (job.companyInforId) {
      const response = await studentService.getCompanyById(job.companyInforId);
      selectedCompany.value = response.data || response;
    }
  } catch (error) {
    console.error(error);
  } finally {
    isFetchingDetail.value = false;
  }
};

const handleApply = async (jobId) => {
  try {
    await studentService.applyJob(jobId);
    toast.success("Ứng tuyển thành công!");
    showJobModal.value = false;
  } catch (error) {
    console.error("Apply error:", error);
    toast.error("Có lỗi xảy ra khi ứng tuyển.");
  }
};

onMounted(async () => {
  await fetchCategories();
  await fetchJobSuggestions();
});
</script>

<template>
  <div class="flex h-screen bg-[#F5F7FA] font-sans">
    <StudentSidebar
      :is-open="isSidebarOpen"
      @close-sidebar="isSidebarOpen = false"
    />

    <div class="flex-1 flex flex-col overflow-hidden">
      <header
        class="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm px-6 py-4 flex items-center justify-between"
      >
        <div class="flex items-center gap-4">
          <button
            @click="isSidebarOpen = !isSidebarOpen"
            class="md:hidden text-gray-500"
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
            <h2 class="text-xl font-bold text-gray-800">Gợi ý việc làm</h2>
            <p class="text-sm text-gray-500 hidden sm:block">
              Dành cho {{ studentProfile?.name }}
            </p>
          </div>
        </div>
        <div
          class="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-sm border border-blue-200"
        >
          {{ studentProfile?.name?.charAt(0) || "U" }}
        </div>
      </header>

      <main
        class="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 custom-scrollbar"
      >
        <div
          class="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center"
        >
          <div
            class="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar"
          >
            <button
              v-for="cat in categories"
              :key="cat.id"
              @click="selectedCategory = cat.id"
              :class="[
                'whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border',
                selectedCategory === cat.id
                  ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
              ]"
            >
              {{ cat.name }}
              <span class="text-xs opacity-70 ml-1">({{ cat.count }})</span>
            </button>
          </div>

          <div class="flex gap-3 w-full md:w-auto">
            <div class="relative flex-1 md:w-64">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Tìm kiếm..."
                class="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              />
              <svg
                class="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
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
            </div>
            <select
              v-model="sortBy"
              class="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
            >
              <option value="match">Phù hợp nhất</option>
              <option value="salary">Lương cao nhất</option>
              <option value="date">Mới nhất</option>
            </select>
          </div>
        </div>

        <div v-if="isLoading" class="flex justify-center py-20">
          <div
            class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"
          ></div>
        </div>

        <div v-else-if="filteredJobs.length === 0" class="text-center py-20">
          <p class="text-gray-500">Không tìm thấy công việc phù hợp.</p>
        </div>

        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          <div
            v-for="job in filteredJobs"
            :key="job.id"
            class="bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group h-full"
          >
            <div class="flex justify-between items-start mb-4">
              <div class="flex gap-4">
                <div
                  class="w-16 h-16 rounded-xl border border-gray-200 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-sm"
                >
                  <img
                    v-if="job.logoUrl"
                    :src="job.logoUrl"
                    class="w-full h-full object-contain"
                    alt="Logo"
                  />
                  <div
                    v-else
                    class="text-2xl font-bold text-gray-400 select-none"
                  >
                    {{ job.companyName?.charAt(0) || "C" }}
                  </div>
                </div>

                <div class="flex-1 min-w-0 pt-1">
                  <h3
                    class="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1"
                    :title="job.title"
                  >
                    {{ job.title }}
                  </h3>
                  <p
                    class="text-sm text-blue-600 font-medium truncate max-w-[150px]"
                  >
                    {{ job.companyName }}
                  </p>
                </div>
              </div>
              <div
                :class="[
                  'px-2.5 py-1 rounded-lg text-xs font-bold border whitespace-nowrap shrink-0',
                  getMatchColor(Math.round(job.similarityScore * 100)),
                ]"
              >
                {{ Math.round(job.similarityScore * 100) }}%
              </div>
            </div>

            <div class="space-y-3 mb-4 flex-1">
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <svg
                  class="w-4 h-4 text-gray-400 shrink-0"
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
                <span class="truncate">{{ job.location }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <svg
                  class="w-4 h-4 text-gray-400 shrink-0"
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
                <span class="truncate"
                  >{{ job.dayOfWeek || "T2-T6" }}
                  <span v-if="job.timeOfDay" class="text-gray-400"
                    >| {{ job.timeOfDay }}</span
                  ></span
                >
              </div>

              <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm pt-1">
                <div class="flex items-center gap-2 text-gray-600">
                  <svg
                    class="w-4 h-4 text-green-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span class="font-bold text-green-600">{{
                    job.salaryRange || "Thỏa thuận"
                  }}</span>
                </div>
                <div class="flex items-center gap-2 text-gray-600">
                  <svg
                    class="w-4 h-4 text-gray-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      :d="getCategoryIcon(job.categoryId)"
                    />
                  </svg>
                  <span class="truncate max-w-[120px]">{{
                    job.categoryName || "Chưa phân loại"
                  }}</span>
                </div>
              </div>

              <div
                class="flex gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-600 mt-2"
              >
                <svg
                  class="w-4 h-4 text-blue-500 shrink-0 mt-0.5"
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
                <div
                  class="line-clamp-2 prose prose-xs max-w-none"
                  v-html="
                    job.requirements || 'Xem chi tiết để biết thêm thông tin.'
                  "
                ></div>
              </div>
            </div>

            <div class="mt-auto pt-4 border-t border-gray-100 flex gap-3">
              <button
                @click="openJobDetail(job)"
                class="flex-1 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition-all"
              >
                Xem chi tiết
              </button>
              <button
                @click.stop="handleApply(job.id)"
                class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-blue-200 transition-all active:scale-95"
              >
                Ứng tuyển ngay
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>

    <Teleport to="body">
      <div
        v-if="showJobModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <div
          class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          @click="showJobModal = false"
        ></div>
        <div
          class="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl relative flex flex-col overflow-hidden animate-fade-in-up"
        >
          <div
            v-if="isFetchingDetail"
            class="flex-1 flex flex-col items-center justify-center"
          >
            <div
              class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"
            ></div>
            <p class="text-gray-500">Đang tải thông tin...</p>
          </div>
          <div v-else class="flex flex-col h-full">
            <div
              class="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-white sticky top-0 z-10"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-16 h-16 rounded-xl border border-gray-200 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden"
                >
                  <img
                    v-if="selectedCompany?.logoUrl"
                    :src="getLogoUrl(selectedCompany.logoUrl)"
                    class="w-full h-full object-contain"
                  />
                  <div v-else class="text-2xl font-bold text-gray-400">
                    {{ selectedJob?.companyName?.charAt(0) }}
                  </div>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-gray-900">
                    {{ selectedJob?.title }}
                  </h3>
                  <div
                    class="flex items-center gap-2 text-sm text-gray-500 mt-1"
                  >
                    <span class="font-semibold text-blue-600">{{
                      selectedJob?.companyName
                    }}</span>
                    <span>•</span>
                    <span>{{ selectedJob?.location }}</span>
                  </div>
                </div>
              </div>
              <button
                @click="showJobModal = false"
                class="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
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
            <div
              class="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50 custom-scrollbar"
            >
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 space-y-6">
                  <div
                    class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-4"
                  >
                    <div
                      class="flex items-center gap-2 text-sm font-medium text-gray-700"
                    >
                      <div
                        class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600"
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
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      {{ selectedJob?.salaryRange }}
                    </div>
                    <div
                      class="flex items-center gap-2 text-sm font-medium text-gray-700"
                    >
                      <div
                        class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      {{ selectedJob?.timeOfDay }} ({{
                        selectedJob?.dayOfWeek
                      }})
                    </div>
                    <div
                      class="flex items-center gap-2 text-sm font-medium text-gray-700"
                    >
                      <div
                        class="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600"
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
                            :d="getCategoryIcon(selectedJob?.categoryId)"
                          />
                        </svg>
                      </div>
                      {{ selectedJob?.categoryName }}
                    </div>
                  </div>
                  <div
                    class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6"
                  >
                    <div>
                      <h4 class="text-lg font-bold text-gray-900 mb-3">
                        Mô tả công việc
                      </h4>
                      <div
                        class="prose prose-sm prose-blue max-w-none text-gray-600"
                        v-html="selectedJob?.description"
                      ></div>
                    </div>
                    <hr class="border-gray-100" />
                    <div>
                      <h4 class="text-lg font-bold text-gray-900 mb-3">
                        Yêu cầu ứng viên
                      </h4>
                      <div
                        class="prose prose-sm prose-blue max-w-none text-gray-600"
                        v-html="selectedJob?.requirements"
                      ></div>
                    </div>
                    <hr class="border-gray-100" />
                    <div v-if="selectedJob?.benefits">
                      <h4 class="text-lg font-bold text-gray-900 mb-3">
                        Quyền lợi
                      </h4>
                      <div
                        class="prose prose-sm prose-blue max-w-none text-gray-600"
                        v-html="selectedJob?.benefits"
                      ></div>
                    </div>
                  </div>
                </div>
                <div class="lg:col-span-1 space-y-6">
                  <div
                    class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm sticky top-0"
                  >
                    <h4 class="font-bold text-gray-900 mb-4">
                      Thông tin chung
                    </h4>
                    <button
                      @click="handleApply(selectedJob.id)"
                      class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-transform active:scale-95 mb-4"
                    >
                      Ứng tuyển ngay
                    </button>
                    <div
                      v-if="selectedCompany"
                      class="bg-gray-50 p-4 rounded-xl border border-gray-100"
                    >
                      <h5 class="font-bold text-sm text-gray-900 mb-2">
                        Về {{ selectedCompany.companyName }}
                      </h5>
                      <p
                        class="text-xs text-gray-600 line-clamp-4 mb-3"
                        v-html="selectedCompany.description"
                      ></p>
                      <a
                        v-if="selectedCompany.companyWebsite"
                        :href="selectedCompany.companyWebsite"
                        target="_blank"
                        class="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                        >Truy cập Website
                        <svg
                          class="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          /></svg
                      ></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
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
:deep(.prose p) {
  margin-bottom: 0.5rem;
}
:deep(.prose ul) {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
