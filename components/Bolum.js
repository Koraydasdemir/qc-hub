"use client";
import { useDuzenMod } from "./DuzenBaglam";

// Herhangi bir sayfadaki bir "bölüm"ü sarmalayan bileşen.
// admin + editMod açıkken üstte küçük bir düzenleme araç çubuğu gösterir:
// ▲ yukarı taşı, ▼ aşağı taşı, 👁 gizle/göster, emoji kutusu, renk kutusu.
// Props:
//  - key bilgisi: bolumKey (layout_settings.bolum_key ile eşleşir)
//  - ayar: { sira, gizli, emoji, renk } (useDuzen'den ayarlar[bolumKey])
//  - admin: boolean
//  - baslik: varsayılan başlık metni (emoji override edilirse önüne eklenir)
//  - onTasiYukari / onTasiAsagi / onGizleGoster / onEmoji / onRenk : callback'ler
//  - ilkMi / sonMu: taşıma oklarını disable etmek için
//  - children: bölümün asıl içeriği
export default function Bolum({
  bolumKey, ayar, admin, baslik, onTasiYukari, onTasiAsagi, onGizleGoster, onEmoji, onRenk,
  ilkMi, sonMu, children,
}) {
  const { editMod } = useDuzenMod();
  const gizli = !!ayar?.gizli;
  const renk = ayar?.renk || null;

  if (gizli && !(editMod && admin)) return null;

  const gosterAracCubugu = editMod && admin;

  return (
    <div
      style={{
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
          <input
            type="text" placeholder="emoji" defaultValue={ayar?.emoji || ""}
            onBlur={(e) => onEmoji(e.target.value)}
            style={{ width: 46, fontSize: 12, padding: "2px 4px" }}
          />
          <input
            type="color" defaultValue={renk || "#cccccc"}
            onChange={(e) => onRenk(e.target.value)}
            style={{ width: 28, height: 22, padding: 0, border: "none", background: "none" }}
            title="Renk seç"
          />
          {renk && (
            <button type="button" onClick={() => onRenk(null)} title="Rengi kaldır">✕ renk</button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
