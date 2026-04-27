buatkan menggunakan gemini canvas:



# Flow Visualisasi QAOA



## Pemahaman Request

Dokumen ini disusun untuk merumuskan ulang flow visualisasi QAOA secara lengkap karena visualisasi yang ada saat ini belum menunjukkan struktur gate, belum memisahkan track klasik dan kuantum dengan jelas, dan belum menampilkan lompatan antar-fase hybrid secara meyakinkan seperti pada animasi Deutsch-Jozsa.



## Tujuan

Menyediakan blueprint visualisasi QAOA yang benar secara algoritmik, selaras dengan dataset dan payload backend yang ada, serta cukup rinci untuk dijadikan acuan redesign animasi.



## Asumsi

QAOA yang divisualisasikan tetap memakai studi kasus Max-Cut dari dataset yang tersedia, loop hybrid tetap berbasis optimizer klasik ditambah evaluasi sirkuit kuantum, dan urutan gate kuantum mengikuti implementasi backend saat ini: Hadamard, cost unitary berbasis `CX-Rz-CX`, mixer `Rx`, lalu measurement.



## Jawaban Final



### 1. Masalah visualisasi saat ini



Visualisasi QAOA yang ada sekarang masih terasa seperti ilustrasi konsep, bukan visualisasi sirkuit. Graph input dan graph output sudah muncul, tetapi jalur kuantumnya belum memiliki landmark gate yang konsisten dari awal sampai akhir. Gate hanya muncul sebagai simbol aktif per fase, bukan sebagai struktur sirkuit penuh yang bisa dibaca seperti pada Deutsch-Jozsa. Akibatnya, pengguna melihat animasi perpindahan fase, tetapi tidak melihat bagaimana ansatz QAOA benar-benar dibangun.



Masalah kedua ada pada struktur hybrid. QAOA bukan algoritma kuantum linear seperti QFT atau Deutsch-Jozsa. QAOA adalah loop yang terdiri atas dua dunia yang terus saling mengirim informasi: optimizer klasik memilih parameter, sirkuit kuantum dievaluasi, hasilnya dikembalikan lagi ke optimizer, lalu proses diulang. Visualisasi saat ini sudah menampilkan checkpoint `Awal`, `Tengah`, dan `Terbaik`, tetapi belum memisahkan dengan tegas mana yang termasuk proses klasik, mana yang termasuk evaluasi kuantum, dan kapan sistem “melompat” dari satu domain ke domain lain.



Masalah ketiga ada pada keterbacaan flow. Untuk algoritma hybrid, penonton harus memahami tiga lapis sekaligus, yaitu masalah Max-Cut sebagai input, optimisasi klasik sebagai pengendali loop, dan sirkuit QAOA sebagai evaluator parameter. Jika ketiganya dicampur tanpa struktur lane yang jelas, animasi terasa lompat-lompat meskipun payload datanya benar.



### 2. Prinsip visualisasi yang benar untuk QAOA



QAOA harus divisualisasikan sebagai sistem tiga-lajur. Lajur pertama adalah lajur masalah klasik, yaitu graph input, Hamiltonian Ising, dan pembanding klasik seperti brute force serta Simulated Annealing. Lajur kedua adalah lajur loop hybrid, yaitu optimizer klasik yang memilih pasangan parameter $(\gamma, \beta)$ dan memantau riwayat objective. Lajur ketiga adalah lajur evaluasi kuantum, yaitu sirkuit QAOA lengkap dengan gate-gate yang tersusun jelas di atas wire qubit. Ketiga lajur ini tidak boleh berdiri sendiri-sendiri, melainkan harus dihubungkan oleh panah transisi yang menunjukkan kapan data berpindah dari graph ke Hamiltonian, dari optimizer ke circuit, dan dari hasil measurement kembali ke optimizer.



Prinsip utamanya adalah bahwa graph tidak boleh menjadi dekorasi. Graph harus menjadi sumber semua operasi cost layer. Setiap edge pada graph harus punya padanan yang terlihat di sirkuit sebagai blok `CX-Rz-CX` atau representasi `ZZ` yang ekuivalen. Dengan demikian, ketika edge `(u, v)` aktif pada lajur graph, pasangan gate yang mewakili interaksi edge itu juga aktif pada lajur sirkuit. Inilah bagian yang saat ini belum kuat.



