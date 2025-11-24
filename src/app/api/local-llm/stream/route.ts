import { streamLocalOpenAIStyleRequest } from "lib/ai/local-llm-adapter";
import { getSession } from "auth/server";

export const POST = async (req: Request) => {
  const session = await getSession();
  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const body = await req.json();
    return await streamLocalOpenAIStyleRequest(body);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
    });
  }
};
