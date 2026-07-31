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

export default function Oturumlar() {
  const router = useRouter();
  const [yukle, setYukle] = useState(true);
  const [yetkiliMi, setYetkiliMi] = useState(false);
  const [oturumlar, setOturumlar] = useState([]);
  const [kisiFiltre, setKisiFiltre] = useState("");

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

  return (
    <>
      <Ust/>
      <div className="wrap">
        <a href="/" style={{fontSize:13}}>← Ana ekran</a>
        <h1 style={{marginTop:10}}>🕒 Giriş / Çıkış kayıtları</h1>
        <p style={{color:"var(--ink2)",fontSize:13,marginTop:0}}>Sadece admin görebilir. Son 500 oturum listelenir.</p>

        <div style={{display:"flex",gap:10,margin:"10px 0 14px",alignItems:"center"}}>
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
