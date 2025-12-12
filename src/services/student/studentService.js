import axiosClient from "../axiosClient";

/**
 * Service for Student related API calls
 */
export const studentService = {
  /**
   * Get student details by ID
   * @param {number} id - Student ID
   * @returns {Promise} API response
   */
  getStudentById: async (id) => {
    try {
      const response = await axiosClient.get(`/StudentInfors/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get my student profile
   * @returns {Promise} API response
   */
  getMyProfile: async () => {
    try {
      const response = await axiosClient.get("/StudentInfors/MyProfile");
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get job suggestions for student
   * @param {number} studentInfoId - Student Info ID
   * @returns {Promise} API response with job suggestions and similarity scores
   */
  getJobSuggestions: async (studentInfoId) => {
    try {
      const response = await axiosClient.get(
        `/StudentInfors/JobSuggestions/${studentInfoId}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create or update student information
   * @param {FormData} formData - Form data with student info and optional resume file
   * @returns {Promise} API response
   */
  createOrUpdateStudentInfo: async (formData) => {
    try {
      const response = await axiosClient.post("/StudentInfors", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // --- API MỚI THÊM ---

  /**
   * Get all categories
   * @returns {Promise} API response
   */
  getCategories: async () => {
    try {
      const response = await axiosClient.get("/Categories");
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get Company Information by ID
   * @param {number} companyInforId
   * @returns {Promise} API response
   */
  getCompanyById: async (companyInforId) => {
    try {
      const response = await axiosClient.get(
        `/CompanyInfors/${companyInforId}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Apply for a job
   * @param {number} jobId - ID của công việc (Job ID)
   * @returns {Promise} API response
   */
  applyJob: async (jobId) => {
    try {
      const response = await axiosClient.post("/UserJobs/Apply", { jobId });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get my job applications (Type = Application)
   * @returns {Promise} API response
   */
  getMyApplications: async () => {
    try {
      const response = await axiosClient.get("/UserJobs/MyApplications");
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get my invitations from companies (Type = Invitation)
   * @returns {Promise} API response
   */
  getMyInvitations: async () => {
    try {
      const response = await axiosClient.get("/UserJobs/MyInvitations");
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete/Withdraw a job application (only when status = Pending)
   * @param {number} id - UserJob ID
   * @returns {Promise} API response
   */
  deleteApplication: async (id) => {
    try {
      const response = await axiosClient.post(`/UserJobs/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Respond to a company invitation
   * @param {number} id - UserJob ID
   * @param {string} status - "Accepted" or "Rejected"
   * @returns {Promise} API response
   */
  respondInvitation: async (id, status) => {
    try {
      const response = await axiosClient.post(`/UserJobs/RespondInvitation/${id}`, { status });
      return response;
    } catch (error) {
      throw error;
    }
  },
};
