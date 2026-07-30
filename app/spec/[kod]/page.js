"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Ust from "../../../components/Ust";

const DEPT_AD = {"01":"Kalite Kontrol","02":"Finance","03":"Accounting","04":"Technical Office",
  "05":"Procurement","06":"Legal Affairs","07":"Logistics & Customs","08":"Administrative"};
const bugun = () => new Date().toLocaleDateString("tr-TR");

export default function Spec({ params }) {
  const router = useRouter();
  const kod = params.kod;
  const [yukle, setYukle] = useState(true);
  const [me, setMe] = useState(null);
  const [p, setP] = useState(null);
  const [gates, setGates] = useState([]);
  const [dongu, setDongu] = useState([]);
  const [ekip, setEkip] = useState([]);
  const [ilerleme, setIlerleme] = useState({});
  const [konular, setKonular] = useState([]);
  const [yeniKonu, setYeniKonu] = useState("");
  const [yeniDept, setYeniDept] = useState("");
  const [mesaj, setMesaj] = useState("");

  async function yukleVeri() {
    const { data: proje } = await supabase.from("projects").select("*,suppliers(kod,ad)").eq("kod", kod).single();
    if (!proje) { setYukle(false); return; }
    const [g, l, e, t] = await Promise.all([
      supabase.from("payment_gates").select("*").eq("project_id", proje.id).order("sira"),
      supabase.from("lifecycle_stages").select("*").eq("project_id", proje.id).order("sira"),
      supabase.from("equipment").select("*").eq("project_id", proje.id).order("id"),
      supabase.from("department_topics").select("*").eq("project_id", proje.id).order("dept_kod"),
    ]);
    const eqIds = (e.data||[]).map(x=>x.id);
    let prog = {};
    if (eqIds.length) {
      const { data: pr } = await supabase.from("equipment_progress").select("*").in("equipment_id", eqIds);
      (pr||[]).forEach(r => { (prog[r.equipment_id] = prog[r.equipment_id] || {})[r.asama] = r.durum; });
    }
    setP(proje); setGates(g.data||[]); setDongu(l.data||[]); setEkip(e.data||[]);
    setIlerleme(prog); setKonular(t.data||[]);
  }

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data: prof } = await supabase.from("profiles").select("ad_soyad,dept_kod,admin").eq("id", session.user.id).single();
      setMe(prof); setYeniDept(prof?.dept_kod || "01");
      await yukleVeri();
      setYukle(false);
    })();
  }, [kod]);

  if (yukle) return <><Ust/><div className="wrap">Yükleniyor...</div></>;
  if (!p) return <><Ust/><div className="wrap"><a href="/">← Ana ekran</a><p>Proje bulunamadı.</p></div></>;

  const finansMi = me && (me.admin || ["02","03"].includes(me.dept_kod));
  const asamalar = ["Satın alma","Döküm/Hammadde","İmalat","Talaşlı imalat","Boya/Son işlem","Hazır"];
  const konuGrup = {};
  konular.forEach(k => (konuGrup[k.dept_kod] = konuGrup[k.dept_kod] || []).push(k));
  const yazabilirDept = (dk) => me && (me.admin || me.dept_kod === dk);

  async function konuEkle() {
    if (!yeniKonu.trim()) return;
    setMesaj("Ekleniyor...");
    const { error } = await supabase.from("department_topics").insert({
      project_id: p.id, dept_kod: yeniDept, baslik: yeniKonu.trim(),
      durum: "acik", giren: me.ad_soyad, tarih: bugun(),
    });
    if (error) { setMesaj("Hata: " + error.message); return; }
    setYeniKonu(""); setMesaj(""); await yukleVeri();
  }
  async function konuToggle(k) {
    if (!yazabilirDept(k.dept_kod)) return;
    const yeni = k.durum === "tamam" ? "acik" : "tamam";
    const { error } = await supabase.from("department_topics").update({ durum: yeni }).eq("id", k.id);
    if (!error) await yukleVeri();
  }

  async function dekontYukle(gate, file) {
    if (!file) return;
    setMesaj("Dekont yükleniyor...");
    const path = p.kod + "/kapi" + gate.id + "_" + Date.now() + "_" + file.name.replace(/[^\w.\-]/g,"_");
    const { error: upErr } = await supabase.storage.from("dekont").upload(path, file, { upsert:false });
    if (upErr) { setMesaj("Hata: " + upErr.message); return; }
    const { data: pub } = supabase.storage.from("dekont").getPublicUrl(path);
    const { error } = await supabase.from("payment_gates").update({
      dekont_url: pub.publicUrl, dekont_tarihi: bugun(), durum: "dekont yüklendi", acan: me.ad_soyad,
    }).eq("id", gate.id);
    if (error) { setMesaj("Hata: " + error.message); return; }
    setMesaj(""); await yukleVeri();
  }
  async function kapiOnayla(gate) {
    if (!me?.admin) return;
    const { error } = await supabase.from("payment_gates").update({ durum: "açık", acilma_tarihi: bugun() }).eq("id", gate.id);
    if (!error) await yukleVeri();
  }

  return (
    <>
      <Ust/>
      <div className="wrap">
        <a href="/" style={{fontSize:13}}>← Ana ekran</a>
        <h1 style={{marginTop:10}}>{p.suppliers?.ad} — {p.ad}</h1>
        <div style={{fontSize:13,color:"var(--ink2)"}}>Spec {p.spec_no} · aşama: {p.asama} {p.bedel?"· "+p.bedel:""}</div>
        {mesaj && <div style={{marginTop:8,fontSize:13,color: mesaj.startsWith("Hata")?"#b3261e":"var(--ink2)"}}>{mesaj}</div>}

        <section style={{marginTop:16}}>
          <h2>Yaşam döngüsü</h2>
          <div className="yasam">
            {dongu.map((a,i) => (
              <span key={a.id} style={{display:"flex",alignItems:"center",gap:5}}>
                <span className={"asm "+(a.durum||"")}>{a.ad}</span>
                {i<dongu.length-1 && <span style={{color:"#c3c9d4"}}>›</span>}
              </span>
            ))}
          </div>
          <div style={{fontSize:11,color:"var(--ink3)",marginTop:4}}>yeşil = tamam · sarı = devam · kırmızı (yanıp söner) = tıkanıklık</div>
        </section>

        <section>
          <h2>Ödeme kapıları</h2>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {gates.map(g => {
              const st = g.durum==="açık" ? {background:"var(--okbg)",color:"var(--ok)"}
                : g.durum==="dekont yüklendi" ? {background:"var(--warnbg)",color:"var(--warn)"}
                : {background:"#edeff3",color:"#8b94a4"};
              return (
                <div key={g.id} style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",borderBottom:"1px solid var(--line)",paddingBottom:10}}>
                  <span className="pill" style={{...st}}>{g.ad} — {g.durum}</span>
                  {g.dekont_url && <a href={g.dekont_url} target="_blank" rel="noreferrer" style={{fontSize:12.5}}>📎 dekont {g.dekont_tarihi?"("+g.dekont_tarihi+")":""}</a>}
                  {g.acan && <span style={{fontSize:12,color:"var(--ink3)"}}>yükleyen: {g.acan}</span>}
                  {g.durum==="açık" && g.acilma_tarihi && <span style={{fontSize:12,color:"var(--ok)"}}>onay: {g.acilma_tarihi}</span>}
                  <span style={{flex:1}}></span>
                  {finansMi && g.durum==="bekliyor" && (
                    <label className="arac-btn" style={{cursor:"pointer",fontSize:13,padding:"8px 16px"}}>
                      Dekont yükle
                      <input type="file" style={{display:"none"}} onChange={e=>dekontYukle(g, e.target.files[0])}/>
                    </label>
                  )}
                  {me?.admin && g.durum==="dekont yüklendi" && (
                    <button onClick={()=>kapiOnayla(g)} className="arac-btn" style={{background:"#0f7a5f",fontSize:13,padding:"8px 16px"}}>✓ Onayla (kapıyı aç)</button>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{fontSize:11,color:"var(--ink3)",marginTop:8}}>Dekont yükleme: Finans/Muhasebe & admin · Onay: yalnızca admin</div>
        </section>

        {ekip.length>0 && (
          <section>
            <h2>Ekipman ilerlemesi</h2>
            <div style={{overflowX:"auto"}}>
              <table>
                <thead><tr><th>Ekipman</th>{asamalar.map(a=><th key={a} style={{textAlign:"center",fontSize:11}}>{a}</th>)}</tr></thead>
                <tbody>
                  {ekip.map(e => (
                    <tr key={e.id}>
                      <td>{e.ad}</td>
                      {asamalar.map(a => {
                        const d = (ilerleme[e.id]||{})[a];
                        return <td key={a} style={{textAlign:"center",
                          background:d==="tamam"?"var(--okbg)":d==="devam"?"var(--warnbg)":"transparent",
                          color:d==="tamam"?"var(--ok)":d==="devam"?"var(--warn)":"#ccc",fontWeight:600}}>
                          {d==="tamam"?"✓":d==="devam"?"◑":"·"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section>
          <h2>Departman durumu</h2>
          <div className="grid">
            {Object.keys(konuGrup).sort().map(dk => (
              <div key={dk} className="dept">
                <b>{dk} · {DEPT_AD[dk]}</b>
                {konuGrup[dk].map(k => (
                  <div key={k.id} onClick={()=>konuToggle(k)}
                    style={{fontSize:12.5,margin:"6px 0",color:k.durum==="tamam"?"var(--ok)":"#993c1d",
                      cursor: yazabilirDept(dk)?"pointer":"default"}}
                    title={yazabilirDept(dk)?"Tıkla: tamam/açık":""}>
                    {k.durum==="tamam"?"✓":"○"} {k.baslik}
                  </div>
                ))}
              </div>
            ))}
            {Object.keys(konuGrup).length===0 && <div style={{fontSize:13,color:"var(--ink3)"}}>Henüz departman konusu yok.</div>}
          </div>

          <div style={{marginTop:16,borderTop:"1px solid var(--line)",paddingTop:14}}>
            <label style={{fontSize:12.5,color:"#586173",fontWeight:600}}>Konu ekle</label>
            <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
              <select value={yeniDept} onChange={e=>setYeniDept(e.target.value)} disabled={!me?.admin}
                style={{padding:"9px 12px",border:"1px solid #cbd3de",borderRadius:10,fontSize:13.5}}
                title={me?.admin?"Departman seç":"Kendi departmanınız"}>
                {(me?.admin ? Object.keys(DEPT_AD) : [me?.dept_kod]).filter(Boolean).map(dk =>
                  <option key={dk} value={dk}>{dk} · {DEPT_AD[dk]}</option>)}
              </select>
              <input value={yeniKonu} onChange={e=>setYeniKonu(e.target.value)} placeholder="Yeni konu başlığı..."
                onKeyDown={e=>{if(e.key==="Enter")konuEkle();}}
                style={{flex:1,minWidth:200,padding:"9px 12px",border:"1px solid #cbd3de",borderRadius:10,fontSize:13.5}}/>
              <button onClick={konuEkle} className="arac-btn" style={{fontSize:13.5,padding:"9px 20px"}}>+ Ekle</button>
            </div>
            <div style={{fontSize:11,color:"var(--ink3)",marginTop:6}}>Sadece kendi departmanınıza ekleyebilirsiniz{me?.admin?" (admin: tümü)":""}. Eklenen konuya tıklayınca tamam/açık olur.</div>
          </div>
        </section>
      </div>
    </>
  );
}