Prinsip kedua adalah bahwa gate harus permanen sebagai landmark. Pada Deutsch-Jozsa, pengguna bisa membaca struktur sirkuit karena gate-gate selalu ada di lane dan langkah aktif hanya mengubah highlight. QAOA harus mengikuti prinsip yang sama. Gate `H`, blok cost untuk setiap edge dan setiap layer, blok mixer `Rx` untuk setiap qubit dan setiap layer, serta measurement di ujung kanan harus tetap terlihat sepanjang animasi. Yang berubah dari langkah ke langkah hanyalah highlight, warna aktif, dan indikator arus data.



Prinsip ketiga adalah bahwa loop hybrid harus divisualisasikan sebagai lompatan eksplisit. Saat fase optimizer aktif, fokus harus berada pada rail klasik. Saat fase kuantum aktif, fokus berpindah ke sirkuit. Saat measurement selesai, fokus harus kembali lagi ke optimizer dengan garis panah atau pulse yang menunjukkan “hasil evaluasi kembali ke optimizer”. Tanpa perpindahan fokus seperti ini, sifat hybrid QAOA akan tetap terasa kabur.



### 3. Struktur lane visual yang seharusnya



Visualisasi QAOA sebaiknya dibagi menjadi empat area tetap.



#### 3.1 Lane kiri: Problem dan pembanding klasik



Area paling kiri memuat graph input dari dataset, label kasus, jumlah node, jumlah edge, dan rumus Hamiltonian Ising singkat. Di bawah graph ditampilkan dua panel kecil pembanding klasik. Panel pertama adalah `Exact / Brute Force`, yang menunjukkan cut optimum sebagai acuan referensi. Panel kedua adalah `Simulated Annealing`, yang menampilkan jejak iterasi nilai cut klasik secara ringkas. Area ini penting karena QAOA adalah algoritma optimisasi; pengguna harus tahu sejak awal masalah apa yang sedang dipecahkan dan terhadap baseline apa QAOA dibandingkan.



Di lane ini juga perlu ada transformasi visual `Graph -> Hamiltonian`. Begitu animasi dimulai, edge-edge graph menyala satu per satu, lalu muncul daftar term Hamiltonian, misalnya untuk edge `(0,1)` ditulis sebagai kontribusi $(I - Z_0 Z_1)/2$. Visual sederhana ini membuat cost layer di sirkuit tidak terlihat muncul secara ajaib.



#### 3.2 Lane tengah atas: Hybrid loop klasik



Bagian ini berisi checkpoint optimizer dan convergence rail. Rail ini harus menampilkan tiga jenis informasi sekaligus: urutan evaluasi, nilai expected cut per evaluasi, dan checkpoint yang dipilih untuk animasi. Setidaknya terlihat titik `Awal`, `Tengah`, dan `Terbaik`, tetapi di belakangnya tetap ada kurva atau jejak evaluasi optimizer yang lebih lengkap. Saat pengguna berada pada checkpoint tertentu, rail harus menunjukkan bahwa parameter aktif pada iterasi itu adalah hasil pilihan optimizer klasik.



Di area ini juga perlu tampil tabel kecil parameter aktif, misalnya:



```text

iterasi: 12

gamma: [0.842]

beta : [0.417]

expected cut: 3.742

best so far  : 3.880

```



Jika `p_layers > 1`, parameter ini harus diperluas menjadi vektor per-layer, bukan disederhanakan menjadi satu angka. Ini penting agar visual tetap dinamis terhadap dataset.



#### 3.3 Lane tengah bawah: Quantum circuit lane



Inilah area yang paling penting dan saat ini masih lemah. Lajur ini harus benar-benar terlihat seperti diagram sirkuit, bukan sekadar wire dengan satu gate aktif sesekali. Struktur minimal yang harus selalu terlihat adalah:



1. Kolom awal `|0>` untuk semua qubit.

2. Kolom `H` untuk membuka superposisi.

3. Untuk setiap layer `p`:

   - subkolom cost untuk setiap edge,

   - subkolom mixer untuk setiap qubit.

4. Kolom measurement `M`.



Jika kasus adalah `QAOA-01` dengan 3 node dan 3 edge serta `p=1`, maka struktur lane kuantumnya harus terbaca seperti:



