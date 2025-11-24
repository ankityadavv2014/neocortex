# Local LLM Integration & Management

This guide explains how to wire local inference runtimes (vLLM, LiteLLM, LocalAI, Ollama, llama.cpp wrappers) into the application, manage models, and observe health — with an emphasis on security and licensing.

## 1. Quick Start

1. Choose a runtime:
   - High-throughput: vLLM (Apache 2.0)
   - Aggregator: LiteLLM (Apache 2.0)
   - Simple local models: Ollama (MIT)
   - Drop-in OpenAI replacement: LocalAI (MIT)
2. Run the server (example vLLM):
   ```bash
   pip install vllm
   python -m vllm.entrypoints.openai.api_server --model deepseek-ai/DeepSeek-R1-Distill-Qwen-7B
   ```
3. Add to `.env`:
   ```bash
   OPENAI_COMPATIBLE_DATA='[
     {"provider":"LocalVLLM","models":[{"apiName":"deepseek-r1-distill-qwen-7b","uiName":"DeepSeek R1 7B Local","supportsTools":false}],"apiKey":"","baseUrl":"http://localhost:8000/v1"}
   ]'
   ```
4. Restart dev server; visit `/api/local-llm/providers`.

## 2. Environment Variables

| Name | Purpose | Example |
|------|---------|---------|
| `OPENAI_COMPATIBLE_DATA` | JSON array describing OpenAI-compatible providers & models | See above |
| `OLLAMA_BASE_URL` | Ollama API base URL (include `/api`) | `http://localhost:11434/api` |
| `LOCAL_LLM_ENABLE_PULL` | Enables Ollama model pull/delete endpoints | `true` |

## 3. API Endpoints

| Endpoint | Method | Description | Auth | Notes |
|----------|--------|-------------|------|-------|
| `/api/local-llm/providers` | GET | Provider list + health | Required | Health ping `/models` or `/tags` |
| `/api/local-llm/proxy` | POST | Non-stream chat completion proxy | Required | Body: `{provider?, model, messages}` |
| `/api/local-llm/stream` | POST | Streaming chat completion | Required | SSE or chunked passthrough |
| `/api/local-llm/ollama/list` | GET | List Ollama tags | Required | Needs `OLLAMA_BASE_URL` |
| `/api/local-llm/ollama/pull` | POST | Pull a model (enabled flag) | Required | Body: `{model}`; requires `LOCAL_LLM_ENABLE_PULL=true` |
| `/api/local-llm/ollama/delete` | POST | Delete a model (enabled flag) | Required | Body: `{model}` |

## 4. Security Considerations

1. Only expose these endpoints to authenticated users (already guarded).
2. Keep `LOCAL_LLM_ENABLE_PULL` disabled by default to avoid arbitrary model loads.
3. Rate limit requests (future improvement): per-user token bucket (e.g., Redis) keyed by user id + endpoint.
4. Avoid shelling out from the application; rely on runtime HTTP APIs.

## 5. Tool Calling Support

Set `supportsTools: true` only if the underlying runtime implements function-calling semantics consistent with the app’s expectations. Otherwise tools are disabled to prevent errors.

## 6. Streaming

`/api/local-llm/stream` sets `stream: true` in the upstream request and forwards the raw response body so the client can parse SSE or chunked JSON. Extend with transforms (e.g., token-level metrics) by wrapping the `ReadableStream`.

## 7. Licensing Overview (Non-Legal)

| Component | Typical License | Notes |
|-----------|-----------------|-------|
| vLLM | Apache 2.0 | Permissive |
| LiteLLM | Apache 2.0 | Aggregates multiple providers |
| LocalAI | MIT | OpenAI-compatible; integrates many backends |
| Ollama | MIT | Provides model pull & run; check individual model licenses |
| Model Weights | Varies | Always verify each model’s license for commercial use |

Maintain a `LICENSES.md` listing versions + licenses of runtimes and models you distribute or rely upon.

## 8. Future Enhancements

1. Rate limiting middleware.
2. Admin UI for model operations & health stats.
3. Streaming token usage metrics + cost estimation.
4. Automatic fallback/round-robin across multiple local providers.
5. Embeddings endpoint for local vector store ingestion.

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Provider health `unreachable` | Wrong baseUrl or server down | Verify server logs; curl baseUrl `/models` |
| Proxy returns 400 (model required) | Missing `model` in request | Include `model` and `messages` array |
| Empty models list | Provider has no models or misconfigured JSON | Re-check `OPENAI_COMPATIBLE_DATA` formatting |
| Streaming stalls | Upstream server lacks stream support | Remove `stream: true`, use non-stream endpoint |

## 10. Example Client Call (Stream)

```ts
const res = await fetch('/api/local-llm/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ provider: 'LocalVLLM', model: 'deepseek-r1-distill-qwen-7b', messages: [{ role: 'user', content: 'Hello!' }] })
});
const reader = res.body!.getReader();
// Read chunks and decode... (SSE parsing if needed)
```

---
Internal use only – consult legal counsel before commercial distribution.
