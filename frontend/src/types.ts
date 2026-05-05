export type Role = "ADMIN" | "USER" | "OWNER";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  address: string;
  role: Role;
}

export interface StoreSummary {
  id: number;
  name: string;
  email: string;
  address: string;
  overallRating: number;
}

export interface DashboardData {
  totalUsers: number;
  totalStores: number;
  totalRatings: number;
}

export interface OwnerDashboard {
  store: { id: number; name: string; address: string; averageRating: number };
  submissions: Array<{ id: number; score: number; user: { id: number; name: string; email: string }; updatedAt: string }>;
}
