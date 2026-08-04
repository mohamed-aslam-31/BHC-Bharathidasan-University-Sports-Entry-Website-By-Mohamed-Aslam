import axios from 'axios';

// Students
export const getStudents = (params) => axios.get('/api/students', { params });
export const getStudentMeta = () => axios.get('/api/students/meta');
export const getStudent = (id) => axios.get(`/api/students/${id}`);
export const getOptions = () => axios.get('/api/options');
export const addOption = (data) => axios.post('/api/options/add', data);
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
export const verifyStudent = (id, verified) => axios.patch(`/api/students/${id}/verify`, { verified });

// Admin
export const getPendingStudents = () => axios.get('/api/admin/pending');
export const approveStudent = (id) => axios.post(`/api/admin/approve/${id}`);
export const rejectStudent = (id) => axios.post(`/api/admin/reject/${id}`);
export const getAdminStats = () => axios.get('/api/admin/stats');
export const getUsers = () => axios.get('/api/admin/users');
export const createUser = (data) => axios.post('/api/admin/users', data);
export const deleteUser = (id) => axios.delete(`/api/admin/users/${id}`);

// Draft files (server-side storage for draft PDFs)
export const uploadDraftFiles = (formData) => axios.post('/api/draft-files', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const deleteDraftFiles = (paths) => axios.delete('/api/draft-files', { data: { paths } });

// Auth
export const changePassword = (data) => axios.post('/api/auth/change-password', data);
export const updateProfile = (formData) => axios.put('/api/auth/profile', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Proxy
export const fetchProxyImage = (url) =>
  axios.get('/api/proxy-image', { params: { url }, responseType: 'blob' });

// Self-registration (public — no auth token needed)
export const selfRegVerify   = (data) => axios.post('/api/self-reg/verify', data);
export const selfRegOptions  = ()     => axios.get('/api/self-reg/options');
export const selfRegSubmit   = (fd)   => axios.post('/api/self-reg/submit', fd, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// Admin: self-reg access management
export const getSelfRegAccess    = ()     => axios.get('/api/admin/self-reg-access');
export const createSelfRegAccess = (data) => axios.post('/api/admin/self-reg-access', data);
export const deleteSelfRegAccess = (id)   => axios.delete(`/api/admin/self-reg-access/${id}`);
