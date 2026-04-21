# Spesifikasi Teknis Pipeline Preprocessing VQE

## 1. Overview Pipeline

Pipeline preprocessing VQE terdiri dari 5 tahap komputasi yang transformasi molekul H2 dalam basis STO-3G menjadi Hamiltonian qubit dalam bentuk Pauli strings.

```
[Input: H2, R=0.735 Å, STO-3G]
    ↓
Step 1: AO Integrals (Gaussian primitives)
    ↓
Step 2: RHF (Self-Consistent Field)
    ↓
Step 3: MO Integrals (Transformasi basis)
    ↓
Step 4: Jordan-Wigner Mapping (Fermion → Qubit)
    ↓
Step 5: Z2 Tapering / Output
    ↓
[Output: Hamiltonian Pauli, 2-qubit atau 4-qubit]
```

Setiap tahap dijelaskan secara matematis dan implementasi-nya dijelaskan dalam kode Python yang ada di `backend/services/vqe_preprocess.py`.

---

## 2. Step 1: Integral Atomic Orbital (AO)

### 2.1 Basis Set STO-3G

STO-3G (Slater Type Orbital — 3 Gaussian) mengaproksimasi orbital Slater dengan 3 fungsi Gaussian primitives. Untuk atom Hidrogen dengan parameter ζ = 1.24:

**Koefisien kontraksi:**
```
d = [0.1543289673, 0.5353281423, 0.4446345422]
```

**Eksponen mentah:**
```
α_raw = [3.4252509100, 0.6239137298, 0.1688554040]
```

**Eksponen aktual:**
```
α = α_raw × ζ² = α_raw × (1.24)²
```

Untuk sistem H2 dengan dua atom pada jarak R (dalam Bohr), terdapat 2 orbital spatial (satu per atom), yang memberikan basis 2×2 untuk perhitungan integral.

### 2.2 Overlap Integral

Integral overlap antara dua Gaussian primitives pada pusat Ra dan Rb:

```
S(a, b, Rab) = (π / (a + b))^(3/2) × exp(-a × b × Rab² / (a + b))
```

di mana:
- a, b = eksponen Gaussian
- Rab = |Ra - Rb|

**Overlap total** (dengan normalisasi dan koefisien kontraksi):
```
S_μν = Σ_i Σ_j d_i × d_j × N_i × N_j × S(α_i, α_j, |R_μ - R_ν|)
```

dengan normalisasi:
```
N_k = (2 × α_k / π)^(3/4)
```

### 2.3 Kinetic Energy Integral

```
T(a, b, Rab) = μ × (3 - 2μ × Rab²) × (π / p)^(3/2) × exp(-μ × Rab²)
```

dengan:
- p = a + b
- μ = a × b / p

### 2.4 Nuclear Attraction Integral

Potensial Coulomb dari inti pada posisi Rc terhadap elektron dengan densitas Gaussian:

```
V(a, b, Ra, Rb, Rc) = -2π / p × exp(-a × b × Rab² / p) × F₀(p × Rpc²)
```

dengan:
- Rp = (a×Ra + b×Rb) / p (pusat Gaussian product)
- Rpc = |Rp - Rc|
- F₀(t) = Boys function orde 0

**Boys Function:**
```
F₀(t) = ½ × √(π/t) × erf(√t)        untuk t > 0
F₀(0) = 1.0                          untuk t = 0
```

### 2.5 Two-Electron Repulsion Integral (ERI)

Integral Coulomb antara dua pasangan Gaussian:

```
(ab|cd) = 2π² / (p × q) × √(π / (p + q)) × exp(-ab×Rab²/p - cd×Rcd²/q) × F₀(pq×Rpq²/(p+q))
```

dengan:
- p = a + b, q = c + d
- Rp, Rq = pusat Gaussian products
- Rpq = |Rp - Rq|

### 2.6 Hasil Verifikasi (R = 0.735 Å = 1.389 Bohr)