```text

q0: |0> -- H -- ● -----------● ----------- ● ----------- Rx -- M

q1: |0> -- H -- X -- Rz -- X -----------   |            Rx -- M

q2: |0> -- H ----------- ● -- X -- Rz -- X | -- X --Rz-- X -- Rx -- M

```



Representasi ASCII di atas bukan target UI final, tetapi menunjukkan prinsip penting: semua gate utama harus tersusun di lane. Untuk tiap edge, visual cost harus memunculkan pasangan kontrol-target yang jelas, bukan hanya label “ZZ” yang melayang tanpa struktur. Jika ingin tetap menyederhanakan, blok `CX-Rz-CX` bisa dikelompokkan sebagai satu modul `ZZ(edge)` yang di dalamnya tetap tampak tiga gate komponennya.



#### 3.4 Lane kanan: Measurement dan solusi



Area kanan memuat histogram bitstring hasil sampling, graph partisi hasil bitstring dominan, dan ringkasan nilai cut. Di sini pengguna harus melihat bahwa bitstring hasil measurement, misalnya `1010`, diterjemahkan menjadi dua partisi node, lalu edge yang terpotong diberi warna berbeda. Dengan begitu, hubungan antara sirkuit kuantum dan solusi Max-Cut menjadi konkret.



Area ini juga perlu menampilkan dua nilai berbeda yang sering tercampur:



1. `expected cut`, yaitu nilai ekspektasi objektif yang dipakai optimizer.

2. `sampled cut`, yaitu nilai cut dari bitstring dominan atau bitstring terbaik hasil shots.



Pemisahan ini sangat penting karena optimizer pada backend saat ini menggunakan ekspektasi dari statevector, sedangkan measurement dipakai untuk memvisualisasikan distribusi solusi. Jika dua konsep ini dicampur, narasi hybrid menjadi tidak jujur.



### 4. Flow besar yang benar



Flow visualisasi QAOA yang benar bukan jalur linear tunggal. Flow-nya harus dibaca sebagai siklus berikut:



```text

Dataset graph

-> bangun Hamiltonian cost

-> optimizer memilih parameter

-> bangun sirkuit QAOA

-> jalankan evaluasi kuantum

-> ukur distribusi bitstring

-> hitung objective

-> kirim kembali ke optimizer

-> ulangi sampai checkpoint terbaik dipilih

-> tampilkan solusi final dan bandingkan dengan klasik

```



Dalam UI, flow ini harus dibagi menjadi dua lapis:



1. Lapis luar adalah loop hybrid antardomain.

2. Lapis dalam adalah flow gate-level di dalam satu evaluasi kuantum.



Lompatan antar-lapis harus jelas. Saat checkpoint diubah, pengguna sedang berpindah di lapis luar. Saat phase stepper dijalankan, pengguna sedang masuk ke lapis dalam milik checkpoint tersebut.



### 5. Flow klasik yang harus divisualisasikan



Istilah “flow klasik” pada QAOA sebenarnya terdiri atas dua komponen yang berbeda. Komponen pertama adalah optimizer klasik di dalam loop hybrid. Komponen kedua adalah algoritma klasik pembanding, yaitu brute force dan Simulated Annealing.



#### 5.1 Flow klasik internal: optimizer QAOA



Optimizer klasik adalah pengendali utama loop hybrid. Flow-nya harus terlihat seperti berikut:



1. Inisialisasi parameter awal `gamma` dan `beta`.

2. Kirim parameter ke evaluator kuantum.

3. Terima `expected cut` dari evaluator.

4. Bandingkan dengan nilai sebelumnya.

5. Perbarui parameter berdasarkan aturan optimizer.

6. Simpan jejak evaluasi.

7. Ulangi sampai konvergen atau mencapai batas iterasi.

8. Tandai parameter terbaik sebagai checkpoint final.



Di backend saat ini, alur ini diwujudkan oleh `COBYLA` pada `run_qaoa_internal()`. Artinya, visualisasi optimizer tidak boleh dibuat seolah-olah menggunakan gradient descent atau random search, karena itu akan bertentangan dengan implementasi nyata.



#### 5.2 Flow klasik pembanding: brute force dan Simulated Annealing



Pembanding klasik tidak boleh ikut diputar sebagai animasi panjang yang mengganggu fokus utama. Akan tetapi, flow-nya tetap harus dijelaskan di panel kanan atau panel kiri agar pengguna memahami konteks evaluasi.



Flow brute force:



