import { describe, it, expect, vi } from "vitest";
import { buildLocalLLMProviders } from "./local-llm-adapter";

// Mock fetch for health pings
const mockFetch = vi.fn();
(global as any).fetch = mockFetch;

describe("buildLocalLLMProviders health", () => {
  it("marks unreachable when fetch throws", async () => {
    process.env.OPENAI_COMPATIBLE_DATA =
      '[{"provider":"X","models":[{"apiName":"m","uiName":"M","supportsTools":false}],"apiKey":"","baseUrl":"http://localhost:12345/v1"}]';
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const providers = await buildLocalLLMProviders();
    expect(providers[0].health.status).toBe("unreachable");
  });

  it("marks ok when upstream returns 200", async () => {
    process.env.OPENAI_COMPATIBLE_DATA =
      '[{"provider":"Y","models":[{"apiName":"m2","uiName":"M2","supportsTools":false}],"apiKey":"","baseUrl":"http://localhost:1111/v1"}]';
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ object: "list", data: [] }), {
        status: 200,
      }),
    );
    const providers = await buildLocalLLMProviders();
    expect(providers[0].health.status).toBe("ok");
  });
});
