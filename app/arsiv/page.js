"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Ust from "../../components/Ust";

export default function Arsiv() {
  const router = useRouter();
  const [yukle, setYukle] = useState(true);
  const [rows, setRows] = useState([]);
  const [durum, setDurum] = useState("");
  const [disiplin, setDisiplin] = useState("");
  const [ara, setAra] = useState("");
  const [acik, setAcik] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data } = await supabase.from("ncr_records").select("*").order("id");
      setRows(data || []); setYukle(false);
    })();
  }, []);

  const disiplinler = useMemo(() => {
    const s = new Set();
    rows.forEach(r => (r.disiplin||"").split("/").forEach(d => { const t=d.trim(); if(t) s.add(t); }));
    return [...s].sort();
  }, [rows]);

  const gosterilen = useMemo(() => rows.filter(r =>
    (!durum || r.durum === durum) &&
    (!disiplin || (r.disiplin||"").includes(disiplin)) &&
    (!ara || (r.no+" "+(r.firma||"")+" "+(r.ozet||"")).toLowerCase().includes(ara.toLowerCase()))
  ), [rows, durum, disiplin, ara]);

  const openSay = rows.filter(r => r.durum==="Open").length;
  const closedSay = rows.filter(r => r.durum==="Closed").length;

  if (yukle) return <><Ust/><div className="wrap">Yükleniyor...</div></>;

  return (
    <>
      <Ust/>
      <div className="wrap">
        <a href="/" style={{fontSize:13}}>← Ana ekran</a>
        <h1 style={{marginTop:10}}>NCR Arşivi · Lessons Learned</h1>
        <p style={{color:"var(--ink2)",fontSize:13,marginTop:0}}>{rows.length} uygunsuzluk kaydı — <b>{openSay}</b> açık, <b>{closedSay}</b> kapalı. Disipline göre etiketlenmiş kurumsal hafıza.</p>

        <div style={{display:"flex",gap:10,margin:"14px 0",flexWrap:"wrap",alignItems:"center"}}>
          <select value={durum} onChange={e=>setDurum(e.target.value)} style={{padding:"9px 12px",border:"1px solid #cbd3de",borderRadius:10,fontSize:13.5}}>
            <option value="">Tüm durumlar</option><option value="Open">Açık</option><option value="Closed">Kapalı</option>
          </select>
          <select value={disiplin} onChange={e=>setDisiplin(e.target.value)} style={{padding:"9px 12px",border:"1px solid #cbd3de",borderRadius:10,fontSize:13.5}}>
            <option value="">Tüm disiplinler</option>
            {disiplinler.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input value={ara} onChange={e=>setAra(e.target.value)} placeholder="Ara..." style={{padding:"9px 12px",border:"1px solid #cbd3de",borderRadius:10,fontSize:13.5,flex:1,minWidth:160}}/>
        </div>

        <section style={{padding:0,overflow:"hidden"}}>
          <table>
            <thead><tr><th>No</th><th>Firma</th><th>Disiplin</th><th>Durum</th><th>Uygunsuzluk özeti</th></tr></thead>
            <tbody>
              {gosterilen.map(r => (
                <tr key={r.id} onClick={()=>setAcik(acik===r.id?null:r.id)} style={{cursor:"pointer"}}>
                  <td style={{whiteSpace:"nowrap",fontWeight:600,color:"var(--navy)"}}>{r.no}</td>
                  <td style={{whiteSpace:"nowrap"}}>{r.firma || "—"}</td>
                  <td style={{maxWidth:160,fontSize:12}}>{r.disiplin || "—"}</td>
                  <td><span className="pill" style={{background: r.durum==="Open"?"#fbe9e8":"#e4f4ee", color: r.durum==="Open"?"#b3261e":"#0f7a5f"}}>{r.durum==="Open"?"Açık":"Kapalı"}</span></td>
                  <td style={{fontSize:12.5}}>{acik===r.id ? r.ozet : (r.ozet||"").slice(0,90)+((r.ozet||"").length>90?"…":"")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {gosterilen.length === 0 && <div style={{padding:20,color:"var(--ink3)",fontSize:13}}>Kayıt yok.</div>}
        </section>
        <p style={{fontSize:12,color:"var(--ink3)"}}>{gosterilen.length} kayıt · satıra tıklayınca özet tam açılır</p>
      </div>
    </>
  );
}
