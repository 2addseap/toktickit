const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface RequesterUser {
  id: number;
  name: string;
  email: string;
  department?: string | null;
  isActive: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
  department?: string | null;
  isActive?: boolean;
  mustChangePassword: boolean;
  createdAt?: string;
}

export function getToken(): string | null {
  return localStorage.getItem("toktickit_auth_token");
}

export function setToken(token: string): void {
  localStorage.setItem("toktickit_auth_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("toktickit_auth_token");
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export interface Category {
  id: number;
  name: string;
}

export interface RelatedSystem {
  id: number;
  name: string;
  category?: string | null;
}

export interface Attachment {
  id: number;
  ticketId: number;
  fileName: string;
  storedPath: string;
  fileSize: number;
  mimeType: string;
  isRemoved: boolean;
  removalReason?: string | null;
  removedAt?: string | null;
  removedBy?: string | null;
  createdAt: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  requesterId: number;
  requester?: RequesterUser;
  categoryId: number;
  category?: Category;
  relatedSystemId: number;
  relatedSystem?: RelatedSystem;
  summary: string;
  description: string;
  requestedPriority: string;
  itPriority?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
  attachmentCount?: number;
}

export interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedTickets {
  data: Ticket[];
  pagination: PaginationMetadata;
}

export interface TicketQueryParams {
  search?: string;
  categoryId?: number | string;
  priority?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export async function checkSystem(): Promise<SystemStatus> {
  const healthRes = await fetch(`${API_URL}/api/health`);
  if (!healthRes.ok) {
    throw new Error("Unable to connect to TokTickIT API");
  }

  const categoriesRes = await fetch(`${API_URL}/api/categories`);
  if (!categoriesRes.ok) {
    throw new Error("Unable to connect to TokTickIT API");
  }

  const categories: Category[] = await categoriesRes.json();
  return { online: true, categories };
}

export async function getRequesters(): Promise<RequesterUser[]> {
  const res = await fetch(`${API_URL}/api/requesters`);
  if (!res.ok) {
    throw new Error("Failed to load development requesters");
  }
  return res.json();
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) {
    throw new Error("Failed to load categories");
  }
  return res.json();
}

export async function getRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_URL}/api/related-systems`);
  if (!res.ok) {
    throw new Error("Failed to load related systems");
  }
  return res.json();
}

export async function createTicket(
  formData: FormData,
  requesterId: number
): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: {
      "x-requester-id": String(requesterId),
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || "Failed to create ticket") as Error & {
      fieldErrors?: Record<string, string>;
    };
    error.fieldErrors = data.fieldErrors;
    throw error;
  }

  return data;
}

export async function getTickets(
  params: TicketQueryParams,
  requesterId: number
): Promise<PaginatedTickets> {
  const url = new URL(`${API_URL}/api/tickets`);
  if (params.search) url.searchParams.set("search", params.search);
  if (params.categoryId) url.searchParams.set("categoryId", String(params.categoryId));
  if (params.priority) url.searchParams.set("priority", params.priority);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.sortBy) url.searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) url.searchParams.set("sortOrder", params.sortOrder);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.pageSize) url.searchParams.set("pageSize", String(params.pageSize));

  const res = await fetch(url.toString(), {
    headers: {
      "x-requester-id": String(requesterId),
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch tickets");
  }

  return res.json();
}

export async function getTicketDetail(
  ticketId: number,
  requesterId: number
): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
    headers: {
      "x-requester-id": String(requesterId),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || "Failed to fetch ticket detail");
  }

  return res.json();
}

export async function uploadAttachment(
  ticketId: number,
  file: File,
  requesterId: number
): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, {
    method: "POST",
    headers: {
      "x-requester-id": String(requesterId),
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to upload attachment");
  }

  return data;
}

export async function downloadAttachment(
  attachmentId: number,
  requesterId: number,
  fileName: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/attachments/${attachmentId}/download`, {
    headers: {
      "x-requester-id": String(requesterId),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || "Failed to download attachment");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function softRemoveAttachment(
  attachmentId: number,
  reason: string,
  requesterId: number
): Promise<Attachment> {
  const res = await fetch(`${API_URL}/api/attachments/${attachmentId}/soft-remove`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-requester-id": String(requesterId),
    },
    body: JSON.stringify({ reason }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to remove attachment");
  }

  return data;
}

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Login failed.");
  }

  setToken(data.token);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
    });
  } finally {
    clearToken();
  }
}

export async function getMe(): Promise<User> {
  const token = getToken();
  if (!token) throw new Error("No authentication token found.");

  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    clearToken();
    throw new Error(data.message || "Failed to retrieve user profile.");
  }

  return data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ message: string; user: User }> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to update password.");
  }

  return data;
}

// ---------------------------------------------------------------------------
// Lab 3 — Issue 3: Admin User Management API
// ---------------------------------------------------------------------------

export async function getAdminUsers(search?: string, role?: string): Promise<User[]> {
  const token = getToken();
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (role) params.append("role", role);

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_URL}/api/admin/users${queryString}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to fetch admin users.");
  }
  return data;
}

export async function createAdminUser(userData: {
  name: string;
  email: string;
  role: string;
  department?: string;
  isActive?: boolean;
  initialPassword: string;
}): Promise<User> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to create user.");
  }
  return data;
}

export async function updateAdminUser(id: number, data: Partial<User>): Promise<User> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.message || resData.error || "Failed to update user.");
  }
  return resData;
}

export async function resetAdminUserPassword(id: number, newInitialPassword: string): Promise<{ message: string }> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/admin/users/${id}/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newInitialPassword }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to reset password.");
  }
  return data;
}

// ---------------------------------------------------------------------------
// Lab 3 — Issue 4: IT Staff Ticket Queue API
// ---------------------------------------------------------------------------

export interface StaffAssignee {
  id: number;
  name: string;
  email: string;
  role: "IT_STAFF" | "ADMINISTRATOR";
  department?: string | null;
}

export interface StaffTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  requestedPriority: string;
  itPriority: string;
  status: string;
  resolvedIndicated: boolean;
  resolvedIndicatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  requester?: {
    id: number;
    name: string;
    email: string;
    department?: string | null;
  };
  assignedTo?: StaffAssignee | null;
  category?: Category;
  relatedSystem?: RelatedSystem;
  attachmentCount: number;
}

export interface PaginatedStaffTickets {
  data: StaffTicket[];
  pagination: PaginationMetadata;
}

export interface StaffTicketQueryParams {
  search?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  categoryId?: number;
  sortBy?: "createdAt" | "ticketNumber" | "itPriority" | "status" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export async function getStaffTickets(params?: StaffTicketQueryParams): Promise<PaginatedStaffTickets> {
  const token = getToken();
  const searchParams = new URLSearchParams();

  if (params?.search) searchParams.append("search", params.search);
  if (params?.status) searchParams.append("status", params.status);
  if (params?.priority) searchParams.append("priority", params.priority);
  if (params?.assignedTo) searchParams.append("assignedTo", params.assignedTo);
  if (params?.categoryId) searchParams.append("categoryId", String(params.categoryId));
  if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.pageSize) searchParams.append("pageSize", String(params.pageSize));

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const res = await fetch(`${API_URL}/api/staff/tickets${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to retrieve staff ticket queue.");
  }
  return data;
}

export async function getStaffAssignees(): Promise<StaffAssignee[]> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/staff/assignees`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to fetch assignees.");
  }
  return data;
}

