# Third-Party Licenses & Components Summary

This file lists external runtime components and notes regarding model weight licensing. It is NOT legal advice.

## Runtimes

| Component | Version (example) | License | Source URL | Notes |
|-----------|-------------------|--------|------------|-------|
| vLLM | (pin in deployment) | Apache 2.0 | https://github.com/vllm-project/vllm | High-throughput OpenAI-compatible server |
| LiteLLM | (pin) | Apache 2.0 | https://github.com/BerriAI/litellm | Aggregates local & cloud providers |
| LocalAI | (pin) | MIT | https://github.com/mudler/LocalAI | Drop-in OpenAI-compatible API |
| Ollama | (pin) | MIT | https://github.com/ollama/ollama | Local model runner & puller |
| llama.cpp wrappers | (pin) | MIT | https://github.com/ggerganov/llama.cpp | GGUF quantized CPU/GPU inference |

## Model Weights

Each model’s license must be verified before commercial use. Maintain a table like:

| Model Name | Source | License | Commercial Use Allowed | Notes |
|------------|--------|--------|------------------------|-------|
| deepseek-r1-distill-qwen-7b | Hugging Face | (e.g., Apache 2.0) | Yes/No | Verify README |
| llama-3.2-1b | Meta | Llama 3.2 License | Conditional | Check usage terms |
| qwen2.5-7b-instruct | Alibaba | Apache 2.0 (if so) | Yes | Attribution may be required |

Update this list whenever adding or upgrading model weights.

## Attribution & Notices

Where a license requires attribution, include original copyright notices in distribution archives or about pages.

## Recommended Practice

1. Pin runtime versions in deployment manifests.
2. Keep a `models-manifest.json` with model name, SHA (if available), license, source URL.
3. Automate a CI check that flags unlicensed or unknown-license models.
4. Re-review dependencies quarterly.

---
This document assists internal auditing; consult qualified legal counsel for definitive guidance.
