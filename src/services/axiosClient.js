import axios from "axios";

// Biến cờ để tránh vòng lặp vô hạn khi gọi refresh token
let isRefreshing = false;
// Hàng đợi các request bị lỗi 401 để thực hiện lại sau khi refresh thành công
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const axiosClient = axios.create({
  baseURL: "https://kodopo.tech/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- REQUEST INTERCEPTOR ---
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to add base URL to image/file URLs
const addBaseUrlToAssets = (data) => {
  const baseURL = "https://kodopo.tech";
  
  // Danh sách các trường cần xử lý
  const urlFields = ['logoUrl', 'avatarUrl', 'resumeUrl', 'imageUrl', 'fileUrl', 'photoUrl'];
  
  if (!data) return data;
  
  // Hàm xử lý cho một object
  const processObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    urlFields.forEach(field => {
      if (obj[field] && typeof obj[field] === 'string' && obj[field].startsWith('/')) {
        obj[field] = baseURL + obj[field];
      }
    });
    
    return obj;
  };
  
  // Xử lý object đơn
  if (!Array.isArray(data)) {
    return processObject(data);
  }
  
  // Xử lý array
  return data.map(item => processObject(item));
};

// --- RESPONSE INTERCEPTOR ---
axiosClient.interceptors.response.use(
  (response) => {
    // Thêm base URL vào các trường ảnh/file trước khi trả về
    const data = addBaseUrlToAssets(response.data);
    return data; // Trả về data đã được xử lý
  },
  async (error) => {
    const originalRequest = error.config;

    // 1. Nếu lỗi không phải 401, reject luôn
    if (!error.response || error.response.status !== 401) {
        return Promise.reject(error);
    }

    // 2. Nếu request bị lỗi chính là request Refresh Token -> Logout ngay lập tức để tránh loop
    if (originalRequest.url.includes("/Auth/Refresh")) {
        handleLogout();
        return Promise.reject(error);
    }

    // 3. Nếu request đã từng retry rồi mà vẫn lỗi 401 -> Logout (Token mới cũng không dùng được)
    if (originalRequest._retry) {
        handleLogout();
        return Promise.reject(error);
    }

    // 4. Bắt đầu quy trình Refresh Token
    if (isRefreshing) {
      // Nếu đang có tiến trình refresh chạy, các request khác xếp hàng đợi
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers["Authorization"] = "Bearer " + token;
          return axiosClient(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem("refreshToken");

      // Nếu không có Refresh Token trong máy -> Buộc Login lại
      if (!refreshToken) {
          throw new Error("No refresh token available");
      }

      // Gọi API Refresh (Dùng axios gốc để tránh interceptor)
      // *** QUAN TRỌNG: Nếu Refresh Token ở Server đã hết hạn, API này sẽ trả về lỗi ***
      const response = await axios.post(
        "https://kodopo.tech/api/Auth/Refresh",
        { token: refreshToken } 
      );

      const { access_token, refresh_token } = response.data;

      // Lưu token mới
      localStorage.setItem("token", access_token);
      if (refresh_token) {
          localStorage.setItem("refreshToken", refresh_token);
      }

      // Cập nhật header cho axiosClient và request hiện tại
      axiosClient.defaults.headers.common["Authorization"] = "Bearer " + access_token;
      originalRequest.headers["Authorization"] = "Bearer " + access_token;

      // Xử lý hàng đợi đang chờ
      processQueue(null, access_token);

      // Gọi lại request ban đầu
      return axiosClient(originalRequest);

    } catch (refreshError) {
      // *** ĐÂY LÀ CHỖ XỬ LÝ "HẾT EXP" MÀ BẠN CẦN ***
      // Nếu Refresh Token hết hạn (API trả lỗi) hoặc lỗi mạng...
      // Hủy hàng đợi và Logout ngay lập tức
      processQueue(refreshError, null);
      handleLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export const handleLogout = () => {
  // Xóa sạch token để đảm bảo an toàn
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  
  // Chuyển hướng người dùng về trang Login
  // Sử dụng window.location để reload lại app cho sạch state
  window.location.href = "/login";
};

export default axiosClient;