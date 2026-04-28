QFT-01.json (canonical: 28 titik, padded ke 32):
```
{
  "case_id": "QFT-01",
  "description": "Sinyal periodic sederhana",
  "n_points": 28,
  "signal_data": [
    2.0, 1.414, 0.0, -1.414, -2.0, -1.414, 0.0, 1.414,
    2.0, 1.414, 0.0, -1.414, -2.0, -1.414, 0.0, 1.414,
    2.0, 1.414, 0.0, -1.414, -2.0, -1.414, 0.0, 1.414,
    2.0, 1.414, 0.0, -1.414
  ],
  "signal_type": "synthetic_periodic"
}
```

QFT-02.json (canonical: 64 titik native, tanpa padding):
```
{
  "case_id": "QFT-02",
  "description": "Sinyal mixed frequency",
  "n_points": 64,
  "signal_data": [
    /* 64 nilai — lihat datasets/qft/QFT-02.json untuk data penuh */
  ],
  "signal_type": "synthetic_mixed"
}
```

saya ada json sebanyak itu
nah saya perlu kayak bikin visualisasi per json 1 visualisasi dataset
bagusnya gimana?

enggak, jangan bahas dataset nya seperti itu
itu sangat kurang?
terlalu tidak visualisasi
goal visualisasi adalah menetapkan `show don't tell` jangan banyak kata kata hanya show saja

saya masih tidak senang dengan ini
bagaimana visualisasikan datasetnya yang bagus dan easy to understand one time look understand
ingat masing masing punya visualisasi sendiri
dan bisa kayak keliatan datasetnya nya
jadi keliatan datasetnya nya

untuk style nya ikuti:
```
palet warna tema secara singkat:
* **Biru Utama (Primary Blue):** `~#3B82F6` (Digunakan pada blok "HASIL" dan kotak angka).
* **Biru Muda (Light Blue):** `~#EFF6FF` (Digunakan pada latar belakang item list/query).
* **Biru Dongker / Slate (Dark Text):** `~#1E293B` (Digunakan pada teks judul utama seperti "INPUTS", "ORACLE").
* **Abu-abu (Border/Muted Text):** `~#CBD5E1` (Digunakan pada garis tepi kartu, panah, dan teks sekunder).
* **Putih (Background):** `#FFFFFF` (Digunakan pada latar belakang kartu utama).
```

ingat hanya ada QFT 1 dan QFT2 
harus pake data asli dari json
