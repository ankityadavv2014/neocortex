import { buildLocalLLMProviders } from "lib/ai/local-llm-adapter";

export const GET = async () => {
  const providers = await buildLocalLLMProviders();
  return Response.json({ providers });
};
