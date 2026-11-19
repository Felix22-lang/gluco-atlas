import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "糖动研库 · 运动与血糖文献工作台",
  description: "糖尿病与糖尿病前期运动干预研究的检索、筛选与结构化数据提取。",
  icons: { icon: "/favicon.svg" },
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
