// 멍다이어리 AI 약사 — Supabase Edge Function
//
// mode: "scan" → 약 사진(약봉투, 약병, 포장)을 보고 약 정보를 찾아 정리해요.
// mode: "ask"  → 우리 강아지 정보·약상자를 참고해서 질문에 답해요.
//
// AI 키는 브라우저에 노출되면 안 되기 때문에 이 함수 안에서만 써요.
// 비밀값(Secrets) 중 하나만 있으면 돼요:
//   GEMINI_API_KEY     → Google Gemini (무료 사용량 있음, 기본)
//   ANTHROPIC_API_KEY  → Claude (유료)
// 선택: AI_PROVIDER ("gemini" | "claude"), GEMINI_MODEL (기본 gemini-flash-latest),
//       CLAUDE_MODEL (기본 claude-opus-5-5)
import Anthropic from "npm:@anthropic-ai/sdk@0.131.0";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const env = (k: string) => Deno.env.get(k)?.trim() || "";
const GEMINI_KEY = env("GEMINI_API_KEY");
const ANTHROPIC_KEY = env("ANTHROPIC_API_KEY");
const PROVIDER = env("AI_PROVIDER") || (GEMINI_KEY ? "gemini" : ANTHROPIC_KEY ? "claude" : "");
const GEMINI_MODEL = env("GEMINI_MODEL") || "gemini-flash-latest";
const CLAUDE_MODEL = env("CLAUDE_MODEL") || "claude-opus-5-5";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// 사용자에게 그대로 보여줄 수 있는 오류
class AIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ---------- 공통: 프롬프트와 결과 형식 ----------
const KINDS = ["먹는 약", "바르는 약", "눈·귀 약", "주사", "영양제", "기타"];
const STORAGE = ["실온", "냉장", "냉동", "직사광선 피하기", ""];
const CONFIDENCE = ["high", "medium", "low"];

type Source = { url: string; title: string };
type Medicine = {
  name: string; kind: string; purpose: string; dosage: string; cautions: string; storage: string;
  expiry_date: string; prescribed_date: string; hospital: string; open_days: number; notes: string; confidence: string;
};
type Report = { found: boolean; summary: string; medicines: Medicine[] };

const MEDICINE_FIELDS = {
  name: "약 이름 (제품명 + 함량). 성분명이 보이면 괄호로",
  kind: `종류: ${KINDS.join(" / ")} 중 하나`,
  purpose: "어디에 쓰는 약인지 (효능·효과), 보호자가 이해하기 쉬운 말로",
  dosage: "먹이는/쓰는 방법. 약봉투·라벨에 적힌 지시가 있으면 그대로 우선",
  cautions: "주의사항, 흔한 부작용, 바로 병원에 가야 하는 증상",
  storage: `보관: ${STORAGE.filter(Boolean).join(" / ")} 중 하나, 모르면 빈 문자열`,
  expiry_date: "사진에 보이는 유통기한 YYYY-MM-DD. 안 보이면 빈 문자열",
  prescribed_date: "사진에 보이는 조제/처방일 YYYY-MM-DD. 안 보이면 빈 문자열",
  hospital: "사진에 보이는 병원/약국 이름. 안 보이면 빈 문자열",
  open_days: "개봉 후 사용 가능 일수(안약·시럽 등), 정수. 모르면 0",
  notes: "그 밖에 알아둘 점 (사진에서 읽은 추가 정보 포함)",
  confidence: "확신 정도: high / medium / low",
};

type Context = {
  pet?: Record<string, string>;
  meds?: Array<Record<string, string>>;
};

function contextText(ctx: Context = {}) {
  const lines: string[] = [];
  const p = ctx.pet ?? {};
  if (p.name) {
    lines.push(`강아지: ${p.name}` + [p.breed, p.age, p.sex, p.weight && `${p.weight}kg`].filter(Boolean).map((x) => ` / ${x}`).join(""));
    if (p.note) lines.push(`특이사항: ${p.note}`);
  }
  if (ctx.meds?.length) {
    lines.push("약상자:");
    for (const m of ctx.meds.slice(0, 30)) {
      lines.push(`- ${m.name} (${m.status || "상태 미입력"})` +
        [m.purpose && `용도: ${m.purpose}`, m.dosage && `복용: ${m.dosage}`, m.deadline && `사용기한: ${m.deadline}`]
          .filter(Boolean).map((x) => ` · ${x}`).join(""));
    }
  }
  return lines.join("\n").slice(0, 6000);
}

