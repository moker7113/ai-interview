"use client";

import { useEffect, useRef, useState } from "react";
import { getApiKey, openSettings, useApiKey } from "@/lib/api-key";
import {
  API_KEY_HEADER,
  DEFAULT_QUESTIONS,
  MAX_QUESTIONS,
  MIN_QUESTIONS,
  type ChatMessage,
  type Evaluation,
  type InterviewResponse,
} from "@/lib/interview";

type Stage = "setup" | "interview" | "done";

const MAX_JD = 5000;
const MAX_ANSWER = 3000;
const QUESTION_OPTIONS = Array.from(
  { length: MAX_QUESTIONS - MIN_QUESTIONS + 1 },
  (_, i) => MIN_QUESTIONS + i,
);

export default function InterviewPage() {
  const [stage, setStage] = useState<Stage>("setup");
  const [jobDescription, setJobDescription] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(DEFAULT_QUESTIONS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answer, setAnswer] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keyError, setKeyError] = useState(false); // 錯誤是否與 API Key 有關（顯示「前往設定」）
  const apiKey = useApiKey();
  const bottomRef = useRef<HTMLDivElement>(null);

  // 面試中：有新訊息就捲到底；結束時：捲回頁首看報告
  useEffect(() => {
    if (stage === "interview") bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    if (stage === "done") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [messages, loading, stage]);

  async function callInterview(history: ChatMessage[]) {
    setLoading(true);
    setError("");
    setKeyError(false);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // BYOK：每次請求都從 localStorage 取出使用者的 key 帶上
          [API_KEY_HEADER]: getApiKey(),
        },
        body: JSON.stringify({ jobDescription, totalQuestions, messages: history }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) setKeyError(true);
        throw new Error(data.error || "發生錯誤");
      }

      const result = data as InterviewResponse;
      if (result.type === "question") {
        setMessages([...history, { role: "interviewer", content: result.message }]);
        setQuestionNumber(result.questionNumber);
      } else {
        setMessages(history);
        setEvaluation(result.evaluation);
        setStage("done");
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "發生錯誤");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function start() {
    if (!jobDescription.trim() || loading) return;
    if (!getApiKey()) {
      openSettings();
      return;
    }
    setStage("interview");
    setMessages([]);
    const ok = await callInterview([]);
    if (!ok) setStage("setup");
  }

  async function submitAnswer() {
    const text = answer.trim();
    if (!text || loading) return;
    const history: ChatMessage[] = [...messages, { role: "candidate", content: text }];
    setMessages(history);
    setAnswer("");
    const ok = await callInterview(history);
    if (!ok) {
      // 失敗時還原，讓使用者可以重送
      setMessages(messages);
      setAnswer(text);
    }
  }

  // 重新開始：保留職缺描述與題數，方便再練一次
  function reset() {
    setStage("setup");
    setMessages([]);
    setAnswer("");
    setQuestionNumber(0);
    setEvaluation(null);
    setError("");
    setKeyError(false);
  }

  const answered = messages.filter((m) => m.role === "candidate").length;

  return (
    <main className="flex-1">
      {stage === "setup" && (
        <SetupView
          jobDescription={jobDescription}
          setJobDescription={setJobDescription}
          totalQuestions={totalQuestions}
          setTotalQuestions={setTotalQuestions}
          onStart={start}
          loading={loading}
          error={error}
          keyError={keyError}
          hasApiKey={Boolean(apiKey)}
        />
      )}

      {stage === "interview" && (
        <section className="mx-auto flex w-full max-w-3xl flex-col px-5 pt-8">
          {/* 進度列 */}
          <div className="sticky top-16 z-10 -mx-5 border-b border-line bg-paper/90 px-5 py-4 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-mono text-xs tracking-widest text-muted uppercase">模擬面試進行中</div>
                <div className="mt-0.5 font-medium">
                  {questionNumber > 0 ? `第 ${questionNumber} / ${totalQuestions} 題` : "準備中…"}
                </div>
              </div>
              <button
                onClick={reset}
                className="rounded-full border border-line px-3.5 py-1.5 text-sm text-muted transition hover:border-ink hover:text-ink"
              >
                結束並重來
              </button>
            </div>
            <div className="mt-3 flex gap-1.5">
              {Array.from({ length: totalQuestions }, (_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < answered ? "bg-ink" : i === answered ? "bg-accent" : "bg-line"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 對話 */}
          <div className="flex flex-col gap-5 py-8">
            {messages.map((m, i) => (
              <Bubble key={i} message={m} />
            ))}
            {loading && <TypingBubble />}
            <div ref={bottomRef} />
          </div>

          {/* 作答區 */}
          {questionNumber > 0 && (
            <div className="sticky bottom-0 -mx-5 mt-auto bg-gradient-to-t from-paper via-paper to-paper/0 px-5 pt-6 pb-6">
              {error && <ErrorNote message={error} keyError={keyError} />}
              <div className="rounded-2xl border border-line bg-card p-3 shadow-[0_10px_30px_-15px_rgb(23_20_15/0.3)] focus-within:border-ink">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      submitAnswer();
                    }
                  }}
                  rows={3}
                  maxLength={MAX_ANSWER}
                  disabled={loading}
                  aria-label="你的回答"
                  placeholder="輸入你的回答…"
                  className="w-full resize-none bg-transparent px-2 py-1.5 leading-relaxed outline-none placeholder:text-muted/70 disabled:opacity-50"
                />
                <div className="flex items-center justify-between gap-3 px-2 pt-1">
                  <span className="font-mono text-xs text-muted">
                    Ctrl + Enter 送出 · {answer.length}/{MAX_ANSWER}
                  </span>
                  <button
                    onClick={submitAnswer}
                    disabled={!answer.trim() || loading}
                    className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
                  >
                    {answered + 1 >= totalQuestions ? "送出並取得報告" : "送出回答"}
                  </button>
                </div>
              </div>
            </div>
          )}
          {questionNumber === 0 && error && <ErrorNote message={error} keyError={keyError} />}
        </section>
      )}

      {stage === "done" && evaluation && (
        <ReportView evaluation={evaluation} messages={messages} onReset={reset} />
      )}
    </main>
  );
}

