const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface RequesterUser {
  id: number;
  name: string;
  email: string;
  department?: string | null;
  isActive: boolean;
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
