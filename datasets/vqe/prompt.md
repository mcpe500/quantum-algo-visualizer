coba kalo visualisasi dataset VQE gimana?
  VQE-01.json:
  ```
  {
    "case_id": "VQE-01",
    "description": "H2 molecule ground state energy - 2 qubit minimal basis",
    "molecule": "H2",
    "qubits": 2,
    "ansatz": {
      "type": "ry_linear",
      "n_layers": 1
    },
    "hamiltonian": {
      "terms": {
        "II": -1.0524,
        "ZI": 0.3979,
        "IZ": -0.3979,
        "ZZ": -0.0113,
        "XX": 0.1809,
        "YY": 0.1809
      }
    }
  }
  ```

  VQE-02.json:
  ```
  {
    "case_id": "VQE-02",
    "description": "H2 molecule ground state energy - 4 qubit with 2 layers ansatz",
    "molecule": "H2",
    "qubits": 4,
    "ansatz": {
      "type": "ry_circular",
      "n_layers": 2
    },
    "hamiltonian": {
      "terms": {
        "IIII": -0.097,
        "IIIZ": 0.071,
        "IIZI": -0.071,
        "IIZZ": 0.171,
        "IZII": 0.071,
        "IZIZ": 0.171,
        "IZZI": -0.218,
        "IZZZ": 0.174,
        "ZIII": -0.071,
        "ZIIZ": 0.171,
        "ZIZI": -0.218,
        "ZIZZ": -0.099,
        "ZZII": 0.171,
        "ZZIZ": -0.099,
        "ZZZI": 0.174,
        "ZZZZ": 0.048
      }
    }
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

  ingat hanya ada VQE 1 dan VQE 2 
  harus pake data asli dari json

tapi hamiltonian terms itu apa?
saya nggak bisa keliatan
terus ansatz cirquit itu apa
tolong buatkan supaya lebih bagus lah
issuenya adalah 
apa maksud nya dari hamiltonian operator blocks itu visualisasinya apa
anda jangan tambah ngasi cirquit shape
gini gini anda jelaskan dulu VQE itu solve apa
