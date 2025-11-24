import { OpenAICompatibleProvider } from "./create-openai-compatiable";
import { isString } from "lib/utils";
import logger from "logger";

export interface LocalLLMProviderHealth {
  provider: string;
  baseUrl?: string;
  status: "ok" | "unreachable" | "unknown";
  latencyMs?: number;
  error?: string;
}

export interface LocalLLMProviderInfo {
  provider: string;
  baseUrl?: string;
  models: { apiName: string; uiName: string; supportsTools: boolean }[];
  apiKey?: string; // treated as literal value (may be empty)
  health: LocalLLMProviderHealth;
}

// Timeout helper for fetch pings
async function timedFetch(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
) {
  const { timeoutMs = 2000, ...rest } = init;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...rest, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

// Parse OPENAI_COMPATIBLE_DATA env var; shape already validated elsewhere. Be lenient here.
export function parseOpenAICompatibleData(
  raw: unknown,
): OpenAICompatibleProvider[] {
  try {
    if (!raw) return [];
    const value = isString(raw) ? JSON.parse(raw) : raw;
    if (!Array.isArray(value)) return [];
    return value.filter(
      (p: any) =>
        p && typeof p.provider === "string" && Array.isArray(p.models),
    );
  } catch (e) {
    logger.error("Failed to parse OPENAI_COMPATIBLE_DATA", e);
    return [];
  }
}

// Build provider info list; adds Ollama provider if OLLAMA_BASE_URL present so UI can show health.
export async function buildLocalLLMProviders(): Promise<
  LocalLLMProviderInfo[]
> {
  const envCompatible = parseOpenAICompatibleData(
    process.env.OPENAI_COMPATIBLE_DATA,
  );
  const providers: LocalLLMProviderInfo[] = [];

  for (const p of envCompatible) {
    providers.push({
      provider: p.provider,
      baseUrl: p.baseUrl,
      apiKey: p.apiKey,
      models: p.models.map((m) => ({
        apiName: m.apiName,
        uiName: m.uiName,
        supportsTools: m.supportsTools,
      })),
      health: { provider: p.provider, baseUrl: p.baseUrl, status: "unknown" },
    });
  }

  // Add implicit Ollama provider for visibility even though core models.ts already registers it.
  if (process.env.OLLAMA_BASE_URL) {
    providers.push({
      provider: "ollama-local",
      baseUrl: process.env.OLLAMA_BASE_URL,
      apiKey: "", // typically not required
      models: [],
      health: {
        provider: "ollama-local",
        baseUrl: process.env.OLLAMA_BASE_URL,
        status: "unknown",
      },
    });
  }

  // Ping each provider for basic health. For OpenAI-compatible we try /models. For Ollama we try /tags.
  await Promise.all(
    providers.map(async (p) => {
      if (!p.baseUrl) return; // leave as unknown
      const start = performance.now();
      let url: string | undefined = undefined;
      if (p.provider === "ollama-local") {
        // Ollama API root can be like http://localhost:11434/api, tags endpoint is /tags
        url = normalizeJoin(p.baseUrl, "tags");
      } else {
        // Assume baseUrl may already end with /v1; add /models
        url = normalizeJoin(p.baseUrl, "models");
      }
      try {
        const r = await timedFetch(url, { method: "GET", timeoutMs: 1500 });
        if (r.ok) {
          p.health.status = "ok";
          p.health.latencyMs = Math.round(performance.now() - start);
        } else {
          p.health.status = "unreachable";
          p.health.error = `HTTP ${r.status}`;
        }
      } catch (e: any) {
        p.health.status = "unreachable";
        p.health.error =
          e?.name === "AbortError" ? "timeout" : String(e?.message || e);
      }
    }),
  );

  return providers;
}

function normalizeJoin(base: string, suffix: string) {
  if (!base) return suffix;
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${trimmed}/${suffix}`;
}

// Basic proxy logic: minimal safety; caller ensures model + provider selection. Not streaming.
export async function proxyLocalOpenAIStyleRequest(body: any) {
  const { model, messages, provider } = body ?? {};
  if (!model || !messages || !Array.isArray(messages)) {
    return { status: 400, json: { error: "model and messages required" } };
  }

  const providers = parseOpenAICompatibleData(
    process.env.OPENAI_COMPATIBLE_DATA,
  );
  const targetProvider =
    providers.find((p) => p.provider === provider) || providers[0];
  if (!targetProvider?.baseUrl) {
    return { status: 400, json: { error: "No provider baseUrl configured" } };
  }

  // Build target URL; assume /chat/completions endpoint
  const url = normalizeJoin(targetProvider.baseUrl, "chat/completions");
  try {
    const res = await timedFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(targetProvider.apiKey
          ? { Authorization: `Bearer ${targetProvider.apiKey}` }
          : {}),
      },
      body: JSON.stringify({ model, messages }),
      timeoutMs: 10000,
    });
    const data = await safeJson(res);
    if (!res.ok) {
      return {
        status: res.status,
        json: { error: data?.error || data || `Upstream ${res.status}` },
      };
    }
    return { status: 200, json: data };
  } catch (e: any) {
    return {
      status: 502,
      json: {
        error:
          e?.name === "AbortError"
            ? "Upstream timeout"
            : String(e?.message || e),
      },
    };
  }
}

// Streaming variant: returns a ReadableStream of upstream chunks (text/event-stream or JSON).
export async function streamLocalOpenAIStyleRequest(
  body: any,
): Promise<Response> {
  const { model, messages, provider } = body ?? {};
  if (!model || !messages || !Array.isArray(messages)) {
    return new Response(
      JSON.stringify({ error: "model and messages required" }),
      { status: 400 },
    );
  }
  const providers = parseOpenAICompatibleData(
    process.env.OPENAI_COMPATIBLE_DATA,
  );
  const targetProvider =
    providers.find((p) => p.provider === provider) || providers[0];
  if (!targetProvider?.baseUrl) {
    return new Response(
      JSON.stringify({ error: "No provider baseUrl configured" }),
      { status: 400 },
    );
  }
  const url = normalizeJoin(targetProvider.baseUrl, "chat/completions");
  const controller = new AbortController();
  const upstream = await timedFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(targetProvider.apiKey
        ? { Authorization: `Bearer ${targetProvider.apiKey}` }
        : {}),
    },
    body: JSON.stringify({ model, messages, stream: true }),
    timeoutMs: 30000,
    signal: controller.signal,
  });
  if (!upstream.ok) {
    let text: string | undefined;
    try {
      text = await upstream.text();
    } catch {}
    return new Response(
      JSON.stringify({ error: text || `Upstream ${upstream.status}` }),
      { status: upstream.status },
    );
  }
  // Pass through body as-is; if upstream sends SSE, client will handle.
  const contentType =
    upstream.headers.get("content-type") || "application/octet-stream";
  return new Response(upstream.body, {
    status: 200,
    headers: { "Content-Type": contentType },
  });
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}
