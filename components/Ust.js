"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useDuzenMod } from "./DuzenBaglam";
import { tumunuYedekle, yedekleriGetir, yedektenGeriYukle, bolumYetkilileriGetir, bolumYetkiliEkle, bolumYetkiliSil } from "../lib/duzen";
import { SAYFA_BOLUMLERI } from "../lib/bolumler";

// Şu an sadece Ana ekran ("/") için yol -> sayfa anahtarı eşlemesi var; ileride diğer sayfalar da eklenebilir.
function sayfaAnahtari(pathname) {
  if (pathname === "/") return "ana-ekran";
  return null;
}

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
  const pathname = usePathname();
  const sayfa = sayfaAnahtari(pathname);
  const bolumler = sayfa ? (SAYFA_BOLUMLERI[sayfa] || []) : [];
  const [ad, setAd] = useState("");
  const [gorev, setGorev] = useState("");
  const [admin, setAdmin] = useState(false);
  const { editMod, setEditMod } = useDuzenMod();
  const [yedekMenu, setYedekMenu] = useState(false);
  const [yedekler, setYedekler] = useState([]);
  const [atamaMenu, setAtamaMenu] = useState(false);
  const [atamalar, setAtamalar] = useState([]);
  const [profilList, setProfilList] = useState([]);
  const [secBolum, setSecBolum] = useState("");
  const [secKisi, setSecKisi] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles")
        .select("ad_soyad,gorev,admin").eq("id", user.id).single();
      if (data) { setAd(data.ad_soyad); setGorev(data.gorev || ""); setAdmin(!!data.admin); }
    })();
  }, []);

  async function atamaMenusuAc() {
    if (!sayfa) return;
    const [a, { data: pf }] = await Promise.all([
      bolumYetkilileriGetir(sayfa),
      supabase.from("profiles").select("ad_soyad").order("ad_soyad"),
    ]);
    setAtamalar(a);
    setProfilList(pf || []);
    setSecBolum(bolumler[0]?.key || "");
    setAtamaMenu(true);
  }

  async function atamaEkle() {
    if (!secBolum || !secKisi) return;
    const { error } = await bolumYetkiliEkle(sayfa, secBolum, secKisi, ad);
    if (error) { alert("Hata: " + error.message); return; }
    setAtamalar(await bolumYetkilileriGetir(sayfa));
    setSecKisi("");
  }

  async function atamaKaldir(id) {
    await bolumYetkiliSil(id);
    setAtamalar(await bolumYetkilileriGetir(sayfa));
  }

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
              {sayfa && (
                <button
                  type="button"
                  onClick={atamaMenusuAc}
                  style={{ color: "#fff", background: "transparent", border: "1px solid rgba(255,255,255,.35)",
                    borderRadius: 9, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  title="Bu sayfadaki her alan için yetkili kişi ata"
                >
                  👤 Yetkili atama
                </button>
              )}
              {atamaMenu && (
                <div style={{
                  position: "absolute", top: "110%", right: 0, background: "#fff", color: "#222",
                  border: "1px solid #ccc", borderRadius: 8, minWidth: 320, maxHeight: 420, overflowY: "auto",
                  boxShadow: "0 6px 18px rgba(0,0,0,.2)", zIndex: 50, padding: 10,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <b style={{ fontSize: 13 }}>Yetkili atama</b>
                    <span style={{ cursor: "pointer", fontSize: 13 }} onClick={() => setAtamaMenu(false)}>✕</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                    <select value={secBolum} onChange={(e) => setSecBolum(e.target.value)}
                      style={{ fontSize: 12, padding: "5px 6px", border: "1px solid #cbd3de", borderRadius: 6, flex: 1, minWidth: 140 }}>
                      {bolumler.map((b) => <option key={b.key} value={b.key}>{b.ad}</option>)}
                    </select>
                    <select value={secKisi} onChange={(e) => setSecKisi(e.target.value)}
                      style={{ fontSize: 12, padding: "5px 6px", border: "1px solid #cbd3de", borderRadius: 6, flex: 1, minWidth: 140 }}>
                      <option value="">Kişi seç...</option>
                      {profilList.map((p) => <option key={p.ad_soyad} value={p.ad_soyad}>{p.ad_soyad}</option>)}
                    </select>
                    <button type="button" onClick={atamaEkle} disabled={!secKisi}
                      style={{ fontSize: 12, padding: "5px 10px", cursor: secKisi ? "pointer" : "default", opacity: secKisi ? 1 : 0.5 }}>
                      + Ata
                    </button>
                  </div>
                  {bolumler.map((b) => {
                    const buBolum = atamalar.filter((a) => a.bolum_key === b.key);
                    return (
                      <div key={b.key} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#586173" }}>{b.ad}</div>
                        {buBolum.length === 0 && <div style={{ fontSize: 11, color: "#aab2bf" }}>Yetkili atanmadı — herkes görebilir, sadece admin düzenleyebilir.</div>}
                        {buBolum.map((a) => (
                          <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                            fontSize: 12, padding: "3px 0" }}>
                            <span>{a.ad_soyad}</span>
                            <span onClick={() => atamaKaldir(a.id)} style={{ cursor: "pointer", color: "#b3261e", fontWeight: 700 }}>✕</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
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
