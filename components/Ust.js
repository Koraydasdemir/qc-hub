"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const DEPARTMANLAR = [
  { kod: "01", ad: "Kalite Kontrol ve Proje Yönetimi" },
  { kod: "02", ad: "Finance" },
  { kod: "03", ad: "Accounting" },
  { kod: "04", ad: "Technical Office" },
  { kod: "05", ad: "Procurement" },
  { kod: "06", ad: "Legal Affairs" },
  { kod: "07", ad: "Logistics & Customs" },
  { kod: "08", ad: "Administrative & Personnel" },
];

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

  function departmanaGit(kod) {
    router.push(`/dept-loglar?dept=${kod}`);
  }

  return (
    <div>
      {/* BAŞLIK */}
      <div className="ust">
        <a href="/" style={{ textDecoration: "none", color: "#fff" }}>
          <div className="logo">
            <img src="/logo.png" alt="TECHMP" />
            <div>
              <b>TECHMP Mühendislik · Proje Yönetim Sistemi</b>
            </div>
          </div>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="kim">
            {ad ? <>{ad}{gorev ? " · " + gorev : ""}</> : ""}
          </span>
          <a className="cikis" onClick={cikis} style={{ cursor: "pointer" }}>Çıkış</a>
        </div>
      </div>

      {/* ALT BAŞLIK - DEPARTMANLAR */}
      <div className="alt-baslik">
        {DEPARTMANLAR.map((d) => (
          <button
            key={d.kod}
            className="dept-buton"
            onClick={() => departmanaGit(d.kod)}
          >
            {d.ad}
          </button>
        ))}
      </div>

      <style jsx>{`
        .alt-baslik {
          display: flex;
          gap: 4px;
          background: #0d3f7a;
          padding: 6px 16px;
          overflow-x: auto;
          flex-wrap: nowrap;
        }
        .dept-buton {
          background: transparent;
          border: none;
          color: #dbe8fb;
          font-size: 12.5px;
          padding: 6px 12px;
          border-radius: 5px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .dept-buton:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }
        @media (max-width: 768px) {
          .alt-baslik {
            padding: 6px 10px;
          }
          .dept-buton {
            font-size: 11.5px;
            padding: 5px 8px;
          }
        }
      `}</style>
    </div>
  );
}
