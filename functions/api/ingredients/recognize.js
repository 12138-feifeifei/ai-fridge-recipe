// POST /api/ingredients/recognize
// 收前端 FormData(字段 image=图片文件),调智谱视觉模型识别食材,返回前端契约格式。
// 无 ZHIPU_API_KEY 环境变量时返回 mock 数据(mock:true),保证前后端可先联调。
// 零依赖,自包含,Cloudflare Pages Functions 直接可用。

const ZHIPU_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 智谱对 base64 图片约 5MB 上限,留余量

const PROMPT = `你是食材识别助手。仔细看这张照片(通常是冰箱内部或食材),找出所有能认出的食材或食物。

要求:
- 只输出一个 JSON 数组,不要输出任何解释、前后缀或 markdown 代码块
- 每个元素格式: {"name":"食材中文名","confidence":0.95,"quantity":"2 个","category":"蔬菜"}
- name 用常见中文食材名(番茄、鸡蛋、生菜、牛奶、豆腐、五花肉…),不用品牌名;包装食品写品类(如"酸奶"),半成品菜肴写菜名
- confidence 是 0~1 的小数:非常确定 0.9 以上,较确定 0.7~0.9,不太确定 0.4~0.7
- quantity 是数量的粗略估计(如 "3 个"、"半颗"、"1 盒"),看不清给 ""
- category 从这些里选:蔬菜/肉类/蛋奶/菌菇/调味/主食/水果/其他
- 最多 15 个,按 confidence 从高到低排列;一个都认不出就输出 []`;

const MOCK = {
  success: true,
  mock: true,
  data: [
    { id: "ing-1", name: "番茄", confidence: 0.96, quantity: "2 个", category: "蔬菜" },
    { id: "ing-2", name: "鸡蛋", confidence: 0.94, quantity: "3 个", category: "蛋奶" },
    { id: "ing-3", name: "西兰花", confidence: 0.92, quantity: "1 颗", category: "蔬菜" },
    { id: "ing-4", name: "土豆", confidence: 0.9, quantity: "2 个", category: "蔬菜" },
    { id: "ing-5", name: "青椒", confidence: 0.88, quantity: "3 根", category: "蔬菜" },
    { id: "ing-6", name: "香菇", confidence: 0.84, quantity: "5 朵", category: "菌菇" },
  ],
  meta: { count: 6, recognizedAt: new Date().toISOString() },
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}

function fail(status, code, message) {
  return json({ success: false, code, message }, status);
}

// 大数组不能一次展开进 String.fromCharCode,按块转 base64
function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let out = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(out);
}

// 从模型回复里抠出 JSON(容忍 <think>、```json 围栏、前后废话)
function extractJSON(text) {
  if (!text) return null;
  let t = String(text).replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  for (const [open, close] of [
    ["{", "}"],
    ["[", "]"],
  ]) {
    const s = t.indexOf(open);
    if (s < 0) continue;
    let idx = t.indexOf(close, s);
    while (idx > 0) {
      try {
        return JSON.parse(t.slice(s, idx + 1));
      } catch {
        idx = t.indexOf(close, idx + 1);
      }
    }
  }
  return null;
}

async function callZhipu(key, payload, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(ZHIPU_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const txt = await r.text();
    if (!r.ok) {
      let msg = `智谱接口错误 ${r.status}`;
      try {
        msg = JSON.parse(txt)?.error?.message || msg;
      } catch {}
      return { ok: false, message: msg };
    }
    const content = JSON.parse(txt)?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return { ok: false, message: "AI 未返回内容" };
    }
    return { ok: true, content };
  } catch (e) {
    if (e && e.name === "AbortError") return { ok: false, message: "AI 响应超时,请重试", timeout: true };
    return { ok: false, message: "调用 AI 失败: " + (e?.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

function normalizeIngredients(parsed) {
  // 兼容:数组 / {ingredients:[...]} / {data:[...]} / 单个食材对象
  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.ingredients)
      ? parsed.ingredients
      : Array.isArray(parsed?.data)
        ? parsed.data
        : parsed && typeof parsed === "object" && parsed.name
          ? [parsed]
          : null;
  if (!arr) return null;
  const seen = new Set();
  const out = [];
  for (const item of arr.slice(0, 20)) {
    if (!item || typeof item !== "object") continue;
    const name = String(item.name || "").trim().slice(0, 30);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    let confidence = Number(item.confidence);
    if (!Number.isFinite(confidence)) confidence = 0.7;
    confidence = Math.min(1, Math.max(0, confidence));
    const category = ["蔬菜", "肉类", "蛋奶", "菌菇", "调味", "主食", "水果", "其他"].includes(item.category)
      ? item.category
      : "";
    out.push({
      id: "ing-" + (out.length + 1),
      name,
      confidence: Math.round(confidence * 100) / 100,
      quantity: String(item.quantity || "").trim().slice(0, 20),
      category,
    });
  }
  return out;
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return fail(405, "METHOD_NOT_ALLOWED", "只支持 POST");

  const key = env.ZHIPU_API_KEY || "";
  if (!key) return json({ ...MOCK, meta: { ...MOCK.meta, recognizedAt: new Date().toISOString() } });

  try {
    // 主格式:FormData 字段 image=文件;兼容 JSON {"image":"data:image/...;base64,..."}
    let dataUrl = "";
    let bytes = 0;
    const ctype = (request.headers.get("content-type") || "").toLowerCase();
    if (ctype.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("image") || form.get("file");
      if (!file || typeof file === "string") return fail(400, "INVALID_IMAGE_TYPE", "请上传图片文件");
      bytes = file.size;
      const buf = await file.arrayBuffer();
      dataUrl = `data:${file.type || "image/jpeg"};base64,` + bufToBase64(buf);
    } else {
      const body = await request.json().catch(() => null);
      const img = body?.image || body?.imageBase64 || "";
      if (typeof img !== "string" || !img) return fail(400, "INVALID_IMAGE_TYPE", "请上传图片");
      bytes = img.length;
      dataUrl = img.startsWith("data:") ? img : "data:image/jpeg;base64," + img;
    }

    if (bytes > MAX_IMAGE_BYTES) {
      return fail(413, "IMAGE_TOO_LARGE", "图片过大(超过 4MB),请压缩后重试");
    }

    const payload = {
      model: env.VISION_MODEL || "glm-4v-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    };

    const result = await callZhipu(key, payload, 15000);
    if (!result.ok) return fail(result.timeout ? 504 : 502, result.timeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR", result.message);

    const ingredients = normalizeIngredients(extractJSON(result.content));
    if (!ingredients) {
      return fail(502, "UPSTREAM_ERROR", "AI 返回格式异常,请重试");
    }
    return json({
      success: true,
      mock: false,
      data: ingredients,
      meta: { count: ingredients.length, recognizedAt: new Date().toISOString() },
    });
  } catch (e) {
    return fail(500, "INTERNAL_ERROR", "服务异常: " + (e?.message || e));
  }
}
