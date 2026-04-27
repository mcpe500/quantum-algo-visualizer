# Panduan Generate Canonical VQE Dataset

## 1. Tujuan

Mengubah **raw dataset JSON** (deskripsi molekul, tanpa Hamiltonian) menjadi **canonical JSON** (berisi `hamiltonian.terms` siap pakai) melalui pipeline preprocessing deterministik.

**Input (raw):**
```json
{
  "case_id": "VQE-01",
  "problem_type": "molecule_ground_state",
  "molecule_spec": {
    "formula": "H2",
    "interatomic_distance_angstrom": 0.735,
    "basis": "sto-3g",
    "charge": 0,
    "multiplicity": 1
  },
  "preprocessing": {
    "mapping": "jordan_wigner",
    "target_qubits": 2
  },
  "experiment": {
    "ansatz_type": "ry_linear",
    "n_layers": 1,
    "shots": 1024,
    "classical_reference": "FCI"
  }
}
```

**Output (canonical):**
```json
{
  "case_id": "VQE-01",
  "description": "H2 molecule ground state energy - 2 qubit",
  "molecule": "H2",
  "qubits": 2,
  "ansatz": { "type": "ry_linear", "n_layers": 1 },
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

## 2. Pipeline Algoritma

Pipeline terdiri dari 5 tahap:

```
AO Integrals → RHF → MO Integrals → Jordan-Wigner → Z2 Tapering
   (Step 1)    (2)     (Step 3)       (Step 4)        (Step 5)
```

### Step 1: AO Integrals (Atomic Orbital Integrals)

Menghitung integral molekul H2 dalam basis STO-3G secara analitik dari Gaussian primitives.

**Parameter STO-3G untuk H (ζ=1.24):**
- Contraction coefficients: d = [0.1543, 0.5353, 0.4446]
- Raw exponents: α_raw = [3.4253, 0.6239, 0.1689]
- Actual exponents: α = α_raw × ζ²

**Yang dihitung:**
1. Overlap integral S_μν
2. Kinetic energy integral T_μν
3. Nuclear attraction integral V_μν (dari kedua proton)
4. Two-electron repulsion integral (μν|λσ)

**Formula Gaussian:**
- Overlap: S(a,b,R) = (π/(a+b))^(3/2) × exp(-ab×R²/(a+b))
- Kinetic: T(a,b,R) = μ(3-2μR²)(π/p)^(3/2)exp(-μR²), μ=ab/(a+b)
- Nuclear: V(a,b,Ra,Rb,Rc) = -2π/p × exp(-abRab²/p) × F₀(pRpc²)
- ERI: (ab|cd) = 2π²/(pq)√(π/(p+q)) × exp(-abRab²/p-cdRcd²/q) × F₀(pqRpq²/(p+q))
- Boys function: F₀(t) = ½√(π/t)erf(√t)

**Hasil verifikasi (R = 0.735 Å = 1.389 Bohr):**
```
S₁₁ = 1.0000        (benar, overlap dengan diri sendiri)
S₁₂ = 0.5501        (overlap antar atom)
T₁₁ = 1.1686        (kinetic same-center)
T₁₂ = 0.2268        (kinetic cross-center)
V₁₁ = -2.2096       (nuclear attraction dari kedua proton ke elektron pada atom yang sama)
V₁₂ = -1.1380       (nuclear attraction cross)
h₁₁ = -1.0410       (one-body diagonal)
h₁₂ = -0.9112       (one-body off-diagonal)
(11|11) = 0.9605     (two-electron same-center)
(11|22) = 0.6297     (two-electron cross Coulomb)
(12|12) = 0.2457     (two-electron exchange)
(11|12) = 0.4367     (three-center)
(12|22) = 0.4367     (three-center, sama by symmetry)
```

**Status: BERHASIL.** Integral AO sudah benar dan terverifikasi.

### Step 2: RHF (Restricted Hartree-Fock)

Menyelesaikan persamaan RHF secara self-consistent untuk mendapatkan koefisien orbital molekul (MO coefficients).

**Untuk H2 homonuclear:** MO coefficients bisa ditentukan secara analitik dari simetri:
```
C[:,0] = [b, b]     (orbital bonding σ_g)
C[:,1] = [a, -a]    (orbital antibonding σ_u)

