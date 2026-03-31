import axios from "axios";
import type {
  AdminOverviewResponse,
  AdminSessionsResponse,
  AdminUsersResponse,
  AssessmentDefinitionResponse,
  AssessmentSessionStatusResponse,
  AssessmentSessionResponse,
  AssessmentSubmissionResponse,
  AuthResponse,
  HistoryResponse,
  OverviewResponse,
  TrendsResponse
} from "@/types/api";
import { getStoredAuth, setStoredAuth } from "./auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:4000",
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const auth = getStoredAuth();
  if (auth?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return config;
});

export async function register(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  try {
    const response = await api.post<AuthResponse>("/api/auth/register", payload);
    setStoredAuth(response.data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message ?? "Registration failed";
    throw new Error(message);
  }
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  try {
    const response = await api.post<AuthResponse>("/api/auth/login", payload);
    setStoredAuth(response.data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message ?? "Login failed";
    throw new Error(message);
  }
}

export async function logout() {
  const auth = getStoredAuth();
  if (auth?.refreshToken) {
    await api.post("/api/auth/logout", { refreshToken: auth.refreshToken });
  }
  setStoredAuth(null);
}

export async function fetchAssessmentDefinition() {
  const response = await api.get<AssessmentDefinitionResponse>("/api/assessment/definition");
  return response.data;
}

export async function createAssessmentSession() {
  const response = await api.post<AssessmentSessionResponse>("/api/assessment/sessions", {});
  return response.data;
}

export async function fetchAssessmentSession(sessionId: string) {
  const response = await api.get<AssessmentSessionStatusResponse>(`/api/assessment/sessions/${sessionId}`);
  return response.data;
}

export async function trackUserEvent(payload: {
  sessionId: string;
  questionId: string;
  answer: number;
  responseTime: number;
  timestamp: string;
}) {
  return api.post(`/api/assessment/sessions/${payload.sessionId}/events`, {
    questionId: payload.questionId,
    answer: payload.answer,
    responseTime: payload.responseTime,
    timestamp: payload.timestamp
  });
}

export async function submitAssessment(
  sessionId: string,
  payload: { answers: Record<string, number>; responseTimes: Record<string, number> }
) {
  try {
    const response = await api.post<AssessmentSubmissionResponse>(
      `/api/assessment/sessions/${sessionId}/submit`,
      payload
    );
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message ?? "Assessment submission failed";
    throw new Error(message);
  }
}

export async function fetchOverview() {
  const response = await api.get<OverviewResponse>("/api/dashboard/overview");
  return response.data;
}

export async function fetchTrends(range: "30d" | "90d" | "365d") {
  const response = await api.get<TrendsResponse>("/api/dashboard/trends", {
    params: { range }
  });
  return response.data;
}

export async function fetchHistory() {
  const response = await api.get<HistoryResponse>("/api/dashboard/history");
  return response.data;
}

export async function fetchAdminOverview() {
  const response = await api.get<AdminOverviewResponse>("/api/admin/overview");
  return response.data;
}

export async function exportResearchAnalytics() {
  const response = await api.get("/api/admin/research-export", {
    responseType: "blob"
  });
  return response.data as Blob;
}

export async function fetchAdminUsers() {
  const response = await api.get<AdminUsersResponse>("/api/admin/users");
  return response.data;
}

export async function fetchAdminSessions() {
  const response = await api.get<AdminSessionsResponse>("/api/admin/sessions");
  return response.data;
}

export async function deleteAdminUser(userId: string) {
  await api.delete(`/api/admin/users/${userId}`);
}

export async function deleteAdminSession(sessionId: string) {
  await api.delete(`/api/admin/sessions/${sessionId}`);
}
