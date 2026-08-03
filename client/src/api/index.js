import axios from 'axios';

// Students
export const getStudents = (params) => axios.get('/api/students', { params });
export const getStudentMeta = () => axios.get('/api/students/meta');
export const getStudent = (id) => axios.get(`/api/students/${id}`);
export const renameOption = (data) => axios.post('/api/options/rename', data);
export const deleteOption = (data) => axios.post('/api/options/delete', data);
export const createStudent = (formData) => axios.post('/api/students', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateStudent = (id, formData) => axios.put(`/api/students/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteStudent = (id) => axios.delete(`/api/students/${id}`);
export const deleteStudentAadhaar = (id) => axios.delete(`/api/students/${id}/aadhaar`);
export const deleteStudentIdCard  = (id) => axios.delete(`/api/students/${id}/idcard`);
export const deleteStudentMarksheet  = (id) => axios.delete(`/api/students/${id}/marksheet`);
export const deleteStudentFeesReceipt = (id) => axios.delete(`/api/students/${id}/feesreceipt`);
export const bulkDeleteStudents = (ids) => axios.post('/api/students/bulk-delete', { ids });

// Admin
export const getPendingStudents = () => axios.get('/api/admin/pending');
export const approveStudent = (id) => axios.post(`/api/admin/approve/${id}`);
export const rejectStudent = (id) => axios.post(`/api/admin/reject/${id}`);
export const getAdminStats = () => axios.get('/api/admin/stats');
export const getUsers = () => axios.get('/api/admin/users');
export const createUser = (data) => axios.post('/api/admin/users', data);
export const deleteUser = (id) => axios.delete(`/api/admin/users/${id}`);

// Auth
export const changePassword = (data) => axios.post('/api/auth/change-password', data);

// Proxy
export const fetchProxyImage = (url) =>
  axios.get('/api/proxy-image', { params: { url }, responseType: 'blob' });
