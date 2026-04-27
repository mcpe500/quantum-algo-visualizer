QFT-01.json:
```
{
  "case_id": "QFT-01",
  "description": "Sinyal periodic sederhana",
  "n_points": 32,
  "signal_data": [
    2.0, 1.414, 0.0, -1.414, -2.0, -1.414, 0.0, 1.414,
    2.0, 1.414, 0.0, -1.414, -2.0, -1.414, 0.0, 1.414,
    2.0, 1.414, 0.0, -1.414, -2.0, -1.414, 0.0, 1.414,
    2.0, 1.414, 0.0, -1.414
  ],
  "signal_type": "synthetic_periodic"
}
```

QFT-02.json:
```
{
  "case_id": "QFT-02",
  "description": "Sinyal mixed frequency",
  "n_points": 48,
  "signal_data": [
    2.5, 1.8, 0.5, -1.2, -2.2, -1.9, -0.3, 1.5,
    2.8, 2.1, 0.8, -0.9, -2.5, -2.0, -0.5, 1.8,
    3.0, 2.3, 1.0, -0.6, -2.8, -2.2, -0.8, 2.0,
    2.7, 2.0, 0.6, -1.0, -2.4, -1.8, -0.2, 1.6,
    2.6, 1.9, 0.4, -1.3, -2.3, -2.1, -0.4, 1.7,
    2.9, 2.2, 0.7, -0.8, -2.6, -1.9, -0.6, 1.9
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
