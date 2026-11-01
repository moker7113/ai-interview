import Link from "next/link";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="AI Interview 首頁">
      <span
        className={`relative grid size-8 place-items-center rounded-lg ${
          inverted ? "bg-paper text-ink" : "bg-ink text-paper"
        }`}
      >
        {/* 對話框造型的標誌 */}
        <svg viewBox="0 0 24 24" className="size-4.5" fill="none" aria-hidden>
          <path
            d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4 4v-4h0.5A2.5 2.5 0 0 1 5 12.5v-6Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-accent ring-2 ring-paper transition-transform group-hover:scale-125" />
      </span>
      <span className={`text-[15px] font-semibold tracking-tight ${inverted ? "text-paper" : "text-ink"}`}>
        AI Interview
      </span>
    </Link>
  );
}
