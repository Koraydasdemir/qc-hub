"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";

// Bir sayfadaki bölümlerin taşıma/gizleme/renk/emoji ayarlarını yönetir.
export function useDuzen(sayfa) {
  const [ayarlar, setAyarlar] = useState({});
  const [yukle, setYukle] = useState(true);

  const veriYukle = useCallback(async () => {
    const { data } = await supabase.from("layout_settings").select("*").eq("sayfa", sayfa);
    const map = {};
    (data || []).forEach(r => { map[r.bolum_key] = r; });
    setAyarlar(map);
    setYukle(false);
  }, [sayfa]);

  useEffect(() => { veriYukle(); }, [veriYukle]);

  async function guncelle(bolumKey, alanlar, me) {
    const { error } = await supabase.from("layout_settings").upsert({
      sayfa, bolum_key: bolumKey, updated_at: new Date().toISOString(), updated_by: me || null, ...alanlar,
    }, { onConflict: "sayfa,bolum_key" });
    if (!error) await veriYukle();
    return error;
  }

  // bolumler: [{key, varsayilanSira}] sırasına göre sıralı liste döner
  function sirali(bolumler) {
    return [...bolumler].sort((a, b) => {
      const sa = ayarlar[a.key]?.sira ?? a.varsayilanSira ?? 0;
      const sb = ayarlar[b.key]?.sira ?? b.varsayilanSira ?? 0;
      return sa - sb;
    });
  }

  async function tasi(bolumler, key, yon, me) {
    const s = sirali(bolumler);
    const idx = s.findIndex(b => b.key === key);
    const hedefIdx = idx + yon;
    if (idx < 0 || hedefIdx < 0 || hedefIdx >= s.length) return;
    const a = s[idx], b = s[hedefIdx];
    const siraA = ayarlar[a.key]?.sira ?? a.varsayilanSira ?? idx;
    const siraB = ayarlar[b.key]?.sira ?? b.varsayilanSira ?? hedefIdx;
    await guncelle(a.key, { sira: siraB }, me);
    await guncelle(b.key, { sira: siraA }, me);
  }

  async function gizleGoster(key, gizli, me) { await guncelle(key, { gizli }, me); }
  async function renkAyarla(key, renk, me) { await guncelle(key, { renk }, me); }
  async function emojiAyarla(key, emoji, me) { await guncelle(key, { emoji }, me); }
  async function genislikAyarla(key, genislik, me) { await guncelle(key, { genislik }, me); }
  // Emoji + renk + genişliği tek seferde kaydeder ("Kaydet" butonu için)
  async function toplukaydet(key, alanlar, me) { await guncelle(key, alanlar, me); }

  return { ayarlar, yukle, veriYukle, sirali, tasi, gizleGoster, renkAyarla, emojiAyarla, genislikAyarla, toplukaydet };
}

// Tüm sayfalardaki layout_settings için yedekleme/geri yükleme
export async function tumunuYedekle(etiket, me) {
  const { data } = await supabase.from("layout_settings").select("*");
  const { error } = await supabase.from("layout_settings_yedek").insert({ etiket: etiket || "Yedek", veri: data || [], created_by: me || null });
  return error;
}
export async function yedekleriGetir() {
  const { data } = await supabase.from("layout_settings_yedek").select("*").order("created_at", { ascending: false });
  return data || [];
}
export async function yedektenGeriYukle(yedek) {
  await supabase.from("layout_settings").delete().neq("id", 0);
  const satirlar = (yedek.veri || []).map(r => {
    const { id, ...rest } = r;
    return rest;
  });
  if (satirlar.length) {
    const { error } = await supabase.from("layout_settings").insert(satirlar);
    return error;
  }
  return null;
}
export async function tumunuSifirla() {
  return await supabase.from("layout_settings").delete().neq("id", 0);
}

// ---- Bölüm bazlı yetkili atama (section_editors) ----
export async function bolumYetkilileriGetir(sayfa) {
  const { data } = await supabase.from("section_editors").select("*").eq("sayfa", sayfa);
  return data || [];
}
export async function bolumYetkiliEkle(sayfa, bolumKey, ad_soyad, atayan) {
  return await supabase.from("section_editors").insert({ sayfa, bolum_key: bolumKey, ad_soyad, atayan });
}
export async function bolumYetkiliSil(id) {
  return await supabase.from("section_editors").delete().eq("id", id);
}
