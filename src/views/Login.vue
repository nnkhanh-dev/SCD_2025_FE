<script setup>
import { ref, reactive, onMounted } from "vue"; // Thêm onMounted
import { useRouter } from "vue-router";
import { toast } from "vue3-toastify";
// Import API
import { registerStudent, registerUser, registerCompany, loginUser } from "@/services/common/authService";

const router = useRouter();
const REMEMBER_KEY = "user_credentials"; // Key để lưu vào localStorage

// --- State Management ---
const isSignUp = ref(false);
const isLoading = ref(false);
const resumeFile = ref(null);
const resumeFileName = ref("");
const registrationStep = ref(1); // 1 or 2
const studentInputMethod = ref("manual"); // 'manual' or 'pdf'

// Form Data - Đăng nhập
const loginForm = reactive({
  email: "",
  password: "",
  remember: false,
});

// Form Data - Đăng ký Student
const registerForm = reactive({
  role: "Student",
  email: "",
  password: "",
  confirmPassword: "",
  name: "",
  gpa: "",
  skills: "",
  achievements: "",
  yearOfStudy: "",
  major: "",
  languages: "",
  certifications: "",
  experiences: "",
  projects: "",
  educations: "",
  agreeTerms: false,
});

// Form Data - Đăng ký Company
const registerCompanyForm = reactive({
  email: "",
  password: "",
  confirmPassword: "",
  companyName: "",
  companyWebsite: "",
  location: "",
  descriptions: "",
  agreeTerms: false,
});

// State lưu lỗi
const errors = reactive({
  registerEmail: "",
  registerPassword: "",
  confirmPassword: "",
  agreeTerms: "",
  registerName: "",
  resume: "",
  loginEmail: "",
  loginPassword: "",
  // Company errors
  companyEmail: "",
  companyPassword: "",
  companyConfirmPassword: "",
  companyName: "",
  companyWebsite: "",
  companyLocation: "",
  companyDescriptions: "",
  companyAgreeTerms: "",
});

// --- Lifecycle Hook: Load thông tin đã ghi nhớ ---
onMounted(() => {
  const savedCreds = localStorage.getItem(REMEMBER_KEY);
  if (savedCreds) {
    try {
      const parsed = JSON.parse(savedCreds);
      loginForm.email = parsed.email || "";
      loginForm.password = parsed.password || "";
      loginForm.remember = true; // Tự động tích vào ô checkbox
    } catch (e) {
      localStorage.removeItem(REMEMBER_KEY); // Xóa nếu dữ liệu lỗi
    }
  }

  // Kiểm tra query parameter để hiển thị toast
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("unauthorized") === "true") {
    toast.warning("Vui lòng đăng nhập!", {
      autoClose: 2000,
    });
  }
});

// --- Helper Functions ---
const getErrorMessage = (error) => {
  if (error.response && error.response.data) {
    return (
      error.response.data.message ||
      error.response.data.error ||
      "Lỗi từ máy chủ."
    );
  } else if (error.message) {
    return error.message;
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
};

const clearErrors = () => {
  Object.keys(errors).forEach((key) => (errors[key] = ""));
};

// --- Actions ---
const toggleMode = () => {
  isSignUp.value = !isSignUp.value;
  clearErrors();
  registrationStep.value = 1; // Reset to step 1
  studentInputMethod.value = "manual"; // Reset input method
};

const setRole = (role) => {
  registerForm.role = role;
  registrationStep.value = 1; // Reset to step 1 when changing role
  studentInputMethod.value = "manual"; // Reset input method
};

const nextStep = () => {
  if (registrationStep.value === 1) {
    // Validate step 1 before moving to step 2
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let isValid = true;
    
    errors.registerEmail = "";
    errors.registerPassword = "";
    errors.confirmPassword = "";
    
    if (!registerForm.email.trim()) {
      errors.registerEmail = "Vui lòng nhập email";
      isValid = false;
    } else if (!emailRegex.test(registerForm.email)) {
      errors.registerEmail = "Email không hợp lệ";
      isValid = false;
    }
    
    if (!registerForm.password || registerForm.password.length < 6) {
      errors.registerPassword = "Mật khẩu phải từ 6 ký tự trở lên";
      isValid = false;
    }
    
    if (registerForm.confirmPassword !== registerForm.password) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
      isValid = false;
    }
    
    if (isValid) {
      registrationStep.value = 2;
    }
  }
};

