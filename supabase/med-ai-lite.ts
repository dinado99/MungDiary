// 멍다이어리 AI 약 도우미 — Gemini 전용 짧은 버전 (휴대폰에서 붙여넣기용)
// Supabase 대시보드에서 함수 이름 med-ai 로 배포하고 Secret GEMINI_API_KEY 를 넣어요.
// 기능은 med-ai/index.ts 의 Gemini 경로와 같아요.
const env = (k: string) => Deno.env.get(k)?.trim() || "";
const KEY = env("GEMINI_API_KEY");
const MODEL = env("GEMINI_MODEL") || "gemini-flash-latest";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const KINDS = ["먹는 약", "바르는 약", "눈·귀 약", "주사", "영양제", "기타"];
const STORAGE = ["실온", "냉장", "냉동", "직사광선 피하기", ""];

const SYSTEM = `당신은 '멍다이어리' 앱의 반려견 약 도우미예요. 한국어로 친절하고 짧게, 핵심부터 답해요.
약봉투·라벨의 수의사 지시를 가장 우선하고, 용량을 바꾸라고 하지 않아요. 모르면 모른다고 하고 필요하면 검색해요(국내 동물용의약품 우선).
사람 약의 위험성은 분명히 말하고, 응급일 수 있으면 바로 동물병원에 연락하라고 먼저 말해요. 오늘: ${new Date().toISOString().slice(0, 10)}`;
const SCAN = `[사진 인식] 사진은 약봉투/약병/포장/라벨이에요. 글자(약 이름, 함량, 복용 지시, 조제일, 병원, 유통기한, 보관법)를 읽고 약 정보를 검색해요.
날짜는 사진에 보이는 것만 넣어요. 약이 아니면 found=false. 다른 말 없이 아래 JSON 하나만 답해요:
{"found":true,"summary":"2~4문장 요약","medicines":[{"name":"약 이름+함량","kind":"${KINDS.join("/")} 중 하나","purpose":"어디에 쓰는 약","dosage":"먹이는 법","cautions":"주의사항·부작용","storage":"실온/냉장/냉동/직사광선 피하기 또는 빈 문자열","expiry_date":"YYYY-MM-DD 또는 빈 문자열","prescribed_date":"YYYY-MM-DD 또는 빈 문자열","hospital":"","open_days":0,"notes":"","confidence":"high/medium/low"}]}`;

type Ctx = { pet?: Record<string, string>; meds?: Record<string, string>[] };
function ctxText(c: Ctx = {}) {
  const p = c.pet ?? {}, out: string[] = [];
  if (p.name) out.push(`강아지: ${[p.name, p.breed, p.age, p.sex, p.weight && p.weight + "kg"].filter(Boolean).join(" / ")}`, p.note ? `특이사항: ${p.note}` : "");
  for (const m of (c.meds ?? []).slice(0, 30)) out.push(`- 약: ${m.name} (${m.status || ""}) ${m.purpose || ""} ${m.dosage || ""} ${m.deadline ? "기한 " + m.deadline : ""}`);
  return out.filter(Boolean).join("\n").slice(0, 6000);
}

// 무료 사용량은 계정·모델마다 달라요. 막히거나(429) 붐비면(503) 다음 모델로 넘어가요.
// 구글 검색 연동은 무료 한도가 0인 계정이 많아서 기본은 끄고, GEMINI_SEARCH=on 이면 켜요.
const SEARCH = env("GEMINI_SEARCH") === "on";
const MODELS = [...new Set([MODEL, "gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-2.5-flash"])];
const RETRY = [404, 429, 500, 503, 504];

