import Link from "next/link";
import type { ReactNode } from "react";

/* ─────────────────────────────── 小元件 ─────────────────────────────── */

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-accent uppercase">
      <span className="h-px w-6 bg-accent" />
      {children}
    </span>
  );
}

function PrimaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-[15px] font-medium text-white shadow-[0_8px_24px_-8px_rgb(228_87_46/0.6)] transition hover:bg-accent-deep"
    >
      {children}
      <span aria-hidden className="transition-transform group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}

/* ─────────────────────────────── 資料 ─────────────────────────────── */

const ROLES = [
  "前端工程師",
  "後端工程師",
  "產品經理",
  "UI/UX 設計師",
  "資料分析師",
  "專案經理",
  "行銷企劃",
  "業務開發",
];

const FEATURES = [
  {
    no: "01",
    title: "依職缺客製出題",
    body: "貼上真實的職缺描述，面試官會讀懂技能要求與職責，問出與這份工作真正相關的問題，而不是通用題庫。",
  },
  {
    no: "02",
    title: "會追問的面試官",
    body: "回答太籠統？面試官會針對你的回答深挖細節，就像真實面試一樣，逼你把經驗講具體。",
  },
  {
    no: "03",
    title: "評分與具體建議",
    body: "面試結束立即取得 0–100 分的整體評分、表現優點，以及可以馬上改進的方向。",
  },
  {
    no: "04",
    title: "每題都有示範回答",
    body: "逐題拆解：點評你的回答，並用 STAR 等架構示範更好的答法——而且是延伸你自己的經驗來寫。",
  },
];

const STEPS = [
  { title: "貼上職缺描述", body: "從求職網站複製職缺內容，並選擇想練習的題數（1–10 題）。" },
  { title: "與 AI 面試官對話", body: "一題一題作答，面試官會回應你的答案、追問或換新題目。" },
  { title: "取得面試報告", body: "查看總分、優缺點，以及每一題的點評與示範回答。" },
];

const FAQ = [
  {
    q: "需要註冊帳號嗎？",
    a: "不需要。設定好你的 OpenAI API Key、貼上職缺描述，就可以直接開始模擬面試。",
  },
  {
    q: "為什麼需要自己的 OpenAI API Key？",
    a: "本服務採用 BYOK（Bring Your Own Key）模式：AI 面試官使用你自己的 OpenAI API Key 呼叫模型，費用直接由你的 OpenAI 帳戶支付。點右上角「API Key」即可設定，可到 platform.openai.com/api-keys 建立。",
  },
  {
    q: "我的 API Key 和回答會被保存嗎？",
    a: "API Key 只儲存在你瀏覽器的 localStorage，每次請求時附上，伺服器僅用來轉送給 OpenAI，不會儲存或記錄。面試對話只存在你的瀏覽器分頁中，關閉或重新開始就會清除。",
  },
  {
    q: "可以練習哪些職位？",
    a: "任何職位都可以。面試官會根據你貼上的職缺描述出題，描述寫得越完整，題目就越貼近實際面試。",
  },
  {
    q: "評分準確嗎？",
    a: "評分與建議由 AI 根據你的回答產生，適合作為練習時的參考，幫助你找出可以加強的地方，但不代表任何公司的實際評估標準。",
  },
];

/* ─────────────────────────────── 頁面 ─────────────────────────────── */