const prevStep = () => {
  if (registrationStep.value === 2) {
    registrationStep.value = 1;
  }
};

const setInputMethod = (method) => {
  studentInputMethod.value = method;
  if (method === "manual") {
    // Clear resume if switching to manual
    resumeFile.value = null;
    resumeFileName.value = "";
    errors.resume = "";
  }
};

const handleResumeUpload = (event) => {
  const file = event.target.files[0];
  errors.resume = "";
  
  if (!file) {
    resumeFile.value = null;
    resumeFileName.value = "";
    return;
  }

  // Validate file type
  if (file.type !== "application/pdf") {
    errors.resume = "Chỉ chấp nhận file PDF";
    event.target.value = "";
    return;
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    errors.resume = "Kích thước file không được vượt quá 10MB";
    event.target.value = "";
    return;
  }

  resumeFile.value = file;
  resumeFileName.value = file.name;
};

const removeResume = () => {
  resumeFile.value = null;
  resumeFileName.value = "";
  errors.resume = "";
};

// --- VALIDATION ---
const validateLogin = () => {
  let isValid = true;
  errors.loginEmail = "";
  errors.loginPassword = "";

  if (!loginForm.email) {
    errors.loginEmail = "Vui lòng nhập email";
    isValid = false;
  }
  if (!loginForm.password) {
    errors.loginPassword = "Vui lòng nhập mật khẩu";
    isValid = false;
  }
  return isValid;
};

const validateRegister = () => {
  let isValid = true;
  clearErrors();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (registerForm.role === "Student") {
    // Step 1 is validated in nextStep(), here we validate step 2
    if (studentInputMethod.value === "manual") {
      // Manual input validation
      if (!registerForm.name.trim()) {
        errors.registerName = "Vui lòng nhập tên";
        isValid = false;
      }
    } else if (studentInputMethod.value === "pdf") {
      // PDF upload validation
      if (!resumeFile.value) {
        errors.resume = "Vui lòng tải lên CV";
        isValid = false;
      }
    }

    if (!registerForm.agreeTerms) {
      errors.agreeTerms = "Bạn cần đồng ý điều khoản";
      isValid = false;
    }
  } else if (registerForm.role === "Company") {
    // Validate Company form
    if (!registerCompanyForm.email.trim()) {
      errors.companyEmail = "Vui lòng nhập email";
      isValid = false;
    } else if (!emailRegex.test(registerCompanyForm.email)) {
      errors.companyEmail = "Email không hợp lệ";
      isValid = false;
    }

    if (!registerCompanyForm.password || registerCompanyForm.password.length < 6) {
      errors.companyPassword = "Mật khẩu phải từ 6 ký tự trở lên";
      isValid = false;
    }

    if (registerCompanyForm.confirmPassword !== registerCompanyForm.password) {
      errors.companyConfirmPassword = "Mật khẩu xác nhận không khớp";
      isValid = false;
    }

    if (!registerCompanyForm.companyName.trim()) {
      errors.companyName = "Vui lòng nhập tên công ty";
      isValid = false;
    }

    if (!registerCompanyForm.location.trim()) {
      errors.companyLocation = "Vui lòng nhập địa chỉ công ty";
      isValid = false;
    }

    if (!registerCompanyForm.descriptions.trim()) {
      errors.companyDescriptions = "Vui lòng nhập mô tả công ty";
      isValid = false;
    }

    if (!registerCompanyForm.agreeTerms) {
      errors.companyAgreeTerms = "Bạn cần đồng ý điều khoản";
      isValid = false;
    }
  }

  return isValid;
};

// --- XỬ LÝ ĐĂNG NHẬP (LOGIN) ---
const handleLogin = async () => {
  if (!validateLogin()) return;

  try {
    isLoading.value = true;

    const payload = {
      email: loginForm.email,
      password: loginForm.password,
    };

    const res = await loginUser(payload);

    // 1. Lưu Token
    localStorage.setItem("token", res.access_token);
    localStorage.setItem("refreshToken", res.refresh_token);
    localStorage.setItem("userScope", res.scope);

    // 2. Xử lý logic "Ghi nhớ tôi"
    if (loginForm.remember) {
      // Nếu user chọn ghi nhớ -> Lưu thông tin
      const credentials = {
        email: loginForm.email,
        password: loginForm.password, // Lưu ý: Password lưu plaintext ở localStorage không bảo mật tuyệt đối 100%, nhưng ok với dự án portfolio/học tập.
      };
      localStorage.setItem(REMEMBER_KEY, JSON.stringify(credentials));
    } else {
      // Nếu user bỏ chọn -> Xóa thông tin cũ (nếu có)
      localStorage.removeItem(REMEMBER_KEY);
    }

    toast.success("Đăng nhập thành công! Đang chuyển hướng...");

    setTimeout(() => {
      switch (res.scope) {
        case "Student":
          router.push({ name: "student_dashboard" });
          break;
        case "Company":
          router.push({ name: "CompanyDashboard" });
          break;
        case "Admin":
          router.push({ name: "admin_dashboard" });
          break;
        default:
          router.push({ name: "Home" });
      }
    }, 1000);
  } catch (error) {
    console.error("Login Error:", error);
    const msg = getErrorMessage(error);
    toast.error(msg);
  } finally {
    isLoading.value = false;
  }
};

