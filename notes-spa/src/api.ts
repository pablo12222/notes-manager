import type { GetTokenSilentlyOptions } from "@auth0/auth0-react";

const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:5241";

const AUTH0_AUDIENCE: string =
  (import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined) ?? "";

const ADMIN_SCOPES_FALLBACK = "read:admin-secret manage:users manage:roles";
const AUTH0_ADMIN_SCOPES: string =
  (import.meta.env.VITE_AUTH0_ADMIN_SCOPES as string | undefined) ?? ADMIN_SCOPES_FALLBACK;

type GetAccessTokenSilently = (options?: GetTokenSilentlyOptions) => Promise<string>;

function decodeJwt<T = any>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export function createAuthedFetch(getAccessTokenSilently: GetAccessTokenSilently) {
  return async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const inputStr = typeof input === "string" ? input : (input as URL).toString();
    const url =
      /^https?:\/\//i.test(inputStr)
        ? inputStr
        : `${API_BASE_URL.replace(/\/+$/, "")}/${inputStr.replace(/^\/+/, "")}`;

    const isAdminCall = /\/api\/admin(\/|$)/.test(url);

    // 1) zwykły token z audience (bez wyłączania cache)
    const baseOpts: any = {
      authorizationParams: {
        audience: AUTH0_AUDIENCE || undefined,
        scope: isAdminCall ? AUTH0_ADMIN_SCOPES : undefined,
      },
    };
    let token = await getAccessTokenSilently(baseOpts);

    // 2) jeżeli admin i brak permissions -> spróbuj ponownie z wyłączonym cache
    if (isAdminCall) {
      const payload = decodeJwt<any>(token);
      const hasPerms = Array.isArray(payload?.permissions) && payload.permissions.length > 0;
      if (!hasPerms) {
        try {
          const freshOpts: any = {
            ...baseOpts,
            // zgodność z v1/v2 SDK:
            ignoreCache: true,
            cacheMode: "off" as any,
          };
          token = await getAccessTokenSilently(freshOpts);
        } catch (e: any) {
          // brak refresh tokena? jedziemy na pierwszym
          if (!String(e?.message || "").includes("Missing Refresh Token")) throw e;
          console.warn("[auth] Missing Refresh Token – używam tokenu z cache.");
        }
      }
    }

    const headers = new Headers(init.headers ?? {});
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    const hasBody = init.body != null;
    const bodyLooksLikeJsonString =
      typeof init.body === "string" && /^[\s]*[{\[]/.test(init.body);
    const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
    const isBlob = typeof Blob !== "undefined" && init.body instanceof Blob;
    const isArrayBuffer = typeof ArrayBuffer !== "undefined" && init.body instanceof ArrayBuffer;

    if (hasBody && !headers.has("Content-Type") && !isFormData && !isBlob && !isArrayBuffer && bodyLooksLikeJsonString) {
      headers.set("Content-Type", "application/json");
    }
    headers.set("Authorization", `Bearer ${token}`);

    let res: Response;
    try {
      res = await fetch(url, { ...init, headers, signal: init.signal });
    } catch (e: any) {
      if (e?.name === "AbortError") throw e;
      throw new Error(`Network error: ${e?.message ?? "unknown"}`);
    }

    if (!res.ok) {
      let detail = "";
      try { detail = await res.text(); } catch {}
      console.error("API error:", res.status, res.statusText, detail);
      throw new Error(`API ${res.status} ${res.statusText}${detail ? ` – ${detail}` : ""}`);
    }

    return res;
  };
}
