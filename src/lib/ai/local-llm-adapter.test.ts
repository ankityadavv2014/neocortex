import { describe, it, expect } from "vitest";
import { parseOpenAICompatibleData } from "./local-llm-adapter";

describe("local-llm-adapter parseOpenAICompatibleData", () => {
  it("returns empty for undefined", () => {
    expect(parseOpenAICompatibleData(undefined)).toEqual([]);
  });
  it("returns empty for malformed JSON string", () => {
    expect(parseOpenAICompatibleData("not json")).toEqual([]);
  });
  it("parses minimal valid provider", () => {
    const raw = JSON.stringify([
      {
        provider: "TestProvider",
        baseUrl: "http://localhost:1234/v1",
        apiKey: "",
        models: [{ apiName: "m-a", uiName: "Model A", supportsTools: false }],
      },
    ]);
    const parsed = parseOpenAICompatibleData(raw);
    expect(parsed.length).toBe(1);
    expect(parsed[0].provider).toBe("TestProvider");
    expect(parsed[0].models[0].apiName).toBe("m-a");
  });
});
