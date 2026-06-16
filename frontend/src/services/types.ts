export type UserRole = 'admin' | 'librarian' | 'user';

export type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type BorrowType = 'view' | 'download' | 'export';

export type BorrowStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue' | 'lost';

export interface User {
  id: number;
  username: string;
  realName: string;
  role: UserRole;
  department?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Case {
  id: number;
  caseNumber: string;
  caseTitle: string;
  caseType: string;
  caseCause: string;
  applicant?: string;
  respondent?: string;
  caseDate?: string;
  summary?: string;
  isConfidential: boolean;
  createdById?: number;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
  volumes?: Volume[];
}

export interface Volume {
  id: number;
  caseId: number;
  volumeNumber: number;
  volumeName: string;
  description?: string;
  pageCount: number;
  createdById?: number;
  createdBy?: User;
  caseItem?: Case;
  createdAt: string;
  updatedAt: string;
  documents?: Document[];
}

export interface Document {
  id: number;
  volumeId: number;
  documentName: string;
  documentType?: string;
  filePath?: string;
  fileSize?: number;
  pageNumber?: number;
  scanDate?: string;
  ocrStatus: OcrStatus;
  latestOcrVersionId?: number;
  version: number;
  createdById?: number;
  createdBy?: User;
  volume?: Volume;
  createdAt: string;
  updatedAt: string;
  ocrVersions?: OcrVersion[];
  borrowRecords?: BorrowRecord[];
  annotations?: Annotation[];
}

export interface OcrVersion {
  id: number;
  documentId: number;
  versionNumber: number;
  ocrText?: string;
  ocrEngine?: string;
  confidenceScore?: number;
  isIncremental: boolean;
  incrementalChanges?: string;
  processedById?: number;
  processedBy?: User;
  processedAt: string;
  createdAt: string;
  document?: Document;
  desensitizedVersions?: DesensitizedVersion[];
  annotations?: Annotation[];
}

export interface BorrowRecord {
  id: number;
  documentId: number;
  applicantId: number;
  approverId?: number;
  borrowReason?: string;
  borrowType: BorrowType;
  status: BorrowStatus;
  borrowDate?: string;
  dueDate?: string;
  returnDate?: string;
  rejectionReason?: string;
  isReminded: boolean;
  reminderCount: number;
  lastReminderAt?: string;
  compensationAmount: number;
  document?: Document;
  applicant?: User;
  approver?: User;
  createdAt: string;
  updatedAt: string;
}

export interface DesensitizedVersion {
  id: number;
  ocrVersionId: number;
  desensitizedText?: string;
  desensitizationRules?: Record<string, boolean>;
  desensitizedCount: number;
  processedById?: number;
  processedBy?: User;
  ocrVersion?: OcrVersion;
  createdAt: string;
}

export interface Annotation {
  id: number;
  documentId: number;
  ocrVersionId?: number;
  annotatorId: number;
  annotationType?: string;
  content: string;
  pagePosition?: Record<string, any>;
  version: number;
  document?: Document;
  ocrVersion?: OcrVersion;
  annotator?: User;
  createdAt: string;
  updatedAt: string;
}

export interface OperationLog {
  id: number;
  userId?: number;
  operationType: string;
  targetType?: string;
  targetId?: number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  user?: User;
  createdAt: string;
}

export interface SearchResult {
  type: 'case' | 'volume' | 'document';
  id: number;
  title: string;
  highlight?: string;
}

export interface SearchResultGroup {
  caseCause: string;
  items: SearchResult[];
  count: number;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CaseFormData {
  caseNumber: string;
  caseTitle: string;
  caseType: string;
  caseCause: string;
  applicant?: string;
  respondent?: string;
  caseDate?: string;
  summary?: string;
  isConfidential: boolean;
}

export interface DesensitizationRules {
  name: boolean;
  idCard: boolean;
  phone: boolean;
  email: boolean;
  address: boolean;
  bankCard: boolean;
  companyName: boolean;
  customKeywords?: string[];
}

export interface DesensitizationResult {
  originalText: string;
  desensitizedText: string;
  desensitizedCount: number;
  desensitizedItems: Array<{
    type: string;
    original: string;
    desensitized: string;
    position: number;
  }>;
}

export interface CreateBorrowRequest {
  documentId: number;
  borrowType: BorrowType;
  borrowReason: string;
  borrowDate?: string;
  dueDate?: string;
}

export interface ApproveBorrowRequest {
  borrowDate?: string;
  dueDate?: string;
}

export interface RejectBorrowRequest {
  rejectionReason: string;
}

export interface ReturnBorrowRequest {
  returnDate?: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  realName: string;
  role: UserRole;
  department?: string;
  phone?: string;
}

export interface UpdateUserRequest {
  realName?: string;
  role?: UserRole;
  department?: string;
  phone?: string;
  isActive?: boolean;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface LogQueryParams {
  page: number;
  pageSize: number;
  userId?: number;
  operationType?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

export interface SearchParams {
  keyword: string;
  type?: 'case' | 'volume' | 'document';
  page: number;
  pageSize: number;
}
