import axiosClient from "../axiosClient";

/**
 * Service for job-related API calls
 */
export const jobService = {
  /**
   * Create a new job posting
   * @param {Object} jobData - Job data to create
   * @returns {Promise} API response
   */
  createJob: async (jobData) => {
    try {
      const response = await axiosClient.post("/Jobs", jobData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all jobs
   * @returns {Promise} API response
   */
  getAllJobs: async () => {
    try {
      const response = await axiosClient.get("/Jobs");
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get my jobs (company's jobs)
   * @returns {Promise} API response
   */
  getMyJobs: async () => {
    try {
      const response = await axiosClient.get("/Jobs/MyJobs");
      return response;
    } catch (error) {
      throw error;
    }
  },

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
   * Get job by ID
   * @param {number} id - Job ID
   * @returns {Promise} API response
   */
  getJobById: async (id) => {
    try {
      const response = await axiosClient.get(`/Jobs/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get candidate suggestions for a job
   * @param {number} jobId - Job ID
   * @returns {Promise} API response
   */
  getCandidateSuggestions: async (jobId) => {
    try {
      const response = await axiosClient.get(`/Jobs/CandidateSuggestions/${jobId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update job
   * @param {number} id - Job ID
   * @param {Object} jobData - Updated job data
   * @returns {Promise} API response
   */
  updateJob: async (id, jobData) => {
    try {
      const response = await axiosClient.post(`/Jobs/${id}`, jobData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete job
   * @param {number} id - Job ID
   * @returns {Promise} API response
   */
  deleteJob: async (id) => {
    try {
      const response = await axiosClient.post(`/Jobs/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};
