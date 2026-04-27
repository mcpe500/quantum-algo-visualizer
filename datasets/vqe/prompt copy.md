coba kalo visualisasi dataset VQE gimana?
  VQE-01.json:
  ```
{ "molecule": { "atoms": [["H", [0.0, 0.0, 0.0]], ["H", [0.0, 0.0, 0.735]]], "basis": "sto-3g", "charge": 0, "multiplicity": 1 }, "electronic_hamiltonian": { "n_spin_orbitals": 4, "nuclear_repulsion": 0.719968, "one_body_integrals_sparse": [ {"p": 0, "q": 0, "value": -1.252}, {"p": 1, "q": 1, "value": -0.475} ], "two_body_integrals_sparse": [ {"p": 0, "q": 1, "r": 1, "s": 0, "value": 0.674}, {"p": 2, "q": 3, "r": 3, "s": 2, "value": 0.674} ] } }
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