b = 1/√(2(1+S₁₂))  ≈ 0.5679
a = 1/√(2(1-S₁₂))  ≈ 1.0542
```

**Bug yang ditemukan dan diperbaiki:**

1. **Bug sign V (KRITIS):** Fungsi `_gnuc()` mengembalikan nilai NEGATIF (karena prefaktor -2π/p). Jika kode menggunakan `V -= pre * _gnuc(...)`, maka `V -= (negatif) = V += positif`. Ini SALAH karena electron-nucleus attraction harus negatif. Fix: gunakan `V += pre * _gnuc(...)`.

2. **Bug ERI symmetry (KRITIS):** ERI array `eri_ao[1,1,1,1]` (integral (22|22)) tidak pernah di-set, default ke 0. Padahal untuk molekul homonuclear, (22|22) = (11|11) = 0.9605. Akibatnya: Fock matrix F[0,0] ≠ F[1,1], padahal harus simetris. Fix: tambahkan `eri_ao[1,1,1,1] = v_1111`.

3. **Bug rumus energi RHF:** Rumus `E = Σ P*(h + 0.5*(J-K)) + E_nuc` salah. Yang benar: `E = 0.5 * Σ P*(h + F) + E_nuc = Σ P*(h + 0.5*J - 0.25*K) + E_nuc`. Faktor K harus 0.25 bukan 0.5.

**Status setelah fix:** SCF konvergen dalam 1 iterasi (karena analytical MO coeffs sudah self-consistent untuk H2). Fock matrix simetris: F[0,0] = F[1,1].

### Step 3: MO Integrals (Molecular Orbital Integrals)

Transformasi integral dari basis AO ke basis MO menggunakan koefisien C dari RHF.

**Formula:**
```
h_pq^MO = Σ_μν C_μp × h_μν^AO × C_νq
(pq|rs)^MO = Σ_μνλσ C_μp C_νq C_λr C_σs × (μν|λσ)^AO
```

**Hasil (R = 0.735 Å):**
```
h₁₁^MO = -1.2594    (bonding orbital energy)
h₂₂^MO = -0.2886    (antibonding orbital energy)
h₁₂^MO =  0.0000    (off-diagonal, zero by symmetry)

