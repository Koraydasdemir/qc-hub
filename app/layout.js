import "./globals.css";

export const metadata = {
  title: "Proje Yönetim Sistemi — TECHMP",
  description: "QC Hub Faz 2",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
