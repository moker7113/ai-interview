/**
 * /api/interview — AI 面試官 API（Next.js App Router 的 Route Handler）
 *
 * 檔案位置 src/app/api/interview/route.ts 會自動對應到網址 /api/interview。
 * 這裡匯出名為 POST 的函式，代表這個網址只接受 POST 請求。
 *
 * BYOK（Bring Your Own Key）：
 *   不使用伺服器的環境變數，而是由使用者在前端設定自己的 OpenAI API Key，
 *   每次請求透過 header「x-openai-key」帶過來。伺服器只拿它呼叫 OpenAI，不儲存、不記錄。
 *
 * 設計重點：這個 API 是「無狀態」的（stateless）。
 *   伺服器不記任何面試進度，前端每次都把「職缺描述 + 題數 + 完整對話紀錄」整包送來，
 *   伺服器根據「候選人已經回答幾題」來決定這一輪要做什麼：
 *     - 已回答 0 題            → 打招呼並出第 1 題
 *     - 已回答 1 ~ (總題數-1) 題 → 回應上一題，並出下一題（可能是追問）
 *     - 已回答 = 總題數         → 給出總評分、建議與逐題回饋
 */

// OpenAI 官方 SDK，用來呼叫 ChatGPT 模型
import OpenAI from "openai";
// 從共用檔匯入題數上下限與型別（前後端共用同一份定義，避免兩邊對不上）
import {
  API_KEY_HEADER,
  MAX_QUESTIONS,
  MIN_QUESTIONS,
  type ChatMessage,
  type Evaluation,
  type InterviewResponse,
} from "@/lib/interview";

// 使用的模型：優先讀環境變數 OPENAI_MODEL，沒設定就用 gpt-4o-mini
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
// 職缺描述的最大長度（避免被塞超長內容，浪費 token / 費用）
const MAX_JD_LENGTH = 5000;
// 每則對話訊息的最大長度
const MAX_ANSWER_LENGTH = 3000;

/**
 * 檢查前端送來的 messages 是否為合法的對話紀錄。
 *
 * 回傳型別寫成 `value is ChatMessage[]` 是 TypeScript 的「型別守衛」：
 * 只要這個函式回傳 true，之後 TypeScript 就會把 value 當成 ChatMessage[] 使用。
 */
function isValidMessages(value: unknown): value is ChatMessage[] {
  return (
    // 必須是陣列
    Array.isArray(value) &&
    // 陣列中每一筆都要符合格式
    value.every(
      (m) =>
        m && // 不可為 null / undefined
        (m.role === "interviewer" || m.role === "candidate") && // 角色只能是面試官或候選人
        typeof m.content === "string" && // 內容必須是字串
        m.content.length <= MAX_ANSWER_LENGTH, // 內容不能太長
    )
  );
}

/**
 * 產生給模型的 system prompt（系統指令）。
 * system prompt 用來告訴模型「你是誰、現在要做什麼、輸出什麼格式」。
 *
 * @param jobDescription 職缺描述
 * @param total          這場面試的總題數
 * @param answered       候選人目前已經回答的題數
 */
function systemPrompt(jobDescription: string, total: number, answered: number): string {
  // 共同開頭：設定面試官角色、語言、職缺內容與總題數（每個階段都需要）
  const base = `你是一位專業且友善的面試官，正在針對以下職缺進行模擬面試。請一律使用繁體中文。

【職缺描述】
${jobDescription}

面試共 ${total} 題。`;

  // 情況一：所有題目都答完了 → 要求模型輸出評分、建議、逐題回饋
  if (answered >= total) {
    return `${base}
候選人已回答完全部 ${total} 題。請根據整場面試的對話內容，給出評分與建議，並針對每一題提供點評與「較好的回答方式」。
「較好的回答方式」請說明回答的架構（例如 STAR 法則）與應涵蓋的重點，並附上一段可參考的示範回答；示範回答要貼合職缺需求，並盡量延伸候選人原本提到的經驗。
只輸出 JSON，格式如下：
{"score": 0-100 的整數, "summary": "整體評語（2-3 句）", "strengths": ["優點1", "優點2"], "improvements": ["具體改進建議1", "具體改進建議2"], "questions": [{"question": "第 1 題題目（精簡）", "comment": "對該題回答的點評", "betterAnswer": "較好的回答方式與示範回答"}]}
questions 陣列必須剛好 ${total} 個元素，依題目順序排列。`;
  }

  // 情況二：面試剛開始（一題都還沒答）→ 打招呼並出第 1 題
  if (answered === 0) {
    return `${base}
現在請開始面試：先用一句話簡短打招呼，然後提出第 1 題。題目要與職缺需求高度相關。
只輸出 JSON：{"message": "你要對候選人說的話"}`;
  }

  // 情況三：面試進行中 → 簡短回應上一題，再出下一題（可以是追問，也可以是新題目）
  return `${base}
候選人剛回答了第 ${answered} 題。請先用一句話簡短回應他的回答，然後提出第 ${answered + 1} 題。
如果上一個回答不夠具體或有值得深挖之處，第 ${answered + 1} 題可以是針對該回答的追問；否則請換一個與職缺相關的新面向出題。
不要在此時給出評分。只輸出 JSON：{"message": "你要對候選人說的話"}`;
}

