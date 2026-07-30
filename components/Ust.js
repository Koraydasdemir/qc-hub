"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Ust() {
  const router = useRouter();
  const [ad, setAd] = useState("");
  const [gorev, setGorev] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles")
        .select("ad_soyad,gorev").eq("id", user.id).single();
      if (data) { setAd(data.ad_soyad); setGorev(data.gorev || ""); }
    })();
  }, []);

  async function cikis() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="ust">
      <a href="/" style={{textDecoration:"none",color:"#fff"}}>
        <div className="logo">
          <img src="/logo.png" alt="TECHMP"/>
          <div>
            <b>TECHMP · Proje Yönetim Sistemi</b>
            <small>Kalite Yönetim Sistemi — Faz 2</small>
          </div>
        </div>
      </a>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <span className="kim">{ad ? <>Hoşgeldiniz, <b>{ad}</b>{gorev ? " · "+gorev : ""}</> : ""}</span>
        <a className="cikis" onClick={cikis} style={{cursor:"pointer"}}>Çıkış</a>
      </div>
    </div>
  );
}
