import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export interface ApiErrorBody {
  error: string;
}

export function getApiErrorMessage(err: unknown, fallback = "เกิดข้อผิดพลาด กรุณาลองใหม่"): string {
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    return err.response?.data?.error ?? fallback;
  }
  return fallback;
}
