"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Ust from "../../components/Ust";

const bugun = () => new Date().toLocaleDateString("tr-TR");

export default function Onaylar() {
  const router = useRouter();
  const [yukle, setYukle] = useState(true);
  const [yetkili, setYetkili] = useState(false);
  const [kuyruk, setKuyruk] = useState([]);
  const [mesaj, setMesaj] = useState("");

  async function yukleVeri() {
    const { data } = await supabase.from("payment_gates")
      .select("*,projects(kod,ad,spec_no,suppliers(ad))")
      .eq("durum", "dekont yüklendi").order("dekont_tarihi");
    setKuyruk(data || []);
  }
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data: prof } = await supabase.from("profiles").select("admin").eq("id", session.user.id).single();
      if (!prof?.admin) { setYukle(false); return; }
      setYetkili(true); await yukleVeri(); setYukle(false);
    })();
  }, []);

  async function onayla(g) {
    setMesaj("Onaylanıyor...");
    const { error } = await supabase.from("payment_gates").update({ durum:"açık", acilma_tarihi:bugun() }).eq("id", g.id);
    if (error) { setMesaj("Hata: " + error.message); return; }
    setMesaj(""); await yukleVeri();
  }

  if (yukle) return <><Ust/><div className="wrap">Yükleniyor...</div></>;
  if (!yetkili) return <><Ust/><div className="wrap"><a href="/">← Ana ekran</a><p style={{marginTop:14}}>Bu sayfa yalnızca yöneticiye açıktır.</p></div></>;

  return (
    <>
      <Ust/>
      <div className="wrap">
        <a href="/" style={{fontSize:13}}>← Ana ekran</a>
        <h1 style={{marginTop:10}}>Onay kuyruğu</h1>
        <p style={{color:"var(--ink2)",fontSize:13,marginTop:0}}>Dekontu yüklenmiş, onay bekleyen ödeme kapıları. Onaylayınca kapı açılır.</p>
        {mesaj && <div style={{fontSize:13,color: mesaj.startsWith("Hata")?"#b3261e":"var(--ink2)"}}>{mesaj}</div>}

        {kuyruk.length === 0 ? (
          <section><div style={{color:"var(--ink3)",fontSize:14}}>Onay bekleyen kapı yok. 🎉</div></section>
        ) : (
          <section style={{padding:0,overflow:"hidden"}}>
            <table>
              <thead><tr><th>Proje</th><th>Tedarikçi</th><th>Kapı</th><th>Dekont</th><th>Yükleyen</th><th>Tarih</th><th></th></tr></thead>
              <tbody>
                {kuyruk.map(g => (
                  <tr key={g.id}>
                    <td><a href={"/spec/"+g.projects?.kod}>{g.projects?.ad}</a><div style={{fontSize:11,color:"var(--ink3)"}}>Spec {g.projects?.spec_no}</div></td>
                    <td style={{fontSize:12.5}}>{g.projects?.suppliers?.ad || "—"}</td>
                    <td style={{fontWeight:600,color:"var(--navy)"}}>{g.ad}</td>
                    <td>{g.dekont_url ? <a href={g.dekont_url} target="_blank" rel="noreferrer">📎 görüntüle</a> : "—"}</td>
                    <td style={{fontSize:12.5}}>{g.acan || "—"}</td>
                    <td style={{fontSize:12.5,whiteSpace:"nowrap"}}>{g.dekont_tarihi || "—"}</td>
                    <td><button onClick={()=>onayla(g)} className="arac-btn" style={{background:"#0f7a5f",fontSize:12.5,padding:"7px 14px"}}>✓ Onayla</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </>
  );
}
