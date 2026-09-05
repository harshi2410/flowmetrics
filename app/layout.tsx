import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flowmetrics — Team Productivity & Workload Analytics",
  description:
    "Flowmetrics gives managers a clear view of workload, project progress, and team capacity — all in one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme) {
                  document.documentElement.setAttribute('data-theme', savedTheme);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-ink font-sans text-text">
        {children}
      </body>
    </html>
  );
}
