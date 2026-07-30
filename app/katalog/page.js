"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Ust from "../../components/Ust";

export default function Katalog() {
  const router = useRouter();
  const [yukle, setYukle] = useState(true);
  const [rows, setRows] = useState([]);
  const [ted, setTed] = useState("");
  const [durum, setDurum] = useState("");
  const [ara, setAra] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data } = await supabase.from("specs_katalog").select("*").order("tedarikci").order("id");
      setRows(data || []); setYukle(false);
    })();
  }, []);

  const tedarikciler = useMemo(() => [...new Set(rows.map(r => r.tedarikci).filter(Boolean))].sort(), [rows]);
  const gosterilen = useMemo(() => rows.filter(r =>
    (!ted || r.tedarikci === ted) &&
    (!durum || r.durum === durum) &&
    (!ara || (r.tedarikci+" "+r.spec_no+" "+(r.proje_adi||"")).toLowerCase().includes(ara.toLowerCase()))
  ), [rows, ted, durum, ara]);

  const tamamlanan = rows.filter(r => r.durum === "Completed").length;
  const bekleyen = rows.filter(r => r.durum !== "Completed").length;

  if (yukle) return <><Ust/><div className="wrap">Yükleniyor...</div></>;

  return (
    <>
      <Ust/>
      <div className="wrap">
        <a href="/" style={{fontSize:13}}>← Ana ekran</a>
        <h1 style={{marginTop:10}}>Spesifikasyon Kataloğu</h1>
        <p style={{color:"var(--ink2)",fontSize:13,marginTop:0}}>{rows.length} spesifikasyon — <b>{tamamlanan}</b> tamamlandı, <b>{bekleyen}</b> devam ediyor.</p>

        <div style={{display:"flex",gap:10,margin:"14px 0",flexWrap:"wrap",alignItems:"center"}}>
          <select value={ted} onChange={e=>setTed(e.target.value)} style={{padding:"9px 12px",border:"1px solid #cbd3de",borderRadius:10,fontSize:13.5}}>
            <option value="">Tüm tedarikçiler</option>
            {tedarikciler.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={durum} onChange={e=>setDurum(e.target.value)} style={{padding:"9px 12px",border:"1px solid #cbd3de",borderRadius:10,fontSize:13.5}}>
            <option value="">Tüm durumlar</option><option value="Completed">Completed</option><option value="Not Completed">Not Completed</option>
          </select>
          <input value={ara} onChange={e=>setAra(e.target.value)} placeholder="Ara..." style={{padding:"9px 12px",border:"1px solid #cbd3de",borderRadius:10,fontSize:13.5,flex:1,minWidth:160}}/>
        </div>

        <section style={{padding:0,overflow:"hidden"}}>
          <table>
            <thead><tr><th>Tedarikçi</th><th>Spec No</th><th>Proje adı</th><th>Teslim şartı</th><th>Durum</th><th>Beklenen</th><th>Gerçek teslim</th></tr></thead>
            <tbody>
              {gosterilen.map(r => (
                <tr key={r.id} onClick={()=>router.push("/katalog/"+r.id)} style={{cursor:"pointer"}}>
                  <td style={{whiteSpace:"nowrap",fontWeight:600,color:"var(--navy)"}}>{r.tedarikci || "—"}</td>
                  <td style={{whiteSpace:"nowrap"}}>{r.spec_no || "—"}</td>
                  <td style={{maxWidth:200}}>{r.proje_adi || "—"}</td>
                  <td style={{maxWidth:180,fontSize:12}}>{r.teslim_sarti || "—"}</td>
                  <td><span className="pill" style={{background: r.durum==="Completed"?"#e4f4ee":"#fbf0dc", color: r.durum==="Completed"?"#0f7a5f":"#a9721a"}}>{r.durum}</span></td>
                  <td style={{fontSize:12,whiteSpace:"nowrap"}}>{r.beklenen_teslim || "—"}</td>
                  <td style={{fontSize:12,whiteSpace:"nowrap"}}>{r.gercek_teslim || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {gosterilen.length === 0 && <div style={{padding:20,color:"var(--ink3)",fontSize:13}}>Kayıt yok.</div>}
        </section>
        <p style={{fontSize:12,color:"var(--ink3)"}}>{gosterilen.length} kayıt gösteriliyor</p>
      </div>
    </>
  );
}
