"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Ust from "../../components/Ust";

const bugun = () => new Date().toISOString().slice(0, 10);

export default function DeptLoglar() {
  const router = useRouter();
  const [yukle, setYukle] = useState(true);
  const [yetkili, setYetkili] = useState(false);
  const [me, setMe] = useState(null);
  const [depler, setDepler] = useState([]);
  const [loglar, setLoglar] = useState([]);
  const [adBaslik, setAdBaslik] = useState({});
  const [mesaj, setMesaj] = useState("");

  async function yukleVeri() {
    const [{ data: d }, { data: l }] = await Promise.all([
      supabase.from("departments").select("*").order("kod"),
      supabase.from("department_logs").select("*").order("dept_kod").order("log_adi"),
    ]);
    setDepler(d || []); setLoglar(l || []);
  }
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data: prof } = await supabase.from("profiles").select("admin,dept_kod,ad_soyad").eq("id", session.user.id).single();
      setMe(prof || null);
      const sorumluMu = prof && prof.dept_kod && prof.dept_kod !== "08";
      if (!prof?.admin && !sorumluMu) { setYukle(false); return; }
      setYetkili(true); await yukleVeri(); setYukle(false);
    })();
  }, []);

  async function dosyaYukle(dep, file) {
    if (!file) return;
    const ad = (adBaslik[dep.kod] || "").trim();
    if (!ad) { setMesaj("Önce " + dep.ad + " için log adı yazın (örn. Finans raporu)"); return; }
    setMesaj("Yükleniyor...");
    const path = dep.kod + "/" + Date.now() + "_" + file.name.replace(/[^\w.\-]/g, "_");
    const { error: upErr } = await supabase.storage.from("departman-log").upload(path, file, { upsert: false });
    if (upErr) { setMesaj("Hata: " + upErr.message); return; }
    const { data: pub } = supabase.storage.from("departman-log").getPublicUrl(path);
    const { error } = await supabase.from("department_logs").insert({
      dept_kod: dep.kod, log_adi: ad, dosya_url: pub.publicUrl, storage_path: path, guncelleme_tarihi: bugun(),
    });
    if (error) { setMesaj("Hata: " + error.message); return; }
    setAdBaslik({ ...adBaslik, [dep.kod]: "" }); setMesaj(""); await yukleVeri();
  }

  async function guncelleTarihi(log) {
    setMesaj("Güncelleniyor...");
    const { error } = await supabase.from("department_logs").update({ guncelleme_tarihi: bugun() }).eq("id", log.id);
    if (error) { setMesaj("Hata: " + error.message); return; }
    setMesaj(""); await yukleVeri();
  }

  async function sil(log) {
    if (!confirm(log.log_adi + " silinsin mi?")) return;
    const { error } = await supabase.from("department_logs").delete().eq("id", log.id);
    if (!error) await yukleVeri();
  }

  if (yukle) return <><Ust/><div className="wrap">Yükleniyor...</div></>;
  if (!yetkili) return <><Ust/><div className="wrap"><a href="/">← Ana ekran</a><p style={{marginTop:14}}>Bu sayfa yalnızca yönetici veya departman sorumlularına açıktır. Departman loglarını ana ekrandaki "Departman logları" bölümünden görüntüleyebilirsiniz.</p></div></>;

  return (
    <>
      <Ust/>
      <div className="wrap">
        <a href="/" style={{fontSize:13}}>← Ana ekran</a>
        <h1 style={{marginTop:10}}>Departman logları yönetimi</h1>
        <p style={{color:"var(--ink2)",fontSize:13,marginTop:0}}>Her departmanın kendi takip dosyasını (Excel/PDF) buraya yükleyin. Ana ekrandaki departman kartlarında görünür; her hafta pazartesiye kadar güncellenmezse kırmızı uyarı çıkar.</p>
        {mesaj && <div style={{fontSize:13,color: mesaj.startsWith("Hata")?"#b3261e":"var(--ink2)"}}>{mesaj}</div>}

        {!me?.admin && me?.dept_kod && (
          <p style={{fontSize:12.5,color:"var(--ink3)"}}>Yalnızca kendi departmanınızın ({me.dept_kod}) loglarını yönetebilirsiniz. Diğer departmanları ana ekrandan görüntüleyebilirsiniz.</p>
        )}
        <div className="grid">
          {depler.filter(d => d.kod !== "08").filter(d => me?.admin || d.kod === me?.dept_kod).map(dep => {
            const dLog = loglar.filter(l => l.dept_kod === dep.kod);
            return (
              <section key={dep.kod}>
                <b style={{fontSize:13.5,color:"var(--navy)"}}>{dep.kod} · {dep.ad}</b>
                <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:6}}>
                  {dLog.map(l => (
                    <div key={l.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:12.5}}>
                      <a href={l.dosya_url} target="_blank" rel="noreferrer" style={{flex:1}}>📎 {l.log_adi}</a>
                      <span style={{color:"var(--ink3)",fontSize:11}}>{l.guncelleme_tarihi}</span>
                      <button onClick={()=>guncelleTarihi(l)} title="Bugüne güncelle" style={{fontSize:11,border:"1px solid #cbd3de",borderRadius:7,background:"#fff",cursor:"pointer",padding:"3px 7px"}}>↻</button>
                      <button onClick={()=>sil(l)} title="Sil" style={{fontSize:11,border:"1px solid #f0b9b5",color:"#b3261e",borderRadius:7,background:"#fff",cursor:"pointer",padding:"3px 7px"}}>✕</button>
                    </div>
                  ))}
                  {dLog.length===0 && <span style={{fontSize:12,color:"var(--ink3)"}}>Henüz log yok.</span>}
                </div>
                <div style={{marginTop:10,borderTop:"1px solid var(--line)",paddingTop:10}}>
                  <input value={adBaslik[dep.kod]||""} onChange={e=>setAdBaslik({...adBaslik,[dep.kod]:e.target.value})}
                    placeholder="Log adı (örn. Finans raporu)" style={{width:"100%",padding:"7px 9px",border:"1px solid #cbd3de",borderRadius:8,fontSize:12.5,marginBottom:6}}/>
                  <label className="arac-btn" style={{cursor:"pointer",fontSize:12.5,padding:"7px 14px",display:"inline-block"}}>
                    Dosya seç ve yükle
                    <input type="file" style={{display:"none"}} onChange={e=>dosyaYukle(dep, e.target.files[0])}/>
                  </label>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