export default function LandingPage() {
  return (
    <main>
      {/* ── Hero ── */}
      <section className="bg-grid relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute -top-40 right-[-10%] size-[520px] rounded-full bg-accent/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pt-16 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-24 lg:pb-28">
          <div className="animate-rise">
            <Eyebrow>AI 模擬面試</Eyebrow>
            <h1 className="mt-6 font-serif text-5xl leading-[1.15] font-black tracking-tight text-balance sm:text-6xl lg:text-7xl">
              面試之前，
              <br />
              先跟 AI <span className="relative whitespace-nowrap text-accent">練一場
                <svg
                  viewBox="0 0 200 12"
                  className="absolute -bottom-2 left-0 w-full text-accent/40"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path d="M2 9 Q 50 2, 100 7 T 198 5" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              。
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
              貼上你想應徵的職缺描述，AI 面試官會依職務需求出題、針對你的回答追問，
              結束後給你評分，以及<strong className="font-medium text-ink">每一題的示範回答</strong>。
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <PrimaryButton href="/interview">立即開始模擬面試</PrimaryButton>
              <Link
                href="#how"
                className="rounded-full px-5 py-3.5 text-[15px] font-medium text-ink underline-offset-4 hover:underline"
              >
                看看怎麼運作
              </Link>
            </div>
            <p className="mt-6 font-mono text-xs text-muted">無需註冊 · 使用你自己的 OpenAI API Key · 1–10 題自由選擇</p>
          </div>

          {/* Hero 右側：產品畫面示意 */}
          <div className="animate-rise relative [animation-delay:120ms]" aria-hidden>
            <div className="rotate-1 rounded-2xl border border-line bg-card p-5 shadow-[0_30px_60px_-30px_rgb(23_20_15/0.35)]">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="font-mono text-xs text-muted">前端工程師 · 第 2 / 3 題</span>
                <span className="flex gap-1">
                  <span className="h-1.5 w-6 rounded-full bg-ink" />
                  <span className="h-1.5 w-6 rounded-full bg-accent" />
                  <span className="h-1.5 w-6 rounded-full bg-line" />
                </span>
              </div>
              <div className="mt-4 space-y-3 text-[14px] leading-relaxed">
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-paper px-4 py-3">
                  你提到把首屏時間降低了 40%。能具體說說你量測了哪些指標、做了哪些取捨嗎？
                </div>
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-ink px-4 py-3 text-paper">
                  我們用 Lighthouse 追蹤 LCP，把首頁改成 Server Components……
                </div>
                <div className="flex w-fit gap-1 rounded-2xl rounded-tl-sm bg-paper px-4 py-3.5">
                  <span className="typing-dot size-1.5 rounded-full bg-muted" />
                  <span className="typing-dot size-1.5 rounded-full bg-muted [animation-delay:0.2s]" />
                  <span className="typing-dot size-1.5 rounded-full bg-muted [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-10 -left-4 w-56 -rotate-3 rounded-2xl border border-line bg-card p-4 shadow-[0_20px_40px_-20px_rgb(23_20_15/0.4)] sm:-left-10">
              <div className="font-mono text-[11px] tracking-widest text-muted uppercase">面試評分</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-serif text-4xl font-black">82</span>
                <span className="text-sm text-muted">/ 100</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper">
                <div className="h-full w-[82%] rounded-full bg-sage" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 適用職位 ── */}
      <section className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 md:flex-row md:items-center md:gap-8">
          <span className="shrink-0 font-mono text-xs tracking-widest text-muted uppercase">適用任何職位</span>
          <ul className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <li key={r} className="rounded-full border border-line px-3.5 py-1.5 text-sm text-ink-soft">
                {r}
              </li>
            ))}
            <li className="rounded-full px-1 py-1.5 text-sm text-muted">……</li>
          </ul>
        </div>
      </section>

      {/* ── 功能 ── */}
      <section id="features" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div className="max-w-2xl">
            <Eyebrow>功能</Eyebrow>
            <h2 className="mt-5 font-serif text-4xl leading-tight font-black tracking-tight sm:text-5xl">
              不是題庫，
              <br />
              是一位真的會聽你說話的面試官。
            </h2>
          </div>
          <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {FEATURES.map((f) => (
              <article key={f.no} className="group bg-card p-8 transition-colors hover:bg-paper sm:p-10">
                <span className="font-mono text-sm text-accent">{f.no}</span>
                <h3 className="mt-4 text-xl font-bold tracking-tight">{f.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 使用流程 ── */}
      <section id="how" className="scroll-mt-16 border-y border-line bg-card">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Eyebrow>使用流程</Eyebrow>
          <h2 className="mt-5 font-serif text-4xl font-black tracking-tight sm:text-5xl">三個步驟，練完一場面試。</h2>
          <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-ink font-serif text-xl font-black">
                    {i + 1}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span className="hidden h-px flex-1 border-t-2 border-dashed border-line md:block" />
                  )}
                </div>
                <h3 className="mt-6 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 面試報告預覽 ── */}
      <section id="report" className="scroll-mt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-24 lg:grid-cols-2">
          <div>
            <Eyebrow>面試報告</Eyebrow>
            <h2 className="mt-5 font-serif text-4xl leading-tight font-black tracking-tight sm:text-5xl">
              知道哪裡不好，
              <br />
              更知道怎麼答更好。
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              每一題都會拆解：你答了什麼、面試官怎麼看、以及一段可以直接參考的示範回答。
              下次遇到類似的問題，你已經準備好了。
            </p>
            <ul className="mt-8 space-y-3">
              {["0–100 整體評分與總評", "表現優點與改進方向", "逐題點評 + 示範回答"].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="grid size-5 place-items-center rounded-full bg-sage text-[11px] text-white">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* 報告卡片示意 */}
          <div className="rounded-2xl border border-line bg-card p-6 shadow-[0_30px_60px_-30px_rgb(23_20_15/0.3)] sm:p-8" aria-hidden>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-xs tracking-widest text-muted uppercase">第 2 題</div>
                <div className="mt-2 font-bold">重構過程中遇到最大的挑戰是什麼？</div>
              </div>
              <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 font-mono text-xs text-accent-deep">可加強</span>
            </div>
            <div className="mt-5 border-l-2 border-line pl-4 text-sm leading-relaxed text-muted">
              回答點出了問題，但缺少你的具體行動與結果，面試官難以判斷你的貢獻。
            </div>
            <div className="mt-5 rounded-xl bg-sage-soft p-5">
              <div className="font-mono text-xs tracking-widest text-sage uppercase">示範回答 · STAR</div>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                「重構時最大的挑戰是 SSR 與客戶端資料不一致（S/T）。我先建立重現案例，
                再把資料取得統一移到 Server Components（A），上線後水合錯誤歸零，LCP 也改善了 40%（R）。」
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="scroll-mt-16 border-t border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <Eyebrow>常見問題</Eyebrow>
            <h2 className="mt-5 font-serif text-4xl font-black tracking-tight sm:text-5xl">還有疑問？</h2>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium">
                  {item.q}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-5 py-20">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-ink px-8 py-16 text-center text-paper sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute -bottom-32 left-1/2 size-[480px] -translate-x-1/2 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative">
            <h2 className="font-serif text-4xl leading-tight font-black tracking-tight text-balance sm:text-5xl">
              下一場面試，從這裡開始準備。
            </h2>
            <p className="mx-auto mt-5 max-w-md text-paper/70">只需要一份職缺描述，五分鐘就能練完一場。</p>
            <div className="mt-10">
              <PrimaryButton href="/interview">開始模擬面試</PrimaryButton>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
