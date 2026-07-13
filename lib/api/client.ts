/**
 * lib/api/client.ts
 *
 * Centralized API client for the admin panel.
 *
 * Every request to /api/v1/admin/* automatically gets:
 *   - x-store-id   → from persisted Zustand adminStore (single source of truth)
 *   - Content-Type → application/json (unless body is FormData)
 *
 * The backend still re-validates x-store-id against the database on every
 * request; this header is used purely for routing/scoping, never trusted alone.
 *
 * Usage:
 *   import { apiClient } from "@/lib/api/client";
 *   const data = await apiClient.get("/api/v1/admin/products");
 *   await apiClient.post("/api/v1/admin/products", formData);
 */

import { useAdminStore } from "@/store/adminStore";

/** Structured API error thrown when the server returns !ok */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestBody = BodyInit | Record<string, unknown> | null;

interface RequestOptions extends Omit<RequestInit, "body" | "headers"> {
  headers?: Record<string, string>;
}

async function request<T = unknown>(
  url: string,
  method: string,
  body?: RequestBody,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = { ...options.headers };

  // Inject x-store-id automatically for admin endpoints
  if (url.includes("/api/v1/admin")) {
    const storeId = useAdminStore.getState().activeStoreId;
    if (storeId) {
      headers["x-store-id"] = storeId;
    }
  }

  // Set Content-Type for JSON unless body is FormData (browser sets multipart boundary)
  let serializedBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      serializedBody = body;
      // Do NOT set Content-Type; let browser set it with the correct boundary
    } else if (typeof body === "object") {
      serializedBody = JSON.stringify(body);
      headers["Content-Type"] = "application/json";
    } else {
      serializedBody = body as BodyInit;
    }
  }

  const res = await fetch(url, {
    ...options,
    method,
    headers,
    body: serializedBody,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      json?.error?.code ?? "UNKNOWN_ERROR",
      json?.error?.message ?? `Request failed with status ${res.status}`,
      res.status
    );
  }

  return json as T;
}

export const apiClient = {
  get: <T = unknown>(url: string, options?: RequestOptions) =>
    request<T>(url, "GET", undefined, options),

  post: <T = unknown>(url: string, body?: RequestBody, options?: RequestOptions) =>
    request<T>(url, "POST", body, options),

  patch: <T = unknown>(url: string, body?: RequestBody, options?: RequestOptions) =>
    request<T>(url, "PATCH", body, options),

  delete: <T = unknown>(url: string, options?: RequestOptions) =>
    request<T>(url, "DELETE", undefined, options),
};
