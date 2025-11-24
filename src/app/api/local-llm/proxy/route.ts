import { proxyLocalOpenAIStyleRequest } from "lib/ai/local-llm-adapter";

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const result = await proxyLocalOpenAIStyleRequest(body);
    return Response.json(result.json, { status: result.status });
  } catch (e: any) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
};
