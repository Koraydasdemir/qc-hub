"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, KULLANICI_EPOSTA } from "../../lib/supabase";

export default function Login() {
  const router = useRouter();
  const [k, setK] = useState("");
  const [s, setS] = useState("");
  const [hata, setHata] = useState("");
  const [bekle, setBekle] = useState(false);

  async function giris(e) {
    e.preventDefault();
    setHata(""); setBekle(true);
    const eposta = k.includes("@") ? k.trim() : (KULLANICI_EPOSTA[k.trim()] || "");
    if (!eposta) { setHata("Kullanıcı bulunamadı"); setBekle(false); return; }
    const { error } = await supabase.auth.signInWithPassword({ email: eposta, password: s });
    setBekle(false);
    if (error) { setHata("Kullanıcı adı veya şifre hatalı"); return; }
    router.push("/");
  }

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:"radial-gradient(1200px 600px at 30% -10%,#2d5a8c,#16304f 55%,#0f2238)"}}>
      <form onSubmit={giris} style={{background:"#fff",borderRadius:18,padding:"34px 40px 30px",width:340,
        boxShadow:"0 20px 60px rgba(0,0,0,.35)"}}>
        <div style={{textAlign:"center",marginBottom:22}}>
          <div style={{fontSize:22,fontWeight:700,color:"#16304f",letterSpacing:.4}}>Proje Yönetim Sistemi</div>
          <div style={{fontSize:12,color:"#8b94a4",marginTop:2}}>TECHMP Mühendislik</div>
        </div>
        <label style={{fontSize:13,color:"#586173",fontWeight:500}}>Kullanıcı adı</label>
        <input value={k} onChange={e=>setK(e.target.value)} autoFocus
          style={{width:"100%",padding:"12px 13px",border:"1px solid #cbd3de",borderRadius:10,margin:"6px 0 15px",fontSize:14.5}}/>
        <label style={{fontSize:13,color:"#586173",fontWeight:500}}>Şifre</label>
        <input type="password" value={s} onChange={e=>setS(e.target.value)}
          style={{width:"100%",padding:"12px 13px",border:"1px solid #cbd3de",borderRadius:10,margin:"6px 0 18px",fontSize:14.5}}/>
        <button type="submit" disabled={bekle}
          style={{width:"100%",padding:13,background:"#16304f",color:"#fff",border:"none",borderRadius:10,
          fontSize:15,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 14px rgba(22,48,79,.3)"}}>
          {bekle ? "Giriş yapılıyor..." : "Giriş yap"}
        </button>
        {hata && <div style={{color:"#b3261e",fontSize:13,textAlign:"center",marginTop:12}}>{hata}</div>}
        <p style={{fontSize:11,color:"#aab2bf",textAlign:"center",marginTop:20}}>Faz 2 — canlı sürüm (Supabase + Vercel)</p>
      </form>
    </div>
  );
}
