// Base gateway client (axios). All API clients extend this and only declare
// endpoints. Same-origin in production (the Cloudflare tunnel routes /api to the
// gateway); in local dev NEXT_PUBLIC_GATEWAY_URL points at the gateway. Secrets
// never reach the browser — the gateway holds them.

import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

import { env } from "@/env";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message?: string,
  ) {
    super(message ?? `gateway responded ${status}`);
    this.name = "ApiError";
  }
}

export abstract class ApiClient {
  protected readonly http: AxiosInstance;
  /** Resolved origin + resource prefix; used directly for SSE (bypasses axios). */
  protected readonly base: string;

  /** @param path resource prefix appended to the gateway origin, e.g. "/api/integrations/github" */
  protected constructor(path: string) {
    // `base` is also used directly for SSE (EventSource/fetch-event-source),
    // which bypasses axios — so keep it assigned, not just axios's baseURL.
    this.base = `${env.NEXT_PUBLIC_GATEWAY_URL ?? ""}${path}`;
    this.http = axios.create({
      baseURL: this.base,
      headers: { "Content-Type": "application/json" },
    });
  }

  protected async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const res = await this.http.request<T>(config);
      return res.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) throw new ApiError(err.response.status);
      throw err;
    }
  }

  protected get<T>(url: string): Promise<T> {
    return this.request<T>({ method: "GET", url });
  }

  protected post<T>(url: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: "POST", url, data });
  }

  protected delete<T>(url: string): Promise<T> {
    return this.request<T>({ method: "DELETE", url });
  }
}