/**
 * POST /api/interview 的處理函式。
 *
 * 請求 body（JSON）：
 *   { jobDescription: string, totalQuestions: number, messages: ChatMessage[] }
 *
 * 回應（JSON），兩種之一：
 *   { type: "question",   message: string, questionNumber: number }  → 面試官出題
 *   { type: "evaluation", evaluation: Evaluation }                   → 面試結束的評分
 *   失敗時回 { error: string } 並帶對應的 HTTP 狀態碼
 */
export async function POST(req: Request) {
  // ── 步驟 1：從 header 取得使用者自己的 OpenAI API Key（BYOK）────────
  // 不讀取伺服器環境變數；沒帶 key 就直接拒絕
  const apiKey = req.headers.get(API_KEY_HEADER)?.trim() ?? "";
  if (!apiKey) {
    // 401 = 缺少驗證資訊，前端會提示使用者到「設定」輸入 API Key
    return Response.json(
      { error: "請先在「設定」中輸入你的 OpenAI API Key", code: "missing_api_key" },
      { status: 401 },
    );
  }
  // 基本格式檢查：OpenAI key 以 sk- 開頭、不含空白、長度合理
  if (!apiKey.startsWith("sk-") || /\s/.test(apiKey) || apiKey.length > 300) {
    return Response.json(
      { error: "API Key 格式不正確，請到「設定」重新輸入", code: "invalid_api_key" },
      { status: 401 },
    );
  }

  // ── 步驟 2：解析請求的 JSON body ────────────────────────────────
  let body: unknown; // 先用 unknown，因為外部送來的資料不能直接信任
  try {
    body = await req.json();
  } catch {
    // body 不是合法 JSON → 400 = 使用者請求格式錯誤
    return Response.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  // ── 步驟 3：驗證每個欄位（前端雖然有限制，但後端一定要再檢查一次）──
  // 從 body 取出三個欄位；body 若是 null 就用空物件，避免解構時報錯
  const { jobDescription, messages, totalQuestions } = (body ?? {}) as Record<string, unknown>;

  // 題數：必須是整數，且介於上下限之間
  if (
    typeof totalQuestions !== "number" ||
    !Number.isInteger(totalQuestions) ||
    totalQuestions < MIN_QUESTIONS ||
    totalQuestions > MAX_QUESTIONS
  ) {
    return Response.json(
      { error: `題數需介於 ${MIN_QUESTIONS} 到 ${MAX_QUESTIONS} 之間` },
      { status: 400 },
    );
  }
  // 職缺描述：必須是字串，且去掉空白後不能是空的
  if (typeof jobDescription !== "string" || !jobDescription.trim()) {
    return Response.json({ error: "請提供職缺描述" }, { status: 400 });
  }
  // 職缺描述：不能超過長度上限
  if (jobDescription.length > MAX_JD_LENGTH) {
    return Response.json({ error: `職缺描述請勿超過 ${MAX_JD_LENGTH} 字` }, { status: 400 });
  }
  // 對話紀錄：用上面的型別守衛檢查格式
  if (!isValidMessages(messages)) {
    return Response.json({ error: "對話紀錄格式錯誤" }, { status: 400 });
  }

  // ── 步驟 4：判斷面試進度 ───────────────────────────────────────
  // 「候選人的訊息數量」就等於「已回答的題數」，這是整個流程的核心判斷依據
  const answered = messages.filter((m) => m.role === "candidate").length;
  // 回答數超過總題數，代表面試早就結束了，不該再呼叫
  if (answered > totalQuestions) {
    return Response.json({ error: "面試已結束" }, { status: 400 });
  }

  // 用使用者的 key 建立 OpenAI 客戶端（明確傳入 apiKey，不會讀取環境變數）
  const client = new OpenAI({ apiKey });

  try {
    // ── 步驟 5：呼叫 OpenAI Chat Completions API ──────────────────
    const completion = await client.chat.completions.create({
      model: MODEL,
      // JSON 模式：強制模型輸出合法 JSON，方便下面直接 JSON.parse
      response_format: { type: "json_object" },
      // 溫度 0.7：保留一些變化，讓每次出題不會一模一樣
      temperature: 0.7,
      messages: [
        // 第一則：依目前進度產生的系統指令
        {
          role: "system",
          content: systemPrompt(jobDescription.trim(), totalQuestions, answered),
        },
        // 接著放入完整對話紀錄，讓模型知道之前問過什麼、候選人答了什麼。
        // 需要把我們自訂的角色名稱轉成 OpenAI 的角色：
        //   interviewer（面試官 = 模型自己說過的話）→ "assistant"
        //   candidate  （候選人 = 使用者）          → "user"
        // `as const` 讓 TypeScript 把它當成字面值型別，符合 SDK 的型別要求
        ...messages.map((m) => ({
          role: m.role === "interviewer" ? ("assistant" as const) : ("user" as const),
          content: m.content,
        })),
      ],
    });

    // ── 步驟 6：解析模型的回應 ─────────────────────────────────────
    // 取第一個候選回覆的文字內容；若意外沒有內容，就當作空物件 "{}"
    const raw = completion.choices[0]?.message?.content ?? "{}";
    // 轉成 JS 物件（如果不是合法 JSON 會丟錯，由下面 catch 統一處理）
    const data = JSON.parse(raw);

    // 宣告最後要回傳給前端的結果
    let result: InterviewResponse;

    if (answered >= totalQuestions) {
      // ── 情況 A：面試結束 → 整理評分結果 ──
      // 模型的輸出不一定完全照格式，所以每個欄位都做「防呆轉換」：
      const evaluation: Evaluation = {
        // 分數：轉數字 → 四捨五入 → 限制在 0~100；轉不出數字就當 0
        score: Math.max(0, Math.min(100, Math.round(Number(data.score) || 0))),
        // 總評：轉成字串，沒有就給空字串
        summary: String(data.summary ?? ""),
        // 優點 / 改進建議：必須是陣列，且每個元素都轉成字串；不是陣列就給空陣列
        strengths: Array.isArray(data.strengths) ? data.strengths.map(String) : [],
        improvements: Array.isArray(data.improvements) ? data.improvements.map(String) : [],
        // 逐題回饋：每一題整理成 { question, comment, betterAnswer }
        questions: Array.isArray(data.questions)
          ? data.questions.map((q: Record<string, unknown>) => ({
              question: String(q?.question ?? ""),
              comment: String(q?.comment ?? ""),
              betterAnswer: String(q?.betterAnswer ?? ""),
            }))
          : [],
      };
      result = { type: "evaluation", evaluation };
    } else {
      // ── 情況 B：面試進行中 → 回傳下一題 ──
      // 模型必須回傳非空的 message，否則視為失敗
      if (typeof data.message !== "string" || !data.message.trim()) {
        throw new Error("模型回應缺少 message");
      }
      // questionNumber = 已回答數 + 1，前端用來顯示「第 N / 總數 題」
      result = { type: "question", message: data.message, questionNumber: answered + 1 };
    }

    // ── 步驟 7：回傳結果給前端 ─────────────────────────────────────
    return Response.json(result);
  } catch (err) {
    // OpenAI 回傳的錯誤：依狀態碼給使用者看得懂的訊息
    if (err instanceof OpenAI.APIError) {
      if (err.status === 401) {
        return Response.json(
          { error: "OpenAI 拒絕了這組 API Key，請確認後到「設定」重新輸入", code: "invalid_api_key" },
          { status: 401 },
        );
      }
      if (err.status === 429) {
        return Response.json(
          { error: "你的 OpenAI 帳戶已達速率限制或額度不足，請稍後再試或檢查帳戶餘額" },
          { status: 429 },
        );
      }
      if (err.status === 403 || err.status === 404) {
        return Response.json(
          { error: `你的 API Key 無法使用模型 ${MODEL}，請確認帳戶權限` },
          { status: 403 },
        );
      }
    }
    // 其他錯誤（網路、模型回應格式錯誤等）。
    // 只記錄錯誤類型與訊息，不記錄整個物件，避免任何請求資訊（含 key）出現在 log。
    console.error("[/api/interview]", err instanceof Error ? err.message : "unknown error");
    // 502 = 上游服務（OpenAI）出問題
    return Response.json({ error: "AI 面試官暫時無法回應，請稍後再試" }, { status: 502 });
  }
}