// --- XỬ LÝ ĐĂNG KÝ (REGISTER) ---
const handleRegister = async () => {
  if (!validateRegister()) return;

  try {
    isLoading.value = true;

    if (registerForm.role === "Student") {
      // Register Student with FormData
      const formData = new FormData();
      formData.append("Email", registerForm.email);
      formData.append("Password", registerForm.password);
      
      // Add resume if provided
      if (resumeFile.value) {
        formData.append("Resume", resumeFile.value);
      }
      
      // Add optional fields if filled
      if (registerForm.name) formData.append("Name", registerForm.name);
      if (registerForm.gpa) formData.append("GPA", registerForm.gpa);
      if (registerForm.skills) formData.append("Skills", registerForm.skills);
      if (registerForm.achievements) formData.append("Archievements", registerForm.achievements);
      if (registerForm.yearOfStudy) formData.append("YearOfStudy", registerForm.yearOfStudy);
      if (registerForm.major) formData.append("Major", registerForm.major);
      if (registerForm.languages) formData.append("Languages", registerForm.languages);
      if (registerForm.certifications) formData.append("Certifications", registerForm.certifications);
      if (registerForm.experiences) formData.append("Experiences", registerForm.experiences);
      if (registerForm.projects) formData.append("Projects", registerForm.projects);
      if (registerForm.educations) formData.append("Educations", registerForm.educations);

      const response = await registerStudent(formData);

      toast.success(response.ResumeProcessed 
        ? "Đăng ký thành công! CV đã được xử lý. Vui lòng đăng nhập." 
        : "Đăng ký thành công! Vui lòng đăng nhập."
      );

      toggleMode();
      loginForm.email = registerForm.email;
      loginForm.password = "";

      // Reset form
      registerForm.email = "";
      registerForm.password = "";
      registerForm.confirmPassword = "";
      registerForm.name = "";
      registerForm.gpa = "";
      registerForm.skills = "";
      registerForm.achievements = "";
      registerForm.yearOfStudy = "";
      registerForm.major = "";
      registerForm.languages = "";
      registerForm.certifications = "";
      registerForm.experiences = "";
      registerForm.projects = "";
      registerForm.educations = "";
      registerForm.agreeTerms = false;
      resumeFile.value = null;
      resumeFileName.value = "";
      registrationStep.value = 1;
      studentInputMethod.value = "manual";
    } else if (registerForm.role === "Company") {
      // Register Company
      const payload = {
        email: registerCompanyForm.email,
        password: registerCompanyForm.password,
        companyName: registerCompanyForm.companyName,
        companyWebsite: registerCompanyForm.companyWebsite,
        location: registerCompanyForm.location,
        descriptions: registerCompanyForm.descriptions,
      };

      await registerCompany(payload);

      toast.success("Đăng ký công ty thành công! Vui lòng đăng nhập.");

      toggleMode();
      loginForm.email = registerCompanyForm.email;
      loginForm.password = "";

      // Reset form
      registerCompanyForm.email = "";
      registerCompanyForm.password = "";
      registerCompanyForm.confirmPassword = "";
      registerCompanyForm.companyName = "";
      registerCompanyForm.companyWebsite = "";
      registerCompanyForm.location = "";
      registerCompanyForm.descriptions = "";
      registerCompanyForm.agreeTerms = false;
    }
  } catch (error) {
    console.error("Register Error:", error);
    const msg = getErrorMessage(error);
    toast.error(`Đăng ký thất bại: ${msg}`);
  } finally {
    isLoading.value = false;
  }
};

