QAOA-01.json:
```
{
  "case_id": "QAOA-01",
  "description": "Max-Cut pada graph K3 (triangle)",
  "problem": "maxcut",
  "graph": {
    "nodes": [0, 1, 2],
    "edges": [[0, 1], [0, 2], [1, 2]]
  },
  "p_layers": 1
}
```

QAOA-02.json:
```
{
  "case_id": "QAOA-02",
  "description": "Max-Cut pada graph K4 (complete graph 4 nodes)",
  "problem": "maxcut",
  "graph": {
    "nodes": [0, 1, 2, 3],
    "edges": [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]
  },
  "p_layers": 1
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

ingat hanya ada QAOA 1 dan QAOA 2 
harus pake data asli dari json
