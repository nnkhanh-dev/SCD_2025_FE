import axiosClient from "../axiosClient";

export const companyService = {
  /**
   * Update or Create Company Information
   * Endpoint: POST /CompanyInfors
   * Content-Type: multipart/form-data
   */
  updateCompanyInfo: async (formData) => {
    try {
      const response = await axiosClient.post("/CompanyInfors", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get my company info
   * Endpoint: GET /CompanyInfors/MyCompany
   */
  getMyCompanyInfo: async () => {
    try {
      // Gọi API lấy thông tin công ty của user hiện tại
      const response = await axiosClient.get("/CompanyInfors/MyCompany");
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all received applications for all jobs of the company
   * Endpoint: GET /UserJobs/AllReceivedApplications
   * @returns {Promise} Array of applications (Type = "Application")
   */
  getAllReceivedApplications: async () => {
    try {
      const response = await axiosClient.get("/UserJobs/AllReceivedApplications");
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get received applications for a specific job
   * Endpoint: GET /UserJobs/ReceivedApplications/{jobId}
   * @param {number} jobId - Job ID
   * @returns {Promise} Array of applications for the job
   */
  getReceivedApplications: async (jobId) => {
    try {
      const response = await axiosClient.get(`/UserJobs/ReceivedApplications/${jobId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Respond to a job application (Accept/Reject)
   * Endpoint: PUT /UserJobs/RespondApplication/{id}
   * @param {number} id - UserJob ID
   * @param {string} status - "Accepted" or "Rejected"
   * @returns {Promise} API response
   */
  respondApplication: async (id, status) => {
    try {
      const response = await axiosClient.post(`/UserJobs/RespondApplication/${id}`, { status });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Accept a job application (Simplified endpoint - No body required)
   * Endpoint: PUT /UserJobs/AcceptApplication/{id}
   * @param {number} id - UserJob ID
   * @returns {Promise} API response
   */
  acceptApplication: async (id) => {
    try {
      const response = await axiosClient.post(`/UserJobs/AcceptApplication/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reject a job application (Simplified endpoint - No body required)
   * Endpoint: PUT /UserJobs/RejectApplication/{id}
   * @param {number} id - UserJob ID
   * @returns {Promise} API response
   */
  rejectApplication: async (id) => {
    try {
      const response = await axiosClient.post(`/UserJobs/RejectApplication/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get sent invitations
   * Endpoint: GET /UserJobs/SentInvitations
   * @returns {Promise} Array of invitations (Type = "Invitation")
   */
  getSentInvitations: async () => {
    try {
      const response = await axiosClient.get("/UserJobs/SentInvitations");
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Send invitation to a student
   * Endpoint: POST /UserJobs/SendInvitation
   * @param {string} studentUserId - Student User ID
   * @param {number} jobId - Job ID
   * @returns {Promise} API response
   */
  sendInvitation: async (studentUserId, jobId) => {
    try {
      const response = await axiosClient.post("/UserJobs/SendInvitation", {
        studentUserId,
        jobId,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete/Withdraw an invitation (only when status = Pending)
   * Endpoint: DELETE /UserJobs/{id}
   * @param {number} id - UserJob ID
   * @returns {Promise} API response
   */
  deleteInvitation: async (id) => {
    try {
      const response = await axiosClient.post(`/UserJobs/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};
