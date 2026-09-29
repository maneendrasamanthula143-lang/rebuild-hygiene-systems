const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('sri_chaitanya_auth_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('sri_chaitanya_auth_token', token);
  } else {
    localStorage.removeItem('sri_chaitanya_auth_token');
  }
}

export async function apiRequest(endpoint, method = 'GET', data = null, isFormData = false) {
  const token = getAuthToken();
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (data && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    method,
    headers,
  };

  if (data) {
    config.body = isFormData ? data : JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `API Request failed with status ${response.status}`);
  }

  return result;
}

// Auth API helpers
export const api = {
  // Auth
  requestOtp: (mobile) => apiRequest('/auth/login-otp/request', 'POST', { mobile }),
  verifyOtp: (mobile, otp) => apiRequest('/auth/login-otp/verify', 'POST', { mobile, otp }),
  login: (identifier, password) => apiRequest('/auth/login', 'POST', { identifier, password }),
  getMe: () => apiRequest('/auth/me'),

  // Hierarchy
  getHierarchy: () => apiRequest('/hierarchy'),
  createState: (data) => apiRequest('/states', 'POST', data),
  createDistrict: (data) => apiRequest('/districts', 'POST', data),
  createBranch: (data) => apiRequest('/branches', 'POST', data),

  // Users
  getUsers: () => apiRequest('/users'),
  createUser: (data) => apiRequest('/users', 'POST', data),
  toggleUserStatus: (id, is_active) => apiRequest(`/users/${id}/status`, 'PUT', { is_active }),

  // Workers
  getWorkers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/workers${query ? '?' + query : ''}`);
  },
  createWorker: (data) => apiRequest('/workers', 'POST', data),
  updateWorkerStatus: (id, status) => apiRequest(`/workers/${id}/status`, 'PUT', { status }),

  // Attendance
  getAttendance: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/attendance${query ? '?' + query : ''}`);
  },
  recordBulkAttendance: (data) => apiRequest('/attendance/bulk', 'POST', data),

  // Work Logs
  getWorkLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/work-logs${query ? '?' + query : ''}`);
  },
  createWorkLog: (data) => apiRequest('/work-logs', 'POST', data),

  // Issues
  getIssues: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/issues${query ? '?' + query : ''}`);
  },
  createIssue: (data) => apiRequest('/issues', 'POST', data),
  updateIssueStatus: (id, status) => apiRequest(`/issues/${id}/status`, 'PUT', { status }),

  // Daily Reports
  getDailyReports: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/daily-reports${query ? '?' + query : ''}`);
  },
  createDailyReport: (data) => apiRequest('/daily-reports', 'POST', data),

  // Questions
  getQuestions: (record_type, record_id) => apiRequest(`/questions?record_type=${record_type}&record_id=${record_id}`),
  askQuestion: (data) => apiRequest('/questions', 'POST', data),
  replyQuestion: (id, reply_text) => apiRequest(`/questions/${id}/reply`, 'POST', { reply_text }),

  // Bills & Invoices
  getBills: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/bills${query ? '?' + query : ''}`);
  },
  uploadBill: (data) => apiRequest('/bills', 'POST', data),
  deleteBill: (id) => apiRequest(`/bills/${id}`, 'DELETE'),

  // Master Configuration & Audit
  getMasterConfig: () => apiRequest('/master-config'),
  createMasterConfig: (type, data) => apiRequest(`/master-config/${type}`, 'POST', data),
  getAuditLogs: () => apiRequest('/audit-logs'),
  getDashboardStats: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/dashboard/stats${query ? '?' + query : ''}`);
  },

  // File Upload
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/upload', 'POST', formData, true);
  }
};