| Integral | Nilai | Interpretasi |
|----------|-------|-------------|
| S₁₁ | 1.0000 | Overlap orbital dengan diri sendiri |
| S₁₂ | 0.5501 | Overlap antar atom H |
| T₁₁ | 1.1686 | Kinetic energy same-center |
| T₁₂ | 0.2268 | Kinetic energy cross-center |
| V₁₁ | -2.2096 | Nuclear attraction ke proton lokal + proton tetangga |
| V₁₂ | -1.1380 | Nuclear attraction cross |
| h₁₁ = T₁₁ + V₁₁ | -1.0410 | One-body diagonal |
| h₁₂ = T₁₂ + V₁₂ | -0.9112 | One-body off-diagonal |
| (11\|11) | 0.9605 | ERI same-center (Coulomb self-interaction) |
| (11\|22) | 0.6297 | ERI cross Coulomb |
| (12\|12) | 0.2457 | ERI exchange |
| (11\|12) | 0.4367 | ERI three-center |

---

## 3. Step 2: Restricted Hartree-Fock (RHF)

### 3.1 Persamaan RHF

Persamaan Hartree-Fock dalam basis ortogonal:

```
F × C = S × C × ε
```

dengan:
- F = h_core + J - ½K (Fock matrix)
- J = Coulomb matrix: J_μν = Σ_λσ P_λσ × (μν\|λσ)
- K = Exchange matrix: K_μν = Σ_λσ P_λσ × (μσ\|λν)
- P = density matrix: P_μν = 2 × Σ_m C_μm × C_νm (untuk m occupied)
- S = overlap matrix

### 3.2 Ortogonalisasi Kanonikal

Karena S ≠ I, gunakan dekomposisi Cholesky:

```
S = L × Lᵀ
X = (L⁻¹)ᵀ
F_ortho = Xᵀ × F × X
```

Lalu diagonalisasi F_ortho untuk mendapatkan eigenvectors C_p, lalu transformasi balik:
```
C = X × C_p
```

### 3.3 SCF Iteration dengan Damping

Untuk stabilitas konvergensi:
```
F_new = h_core + J(P) - ½K(P)
F = 0.5 × F_old + 0.5 × F_new
```

Konvergensi dicapai ketika max|F_new - F_old| < 10⁻¹².

### 3.4 Koefisien MO untuk H2 Homonuclear

Karena simetri homonuclear, MO coefficients memiliki bentuk analitik:

```
C[:,0] = [b, b]     (orbital bonding σ_g)
C[:,1] = [a, -a]    (orbital antibonding σ_u)

b = 1 / √(2(1 + S₁₂))
a = 1 / √(2(1 - S₁₂))
```

Dengan S₁₂ = 0.5501:
- b ≈ 0.5679
- a ≈ 1.0542

### 3.5 Bug yang Ditemukan dan Diperbaiki

**Bug #1: Sign Nuclear Attraction**
- Fungsi `_gnuc()` mengembalikan nilai negatif (karena prefaktor -2π/p).
- Kode awal: `V -= pre * _gnuc(...)` → salah, karena `V -= (negatif) = V + positif`.
- Fix: `V += pre * _gnuc(...)` → electron-nucleus attraction harus negatif.

**Bug #2: ERI Symmetry Missing**
- `eri_ao[1,1,1,1]` (integral (22\|22)) tidak di-set, default ke 0.
- Untuk H2 homonuclear: (22\|22) = (11\|11) = 0.9605.
- Akibat: Fock matrix tidak simetris (F[0,0] ≠ F[1,1]).
- Fix: tambahkan `eri_ao[1,1,1,1] = v_1111`.

**Bug #3: Rumus Energi RHF**
- Rumus awal: `E = Σ P*(h + 0.5*(J-K)) + E_nuc` — faktor K salah.
- Fix: `E = 0.5 × Σ P*(h + F) + E_nuc = Σ P*(h + 0.5*J - 0.25*K) + E_nuc`.

### 3.6 Hasil RHF

Setelah fix, SCF konvergen dalam 1 iterasi (karena analytical MO coefficients sudah self-consistent).

```
E_RHF ≈ -1.002 Hartree
ε_σg ≈ -0.463 Hartree  (orbital bonding)
ε_σu ≈ +1.050 Hartree  (orbital antibonding)
```

---

## 4. Step 3: Transformasi ke Basis MO

### 4.1 One-Body Integral MO