const BASE_SYSTEM = `당신은 '멍다이어리' 앱 안의 반려견 약 도우미예요. 보호자가 동물병원에서 받은 약이나 집에 있는 약에 대해 물어봐요.
- 한국어로, 친절하고 쉽게, 핵심부터 짧게 답해요.
- 약봉투·라벨에 적힌 수의사 지시가 있으면 그것을 가장 우선해요. 일반적인 용량을 계산해서 처방을 바꾸라고 하지 않아요.
- 확실하지 않은 정보는 확실하지 않다고 말하고, 필요하면 웹 검색으로 확인해요. 한국 동물용의약품 정보(국내 제품명)를 우선 찾아요.
- 사람 약을 강아지에게 먹여도 되는지 같은 질문에는 위험성을 분명히 말해요.
- 구토·경련·호흡곤란·대량 섭취처럼 응급일 수 있으면 바로 동물병원(야간 응급 포함)에 연락하라고 먼저 말해요.
- 오늘 날짜: ${new Date().toISOString().slice(0, 10)}`;

const SCAN_TASK = `[사진 인식 작업]
사진은 강아지 약봉투, 약병, 약 포장, 처방전, 라벨 중 하나예요.
1. 사진의 글자를 꼼꼼히 읽어요 (약 이름, 함량, 복용 지시, 조제일, 병원, 유통기한, 보관법).
2. 약 이름을 알면 웹 검색으로 효능, 일반적인 사용법, 주의사항, 보관법을 확인해요. 동물용 제품인지 사람 약인지도 구분해요.
3. 약봉투에 여러 알이 섞여 조제된 경우처럼 이름을 알 수 없으면 사진에 보이는 정보만 하나의 항목으로 정리해요.
4. 날짜는 사진에서 실제로 보이는 것만 넣고 지어내지 않아요.
5. 약이 아니거나 읽을 수 없으면 found=false 로 하고 이유를 summary 에 써요.`;

const scanSystem = (ctx: string) => BASE_SYSTEM + "\n\n" + SCAN_TASK + (ctx ? `\n\n[이 강아지 정보]\n${ctx}` : "");
const askSystem = (ctx: string) => BASE_SYSTEM + (ctx ? `\n\n[이 강아지 정보 — 답할 때 참고]\n${ctx}` : "");

// AI 가 보낸 결과를 앱이 믿고 쓸 수 있는 모양으로 다듬어요
function normalizeReport(raw: unknown): Report {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v));
  const pick = (v: unknown, list: string[], fallback: string) => (list.includes(str(v)) ? str(v) : fallback);
  const meds = Array.isArray(r.medicines) ? r.medicines : [];
  const medicines = meds.slice(0, 10).map((x) => {
    const m = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    return {
      name: str(m.name), kind: pick(m.kind, KINDS, "기타"), purpose: str(m.purpose), dosage: str(m.dosage),
      cautions: str(m.cautions), storage: pick(m.storage, STORAGE, ""), expiry_date: str(m.expiry_date),
      prescribed_date: str(m.prescribed_date), hospital: str(m.hospital),
      open_days: Math.max(0, Math.round(Number(m.open_days) || 0)), notes: str(m.notes),
      confidence: pick(m.confidence, CONFIDENCE, "medium"),
    };
  }).filter((m) => m.name || m.purpose || m.dosage);
  return { found: r.found === true && medicines.length > 0, summary: str(r.summary), medicines };
}

// ---------- Gemini (무료 사용량) ----------
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

type GeminiPart = { text?: string; inline_data?: { mime_type: string; data: string } };
type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

