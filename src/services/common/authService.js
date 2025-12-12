import axiosClient, { handleLogout } from "../axiosClient";

// Gọi API Đăng ký Student
export const registerStudent = async (formData) => {
  try {
    // API: /Auth/RegisterStudent - FormData for file upload
    const response = await axiosClient.post("/Auth/RegisterStudent", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Gọi API Đăng ký
export const registerUser = async (userData) => {
  try {
    // API: /Auth/Register
    const response = await axiosClient.post("/Auth/Register", userData);
    return response;
  } catch (error) {
    throw error;
  }
};

// Gọi API Đăng ký Company
export const registerCompany = async (companyData) => {
  try {
    // API: /Auth/RegisterCompany
    const response = await axiosClient.post("/Auth/RegisterCompany", companyData);
    return response;
  } catch (error) {
    throw error;
  }
};

// Gọi API Đăng nhập
export const loginUser = async (credentials) => {
  try {
    // API: /Auth/Login
    // Payload: { "email": "...", "password": "..." }
    const response = await axiosClient.post("/Auth/Login", credentials);
    return response;
  } catch (error) {
    throw error;
  }
};

// Gọi API Đăng xuất
export const logoutUser = async () => {
  try {
    // 1. Lấy Refresh Token từ LocalStorage (Đây chính là cái token cần gửi lên để Revoke)
    const refreshToken = localStorage.getItem("refreshToken");

    // Chỉ gọi API nếu tồn tại refresh token
    if (refreshToken) {
      // API: /Auth/Revoke (Giả định endpoint này dùng để hủy refresh token)
      // Payload đúng cấu trúc: { "token": "string" }
      await axiosClient.post("/Auth/Revoke", {
        token: refreshToken,
      });
    }
  } catch (error) {
    // Nếu lỗi (ví dụ token đã hết hạn hoặc server lỗi), ta chỉ log ra console
    console.error("Lỗi khi gọi API Logout (Revoke):", error);
  } finally {
    // 2. QUAN TRỌNG: Luôn gọi handleLogout để xóa localStorage và chuyển hướng về trang Login
    // Dù API có thành công hay thất bại thì phía Client vẫn phải logout.
    handleLogout();
  }
};