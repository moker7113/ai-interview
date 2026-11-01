"use client";

import { useEffect, useRef, useState } from "react";
import { maskApiKey, onOpenSettings, setApiKey, useApiKey, openSettings } from "@/lib/api-key";

/** Header 上的「API Key」按鈕，顯示目前是否已設定 */
export function SettingsButton() {
  const apiKey = useApiKey();
  return (
    <button
      type="button"
      onClick={openSettings}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-2 text-sm text-ink-soft transition hover:border-ink"
      aria-label={apiKey ? "設定 API Key（已設定）" : "設定 API Key（尚未設定）"}
    >
      <span className={`size-2 rounded-full ${apiKey ? "bg-sage" : "bg-accent"}`} />
      <span className="hidden sm:inline">API Key</span>
      <svg viewBox="0 0 24 24" className="size-4 sm:hidden" fill="none" aria-hidden>
        <circle cx="8" cy="15" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="m11 12 8-8m-3 3 2 2m-4 0 1.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/** 全站共用的設定視窗（掛在 layout），透過 openSettings() 開啟 */
export function SettingsDialog() {
  const apiKey = useApiKey();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    () =>
      onOpenSettings(() => {
        setDraft("");
        setReveal(false);
        setError("");
        dialogRef.current?.showModal();
      }),
    [],
  );

  function close() {
    dialogRef.current?.close();
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const value = draft.trim();
    if (!value.startsWith("sk-") || value.length < 20 || /\s/.test(value)) {
      setError("格式看起來不正確，OpenAI API Key 通常以 sk- 開頭。");
      return;
    }
    setApiKey(value);
    close();
  }

  function clear() {
    setApiKey("");
    setDraft("");
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="settings-title"
      // 點背景（dialog 本身）關閉
      onClick={(e) => e.target === dialogRef.current && close()}
      className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-line bg-card p-0 text-ink shadow-[0_40px_80px_-30px_rgb(23_20_15/0.5)] backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={save} className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-xs tracking-[0.2em] text-accent uppercase">設定</span>
            <h2 id="settings-title" className="mt-2 font-serif text-2xl font-black tracking-tight">
              OpenAI API Key
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="關閉"
            className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-paper hover:text-ink"
          >
            ✕
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-muted">
          本服務使用你自己的 OpenAI API Key 呼叫模型，費用由你的 OpenAI 帳戶支付。可以到{" "}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noreferrer"
            className="text-ink underline underline-offset-2 hover:text-accent"
          >
            platform.openai.com/api-keys
          </a>{" "}
          建立。
        </p>

        {/* 目前狀態 */}
        <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-line bg-paper/60 px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm">
            <span className={`size-2 rounded-full ${apiKey ? "bg-sage" : "bg-accent"}`} />
            {apiKey ? (
              <span>
                已設定 <code className="font-mono text-muted">{maskApiKey(apiKey)}</code>
              </span>
            ) : (
              <span className="text-muted">尚未設定</span>
            )}
          </div>
          {apiKey && (
            <button type="button" onClick={clear} className="text-sm text-accent-deep hover:underline">
              清除
            </button>
          )}
        </div>

        <label htmlFor="api-key" className="mt-6 block text-sm font-bold">
          {apiKey ? "更換 API Key" : "輸入 API Key"}
        </label>
        <div className="mt-2 flex items-center rounded-xl border border-line bg-card focus-within:border-ink">
          <input
            id="api-key"
            type={reveal ? "text" : "password"}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError("");
            }}
            placeholder="sk-..."
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent px-4 py-3 font-mono text-sm outline-none placeholder:text-muted/60"
          />
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="px-4 text-sm text-muted hover:text-ink"
          >
            {reveal ? "隱藏" : "顯示"}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm text-accent-deep">
            {error}
          </p>
        )}

        <ul className="mt-5 space-y-1.5 text-xs leading-relaxed text-muted">
          <li>· Key 只儲存在這個瀏覽器的 localStorage，不會存到我們的伺服器。</li>
          <li>· 每次面試請求時會附在請求中，伺服器僅用來轉送給 OpenAI。</li>
          <li>· 在公用電腦上使用後，記得按「清除」。</li>
        </ul>

        <div className="mt-7 flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="rounded-full px-5 py-2.5 text-sm text-muted transition hover:text-ink"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!draft.trim()}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
          >
            儲存
          </button>
        </div>
      </form>
    </dialog>
  );
}
