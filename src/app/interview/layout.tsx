import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "模擬面試 — AI Interview",
  description: "貼上職缺描述，開始與 AI 面試官進行模擬面試。",
};

export default function InterviewLayout({ children }: LayoutProps<"/interview">) {
  return children;
}
