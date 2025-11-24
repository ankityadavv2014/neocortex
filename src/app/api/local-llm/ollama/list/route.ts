import { getSession } from "auth/server";

function buildOllamaUrl(path: string) {
  const base = process.env.OLLAMA_BASE_URL;
  if (!base) return undefined;
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${trimmed}/${path}`;
}

export const GET = async () => {
  const session = await getSession();
  if (!session?.user.id) return new Response("Unauthorized", { status: 401 });
  const url = buildOllamaUrl("tags");
  if (!url)
    return Response.json(
      { error: "OLLAMA_BASE_URL not configured" },
      { status: 400 },
    );
  try {
    const res = await fetch(url);
    const data = await res.json().catch(() => undefined);
    if (!res.ok)
      return Response.json(
        { error: data || res.statusText },
        { status: res.status },
      );
    return Response.json({ tags: data });
  } catch (e: any) {
    return Response.json({ error: String(e?.message || e) }, { status: 502 });
  }
};
