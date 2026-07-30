"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Ust from "../../components/Ust";

const RENK = { Active:{b:"#e4f4ee",c:"#0f7a5f"}, Hold:{b:"#fbf0dc",c:"#a9721a"}, Closed:{b:"#eef1f6",c:"#8b94a4"} };
const DURUMLAR = ["Active","Hold","Closed"];
const SONRAKI = { Active:"Hold", Hold:"Closed", Closed:"Active" };
const bos = { supplier:"", topic:"", ncr:"", durum:"Active", ozet:"", son_durum:"", kapali:false };

export default function AcikKonular() {
  const router = useRouter();
  const [yukle, setYukle] = useState(true);
  const [rows, setRows] = useState([]);
  const [sekme, setSekme] = useState("acik");
  const [ted, setTed] = useState("");
  const [ara, setAra] = useState("");
  const [duzenle, setDuzenle] = useState(null);   // id or "yeni"
  const [form, setForm] = useState(bos);
  const [mesaj, setMesaj] = useState("");

  async function yukleVeri() {
    const { data } = await supabase.from("open_issues").select("*").order("kapali").order("id");
    setRows(data || []);
  }
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      await yukleVeri(); setYukle(false);
    })();
  }, []);

  const tedarikciler = useMemo(() => [...new Set(rows.map(r => r.supplier).filter(Boolean))].sort(), [rows]);
  const gosterilen = useMemo(() => rows.filter(r =>
    (sekme === "acik" ? !r.kapali : r.kapali) &&
    (!ted || r.supplier === ted) &&
    (!ara || (r.topic+" "+r.ozet+" "+(r.ncr||"")).toLowerCase().includes(ara.toLowerCase()))
  ), [rows, sekme, ted, ara]);

  const acikSay = rows.filter(r => !r.kapali).length;
  const kapaliSay = rows.filter(r => r.kapali).length;

  function baslaDuzenle(r) { setDuzenle(r.id); setForm({ supplier:r.supplier||"", topic:r.topic||"", ncr:r.ncr||"", durum:r.durum||"Active", ozet:r.ozet||"", son_durum:r.son_durum||"", kapali:!!r.kapali }); }
  function baslaYeni() { setDuzenle("yeni"); setForm(bos); }
  function iptal() { setDuzenle(null); setForm(bos); setMesaj(""); }

  async function kaydet() {
    if (!form.topic.trim() && !form.ozet.trim()) { setMesaj("Konu veya özet girin"); return; }
    setMesaj("Kaydediliyor...");
    const kayit = { supplier:form.supplier||null, topic:form.topic||null, ncr:form.ncr||null,
      durum:form.durum, ozet:form.ozet||null, son_durum:form.son_durum||null,
      kapali: form.durum==="Closed" ? true : form.kapali };
    let error;
    if (duzenle === "yeni") { ({ error } = await supabase.from("open_issues").insert(kayit)); }
    else { ({ error } = await supabase.from("open_issues").update(kayit).eq("id", duzenle)); }
    if (error) { setMesaj("Hata: " + error.message); return; }
    iptal(); await yukleVeri();
  }

  async function durumDegistir(r) {
    const yeni = SONRAKI[r.durum] || "Active";
    const { error } = await supabase.from("open_issues").update({ durum: yeni, kapali: yeni==="Closed" }).eq("id", r.id);
    if (!error) await yukleVeri();
  }

  async function dosyaYukle(r, file) {
    if (!file) return;
    setMesaj("Yükleniyor...");
    const path = r.id + "_" + Date.now() + "_" + file.name.replace(/[^\w.\-]/g,"_");
    const { error: upErr } = await supabase.storage.from("acik-konu-belge").upload(path, file, { upsert:false });
    if (upErr) { setMesaj("Hata: " + upErr.message); return; }
    const dosya_url = supabase.storage.from("acik-konu-belge").getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.from("open_issues").update({ dosya_url }).eq("id", r.id);
    if (error) { setMesaj("Hata: " + error.message); return; }
    setMesaj(""); await yukleVeri();
  }

  if (yukle) return <><Ust/><div className="wrap">Yükleniyor...</div></>;

  return (
    <>
      <Ust/>
      <div className="wrap">
        <a href="/" style={{fontSize:13}}>← Ana ekran</a>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <h1 style={{marginTop:10}}>Açık Konular</h1>
          <button onClick={baslaYeni} className="arac-btn" style={{background:"#e08a3c",fontSize:13.5}}>+ Yeni konu</button>
        </div>
        <p style={{color:"var(--ink2)",fontSize:13,marginTop:0}}>Tedarikçi bazlı takip listesi — açık ve kapatılmış konular. Satırdaki “Düzenle” ile güncelle/kapat.</p>

        {duzenle !== null && (
          <section style={{border:"1.5px solid #cfe0f2",background:"#f6faff"}}>
            <h2 style={{marginTop:0}}>{duzenle==="yeni" ? "Yeni konu" : "Konu düzenle"}</h2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={{fontSize:12,color:"#586173",fontWeight:600}}>Tedarikçi</label>
                <input value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})} style={inp}/></div>
              <div><label style={{fontSize:12,color:"#586173",fontWeight:600}}>NCR</label>
                <input value={form.ncr} onChange={e=>setForm({...form,ncr:e.target.value})} style={inp}/></div>
              <div style={{gridColumn:"1 / span 2"}}><label style={{fontSize:12,color:"#586173",fontWeight:600}}>Konu</label>
                <input value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} style={inp}/></div>
              <div><label style={{fontSize:12,color:"#586173",fontWeight:600}}>Durum</label>
                <select value={form.durum} onChange={e=>setForm({...form,durum:e.target.value})} style={inp}>
                  {DURUMLAR.map(d=><option key={d} value={d}>{d}</option>)}
                </select></div>
              <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
                <label style={{fontSize:13,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                  <input type="checkbox" checked={form.kapali} onChange={e=>setForm({...form,kapali:e.target.checked})}/> Kapalı
                </label>
              </div>
              <div style={{gridColumn:"1 / span 2"}}><label style={{fontSize:12,color:"#586173",fontWeight:600}}>Özet</label>
                <textarea value={form.ozet} onChange={e=>setForm({...form,ozet:e.target.value})} style={{...inp,height:60,resize:"vertical",fontFamily:"inherit"}}/></div>
              <div style={{gridColumn:"1 / span 2"}}><label style={{fontSize:12,color:"#586173",fontWeight:600}}>Son durum</label>
                <textarea value={form.son_durum} onChange={e=>setForm({...form,son_durum:e.target.value})} style={{...inp,height:60,resize:"vertical",fontFamily:"inherit"}}/></div>
            </div>
            <div style={{marginTop:12,display:"flex",gap:10,alignItems:"center"}}>
              <button onClick={kaydet} className="arac-btn" style={{fontSize:13.5}}>Kaydet</button>
              <button onClick={iptal} className="arac-btn" style={{background:"#8b94a4",fontSize:13.5}}>İptal</button>
              {mesaj && <span style={{fontSize:13,color: mesaj.startsWith("Hata")?"#b3261e":"var(--ink2)"}}>{mesaj}</span>}
            </div>
          </section>
        )}

        <div style={{display:"flex",gap:10,margin:"14px 0",flexWrap:"wrap",alignItems:"center"}}>
          {[["acik","Açık ("+acikSay+")"],["kapali","Kapalı ("+kapaliSay+")"]].map(([k,l]) => (
            <button key={k} onClick={()=>setSekme(k)} type="button"
              style={{padding:"9px 20px",borderRadius:20,border:"1.5px solid",cursor:"pointer",fontWeight:600,fontSize:13.5,
                borderColor: sekme===k?"#16304f":"#cdd6e2", background: sekme===k?"#16304f":"#fff", color: sekme===k?"#fff":"#16304f"}}>{l}</button>
          ))}
          <select value={ted} onChange={e=>setTed(e.target.value)}
            style={{padding:"9px 12px",border:"1px solid #cbd3de",borderRadius:10,fontSize:13.5}}>
            <option value="">Tüm tedarikçiler</option>
            {tedarikciler.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={ara} onChange={e=>setAra(e.target.value)} placeholder="Ara..."
            style={{padding:"9px 12px",border:"1px solid #cbd3de",borderRadius:10,fontSize:13.5,flex:1,minWidth:160}}/>
        </div>

        <section style={{padding:0,overflow:"hidden"}}>
          <table>
            <thead><tr><th>#</th><th>Tedarikçi</th><th>Konu</th><th>NCR</th><th>Durum</th><th>Özet</th><th>Son durum</th><th>Döküman</th><th></th></tr></thead>
            <tbody>
              {gosterilen.map((r,i) => {
                const rk = RENK[r.durum] || RENK.Hold;
                return (
                  <tr key={r.id}>
                    <td style={{fontSize:12,color:"var(--ink3)"}}>{i+1}</td>
                    <td style={{whiteSpace:"nowrap",fontWeight:600,color:"var(--navy)"}}>{r.supplier || "—"}</td>
                    <td style={{maxWidth:160}}>{r.topic || "—"}</td>
                    <td style={{whiteSpace:"nowrap",fontSize:12}}>{r.ncr || "—"}</td>
                    <td><span className="pill" onClick={()=>durumDegistir(r)} title="Tıkla: durumu değiştir" style={{background:rk.b,color:rk.c,cursor:"pointer"}}>{r.durum || "—"}</span></td>
                    <td style={{maxWidth:260,fontSize:12.5}}>{r.ozet}</td>
                    <td style={{maxWidth:260,fontSize:12,color:"var(--ink2)"}}>{r.son_durum || ""}</td>
                    <td style={{whiteSpace:"nowrap"}}>
                      {r.dosya_url && <a href={r.dosya_url} target="_blank" rel="noreferrer" style={{marginRight:6}}>📎</a>}
                      <label style={{cursor:"pointer",fontSize:11,color:"var(--steel)",textDecoration:"underline"}}>
                        {r.dosya_url ? "değiştir" : "ekle"}
                        <input type="file" style={{display:"none"}} onChange={e=>dosyaYukle(r, e.target.files[0])}/>
                      </label>
                    </td>
                    <td><button onClick={()=>baslaDuzenle(r)} style={{fontSize:12,color:"var(--steel)",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Düzenle</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {gosterilen.length === 0 && <div style={{padding:20,color:"var(--ink3)",fontSize:13}}>Kayıt yok.</div>}
        </section>
        <p style={{fontSize:12,color:"var(--ink3)"}}>{gosterilen.length} kayıt gösteriliyor</p>
      </div>
    </>
  );
}

const inp = {width:"100%",marginTop:4,padding:"9px 11px",border:"1px solid #cbd3de",borderRadius:9,fontSize:13.5};