1. Enumerasi seluruh kemungkinan partisi bitstring.

2. Hitung nilai cut untuk setiap partisi.

3. Ambil nilai optimum sebagai referensi exact.



Flow Simulated Annealing:



1. Mulai dari partisi awal acak.

2. Pilih tetangga dengan membalik satu bit.

3. Hitung perubahan nilai cut.

4. Terima atau tolak solusi berdasarkan suhu.

5. Turunkan suhu.

6. Simpan best-so-far.

7. Ulangi hingga iterasi selesai.



Visual paling tepat untuk pembanding klasik adalah mini-plot atau strip chart, bukan animasi 3D penuh. Tujuannya adalah memberi konteks, bukan menyaingi fokus utama yang harus tetap berada pada loop hybrid QAOA.



### 6. Flow kuantum yang harus divisualisasikan



Flow kuantum harus divisualisasikan per evaluasi, bukan per keseluruhan training. Ini penting karena satu evaluasi QAOA adalah satu sirkuit lengkap dengan parameter tertentu.



#### 6.1 Fase 0: state awal



Semua qubit diawali dari $|0\rangle$. Di lane sirkuit, kolom pertama harus menunjukkan label state awal. Ini bukan langkah pasif; ini adalah baseline agar pengguna memahami bahwa semua superposisi dan struktur solusi dibangun dari state dasar yang sama.



#### 6.2 Fase 1: Hadamard layer



Setelah state awal, semua qubit menerima gerbang Hadamard. Ini harus terlihat sebagai satu kolom gate `H` pada semua wire. Secara visual, orb qubit bergerak dari kutub `|0>` menuju ekuator Bloch sebagai penanda superposisi.



Secara konsep, fase ini berarti ruang solusi dibuka. Semua kandidat partisi belum dibedakan satu sama lain. Di sinilah QAOA berbeda dari algoritma pencarian klasik yang biasanya memulai dari satu kandidat solusi saja.



#### 6.3 Fase 2: cost layer



Fase ini adalah jantung masalah Max-Cut. Untuk setiap edge pada graph, cost Hamiltonian menerapkan evolusi fase. Karena implementasi backend saat ini menggunakan dekomposisi `CX-Rz-CX`, maka setiap edge harus divisualisasikan sebagai tiga sub-gate di sirkuit:



1. `CX(q_u, q_v)`

2. `Rz(2 * gamma * weight)` pada qubit target

3. `CX(q_u, q_v)` kembali



Jika edge aktif adalah `(0,2)`, maka lane graph kiri dan lane gate tengah harus aktif bersamaan. Ini membuat penonton paham bahwa edge graph tertentu sedang diterjemahkan ke operasi fase pada sirkuit.



Untuk `p_layers > 1`, semua blok cost harus dikelompokkan per-layer. Jadi struktur yang benar bukan “semua edge lalu semua edge lagi tanpa label”, tetapi:



```text

Layer 1:

  edge (0,1)

  edge (1,2)

  edge (0,2)

Layer 2:

  edge (0,1)

  edge (1,2)

  edge (0,2)

```



Di UI, label layer harus permanen agar pengguna tidak kehilangan konteks.



#### 6.4 Fase 3: mixer layer



Setelah cost layer selesai, setiap qubit menerima `Rx(2 * beta)`. Ini juga harus divisualisasikan sebagai kolom gate permanen di lane sirkuit, bukan hanya satu disk `Rx` yang berpindah-pindah. Saat langkah aktif berjalan, gate `Rx` yang relevan diberi highlight, sedangkan gate lain tetap terlihat sebagai konteks struktur ansatz.



Makna visual dari mixer adalah eksplorasi. Jika cost layer memberi bobot pada solusi yang baik, mixer layer memberi kesempatan pada amplitudo untuk berpindah dan menjelajahi ruang solusi lain. Ini penting karena tanpa mixer, QAOA akan kehilangan kemampuan mencari kombinasi solusi yang lebih baik.



#### 6.5 Fase 4: measurement



Measurement harus ditampilkan sebagai kolom `M` permanen di ujung kanan semua wire. Saat fase ini aktif, histogram bitstring muncul, nilai probabilitas dominan diperbesar, dan graph solusi di lane kanan diwarnai sesuai bitstring dominan.



Di sini perlu dibedakan dua mode baca:



1. mode distribusi, yaitu melihat beberapa bitstring teratas,

