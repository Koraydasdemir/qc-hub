"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Ust from "../../components/Ust";

export default function Mentor() {
  const router = useRouter();
  const [yukle, setYukle] = useState(true);
  const [rows, setRows] = useState([]);
  const [ara, setAra] = useState("");
  const [acik, setAcik] = useState({});

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data } = await supabase.from("standartlar").select("*").order("kategori").order("kod");
      setRows(data || []); setYukle(false);
    })();
  }, []);

  const filtreli = useMemo(() => rows.filter(r =>
    !ara || (r.kod+" "+r.ad+" "+(r.amac||"")).toLowerCase().includes(ara.toLowerCase())
  ), [rows, ara]);

  const gruplar = useMemo(() => {
    const g = {};
    filtreli.forEach(r => (g[r.kategori || "Diğer"] = g[r.kategori || "Diğer"] || []).push(r));
    return g;
  }, [filtreli]);

  function toggle(k) { setAcik(a => ({...a, [k]: !a[k]})); }

  if (yukle) return <><Ust/><div className="wrap">Yükleniyor...</div></>;

  return (
    <>
      <Ust/>
      <div className="wrap">
        <a href="/" style={{fontSize:13}}>← Ana ekran</a>
        <h1 style={{marginTop:10}}>Kalite Kontrol Mentörü</h1>
        <p style={{color:"var(--ink2)",fontSize:13,marginTop:0}}>{rows.length} standart, {Object.keys(gruplar).length} kategori. Kategoriye tıklayınca açılır/kapanır.</p>

        <input value={ara} onChange={e=>setAra(e.target.value)} placeholder="Standart kodu, adı veya amacında ara..."
          style={{width:"100%",padding:"11px 14px",border:"1px solid #cbd3de",borderRadius:10,fontSize:14,margin:"14px 0"}}/>

        {Object.keys(gruplar).sort().map(kat => (
          <section key={kat} style={{padding:0,overflow:"hidden"}}>
            <div onClick={()=>toggle(kat)} style={{padding:"14px 20px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f6faff"}}>
              <b style={{fontSize:14,color:"var(--navy)"}}>{kat}</b>
              <span style={{fontSize:12,color:"var(--ink3)"}}>{gruplar[kat].length} standart {acik[kat]?"▲":"▼"}</span>
            </div>
            {(acik[kat] ?? Boolean(ara)) && (
              <table>
                <thead><tr><th style={{width:140}}>Kod</th><th>Resmi adı</th><th>Özel amacı</th></tr></thead>
                <tbody>
                  {gruplar[kat].map(r => (
                    <tr key={r.id}>
                      <td style={{fontWeight:600,color:"var(--navy)",whiteSpace:"nowrap"}}>{r.kod}</td>
                      <td style={{fontSize:13}}>{r.ad}</td>
                      <td style={{fontSize:12.5,color:"var(--ink2)"}}>{r.amac}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ))}
        {Object.keys(gruplar).length === 0 && <div style={{color:"var(--ink3)",fontSize:13}}>Kayıt yok.</div>}
      </div>
    </>
  );
}
