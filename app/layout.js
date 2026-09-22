import "./globals.css";
import { DuzenProvider } from "../components/DuzenBaglam";

export const metadata = {
  title: "Proje Yönetim Sistemi — Örnek Mühendislik (Demo)",
  description: "QC Hub Faz 2",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <DuzenProvider>{children}</DuzenProvider>
      </body>
    </html>
  );
}
