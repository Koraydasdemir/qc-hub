"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Ust from "../../../components/Ust";

const DEPT_AD = {"01":"Kalite Kontrol","02":"Finance","03":"Accounting","04":"Technical Office",
  "05":"Procurement","06":"Legal Affairs","07":"Logistics & Customs","08":"Administrative"};
const bugun = () => new Date().toLocaleDateString("tr-TR");

const WORKFLOW = [
  { key: "sozlesme", ad: "Sözleşme", items: [
    { key: "sozlesme_techmp_spec", ad: "TECHMP–Tedarikçi Spec No" },
    { key: "sozlesme_isveren_spec", ad: "İşveren Spec No" },
    { key: "sozlesme_durum", ad: "Durum (Checking / Under Signature / Approved)" },
  ]},
  { key: "finans", ad: "Finans", items: [
    { key: "finans_advance", ad: "Advance Payment" },
    { key: "finans_2nd", ad: "2nd Payment" },
    { key: "finans_3rd", ad: "3rd Payment" },
  ]},
  { key: "proje", ad: "Proje", items: [
    { key: "proje_manuf_draft", ad: "Manufacturing Progress Report Draft" },
    { key: "proje_obs_draft", ad: "Observation Report Draft" },
    { key: "proje_visit_cal", ad: "Visit Calendar" },
    { key: "proje_spec_list", ad: "Specification Document List" },
  ]},
  { key: "kalite", ad: "Kalite Kontrol", items: [
    { key: "kalite_itp", ad: "ITP" },
    { key: "kalite_progress_haftalik", ad: "Haftalık Progress Report" },
    { key: "kalite_obs_haftalik", ad: "Haftalık Observation Report" },
    { key: "kalite_ncr_dof", ad: "NCR / DÖF Takip" },
    { key: "kalite_tq", ad: "TQ Takip" },
    { key: "kalite_ziyaret", ad: "Haftalık Ziyaret" },
    { key: "kalite_fat", ad: "FAT (Punch list)" },
    { key: "kalite_packing", ad: "Packing Durumu" },
  ]},
  { key: "disticaret", ad: "Dış Ticaret", items: [
    { key: "dt_before", ad: "Teslimat Öncesi Organizasyon" },
    { key: "dt_during", ad: "Teslimat Sırasında Organizasyon" },
    { key: "dt_completed", ad: "Teslimat Sonrası (Tamamlanan)" },
  ]},
];
const SONRAKI_DURUM = { grey: "green", green: "red", red: "grey" };
const DURUM_RENK = { grey: "#c7cdd6", green: "var(--ok)", red: "#d1352b" };
const DURUM_ETIKET = { grey: "Veri yok", green: "Tamam", red: "Tıkanıklık" };

