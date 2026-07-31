"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Ust from "../../components/Ust";

const KARARLAR = ["Olduğu Gibi Kullanım / Use as is","Tamir / Repair","İade / Return to Vendor","Yeniden yapım / Rework","Hurda / Scrap","Diğer / Other"];
const BASIT_TURLER = {
  ITP: { ad: "ITP", itemKey: "kalite_itp" },
  PROGRESS: { ad: "Progress Report", itemKey: "kalite_progress" },
  OBS: { ad: "Observation Report", itemKey: "kalite_obs" },
};

export default function BelgeHazirla() {
  const router = useRouter();
  const [tur, setTur] = useState("NCR");
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [tanimTr, setTanimTr] = useState("");
  const [tanimEn, setTanimEn] = useState("");
  const [karar, setKarar] = useState([]);
  const [fotolar, setFotolar] = useState([]);
  const [profil, setProfil] = useState(null);
  const [durum, setDurum] = useState("");
  const [bekle, setBekle] = useState(false);

  const [specler, setSpecler] = useState([]);
  const [specKod, setSpecKod] = useState("");
  const [basitFile, setBasitFile] = useState(null);
  const [tqBaslik, setTqBaslik] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const [{ data: sup }, { data: pr }, { data: sp }] = await Promise.all([
        supabase.from("suppliers").select("id,kod,ad").order("kod"),
        supabase.from("profiles").select("ad_soyad").eq("id", session.user.id).single(),
        supabase.from("projects").select("kod,ad,spec_no,suppliers(ad)").order("id"),
      ]);
      setSuppliers(sup || []); setProfil(pr); setSpecler(sp || []);
    })();
  }, []);

  async function basitBelgeOlustur(e) {
    e.preventDefault();
    if (!specKod) { setDurum("Spesifikasyon seçin"); return; }
    if (!basitFile) { setDurum("Dosya seçin"); return; }
    setBekle(true); setDurum("Yükleniyor...");
    try {
      const { data: proje } = await supabase.from("projects").select("id").eq("kod", specKod).single();
      const path = specKod + "/" + tur + "_" + Date.now() + "_" + basitFile.name.replace(/[^\w.\-]/g,"_");
      const { error: upErr } = await supabase.storage.from("is-akisi").upload(path, basitFile, { upsert:false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("is-akisi").getPublicUrl(path);
      const { error } = await supabase.from("workflow_items").upsert({
        project_id: proje.id, item_key: BASIT_TURLER[tur].itemKey, file_url: pub.publicUrl,
        file_tarih: new Date().toISOString().slice(0,10), status: "green",
        updated_at: new Date().toISOString(), updated_by: profil?.ad_soyad || null,
      }, { onConflict: "project_id,item_key" });
      if (error) throw error;
      router.push("/spec/" + specKod);
    } catch (err) {
      setDurum("Hata: " + (err.message || err)); setBekle(false);
    }
  }

  async function tqOlustur(e) {
    e.preventDefault();
    if (!specKod) { setDurum("Spesifikasyon seçin"); return; }
    if (!tqBaslik.trim()) { setDurum("TQ başlığı yazın"); return; }
    setBekle(true); setDurum("Oluşturuluyor...");
    try {
      const { data: proje } = await supabase.from("projects").select("id").eq("kod", specKod).single();
      let dosya_url = null;
      if (basitFile) {
        const path = specKod + "/tq_" + Date.now() + "_" + basitFile.name.replace(/[^\w.\-]/g,"_");
        const { error: upErr } = await supabase.storage.from("is-akisi").upload(path, basitFile, { upsert:false });
        if (upErr) throw upErr;
        dosya_url = supabase.storage.from("is-akisi").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("ncr_tq_items").insert({
        project_id: proje.id, tur: "tq", baslik: tqBaslik.trim(), dosya_url, durum: "acik",
        giren: profil?.ad_soyad || null, tarih: new Date().toLocaleDateString("tr-TR"),
      });
      if (error) throw error;
      router.push("/spec/" + specKod);
    } catch (err) {
      setDurum("Hata: " + (err.message || err)); setBekle(false);
    }
  }

  async function olustur(e) {
    e.preventDefault();
    if (!supplierId) { setDurum("Tedarikçi seçin"); return; }
    if (!tanimTr.trim()) { setDurum("Uygunsuzluk tanımını (Türkçe) yazın"); return; }
    setBekle(true); setDurum("Belge oluşturuluyor...");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: techmp } = await supabase.from("projects").select("id").eq("kod","TECHMP").single();
      const { data: no, error: noErr } = await supabase.rpc("sonraki_belge_no", { pid: techmp.id, t: tur });
      if (noErr) throw noErr;
      const kod = "TECHMP-" + (tur === "NCR" ? "NCR" : "DOF") + "-" + no;

      const urls = [];
      for (const f of fotolar) {
        const path = kod + "/" + Date.now() + "_" + f.name.replace(/[^\w.\-]/g, "_");
        const { error: upErr } = await supabase.storage.from("belge-foto").upload(path, f, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("belge-foto").getPublicUrl(path);
        urls.push({ url: pub.publicUrl, ad: f.name });
      }

      const sup = suppliers.find(s => String(s.id) === String(supplierId));
      const { error: insErr } = await supabase.from("documents").insert({
        tur, no, kod, supplier_id: sup.id, project_id: techmp.id,
        tespit_eden: profil?.ad_soyad || "", ham_metin: tanimTr.trim(),
        tanim_tr: tanimTr.trim(), tanim_en: tanimEn.trim() || null,
        karar: tur === "NCR" ? karar : [],
        foto_urls: urls, created_by: user.id, durum: "hazır",
      });
      if (insErr) throw insErr;
      router.push("/belge/" + kod);
    } catch (err) {
      setDurum("Hata: " + (err.message || err)); setBekle(false);
    }
  }

  return (
    <>
      <Ust/>
      <div className="wrap">
        <a href="/" style={{fontSize:13}}>← Ana ekran</a>
        <h1 style={{marginTop:10}}>Belge hazırla</h1>
        <p style={{color:"var(--ink2)",fontSize:13,marginTop:0}}>Numara, tarihler, tespit eden ve onaylayan otomatik atanır; uygunsuzluk tanımını siz yazarsınız.</p>

        <section>
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            {[["NCR","NCR (Uygunsuzluk)"],["DOF","DÖF (Düzeltici Faaliyet)"],["ITP","ITP"],["TQ","TQ (Technical Query)"],["PROGRESS","Progress Report"],["OBS","Observation Report"]].map(([t,l]) => (
              <button key={t} onClick={()=>{setTur(t);setDurum("");}} type="button"
                style={{padding:"10px 20px",borderRadius:20,border:"1.5px solid",cursor:"pointer",fontWeight:600,fontSize:13.5,
                  borderColor: tur===t?"#16304f":"#cdd6e2", background: tur===t?"#16304f":"#fff", color: tur===t?"#fff":"#16304f"}}>
                {l}
              </button>
            ))}
          </div>

          {(tur==="ITP" || tur==="PROGRESS" || tur==="OBS") && (
            <form onSubmit={basitBelgeOlustur}>
              <div style={{maxWidth:420}}>
                <label style={{fontSize:12.5,color:"#586173",fontWeight:600}}>Spesifikasyon</label><br/>
                <select value={specKod} onChange={e=>setSpecKod(e.target.value)}
                  style={{width:"100%",marginTop:5,padding:"11px 13px",border:"1px solid #cbd3de",borderRadius:10,fontSize:14}}>
                  <option value="">Seçiniz...</option>
                  {specler.map(s => <option key={s.kod} value={s.kod}>{s.suppliers?.ad || "—"} — {s.ad} (Spec {s.spec_no})</option>)}
                </select>
              </div>
              <label style={{fontSize:12.5,color:"#586173",fontWeight:600,display:"block",marginTop:14}}>{BASIT_TURLER[tur].ad} dosyası</label>
              <input type="file" onChange={e=>setBasitFile(e.target.files[0])} style={{marginTop:6,fontSize:13}}/>
              <div style={{marginTop:18,display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
                <button type="submit" disabled={bekle}
                  style={{padding:"13px 28px",background:"#16304f",color:"#fff",border:"none",borderRadius:11,fontSize:15,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 14px rgba(22,48,79,.28)"}}>
                  {bekle ? "Yükleniyor..." : "Yükle"}
                </button>
                {durum && <span style={{fontSize:13,color: durum.startsWith("Hata")?"#b3261e":"var(--ink2)"}}>{durum}</span>}
              </div>
              <p style={{fontSize:12,color:"var(--ink3)",marginTop:10}}>Yüklenen dosya, ilgili spesifikasyonun İş akışı → Kalite Kontrol bölümünde görünür.</p>
            </form>
          )}

          {tur==="TQ" && (
            <form onSubmit={tqOlustur}>
              <div style={{maxWidth:420}}>
                <label style={{fontSize:12.5,color:"#586173",fontWeight:600}}>Spesifikasyon</label><br/>
                <select value={specKod} onChange={e=>setSpecKod(e.target.value)}
                  style={{width:"100%",marginTop:5,padding:"11px 13px",border:"1px solid #cbd3de",borderRadius:10,fontSize:14}}>
                  <option value="">Seçiniz...</option>
                  {specler.map(s => <option key={s.kod} value={s.kod}>{s.suppliers?.ad || "—"} — {s.ad} (Spec {s.spec_no})</option>)}
                </select>
              </div>
              <label style={{fontSize:12.5,color:"#586173",fontWeight:600,display:"block",marginTop:14}}>TQ başlığı</label>
              <input value={tqBaslik} onChange={e=>setTqBaslik(e.target.value)} placeholder="Örn. Malzeme spesifikasyonu ile ilgili soru"
                style={{width:"100%",maxWidth:420,marginTop:5,padding:"11px 13px",border:"1px solid #cbd3de",borderRadius:10,fontSize:14}}/>
              <label style={{fontSize:12.5,color:"#586173",fontWeight:600,display:"block",marginTop:14}}>Dosya (opsiyonel)</label>
              <input type="file" onChange={e=>setBasitFile(e.target.files[0])} style={{marginTop:6,fontSize:13}}/>
              <div style={{marginTop:18,display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
                <button type="submit" disabled={bekle}
                  style={{padding:"13px 28px",background:"#16304f",color:"#fff",border:"none",borderRadius:11,fontSize:15,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 14px rgba(22,48,79,.28)"}}>
                  {bekle ? "Oluşturuluyor..." : "TQ oluştur"}
                </button>
                {durum && <span style={{fontSize:13,color: durum.startsWith("Hata")?"#b3261e":"var(--ink2)"}}>{durum}</span>}
              </div>
              <p style={{fontSize:12,color:"var(--ink3)",marginTop:10}}>Oluşturulan TQ, ilgili spesifikasyonun İş akışı → Kalite Kontrol bölümünde açık olarak listelenir.</p>
            </form>
          )}

          {(tur==="NCR" || tur==="DOF") && (
          <form onSubmit={olustur}>
            <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-end"}}>
              <div style={{minWidth:220}}>
                <label style={{fontSize:12.5,color:"#586173",fontWeight:600}}>Tedarikçi</label><br/>
                <select value={supplierId} onChange={e=>setSupplierId(e.target.value)}
                  style={{marginTop:5,padding:"11px 13px",border:"1px solid #cbd3de",borderRadius:10,fontSize:14,minWidth:220}}>
                  <option value="">Seçiniz...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
                </select>
              </div>
              <div style={{fontSize:12.5,color:"var(--ink2)"}}>
                Numara: <b>otomatik</b> · Tarih: <b>bugün</b> · Kapanış: <b>bugün+15 gün</b><br/>
                Tespit eden: <b>{profil?.ad_soyad || "..."}</b> · Onaylayan: <b>Koray Daşdemir</b>
              </div>
            </div>

            <label style={{fontSize:12.5,color:"#586173",fontWeight:600,display:"block",marginTop:14}}>Uygunsuzluk tanımı — Türkçe *</label>
            <textarea value={tanimTr} onChange={e=>setTanimTr(e.target.value)}
              placeholder="Uygunsuzluğu teknik ve tarafsız biçimde tanımlayın..."
              style={{width:"100%",height:110,marginTop:5,padding:"11px 13px",border:"1px solid #cbd3de",borderRadius:10,fontSize:14,fontFamily:"inherit",resize:"vertical"}}/>

            <label style={{fontSize:12.5,color:"#586173",fontWeight:600,display:"block",marginTop:14}}>Non-conformity description — English (opsiyonel)</label>
            <textarea value={tanimEn} onChange={e=>setTanimEn(e.target.value)}
              placeholder="Optional English version..."
              style={{width:"100%",height:90,marginTop:5,padding:"11px 13px",border:"1px solid #cbd3de",borderRadius:10,fontSize:14,fontFamily:"inherit",resize:"vertical"}}/>

            {tur === "NCR" && <>
              <label style={{fontSize:12.5,color:"#586173",fontWeight:600,display:"block",marginTop:16}}>Karar / Disposition <span style={{fontWeight:400,color:"var(--ink3)"}}>(imalat, montaj ve satın alınan malzeme uygunsuzlukları için)</span></label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 18px",marginTop:8,background:"#f6faff",border:"1px solid #cfe0f2",borderRadius:10,padding:"12px 14px"}}>
                {KARARLAR.map(k => (
                  <label key={k} style={{fontSize:13.5,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                    <input type="checkbox" checked={karar.includes(k)}
                      onChange={() => setKarar(karar.includes(k) ? karar.filter(x=>x!==k) : [...karar, k])}
                      style={{width:16,height:16}}/>
                    {k}
                  </label>
                ))}
              </div>
            </>}

            <label style={{fontSize:12.5,color:"#586173",fontWeight:600,display:"block",marginTop:14}}>Fotoğraflar (birden çok seçebilirsiniz)</label>
            <input type="file" accept="image/*" multiple onChange={e=>setFotolar(Array.from(e.target.files))}
              style={{marginTop:6,fontSize:13}}/>
            {fotolar.length>0 && <div style={{fontSize:12,color:"var(--ink3)",marginTop:6}}>{fotolar.length} fotoğraf seçildi</div>}

            <div style={{marginTop:18,display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
              <button type="submit" disabled={bekle}
                style={{padding:"13px 28px",background:"#16304f",color:"#fff",border:"none",borderRadius:11,fontSize:15,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 14px rgba(22,48,79,.28)"}}>
                {bekle ? "Oluşturuluyor..." : (tur+" oluştur")}
              </button>
              {durum && <span style={{fontSize:13,color: durum.startsWith("Hata")?"#b3261e":"var(--ink2)"}}>{durum}</span>}
            </div>
          </form>
          )}
        </section>
      </div>
    </>
  );
}