async function gemini(system: string, contents: GeminiContent[]) {
  const res = await fetch(`${GEMINI_URL}/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents,
      tools: [{ google_search: {} }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg: string = data?.error?.message ?? "";
    if (res.status === 429) throw new AIError(429, "오늘 무료 AI 사용량을 다 썼거나 요청이 너무 많아요. 잠시 후(또는 내일) 다시 해주세요");
    if (res.status === 404) throw new AIError(500, `Gemini 모델(${GEMINI_MODEL})을 찾을 수 없어요. GEMINI_MODEL 설정을 확인해주세요`);
    if (res.status === 403 || /API key/i.test(msg)) throw new AIError(500, "GEMINI_API_KEY 설정을 확인해주세요");
    console.error("gemini", res.status, msg);
    throw new AIError(502, `AI 서버 오류 (${res.status})`);
  }
  if (data.promptFeedback?.blockReason) throw new AIError(422, "이 내용은 AI가 분석할 수 없어요");
  const cand = data.candidates?.[0] ?? {};
  const text = (cand.content?.parts ?? []).map((p: GeminiPart) => p.text ?? "").join("").trim();
  const sources: Source[] = [];
  for (const c of cand.groundingMetadata?.groundingChunks ?? []) {
    if (c.web?.uri && sources.length < 5) sources.push({ url: c.web.uri, title: c.web.title || c.web.uri });
  }
  return { text, sources };
}

// 검색 도구와 JSON 강제 출력을 함께 못 쓰는 모델이 있어서, JSON 은 글로 받아서 꺼내요
function extractJSON(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function geminiScan(system: string, image: string, mediaType: string, userText: string) {
  const format = `\n\n[답하는 형식]\n조사가 끝나면 다른 말 없이 아래 모양의 JSON 하나만 답해요.\n` +
    `{"found": true/false, "summary": "보호자에게 보여줄 2~4문장 요약", "medicines": [{${
      Object.entries(MEDICINE_FIELDS).map(([k, v]) => `"${k}": "${v}"`).join(", ")}}]}`;
  const { text, sources } = await gemini(system + format, [{
    role: "user",
    parts: [{ inline_data: { mime_type: mediaType, data: image } }, { text: userText }],
  }]);
  const parsed = extractJSON(text);
  if (!parsed) return { found: false, summary: text || "약 정보를 정리하지 못했어요. 다시 찍어볼까요?", medicines: [], sources };
  return { ...normalizeReport(parsed), sources };
}

async function geminiAsk(system: string, history: Array<{ role: "user" | "assistant"; content: string }>) {
  return await gemini(system, history.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })));
}

// ---------- Claude (유료) ----------
let anthropicClient: Anthropic | undefined;
const anthropic = () => (anthropicClient ??= new Anthropic({ apiKey: ANTHROPIC_KEY }));

const WEB_SEARCH: Anthropic.Beta.BetaToolUnion = {
  type: "web_search_20260209",
  name: "web_search",
  max_uses: 4,
  user_location: { type: "approximate", country: "KR", timezone: "Asia/Seoul" },
};

// 사진 인식 결과를 이 도구로 받아요 (strict: 스키마에 꼭 맞는 JSON 이 와요)
const REPORT_TOOL: Anthropic.Beta.BetaTool = {
  name: "report_medicines",
  description: "사진에서 알아낸 약 정보를 앱에 저장할 수 있는 형태로 보고한다. 조사가 끝나면 반드시 한 번 호출한다.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["found", "summary", "medicines"],
    properties: {
      found: { type: "boolean", description: "사진에서 약을 하나라도 알아봤으면 true" },
      summary: { type: "string", description: "보호자에게 보여줄 2~4문장 요약 (한국어)" },
      medicines: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: Object.keys(MEDICINE_FIELDS),
          properties: {
            name: { type: "string", description: MEDICINE_FIELDS.name },
            kind: { type: "string", enum: KINDS },
            purpose: { type: "string", description: MEDICINE_FIELDS.purpose },
            dosage: { type: "string", description: MEDICINE_FIELDS.dosage },
            cautions: { type: "string", description: MEDICINE_FIELDS.cautions },
            storage: { type: "string", enum: STORAGE },
            expiry_date: { type: "string", description: MEDICINE_FIELDS.expiry_date },
            prescribed_date: { type: "string", description: MEDICINE_FIELDS.prescribed_date },
            hospital: { type: "string", description: MEDICINE_FIELDS.hospital },
            open_days: { type: "integer", description: MEDICINE_FIELDS.open_days },
            notes: { type: "string", description: MEDICINE_FIELDS.notes },
            confidence: { type: "string", enum: CONFIDENCE },
          },
        },
      },
    },
  },
};

// 서버 도구(웹 검색)가 길어지면 pause_turn 으로 멈출 수 있어서 이어서 요청해요
async function runClaude(params: {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  tools: Anthropic.Beta.BetaToolUnion[];
}) {
  let messages = params.messages;
  const contents: Anthropic.Beta.BetaContentBlock[] = [];
  let resp: Anthropic.Beta.BetaMessage | undefined;
  for (let i = 0; i < 4; i++) {
    resp = await anthropic().beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      output_config: { effort: "medium" },
      // 안전 분류기가 거절하면 서버에서 다른 모델로 다시 시도해요
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: params.system,
      tools: params.tools,
      messages,
    });
    contents.push(...resp.content);
    if (resp.stop_reason !== "pause_turn") break;
    messages = [...messages, { role: "assistant", content: resp.content }];
  }
  if (resp!.stop_reason === "refusal") throw new AIError(422, "이 내용은 AI가 분석할 수 없어요");
  return contents;
}

function claudeSources(contents: Anthropic.Beta.BetaContentBlock[]): Source[] {
  const seen = new Map<string, string>();
  for (const b of contents) {
    if (b.type === "text") {
      for (const c of b.citations ?? []) {
        if (c.type === "web_search_result_location" && !seen.has(c.url)) seen.set(c.url, c.title ?? c.url);
      }
    }
  }
  if (seen.size < 3) {
    for (const b of contents) {
      if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
        for (const r of b.content) {
          if (seen.size >= 5) break;
          if (r.type === "web_search_result" && !seen.has(r.url)) seen.set(r.url, r.title ?? r.url);
        }
      }
    }
  }
  return [...seen].slice(0, 5).map(([url, title]) => ({ url, title }));
}

const claudeText = (contents: Anthropic.Beta.BetaContentBlock[]) =>
  contents.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("").trim();

async function claudeScan(system: string, image: string, mediaType: string, userText: string) {
  const contents = await runClaude({
    system: system + "\n\n마지막에 report_medicines 도구를 꼭 한 번 호출해요.",
    tools: [WEB_SEARCH, REPORT_TOOL],
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType as "image/jpeg", data: image } },
        { type: "text", text: userText },
      ],
    }],
  });
  const sources = claudeSources(contents);
  const report = contents.find((b) => b.type === "tool_use" && b.name === "report_medicines");
  if (!report || report.type !== "tool_use") {
    return { found: false, summary: claudeText(contents) || "약 정보를 정리하지 못했어요. 다시 찍어볼까요?", medicines: [], sources };
  }
  return { ...normalizeReport(report.input), sources };
}

async function claudeAsk(system: string, history: Array<{ role: "user" | "assistant"; content: string }>) {
  const contents = await runClaude({ system, tools: [WEB_SEARCH], messages: history });
  return { text: claudeText(contents), sources: claudeSources(contents) };
}

// ---------- 요청 처리 ----------
async function scan(body: { image?: string; mediaType?: string; context?: Context; note?: string }) {
  const mediaType = body.mediaType ?? "image/jpeg";
  if (!body.image || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mediaType)) {
    return json({ error: "사진을 읽을 수 없어요" }, 400);
  }
  const system = scanSystem(contextText(body.context));
  const userText = body.note ? `보호자 메모: ${body.note.slice(0, 500)}` : "이 약이 뭔지 알려주세요.";
  const run = PROVIDER === "claude" ? claudeScan : geminiScan;
  return json(await run(system, body.image, mediaType, userText));
}

async function ask(body: { messages?: Array<{ role: string; text: string }>; context?: Context }) {
  const history = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.text === "string" && m.text.trim())
    .slice(-12)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.text.slice(0, 4000) }));
  while (history.length && history[0].role !== "user") history.shift();
  if (!history.length || history[history.length - 1].role !== "user") return json({ error: "질문이 비어 있어요" }, 400);

  const system = askSystem(contextText(body.context));
  const { text, sources } = await (PROVIDER === "claude" ? claudeAsk : geminiAsk)(system, history);
  return json({ text: text || "답을 만들지 못했어요. 다시 물어봐 주세요.", sources });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST 만 돼요" }, 405);

  // 로그인한 사용자만 쓸 수 있어요 (무료 사용량·요금 보호)
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"));
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return json({ error: "로그인이 필요해요" }, 401);

  if ((PROVIDER === "gemini" && !GEMINI_KEY) || (PROVIDER === "claude" && !ANTHROPIC_KEY) || !PROVIDER) {
    return json({ error: "AI 키가 아직 설정되지 않았어요 (docs/SETUP.md 8단계)" }, 503);
  }

  try {
    const body = await req.json();
    if (body.mode === "scan") return await scan(body);
    if (body.mode === "ask") return await ask(body);
    return json({ error: "알 수 없는 요청이에요" }, 400);
  } catch (e) {
    if (e instanceof AIError) return json({ error: e.message }, e.status);
    if (e instanceof Anthropic.AuthenticationError) return json({ error: "ANTHROPIC_API_KEY 설정을 확인해주세요" }, 500);
    if (e instanceof Anthropic.RateLimitError) return json({ error: "AI 요청이 많아요. 잠시 후 다시 해주세요" }, 429);
    if (e instanceof Anthropic.BadRequestError) return json({ error: `요청 오류: ${e.message}` }, 400);
    if (e instanceof Anthropic.APIError) return json({ error: `AI 서버 오류 (${e.status})` }, 502);
    console.error(e);
    return json({ error: "AI 처리 중 문제가 생겼어요" }, 500);
  }
});
