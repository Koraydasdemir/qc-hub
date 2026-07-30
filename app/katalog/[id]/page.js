"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Ust from "../../../components/Ust";

export default function KatalogDetay({ params }) {
  const router = useRouter();
  const id = params.id;
  const [yukle, setYukle] = useState(true);
  const [r, setR] = useState(null);
  const [projeVarMi, setProjeVarMi] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data } = await supabase.from("specs_katalog").select("*").eq("id", id).single();
      setR(data || null);
      if (data?.id) {
        const { data: projs } = await supabase.from("projects").select("kod").eq("katalog_id", data.id).limit(1);
        if (projs && projs[0]?.kod) setProjeVarMi(projs[0].kod);
      }
      setYukle(false);
    })();
  }, [id]);

  if (yukle) return <><Ust/><div className="wrap">Yükleniyor...</div></>;
  if (!r) return <><Ust/><div className="wrap"><a href="/katalog">← Spec Kataloğu</a><p>Kayıt bulunamadı.</p></div></>;

  return (
    <>
      <Ust/>
      <div className="wrap">
        <a href="/katalog" style={{fontSize:13}}>← Spec Kataloğu</a>
        <h1 style={{marginTop:10}}>{r.tedarikci} — Spec {r.spec_no}</h1>
        <p style={{color:"var(--ink2)",fontSize:13,marginTop:0}}>{r.proje_adi}</p>

        {projeVarMi && (
          <div className="duyuru" style={{marginTop:10}}>
            <b>Bu spec için detaylı yaşam döngüsü/ödeme/ilerleme takibi mevcut.</b>
            <p><a href={"/spec/"+projeVarMi}>→ Tam spec ekranını aç</a></p>
          </div>
        )}

        <section style={{marginTop:16}}>
          <div className="bilgi-grid">
            <div className="h">Tedarikçi</div><div className="v">{r.tedarikci || "—"}</div>
            <div className="h">Spec No</div><div className="v">{r.spec_no || "—"}</div>
            <div className="h">Proje adı</div><div className="v">{r.proje_adi || "—"}</div>
            <div className="h">Avans</div><div className="v">{r.avans || "—"}</div>
            <div className="h">Teslim şartı</div><div className="v">{r.teslim_sarti || "—"}</div>
            <div className="h">Durum</div><div className="v">
              <span className="pill" style={{background: r.durum==="Completed"?"#e4f4ee":"#fbf0dc", color: r.durum==="Completed"?"#0f7a5f":"#a9721a"}}>{r.durum || "—"}</span>
            </div>
            <div className="h">Beklenen teslim</div><div className="v">{r.beklenen_teslim || "—"}</div>
            <div className="h">Gerçek teslim</div><div className="v">{r.gercek_teslim || "—"}</div>
            {r.pl_tarih && <><div className="h">PL tarihi</div><div className="v">{r.pl_tarih}</div></>}
            {r.gecikme_notu && <><div className="h">Gecikme notu</div><div className="v">{r.gecikme_notu}</div></>}
          </div>
          {!projeVarMi && (
            <p style={{fontSize:12,color:"var(--ink3)"}}>Bu spec için henüz yaşam döngüsü/ödeme kapısı/ekipman ilerlemesi verisi işlenmedi — yalnızca katalog bilgisi gösteriliyor.</p>
          )}
        </section>
      </div>
    </>
  );
}
