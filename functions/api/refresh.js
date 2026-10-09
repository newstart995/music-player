export async function onRequestGet(context) {
  const { env } = context;

  try {
    const bucket = env.QINIU_BUCKET;
    const domain = env.QINIU_DOMAIN.replace(/\/$/, "");
    const ak = env.QINIU_AK;
    const sk = env.QINIU_SK;

    // 1. 请求七牛云 API 获取资源列表 (rsf.qiniuapi.com)
    const path = `/list?bucket=${encodeURIComponent(bucket)}`;
    const url = `https://rsf.qiniuapi.com${path}`;

    // 生成 QBox 签名认证
    const signingStr = `${path}\n`;
    const token = await generateQBoxToken(ak, sk, signingStr);

    const qiniuRes = await fetch(url, {
      headers: {
        "Authorization": `QBox ${token}`,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    if (!qiniuRes.ok) {
      const errText = await qiniuRes.text();
      throw new Error(`七牛云接口返回错误 (${qiniuRes.status}): ${errText}`);
    }

    const resData = await qiniuRes.json();
    const items = resData.items || [];

    // 2. 解析文件列表
    const audioExts = [".mp3", ".flac", ".m4a", ".wav", ".ogg"];
    const tracks = [];

    for (const item of items) {
      const key = item.key;
      const isAudio = audioExts.some(ext => key.toLowerCase().endsWith(ext));
      if (!isAudio) continue;

      // 解析路径格式："风格/歌手 - 歌名.mp3" 或 "歌名.mp3"
      const parts = key.split("/");
      let genre = "未分类";
      let filename = key;

      if (parts.length > 1) {
        genre = parts[0];
        filename = parts.slice(1).join("/");
      }

      const nameWithoutExt = filename.substring(0, filename.lastIndexOf(".")) || filename;
      const nameParts = nameWithoutExt.split("-");
      let artist = "未知歌手";
      let title = nameWithoutExt;

      if (nameParts.length > 1) {
        artist = nameParts[0].trim();
        title = nameParts.slice(1).join("-").trim();
      }

      tracks.push({
        id: key,
        title: title,
        artist: artist,
        genre: genre,
        url: `${domain}/${encodeURIComponent(key)}`,
        fsize: item.fsize
      });
    }

    // 3. 将解析结果写入 R2 Bucket
    await env.MUSIC_CACHE.put("catalog.json", JSON.stringify(tracks));

    return new Response(JSON.stringify({ success: true, count: tracks.length }), {
      headers: { "Content-Type": "application/json;charset=UTF-8" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json;charset=UTF-8" }
    });
  }
}

// 七牛云 HMAC-SHA1 签名计算函数
async function generateQBoxToken(accessKey, secretKey, dataStr) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const msgData = encoder.encode(dataStr);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signatureArrayBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signatureArrayBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${accessKey}:${signatureBase64}`;
}
