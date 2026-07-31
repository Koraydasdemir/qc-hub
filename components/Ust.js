"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useDuzenMod } from "./DuzenBaglam";
import { tumunuYedekle, yedekleriGetir, yedektenGeriYukle } from "../lib/duzen";

const DEPARTMANLAR = [
  { kod: "01", ad: "Kalite Kontrol ve Proje Yönetimi" },
  { kod: "02", ad: "Finance" },
  { kod: "03", ad: "Accounting" },
  { kod: "04", ad: "Technical Office" },
  { kod: "05", ad: "Procurement" },
  { kod: "06", ad: "Legal Affairs" },
  { kod: "07", ad: "Logistics & Customs" },
  { kod: "08", ad: "Administrative & Personnel" },
];

export default function Ust() {
  const router = useRouter();
  const [ad, setAd] = useState("");
  const [gorev, setGorev] = useState("");
  const [admin, setAdmin] = useState(false);
  const { editMod, setEditMod } = useDuzenMod();
  const [yedekMenu, setYedekMenu] = useState(false);
  const [yedekler, setYedekler] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles")
        .select("ad_soyad,gorev,admin").eq("id", user.id).single();
      if (data) { setAd(data.ad_soyad); setGorev(data.gorev || ""); setAdmin(!!data.admin); }
    })();
  }, []);

  async function yedekAl() {
    const etiket = prompt("Yedek için kısa bir isim yazın (örn: bugünkü hal):", "Yedek " + new Date().toLocaleString("tr-TR"));
    if (etiket === null) return;
    const err = await tumunuYedekle(etiket, ad);
    if (err) alert("Yedek alınamadı: " + err.message);
    else alert("Yedek alındı.");
  }

  async function yedekMenusuAc() {
    const y = await yedekleriGetir();
    setYedekler(y);
    setYedekMenu(true);
  }

  async function yedektenYukle(y) {
    if (!confirm(`"${y.etiket}" yedeği geri yüklensin mi? Şu anki düzen ayarları bu yedekle değiştirilecek.`)) return;
    const err = await yedektenGeriYukle(y);
    if (err) alert("Geri yükleme başarısız: " + err.message);
    else { alert("Geri yüklendi. Sayfa yenileniyor."); window.location.reload(); }
    setYedekMenu(false);
  }

  async function cikis() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function departmanaGit(kod) {
    router.push(`/dept-loglar?dept=${kod}`);
  }

  return (
    <div>
      {/* BAŞLIK */}
      <div className="ust">
        <a href="/" style={{ textDecoration: "none", color: "#fff" }}>
          <div className="logo">
            <img src="/logo.png" alt="TECHMP" />
            <div>
              <b>TECHMP Mühendislik · Proje Yönetim Sistemi</b>
            </div>
          </div>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", textDecoration: "none",
            border: "1px solid rgba(255,255,255,.35)", borderRadius: 9, padding: "7px 14px", fontSize: 13, fontWeight: 600 }}>
            🏠 Ana ekran
          </a>
          {admin && (
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={() => setEditMod(!editMod)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                  color: editMod ? "#0d3f7a" : "#fff",
                  background: editMod ? "#ffd23f" : "transparent",
                  border: "1px solid rgba(255,255,255,.35)", borderRadius: 9, padding: "7px 14px",
                  fontSize: 13, fontWeight: 600,
                }}
                title="Sayfa bölümlerini taşı / gizle / renklendir"
              >
                🛠 {editMod ? "Düzenleme Açık" : "Düzenle"}
              </button>
              {editMod && (
                <>
                  <button type="button" onClick={yedekAl}
                    style={{ color: "#fff", background: "transparent", border: "1px solid rgba(255,255,255,.35)",
                      borderRadius: 9, padding: "7px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    title="Şu anki düzen ayarlarını yedekle">
                    📸 Yedek al
                  </button>
                  <button type="button" onClick={yedekMenusuAc}
                    style={{ color: "#fff", background: "transparent", border: "1px solid rgba(255,255,255,.35)",
                      borderRadius: 9, padding: "7px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    title="Bir yedekten geri yükle">
                    ↩️ Geri yükle
                  </button>
                </>
              )}
              {yedekMenu && (
                <div style={{
                  position: "absolute", top: "110%", right: 0, background: "#fff", color: "#222",
                  border: "1px solid #ccc", borderRadius: 8, minWidth: 260, maxHeight: 300, overflowY: "auto",
                  boxShadow: "0 6px 18px rgba(0,0,0,.2)", zIndex: 50, padding: 8,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <b style={{ fontSize: 13 }}>Yedekler</b>
                    <span style={{ cursor: "pointer", fontSize: 13 }} onClick={() => setYedekMenu(false)}>✕</span>
                  </div>
                  {yedekler.length === 0 && <div style={{ fontSize: 12, color: "#888" }}>Henüz yedek yok.</div>}
                  {yedekler.map((y) => (
                    <div key={y.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                      fontSize: 12, padding: "5px 2px", borderBottom: "1px solid #eee" }}>
                      <span>{y.etiket}<br /><span style={{ color: "#999" }}>{new Date(y.created_at).toLocaleString("tr-TR")}</span></span>
                      <button type="button" onClick={() => yedektenYukle(y)}
                        style={{ fontSize: 11, padding: "4px 8px", cursor: "pointer" }}>Yükle</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <span className="kim">
            {ad ? <>{ad}{gorev ? " · " + gorev : ""}</> : ""}
          </span>
          <a className="cikis" onClick={cikis} style={{ cursor: "pointer" }}>Çıkış</a>
        </div>
      </div>

      {/* ALT BAŞLIK - DEPARTMANLAR */}
      <div className="alt-baslik">
        {DEPARTMANLAR.map((d) => (
          <button
            key={d.kod}
            className="dept-buton"
            onClick={() => departmanaGit(d.kod)}
          >
            {d.ad}
          </button>
        ))}
      </div>

      <style jsx>{`
        .alt-baslik {
          display: flex;
          background: #0d3f7a;
          padding: 0 16px;
          overflow-x: auto;
        }
        .dept-buton {
          flex: 1;
          background: transparent;
          border: none;
          border-right: 1px solid rgba(255, 255, 255, 0.18);
          color: #eaf2ff;
          font-size: 14px;
          font-weight: 600;
          padding: 10px 10px;
          cursor: pointer;
          white-space: nowrap;
          text-align: center;
          transition: background 0.15s;
        }
        .dept-buton:last-child {
          border-right: none;
        }
        .dept-buton:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }
        @media (max-width: 768px) {
          .alt-baslik {
            padding: 0 10px;
          }
          .dept-buton {
            font-size: 11.5px;
            padding: 8px 6px;
          }
        }
      `}</style>
    </div>
  );
}