async function gemini(system: string, contents: unknown[]) {
  let status = 0, d: any = {};
  for (const m of MODELS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
        body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents, ...(SEARCH ? { tools: [{ google_search: {} }] } : {}) }),
        signal: AbortSignal.timeout(35000),
      });
      status = res.status;
      d = await res.json().catch(() => ({}));
      if (res.ok) break;
      console.error("gemini", m, status, d?.error?.message);
    } catch (e) {
      status = 504;
      console.error("gemini", m, "timeout", String(e));
    }
    if (!RETRY.includes(status)) break;
  }
  if (status !== 200) {
    const msg: Record<number, string> = {
      429: "무료 AI 사용량이 잠깐 다 찼어요. 1~2분 뒤에 다시 해주세요",
      503: "구글 AI가 지금 사람이 많아서 바빠요. 잠시 후 다시 해주세요",
      504: "AI 답이 너무 오래 걸렸어요. 다시 해주세요",
      404: "쓸 수 있는 AI 모델을 찾지 못했어요",
      401: "Gemini가 API 키를 거부했어요. 키를 다시 넣거나 새 키를 만들어주세요",
      403: "GEMINI_API_KEY 설정을 확인해주세요",
    };
    throw { status: status === 429 ? 429 : 500, message: msg[status] ?? `AI 서버 오류가 났어요 (${status}). 잠시 후 다시 해주세요` };
  }
  const cand = d.candidates?.[0] ?? {};
  const text = (cand.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").trim();
  const sources = (cand.groundingMetadata?.groundingChunks ?? []).filter((c: any) => c.web?.uri).slice(0, 5)
    .map((c: any) => ({ url: c.web.uri, title: c.web.title || c.web.uri }));
  return { text, sources };
}

function report(text: string) {
  const s = text.replace(/```(?:json)?/g, ""), a = s.indexOf("{"), b = s.lastIndexOf("}");
  let r: any = null;
  try { r = JSON.parse(s.slice(a, b + 1)); } catch { /* 형식이 아니면 글 그대로 */ }
  if (!r) return { found: false, summary: text || "약 정보를 정리하지 못했어요. 다시 찍어볼까요?", medicines: [] };
  const str = (v: unknown) => (v == null ? "" : String(v).trim());
  const medicines = (Array.isArray(r.medicines) ? r.medicines : []).slice(0, 10).map((m: any) => ({
    name: str(m.name), kind: KINDS.includes(str(m.kind)) ? str(m.kind) : "기타", purpose: str(m.purpose), dosage: str(m.dosage),
    cautions: str(m.cautions), storage: STORAGE.includes(str(m.storage)) ? str(m.storage) : "", expiry_date: str(m.expiry_date),
    prescribed_date: str(m.prescribed_date), hospital: str(m.hospital), open_days: Math.max(0, Math.round(Number(m.open_days) || 0)),
    notes: str(m.notes), confidence: ["high", "medium", "low"].includes(m.confidence) ? m.confidence : "medium",
  })).filter((m: any) => m.name || m.purpose);
  return { found: r.found === true && medicines.length > 0, summary: str(r.summary), medicines };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  // 로그인한 사람만 (무료 사용량 보호)
  const who = await fetch(`${env("SUPABASE_URL")}/auth/v1/user`, {
    headers: { apikey: env("SUPABASE_ANON_KEY"), Authorization: req.headers.get("Authorization") ?? "" },
  });
  if (!who.ok) return json({ error: "로그인이 필요해요" }, 401);
  if (!KEY) return json({ error: "AI 키가 아직 설정되지 않았어요 (docs/SETUP.md 8단계)" }, 503);
  try {
    const body = await req.json();
    const ctx = ctxText(body.context);
    if (body.mode === "scan") {
      if (!body.image) return json({ error: "사진을 읽을 수 없어요" }, 400);
      const { text, sources } = await gemini(`${SYSTEM}\n\n${SCAN}${ctx ? "\n\n[이 강아지]\n" + ctx : ""}`, [{
        role: "user", parts: [{ inline_data: { mime_type: body.mediaType || "image/jpeg", data: body.image } }, { text: "이 약이 뭔지 알려주세요." }],
      }]);
      return json({ ...report(text), sources });
    }
    if (body.mode === "ask") {
      const hist = (body.messages ?? []).filter((m: any) => m?.text?.trim()).slice(-12)
        .map((m: any) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: String(m.text).slice(0, 4000) }] }));
      while (hist.length && hist[0].role !== "user") hist.shift();
      if (!hist.length || hist[hist.length - 1].role !== "user") return json({ error: "질문이 비어 있어요" }, 400);
      const { text, sources } = await gemini(`${SYSTEM}${ctx ? "\n\n[이 강아지 — 참고]\n" + ctx : ""}`, hist);
      return json({ text: text || "답을 만들지 못했어요. 다시 물어봐 주세요.", sources });
    }
    return json({ error: "알 수 없는 요청이에요" }, 400);
  } catch (e: any) {
    if (e?.status) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "AI 처리 중 문제가 생겼어요" }, 500);
  }
});
