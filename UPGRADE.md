# TripArchitect - Upgrade Plan

**Analiz Tarihi:** 2026-02-16
**Tip:** Vite + React 19 + TypeScript + Gemini AI + Leaflet

---

## Kritik Upgrades

### 1. API Key Security - Backend Proxy
**Oncelik:** KRITIK
**Dosyalar:** `vite.config.ts`, `InputForm.tsx`

Gemini API key localStorage'da plaintext.

**Gorev:**
- [ ] Vercel Edge Function olustur
- [ ] API key'i server-side'a tasi
- [ ] Client sadece proxy'ye istek atsin

---

### 2. State Management Refactor
**Oncelik:** KRITIK
**Dosya:** `App.tsx` (633 satir)

Tum state tek component'te toplanmis.

```bash
npm install zustand
```

**Gorev:**
- [ ] `useTripState` hook olustur
- [ ] `useDragDrop` hook olustur
- [ ] `useRecommended` hook olustur
- [ ] `generatePDF` -> `pdfService.ts`

---

## Yuksek Oncelikli Upgrades

### 3. Recharts Kullanilmiyor
**Oncelik:** YUKSEK
**Dosya:** `package.json`

Bundle'da yer kapliyor ama import edilmiyor.

**Gorev:**
- [ ] "Trip Stats" ozelligi ekle (maliyet, kategori dagilimi) VEYA
- [ ] recharts dependency'sini kaldir

---

### 4. PDF Export Zenginlestirme
**Oncelik:** YUKSEK
**Dosya:** `App.tsx` (satir 15-115)

Sadece metin PDF, gorsel yok.

```bash
npm install html2canvas
```

**Gorev:**
- [ ] Kartlarin screenshot'ini al
- [ ] Statik harita gorseli ekle
- [ ] jspdf-autotable ile tablo formati

---

### 5. Harita Route/Polyline
**Oncelik:** YUKSEK
**Dosya:** `components/TripMap.tsx`

Pinler izole, aralarinda rota yok.

**Gorev:**
- [ ] Leaflet Polyline component ekle
- [ ] Aktif gunun pinlerini sirali bagla
- [ ] Morning -> Lunch -> Afternoon -> Dinner rotasi

---

## Orta Oncelikli Upgrades

### 6. Geolocation Permission Kullanimda Degil
**Oncelik:** ORTA
**Dosya:** `metadata.json`

Permission isteniyor ama kod yok.

**Gorev:**
- [ ] "Yakinimdaki yerler" butonu ekle VEYA
- [ ] Permission'i metadata'dan kaldir

---

### 7. Error Handling Genisletme
**Oncelik:** ORTA
**Dosyalar:** `App.tsx`, `geminiService.ts`

Generic catch, retry logic yok.

**Gorev:**
- [ ] Exponential backoff retry
- [ ] Koordinat boundary validation
- [ ] User-friendly hata mesajlari

---

### 8. Mobile Touch Drag & Drop
**Oncelik:** ORTA

HTML5 Drag API mobilde calismaz.

```bash
npm install @dnd-kit/core
```

**Gorev:**
- [ ] @dnd-kit ile mouse + touch destegi
- [ ] Swipe-based day navigation

---

### 9. Gorsel Entegrasyonu
**Oncelik:** ORTA
**Dosya:** `types.ts` (image_search_query field)

Altyapi hazir, implement edilmemis.

**Gorev:**
- [ ] Unsplash API veya Pexels entegre et
- [ ] image_search_query ile gorsel cek
- [ ] Card'larda gorselleri goster

---

## Dusuk Oncelikli Upgrades

### 10. Multi-Trip Kaydetme
**Oncelik:** DUSUK
**Dosya:** `App.tsx`

Tek trip kaydediliyor, yeni trip eskisini siliyor.

**Gorev:**
- [ ] triparchitect_trips[] array olustur
- [ ] Saved trips sidebar ekle
- [ ] Trip silme/yeniden adlandirma

---

## Onerilen Teknolojiler

| Alan | Kutuphane | Amac |
|------|-----------|------|
| D&D | `@dnd-kit/core` | Touch + mouse support |
| PDF | `jspdf` + `html2canvas` | Gorsel destekli PDF |
| State | `zustand` | Lightweight state |
| Routing | `react-router-dom v6` | Multi-page (saved trips) |
| Gorsel | Unsplash API | image_search_query kullanimi |
| Route | Leaflet Polyline | Gunluk rota gorseli |
| Proxy | Vercel Edge Functions | API key security |
| Anim | `framer-motion` | Kart gecisleri |
| Form | `react-hook-form` + `zod` | Input validation |

---

## Tahmini Is Yukleri

| Upgrade | Zorluk |
|---------|--------|
| Backend Proxy | Orta |
| State Refactor | Orta |
| PDF Zenginlestirme | Orta |
| Route Polyline | Kolay |
| Mobile Drag | Orta |
