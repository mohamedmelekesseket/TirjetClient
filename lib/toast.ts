"use client";

export type AppToastType = "success" | "error" | "info";

export interface AppToastPayload {
  title: string;
  description?: string;
  type?: AppToastType;
  durationMs?: number;
}

const EVENT_NAME = "tirjet:toast";

export function showAppToast(payload: AppToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
}

export function showSuccessToast(title: string, description?: string, durationMs = 3200) {
  showAppToast({ title, description, type: "success", durationMs });
}

export function showErrorToast(title: string, description?: string, durationMs = 4200) {
  showAppToast({ title, description, type: "error", durationMs });
}

export function showInfoToast(title: string, description?: string, durationMs = 3200) {
  showAppToast({ title, description, type: "info", durationMs });
}

export { EVENT_NAME as APP_TOAST_EVENT };