export default function Spec({ params }) {
  const router = useRouter();
  const kod = params.kod;
  const [yukle, setYukle] = useState(true);
  const [me, setMe] = useState(null);
  const [p, setP] = useState(null);
  const [ekip, setEkip] = useState([]);
  const [ilerleme, setIlerleme] = useState({});
  const [konular, setKonular] = useState([]);
  const [yeniKonu, setYeniKonu] = useState("");
  const [yeniDept, setYeniDept] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [rEdit, setREdit] = useState(false);
  const [rForm, setRForm] = useState(null);
  const [rKaydet, setRKaydet] = useState(false);
  const [wItems, setWItems] = useState({});
  const [acikKat, setAcikKat] = useState({ sozlesme: true, finans: true, proje: true, kalite: true, disticaret: true });
  const [alarmlar, setAlarmlar] = useState([]);
  const [yeniAlarm, setYeniAlarm] = useState("");

  const bosOdemeler = () => ([
    { name: "Advance Payment", amount: "", paid: false },
    { name: "2nd Payment", amount: "", paid: false },
    { name: "3rd Payment", amount: "", paid: false },
  ]);

  async function yukleVeri() {
    const { data: proje } = await supabase.from("projects").select("*,suppliers(kod,ad)").eq("kod", kod).single();
    if (!proje) { setYukle(false); return; }
    const [e, t, r, w, al] = await Promise.all([
      supabase.from("equipment").select("*").eq("project_id", proje.id).order("id"),
      supabase.from("department_topics").select("*").eq("project_id", proje.id).order("dept_kod"),
      supabase.from("project_roadmap").select("*").eq("project_id", proje.id).maybeSingle(),
      supabase.from("workflow_items").select("*").eq("project_id", proje.id),
      supabase.from("critical_alerts").select("*").eq("project_id", proje.id).eq("aktif", true).order("created_at"),
    ]);
    const wMap = {};
    (w.data||[]).forEach(row => { wMap[row.item_key] = row; });
    setWItems(wMap);
    setAlarmlar(al.data||[]);
    const eqIds = (e.data||[]).map(x=>x.id);
    let prog = {};
    if (eqIds.length) {
      const { data: pr } = await supabase.from("equipment_progress").select("*").in("equipment_id", eqIds);
      (pr||[]).forEach(r => { (prog[r.equipment_id] = prog[r.equipment_id] || {})[r.asama] = r.durum; });
    }
    setP(proje); setEkip(e.data||[]);
    setIlerleme(prog); setKonular(t.data||[]);
    const rm = r.data || null;
    setRoadmap(rm);
    setRForm(rm ? { ...rm, payments: rm.payments?.length ? rm.payments : bosOdemeler(), custom_fields: rm.custom_fields || [] }
      : { spec_no: proje.spec_no || "", spec_date: "", contract_no: "", contract_date: "",
          equipment_cost: proje.bedel || "", materials: "", shipping: "", start_date: "", end_date: "",
          location: "", payments: bosOdemeler(), custom_fields: [] });
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

  function rAlanDegis(alan, deger) { setRForm({ ...rForm, [alan]: deger }); }
  function rOdemeDegis(i, alan, deger) {
    const yeni = [...rForm.payments];
    yeni[i] = { ...yeni[i], [alan]: deger };
    setRForm({ ...rForm, payments: yeni });
  }
  function rOdemeSil(i) {
    setRForm({ ...rForm, payments: rForm.payments.filter((_, idx) => idx !== i) });
  }
  function rOdemeEkle() {
    setRForm({ ...rForm, payments: [...rForm.payments, { name: (rForm.payments.length+1)+". Ödeme", amount: "", paid: false }] });
  }
  function rOzelAlanDegis(i, alan, deger) {
    const yeni = [...rForm.custom_fields];
    yeni[i] = { ...yeni[i], [alan]: deger };
    setRForm({ ...rForm, custom_fields: yeni });
  }
  function rOzelAlanSil(i) {
    setRForm({ ...rForm, custom_fields: rForm.custom_fields.filter((_, idx) => idx !== i) });
  }
  function rOzelAlanEkle() {
    setRForm({ ...rForm, custom_fields: [...rForm.custom_fields, { label: "", value: "" }] });
  }
  async function rKaydetGonder() {
    setRKaydet(true); setMesaj("Kaydediliyor...");
    const payload = {
      project_id: p.id,
      spec_no: rForm.spec_no || null, spec_date: rForm.spec_date || null,
      contract_no: rForm.contract_no || null, contract_date: rForm.contract_date || null,
      equipment_cost: rForm.equipment_cost || null, materials: rForm.materials || null,
      shipping: rForm.shipping || null, start_date: rForm.start_date || null, end_date: rForm.end_date || null,
      location: rForm.location || null, payments: rForm.payments, custom_fields: rForm.custom_fields,
      updated_at: new Date().toISOString(), updated_by: me?.ad_soyad || null,
    };
    const { error } = await supabase.from("project_roadmap").upsert(payload, { onConflict: "project_id" });
    setRKaydet(false);
    if (error) { setMesaj("Hata: " + error.message); return; }
    setMesaj(""); setREdit(false); await yukleVeri();
  }

  async function durumDegistir(itemKey) {
    if (!me?.admin) return;
    const mevcut = wItems[itemKey]?.status || "grey";
    const yeni = SONRAKI_DURUM[mevcut] || "grey";
    const { error } = await supabase.from("workflow_items").upsert({
      project_id: p.id, item_key: itemKey, status: yeni,
      updated_at: new Date().toISOString(), updated_by: me?.ad_soyad || null,
    }, { onConflict: "project_id,item_key" });
    if (error) { setMesaj("Hata: " + error.message); return; }
    await yukleVeri();
  }
  function katToggle(katKey) { setAcikKat({ ...acikKat, [katKey]: !acikKat[katKey] }); }

  async function alarmEkle() {
    if (!yeniAlarm.trim()) return;
    const { error } = await supabase.from("critical_alerts").insert({
      project_id: p.id, metin: yeniAlarm.trim(), giren: me?.ad_soyad || null, tarih: bugun(), aktif: true,
    });
    if (error) { setMesaj("Hata: " + error.message); return; }
    setYeniAlarm(""); await yukleVeri();
  }
  async function alarmKaldir(a) {
    const { error } = await supabase.from("critical_alerts").update({ aktif: false }).eq("id", a.id);
    if (!error) await yukleVeri();
  }
  const alarmYetkili = me && (me.admin || true); // tüm departmanlar görebilir/ekleyebilir; kapatma yetkisi admin+giren kişide
  const alarmKaldirYetkili = (a) => me && (me.admin || a.giren === me.ad_soyad);

  return (
    <>
      <Ust/>
      <div className="wrap">
        <a href="/" style={{fontSize:13}}>← Ana ekran</a>
        <h1 style={{marginTop:10}}>{p.suppliers?.ad} — {p.ad}</h1>
        <div style={{fontSize:13,color:"var(--ink2)"}}>Spec {p.spec_no} · aşama: {p.asama} {p.bedel?"· "+p.bedel:""}</div>
        {mesaj && <div style={{marginTop:8,fontSize:13,color: mesaj.startsWith("Hata")?"#b3261e":"var(--ink2)"}}>{mesaj}</div>}

        {alarmlar.length>0 && (
          <section style={{marginTop:16,border:"1px solid #d1352b",borderRadius:12,padding:14,background:"#fff5f4"}}>
            <h2 style={{margin:0,color:"#b3261e"}}>⚠ Kritik konular / Uyarılar</h2>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:10}}>
              {alarmlar.map(a => (
                <div key={a.id} className="alarm-blink" style={{display:"flex",alignItems:"center",gap:10,fontSize:13.5}}>
                  <span style={{flex:1}}>{a.metin}</span>
                  <span style={{fontSize:11,color:"#8b3a34"}}>{a.giren}{a.tarih?" · "+a.tarih:""}</span>
                  {alarmKaldirYetkili(a) && (
                    <button onClick={()=>alarmKaldir(a)} style={{border:"1px solid #f0b9b5",color:"#b3261e",borderRadius:8,background:"#fff",cursor:"pointer",padding:"3px 9px",fontSize:11}}>Kapat</button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={{marginTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <h2 style={{margin:0}}>Kritik konu ekle</h2>
          </div>
          <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
            <input value={yeniAlarm} onChange={e=>setYeniAlarm(e.target.value)} placeholder="Uyarı / kritik konu yazın..."
              onKeyDown={e=>{if(e.key==="Enter")alarmEkle();}}
              style={{flex:1,minWidth:220,padding:"9px 12px",border:"1px solid #cbd3de",borderRadius:10,fontSize:13.5}}/>
            <button onClick={alarmEkle} className="arac-btn" style={{fontSize:13.5,padding:"9px 20px",background:"#b3261e"}}>+ Ekle</button>
          </div>
        </section>

        <section style={{marginTop:16}}>
          <h2>İş akışı</h2>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:10}}>
            {WORKFLOW.map(kat => (
              <div key={kat.key} style={{border:"1px solid var(--line)",borderRadius:12,overflow:"hidden"}}>
                <div onClick={()=>katToggle(kat.key)}
                  style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#f4f6f9",cursor:"pointer"}}>
                  <b style={{fontSize:14}}>{kat.ad}</b>
                  <span style={{fontSize:12,color:"var(--ink3)"}}>{acikKat[kat.key] ? "▲ Kapat" : "▼ Aç"}</span>
                </div>
                {acikKat[kat.key] && (
                  <div style={{padding:"10px 14px",display:"flex",flexDirection:"column",gap:8}}>
                    {kat.items.map(it => {
                      const durum = wItems[it.key]?.status || "grey";
                      return (
                        <div key={it.key} style={{display:"flex",alignItems:"center",gap:10,fontSize:13}}>
                          <span
                            onClick={()=>durumDegistir(it.key)}
                            className={durum==="red" ? "durum-nokta blink" : "durum-nokta"}
                            title={me?.admin ? "Tıkla: durumu değiştir" : DURUM_ETIKET[durum]}
                            style={{width:12,height:12,borderRadius:"50%",background:DURUM_RENK[durum],
                              cursor: me?.admin ? "pointer" : "default", flexShrink:0}}
                          />
                          <span style={{flex:1}}>{it.ad}</span>
                          <span style={{fontSize:11,color:"var(--ink3)"}}>{DURUM_ETIKET[durum]}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:"var(--ink3)",marginTop:8}}>gri = veri yok · yeşil = tamam · kırmızı (yanıp söner) = tıkanıklık · admin noktaya tıklayarak durumu değiştirebilir</div>
          <style jsx>{`
            .blink { animation: blinkAnim 1s infinite; }
            @keyframes blinkAnim { 0%,100%{opacity:1;} 50%{opacity:0.25;} }
            .alarm-blink { animation: rowBlink 1.4s infinite; }
            @keyframes rowBlink { 0%,100%{opacity:1;} 50%{opacity:0.55;} }
          `}</style>
        </section>

        <section style={{marginTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <h2 style={{margin:0}}>Project Roadmap</h2>
            {me?.admin && (
              <button className="arac-btn" style={{fontSize:12.5,padding:"7px 14px"}}
                onClick={()=> rEdit ? setREdit(false) : setREdit(true)}>
                {rEdit ? "İptal" : "Düzenle"}
              </button>
            )}
          </div>

          {!rEdit && (
            <div className="grid" style={{marginTop:10}}>
              <div className="dept"><b>Spesifikasyon No / Tarihi</b><div style={{fontSize:13,marginTop:4}}>{roadmap?.spec_no || p.spec_no || "-"} {roadmap?.spec_date ? "· "+roadmap.spec_date : ""}</div></div>
              <div className="dept"><b>Sözleşme No / Tarihi</b><div style={{fontSize:13,marginTop:4}}>{roadmap?.contract_no || "-"} {roadmap?.contract_date ? "· "+roadmap.contract_date : ""}</div></div>
              <div className="dept"><b>Ekipman Bedeli</b><div style={{fontSize:13,marginTop:4}}>{roadmap?.equipment_cost || "-"}</div></div>
              <div className="dept"><b>Malzeme Listesi</b><div style={{fontSize:13,marginTop:4}}>{roadmap?.materials || "-"}</div></div>
              <div className="dept"><b>Sevkiyat</b><div style={{fontSize:13,marginTop:4}}>{roadmap?.shipping || "-"}</div></div>
              <div className="dept"><b>Başlangıç / Bitiş</b><div style={{fontSize:13,marginTop:4}}>{roadmap?.start_date || "-"} → {roadmap?.end_date || "-"}</div></div>
              <div className="dept"><b>Lokasyon</b><div style={{fontSize:13,marginTop:4}}>{roadmap?.location || "-"}</div></div>
              {(roadmap?.custom_fields||[]).map((c,i)=>(
                <div className="dept" key={i}><b>{c.label || "Ek alan"}</b><div style={{fontSize:13,marginTop:4}}>{c.value || "-"}</div></div>
              ))}
              <div className="dept">
                <b>Ödemeler</b>
                {(roadmap?.payments||[]).length===0 && <div style={{fontSize:12.5,color:"var(--ink3)",marginTop:4}}>Tanımlı değil</div>}
                {(roadmap?.payments||[]).map((pay,i)=>(
                  <div key={i} style={{fontSize:12.5,marginTop:4,display:"flex",justifyContent:"space-between"}}>
                    <span>{pay.name}</span><span style={{color: pay.paid ? "var(--ok)" : "var(--ink3)"}}>{pay.amount || "-"}{pay.paid ? " ✓" : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rEdit && rForm && (
            <div style={{marginTop:12,border:"1px solid var(--line)",borderRadius:12,padding:16}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
                <div><label style={{fontSize:12,color:"#586173",fontWeight:600}}>Spesifikasyon No</label>
                  <input value={rForm.spec_no||""} onChange={e=>rAlanDegis("spec_no",e.target.value)} style={{width:"100%",marginTop:5,padding:"9px 11px",border:"1px solid #cbd3de",borderRadius:9,fontSize:13.5}}/></div>
                <div><label style={{fontSize:12,color:"#586173",fontWeight:600}}>Spesifikasyon Tarihi</label>
                  <input type="date" value={rForm.spec_date||""} onChange={e=>rAlanDegis("spec_date",e.target.value)} style={{width:"100%",marginTop:5,padding:"9px 11px",border:"1px solid #cbd3de",borderRadius:9,fontSize:13.5}}/></div>
                <div><label style={{fontSize:12,color:"#586173",fontWeight:600}}>Sözleşme No</label>
                  <input value={rForm.contract_no||""} onChange={e=>rAlanDegis("contract_no",e.target.value)} style={{width:"100%",marginTop:5,padding:"9px 11px",border:"1px solid #cbd3de",borderRadius:9,fontSize:13.5}}/></div>
                <div><label style={{fontSize:12,color:"#586173",fontWeight:600}}>Sözleşme Tarihi</label>
                  <input type="date" value={rForm.contract_date||""} onChange={e=>rAlanDegis("contract_date",e.target.value)} style={{width:"100%",marginTop:5,padding:"9px 11px",border:"1px solid #cbd3de",borderRadius:9,fontSize:13.5}}/></div>
                <div><label style={{fontSize:12,color:"#586173",fontWeight:600}}>Ekipman Bedeli</label>
                  <input value={rForm.equipment_cost||""} onChange={e=>rAlanDegis("equipment_cost",e.target.value)} style={{width:"100%",marginTop:5,padding:"9px 11px",border:"1px solid #cbd3de",borderRadius:9,fontSize:13.5}}/></div>
                <div><label style={{fontSize:12,color:"#586173",fontWeight:600}}>Sevkiyat türü/şekli</label>
                  <input value={rForm.shipping||""} onChange={e=>rAlanDegis("shipping",e.target.value)} style={{width:"100%",marginTop:5,padding:"9px 11px",border:"1px solid #cbd3de",borderRadius:9,fontSize:13.5}}/></div>
                <div><label style={{fontSize:12,color:"#586173",fontWeight:600}}>İş Başlangıç Tarihi</label>
                  <input type="date" value={rForm.start_date||""} onChange={e=>rAlanDegis("start_date",e.target.value)} style={{width:"100%",marginTop:5,padding:"9px 11px",border:"1px solid #cbd3de",borderRadius:9,fontSize:13.5}}/></div>
                <div><label style={{fontSize:12,color:"#586173",fontWeight:600}}>İş Bitiş Tarihi</label>
                  <input type="date" value={rForm.end_date||""} onChange={e=>rAlanDegis("end_date",e.target.value)} style={{width:"100%",marginTop:5,padding:"9px 11px",border:"1px solid #cbd3de",borderRadius:9,fontSize:13.5}}/></div>
                <div><label style={{fontSize:12,color:"#586173",fontWeight:600}}>Lokasyon</label>
                  <input value={rForm.location||""} onChange={e=>rAlanDegis("location",e.target.value)} style={{width:"100%",marginTop:5,padding:"9px 11px",border:"1px solid #cbd3de",borderRadius:9,fontSize:13.5}}/></div>
              </div>
              <div style={{marginTop:12}}>
                <label style={{fontSize:12,color:"#586173",fontWeight:600}}>Malzeme Listesi</label>
                <textarea value={rForm.materials||""} onChange={e=>rAlanDegis("materials",e.target.value)} rows={3}
                  style={{width:"100%",marginTop:5,padding:"9px 11px",border:"1px solid #cbd3de",borderRadius:9,fontSize:13.5}}/>
              </div>

              <div style={{marginTop:16,borderTop:"1px solid var(--line)",paddingTop:12}}>
                <label style={{fontSize:12,color:"#586173",fontWeight:600}}>Ödemeler</label>
                {rForm.payments.map((pay,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginTop:6,alignItems:"center",flexWrap:"wrap"}}>
                    <input value={pay.name} onChange={e=>rOdemeDegis(i,"name",e.target.value)} placeholder="Ödeme adı"
                      style={{flex:1,minWidth:140,padding:"7px 10px",border:"1px solid #cbd3de",borderRadius:8,fontSize:13}}/>
                    <input value={pay.amount} onChange={e=>rOdemeDegis(i,"amount",e.target.value)} placeholder="Tutar"
                      style={{width:120,padding:"7px 10px",border:"1px solid #cbd3de",borderRadius:8,fontSize:13}}/>
                    <label style={{fontSize:12,display:"flex",alignItems:"center",gap:4}}>
                      <input type="checkbox" checked={!!pay.paid} onChange={e=>rOdemeDegis(i,"paid",e.target.checked)}/> Ödendi
                    </label>
                    <button onClick={()=>rOdemeSil(i)} style={{border:"1px solid #f0b9b5",color:"#b3261e",borderRadius:8,background:"#fff",cursor:"pointer",padding:"5px 9px",fontSize:12}}>✕</button>
                  </div>
                ))}
                <button onClick={rOdemeEkle} className="arac-btn" style={{fontSize:12.5,padding:"6px 12px",marginTop:8}}>+ Ödeme ekle</button>
              </div>

              <div style={{marginTop:16,borderTop:"1px solid var(--line)",paddingTop:12}}>
                <label style={{fontSize:12,color:"#586173",fontWeight:600}}>Ek Başlıklar (manuel)</label>
                {rForm.custom_fields.map((c,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                    <input value={c.label} onChange={e=>rOzelAlanDegis(i,"label",e.target.value)} placeholder="Başlık"
                      style={{width:180,padding:"7px 10px",border:"1px solid #cbd3de",borderRadius:8,fontSize:13}}/>
                    <input value={c.value} onChange={e=>rOzelAlanDegis(i,"value",e.target.value)} placeholder="Değer"
                      style={{flex:1,minWidth:160,padding:"7px 10px",border:"1px solid #cbd3de",borderRadius:8,fontSize:13}}/>
                    <button onClick={()=>rOzelAlanSil(i)} style={{border:"1px solid #f0b9b5",color:"#b3261e",borderRadius:8,background:"#fff",cursor:"pointer",padding:"5px 9px",fontSize:12}}>✕</button>
                  </div>
                ))}
                <button onClick={rOzelAlanEkle} className="arac-btn" style={{fontSize:12.5,padding:"6px 12px",marginTop:8}}>+ Başlık ekle</button>
              </div>

              <div style={{marginTop:16,display:"flex",gap:10}}>
                <button onClick={rKaydetGonder} disabled={rKaydet} className="arac-btn" style={{fontSize:13.5,padding:"9px 20px",background:"#0f7a5f"}}>
                  {rKaydet ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          )}
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