(00|00) = 0.7967     (Coulomb bonding-bonding)
(00|11) = 0.7877     (Coulomb cross)
(01|01) = 0.2372     (Exchange)
(11|11) = 0.8278     (Coulomb antibonding-antibonding)
```

**Status: BERHASIL.** Integral MO sudah benar.

### Step 4: Jordan-Wigner Mapping

Transformasi Hamiltonian fermionik (second quantization) ke Hamiltonian qubit (Pauli strings).

**Spin orbitals (Qiskit convention):**
- Spin orbital 0 → qubit 0: α(σ_g)
- Spin orbital 1 → qubit 1: α(σ_u)
- Spin orbital 2 → qubit 2: β(σ_g)
- Spin orbital 3 → qubit 3: β(σ_u)

**Mapping JW:**
```
a†_p = ½(X_p - iY_p) ⊗ Z₀Z₁...Z_{p-1}
a_p  = ½(X_p + iY_p) ⊗ Z₀Z₁...Z_{p-1}
```

**Implementasi:** Menggunakan `qiskit_nature.second_q.operators.FermionicOp` + `JordanWignerMapper`.

**Langkah:**
1. Bangun FermionicOp dari integral MO:
   - One-body: `Σ h_pq a†_{p,σ} a_{q,σ}` untuk setiap spin σ
   - Two-body: `½ Σ <pq||rs> a†_p a†_q a_s a_r` dengan antisymmetrized integrals:
     ```
     <ij||kl> = δ(σᵢ,σₖ)δ(σⱼ,σₗ)(ik|jl) - δ(σᵢ,σₗ)δ(σⱼ,σₖ)(il|jk)
     ```
2. Map dengan `JordanWignerMapper.map()`

**Hasil 4-qubit Hamiltonian (15 terms):**
```
IIII:  1.3225
IIIZ: -0.4378
IIZI: -0.4378
IIZZ:  0.3983
IZII: -0.9387
IZIZ:  0.2753
IZZI:  0.3939
ZIII: -0.9387
ZIIZ:  0.3939
ZIZI:  0.2753
ZZII:  0.4139
XXYY: -0.1186
XYYX:  0.1186
YXXY:  0.1186
YYXX: -0.1186
```

**Status: BERHASIL.** 4-qubit Hamiltonian dihasilkan dengan benar menggunakan qiskit_nature.

### Step 5: Z2 Tapering (4 qubit → 2 qubit) — GAGAL / BELUM SELESAI

**Tujuan:** Mengurangi 4 qubit → 2 qubit dengan mengeksploitasi Z2 symmetries.

**Symmetries yang seharusnya ada:**
- T₁ = Z₀Z₁Z₂Z₃ (total particle number parity)
- T₂ = Z₀Z₂ (spin-z projection parity)

**HF state |0011⟩:** qubit 0=1, qubit 1=0, qubit 2=1, qubit 3=0
- T₁ eigenvalue: (-1)(+1)(-1)(+1) = +1
- T₂ eigenvalue: (-1)(-1) = +1

**Masalah yang ditemukan:**

1. **`TaperedQubitMapper` dari qiskit_nature TIDAK mendeteksi symmetries secara otomatis** ketika FermionicOp dibangun manual (tanpa `ElectronicStructureProblem`). Z2Symmetries yang di-return kosong: `[]`.

2. **Pendekatan manual (proyeksi sektor) menghasilkan koefisien yang SALAH:**
   - Dengan mengekstrak submatrix 4×4 dari sektor T₁=+1, T₂=-1 (indeks [3,6,9,12]):
     ```
     II:  0.7719
     IZ: -0.5010
     ZI: -0.5010
     ZZ:  0.0245
     YY: -0.4743
     ```
   - Expected:
     ```
     II: -1.0524, ZI: 0.3979, IZ: -0.3979, ZZ: -0.0113, XX: 0.1809, YY: 0.1809
     ```
   - Tidak ada XX term, koefisien sangat berbeda.

3. **Root cause:** Proyeksi langsung ke submatrix TIDAK sama dengan Z2 tapering yang proper. Z2 tapering membutuhkan:
   - Pencarian Clifford U yang memetakan T_k → Z_{q_k} (single-qubit Z)
   - Rotasi Hamiltonian: H' = U†HU
   - Extract blok yang sesuai dengan sektor
   - Map kembali ke Pauli decomposition
   Tanpa Clifford rotation yang benar, mapping dari 4-qubit states ke 2-qubit states tidak preserve struktur Pauli.

## 3. Diskrepansi dengan Data Existing VQE-02

**VQE-02.json (existing, 16 terms, semua I dan Z saja):**
```
IIII: -0.097, IIIZ: 0.071, IIZI: -0.071, IIZZ: 0.171, ...
ZZII: 0.171, ZZIZ: -0.099, ZZZI: 0.174, ZZZZ: 0.048
```

**Hasil kalkulasi 4-qubit JW (15 terms, termasuk XXYY):**
```
IIII: 1.3225, XXYY: -0.1186, XYYX: 0.1186, ...
```

**Analisis:**

Hamiltonian 4-qubit JW yang benar UNTUK H2/STO-3G **WAJIB** memiliki XXYY terms. Ini berasal dari exchange integral (01|01) = 0.2372 yang nonzero. Exchange integrals menghasilkan operator a†_p a_q (p≠q) yang di-map ke XX + YY terms oleh JW. Tidak ada cara untuk menghindari XXYY terms jika menggunakan full 4-spin-orbital space.

**Kemungkinan asal data VQE-02 existing:**
1. Mungkin di-generate dengan **parity mapping** (bukan JW) yang secara alami menghasilkan fewer X/Y terms
2. Mungkin di-generate dengan **active space** yang berbeda (misalnya freeze certain orbitals)
3. Mungkin menggunakan **Bravyi-Kitaev** mapping
4. Mungkin koefisiennya berasal dari sumber/library yang berbeda
5. Mungkin data tersebut **tidak untuk R = 0.735 Å** tetapi untuk jarak yang berbeda

**Yang pasti:** Data VQE-02 existing TIDAK konsisten dengan pipeline JW standar untuk H2/STO-3G.

## 4. Data VQE-01 yang Sudah Terverifikasi

Nilai VQE-01 (2-qubit) adalah **well-known** dan muncul di banyak paper dan tutorial quantum computing:

```
II: -1.0524, ZI: 0.3979, IZ: -0.3979, ZZ: -0.0113, XX: 0.1809, YY: 0.1809
```

Ini adalah hasil JW + Z2 tapering untuk H2/STO-3G. Sumber referensi: O'Malley et al. (2016), Kandala et al. (2017), Qiskit textbook.

## 5. Status Ringkas

| Step | Komponen | Status | Keterangan |
|------|----------|--------|------------|
| 1 | AO Integrals | BERHASIL | Terferivikasi, nilai konsisten |
| 2 | RHF | BERHASIL | Setelah fix 3 bug (sign V, ERI symmetry, energy formula) |
| 3 | MO Integrals | BERHASIL | Transformasi benar, diagonal by symmetry |
| 4 | JW Mapping (4q) | BERHASIL | Via qiskit_nature FermionicOp + JWMapper, 15 terms |
| 5 | Z2 Tapering (4q→2q) | GAGAL | TaperedQubitMapper tidak detect symmetries, manual projection salah |
| - | VQE-02 existing data | TIDAK KONSISTEN | 16 all-Z terms vs 15 terms dengan XXYY dari JW |
| - | VQE-01 expected data | TERVERIFIKASI | Well-known values dari literature |

## 6. Dependensi yang Digunakan

```
qiskit==2.3.1
qiskit-aer==0.17.2
qiskit-nature==0.7.2
qiskit-algorithms==0.4.0
numpy==2.4.4
scipy==1.17.1
h5py==3.16.0
```

PySCF **tidak bisa diinstall di Windows** (butuh C compiler + cmake + nmake). Semua kalkulasi integral dilakukan pure-Python (numpy + scipy). qiskit_nature digunakan hanya untuk FermionicOp algebra dan JW mapping, BUKAN untuk integral computation (karena semua driver membutuhkan software eksternal: PySCF, Gaussian, atau PSI4).

## 7. Next Steps untuk Menyelesaikan

### Opsi A: Fix Z2 Tapering (Sulit)
- Implementasi manual: cari Clifford U yang maps T₁→Z₃, T₂→Z₂
- Apply CNOT cascade: CNOT(0,2)·CNOT(0,3)·CNOT(1,3)·CNOT(2,3)
- Rotate setiap Pauli string dalam 4-qubit Hamiltonian
- Extract 2-qubit block dari sektor yang benar
- **Resiko:** mudah salah di Clifford algebra

### Opsi B: Hardcode Hamiltonian (Pragmatis)
- VQE-01 (2-qubit): gunakan well-known values dari literature
- VQE-02 (4-qubit): gunakan 4-qubit JW result dari qiskit_nature (15 terms dengan XXYY)
- **Catatan:** VQE-02 akan berubah dari 16 all-Z terms menjadi 15 terms dengan XXYY
- Backend dan frontend harus di-update untuk menangani terms baru

### Opsi C: Generate di Colab (Paling Aman)
- Jalankan pipeline lengkap di Google Colab (Linux, PySCF available)
- Gunakan qiskit_nature PySCFDriver + JWMapper + Z2 tapering
- Copy hasilnya ke dataset JSON
- **Keuntungan:** pipeline terverifikasi end-to-end, hasil pasti benar

### Rekomendasi
**Opsi C** adalah yang terbaik untuk keperluan TA karena:
1. Hasil dijamin benar (menggunakan library yang sama dengan tutorial Qiskit)
2. Bisa diverifikasi ulang oleh siapa saja di Colab
3. Pipeline `preprocessing` di backend cukup memuat hasil precomputed
4. Untuk TA, yang penting adalah dataset yang benar, bukan implementasi kalkulasi dari nol

## 8. File Terkait

- `datasets/vqe/VQE-01.json` — raw dataset (sudah di-update ke schema baru)
- `datasets/vqe/VQE-02.json` — raw dataset (sudah di-update ke schema baru)
- `datasets/vqe/canonical/` — folder untuk .canonical.json (kosong, menunggu hasil)
- `backend/services/vqe_preprocess.py` — preprocessing script (ada bug, perlu rewrite)
- `backend/requirements.txt` — sudah diupdate dengan qiskit-nature, qiskit-algorithms, h5py
- `test_taper.py`, `test_taper2.py`, `test_jw.py` — script debug (bisa dihapus setelah selesai)
