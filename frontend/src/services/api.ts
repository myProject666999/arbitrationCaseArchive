import axios from 'axios';
import type {
  User,
  LoginRequest,
  LoginResponse,
  Case,
  CaseFormData,
  Volume,
  Document,
  OcrVersion,
  DesensitizedVersion,
  DesensitizationResult,
  DesensitizationRules,
  Annotation,
  BorrowRecord,
  BorrowStatus,
  CreateBorrowRequest,
  ApproveBorrowRequest,
  RejectBorrowRequest,
  ReturnBorrowRequest,
  OperationLog,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  LogQueryParams,
  SearchResultGroup,
  SearchParams,
  PaginatedResponse,
  ApiResponse,
} from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const handleResponse = <T>(response: { data: ApiResponse<T> }): T => {
  if (response.data.code === 200 && response.data.data !== undefined) {
    return response.data.data;
  }
  throw new Error(response.data.message || '请求失败');
};

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return handleResponse(response);
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return handleResponse(response);
  },
};

export const caseApi = {
  getCaseList: async (
    page: number,
    pageSize: number,
    keyword?: string
  ): Promise<PaginatedResponse<Case>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Case>>>('/cases', {
      params: { page, pageSize, keyword },
    });
    return handleResponse(response);
  },

  getCaseDetail: async (id: number): Promise<Case> => {
    const response = await api.get<ApiResponse<Case>>(`/cases/${id}`);
    return handleResponse(response);
  },

  getCaseByNumber: async (caseNumber: string): Promise<Case> => {
    const response = await api.get<ApiResponse<Case>>(`/cases/number/${caseNumber}`);
    return handleResponse(response);
  },

  createCase: async (data: CaseFormData): Promise<Case> => {
    const response = await api.post<ApiResponse<Case>>('/cases', data);
    return handleResponse(response);
  },

  updateCase: async (id: number, data: CaseFormData): Promise<Case> => {
    const response = await api.put<ApiResponse<Case>>(`/cases/${id}`, data);
    return handleResponse(response);
  },

  deleteCase: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/cases/${id}`);
    if (response.data.code !== 200) {
      throw new Error(response.data.message || '删除案件失败');
    }
  },
};

export const volumeApi = {
  getVolumesByCase: async (caseId: number): Promise<Volume[]> => {
    const response = await api.get<ApiResponse<Volume[]>>(`/volumes/case/${caseId}`);
    return handleResponse(response);
  },

  getVolumeDetail: async (id: number): Promise<Volume> => {
    const response = await api.get<ApiResponse<Volume>>(`/volumes/${id}`);
    return handleResponse(response);
  },

  getVolumeList: async (page: number, pageSize: number): Promise<PaginatedResponse<Volume>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Volume>>>('/volumes', {
      params: { page, pageSize },
    });
    return handleResponse(response);
  },

  createVolume: async (data: { caseId: number; volumeNumber: number; volumeName: string; description?: string }): Promise<Volume> => {
    const response = await api.post<ApiResponse<Volume>>('/volumes', data);
    return handleResponse(response);
  },

  updateVolume: async (id: number, data: Partial<{ volumeNumber: number; volumeName: string; description: string }>): Promise<Volume> => {
    const response = await api.put<ApiResponse<Volume>>(`/volumes/${id}`, data);
    return handleResponse(response);
  },

  deleteVolume: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/volumes/${id}`);
    if (response.data.code !== 200) {
      throw new Error(response.data.message || '删除卷册失败');
    }
  },
};

