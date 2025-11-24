import { getSession } from "auth/server";

function buildOllamaUrl(path: string) {
  const base = process.env.OLLAMA_BASE_URL;
  if (!base) return undefined;
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${trimmed}/${path}`;
}

export const POST = async (req: Request) => {
  if (process.env.LOCAL_LLM_ENABLE_PULL !== "true") {
    return Response.json({ error: "Model delete disabled" }, { status: 403 });
  }
  const session = await getSession();
  if (!session?.user.id) return new Response("Unauthorized", { status: 401 });
  try {
    const { model } = await req.json();
    if (!model)
      return Response.json({ error: "model required" }, { status: 400 });
    const url = buildOllamaUrl("delete");
    if (!url)
      return Response.json(
        { error: "OLLAMA_BASE_URL not configured" },
        { status: 400 },
      );
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model }),
    });
    const data = await upstream.json().catch(() => undefined);
    if (!upstream.ok)
      return Response.json(
        { error: data || upstream.statusText },
        { status: upstream.status },
      );
    return Response.json({ result: data });
  } catch (e: any) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
};
