import { describe, it, expect } from "vitest";
import { parseOpenAICompatibleData } from "lib/ai/local-llm-adapter";

describe("parseOpenAICompatibleData", () => {
  it("returns empty array for invalid input", () => {
    expect(parseOpenAICompatibleData(undefined)).toEqual([]);
    expect(parseOpenAICompatibleData("not json")).toEqual([]);
  });

  it("parses valid providers", () => {
    const json = JSON.stringify([
      {
        provider: "TestProvider",
        baseUrl: "http://localhost:1234/v1",
        apiKey: "",
        models: [
          { apiName: "model-a", uiName: "Model A", supportsTools: false },
          { apiName: "model-b", uiName: "Model B", supportsTools: true },
        ],
      },
    ]);
    const result = parseOpenAICompatibleData(json);
    expect(result.length).toBe(1);
    expect(result[0].provider).toBe("TestProvider");
    expect(result[0].models.length).toBe(2);
  });
});
