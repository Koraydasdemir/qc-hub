"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Ust from "../../components/Ust";

function sureFormat(giris, cikis) {
  if (!giris) return "—";
  const bitis = cikis ? new Date(cikis) : new Date();
  const baslangic = new Date(giris);
  let dk = Math.round((bitis - baslangic) / 60000);
  if (dk < 0) dk = 0;
  const saat = Math.floor(dk / 60);
  const kalanDk = dk % 60;
  if (saat > 0) return `${saat} sa ${kalanDk} dk`;
  return `${kalanDk} dk`;
}

function tarihSaat(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

function dkFormat(dk) {
  const saat = Math.floor(dk / 60);
  const kalanDk = Math.round(dk % 60);
  if (saat > 0) return `${saat} sa ${kalanDk} dk`;
  return `${kalanDk} dk`;
}

function periyotBaslangic(periyot) {
  const simdi = new Date();
  if (periyot === "gun") return new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate());
  if (periyot === "hafta") {
    const gun = simdi.getDay();
    const fark = gun === 0 ? 6 : gun - 1;
    return new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate() - fark);
  }
  if (periyot === "ay") return new Date(simdi.getFullYear(), simdi.getMonth(), 1);
  return null; // "tumu"
}

// Bir oturumun, belirtilen periyot penceresiyle kesişen kısmını dakika cinsinden hesaplar
function periyotIciSure(oturum, baslangic) {
  const girisZ = new Date(oturum.giris_zamani);
  const cikisZ = oturum.cikis_zamani ? new Date(oturum.cikis_zamani) : new Date();
  const pencereBaslangic = baslangic || girisZ;
  const efektifBaslangic = girisZ > pencereBaslangic ? girisZ : pencereBaslangic;
  if (cikisZ <= efektifBaslangic) return 0;
  return (cikisZ - efektifBaslangic) / 60000;
}

export default function Oturumlar() {
  const router = useRouter();
  const [yukle, setYukle] = useState(true);
  const [yetkiliMi, setYetkiliMi] = useState(false);
  const [oturumlar, setOturumlar] = useState([]);
  const [kisiFiltre, setKisiFiltre] = useState("");
  const [periyot, setPeriyot] = useState("gun");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data: prof } = await supabase.from("profiles").select("admin").eq("id", session.user.id).single();
      if (!prof?.admin) { setYetkiliMi(false); setYukle(false); return; }
      setYetkiliMi(true);
      const { data } = await supabase.from("login_sessions").select("*").order("giris_zamani", { ascending:false }).limit(500);
      setOturumlar(data || []);
      setYukle(false);
    })();
  }, []);

  if (yukle) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--ink3)",fontSize:14}}>Yükleniyor...</div>;

  if (!yetkiliMi) return (
    <>
      <Ust/>
      <div className="wrap">
        <a href="/" style={{fontSize:13}}>← Ana ekran</a>
        <p style={{marginTop:16}}>Bu sayfayı görüntüleme yetkiniz yok.</p>
      </div>
    </>
  );

  const kisiler = [...new Set(oturumlar.map(o => o.kullanici))].sort();
  const gosterilen = oturumlar.filter(o => !kisiFiltre || o.kullanici === kisiFiltre);

  const periyotBasla = periyotBaslangic(periyot);
  const ozetKaynagi = periyot === "tumu" ? oturumlar : oturumlar.filter(o => {
    const cikisZ = o.cikis_zamani ? new Date(o.cikis_zamani) : new Date();
    return cikisZ >= periyotBasla;
  });
  const kisiToplamlari = {};
  ozetKaynagi.forEach(o => {
    kisiToplamlari[o.kullanici] = (kisiToplamlari[o.kullanici] || 0) + periyotIciSure(o, periyotBasla);
  });
  const ozetSirali = Object.entries(kisiToplamlari).sort((a,b) => b[1]-a[1]);
  const PERIYOT_AD = { gun:"Bugün", hafta:"Bu hafta", ay:"Bu ay", tumu:"Tüm zamanlar" };

  return (
    <>
      <Ust/>
      <div className="wrap">
        <a href="/" style={{fontSize:13}}>← Ana ekran</a>
        <h1 style={{marginTop:10}}>🕒 Giriş / Çıkış kayıtları</h1>
        <p style={{color:"var(--ink2)",fontSize:13,marginTop:0}}>Sadece admin görebilir. Son 500 oturum listelenir.</p>

        <section>
          <h2 style={{marginTop:0}}>Kişi bazlı toplam süre</h2>
          <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
            {["gun","hafta","ay","tumu"].map(p => (
              <button key={p} type="button" onClick={()=>setPeriyot(p)}
                style={{fontSize:12.5,padding:"7px 14px",borderRadius:8,cursor:"pointer",fontWeight:600,
                  border: periyot===p ? "1.5px solid #0c447c" : "1px solid #cbd3de",
                  background: periyot===p ? "#e7f0fb" : "#fff",
                  color: periyot===p ? "#0c447c" : "#586173"}}>
                {PERIYOT_AD[p]}
              </button>
            ))}
          </div>
          <div className="grid">
            {ozetSirali.map(([kisi, dk]) => (
              <div key={kisi} className="dept">
                <b style={{display:"block",fontSize:13.5,color:"var(--navy)",marginBottom:4}}>{kisi}</b>
                <div style={{fontSize:18,fontWeight:700,color:"#0c447c"}}>{dkFormat(dk)}</div>
                <div style={{fontSize:11,color:"var(--ink3)",marginTop:2}}>{PERIYOT_AD[periyot]} toplam</div>
              </div>
            ))}
            {ozetSirali.length===0 && <div style={{fontSize:13,color:"var(--ink3)"}}>Bu periyotta kayıt yok.</div>}
          </div>
        </section>

        <h2 style={{marginTop:24}}>Detaylı kayıtlar</h2>
        <div style={{display:"flex",gap:10,margin:"0 0 14px",alignItems:"center"}}>
          <select value={kisiFiltre} onChange={e=>setKisiFiltre(e.target.value)}
            style={{padding:"9px 12px",border:"1px solid #cbd3de",borderRadius:10,fontSize:13.5}}>
            <option value="">Tüm kişiler</option>
            {kisiler.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <span style={{fontSize:12,color:"var(--ink3)"}}>{gosterilen.length} kayıt</span>
        </div>

        <section style={{padding:0,overflow:"hidden"}}>
          <table>
            <thead><tr><th>Kişi</th><th>Giriş</th><th>Çıkış</th><th>Süre</th></tr></thead>
            <tbody>
              {gosterilen.map(o => (
                <tr key={o.id}>
                  <td style={{fontWeight:600,color:"var(--navy)"}}>{o.kullanici}</td>
                  <td style={{fontSize:12.5,whiteSpace:"nowrap"}}>{tarihSaat(o.giris_zamani)}</td>
                  <td style={{fontSize:12.5,whiteSpace:"nowrap"}}>
                    {o.cikis_zamani ? tarihSaat(o.cikis_zamani) : <span style={{color:"var(--ok)",fontWeight:600}}>Hâlâ içeride</span>}
                  </td>
                  <td style={{fontSize:12.5}}>{sureFormat(o.giris_zamani, o.cikis_zamani)}</td>
                </tr>
              ))}
              {gosterilen.length===0 && <tr><td colSpan={4} style={{padding:16,color:"var(--ink3)",fontSize:13}}>Kayıt yok.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