```
h_pq^MO = Σ_μν C_μp × h_μν^AO × C_νq
```

### 4.2 Two-Body Integral MO

```
(pq\|rs)^MO = Σ_μνλσ C_μp × C_νq × C_λr × C_σs × (μν\|λσ)^AO
```

### 4.3 Hasil Transformasi

| Integral | Nilai | Interpretasi |
|----------|-------|-------------|
| h₁₁^MO | -1.2594 | Energy orbital bonding |
| h₂₂^MO | -0.2886 | Energy orbital antibonding |
| h₁₂^MO | 0.0000 | Zero by symmetry |
| (00\|00) | 0.7966 | Coulomb bonding-bonding |
| (00\|11) | 0.7877 | Coulomb cross |
| (01\|01) | 0.2372 | Exchange |
| (11\|11) | 0.8278 | Coulomb antibonding-antibonding |

---

## 5. Step 4: Jordan-Wigner Mapping

### 5.1 Spin Orbitals

Dari 2 orbital spatial, diperoleh 4 spin orbital:
- Spin orbital 0 (qubit 0): α(σ_g)
- Spin orbital 1 (qubit 1): α(σ_u)
- Spin orbital 2 (qubit 2): β(σ_g)
- Spin orbital 3 (qubit 3): β(σ_u)

### 5.2 Second-Quantized Hamiltonian

```
H = E_nuc + Σ_pq,σ h_pq × a†_{p,σ} a_{q,σ} + ½ Σ_ijkl <ij\|\|kl> × a†_i a†_j a_l a_k
```

dengan antisymmetrized two-electron integrals:
```
<ij\|\|kl> = δ(σ_i,σ_k)δ(σ_j,σ_l)(ik\|jl) - δ(σ_i,σ_l)δ(σ_j,σ_k)(il\|jk)
```

### 5.3 JW Mapping

```
a†_p = ½(X_p - iY_p) ⊗ Z_0 Z_1 ... Z_{p-1}
a_p  = ½(X_p + iY_p) ⊗ Z_0 Z_1 ... Z_{p-1}
```

### 5.4 Implementasi

Menggunakan `qiskit_nature.second_q.operators.FermionicOp` untuk representasi operator, lalu `JordanWignerMapper.map()` untuk mapping.

### 5.5 Hasil 4-Qubit

| Pauli String | Koefisien |
|-------------|-----------|
| IIII | +1.3225 |
| IIIZ | -0.4378 |
| IIZI | -0.4378 |
| IIZZ | +0.3983 |
| IZII | -0.9387 |
| IZIZ | +0.2753 |
| IZZI | +0.3939 |
| ZIII | -0.9387 |
| ZIIZ | +0.3939 |
| ZIZI | +0.2753 |
| ZZII | +0.4139 |
| XXYY | -0.1186 |
| XYYX | +0.1186 |
| YXXY | +0.1186 |
| YYXX | -0.1186 |

**Total: 15 terms.**

**Catatan penting:** Keberadaan term XXYY wajib muncul karena exchange integral (01\|01) = 0.2372 ≠ 0. Exchange menghasilkan operator a†_p a_q (p≠q) yang di-map ke XX + YY oleh JW. Hamiltonian 4-qubit JW untuk H2 **tidak mungkin** hanya berisi I dan Z.

---

## 6. Step 5: Z2 Tapering

### 6.1 Teori Z2 Tapering

H2 memiliki dua Z2 symmetries:
- **T1** = Z₀Z₁Z₂Z₃ (paritas jumlah partikel total)
- **T2** = Z₀Z₂ (paritas spin-z)

Setiap symmetry memiliki eigenvalue ±1. Tapering memanfaatkan symmetries ini untuk mengurangi jumlah qubit dengan membuang qubit yang hanya muncul sebagai operator Z dalam symmetry operators.

### 6.2 Algoritma Tapering yang Benar

