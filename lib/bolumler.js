// Sayfa bölüm tanımları — hem Düzenle (layout_settings) hem Yetkili atama (section_editors) için kullanılır.
export const ANA_BOLUMLER = [
  { key: "secim", ad: "Tedarikçi & Spesifikasyon Seçimi", varsayilanSira: 1 },
  { key: "duyurular", ad: "Önemli duyurular", varsayilanSira: 2 },
  { key: "dept-loglari", ad: "Departman logları", varsayilanSira: 3 },
  { key: "projeler", ad: "Projeler", varsayilanSira: 4 },
  { key: "son-belgeler", ad: "Son belgeler", varsayilanSira: 5 },
];

export const SPEC_BOLUMLER = [
  { key: "isakisi", ad: "İş akışı", varsayilanSira: 1 },
  { key: "roadmap", ad: "Project Roadmap / Üretim-İmalat", varsayilanSira: 2 },
  { key: "departman", ad: "Departman durumu", varsayilanSira: 3 },
  { key: "kritik", ad: "Kritik konular / Uyarılar", varsayilanSira: 4 },
];

// Hangi sayfa "sayfa" anahtarıyla hangi bölüm listesine sahip (Yetkili atama paneli için)
export const SAYFA_BOLUMLERI = {
  "ana-ekran": ANA_BOLUMLER,
  "spec-detay": SPEC_BOLUMLER,
};
