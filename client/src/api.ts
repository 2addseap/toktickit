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
  resolvedIndicated?: boolean;
  resolvedIndicatedAt?: string | null;
  assignedToId?: number | null;
  assignedTo?: {
    id: number;
    name: string;
    email: string;
    role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
  } | null;
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
  requesterId?: number
): Promise<Ticket> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };
  if (requesterId) {
    headers["x-requester-id"] = String(requesterId);
  }

  const res = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
    headers,
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
  requesterId?: number,
  fileName?: string
): Promise<void> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };
  if (requesterId) {
    headers["x-requester-id"] = String(requesterId);
  }

  const res = await fetch(`${API_URL}/api/attachments/${attachmentId}/download`, {
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || "Failed to download attachment");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "attachment";
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
  itPriority?: string | null;
  status: string;
  resolvedIndicated?: boolean;
  resolvedIndicatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  requester?: {
    id: number;
    name: string;
    email: string;
    department?: string | null;
  };
  assignedToId?: number | null;
  assignedTo?: StaffAssignee | null;
  category?: Category;
  relatedSystem?: RelatedSystem;
  attachmentCount?: number;
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

// ---------------------------------------------------------------------------
// Lab 3 — Issue 5: Staff Ticket Operational Detail & Collaboration API
// ---------------------------------------------------------------------------

export interface TicketComment {
  id: number;
  ticketId: number;
  body: string;
  type: "PUBLIC" | "INTERNAL";
  createdAt: string;
  author: {
    id: number;
    name: string;
    role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
  };
}

export async function assignTicket(ticketId: number, assignedToId: number | null): Promise<StaffTicket> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/assign`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ assignedToId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to update ticket assignment.");
  }
  return data;
}

export async function updateTicketPriority(ticketId: number, itPriority: string): Promise<StaffTicket> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/priority`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ itPriority }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to update IT priority.");
  }
  return data;
}

export async function updateTicketStatus(ticketId: number, status: string, clientUpdatedAt?: string): Promise<StaffTicket> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, clientUpdatedAt }),
  });

  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || data.error || "Failed to update ticket status.");
    error.code = data.code;
    throw error;
  }
  return data;
}

export async function indicateTicketResolution(ticketId: number, resolved: boolean = true): Promise<{
  id: number;
  ticketNumber: string;
  resolvedIndicated: boolean;
  resolvedIndicatedAt: string | null;
}> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/resolve-indication`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ resolved }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to submit resolution indication.");
  }
  return data;
}

export async function getPublicComments(ticketId: number): Promise<TicketComment[]> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to retrieve public comments.");
  }
  return data;
}

export async function postPublicComment(ticketId: number, body: string): Promise<TicketComment> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ body }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to post comment.");
  }
  return data;
}

export async function getInternalNotes(ticketId: number): Promise<TicketComment[]> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/notes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to retrieve internal notes.");
  }
  return data;
}

export async function postInternalNote(ticketId: number, body: string): Promise<TicketComment> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ body }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to post internal note.");
  }
  return data;
}

// ---------------------------------------------------------------------------
// Lab 4 — Actions Taken Interfaces & API Methods
// ---------------------------------------------------------------------------

export interface ActionTaken {
  id: number;
  ticketId: number;
  performedById: number;
  performedBy: {
    id: number;
    name: string;
    email: string;
    role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
  };
  actionDateTime: string;
  actionDescription: string;
  result: string;
  followUpRequired: boolean;
  followUpNote?: string | null;
  attachmentNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActionTakenPayload {
  actionDescription: string;
  result: string;
  actionDateTime?: string;
  followUpRequired?: boolean;
  followUpNote?: string | null;
  attachmentNotes?: string | null;
}

export interface UpdateActionTakenPayload {
  actionDescription?: string;
  result?: string;
  actionDateTime?: string;
  followUpRequired?: boolean;
  followUpNote?: string | null;
  attachmentNotes?: string | null;
  clientUpdatedAt?: string;
}

export async function getActionsTaken(ticketId: number): Promise<ActionTaken[]> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/actions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to retrieve Actions Taken.");
  }
  return data;
}

export async function createActionTaken(ticketId: number, payload: CreateActionTakenPayload): Promise<ActionTaken> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/actions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || data.error || "Failed to create Action Taken.");
    error.fieldErrors = data.fieldErrors;
    throw error;
  }
  return data;
}

export async function updateActionTaken(actionId: number, payload: UpdateActionTakenPayload): Promise<ActionTaken> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/actions/${actionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || data.error || "Failed to update Action Taken.");
    error.code = data.code;
    error.fieldErrors = data.fieldErrors;
    throw error;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Lab 4 — Role Dashboards Interfaces & API Methods
// ---------------------------------------------------------------------------

export interface RequesterDashboardMetrics {
  myOpenTickets: number;
  inProgressTickets: number;
  waitingForRequesterTickets: number;
  recentlyResolvedTickets: number;
}

export interface RequesterDashboardRecentTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  status: string;
  itPriority: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequesterDashboardData {
  metrics: RequesterDashboardMetrics;
  recentTickets: RequesterDashboardRecentTicket[];
}

export interface StaffDashboardMetrics {
  unassignedTickets: number;
  myAssignedTickets: number;
  newTickets: number;
  openTickets: number;
  inProgressTickets: number;
  waitingRequesterTickets: number;
  urgentTickets: number;
  adminUserStats?: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
  };
}

export interface StaffDashboardRecentUrgentTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  status: string;
  itPriority: string;
  assignedTo?: {
    id: number;
    name: string;
  } | null;
  requester?: {
    id: number;
    name: string;
  } | null;
  updatedAt: string;
}

export interface StaffDashboardData {
  metrics: StaffDashboardMetrics;
  recentUrgentTickets: StaffDashboardRecentUrgentTicket[];
}

export async function getRequesterDashboard(): Promise<RequesterDashboardData> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/dashboards/requester`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to retrieve Requester dashboard data.");
  }
  return data;
}

export async function getStaffDashboard(): Promise<StaffDashboardData> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/dashboards/staff`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || data.error || "Failed to retrieve Staff dashboard data.");
    error.status = res.status;
    throw error;
  }
  return data;
}


