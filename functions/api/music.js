export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 从 R2 绑定中获取缓存文件
    const cacheObj = await env.MUSIC_CACHE.get("catalog.json");
    if (!cacheObj) {
      return new Response(JSON.stringify({ error: "目录缓存未生成" }), {
        status: 404,
        headers: { "Content-Type": "application/json;charset=UTF-8" }
      });
    }

    const data = await cacheObj.json();
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json;charset=UTF-8" }
    });
  }
}