export const documentApi = {
  getDocumentsByVolume: async (volumeId: number): Promise<Document[]> => {
    const response = await api.get<ApiResponse<Document[]>>(`/documents/volume/${volumeId}`);
    return handleResponse(response);
  },

  getDocumentDetail: async (id: number): Promise<Document> => {
    const response = await api.get<ApiResponse<Document>>(`/documents/${id}`);
    return handleResponse(response);
  },

  getDocumentList: async (page: number, pageSize: number): Promise<PaginatedResponse<Document>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Document>>>('/documents', {
      params: { page, pageSize },
    });
    return handleResponse(response);
  },

  createDocument: async (data: { volumeId: number; documentName: string; documentType?: string; filePath?: string; fileSize?: number; pageNumber?: number }): Promise<Document> => {
    const response = await api.post<ApiResponse<Document>>('/documents', data);
    return handleResponse(response);
  },

  updateDocument: async (id: number, data: Partial<Document>): Promise<Document> => {
    const response = await api.put<ApiResponse<Document>>(`/documents/${id}`, data);
    return handleResponse(response);
  },

  deleteDocument: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/documents/${id}`);
    if (response.data.code !== 200) {
      throw new Error(response.data.message || '删除文件失败');
    }
  },

  uploadDocument: async (file: File, volumeId: number): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('volumeId', String(volumeId));
    const response = await api.post<ApiResponse<Document>>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return handleResponse(response);
  },

  getOcrVersions: async (documentId: number): Promise<OcrVersion[]> => {
    const response = await api.get<ApiResponse<OcrVersion[]>>(`/ocr/versions/${documentId}`);
    return handleResponse(response);
  },

  getOcrVersionDetail: async (ocrVersionId: number): Promise<OcrVersion> => {
    const response = await api.get<ApiResponse<OcrVersion>>(`/ocr/version/${ocrVersionId}`);
    return handleResponse(response);
  },

  processOcr: async (documentId: number): Promise<OcrVersion> => {
    const response = await api.post<ApiResponse<OcrVersion>>(`/ocr/process/${documentId}`);
    return handleResponse(response);
  },

  batchProcessOcr: async (documentIds: number[]): Promise<OcrVersion[]> => {
    const response = await api.post<ApiResponse<OcrVersion[]>>('/ocr/batch-process', { documentIds });
    return handleResponse(response);
  },

  compareOcrVersions: async (versionId1: number, versionId2: number): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/ocr/compare/${versionId1}/${versionId2}`);
    return handleResponse(response);
  },
};

export const annotationApi = {
  getAnnotationsByDocument: async (documentId: number): Promise<Annotation[]> => {
    const response = await api.get<ApiResponse<Annotation[]>>(`/annotations/document/${documentId}`);
    return handleResponse(response);
  },

  getAnnotationDetail: async (id: number): Promise<Annotation> => {
    const response = await api.get<ApiResponse<Annotation>>(`/annotations/${id}`);
    return handleResponse(response);
  },

  getAnnotationList: async (page: number, pageSize: number): Promise<PaginatedResponse<Annotation>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Annotation>>>('/annotations', {
      params: { page, pageSize },
    });
    return handleResponse(response);
  },

  createAnnotation: async (data: Partial<Annotation> & { documentId: number; content: string }): Promise<Annotation> => {
    const response = await api.post<ApiResponse<Annotation>>('/annotations', data);
    return handleResponse(response);
  },

  updateAnnotation: async (id: number, data: Partial<Annotation> & { version: number }): Promise<Annotation> => {
    const response = await api.put<ApiResponse<Annotation>>(`/annotations/${id}`, data);
    return handleResponse(response);
  },

  deleteAnnotation: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/annotations/${id}`);
    if (response.data.code !== 200) {
      throw new Error(response.data.message || '删除标注失败');
    }
  },
};

export const borrowApi = {
  applyBorrow: async (data: CreateBorrowRequest): Promise<BorrowRecord> => {
    const response = await api.post<ApiResponse<BorrowRecord>>('/borrows/apply', data);
    return handleResponse(response);
  },

  getBorrowList: async (
    page: number,
    pageSize: number,
    status?: BorrowStatus
  ): Promise<PaginatedResponse<BorrowRecord>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<BorrowRecord>>>('/borrows', {
      params: { page, pageSize, status },
    });
    return handleResponse(response);
  },

  getMyBorrows: async (
    page: number,
    pageSize: number,
    status?: BorrowStatus
  ): Promise<PaginatedResponse<BorrowRecord>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<BorrowRecord>>>('/borrows/my', {
      params: { page, pageSize, status },
    });
    return handleResponse(response);
  },

  getPendingApprovals: async (
    page: number,
    pageSize: number
  ): Promise<PaginatedResponse<BorrowRecord>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<BorrowRecord>>>('/borrows/pending', {
      params: { page, pageSize },
    });
    return handleResponse(response);
  },

  getOverdueList: async (): Promise<BorrowRecord[]> => {
    const response = await api.get<ApiResponse<BorrowRecord[]>>('/borrows/overdue');
    return handleResponse(response);
  },

  getBorrowDetail: async (id: number): Promise<BorrowRecord> => {
    const response = await api.get<ApiResponse<BorrowRecord>>(`/borrows/${id}`);
    return handleResponse(response);
  },

  approveBorrow: async (id: number, data: ApproveBorrowRequest): Promise<BorrowRecord> => {
    const response = await api.put<ApiResponse<BorrowRecord>>(`/borrows/${id}/approve`, data);
    return handleResponse(response);
  },

  rejectBorrow: async (id: number, data: RejectBorrowRequest): Promise<BorrowRecord> => {
    const response = await api.put<ApiResponse<BorrowRecord>>(`/borrows/${id}/reject`, data);
    return handleResponse(response);
  },

  returnBorrow: async (id: number, data: ReturnBorrowRequest): Promise<BorrowRecord> => {
    const response = await api.put<ApiResponse<BorrowRecord>>(`/borrows/${id}/return`, data);
    return handleResponse(response);
  },

  markAsLost: async (id: number): Promise<BorrowRecord> => {
    const response = await api.put<ApiResponse<BorrowRecord>>(`/borrows/${id}/lost`);
    return handleResponse(response);
  },

  remindBorrow: async (id: number): Promise<BorrowRecord> => {
    const response = await api.put<ApiResponse<BorrowRecord>>(`/borrows/${id}/remind`);
    return handleResponse(response);
  },
};

export const desensitizationApi = {
  previewDesensitization: async (
    ocrVersionId: number,
    rules: DesensitizationRules
  ): Promise<DesensitizationResult> => {
    const response = await api.post<ApiResponse<DesensitizationResult>>('/desensitization/preview', {
      ocrVersionId,
      rules,
    });
    return handleResponse(response);
  },

  applyDesensitization: async (
    ocrVersionId: number,
    rules: DesensitizationRules
  ): Promise<DesensitizedVersion> => {
    const response = await api.post<ApiResponse<DesensitizedVersion>>('/desensitization/apply', {
      ocrVersionId,
      rules,
    });
    return handleResponse(response);
  },

  getDesensitizationHistory: async (ocrVersionId: number): Promise<DesensitizedVersion[]> => {
    const response = await api.get<ApiResponse<DesensitizedVersion[]>>(`/desensitization/history/${ocrVersionId}`);
    return handleResponse(response);
  },

  getDesensitizedVersion: async (id: number): Promise<DesensitizedVersion> => {
    const response = await api.get<ApiResponse<DesensitizedVersion>>(`/desensitization/version/${id}`);
    return handleResponse(response);
  },

  deleteDesensitizedVersion: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/desensitization/version/${id}`);
    if (response.data.code !== 200) {
      throw new Error(response.data.message || '删除脱敏版本失败');
    }
  },
};