2. mode solusi, yaitu menerjemahkan satu bitstring aktif menjadi partisi node.



Jika bitstring aktif adalah `101`, maka node dengan bit `1` dan bit `0` harus langsung terbagi warna berbeda.



#### 6.6 Fase 5: update kembali ke optimizer



Sesudah measurement, animasi tidak berhenti. Fokus harus kembali ke rail optimizer di atas. Harus ada pulse atau garis yang bergerak dari histogram hasil ke rail optimizer, lalu label objective diperbarui. Inilah titik paling penting untuk menunjukkan bahwa QAOA adalah hybrid. Tanpa lompatan ini, pengguna hanya melihat “sirkuit selesai”, bukan “hasil sirkuit dipakai untuk iterasi berikutnya”.



### 7. Flow lompat-lompatan yang benar



Lompatan antar-fase harus eksplisit. Ini daftar lompatan yang seharusnya ada.



#### 7.1 Lompatan level luar



1. `Graph/Hamiltonian -> Optimizer`

   Menunjukkan optimizer sedang memecahkan problem yang sudah diformulasikan.

2. `Optimizer -> Quantum Circuit`

   Menunjukkan parameter aktif dikirim ke evaluator kuantum.

3. `Quantum Circuit -> Measurement`

   Menunjukkan sirkuit menghasilkan distribusi hasil.

4. `Measurement -> Optimizer`

   Menunjukkan objective kembali ke loop klasik.

5. `Optimizer -> Checkpoint Berikutnya`

   Menunjukkan iterasi berlanjut.

6. `Checkpoint Terbaik -> Final Comparison`

   Menunjukkan training selesai dan solusi terbaik dibandingkan dengan exact serta SA.



#### 7.2 Lompatan level dalam



Di dalam satu checkpoint, flow stepper harus selalu mengikuti urutan tetap:



1. `Optimizer`

2. `Superposition`

3. `Cost`

4. `Mixer`

5. `Measurement`

6. `Update`



Urutan ini tidak boleh diacak. Jika ingin mempercepat playback, durasi bisa dipercepat, tetapi urutan tidak boleh diubah karena itu adalah struktur algoritmiknya.



### 8. Flow visual yang disarankan untuk file `flow-visualize-qaoa.md`



Bagian ini merangkum flow final yang paling layak dipakai sebagai blueprint.



#### 8.1 Flow level sistem



```text

Mulai

-> muat dataset kasus QAOA

-> tampilkan graph input dan baseline klasik

-> bangun Hamiltonian Ising dari graph

-> tampilkan convergence rail optimizer

-> pilih satu checkpoint optimizer

-> kirim gamma/beta checkpoint ke lane kuantum

-> jalankan sirkuit QAOA gate-by-gate

-> tampilkan measurement distribution

-> kirim nilai objective kembali ke optimizer

-> jika masih eksplorasi checkpoint lain, ulangi

-> jika checkpoint terbaik aktif, tampilkan solusi final

-> bandingkan dengan exact dan Simulated Annealing

-> selesai

```



#### 8.2 Flow level gate untuk satu checkpoint



```text

|0> semua qubit

-> H semua qubit

-> untuk setiap layer:

   -> untuk setiap edge:

      -> CX

      -> Rz(2*gamma*w)

      -> CX

   -> untuk setiap qubit:

      -> Rx(2*beta)

-> Measure semua qubit

-> ambil bitstring dominan / best sampled cut

-> update expected cut dan best-so-far

```



#### 8.3 Flow level panel kanan



Panel kanan tidak boleh hanya informatif. Panel kanan harus mengikuti langkah aktif.



1. Saat `optimizer`, panel kanan menonjolkan `gamma`, `beta`, `eval_index`, `expected_cut_history`.

2. Saat `cost`, panel kanan menonjolkan edge aktif, term Hamiltonian aktif, dan formula sudut fase.

3. Saat `mixer`, panel kanan menonjolkan qubit aktif dan sudut `Rx`.

4. Saat `measurement`, panel kanan menonjolkan top bitstrings dan partisi graph.

5. Saat `update`, panel kanan menonjolkan perubahan `best_so_far`.



### 9. Kebutuhan gate visual yang wajib ada



Bagian ini paling penting karena ini inti keluhan visual saat ini.



Gate yang wajib selalu terlihat:



1. `H` pada semua qubit.

2. Blok cost per edge.

3. `Rx` pada semua qubit per layer.

4. `M` pada semua qubit.

5. Label `Layer 1`, `Layer 2`, dan seterusnya.



Gate yang wajib terlihat sebagai struktur, bukan hanya label aktif:



1. `CX-Rz-CX` untuk cost edge.

2. `Rx` individual untuk mixer.

3. `M` final untuk readout.



Jika visual ingin disederhanakan, cost block boleh ditulis sebagai `ZZ(edge)` selama pengguna masih bisa membuka atau melihat bahwa blok itu setara dengan dekomposisi `CX-Rz-CX`. Jika tidak, visual akan terasa terlalu konseptual dan kehilangan rasa “sirkuit nyata”.



### 10. Mismatch penting antara backend saat ini dan narasi visual



Ada satu hal penting yang harus dijaga dalam redesign. Backend saat ini menghitung objective optimizer menggunakan ekspektasi Hamiltonian dari statevector, bukan dari hasil sampling measurement. Akan tetapi, animasi juga menampilkan hasil measurement dari circuit ber-shots. Ini berarti ada dua sumber angka:



1. `expected_cut` dari evaluasi statevector,

2. `dominant_cut` atau `best_cut` dari distribusi sampling.



Dokumen visualisasi harus mengakui keduanya. Jangan membuat narasi seolah-olah optimizer diperbarui langsung dari bitstring dominan, karena itu tidak sesuai dengan implementasi sekarang. Yang benar adalah optimizer memperbarui parameter berdasarkan `expected_cut`, sementara measurement dipakai untuk memvisualisasikan bagaimana solusi diskrit tampak pada sampel hasil.



### 11. Usulan flow implementasi ulang



Jika visualisasi QAOA ingin benar-benar setara kualitasnya dengan Deutsch-Jozsa, implementasi ulang sebaiknya mengikuti urutan kerja berikut:



1. Bekukan desain lane tiga bagian: klasik, hybrid, kuantum.

2. Ubah scene QAOA agar landmark gate permanen muncul penuh.

3. Petakan setiap edge dataset menjadi blok cost visual.

4. Tambahkan label layer permanen.

5. Sinkronkan highlight graph kiri dengan cost block di sirkuit.

6. Sinkronkan rail optimizer dengan checkpoint aktif.

7. Sinkronkan measurement histogram dengan graph solusi kanan.

8. Tambahkan panah transisi `optimizer -> circuit -> measurement -> optimizer`.

9. Pisahkan teks `expected cut` dan `sampled cut`.

10. Baru sesudah itu perhalus animasi dan ekspor video.



### 12. Ringkasan akhir



Visualisasi QAOA yang baik tidak boleh hanya “graph kiri, graph kanan, lalu gate aktif sesekali”. Struktur yang benar harus menunjukkan bahwa QAOA adalah loop hybrid yang menghubungkan problem Max-Cut, optimizer klasik, dan sirkuit kuantum gate-level. Karena itu, flow visualisasi harus dibangun di atas tiga komponen yang terbaca jelas: track klasik, track hybrid, dan track kuantum. Di dalam track kuantum, gate harus permanen sebagai landmark seperti pada Deutsch-Jozsa. Di dalam track hybrid, lompatan dari optimizer ke sirkuit dan kembali lagi harus divisualisasikan secara eksplisit. Jika struktur ini dipenuhi, animasi tidak lagi terasa lompat-lompat dan pengguna dapat memahami bukan hanya hasil akhirnya, tetapi juga cara kerja QAOA secara utuh.



pakai react

gunakan threejs



qaoa1.json:

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



untuk style nya ikuti:

```

palet warna tema secara singkat:

* **Biru Utama (Primary Blue):** `~#3B82F6` (Digunakan pada blok "HASIL" dan kotak angka).

* **Biru Muda (Light Blue):** `~#EFF6FF` (Digunakan pada latar belakang item list/query).

* **Biru Dongker / Slate (Dark Text):** `~#1E293B` (Digunakan pada teks judul utama seperti "INPUTS", "ORACLE").

* **Abu-abu (Border/Muted Text):** `~#CBD5E1` (Digunakan pada garis tepi kartu, panah, dan teks sekunder).

* **Putih (Background):** `#FFFFFF` (Digunakan pada latar belakang kartu utama).

```
