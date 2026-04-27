misalkan saya perlu membuat visualisasi animasi video semacam gate gate
tapi buat quantum algoritma deutzh joza
gimana bakalan hasilnya?
kira kira videonya bakalan gimana susunan dan buatannya gimana?
terlalu tidak visualisasi
goal visualisasi adalah menetapkan `show don't tell` jangan banyak kata kata hanya show saja
ini animasi vide
dari awal terus proses animasi nya terus akhirnya di akhirnya itu menunjukan bagaimana kok bisa ketangkep secara kuantumnya kok bisa ketangkep bahwa itu hasilnya konstan atau seimbang

untuk dataset ini:
DJ-01.json:
```
{
  "case_id": "DJ-01",
  "n_qubits": 3,
  "expected_classification": "CONSTANT",
  "oracle_definition": {
    "truth_table": {
      "000": 0,
      "001": 0,
      "010": 0,
      "011": 0,
      "100": 0,
      "101": 0,
      "110": 0,
      "111": 0
    }
  }
}
```

DJ-02.json:
```
{
  "case_id": "DJ-02",
  "n_qubits": 3,
  "expected_classification": "BALANCED",
  "oracle_definition": {
    "truth_table": {
      "000": 0,
      "001": 1,
      "010": 0,
      "011": 1,
      "100": 0,
      "101": 1,
      "110": 0,
      "111": 1
    }
  }
}
```

DJ-03.json:
```
{
  "case_id": "DJ-03",
  "n_qubits": 4,
  "expected_classification": "CONSTANT",
  "oracle_definition": {
    "truth_table": {
      "0000": 0,
      "0001": 0,
      "0010": 0,
      "0011": 0,
      "0100": 0,
      "0101": 0,
      "0110": 0,
      "0111": 0,
      "1000": 0,
      "1001": 0,
      "1010": 0,
      "1011": 0,
      "1100": 0,
      "1101": 0,
      "1110": 0,
      "1111": 0
    }
  }
}
```

DJ-04.json:
```
{
  "case_id": "DJ-04",
  "n_qubits": 4,
  "expected_classification": "BALANCED",
  "oracle_definition": {
    "truth_table": {
      "0000": 0,
      "0001": 0,
      "0010": 1,
      "0011": 1,
      "0100": 0,
      "0101": 0,
      "0110": 1,
      "0111": 1,
      "1000": 1,
      "1001": 1,
      "1010": 0,
      "1011": 0,
      "1100": 1,
      "1101": 1,
      "1110": 0,
      "1111": 0
    }
  }
}
```



untuk style nya ikuti:
```
palet warna tema secara singkat:
* **Biru Utama (Primary Blue):** `~#3B82F6` (Digunakan pada blok "HASIL" dan kotak angka).
* **Biru Muda (Light Blue):** `~#EFF6FF` (Digunakan pada latar belakang item list/query).
* **Biru Dongker / Slate (Dark Text):** `~#1E293B` (Digunakan pada teks judul utama seperti "INPUTS", "ORACLE").
* **Abu-abu (Border/Muted Text):** `~#CBD5E1` (Digunakan pada garis tepi kartu, panah, dan teks sekunder).
* **Putih (Background):** `#FFFFFF` (Digunakan pada latar belakang kartu utama).
```
