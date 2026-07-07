import type { Language } from "./types";

export const appNotice = {
  connecting: (language: Language) =>
    language === "en" ? "Connecting to backend API" : "正在连接后端 API",
  connected: (language: Language) =>
    language === "en"
      ? "Connected to backend API; data comes from PostgreSQL"
      : "已连接后端 API，数据来自 PostgreSQL",
  backendFailed: (language: Language, message: string | null, apiBase: string) =>
    language === "en"
      ? message
        ? `Backend connection failed: ${message} (current API URL: ${apiBase}). Check that the backend service is running, or set the correct backend URL in Advanced configuration on the login page (default /api/v1).`
        : "Backend connection failed"
      : message
        ? `后端连接失败：${message} (当前API地址: ${apiBase})。请检查后端服务是否运行，或在登录页“高级配置”中设置正确的后端地址（默认 /api/v1）。`
        : "后端连接失败",
  processing: (language: Language, label: string) =>
    language === "en" ? `Processing: ${label}` : `${label}处理中`,
  success: (language: Language, label: string, uploadedUrl = "") =>
    language === "en"
      ? `${label} succeeded${uploadedUrl ? `: ${uploadedUrl}` : ""}`
      : `${label}成功${uploadedUrl ? `：${uploadedUrl}` : ""}`,
  failure: (language: Language, label: string, message?: string) =>
    language === "en"
      ? `${label} failed${message ? `: ${message}` : ""}`
      : `${label}失败${message ? `：${message}` : ""}`,
  bindPasskey: (language: Language) =>
    language === "en" ? "Bind Passkey" : "绑定 Passkey",
};