const handleSocialLogin = (provider) => {
  toast.info(`Tính năng đăng nhập ${provider} đang phát triển!`);
};
</script>

<template>
  <div
    class="min-h-screen bg-[#EEF2F6] flex items-center justify-center p-4 font-sans overflow-hidden"
  >
    <div
      class="bg-white rounded-[24px] shadow-2xl relative overflow-hidden w-full max-w-[1000px] min-h-[700px] transition-all duration-300 flex flex-col md:block"
      :class="{ 'right-panel-active': isSignUp }"
    >
      <div
        class="form-container sign-up-container absolute top-0 h-full transition-all duration-600 ease-in-out left-0 w-full md:w-1/2 opacity-0 z-10 bg-white"
        :class="
          isSignUp
            ? 'opacity-100 z-50 translate-x-0 md:translate-x-full'
            : 'opacity-0 z-0'
        "
      >
        <form
          @submit.prevent="handleRegister"
          class="flex flex-col items-center justify-center h-full px-8 md:px-12 text-center bg-white py-8 overflow-y-auto custom-scrollbar"
        >
          <h1 class="font-extrabold text-3xl mb-2 text-gray-800 tracking-tight">
            Tạo tài khoản mới
          </h1>
          <p class="text-sm text-gray-400 mb-6">
            Chọn vai trò phù hợp để bắt đầu
          </p>

          <div
            class="flex bg-gray-100 p-1.5 rounded-xl w-full max-w-sm mb-6 relative"
          >
            <button
              type="button"
              @click="setRole('Student')"
              class="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 z-10"
              :class="
                registerForm.role === 'Student'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              "
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
                  d="M12 14l9-5-9-5-9 5 9 5z"
                ></path>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                ></path>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                ></path>
              </svg>
              Sinh viên
            </button>
            <button
              type="button"
              @click="setRole('Company')"
              class="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 z-10"
              :class="
                registerForm.role === 'Company'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              "
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
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                ></path>
              </svg>
              Tuyển dụng
            </button>
          </div>

          <div class="flex flex-wrap gap-4 mb-6 w-full justify-center">
            <button
              type="button"
              @click="handleSocialLogin('google')"
              class="social-btn border-gray-200 hover:border-red-200 hover:bg-red-50"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </button>
            <button
              type="button"
              @click="handleSocialLogin('facebook')"
              class="social-btn border-gray-200 hover:border-blue-200 hover:bg-blue-50"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
            </button>
            <button
              type="button"
              @click="handleSocialLogin('github')"
              class="social-btn border-gray-200 hover:border-gray-200 hover:bg-gray-50"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                />
              </svg>
            </button>
          </div>

          <div class="w-full space-y-3 max-w-sm">
            <!-- Student Form -->
            <template v-if="registerForm.role === 'Student'">
              <!-- Progress Steps -->
              <div class="flex items-center justify-center mb-4">
                <div class="flex items-center">
                  <div class="flex items-center justify-center w-8 h-8 rounded-full transition-all" :class="registrationStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'">
                    <span class="text-xs font-bold">1</span>
                  </div>
                  <div class="w-16 h-1 mx-2" :class="registrationStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'"></div>
                  <div class="flex items-center justify-center w-8 h-8 rounded-full transition-all" :class="registrationStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'">
                    <span class="text-xs font-bold">2</span>
                  </div>
                </div>
              </div>

              <!-- Step 1: Email & Password -->
              <template v-if="registrationStep === 1">
                <h3 class="text-sm font-bold text-gray-700 mb-3">Bước 1: Thông tin đăng nhập</h3>
                
                <!-- Email -->
                <div class="w-full">
                  <div class="relative group">
                    <div
                      class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"
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
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        ></path>
                      </svg>
                    </div>
                    <input
                      v-model="registerForm.email"
                      type="email"
                      placeholder="Email đăng nhập"
                      class="input-field"
                      :class="{
                        'border-red-500 bg-red-50 focus:border-red-500 focus:shadow-red':
                          errors.registerEmail,
                      }"
                    />
                  </div>
                  <p
                    v-if="errors.registerEmail"
                    class="text-red-500 text-xs text-left mt-1 pl-2 font-medium"
                  >
                    {{ errors.registerEmail }}
                  </p>
                </div>

                <!-- Password -->
                <div class="w-full">
                  <div class="relative group">
                    <div
                      class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"
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
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        ></path>
                      </svg>
                    </div>
                    <input
                      v-model="registerForm.password"
                      type="password"
                      placeholder="Mật khẩu"
                      class="input-field"
                      :class="{
                        'border-red-500 bg-red-50 focus:border-red-500 focus:shadow-red':
                          errors.registerPassword,
                      }"
                    />
                  </div>
                  <p
                    v-if="errors.registerPassword"
                    class="text-red-500 text-xs text-left mt-1 pl-2 font-medium"
                  >
                    {{ errors.registerPassword }}
                  </p>
                </div>

                <!-- Confirm Password -->
                <div class="w-full">
                  <div class="relative group">
                    <div
                      class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                    </div>
                    <input
                      v-model="registerForm.confirmPassword"
                      type="password"
                      placeholder="Xác nhận mật khẩu"
                      class="input-field"
                      :class="{
                        'border-red-500 bg-red-50 focus:border-red-500 focus:shadow-red':
                          errors.confirmPassword,
                      }"
                    />
                  </div>
                  <p
                    v-if="errors.confirmPassword"
                    class="text-red-500 text-xs text-left mt-1 pl-2 font-medium"
                  >
                    {{ errors.confirmPassword }}
                  </p>
                </div>

                <button 
                  type="button"
                  @click="nextStep"
                  class="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Tiếp theo →
                </button>
              </template>

              <!-- Step 2: Student Info -->
              <template v-else-if="registrationStep === 2">
                <h3 class="text-sm font-bold text-gray-700 mb-3">Bước 2: Thông tin sinh viên</h3>
                
                <!-- Input Method Selection -->
                <div class="flex gap-3 mb-4">
                  <button
                    type="button"
                    @click="setInputMethod('manual')"
                    class="flex-1 py-3 px-4 rounded-xl border-2 transition-all text-sm font-bold"
                    :class="studentInputMethod === 'manual' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'"
                  >
                    <svg class="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Nhập thủ công
                  </button>
                  <button
                    type="button"
                    @click="setInputMethod('pdf')"
                    class="flex-1 py-3 px-4 rounded-xl border-2 transition-all text-sm font-bold"
                    :class="studentInputMethod === 'pdf' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'"
                  >
                    <svg class="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    Upload PDF
                  </button>
                </div>

                <!-- Manual Input -->
                <template v-if="studentInputMethod === 'manual'">
                  <div class="w-full">
                    <div class="relative group">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                      <input
                        v-model="registerForm.name"
                        type="text"
                        placeholder="Họ và tên *"
                        class="input-field"
                        :class="{ 'border-red-500 bg-red-50 focus:border-red-500 focus:shadow-red': errors.registerName }"
                      />
                    </div>
                    <p v-if="errors.registerName" class="text-red-500 text-xs text-left mt-1 pl-2 font-medium">
                      {{ errors.registerName }}
                    </p>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <input v-model="registerForm.major" type="text" placeholder="Chuyên ngành" class="input-field px-3 py-2.5 text-xs" />
                    <input v-model="registerForm.yearOfStudy" type="text" placeholder="Năm học" class="input-field px-3 py-2.5 text-xs" />
                  </div>
                  
                  <input v-model="registerForm.gpa" type="text" placeholder="GPA" class="input-field px-3 py-2.5 text-xs" />
                  <textarea v-model="registerForm.skills" rows="2" placeholder="Kỹ năng" class="input-field resize-none text-xs"></textarea>
                </template>

                <!-- PDF Upload -->
                <template v-else>
                  <div class="w-full">
                    <input type="file" @change="handleResumeUpload" accept=".pdf" class="hidden" id="resume-upload" />
                    <label for="resume-upload" class="flex flex-col items-center justify-center w-full px-4 py-8 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <svg class="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                      <span class="text-sm font-medium text-gray-600 mb-1">
                        {{ resumeFileName || 'Chọn file CV (PDF)' }}
                      </span>
                      <span class="text-xs text-gray-500">Max 10MB - Tự động phân tích bằng AI</span>
                    </label>
                    <button v-if="resumeFileName" @click="removeResume" type="button" class="mt-2 text-sm text-red-500 hover:text-red-700 font-medium">
                      ✕ Xóa file
                    </button>
                    <p v-if="errors.resume" class="text-red-500 text-xs text-left mt-1 pl-2 font-medium">
                      {{ errors.resume }}
                    </p>
                  </div>
                </template>

                <div class="flex gap-2">
                  <button 
                    type="button"
                    @click="prevStep"
                    class="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                  >
                    ← Quay lại
                  </button>
                  <button 
                    type="submit"
                    class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                    :disabled="isLoading"
                  >
                    {{ isLoading ? "Đang xử lý..." : "Đăng ký" }}
                  </button>
                </div>
              </template>
            </template>

            <!-- Company Form -->
            <template v-else>
              <div class="w-full">
                <div class="relative group">
                  <div
                    class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      ></path>
                    </svg>
                  </div>
                  <input
                    v-model="registerCompanyForm.companyName"
                    type="text"
                    placeholder="Tên công ty"
                    class="input-field"
                    :class="{
                      'border-red-500 bg-red-50 focus:border-red-500 focus:shadow-red':
                        errors.companyName,
                    }"
                  />
                </div>
                <p
                  v-if="errors.companyName"
                  class="text-red-500 text-xs text-left mt-1 pl-2 font-medium"
                >
                  {{ errors.companyName }}
                </p>
              </div>

              <div class="w-full">
                <div class="relative group">
                  <div
                    class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"
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
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      ></path>
                    </svg>
                  </div>
                  <input
                    v-model="registerCompanyForm.email"
                    type="email"
                    placeholder="Email công ty"
                    class="input-field"
                    :class="{
                      'border-red-500 bg-red-50 focus:border-red-500 focus:shadow-red':
                        errors.companyEmail,
                    }"
                  />
                </div>
                <p
                  v-if="errors.companyEmail"
                  class="text-red-500 text-xs text-left mt-1 pl-2 font-medium"
                >
                  {{ errors.companyEmail }}
                </p>
              </div>

              <div class="w-full">
                <div class="relative group">
                  <div
                    class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"
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
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                      ></path>
                    </svg>
                  </div>
                  <input
                    v-model="registerCompanyForm.companyWebsite"
                    type="url"
                    placeholder="Website công ty (không bắt buộc)"
                    class="input-field"
                  />
                </div>
              </div>

              <div class="w-full">
                <div class="relative group">
                  <div
                    class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      ></path>
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                    </svg>
                  </div>
                  <input
                    v-model="registerCompanyForm.location"
                    type="text"
                    placeholder="Địa chỉ công ty"
                    class="input-field"
                    :class="{
                      'border-red-500 bg-red-50 focus:border-red-500 focus:shadow-red':
                        errors.companyLocation,
                    }"
                  />
                </div>
                <p
                  v-if="errors.companyLocation"
                  class="text-red-500 text-xs text-left mt-1 pl-2 font-medium"
                >
                  {{ errors.companyLocation }}
                </p>
              </div>

              <div class="w-full">
                <div class="relative group">
                  <textarea
                    v-model="registerCompanyForm.descriptions"
                    rows="3"
                    placeholder="Mô tả về công ty"
                    class="w-full px-4 py-3 pl-10 bg-gray-100 border border-transparent rounded-xl text-sm font-medium text-gray-700 transition-all outline-none resize-none focus:bg-white focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10"
                    :class="{
                      'border-red-500 bg-red-50 focus:border-red-500 focus:shadow-red':
                        errors.companyDescriptions,
                    }"
                  ></textarea>
                  <div
                    class="absolute top-3 left-0 pl-3 flex items-start pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                  </div>
                </div>
                <p
                  v-if="errors.companyDescriptions"
                  class="text-red-500 text-xs text-left mt-1 pl-2 font-medium"
                >
                  {{ errors.companyDescriptions }}
                </p>
              </div>

              <div class="w-full">
                <div class="relative group">
                  <div
                    class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"
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
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      ></path>
                    </svg>
                  </div>
                  <input
                    v-model="registerCompanyForm.password"
                    type="password"
                    placeholder="Mật khẩu"
                    class="input-field"
                    :class="{
                      'border-red-500 bg-red-50 focus:border-red-500 focus:shadow-red':
                        errors.companyPassword,
                    }"
                  />
                </div>
                <p
                  v-if="errors.companyPassword"
                  class="text-red-500 text-xs text-left mt-1 pl-2 font-medium"
                >
                  {{ errors.companyPassword }}
                </p>
              </div>

              <div class="w-full">
                <div class="relative group">
                  <div
                    class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                  <input
                    v-model="registerCompanyForm.confirmPassword"
                    type="password"
                    placeholder="Xác nhận mật khẩu"
                    class="input-field"
                    :class="{
                      'border-red-500 bg-red-50 focus:border-red-500 focus:shadow-red':
                        errors.companyConfirmPassword,
                    }"
                  />
                </div>
                <p
                  v-if="errors.companyConfirmPassword"
                  class="text-red-500 text-xs text-left mt-1 pl-2 font-medium"
                >
                  {{ errors.companyConfirmPassword }}
                </p>
              </div>
            </template>
          </div>

          <div class="w-full max-w-sm mt-4" v-if="registerForm.role === 'Company' || (registerForm.role === 'Student' && registrationStep === 2)">
            <div class="flex items-center w-full">
              <input
                type="checkbox"
                :checked="registerForm.role === 'Student' ? registerForm.agreeTerms : registerCompanyForm.agreeTerms"
                @change="registerForm.role === 'Student' ? (registerForm.agreeTerms = $event.target.checked) : (registerCompanyForm.agreeTerms = $event.target.checked)"
                class="rounded text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
              />
              <label class="ml-2 text-xs text-gray-500"
                >Tôi đồng ý với
                <a href="#" class="text-blue-600 font-bold hover:underline"
                  >Điều khoản & Chính sách</a
                ></label
              >
            </div>
            <p
              v-if="registerForm.role === 'Student' ? errors.agreeTerms : errors.companyAgreeTerms"
              class="text-red-500 text-xs text-left mt-1 font-medium"
            >
              {{ registerForm.role === 'Student' ? errors.agreeTerms : errors.companyAgreeTerms }}
            </p>
          </div>

          <button v-if="registerForm.role === 'Company'" class="main-btn mt-6" :disabled="isLoading">
            {{ isLoading ? "Đang xử lý..." : "Đăng Ký Ngay" }}
          </button>

          <div class="mt-6 md:hidden">
            <p class="text-sm text-gray-600">
              Đã có tài khoản?
              <span
                @click="toggleMode"
                class="text-blue-600 font-bold cursor-pointer"
                >Đăng nhập</span
              >
            </p>
          </div>
        </form>
      </div>

      <div
        class="form-container sign-in-container absolute top-0 h-full transition-all duration-600 ease-in-out left-0 w-full md:w-1/2 z-20 bg-white"
        :class="
          isSignUp
            ? 'md:translate-x-full opacity-0 md:opacity-0 pointer-events-none'
            : 'z-20 opacity-100'
        "
      >
        <form
          @submit.prevent="handleLogin"
          class="flex flex-col items-center justify-center h-full px-8 md:px-12 text-center bg-white"
        >
          <div class="flex items-center gap-2 mb-6">
            <div
              class="transition-transform hover:scale-105"
            >
              <img
                src="/logo_connect_edu.png"
                alt="ConnectEdu Logo"
                class="w-16 h-16 object-contain"
              />
            </div>
            <span class="text-2xl font-bold text-gray-800 tracking-tight bg-gradient-to-r from-[#2563EB] to-[#4F46E5] bg-clip-text text-transparent"
              >ConnectEdu</span
            >
          </div>
          <h1 class="font-extrabold text-3xl mb-2 text-gray-800">
            Chào mừng trở lại!
          </h1>
          <p class="text-sm text-gray-400 mb-6">
            Tiếp tục hành trình phát triển sự nghiệp
          </p>

          <div class="flex flex-wrap gap-4 mb-6 w-full justify-center">
            <button
              type="button"
              @click="handleSocialLogin('google')"
              class="social-btn border-gray-200 hover:border-red-200 hover:bg-red-50"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </button>
            <button
              type="button"
              @click="handleSocialLogin('facebook')"
              class="social-btn border-gray-200 hover:border-blue-200 hover:bg-blue-50"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
            </button>
            <button
              type="button"
              @click="handleSocialLogin('github')"
              class="social-btn border-gray-200 hover:border-gray-200 hover:bg-gray-50"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                />
              </svg>
            </button>
          </div>

          <div class="w-full space-y-4 max-w-sm">
            <div class="w-full">
              <div class="relative group">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"
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
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    ></path>
                  </svg>
                </div>
                <input
                  v-model="loginForm.email"
                  type="email"
                  placeholder="Email của bạn"
                  class="input-field"
                  :class="{
                    'border-red-500 bg-red-50 focus:border-red-500 focus:shadow-red':
                      errors.loginEmail,
                  }"
                />
              </div>
              <p
                v-if="errors.loginEmail"
                class="text-red-500 text-xs text-left mt-1 pl-2 font-medium"
              >
                {{ errors.loginEmail }}
              </p>
            </div>

            <div class="w-full">
              <div class="relative group">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    ></path>
                  </svg>
                </div>
                <input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="Mật khẩu"
                  class="input-field"
                  :class="{
                    'border-red-500 bg-red-50 focus:border-red-500 focus:shadow-red':
                      errors.loginPassword,
                  }"
                />
              </div>
              <p
                v-if="errors.loginPassword"
                class="text-red-500 text-xs text-left mt-1 pl-2 font-medium"
              >
                {{ errors.loginPassword }}
              </p>
            </div>
          </div>

          <div
            class="flex items-center justify-between w-full max-w-sm mt-5 mb-8"
          >
            <div class="flex items-center">
              <input
                type="checkbox"
                v-model="loginForm.remember"
                class="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
              />
              <label class="ml-2 text-xs text-gray-600">Ghi nhớ tôi</label>
            </div>
            <a href="#" class="text-xs text-blue-600 font-bold hover:underline"
              >Quên mật khẩu?</a
            >
          </div>

          <button class="main-btn" :disabled="isLoading">
            {{ isLoading ? "Đang xác thực..." : "Đăng Nhập" }}
          </button>

          <div class="mt-8 md:hidden">
            <p class="text-sm text-gray-600">
              Chưa có tài khoản?
              <span
                @click="toggleMode"
                class="text-blue-600 font-bold cursor-pointer"
                >Đăng ký ngay</span
              >
            </p>
          </div>
        </form>
      </div>

      <div
        class="hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-600 ease-in-out z-50"
        :class="isSignUp ? '-translate-x-full' : ''"
      >
        <div
          class="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white relative -left-full h-full w-[200%] transform transition-transform duration-600 ease-in-out flex flex-row"
          :class="isSignUp ? 'translate-x-1/2' : 'translate-x-0'"
        >
          <div
            class="flex flex-col items-center justify-center text-center px-10 w-1/2 h-full absolute top-0 left-0 transform transition-transform duration-600 ease-in-out"
            :class="isSignUp ? 'translate-x-0' : '-translate-x-[20%]'"
          >
            <h1 class="text-4xl font-extrabold mb-4 drop-shadow-lg">
              Bạn đã có tài khoản?
            </h1>
            <p
              class="text-lg mb-8 font-light text-blue-100 max-w-sm leading-relaxed"
            >
              Hãy đăng nhập để cập nhật hồ sơ và tìm kiếm cơ hội mới.
            </p>
            <button @click="toggleMode" class="ghost-btn group">
              <span>Đăng Nhập Ngay</span>
            </button>
          </div>
          <div
            class="flex flex-col items-center justify-center text-center px-10 w-1/2 h-full absolute top-0 right-0 transform transition-transform duration-600 ease-in-out"
            :class="isSignUp ? 'translate-x-[20%]' : 'translate-x-0'"
          >
            <h1 class="text-4xl font-extrabold mb-4 drop-shadow-lg">
              Thành viên mới?
            </h1>
            <p
              class="text-lg mb-8 font-light text-blue-100 max-w-sm leading-relaxed"
            >
              Bạn là <strong>Sinh viên</strong> hay
              <strong>Nhà tuyển dụng</strong>? Hãy bắt đầu ngay hôm nay.
            </p>
            <button @click="toggleMode" class="ghost-btn group">
              <span>Đăng Ký Miễn Phí</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.social-btn {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  border-width: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}
.social-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.input-field {
  width: 100%;
  background-color: #f3f4f6;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 12px 16px 12px 48px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s;
  outline: none;
}
.input-field:focus {
  background-color: white;
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}
.input-field.focus\:shadow-red:focus {
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

.main-btn {
  width: 100%;
  max-width: 24rem;
  border-radius: 9999px;
  background-image: linear-gradient(to right, #2563eb, #4f46e5);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  text-transform: uppercase;
  padding: 14px 20px;
  letter-spacing: 0.05em;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
}
.main-btn:hover {
  background-image: linear-gradient(to right, #1d4ed8, #4338ca);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}
.main-btn:active {
  transform: scale(0.98);
}
.main-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.ghost-btn {
  border-radius: 9999px;
  border: 2px solid white;
  background-color: transparent;
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  text-transform: uppercase;
  padding: 12px 32px;
  letter-spacing: 0.05em;
  transition: all 0.3s;
  display: flex;
  align-items: center;
}
.ghost-btn:hover {
  background-color: white;
  color: #2563eb;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}
</style>