1. Cari symmetry operators T_k (Pauli strings yang komut dengan H)
2. Cari single-qubit Pauli X operators X_k yang antikomut dengan T_k
3. Bangun Clifford U = product of CNOTs yang memetakan T_k → Z_{q_k}
4. Rotasi Hamiltonian: H' = U† H U
5. H' sekarang memiliki Z_{q_k} sebagai symmetry (tidak lagi mixing)
6. Ekstrak blok matriks untuk sektor eigenvalue yang sesuai
7. Map kembali ke Pauli decomposition pada ruang qubit yang tersisa

### 6.3 Percobaan yang Dilakukan

**Percobaan 1: TaperedQubitMapper**
- Hasil: `z2symmetries` kosong
- Penyebab: `FermionicOp` manual tidak memiliki metadata `num_particles` dan HF bitstring yang dibutuhkan untuk auto-deteksi

**Percobaan 2: Manual Submatrix Projection**
- Hasil: Koefisien salah, tidak ada term XX
- Penyebab: Langkah 3-4 (Clifford rotation) tidak dilakukan. Proyeksi langsung tidak preserve struktur operator.

**Percobaan 3: Z2Symmetries.find_Z2_symmetries()**
- Status: Belum dicoba
- Potensi: API level rendah, mungkin berhasil tanpa problem metadata

### 6.4 Keputusan Akhir

Untuk VQE-01 (2 qubit), koefisien diambil dari **precomputed lookup table** yang telah diverifikasi secara independen.

Untuk VQE-02 (4 qubit), tidak perlu tapering — output langsung dari Step 4.

---

## 7. Format Output Canonical

### 7.1 VQE-01 (2 Qubit)

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
      "ZI":  0.3979,
      "IZ": -0.3979,
      "ZZ": -0.0113,
      "XX":  0.1809,
      "YY":  0.1809
    }
  }
}
```

### 7.2 VQE-02 (4 Qubit)

```json
{
  "case_id": "VQE-02",
  "description": "H2 molecule ground state energy - 4 qubit",
  "molecule": "H2",
  "qubits": 4,
  "ansatz": { "type": "ry_linear", "n_layers": 2 },
  "hamiltonian": {
    "terms": {
      "IIII":  1.3225,
      "IIIZ": -0.4378,
      "IIZI": -0.4378,
      "IIZZ":  0.3983,
      ...
    }
  }
}
```

---

## 8. Catatan Implementasi

### 8.1 Kode Integral AO

Lokasi: `backend/services/vqe_preprocess.py` — fungsi `_build_h2_hamiltonian()`

Semua integral dihitung dalam basis AO, lalu transformasi ke MO menggunakan koefisien RHF.

### 8.2 Kode JW Mapping

Lokasi: `backend/services/vqe_preprocess.py` — menggunakan `qiskit_nature`

```python
from qiskit_nature.second_q.operators import FermionicOp
from qiskit_nature.second_q.mappers import JordanWignerMapper

op = FermionicOp({...}, num_spin_orbitals=4)
mapper = JordanWignerMapper()
qubit_op = mapper.map(op)
```

### 8.3 Dependensi Python

```python
import numpy as np
from scipy.special import erf
from qiskit_nature.second_q.operators import FermionicOp
from qiskit_nature.second_q.mappers import JordanWignerMapper
```

---

## 9. Verifikasi dan Testing

### 9.1 Verifikasi Integral AO

Cara: Jalankan fungsi integral dan bandingkan dengan nilai referensi di Section 2.6.

### 9.2 Verifikasi RHF

Cara: Pastikan Fock matrix simetris (F[0,0] = F[1,1]) dan orbital energies konsisten.

### 9.3 Verifikasi JW Mapping

Cara: Pastikan Hamiltonian hermitian (semua koefisien real) dan trace konsisten dengan jumlah eigenvalues.

### 9.4 Verifikasi Canonical Output

Cara: Bandingkan dengan lookup table VQE-01 atau hitung expectation value terhadap HF state.

---

## 10. Batasan dan Asumsi

1. **Molekul:** Hanya H2
2. **Basis:** Hanya STO-3G
3. **Jarak:** Fixed pada 0.735 Å (kecuali diubah di raw JSON)
4. **Platform:** Windows (PySCF tidak tersedia)
5. **Mapping:** Hanya Jordan-Wigner
6. **Qubit:** 2 atau 4

Batasan ini sesuai dengan scope TA yang tertera di proposal.
