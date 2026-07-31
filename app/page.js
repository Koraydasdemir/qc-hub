"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import Ust from "../components/Ust";
import Bolum from "../components/Bolum";
import { useDuzen } from "../lib/duzen";

const ANA_BOLUMLER = [
  { key: "secim", ad: "Tedarikçi & Spesifikasyon Seçimi", varsayilanSira: 1 },
  { key: "duyurular", ad: "Önemli duyurular", varsayilanSira: 2 },
  { key: "dept-loglari", ad: "Departman logları", varsayilanSira: 3 },
  { key: "projeler", ad: "Projeler", varsayilanSira: 4 },
  { key: "son-belgeler", ad: "Son belgeler", varsayilanSira: 5 },
];

function pazartesi() {
  const d = new Date();
  const gun = d.getDay();
  const fark = gun === 0 ? 6 : gun - 1;
  const p = new Date(d.getFullYear(), d.getMonth(), d.getDate() - fark);
  return p;
}

export default function Dashboard() {
  const router = useRouter();
  const [yukle, setYukle] = useState(true);
  const [projeler, setProjeler] = useState([]);
  const [duyurular, setDuyurular] = useState([]);
  const [belgeler, setBelgeler] = useState([]);
  const [admin, setAdmin] = useState(false);
  const [bekleyen, setBekleyen] = useState(0);
  const [me, setMe] = useState(null);
  const [depler, setDepler] = useState([]);
  const [loglar, setLoglar] = useState([]);
  const [katalog, setKatalog] = useState([]);
  const [secTed, setSecTed] = useState("");
  const [secSpec, setSecSpec] = useState("");
  const [kapali, setKapali] = useState([]);
  const [adBaslik, setAdBaslik] = useState({});
  const [mesajLog, setMesajLog] = useState("");
  const [tedFiltre, setTedFiltre] = useState("");
  const [asamaFiltre, setAsamaFiltre] = useState("");
  const [projeAra, setProjeAra] = useState("");
  const duzen = useDuzen("ana-ekran");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const [{ data: pr }, { data: dy }, { data: bg }, { data: prof }, { data: dep }, { data: lg }, { data: kat }] = await Promise.all([
        supabase.from("projects").select("kod,ad,spec_no,asama,bedel,katalog_id,suppliers(kod,ad)").order("id"),
        supabase.from("announcements").select("*").order("onemli",{ascending:false}).order("id",{ascending:false}),
        supabase.from("documents").select("kod,tur,tespit_eden,durum,created_at").order("id",{ascending:false}).limit(8),
        supabase.from("profiles").select("admin,dept_kod,ad_soyad").eq("id", session.user.id).single(),
        supabase.from("departments").select("*").order("kod"),
        supabase.from("department_logs").select("*").order("dept_kod").order("log_adi"),
        supabase.from("specs_katalog").select("id,tedarikci,spec_no,proje_adi,durum").order("tedarikci").order("id"),
      ]);
      if (prof?.admin) {
        setAdmin(true);
        const { count } = await supabase.from("payment_gates").select("id",{count:"exact",head:true}).eq("durum","dekont yüklendi");
        setBekleyen(count || 0);
      }
      setMe(prof || null);
      setProjeler(pr || []); setDuyurular(dy || []); setBelgeler(bg || []); setDepler(dep || []); setLoglar(lg || []); setKatalog(kat || []);
      try { setKapali(JSON.parse(localStorage.getItem("qc_bil_kapali") || "[]")); } catch (e) {}
      setYukle(false);
    })();
  }, []);

  if (yukle) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--ink3)",fontSize:14}}>Yükleniyor...</div>;

  const tedarikciler = [...new Set(katalog.map(k => k.tedarikci).filter(Boolean))].sort();
  const specSecenekleri = katalog.filter(k => k.tedarikci === secTed);

  function specAc() {
    if (!secSpec) return;
    const row = specSecenekleri.find(k => String(k.id) === String(secSpec));
    if (!row) return;
    const proje = projeler.find(p => p.katalog_id === row.id);
    router.push(proje ? "/spec/"+proje.kod : "/katalog/"+row.id);
  }

  const pzt = pazartesi();
  const bugunStr = new Date().toISOString().slice(0,10);
  const bayatLoglar = loglar.filter(l => l.guncelleme_tarihi && new Date(l.guncelleme_tarihi) < pzt);
  const benimUyarilarim = bayatLoglar.filter(l => admin || (me && me.dept_kod === l.dept_kod));

  function kapat(id) {
    const yeni = [...kapali, id];
    setKapali(yeni);
    try { localStorage.setItem("qc_bil_kapali", JSON.stringify(yeni)); } catch (e) {}
  }
  const gorunenUyarilar = benimUyarilarim.filter(l => !kapali.includes(l.id));

  const deptGrup = {};
  depler.filter(d => d.kod !== "08").forEach(d => { deptGrup[d.kod] = { dep: d, loglar: loglar.filter(l => l.dept_kod === d.kod) }; });

  async function yukleVeri() {
    const [{ data: dep }, { data: lg }] = await Promise.all([
      supabase.from("departments").select("*").order("kod"),
      supabase.from("department_logs").select("*").order("dept_kod").order("log_adi"),
    ]);
    setDepler(dep || []); setLoglar(lg || []);
  }
  async function dosyaYukle(dep, file) {
    if (!file) return;
    const ad = (adBaslik[dep.kod] || "").trim();
    if (!ad) { setMesajLog("Önce " + dep.ad + " için log adı yazın"); return; }
    setMesajLog("Yükleniyor...");
    const path = dep.kod + "/" + Date.now() + "_" + file.name.replace(/[^\w.\-]/g, "_");
    const { error: upErr } = await supabase.storage.from("departman-log").upload(path, file, { upsert: false });
    if (upErr) { setMesajLog("Hata: " + upErr.message); return; }
    const { data: pub } = supabase.storage.from("departman-log").getPublicUrl(path);
    const { error } = await supabase.from("department_logs").insert({
      dept_kod: dep.kod, log_adi: ad, dosya_url: pub.publicUrl, storage_path: path, guncelleme_tarihi: new Date().toISOString().slice(0,10),
    });
    if (error) { setMesajLog("Hata: " + error.message); return; }
    setAdBaslik({ ...adBaslik, [dep.kod]: "" }); setMesajLog(""); await yukleVeri();
  }
  const dosyaYuklemeYetkili = (dk) => admin || me?.dept_kod === dk;

  const tedarikcilerProje = [...new Set(projeler.map(p => p.suppliers?.ad).filter(Boolean))].sort();
  const asamalarProje = [...new Set(projeler.map(p => p.asama).filter(Boolean))].sort();
  const projelerGosterilen = projeler.filter(p =>
    (!tedFiltre || p.suppliers?.ad === tedFiltre) &&
    (!asamaFiltre || p.asama === asamaFiltre) &&
    (!projeAra || (p.ad+" "+(p.suppliers?.ad||"")+" "+(p.spec_no||"")).toLowerCase().includes(projeAra.toLowerCase()))
  );

  return (
    <>
      <Ust/>
      <div className="wrap">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <div>
            <h1>Ana ekran</h1>
            <p style={{color:"var(--ink2)",fontSize:13,marginTop:0}}>Projeyi seçerek yaşam döngüsü, ödeme, ilerleme ve departman durumuna erişin.</p>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <a href="/onaylar" style={{background: bekleyen>0?"#b3261e":"#fff",color: bekleyen>0?"#fff":"#16304f",border:"1.5px solid "+(bekleyen>0?"#b3261e":"#cdd6e2"),padding:"11px 18px",borderRadius:11,fontWeight:600,fontSize:14}}>✓ Onaylar{bekleyen>0?" ("+bekleyen+")":""}</a>
            <a href="/acik-konular" style={{background:"#fff",color:"#16304f",border:"1.5px solid #cdd6e2",padding:"11px 18px",borderRadius:11,fontWeight:600,fontSize:14}}>📋 Açık Konular</a>
            <a href="/arsiv" style={{background:"#fff",color:"#16304f",border:"1.5px solid #cdd6e2",padding:"11px 18px",borderRadius:11,fontWeight:600,fontSize:14}}>📚 NCR Arşivi</a>
            <a href="/katalog" style={{background:"#fff",color:"#16304f",border:"1.5px solid #cdd6e2",padding:"11px 18px",borderRadius:11,fontWeight:600,fontSize:14}}>📄 Spec Kataloğu</a>
            {(admin || (me?.dept_kod && me.dept_kod !== "08")) && <a href="/dept-loglar" style={{background:"#fff",color:"#16304f",border:"1.5px solid #cdd6e2",padding:"11px 18px",borderRadius:11,fontWeight:600,fontSize:14}}>🗂 Departman Logları</a>}
            <a href="/belge" style={{background:"#e08a3c",color:"#fff",padding:"12px 22px",borderRadius:11,fontWeight:600,fontSize:14,boxShadow:"0 4px 14px rgba(224,138,60,.35)"}}>Belge Hazırla</a>
          </div>
        </div>

        {gorunenUyarilar.length > 0 && (
          <div style={{margin:"14px 0",display:"flex",flexDirection:"column",gap:6}}>
            {gorunenUyarilar.map(l => (
              <div key={l.id} onClick={()=>kapat(l.id)} title="Kapatmak için tıklayın"
                className="yanar"
                style={{background:"var(--errbg)",cursor:"pointer",border:"1px solid #f0b9b5",borderRadius:12,
                  padding:"10px 16px",fontSize:13,color:"var(--err)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>🔔 <b>{deptGrup[l.dept_kod]?.dep?.ad || l.dept_kod}</b> · <b>{l.log_adi}</b> bu hafta (pazartesiden beri) güncellenmedi — son güncelleme: {l.guncelleme_tarihi}</span>
                <span style={{opacity:.55,fontSize:15}}>✕</span>
              </div>
            ))}
          </div>
        )}

        {(() => {
          const sirali = duzen.sirali(ANA_BOLUMLER);
          const icerikler = {
            secim: (
              <div className="buyuk" style={{background:"var(--card)",border:"1px solid var(--line)",borderRadius:"var(--radius)",padding:"28px 30px",boxShadow:"var(--shadow)",marginTop:16}}>
                <h2 style={{marginTop:0,fontSize:19}}>{duzen.ayarlar.secim?.emoji ? duzen.ayarlar.secim.emoji+" " : ""}Tedarikçi &amp; Spesifikasyon Seçimi</h2>
                <p style={{fontSize:13.5,color:"var(--ink2)",marginTop:-4}}>Sistemin giriş noktası — {katalog.length} spesifikasyonun tamamı burada. Tedarikçiyi ve spesifikasyonu seçerek ilgili ekrana geçin.</p>
                <div style={{display:"flex",gap:18,flexWrap:"wrap",alignItems:"flex-end",marginTop:10}}>
                  <div style={{flex:1,minWidth:220}}>
                    <label style={{fontSize:13,color:"#586173",fontWeight:600}}>1 · Tedarikçi</label><br/>
                    <select value={secTed} onChange={e=>{setSecTed(e.target.value); setSecSpec("");}}
                      style={{width:"100%",marginTop:7,padding:"14px 15px",border:"1px solid #cbd3de",borderRadius:10,fontSize:15.5}}>
                      <option value="">Seçiniz...</option>
                      {tedarikciler.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{flex:2,minWidth:320}}>
                    <label style={{fontSize:13,color:"#586173",fontWeight:600}}>2 · Spesifikasyon</label><br/>
                    <select value={secSpec} onChange={e=>setSecSpec(e.target.value)} disabled={!secTed}
                      style={{width:"100%",marginTop:7,padding:"14px 15px",border:"1px solid #cbd3de",borderRadius:10,fontSize:15.5}}>
                      <option value="">{secTed ? "Seçiniz..." : "Önce tedarikçi seçin"}</option>
                      {specSecenekleri.map(k => <option key={k.id} value={k.id}>Spec {k.spec_no} — {k.proje_adi} ({k.durum})</option>)}
                    </select>
                  </div>
                  <button className="arac-btn" disabled={!secSpec} onClick={specAc}
                    style={{padding:"15px 28px",fontSize:15.5,opacity: secSpec?1:.5,cursor: secSpec?"pointer":"not-allowed"}}>
                    Spesifikasyon detayları →
                  </button>
                </div>
              </div>
            ),
            duyurular: duyurular.length > 0 && (
              <section>
                <h2>{duzen.ayarlar.duyurular?.emoji || "📢"} Önemli duyurular</h2>
                {duyurular.map(d => (
                  <div key={d.id} className={"duyuru"+(d.onemli?" onemli":"")}>
                    <b>{d.baslik}</b>
                    <p>{d.metin}</p>
                    <span style={{fontSize:11,color:"var(--ink3)"}}>{d.kimden}</span>
                  </div>
                ))}
              </section>
            ),
            "dept-loglari": (
              <section style={{marginTop:16}}>
                <h2>{duzen.ayarlar["dept-loglari"]?.emoji ? duzen.ayarlar["dept-loglari"].emoji+" " : ""}Departman logları</h2>
                {mesajLog && <div style={{fontSize:13,color: mesajLog.startsWith("Hata")?"#b3261e":"var(--ink2)",marginBottom:8}}>{mesajLog}</div>}
                <div className="grid">
                  {Object.values(deptGrup).map(({dep, loglar: dl}) => (
                    <div key={dep.kod} className="dept">
                      <b style={{display:"block",fontSize:13.5,color:"var(--navy)",marginBottom:6}}>{dep.kod} · {dep.ad}</b>
                      {dep.kod === "01" && <a href="/mentor" style={{display:"inline-block",fontSize:12,marginBottom:8,color:"var(--steel)"}}>🎓 Kalite Kontrol Mentörü →</a>}
                      {dl.length === 0 && <span style={{fontSize:12,color:"var(--ink3)"}}>log yok</span>}
                      {dl.map(l => {
                        const bayat = l.guncelleme_tarihi && new Date(l.guncelleme_tarihi) < pzt;
                        return (
                          <div key={l.id} style={{fontSize:12.5,margin:"3px 0"}}>
                            <a href={l.dosya_url} target="_blank" rel="noreferrer">→ {l.log_adi}</a>
                            {bayat && <span style={{color:"var(--err)",fontSize:11,marginLeft:6,whiteSpace:"nowrap"}}>(Güncel değil — {l.guncelleme_tarihi})</span>}
                          </div>
                        );
                      })}
                      {dosyaYuklemeYetkili(dep.kod) && (
                        <div style={{marginTop:10,borderTop:"1px solid var(--line)",paddingTop:10}}>
                          <input value={adBaslik[dep.kod]||""} onChange={e=>setAdBaslik({...adBaslik,[dep.kod]:e.target.value})}
                            placeholder="Log adı (örn. Finans raporu)" style={{width:"100%",padding:"7px 9px",border:"1px solid #cbd3de",borderRadius:8,fontSize:12.5,marginBottom:6}}/>
                          <label className="arac-btn" style={{cursor:"pointer",fontSize:12,padding:"6px 12px",display:"inline-block"}}>
                            Dosya seç ve yükle
                            <input type="file" style={{display:"none"}} onChange={e=>dosyaYukle(dep, e.target.files[0])}/>
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ),
            projeler: (
              <section>
                <h2>{duzen.ayarlar.projeler?.emoji ? duzen.ayarlar.projeler.emoji+" " : ""}Projeler</h2>
                <div style={{display:"flex",gap:10,margin:"0 0 14px",flexWrap:"wrap",alignItems:"center"}}>
                  <select value={tedFiltre} onChange={e=>setTedFiltre(e.target.value)} style={{padding:"9px 12px",border:"1px solid #cbd3de",borderRadius:10,fontSize:13.5}}>
                    <option value="">Tüm tedarikçiler</option>
                    {tedarikcilerProje.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={asamaFiltre} onChange={e=>setAsamaFiltre(e.target.value)} style={{padding:"9px 12px",border:"1px solid #cbd3de",borderRadius:10,fontSize:13.5}}>
                    <option value="">Tüm aşamalar</option>
                    {asamalarProje.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <input value={projeAra} onChange={e=>setProjeAra(e.target.value)} placeholder="Ara..." style={{padding:"9px 12px",border:"1px solid #cbd3de",borderRadius:10,fontSize:13.5,flex:1,minWidth:160}}/>
                  <span style={{fontSize:12,color:"var(--ink3)"}}>{projelerGosterilen.length} / {projeler.length}</span>
                </div>
                <div className="grid">
                  {projelerGosterilen.map(p => (
                    <a key={p.kod} className="pcard" href={"/spec/"+p.kod}>
                      <div className="ted">{p.suppliers?.ad || "—"} · Spec {p.spec_no}</div>
                      <div className="ad">{p.ad}</div>
                      <span className="pill" style={{background:"#e7f0fb",color:"#0c447c"}}>aşama: {p.asama}</span>
                      {p.bedel ? <div style={{fontSize:12.5,color:"var(--ink2)",marginTop:8}}>{p.bedel}</div> : null}
                    </a>
                  ))}
                  {projelerGosterilen.length===0 && <div style={{fontSize:13,color:"var(--ink3)"}}>Filtreye uyan proje yok.</div>}
                </div>
              </section>
            ),
            "son-belgeler": belgeler.length > 0 && (
              <section style={{marginTop:20}}>
                <h2>{duzen.ayarlar["son-belgeler"]?.emoji ? duzen.ayarlar["son-belgeler"].emoji+" " : ""}Son belgeler</h2>
                <table>
                  <thead><tr><th>Belge</th><th>Tür</th><th>Tespit eden</th><th>Durum</th></tr></thead>
                  <tbody>
                    {belgeler.map(b => (
                      <tr key={b.kod}>
                        <td><a href={"/belge/"+encodeURIComponent(b.kod)}>{b.kod}</a></td>
                        <td>{b.tur}</td>
                        <td>{b.tespit_eden}</td>
                        <td>{b.durum}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ),
          };
          return sirali.map((b, idx) => (
            <Bolum
              key={b.key}
              bolumKey={b.key}
              ayar={duzen.ayarlar[b.key]}
              admin={admin}
              baslik={b.ad}
              ilkMi={idx === 0}
              sonMu={idx === sirali.length - 1}
              onTasiYukari={() => duzen.tasi(ANA_BOLUMLER, b.key, -1, me?.ad_soyad)}
              onTasiAsagi={() => duzen.tasi(ANA_BOLUMLER, b.key, 1, me?.ad_soyad)}
              onGizleGoster={(g) => duzen.gizleGoster(b.key, g, me?.ad_soyad)}
              onEmoji={(e) => duzen.emojiAyarla(b.key, e, me?.ad_soyad)}
              onRenk={(r) => duzen.renkAyarla(b.key, r, me?.ad_soyad)}
            >
              {icerikler[b.key]}
            </Bolum>
          ));
        })()}
      </div>
    </>
  );
}
