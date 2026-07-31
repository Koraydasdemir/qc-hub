"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Ust from "../../../components/Ust";

const DEPT_AD = {"01":"Kalite Kontrol","02":"Finance","03":"Accounting","04":"Technical Office",
  "05":"Procurement","06":"Legal Affairs","07":"Logistics & Customs","08":"Administrative"};
const bugun = () => new Date().toLocaleDateString("tr-TR");
const bugunISO = () => new Date().toISOString().slice(0,10);
function pazartesi() {
  const d = new Date();
  const gun = d.getDay();
  const fark = gun === 0 ? 6 : gun - 1;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - fark);
}

// tur: durum | metin | secim | odeme | dosya | dosya_haftalik | liste | ziyaret
const WORKFLOW = [
  { key: "sozlesme", ad: "Contract", items: [
    { key: "sozlesme_techmp_tedarikci", ad: "TECHMP – Supplier Spec No", tur: "metin" },
    { key: "sozlesme_techmp_isveren", ad: "TECHMP – Employer Spec No", tur: "metin" },
    { key: "sozlesme_durum", ad: "Status", tur: "secim", secenekler: ["Checking","Under Signature","Approved"] },
  ]},
  { key: "finans", ad: "Finance", items: [
    { key: "finans_advance", ad: "Advance Payment", tur: "odeme", odemeAdi: "Advance Payment" },
    { key: "finans_2nd", ad: "2nd Payment", tur: "odeme", odemeAdi: "2nd Payment" },
  ]},
  { key: "proje", ad: "Project", items: [
    { key: "proje_manuf_draft", ad: "Manufacturing Progress Report Draft", tur: "dosya" },
    { key: "proje_obs_draft", ad: "Observation Report Draft", tur: "dosya" },
    { key: "proje_visit_cal", ad: "Visit Calendar", tur: "dosya" },
    { key: "proje_spec_list", ad: "Specification Document List", tur: "dosya" },
  ]},
  { key: "kalite", ad: "Quality Control", items: [
    { key: "kalite_itp", ad: "ITP", tur: "dosya" },
    { key: "kalite_progress", ad: "Progress Report (weekly)", tur: "dosya_haftalik" },
    { key: "kalite_obs", ad: "Observation Report (weekly)", tur: "dosya_haftalik" },
    { key: "kalite_ncr_dof", ad: "NCR / DÖF", tur: "liste", liste: "ncr" },
    { key: "kalite_tq", ad: "TQ (Technical Query)", tur: "liste", liste: "tq" },
    { key: "kalite_ziyaret", ad: "Weekly Visit", tur: "ziyaret" },
    { key: "kalite_fat_punch", ad: "FAT – Punch list following", tur: "durum" },
    { key: "kalite_fat_completed", ad: "FAT – Completed", tur: "durum" },
    { key: "kalite_packing", ad: "Packing", tur: "durum" },
  ]},
  { key: "disticaret", ad: "Foreign Trade", items: [
    { key: "dt_before", ad: "Organizations before delivery", tur: "durum" },
    { key: "dt_during", ad: "Organizations while delivery", tur: "durum" },
    { key: "dt_completed", ad: "Organizations completed", tur: "durum" },
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
  const [acikKat, setAcikKat] = useState({});
  const [alarmlar, setAlarmlar] = useState([]);
  const [yeniAlarm, setYeniAlarm] = useState("");
  const [editors, setEditors] = useState([]);
  const [profilList, setProfilList] = useState([]);
  const [ncrTq, setNcrTq] = useState([]);
  const [customItems, setCustomItems] = useState([]);
  const [hiddenItems, setHiddenItems] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [teklifAcik, setTeklifAcik] = useState({});
  const [ncrForm, setNcrForm] = useState({});
  const [wEdits, setWEdits] = useState({});
  const [atamaAcikKat, setAtamaAcikKat] = useState(null);
  const [secAcik, setSecAcik] = useState({ isAkisi:true, roadmap:true, uretim:true, departman:true, kritik:true });
  function secToggle(k) { setSecAcik({ ...secAcik, [k]: !secAcik[k] }); }

  const bosOdemeler = () => ([
    { name: "Advance Payment", amount: "", paid: false },
    { name: "2nd Payment", amount: "", paid: false },
    { name: "3rd Payment", amount: "", paid: false },
  ]);

  async function yukleVeri() {
    const { data: proje } = await supabase.from("projects").select("*,suppliers(kod,ad)").eq("kod", kod).single();
    if (!proje) { setYukle(false); return; }
    const [e, t, r, w, al, ed, nt, ci, hi, pr] = await Promise.all([
      supabase.from("equipment").select("*").eq("project_id", proje.id).order("id"),
      supabase.from("department_topics").select("*").eq("project_id", proje.id).order("dept_kod"),
      supabase.from("project_roadmap").select("*").eq("project_id", proje.id).maybeSingle(),
      supabase.from("workflow_items").select("*").eq("project_id", proje.id),
      supabase.from("critical_alerts").select("*").eq("project_id", proje.id).eq("aktif", true).order("created_at"),
      supabase.from("spec_editors").select("*").eq("project_id", proje.id).order("created_at"),
      supabase.from("ncr_tq_items").select("*").eq("project_id", proje.id).order("created_at",{ascending:false}),
      supabase.from("workflow_custom_items").select("*").eq("project_id", proje.id).eq("aktif", true),
      supabase.from("workflow_hidden_items").select("*").eq("project_id", proje.id),
      supabase.from("workflow_proposals").select("*").eq("project_id", proje.id).eq("status","pending").order("created_at"),
    ]);
    const wMap = {};
    (w.data||[]).forEach(row => { wMap[row.item_key] = row; });
    setWItems(wMap);
    setAlarmlar(al.data||[]);
    setEditors(ed.data||[]);
    setNcrTq(nt.data||[]);
    setCustomItems(ci.data||[]);
    setHiddenItems((hi.data||[]).map(x=>x.item_key));
    setProposals(pr.data||[]);
    const eqIds = (e.data||[]).map(x=>x.id);
    let prog = {};
    if (eqIds.length) {
      const { data: prd } = await supabase.from("equipment_progress").select("*").in("equipment_id", eqIds);
      (prd||[]).forEach(row => { (prog[row.equipment_id] = prog[row.equipment_id] || {})[row.asama] = row.durum; });
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
      const { data: tumProfil } = await supabase.from("profiles").select("ad_soyad").order("ad_soyad");
      setProfilList(tumProfil||[]);
      await yukleVeri();
      setYukle(false);
    })();
  }, [kod]);

  if (yukle) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--ink3)",fontSize:14}}>Yükleniyor...</div>;
  if (!p) return <><Ust/><div className="wrap"><a href="/">← Ana ekran</a><p>Proje bulunamadı.</p></div></>;

  const asamalar = ["Satın alma","Döküm/Hammadde","İmalat","Talaşlı imalat","Boya/Son işlem","Hazır"];
  const konuGrup = {};
  konular.forEach(k => (konuGrup[k.dept_kod] = konuGrup[k.dept_kod] || []).push(k));
  const yazabilirDept = (dk) => me && (me.admin || me.dept_kod === dk);
  const yetkiliMi = !!(me && (me.admin || editors.some(e => e.ad_soyad === me.ad_soyad)));
  const yetkiliKat = (katKey) => !!(me && (me.admin || editors.some(e => e.ad_soyad === me.ad_soyad && e.kat_key === katKey)));
  const pzt = pazartesi();

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

  // ---- İş akışı yardımcıları ----
  async function wUpsert(itemKey, alanlar, sessiz) {
    const { error } = await supabase.from("workflow_items").upsert({
      project_id: p.id, item_key: itemKey, updated_at: new Date().toISOString(),
      updated_by: me?.ad_soyad || null, ...alanlar,
    }, { onConflict: "project_id,item_key" });
    if (error) { setMesaj("Hata: " + error.message); return; }
    if (!sessiz) await yukleVeri();
  }
  async function durumDegistir(itemKey) {
    if (!me?.admin) return;
    const mevcut = wItems[itemKey]?.status || "grey";
    await wUpsert(itemKey, { status: SONRAKI_DURUM[mevcut] || "grey" });
  }
  async function dosyaYuklWf(itemKey, file, katKey) {
    if (!file || !yetkiliKat(katKey)) return;
    setMesaj("Yükleniyor...");
    const path = p.kod + "/" + itemKey + "_" + Date.now() + "_" + file.name.replace(/[^\w.\-]/g,"_");
    const { error: upErr } = await supabase.storage.from("is-akisi").upload(path, file, { upsert:false });
    if (upErr) { setMesaj("Hata: " + upErr.message); return; }
    const { data: pub } = supabase.storage.from("is-akisi").getPublicUrl(path);
    await wUpsert(itemKey, { file_url: pub.publicUrl, file_tarih: bugunISO(), status: "green" });
    setMesaj("");
  }
  function odemeTutari(odemeAdi) {
    const pay = (roadmap?.payments||[]).find(x => (x.name||"").toLowerCase() === odemeAdi.toLowerCase());
    return pay?.amount || "";
  }
  async function katKaydet(kat) {
    const degisenler = kat.items.filter(it =>
      (it.tur==="metin" || it.tur==="secim" || it.tur==="ziyaret" || (it.tur==="odeme" && !odemeTutari(it.odemeAdi)))
      && wEdits[it.key] !== undefined
    );
    if (!degisenler.length) { setMesaj("Değişiklik yok."); return; }
    setMesaj("Kaydediliyor...");
    for (const it of degisenler) {
      const val = wEdits[it.key];
      if (it.tur === "secim") {
        await wUpsert(it.key, { text_value: val, status: val === "Approved" ? "green" : "grey" }, true);
      } else if (it.tur === "ziyaret") {
        await wUpsert(it.key, { text_value: JSON.stringify(val), status: val?.gelecek ? "green" : "grey" }, true);
      } else {
        await wUpsert(it.key, { text_value: val, status: val ? "green" : "grey" }, true);
      }
    }
    const kalan = { ...wEdits };
    degisenler.forEach(it => delete kalan[it.key]);
    setWEdits(kalan);
    setMesaj(""); await yukleVeri();
  }

  async function ncrTqEkle(tur, itemKeyKat) {
    const form = ncrForm[itemKeyKat] || {};
    if (!form.baslik?.trim()) return;
    setMesaj("Ekleniyor...");
    let dosya_url = null;
    if (form.file) {
      const path = p.kod + "/" + tur + "_" + Date.now() + "_" + form.file.name.replace(/[^\w.\-]/g,"_");
      const { error: upErr } = await supabase.storage.from("is-akisi").upload(path, form.file, { upsert:false });
      if (upErr) { setMesaj("Hata: " + upErr.message); return; }
      dosya_url = supabase.storage.from("is-akisi").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from("ncr_tq_items").insert({
      project_id: p.id, tur, baslik: form.baslik.trim(), dosya_url, durum: "acik", giren: me?.ad_soyad || null, tarih: bugun(),
    });
    if (error) { setMesaj("Hata: " + error.message); return; }
    setNcrForm({ ...ncrForm, [itemKeyKat]: { baslik: "", file: null } });
    setMesaj(""); await yukleVeri();
  }
  async function ncrTqKapat(item) {
    if (!yetkiliMi) return;
    const { error } = await supabase.from("ncr_tq_items").update({ durum: "kapali" }).eq("id", item.id);
    if (!error) await yukleVeri();
  }

  function katToggle(katKey) { setAcikKat({ ...acikKat, [katKey]: !acikKat[katKey] }); }

  async function alarmEkle() {
    if (!yeniAlarm.trim() || !yetkiliMi) return;
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
  const alarmKaldirYetkili = (a) => me && (me.admin || a.giren === me.ad_soyad);

  // ---- Personel atama (kategori bazlı) ----
  async function editorEkle(ad_soyad, katKey) {
    if (!me?.admin || !ad_soyad) return;
    const { error } = await supabase.from("spec_editors").insert({ project_id: p.id, ad_soyad, atayan: me.ad_soyad, kat_key: katKey });
    if (error) { setMesaj("Hata: " + error.message); return; }
    await yukleVeri();
  }
  async function editorSil(e) {
    if (!me?.admin) return;
    const { error } = await supabase.from("spec_editors").delete().eq("id", e.id);
    if (!error) await yukleVeri();
  }

  // ---- Alt başlık ekle/kaldır teklifleri ----
  async function teklifGonder(katKey, tip, itemKey, itemAd) {
    if (!yetkiliKat(katKey)) return;
    if (me?.admin) {
      if (tip === "add") {
        await supabase.from("workflow_custom_items").insert({ project_id: p.id, kat_key: katKey, item_key: "c_"+Date.now(), item_ad: itemAd });
      } else {
        await supabase.from("workflow_hidden_items").upsert({ project_id: p.id, item_key: itemKey }, { onConflict: "project_id,item_key" });
      }
      await yukleVeri(); return;
    }
    const { error } = await supabase.from("workflow_proposals").insert({
      project_id: p.id, kat_key: katKey, tip, item_key: itemKey || null, item_ad: itemAd || null, proposed_by: me?.ad_soyad || null,
    });
    if (error) { setMesaj("Hata: " + error.message); return; }
    setMesaj("Öneri Koray'ın onayına gönderildi."); await yukleVeri();
  }
  async function teklifKarar(t, onay) {
    if (!me?.admin) return;
    if (onay) {
      if (t.tip === "add") {
        await supabase.from("workflow_custom_items").insert({ project_id: p.id, kat_key: t.kat_key, item_key: "c_"+t.id, item_ad: t.item_ad });
      } else if (t.item_key) {
        await supabase.from("workflow_hidden_items").upsert({ project_id: p.id, item_key: t.item_key }, { onConflict: "project_id,item_key" });
      }
    }
    await supabase.from("workflow_proposals").update({ status: onay ? "approved" : "rejected" }).eq("id", t.id);
    await yukleVeri();
  }

  function renderItem(kat, it) {
    const row = wItems[it.key] || {};
    const durum = row.status || "grey";
    const yetkili = yetkiliKat(kat.key);
    const dot = (
      <span onClick={()=>durumDegistir(it.key)} className={durum==="red" ? "durum-nokta blink" : "durum-nokta"}
        title={me?.admin ? "Tıkla: durumu değiştir" : DURUM_ETIKET[durum]}
        style={{width:11,height:11,borderRadius:"50%",background:DURUM_RENK[durum],cursor:me?.admin?"pointer":"default",flexShrink:0}}/>
    );
    let govde = null;
    if (it.tur === "durum") {
      govde = <span style={{fontSize:11,color:"var(--ink3)"}}>{DURUM_ETIKET[durum]}</span>;
    } else if (it.tur === "metin") {
      const val = wEdits[it.key] !== undefined ? wEdits[it.key] : (row.text_value||"");
      govde = <input value={val} disabled={!yetkili} onChange={e=>setWEdits({...wEdits,[it.key]:e.target.value})}
        placeholder="Değer girin..." style={{fontSize:12.5,padding:"5px 8px",border:"1px solid #cbd3de",borderRadius:7,width:170}}/>;
    } else if (it.tur === "secim") {
      const val = wEdits[it.key] !== undefined ? wEdits[it.key] : (row.text_value||"");
      govde = <select value={val} disabled={!yetkili} onChange={e=>setWEdits({...wEdits,[it.key]:e.target.value})}
        style={{fontSize:12.5,padding:"5px 8px",border:"1px solid #cbd3de",borderRadius:7}}>
        <option value="">Seçiniz</option>
        {it.secenekler.map(s=><option key={s} value={s}>{s}</option>)}
      </select>;
    } else if (it.tur === "odeme") {
      const otomatik = odemeTutari(it.odemeAdi);
      const val = wEdits[it.key] !== undefined ? wEdits[it.key] : (row.text_value||"");
      govde = otomatik
        ? <span style={{fontSize:12.5}}>{otomatik} <span style={{color:"var(--ink3)",fontSize:10.5}}>(Roadmap)</span></span>
        : <input value={val} disabled={!yetkili} onChange={e=>setWEdits({...wEdits,[it.key]:e.target.value})}
            placeholder="Tutar (manuel)" style={{fontSize:12.5,padding:"5px 8px",border:"1px solid #cbd3de",borderRadius:7,width:140}}/>;
    } else if (it.tur === "dosya" || it.tur === "dosya_haftalik") {
      const stale = it.tur === "dosya_haftalik" && (!row.file_tarih || new Date(row.file_tarih) < pzt);
      govde = (
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          {row.file_url && <a href={row.file_url} target="_blank" rel="noreferrer" style={{fontSize:12}}>📎 dosya {row.file_tarih?("("+row.file_tarih+")"):""}</a>}
          {stale && <span style={{fontSize:11,color:"#b3261e",fontWeight:600}}>Güncel değil</span>}
          {yetkili && (
            <label className="arac-btn" style={{cursor:"pointer",fontSize:11.5,padding:"4px 10px"}}>
              Yükle
              <input type="file" style={{display:"none"}} onChange={e=>dosyaYuklWf(it.key, e.target.files[0], kat.key)}/>
            </label>
          )}
        </div>
      );
    } else if (it.tur === "ziyaret") {
      let mevcut = {}; try { mevcut = JSON.parse(row.text_value||"{}"); } catch(e) {}
      const val = wEdits[it.key] !== undefined ? wEdits[it.key] : mevcut;
      govde = (
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",fontSize:12}}>
          <span>Son: <input type="date" value={val.son||""} disabled={!yetkili}
            onChange={e=>setWEdits({...wEdits,[it.key]:{ son:e.target.value, gelecek: val.gelecek||"" }})}
            style={{fontSize:12,padding:"3px 6px",border:"1px solid #cbd3de",borderRadius:6}}/></span>
          <span>Sonraki: <input type="date" value={val.gelecek||""} disabled={!yetkili}
            onChange={e=>setWEdits({...wEdits,[it.key]:{ son: val.son||"", gelecek:e.target.value }})}
            style={{fontSize:12,padding:"3px 6px",border:"1px solid #cbd3de",borderRadius:6}}/></span>
        </div>
      );
    } else if (it.tur === "liste") {
      const acik = ncrTq.filter(x => x.tur===it.liste || (it.liste==="ncr" && x.tur==="dof"));
      const acikOnly = acik.filter(x=>x.durum==="acik");
      const formKey = it.key;
      const f = ncrForm[formKey] || {};
      govde = (
        <div style={{display:"flex",flexDirection:"column",gap:6,width:"100%"}}>
          {acikOnly.length===0 && <span style={{fontSize:11.5,color:"var(--ink3)"}}>Açık kayıt yok</span>}
          {acikOnly.map(x => (
            <div key={x.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
              <span style={{textTransform:"uppercase",fontSize:10,fontWeight:700,color:"#a9721a"}}>{x.tur}</span>
              {x.dosya_url ? <a href={x.dosya_url} target="_blank" rel="noreferrer">{x.baslik}</a> : <span>{x.baslik}</span>}
              <span style={{color:"var(--ink3)",fontSize:10.5}}>{x.tarih}</span>
              {yetkili && <button onClick={()=>ncrTqKapat(x)} style={{fontSize:10.5,border:"1px solid #cbd3de",borderRadius:6,background:"#fff",cursor:"pointer",padding:"2px 6px"}}>Kapat</button>}
            </div>
          ))}
          {yetkili && (
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:2}}>
              {it.liste==="ncr" && (
                <select value={f.tur||"ncr"} onChange={e=>setNcrForm({...ncrForm,[formKey]:{...f,tur:e.target.value}})}
                  style={{fontSize:11.5,padding:"4px 6px",border:"1px solid #cbd3de",borderRadius:6}}>
                  <option value="ncr">NCR</option><option value="dof">DÖF</option>
                </select>
              )}
              <input value={f.baslik||""} onChange={e=>setNcrForm({...ncrForm,[formKey]:{...f,baslik:e.target.value}})}
                placeholder={it.liste==="tq"?"TQ başlığı":"NCR/DÖF başlığı"} style={{fontSize:11.5,padding:"4px 6px",border:"1px solid #cbd3de",borderRadius:6,minWidth:120}}/>
              <label className="arac-btn" style={{cursor:"pointer",fontSize:11,padding:"4px 9px"}}>
                Dosya
                <input type="file" style={{display:"none"}} onChange={e=>setNcrForm({...ncrForm,[formKey]:{...f,file:e.target.files[0]}})}/>
              </label>
              <button onClick={()=>ncrTqEkle(it.liste==="ncr" ? (f.tur||"ncr") : "tq", formKey)} className="arac-btn" style={{fontSize:11,padding:"4px 10px"}}>+ Oluştur</button>
            </div>
          )}
        </div>
      );
    }
    return (
      <div key={it.key} style={{display:"flex",alignItems:"center",gap:10,fontSize:13,flexWrap:"wrap",borderBottom:"1px dashed var(--line)",paddingBottom:8}}>
        {dot}
        <span style={{minWidth:170,fontWeight:500}}>{it.ad}</span>
        <span style={{flex:1,display:"flex",alignItems:"center"}}>{govde}</span>
        {yetkili && (
          <button onClick={()=>{
            const ad = prompt("Kaldırma nedeni / not (opsiyonel):", "");
            if (ad===null) return;
            teklifGonder(kat.key, "remove", it.key, it.ad);
          }} title="Bu başlığı kaldırmayı öner" style={{fontSize:10,border:"none",background:"transparent",color:"#b3261e",cursor:"pointer",opacity:.6}}>✕</button>
        )}
      </div>
    );
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
          <div onClick={()=>secToggle("isAkisi")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
            <h2 style={{margin:0}}>İş akışı</h2>
            <span style={{fontSize:13,color:"var(--ink3)"}}>{secAcik.isAkisi ? "▲ Kapat" : "▼ Aç"}</span>
          </div>
          {secAcik.isAkisi && <div style={{zoom:0.95}}>
          <p style={{fontSize:12,color:"var(--ink3)",margin:"4px 0 0"}}>Her kategori kartının üstünde o kategoriden sorumlu kişi(ler) görünür — atamak için 👤 simgesine tıklayın (yalnızca admin).</p>

          {me?.admin && proposals.length>0 && (
            <div style={{marginTop:10,border:"1px solid #f0c96b",background:"#fffaf0",borderRadius:10,padding:12}}>
              <div style={{fontSize:12,fontWeight:600,color:"#8a6416",marginBottom:6}}>Onay bekleyen öneriler</div>
              {proposals.map(t => (
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:12.5,marginBottom:6,flexWrap:"wrap"}}>
                  <span>{t.tip==="add"?"+ Ekle":"✕ Kaldır"}: <b>{t.item_ad || t.item_key}</b> ({WORKFLOW.find(k=>k.key===t.kat_key)?.ad}) — {t.proposed_by}</span>
                  <button onClick={()=>teklifKarar(t,true)} className="arac-btn" style={{fontSize:11,padding:"3px 9px",background:"#0f7a5f"}}>Onayla</button>
                  <button onClick={()=>teklifKarar(t,false)} style={{fontSize:11,padding:"3px 9px",border:"1px solid #cbd3de",borderRadius:7,background:"#fff",cursor:"pointer"}}>Reddet</button>
                </div>
              ))}
            </div>
          )}

          <div style={{display:"flex",gap:14,marginTop:12,flexWrap:"wrap",alignItems:"flex-start"}}>
            {WORKFLOW.map(kat => {
              const ozelBu = customItems.filter(c=>c.kat_key===kat.key);
              const gorunenItems = kat.items.filter(it=>!hiddenItems.includes(it.key));
              const katEditors = editors.filter(e=>e.kat_key===kat.key);
              const katYetkili = yetkiliKat(kat.key);
              const varMi = Object.keys(wEdits).some(k => kat.items.some(it=>it.key===k));
              return (
                <div key={kat.key} style={{border:"1px solid var(--line)",borderRadius:12,overflow:"hidden",minWidth:300,maxWidth:340,flex:"1 1 300px"}}>
                  <div onClick={()=>katToggle(kat.key)}
                    style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#f4f6f9",cursor:"pointer",gap:10}}>
                    <b style={{fontSize:14,whiteSpace:"nowrap"}}>{kat.ad}</b>
                    <span style={{fontSize:12,color:"var(--ink3)"}}>{acikKat[kat.key] ? "▲" : "▼"}</span>
                  </div>
                  <div style={{padding:"8px 14px",borderBottom:"1px solid var(--line)",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}} onClick={e=>e.stopPropagation()}>
                    {katEditors.map(e => (
                      <span key={e.id} className="pill" style={{background:"#e7f0fb",color:"#0c447c",fontSize:11,display:"flex",alignItems:"center",gap:5}}>
                        {e.ad_soyad}
                        {me?.admin && <span onClick={()=>editorSil(e)} style={{cursor:"pointer",fontWeight:700}}>✕</span>}
                      </span>
                    ))}
                    {katEditors.length===0 && <span style={{fontSize:11,color:"var(--ink3)"}}>Sorumlu atanmadı</span>}
                    {me?.admin && (
                      <span onClick={()=>setAtamaAcikKat(atamaAcikKat===kat.key?null:kat.key)} style={{cursor:"pointer",fontSize:13}} title="Sorumlu ata">👤</span>
                    )}
                    {me?.admin && atamaAcikKat===kat.key && (
                      <select onChange={e=>{ if(e.target.value){ editorEkle(e.target.value, kat.key); e.target.value=""; setAtamaAcikKat(null); } }}
                        defaultValue="" style={{fontSize:11.5,padding:"4px 6px",border:"1px solid #cbd3de",borderRadius:6}}>
                        <option value="">+ Kişi seç...</option>
                        {profilList.filter(pf=>!katEditors.some(e=>e.ad_soyad===pf.ad_soyad)).map(pf=>
                          <option key={pf.ad_soyad} value={pf.ad_soyad}>{pf.ad_soyad}</option>)}
                      </select>
                    )}
                  </div>
                  {acikKat[kat.key] !== false && (
                    <div style={{padding:"10px 14px",display:"flex",flexDirection:"column",gap:8}}>
                      {gorunenItems.map(it => renderItem(kat, it))}
                      {ozelBu.map(c => (
                        <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,fontSize:13,borderBottom:"1px dashed var(--line)",paddingBottom:8}}>
                          <span onClick={()=>durumDegistir(c.item_key)} className={(wItems[c.item_key]?.status)==="red"?"durum-nokta blink":"durum-nokta"}
                            style={{width:11,height:11,borderRadius:"50%",background:DURUM_RENK[wItems[c.item_key]?.status||"grey"],cursor:me?.admin?"pointer":"default",flexShrink:0}}/>
                          <span style={{flex:1}}>{c.item_ad} <span style={{fontSize:9.5,color:"var(--ink3)"}}>(özel)</span></span>
                        </div>
                      ))}
                      {katYetkili && (
                        <button onClick={()=>katKaydet(kat)} className="arac-btn" style={{fontSize:12,padding:"7px 14px",background: varMi ? "#0f7a5f" : "#8b94a4"}}>
                          {varMi ? "💾 Kaydet" : "Kaydedildi"}
                        </button>
                      )}
                      {katYetkili && (
                        <div style={{display:"flex",gap:6,marginTop:4}}>
                          <input value={teklifAcik[kat.key]||""} onChange={e=>setTeklifAcik({...teklifAcik,[kat.key]:e.target.value})}
                            placeholder="Yeni alt başlık..." style={{fontSize:11.5,padding:"5px 8px",border:"1px solid #cbd3de",borderRadius:7,flex:1}}/>
                          <button onClick={()=>{ if((teklifAcik[kat.key]||"").trim()){ teklifGonder(kat.key,"add",null,teklifAcik[kat.key].trim()); setTeklifAcik({...teklifAcik,[kat.key]:""}); } }}
                            className="arac-btn" style={{fontSize:11,padding:"5px 10px"}}>+ Öner</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{fontSize:11,color:"var(--ink3)",marginTop:8}}>gri = veri yok · yeşil = tamam · kırmızı (yanıp söner) = tıkanıklık · renk değiştirme: yalnızca Koray · veri girişi/dosya yükleme: Koray + o kategoriye atanan kişi · alt başlık ekleme/kaldırma önerileri Koray onayına düşer</div>
          </div>}
          <style jsx>{`
            .blink { animation: blinkAnim 1s infinite; }
            @keyframes blinkAnim { 0%,100%{opacity:1;} 50%{opacity:0.25;} }
            .alarm-blink { animation: rowBlink 1.4s infinite; }
            @keyframes rowBlink { 0%,100%{opacity:1;} 50%{opacity:0.55;} }
          `}</style>
        </section>

        <section style={{marginTop:16}}>
          <div onClick={()=>secToggle("roadmap")} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
            <h2 style={{margin:0}}>Project Roadmap</h2>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {me?.admin && (
                <button className="arac-btn" style={{fontSize:12.5,padding:"7px 14px"}}
                  onClick={(e)=>{ e.stopPropagation(); rEdit ? setREdit(false) : setREdit(true); }}>
                  {rEdit ? "İptal" : "Düzenle"}
                </button>
              )}
              <span style={{fontSize:13,color:"var(--ink3)"}}>{secAcik.roadmap ? "▲" : "▼"}</span>
            </div>
          </div>
          {secAcik.roadmap && <>

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

          {ekip.length>0 && (
            <div style={{marginTop:20,borderTop:"1px solid var(--line)",paddingTop:16}}>
              <h2 style={{marginTop:0}}>Üretim / İmalat</h2>
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
              <div style={{marginTop:14,borderTop:"1px solid var(--line)",paddingTop:12,display:"flex",gap:20,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:220}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <b style={{fontSize:12.5,color:"var(--navy)"}}>Son Progress Report</b>
                    {yetkiliKat("kalite") && (
                      <label className="arac-btn" style={{cursor:"pointer",fontSize:11,padding:"4px 10px"}}>
                        {wItems["kalite_progress"]?.file_url ? "Değiştir" : "Yükle"}
                        <input type="file" style={{display:"none"}} onChange={e=>dosyaYuklWf("kalite_progress", e.target.files[0], "kalite")}/>
                      </label>
                    )}
                  </div>
                  {wItems["kalite_progress"]?.file_url ? (
                    <div style={{marginTop:6,fontSize:12.5}}>
                      <a href={wItems["kalite_progress"].file_url} target="_blank" rel="noreferrer">📎 Raporu görüntüle</a>
                      <span style={{color:"var(--ink3)",marginLeft:8}}>{wItems["kalite_progress"].file_tarih}</span>
                      {(!wItems["kalite_progress"].file_tarih || new Date(wItems["kalite_progress"].file_tarih) < pzt) &&
                        <div style={{color:"#b3261e",fontWeight:600,marginTop:2}}>Güncel değil</div>}
                    </div>
                  ) : <div style={{fontSize:12,color:"var(--ink3)",marginTop:6}}>Henüz rapor yüklenmedi</div>}
                </div>
                <div style={{flex:1,minWidth:220}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <b style={{fontSize:12.5,color:"var(--navy)"}}>Observation Report</b>
                    {yetkiliKat("kalite") && (
                      <label className="arac-btn" style={{cursor:"pointer",fontSize:11,padding:"4px 10px"}}>
                        {wItems["kalite_obs"]?.file_url ? "Değiştir" : "Yükle"}
                        <input type="file" style={{display:"none"}} onChange={e=>dosyaYuklWf("kalite_obs", e.target.files[0], "kalite")}/>
                      </label>
                    )}
                  </div>
                  {wItems["kalite_obs"]?.file_url ? (
                    <div style={{marginTop:6,fontSize:12.5}}>
                      <a href={wItems["kalite_obs"].file_url} target="_blank" rel="noreferrer">📎 Raporu görüntüle</a>
                      <span style={{color:"var(--ink3)",marginLeft:8}}>{wItems["kalite_obs"].file_tarih}</span>
                      {(!wItems["kalite_obs"].file_tarih || new Date(wItems["kalite_obs"].file_tarih) < pzt) &&
                        <div style={{color:"#b3261e",fontWeight:600,marginTop:2}}>Güncel değil</div>}
                    </div>
                  ) : <div style={{fontSize:12,color:"var(--ink3)",marginTop:6}}>Henüz rapor yüklenmedi</div>}
                </div>
              </div>
            </div>
          )}
          </>}
        </section>

        <section>
          <div onClick={()=>secToggle("departman")} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
            <h2 style={{margin:0}}>Departman durumu</h2>
            <span style={{fontSize:13,color:"var(--ink3)"}}>{secAcik.departman ? "▲" : "▼"}</span>
          </div>
          {secAcik.departman && <>
          <div className="grid" style={{marginTop:10}}>
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
          </>}
        </section>

        <section style={{marginTop:16, border: alarmlar.length>0 ? "1px solid #d1352b" : undefined, background: alarmlar.length>0 ? "#fff5f4" : undefined}}>
          <div onClick={()=>secToggle("kritik")} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
            <h2 style={{margin:0,color: alarmlar.length>0 ? "#b3261e" : undefined}}>⚠ Kritik konular / Uyarılar</h2>
            <span style={{fontSize:13,color:"var(--ink3)"}}>{secAcik.kritik ? "▲" : "▼"}</span>
          </div>
          {secAcik.kritik && <>
          {alarmlar.length>0 ? (
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
          ) : <div style={{fontSize:12.5,color:"var(--ink3)",marginTop:8}}>Aktif kritik konu / uyarı yok.</div>}

          {yetkiliMi && (
            <div style={{display:"flex",gap:8,marginTop:14,borderTop:"1px solid var(--line)",paddingTop:12,flexWrap:"wrap"}}>
              <input value={yeniAlarm} onChange={e=>setYeniAlarm(e.target.value)} placeholder="Uyarı / kritik konu yazın..."
                onKeyDown={e=>{if(e.key==="Enter")alarmEkle();}}
                style={{flex:1,minWidth:220,padding:"9px 12px",border:"1px solid #cbd3de",borderRadius:10,fontSize:13.5}}/>
              <button onClick={alarmEkle} className="arac-btn" style={{fontSize:13.5,padding:"9px 20px",background:"#b3261e"}}>+ Ekle</button>
            </div>
          )}
          <style jsx>{`
            .alarm-blink { animation: rowBlink2 1.4s infinite; }
            @keyframes rowBlink2 { 0%,100%{opacity:1;} 50%{opacity:0.55;} }
          `}</style>
          </>}
        </section>
      </div>
    </>
  );
}
