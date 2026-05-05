import { DashboardData, OwnerDashboard, Role, StoreSummary, UserProfile } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

function getToken() {
  return localStorage.getItem("authToken") || "";
}

function buildHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "API request failed");
  }
  return response.json();
}

export async function login(email: string, password: string) {
  return handleResponse(
    await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ email, password }),
    })
  );
}

export async function signup(name: string, email: string, address: string, password: string) {
  return handleResponse(
    await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ name, email, address, password }),
    })
  );
}

export async function fetchProfile(): Promise<UserProfile> {
  return handleResponse(await fetch(`${API_BASE}/auth/me`, { headers: buildHeaders() }));
}

export async function fetchStores(query?: string, address?: string): Promise<StoreSummary[]> {
  const params = new URLSearchParams();
  if (query) params.append("name", query);
  if (address) params.append("address", address);
  return handleResponse(await fetch(`${API_BASE}/stores?${params.toString()}`, { headers: buildHeaders() }));
}

export async function submitRating(storeId: number, score: number) {
  return handleResponse(
    await fetch(`${API_BASE}/ratings`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ storeId, score }),
    })
  );
}

export async function getDashboard(): Promise<DashboardData> {
  return handleResponse(await fetch(`${API_BASE}/stores/admin/dashboard`, { headers: buildHeaders() }));
}

export async function getOwnerDashboard(): Promise<OwnerDashboard> {
  return handleResponse(await fetch(`${API_BASE}/stores/owner`, { headers: buildHeaders() }));
}

export async function getUserRatings() {
  return handleResponse(await fetch(`${API_BASE}/ratings/user`, { headers: buildHeaders() }));
}