/* ─────────────────────────────── 設定畫面 ─────────────────────────────── */

function SetupView(props: {
  jobDescription: string;
  setJobDescription: (v: string) => void;
  totalQuestions: number;
  setTotalQuestions: (v: number) => void;
  onStart: () => void;
  loading: boolean;
  error: string;
  keyError: boolean;
  hasApiKey: boolean;
}) {
  const {
    jobDescription,
    setJobDescription,
    totalQuestions,
    setTotalQuestions,
    onStart,
    loading,
    error,
    keyError,
    hasApiKey,
  } = props;
  return (
    <section className="bg-grid border-b border-line">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 lg:grid-cols-[1fr_1.35fr] lg:py-20">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-accent uppercase">
            <span className="h-px w-6 bg-accent" />
            新的模擬面試
          </span>
          <h1 className="mt-5 font-serif text-4xl leading-tight font-black tracking-tight sm:text-5xl">
            告訴我們，
            <br />
            你想面試哪份工作。
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-muted">
            把職缺描述完整貼上——職稱、職責、技能要求都放進來。描述越完整，面試官的問題就越貼近真實面試。
          </p>
          <ul className="mt-10 space-y-4 text-sm">
            {[
              ["01", "面試官會依職缺需求出題"],
              ["02", "回答不夠具體時，會追問細節"],
              ["03", "結束後取得評分與每題示範回答"],
            ].map(([no, t]) => (
              <li key={no} className="flex items-center gap-4">
                <span className="font-mono text-accent">{no}</span>
                <span className="text-ink-soft">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <form
          className="animate-rise rounded-2xl border border-line bg-card p-6 shadow-[0_30px_60px_-30px_rgb(23_20_15/0.3)] [animation-delay:100ms] sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            onStart();
          }}
        >
          <div className="flex items-baseline justify-between">
            <label htmlFor="jd" className="font-bold">
              職缺描述
            </label>
            <span className="font-mono text-xs text-muted">
              {jobDescription.length}/{MAX_JD}
            </span>
          </div>
          <textarea
            id="jd"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={11}
            maxLength={MAX_JD}
            placeholder={"例如：\n資深前端工程師\n- 使用 React / Next.js 開發產品功能\n- 熟悉 TypeScript，具 3 年以上經驗\n- 重視效能與使用者體驗"}
            className="mt-3 w-full resize-y rounded-xl border border-line bg-paper/60 p-4 leading-relaxed outline-none transition placeholder:text-muted/60 focus:border-ink focus:bg-card"
          />

          <fieldset className="mt-7">
            <legend className="font-bold">題數</legend>
            <p className="mt-1 text-sm text-muted">短練習選 3 題，完整模擬建議 5 題以上。</p>
            <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
              {QUESTION_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setTotalQuestions(n)}
                  aria-pressed={totalQuestions === n}
                  className={`h-10 rounded-lg border font-mono text-sm transition ${
                    totalQuestions === n
                      ? "border-ink bg-ink text-paper"
                      : "border-line bg-card text-ink-soft hover:border-ink"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>

          {/* API Key 狀態 */}
          <div
            className={`mt-7 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
              hasApiKey ? "border-line bg-paper/60" : "border-accent/30 bg-accent-soft"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className={`size-2 shrink-0 rounded-full ${hasApiKey ? "bg-sage" : "bg-accent"}`} />
              {hasApiKey ? "已設定 OpenAI API Key" : "需要你自己的 OpenAI API Key 才能開始"}
            </span>
            <button
              type="button"
              onClick={openSettings}
              className="shrink-0 font-medium text-ink underline underline-offset-2 hover:text-accent"
            >
              {hasApiKey ? "更換" : "前往設定"}
            </button>
          </div>

          {error && (
            <div className="mt-6">
              <ErrorNote message={error} keyError={keyError} />
            </div>
          )}

          <button
            type="submit"
            disabled={!jobDescription.trim() || loading}
            className="group mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 font-medium text-white shadow-[0_8px_24px_-8px_rgb(228_87_46/0.6)] transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-muted disabled:shadow-none"
          >
            {loading ? "面試官準備中…" : `開始 ${totalQuestions} 題模擬面試`}
            {!loading && (
              <span aria-hidden className="transition-transform group-hover:translate-x-1">
                →
              </span>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

/* ─────────────────────────────── 對話元件 ─────────────────────────────── */

function Avatar() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink font-mono text-xs font-medium text-paper">
      AI
    </span>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  if (message.role === "interviewer") {
    return (
      <div className="animate-rise flex items-start gap-3">
        <Avatar />
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-line bg-card px-5 py-3.5 leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="animate-rise ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-ink px-5 py-3.5 leading-relaxed whitespace-pre-wrap text-paper">
      {message.content}
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-start gap-3" aria-live="polite">
      <Avatar />
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-line bg-card px-5 py-4">
        <span className="sr-only">面試官思考中</span>
        <span className="typing-dot size-1.5 rounded-full bg-muted" />
        <span className="typing-dot size-1.5 rounded-full bg-muted [animation-delay:0.2s]" />
        <span className="typing-dot size-1.5 rounded-full bg-muted [animation-delay:0.4s]" />
      </div>
    </div>
  );
}

function ErrorNote({ message, keyError = false }: { message: string; keyError?: boolean }) {
  return (
    <div
      role="alert"
      className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent-deep"
    >
      <span>{message}</span>
      {keyError && (
        <button
          type="button"
          onClick={openSettings}
          className="shrink-0 font-medium text-ink underline underline-offset-2 hover:text-accent"
        >
          前往設定
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────── 面試報告 ─────────────────────────────── */

function scoreLabel(score: number) {
  if (score >= 85) return "表現優異";
  if (score >= 70) return "表現良好";
  if (score >= 55) return "仍有進步空間";
  return "需要加強";
}

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-40 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-line)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={score >= 70 ? "var(--color-sage)" : "var(--color-accent)"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          className="transition-[stroke-dashoffset] duration-1000"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-serif text-5xl font-black">{score}</div>
          <div className="font-mono text-xs text-muted">/ 100</div>
        </div>
      </div>
    </div>
  );
}

function ReportView({
  evaluation,
  messages,
  onReset,
}: {
  evaluation: Evaluation;
  messages: ChatMessage[];
  onReset: () => void;
}) {
  const answers = messages.filter((m) => m.role === "candidate").map((m) => m.content);

  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-14">
      <div className="animate-rise">
        <span className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-accent uppercase">
          <span className="h-px w-6 bg-accent" />
          面試報告
        </span>
        <h1 className="mt-4 font-serif text-4xl font-black tracking-tight sm:text-5xl">你的模擬面試結果</h1>
      </div>

      {/* 總分 */}
      <div className="animate-rise mt-10 flex flex-col items-center gap-8 rounded-2xl border border-line bg-card p-8 sm:flex-row sm:items-center">
        <ScoreRing score={evaluation.score} />
        <div>
          <span
            className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
              evaluation.score >= 70 ? "bg-sage-soft text-sage" : "bg-accent-soft text-accent-deep"
            }`}
          >
            {scoreLabel(evaluation.score)}
          </span>
          <p className="mt-4 text-lg leading-relaxed">{evaluation.summary}</p>
        </div>
      </div>

      {/* 優點 / 改進 */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <ListCard title="表現優點" tone="sage" items={evaluation.strengths} />
        <ListCard title="改進方向" tone="accent" items={evaluation.improvements} />
      </div>

      {/* 逐題回饋 */}
      {evaluation.questions.length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif text-3xl font-black tracking-tight">逐題回饋</h2>
          <p className="mt-2 text-muted">每一題的點評，以及更好的回答方式。</p>
          <div className="mt-8 space-y-6">
            {evaluation.questions.map((q, i) => (
              <article key={i} className="overflow-hidden rounded-2xl border border-line bg-card">
                <header className="flex gap-4 border-b border-line px-6 py-5">
                  <span className="font-mono text-sm text-accent">Q{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-bold leading-snug">{q.question}</h3>
                </header>
                <div className="grid gap-6 p-6 md:grid-cols-2">
                  <div className="space-y-5">
                    {answers[i] && (
                      <div>
                        <div className="font-mono text-xs tracking-widest text-muted uppercase">你的回答</div>
                        <p className="mt-2 leading-relaxed whitespace-pre-wrap text-ink-soft">{answers[i]}</p>
                      </div>
                    )}
                    {q.comment && (
                      <div className="border-l-2 border-accent pl-4">
                        <div className="font-mono text-xs tracking-widest text-muted uppercase">面試官點評</div>
                        <p className="mt-2 leading-relaxed whitespace-pre-wrap">{q.comment}</p>
                      </div>
                    )}
                  </div>
                  {q.betterAnswer && (
                    <div className="rounded-xl bg-sage-soft p-5">
                      <div className="font-mono text-xs tracking-widest text-sage uppercase">較好的回答方式</div>
                      <p className="mt-2 leading-relaxed whitespace-pre-wrap text-ink-soft">{q.betterAnswer}</p>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 完整對話 */}
      <details className="group mt-10 rounded-2xl border border-line bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5 font-medium">
          查看完整對話紀錄
          <span className="text-muted transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="flex flex-col gap-5 border-t border-line p-6">
          {messages.map((m, i) => (
            <Bubble key={i} message={m} />
          ))}
        </div>
      </details>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <button
          onClick={onReset}
          className="rounded-full bg-accent px-6 py-3.5 font-medium text-white shadow-[0_8px_24px_-8px_rgb(228_87_46/0.6)] transition hover:bg-accent-deep"
        >
          再練一場
        </button>
      </div>
    </section>
  );
}

function ListCard({ title, tone, items }: { title: string; tone: "sage" | "accent"; items: string[] }) {
  if (items.length === 0) return null;
  const dot = tone === "sage" ? "bg-sage" : "bg-accent";
  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <h3 className="font-bold">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((s, i) => (
          <li key={i} className="flex gap-3 leading-relaxed">
            <span className={`mt-2.5 size-1.5 shrink-0 rounded-full ${dot}`} />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
