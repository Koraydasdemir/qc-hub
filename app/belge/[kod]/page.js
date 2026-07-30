"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Ust from "../../../components/Ust";

const KARARLAR = ["Olduğu Gibi Kullanım / Use as is","Tamir / Repair","İade / Return to Vendor","Yeniden yapım / Rework","Hurda / Scrap","Diğer / Other"];

export default function BelgeGor({ params }) {
  const router = useRouter();
  const kod = decodeURIComponent(params.kod);
  const [yukle, setYukle] = useState(true);
  const [d, setD] = useState(null);
  const [sup, setSup] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data } = await supabase.from("documents").select("*").eq("kod", kod).single();
      if (data && data.supplier_id) {
        const { data: s } = await supabase.from("suppliers").select("ad").eq("id", data.supplier_id).single();
        setSup(s);
      }
      setD(data); setYukle(false);
    })();
  }, [kod]);

  if (yukle) return <><Ust/><div className="wrap">Yükleniyor...</div></>;
  if (!d) return <><Ust/><div className="wrap"><a href="/belge">← Belge hazırla</a><p>Belge bulunamadı.</p></div></>;

  const tarih = new Date(d.tespit_tarihi).toLocaleDateString("tr-TR");
  const kapanis = new Date(d.kapanis_tarihi).toLocaleDateString("tr-TR");
  const turUzun = d.tur === "NCR" ? "Uygunsuzluk Raporu / Non-Conformity Report" : "Düzeltici Faaliyet / Corrective Action";

  return (
    <>
      <Ust/>
      <div className="wrap">
        <div className="noprint" style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <a href="/belge" style={{fontSize:13}}>← Yeni belge</a>
          <button className="arac-btn" onClick={() => window.print()}>🖨 Yazdır / PDF indir</button>
        </div>

        <div className="form-kagit">
          <div className="form-bas">
            <div className="logo">
              <b>TECHMP MÜHENDİSLİK</b>
              <small>{turUzun}</small>
            </div>
            <div className="kod">
              <b>{d.kod}</b>
              <small>DC-TCHMP-016</small>
            </div>
          </div>

          <div className="form-govde">
            <div className="bilgi-grid">
              <div className="h">Tedarikçi / Supplier</div><div className="v">{sup?.ad || "—"}</div>
              <div className="h">Belge türü / Type</div><div className="v">{d.tur === "NCR" ? "NCR — Uygunsuzluk" : "DÖF — Düzeltici Faaliyet"}</div>
              <div className="h">Tespit tarihi / Date</div><div className="v">{tarih}</div>
              <div className="h">Kapanış tarihi / Due</div><div className="v">{kapanis}</div>
            </div>

            <div className="blok-bas">Uygunsuzluk tanımı (Türkçe)</div>
            <div className="tanim-kutu">{d.tanim_tr || d.ham_metin || "—"}</div>

            {d.tanim_en && <>
              <div className="blok-bas">Non-conformity description (English)</div>
              <div className="tanim-kutu">{d.tanim_en}</div>
            </>}

            {d.tur === "NCR" && <>
              <div className="blok-bas">Karar / Disposition</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 18px",border:"1px solid var(--line)",borderRadius:8,padding:"12px 14px"}}>
                {KARARLAR.map(k => {
                  const secili = Array.isArray(d.karar) && d.karar.includes(k);
                  return (
                    <div key={k} style={{fontSize:13.5,display:"flex",alignItems:"center",gap:8,color: secili?"var(--navy)":"var(--ink3)",fontWeight: secili?600:400}}>
                      <span style={{width:15,height:15,border:"1.5px solid "+(secili?"#16304f":"#cbd3de"),borderRadius:3,display:"inline-flex",alignItems:"center",justifyContent:"center",background: secili?"#16304f":"#fff",color:"#fff",fontSize:11}}>{secili?"✓":""}</span>
                      {k}
                    </div>
                  );
                })}
              </div>
            </>}

            {Array.isArray(d.foto_urls) && d.foto_urls.length > 0 && <>
              <div className="blok-bas">İlgili görseller / Photos ({d.foto_urls.length})</div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                {d.foto_urls.map((f, i) => (
                  <a key={i} href={f.url} target="_blank" rel="noreferrer" style={{display:"block"}}>
                    <img src={f.url} alt={"Görsel "+(i+1)}
                      style={{height:160,borderRadius:8,border:"1px solid var(--line)",objectFit:"cover"}}/>
                    <div style={{fontSize:11,color:"var(--ink3)",marginTop:3,textAlign:"center"}}>Görsel {i+1}</div>
                  </a>
                ))}
              </div>
            </>}

            <div className="imza-grid">
              <div className="imza-kutu"><div className="rol">Tespit eden / Detected by</div><div className="isim">{d.tespit_eden || "—"}</div></div>
              <div className="imza-kutu"><div className="rol">Onaylayan / Approved by</div><div className="isim">{d.onaylayan}</div></div>
              <div className="imza-kutu"><div className="rol">Tedarikçi / Supplier</div><div className="isim">&nbsp;</div></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
