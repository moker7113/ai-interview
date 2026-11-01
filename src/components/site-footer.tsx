import Link from "next/link";
import { Logo } from "./logo";

const COLUMNS = [
  {
    title: "產品",
    links: [
      { href: "/interview", label: "開始模擬面試" },
      { href: "/#features", label: "功能介紹" },
      { href: "/#report", label: "面試報告" },
    ],
  },
  {
    title: "資源",
    links: [
      { href: "/#how", label: "使用流程" },
      { href: "/#faq", label: "常見問題" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-xs">
          <Logo inverted />
          <p className="mt-4 text-sm leading-relaxed text-paper/60">
            依你的目標職缺客製出題、會追問的 AI 面試官。在真正的面試之前，先好好練一場。
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="font-mono text-xs tracking-widest text-paper/40 uppercase">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-paper/75 transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-paper/40 sm:flex-row sm:justify-between">
          <span>© AI Interview</span>
          <span>面試回饋由 AI 生成，僅供練習參考。</span>
        </div>
      </div>
    </footer>
  );
}
