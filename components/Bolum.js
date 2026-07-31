"use client";
import { useEffect, useState } from "react";
import { useDuzenMod } from "./DuzenBaglam";

const GENISLIK_SECENEKLERI = [
  { v: "", ad: "Tam (100%)" },
  { v: "75%", ad: "Geniş (75%)" },
  { v: "60%", ad: "Orta (60%)" },
  { v: "40%", ad: "Dar (40%)" },
];

// Herhangi bir sayfadaki bir "bölüm"ü sarmalayan bileşen.
// admin + editMod açıkken üstte küçük bir düzenleme araç çubuğu gösterir:
// ▲ yukarı taşı, ▼ aşağı taşı, 👁 gizle/göster, emoji kutusu, renk kutusu, genişlik seçici, 💾 Kaydet.
// Props:
//  - bolumKey (layout_settings.bolum_key ile eşleşir)
//  - ayar: { sira, gizli, emoji, renk, genislik } (useDuzen'den ayarlar[bolumKey])
//  - admin: boolean
//  - baslik: varsayılan başlık metni
//  - onTasiYukari / onTasiAsagi / onGizleGoster : anında uygulanan callback'ler
//  - onKaydet(alanlar): { emoji, renk, genislik } — "Kaydet" butonuna basınca tek seferde çağrılır
//  - ilkMi / sonMu: taşıma oklarını disable etmek için
//  - children: bölümün asıl içeriği
export default function Bolum({
  bolumKey, ayar, admin, baslik, onTasiYukari, onTasiAsagi, onGizleGoster, onKaydet,
  ilkMi, sonMu, children,
}) {
  const { editMod } = useDuzenMod();
  const gizli = !!ayar?.gizli;
  const renk = ayar?.renk || null;
  const genislik = ayar?.genislik || "";

  const [taslakEmoji, setTaslakEmoji] = useState(ayar?.emoji || "");
  const [taslakRenk, setTaslakRenk] = useState(renk || "#cccccc");
  const [taslakGenislik, setTaslakGenislik] = useState(genislik);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    setTaslakEmoji(ayar?.emoji || "");
    setTaslakRenk(ayar?.renk || "#cccccc");
    setTaslakGenislik(ayar?.genislik || "");
  }, [ayar?.emoji, ayar?.renk, ayar?.genislik]);

  const degisiklikVar =
    taslakEmoji !== (ayar?.emoji || "") ||
    taslakRenk !== (ayar?.renk || "#cccccc") ||
    taslakGenislik !== (ayar?.genislik || "");

  if (gizli && !(editMod && admin)) return null;

  const gosterAracCubugu = editMod && admin;

  async function kaydet() {
    setKaydediliyor(true);
    await onKaydet({ emoji: taslakEmoji || null, renk: taslakRenk === "#cccccc" ? null : taslakRenk, genislik: taslakGenislik || null });
    setKaydediliyor(false);
  }

  return (
    <div
      style={{
        width: genislik || "100%",
        margin: genislik ? "0 auto" : undefined,
        border: renk ? `2px solid ${renk}` : undefined,
        borderRadius: renk ? 10 : undefined,
        padding: renk ? 8 : undefined,
        opacity: gizli ? 0.45 : 1,
        outline: gizli ? "2px dashed #999" : "none",
        position: "relative",
      }}
      data-bolum={bolumKey}
    >
      {gosterAracCubugu && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
            background: "#f3f3f3", border: "1px solid #ddd", borderRadius: 8,
            padding: "5px 8px", marginBottom: 6, fontSize: 12,
          }}
        >
          <span style={{ fontWeight: 600, color: "#555" }}>🛠 {baslik || bolumKey}{gizli ? " (gizli)" : ""}</span>
          <button type="button" onClick={onTasiYukari} disabled={ilkMi}
            style={{ cursor: ilkMi ? "default" : "pointer", opacity: ilkMi ? 0.35 : 1 }}>▲</button>
          <button type="button" onClick={onTasiAsagi} disabled={sonMu}
            style={{ cursor: sonMu ? "default" : "pointer", opacity: sonMu ? 0.35 : 1 }}>▼</button>
          <button type="button" onClick={() => onGizleGoster(!gizli)}>
            {gizli ? "👁 Göster" : "🙈 Gizle"}
          </button>
          <span style={{ color: "#bbb" }}>|</span>
          <input
            type="text" placeholder="emoji" value={taslakEmoji}
            onChange={(e) => setTaslakEmoji(e.target.value)}
            style={{ width: 46, fontSize: 12, padding: "2px 4px" }}
          />
          <input
            type="color" value={taslakRenk}
            onChange={(e) => setTaslakRenk(e.target.value)}
            style={{ width: 28, height: 22, padding: 0, border: "none", background: "none" }}
            title="Renk seç"
          />
          {taslakRenk !== "#cccccc" && (
            <button type="button" onClick={() => setTaslakRenk("#cccccc")} title="Rengi kaldır">✕ renk</button>
          )}
          <select value={taslakGenislik} onChange={(e) => setTaslakGenislik(e.target.value)}
            style={{ fontSize: 12, padding: "2px 4px" }} title="Bölüm genişliği">
            {GENISLIK_SECENEKLERI.map(g => <option key={g.v} value={g.v}>{g.ad}</option>)}
          </select>
          <button
            type="button" onClick={kaydet} disabled={!degisiklikVar || kaydediliyor}
            style={{
              fontWeight: 600, cursor: degisiklikVar ? "pointer" : "default",
              opacity: degisiklikVar ? 1 : 0.4, background: degisiklikVar ? "#0f7a5f" : "#ddd",
              color: degisiklikVar ? "#fff" : "#666", border: "none", borderRadius: 6, padding: "3px 10px",
            }}
          >
            {kaydediliyor ? "Kaydediliyor..." : "💾 Kaydet"}
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
