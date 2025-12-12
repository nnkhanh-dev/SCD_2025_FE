import { createRouter, createWebHistory } from "vue-router";
import { toast } from "vue3-toastify";
import Home from "../views/Home.vue";
import Login from "../views/Login.vue";
import AdminDashboard from "../views/admin/Dashboard.vue";
import StudentDashboard from "../views/student/Dashboard.vue";
import CompanyDashboard from "../views/company/Dashboard.vue";
import CompanyCreateJob from "../views/company/CreateJob.vue";
import CompanyJobs from "../views/company/Jobs.vue";
import CompanyJobCandidates from "../views/company/JobCandidates.vue";
import CompanyProfile from "../views/company/CompanyProfile.vue";
import CompanyCandidates from "../views/company/Candidates.vue";
import CompanyInvitations from "../views/company/Invitations.vue";
import StudentJobs from "../views/student/Jobs.vue";
import StudentSettings from "../views/student/Settings.vue";
import StudentApplications from "../views/student/Applications.vue";
import StudentInvitations from "../views/student/Invitations.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  // Admin routes - chỉ Admin mới truy cập được
  // {
  //   path: "/admin/dashboard",
  //   name: "admin_dashboard",
  //   component: AdminDashboard,
  // },

  // Admin routes - chỉ Admin mới truy cập được
  {
    path: "/admin/dashboard",
    name: "admin_dashboard",
    component: AdminDashboard,
    meta: { requiresScope: "Admin" },
  },
  {
    path: "/admin/users",
    name: "admin_users",
    component: AdminDashboard, // Thay bằng component thực tế
    meta: { requiresScope: "Admin" },
  },
  {
    path: "/admin/settings",
    name: "admin_settings",
    component: AdminDashboard, // Thay bằng component thực tế
    meta: { requiresScope: "Admin" },
  },

  // Student routes - chỉ Student mới truy cập được
  {
    path: "/student/dashboard",
    name: "student_dashboard",
    component: StudentDashboard,
    // meta: { requiresScope: "Student" },
  },
  {
    path: "/student/profile",
    name: "student_profile",
    component: StudentDashboard, // Thay bằng component thực tế
    meta: { requiresScope: "Student" },
  },
  {
    path: "/student/jobs",
    name: "student_jobs",
    component: StudentJobs,
    meta: { requiresScope: "Student" },
  },
  {
    path: "/student/settings",
    name: "student_settings",
    component: StudentSettings,
    meta: { requiresScope: "Student" },
  },
  {
    path: "/student/applications",
    name: "student_applications",
    component: StudentApplications,
    meta: { requiresScope: "Student" },
  },
  {
    path: "/student/interviews",
    name: "student_interviews",
    component: StudentInvitations,
    meta: { requiresScope: "Student" },
  },

  // Company routes - chỉ Company mới truy cập được
  {
    path: "/company/dashboard",
    name: "CompanyDashboard",
    component: CompanyDashboard,
    //meta: { requiresScope: "Company" },
  },
  {
    path: "/company/jobs",
    name: "CompanyJobs",
    component: CompanyJobs,
    //meta: { requiresScope: "Company" },
  },
  {
    path: "/company/jobs/create",
    name: "CompanyCreateJob",
    component: CompanyCreateJob,
    //meta: { requiresScope: "Company" },
  },
  {
    path: "/company/jobs/edit/:id",
    name: "CompanyEditJob",
    component: CompanyCreateJob,
    meta: { requiresScope: "Company" },
  },
  {
    path: "/company/jobs/:id/candidates",
    name: "CompanyJobCandidates",
    component: CompanyJobCandidates,
    meta: { requiresScope: "Company" },
  },
  {
    path: "/company/candidates",
    name: "CompanyCandidates",
    component: CompanyCandidates,
    meta: { requiresScope: "Company" },
  },
  {
    path: "/company/interviews",
    name: "CompanyInvitations",
    component: CompanyInvitations,
    meta: { requiresScope: "Company" },
  },
  {
    path: "/company/post-job",
    name: "company_post_job",
    component: CompanyDashboard, // Thay bằng component thực tế
    meta: { requiresScope: "Company" },
  },
  {
    path: "/company/settings",
    name: "CompanyProfile",
    component: CompanyProfile,
    meta: { requiresScope: "Company" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Route guard để kiểm tra quyền truy cập dựa trên scope
router.beforeEach((to, from, next) => {
  const userScope = localStorage.getItem("userScope");
  const token = localStorage.getItem("token");

  // Nếu route yêu cầu scope cụ thể
  if (to.meta.requiresScope) {
    // Kiểm tra xem user có đăng nhập không
    if (!token || !userScope) {
      next({ name: "Login", query: { unauthorized: "true" } });
      return;
    }

    // Kiểm tra scope có khớp không
    if (userScope !== to.meta.requiresScope) {
      // Nếu không khớp, chuyển về Home hoặc Login
      next({ name: "Home" });
      return;
    }
  }

  // Cho phép truy cập
  next();
});

export default router;
