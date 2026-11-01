/**
 * BYOK（Bring Your Own Key）：使用者自己的 OpenAI API Key 存在瀏覽器 localStorage。
 * 只能在 client component 中使用。
 */
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ai-interview:openai-api-key";
const CHANGE_EVENT = "ai-interview:api-key-change";
const OPEN_SETTINGS_EVENT = "ai-interview:open-settings";

/** 讀取 key；localStorage 可能被瀏覽器封鎖（無痕模式等），所以包 try/catch */
export function getApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

/** 儲存 key（傳空字串 = 清除），並通知所有使用中的元件更新 */
export function setApiKey(value: string) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 無法寫入時忽略，畫面會照常顯示「未設定」
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback); // 其他分頁修改時同步
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** React hook：取得目前的 key，key 變動時自動重新渲染。伺服器端渲染時視為空字串。 */
export function useApiKey(): string {
  return useSyncExternalStore(subscribe, getApiKey, () => "");
}

/** 遮罩顯示，例如 sk-proj-…a1B2 */
export function maskApiKey(key: string): string {
  if (key.length <= 12) return "••••";
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

/** 從任何地方打開設定視窗 */
export function openSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}

export function onOpenSettings(callback: () => void) {
  window.addEventListener(OPEN_SETTINGS_EVENT, callback);
  return () => window.removeEventListener(OPEN_SETTINGS_EVENT, callback);
}
