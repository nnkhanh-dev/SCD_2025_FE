import router from "../router";

export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    switch (status) {
      case 401:
        // Unauthorized - redirect to login
        localStorage.removeItem("token");
        router.push({ name: "Login" });
        break;
      case 403:
        // Forbidden - redirect to home or show forbidden page
        router.push({ name: "Home" });
        console.error("Access forbidden");
        break;
      case 404:
        // Not found - redirect to home
        router.push({ name: "Home" });
        console.error("Resource not found");
        break;
      case 500:
        // Internal server error - redirect to home
        router.push({ name: "Home" });
        console.error("Internal server error");
        break;
      default:
        console.error("API Error:", data.message || "Unknown error");
    }
  } else if (error.request) {
    // Network error
    console.error("Network error - please check your connection");
  } else {
    // Other error
    console.error("Request error:", error.message);
  }
};
