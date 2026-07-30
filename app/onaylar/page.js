"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Ust from "../../components/Ust";

const bugun = () => new Date().toLocaleDateString("tr-TR");
const bosTalep = { metin: "", hedef_kisi: "", file: null };

export default function Onaylar() {
  const router = useRouter();
  const [yukle, setYukle] = useState(true);
  const [me, setMe] = useState(null);
  const [kuyruk, setKuyruk] = useState([]);
  const [talepler, setTalepler] = useState([]);
  const [profilList, setProfilList] = useState([]);
  const [talepFormAcik, setTalepFormAcik] = useState(false);
  const [form, setForm] = useState(bosTalep);
  const [mesaj, setMesaj] = useState("");

  async function yukleVeri(admin) {
    const istekler = [supabase.from("approval_requests").select("*").order("created_at",{ascending:false})];
    if (admin) istekler.push(supabase.from("payment_gates").select("*,projects(kod,ad,spec_no,suppliers(ad))").eq("durum", "dekont yüklendi").order("dekont_tarihi"));
    const sonuc = await Promise.all(istekler);
    setTalepler(sonuc[0].data || []);
    if (admin) setKuyruk(sonuc[1].data || []);
  }
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data: prof } = await supabase.from("profiles").select("admin,ad_soyad").eq("id", session.user.id).single();
      setMe(prof || null);
      const { data: pl } = await supabase.from("profiles").select("ad_soyad").order("ad_soyad");
      setProfilList(pl || []);
      await yukleVeri(prof?.admin); setYukle(false);
    })();
  }, []);

  async function onayla(g) {
    setMesaj("Onaylanıyor...");
    const { error } = await supabase.from("payment_gates").update({ durum:"açık", acilma_tarihi:bugun() }).eq("id", g.id);
    if (error) { setMesaj("Hata: " + error.message); return; }
    setMesaj(""); await yukleVeri(me?.admin);
  }

  async function talepGonder() {
    if (!form.metin.trim() || !form.hedef_kisi) { setMesaj("Onay metni ve kişi seçin"); return; }
    setMesaj("Gönderiliyor...");
    let dosya_url = null;
    if (form.file) {
      const path = Date.now() + "_" + form.file.name.replace(/[^\w.\-]/g,"_");
      const { error: upErr } = await supabase.storage.from("onay-belge").upload(path, form.file, { upsert:false });
      if (upErr) { setMesaj("Hata: " + upErr.message); return; }
      dosya_url = supabase.storage.from("onay-belge").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from("approval_requests").insert({
      metin: form.metin.trim(), hedef_kisi: form.hedef_kisi, talep_eden: me?.ad_soyad || null,
      talep_tarihi: bugun(), durum: "bekliyor", dosya_url,
    });
    if (error) { setMesaj("Hata: " + error.message); return; }
    setForm(bosTalep); setTalepFormAcik(false); setMesaj(""); await yukleVeri(me?.admin);
  }

  async function talepKarar(t, onay) {
    const { error } = await supabase.from("approval_requests").update({
      durum: onay ? "onaylandı" : "reddedildi", onay_tarihi: bugun(),
    }).eq("id", t.id);
    if (!error) await yukleVeri(me?.admin);
  }

  if (yukle) return <><Ust/><div className="wrap">Yükleniyor...</div></>;

  return (
    <>
      <Ust/>
      <div className="wrap">
        <a href="/" style={{fontSize:13}}>← Ana ekran</a>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <h1 style={{marginTop:10}}>Onaylar</h1>
          <button onClick={()=>setTalepFormAcik(!talepFormAcik)} className="arac-btn" style={{background:"#e08a3c",fontSize:13.5}}>+ Onay talebi aç</button>
        </div>
        <p style={{color:"var(--ink2)",fontSize:13,marginTop:0}}>Herhangi bir konuyu, seçtiğiniz bir kişinin onayına gönderin.</p>
        {mesaj && <div style={{fontSize:13,color: mesaj.startsWith("Hata")?"#b3261e":"var(--ink2)"}}>{mesaj}</div>}

        {talepFormAcik && (
          <section style={{border:"1.5px solid #cfe0f2",background:"#f6faff"}}>
            <h2 style={{marginTop:0}}>Yeni onay talebi</h2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{gridColumn:"1 / span 2"}}>
                <label style={{fontSize:12,color:"#586173",fontWeight:600}}>Onay metni</label>
                <textarea value={form.metin} onChange={e=>setForm({...form,metin:e.target.value})}
                  style={{width:"100%",marginTop:4,padding:"9px 11px",border:"1px solid #cbd3de",borderRadius:9,fontSize:13.5,height:70,resize:"vertical",fontFamily:"inherit"}}/>
              </div>
              <div>
                <label style={{fontSize:12,color:"#586173",fontWeight:600}}>Onaya gönderilecek kişi</label>
                <select value={form.hedef_kisi} onChange={e=>setForm({...form,hedef_kisi:e.target.value})}
                  style={{width:"100%",marginTop:4,padding:"9px 11px",border:"1px solid #cbd3de",borderRadius:9,fontSize:13.5}}>
                  <option value="">Seçiniz...</option>
                  {profilList.map(pf=><option key={pf.ad_soyad} value={pf.ad_soyad}>{pf.ad_soyad}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:12,color:"#586173",fontWeight:600}}>Belge ekle (opsiyonel)</label><br/>
                <label className="arac-btn" style={{cursor:"pointer",fontSize:13,padding:"9px 16px",display:"inline-block",marginTop:4}}>
                  {form.file ? form.file.name : "Dosya seç"}
                  <input type="file" style={{display:"none"}} onChange={e=>setForm({...form,file:e.target.files[0]})}/>
                </label>
              </div>
            </div>
            <div style={{marginTop:12,display:"flex",gap:10}}>
              <button onClick={talepGonder} className="arac-btn" style={{fontSize:13.5}}>Gönder</button>
              <button onClick={()=>{setTalepFormAcik(false);setForm(bosTalep);}} className="arac-btn" style={{background:"#8b94a4",fontSize:13.5}}>İptal</button>
            </div>
          </section>
        )}

        <section style={{padding:0,overflow:"hidden"}}>
          <table>
            <thead><tr><th>Onay metni</th><th>Gönderilen</th><th>Talep eden</th><th>Talep tarihi</th><th>Onay tarihi</th><th>Belge</th><th>Durum</th><th></th></tr></thead>
            <tbody>
              {talepler.map(t => {
                const kararYetkili = me && (me.admin || t.hedef_kisi === me.ad_soyad);
                return (
                  <tr key={t.id}>
                    <td style={{maxWidth:260,fontSize:12.5}}>{t.metin}</td>
                    <td style={{fontSize:12.5,whiteSpace:"nowrap"}}>{t.hedef_kisi}</td>
                    <td style={{fontSize:12.5,whiteSpace:"nowrap"}}>{t.talep_eden || "—"}</td>
                    <td style={{fontSize:12,whiteSpace:"nowrap"}}>{t.talep_tarihi || "—"}</td>
                    <td style={{fontSize:12,whiteSpace:"nowrap"}}>{t.onay_tarihi || "—"}</td>
                    <td>{t.dosya_url ? <a href={t.dosya_url} target="_blank" rel="noreferrer">📎</a> : "—"}</td>
                    <td><span className="pill" style={{
                      background: t.durum==="onaylandı"?"#e4f4ee":t.durum==="reddedildi"?"#fbe9e8":"#fbf0dc",
                      color: t.durum==="onaylandı"?"#0f7a5f":t.durum==="reddedildi"?"#b3261e":"#a9721a"}}>{t.durum}</span></td>
                    <td>
                      {t.durum==="bekliyor" && kararYetkili && (
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>talepKarar(t,true)} className="arac-btn" style={{background:"#0f7a5f",fontSize:11,padding:"5px 10px"}}>Onayla</button>
                          <button onClick={()=>talepKarar(t,false)} style={{fontSize:11,padding:"5px 10px",border:"1px solid #cbd3de",borderRadius:7,background:"#fff",cursor:"pointer"}}>Reddet</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {talepler.length===0 && <tr><td colSpan={8} style={{padding:16,color:"var(--ink3)",fontSize:13}}>Onay talebi yok.</td></tr>}
            </tbody>
          </table>
        </section>

        {me?.admin && (
          <>
            <h2 style={{marginTop:24}}>Dekont onay kuyruğu</h2>
            <p style={{color:"var(--ink2)",fontSize:13,marginTop:-8}}>Dekontu yüklenmiş, onay bekleyen ödeme kapıları. Onaylayınca kapı açılır.</p>

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
          </>
        )}
      </div>
    </>
  );
}