export const userApi = {
  getUserList: async (
    page: number,
    pageSize: number
  ): Promise<PaginatedResponse<User>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<User>>>('/users', {
      params: { page, pageSize },
    });
    return handleResponse(response);
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<PaginatedResponse<User>>>('/users', {
      params: { page: 1, pageSize: 1000 },
    });
    const result = handleResponse(response);
    return result.items;
  },

  getUserDetail: async (id: number): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return handleResponse(response);
  },

  createUser: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return handleResponse(response);
  },

  updateUser: async (id: number, data: UpdateUserRequest): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return handleResponse(response);
  },

  deleteUser: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/users/${id}`);
    if (response.data.code !== 200) {
      throw new Error(response.data.message || '删除用户失败');
    }
  },

  changePassword: async (id: number, data: ChangePasswordRequest): Promise<void> => {
    const response = await api.post<ApiResponse<void>>(`/users/${id}/change-password`, data);
    if (response.data.code !== 200) {
      throw new Error(response.data.message || '修改密码失败');
    }
  },

  toggleUserStatus: async (id: number): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}/toggle-status`);
    return handleResponse(response);
  },
};

export const logApi = {
  getLogList: async (params: LogQueryParams): Promise<PaginatedResponse<OperationLog>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<OperationLog>>>('/logs', {
      params,
    });
    return handleResponse(response);
  },
};

export const searchApi = {
  search: async (params: SearchParams): Promise<{ groups: SearchResultGroup[]; total: number; page: number; pageSize: number; totalPages: number }> => {
    const response = await api.get<ApiResponse<{ groups: SearchResultGroup[]; total: number; page: number; pageSize: number; totalPages: number }>>('/search', { params });
    return handleResponse(response);
  },

  getCaseTypes: async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>('/search/case-types');
    return handleResponse(response);
  },

  getCaseCauses: async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>('/search/case-causes');
    return handleResponse(response);
  },
};

export default api;
