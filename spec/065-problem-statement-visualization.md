# 065. Problem Statement Visualization - Input to Output Flow

## Prompt

User meminta problem statement frontend direvisi karena visual sebelumnya terlalu berorientasi metadata dataset. Kebutuhan utama bukan menampilkan daftar parameter, melainkan satu gambar/visual yang menjelaskan problem dan solusi dalam alur yang mudah dipahami: dari input, melalui proses inti algoritma, sampai output.

Instruksi pendukung yang dibaca:

1. `spec/prompts/INSTRUCTIONS.md`
2. `spec/prompts/BEHAVIOUR.md`
3. `spec/prompts/CAVEMAN.md`
4. `proposal.md`
5. struktur `frontend/`

## Tujuan

Membuat tab Problem untuk empat algoritma agar setiap visual menjawab pertanyaan akademik berikut:

1. Apa input problem-nya?
2. Apa transformasi atau proses konseptual yang dilakukan?
3. Apa output atau bentuk solusi yang dihasilkan?
4. Data apa yang dipakai, dan apakah data itu berasal dari JSON aktif?

Tujuan ini penting karena gambar problem statement di buku TA hanya dapat menampung satu visual utama untuk menjelaskan konteks problem. Visual harus langsung menunjukkan alur input ke output, bukan hanya deskripsi dataset.

### Data-Driven vs Static Content Separation

**DATA-DRIVEN (Must come from JSON, Visualized):**
- Truth table values (DJ) - rendered as color-coded grid
- Signal waveform data (QFT) - rendered as SVG line chart
- Molecular formula, distance, basis (VQE) - rendered as atom diagram
- Graph adjacency matrix (QAOA) - rendered as SVG graph
- All numeric parameters - shown in visual badges/counters
- Descriptions from JSON - used only as short subtitles

**STATIC (Educational - Minimal, Acceptable):**
- Very short labels (eyebrow text: "Input problem", "Transform", "Output solusi")
- Icon labels for quick visual recognition
- Single-sentence subtitles per panel
- No long paragraphs or detailed explanations

This separation ensures problem statements are grounded in actual data while following "show don't tell" principle.

## Koreksi Arah Desain

Desain lama terlalu menonjolkan metadata, misalnya jumlah qubit, basis, mapping, adjacency matrix, atau tipe sinyal. Informasi tersebut tetap berguna, tetapi bukan inti problem statement. Visual problem statement harus lebih naratif dan fungsional.

Arah baru:

```text
Input problem -> proses/algoritma -> output solusi
```

Setiap algoritma memakai pola yang sama agar pembaca cepat memahami hubungan antarproblem:

1. Deutsch-Jozsa: truth table/oracle -> pertanyaan constant atau balanced -> output klasifikasi.
2. QFT: sinyal domain waktu -> transformasi Fourier -> spektrum/dominant frequency bin.
3. VQE: molekul dan basis -> Hamiltonian + ansatz -> energi ground state.
4. QAOA: graph -> objektif Max-Cut -> partisi dan nilai cut.

## Codebase Context

Frontend memakai React, TypeScript, Tailwind, dan komponen berbasis feature folder:

1. `frontend/src/pages/*CombinedPage.tsx` mengatur halaman utama algoritma.
2. `frontend/src/hooks/use*` memuat cases, benchmark result, trace, dan tab state.
3. `frontend/src/shared/components/AlgorithmPageShell.tsx` menyediakan shell umum: selector dataset, tombol run, tab, dan area konten.
4. `frontend/src/components/<algorithm>/` berisi visual tiap algoritma.
5. Dataset cases dimuat dari API `/cases` dan menjadi sumber kebenaran untuk visual problem statement.

## Implementasi

### 1. Shared page shell

File:

```text
frontend/src/shared/components/AlgorithmPageShell.tsx
```

Perubahan:

1. Mendukung tab `problem`.
2. `problemTab` dapat tampil sebelum benchmark dijalankan.
3. Tab klasik/kuantum/animasi tetap menampilkan empty state jika hasil belum tersedia.
4. Import `HelpCircle` yang tidak dipakai dihapus.

Logika:

```text
if hasResult or problemTab exists:
  show tab bar
  if activeTab == problem: render problemTab
  if activeTab != problem and no result: render empty state
else:
  render empty state
```

### 2. Hook data case aktif

File:

```text
frontend/src/hooks/useAlgorithmBenchmark.ts
```

Perubahan:

1. Menyimpan `caseData` dari `/cases`.
2. Menyediakan `selectedCaseData` berdasarkan `selectedCaseId`.
3. Problem statement tidak membuat API call baru untuk data yang sudah tersedia.
4. Tetap data-driven, tidak memakai hardcoded case content.

### 3. Deutsch-Jozsa problem statement

File:

```text
frontend/src/components/dj/DJProblemStatement.tsx
```

Visual baru:

```text
Semua input n-bit + truth table -> oracle question -> output CONSTANT/BALANCED
```

Data JSON yang dipakai:

1. `case_id`
2. `n_qubits`
3. `oracle_definition.truth_table`
4. `expected_classification`

Output visual:

1. Kotak input bit dan nilai `f(x)` aktual dari truth table.
2. Ringkasan jumlah output 0 dan output 1.
3. Klasifikasi akhir sesuai JSON aktif.
4. Informasi query klasik worst case dan query kuantum.

### 4. QFT problem statement

File:

```text
frontend/src/components/qft/QFTProblemStatement.tsx
```

Visual baru:

```text
Sinyal domain waktu -> transformasi Fourier -> spektrum frekuensi/dominant bins
```

Data JSON yang dipakai:

1. `case_id`
2. `description`
3. `n_points`
4. `signal_type`
5. `signal_data`

Output visual:

1. Waveform input dari `signal_data`.
2. Panel transformasi Fourier.
3. Spektrum frekuensi hasil DFT ringan di frontend jika benchmark belum dijalankan.
4. Jika benchmark sudah ada, memakai `result.fft.spectrum` dan `result.fft.dominant_bins`.

Alasan:

QFT problem statement harus menunjukkan bahwa problemnya adalah mengubah sinyal waktu menjadi informasi frekuensi. Metadata seperti jumlah titik tidak cukup untuk menjelaskan problem.

### 5. VQE problem statement

File:

```text
frontend/src/components/vqe/VQEProblemStatement.tsx
```

Visual baru:

```text
Molekul + basis -> Hamiltonian Pauli-sum + ansatz -> energi ground state
```

**Data-Driven Visualization (Flow-Based, Visual-First):**
- Render molecule structure (H-H bond) with AtomNode components
- Show interatomic distance as badge between atoms
- FlowBox layout: Input (molecule) → Transform (Hamiltonian + ansatz) → Output (energy)
- InfoPill for formula, basis, charge, multiplicity
- EnergyLine for VQE vs FCI comparison
- Hamiltonian terms as Pauli operator badges
- Minimal text: only essential labels

**Changes:**
1. Import `QFTProblemStatement` and `HelpCircle` icon
2. Add `problem` to tabs array with `HelpCircle` icon
3. Add `problemTab={<QFTProblemStatement caseData={selectedCaseData} result={benchmarkResult} />}`
4. Update initial tab to `problem`

**Status:** ✅ COMPLETED

Data JSON/result yang dipakai:

1. `molecule_spec.formula`
2. `molecule_spec.interatomic_distance_angstrom`
3. `molecule_spec.basis`
4. `preprocessing.mapping`
5. `preprocessing.initial_qubits`
6. `preprocessing.target_qubits`
7. `experiment.ansatz_type`
8. `experiment.optimizer`
9. `result.quantum.energy` jika benchmark sudah dijalankan
10. `result.classical.energy` sebagai FCI reference jika tersedia

Output visual:

1. Molekul H₂ dan jarak antaratom.
2. Bentuk Hamiltonian ringkas `H = Σ cᵢPᵢ`.
3. Mapping qubit dan ansatz.
4. Output energi `E₀ = min⟨ψ(θ)|H|ψ(θ)⟩`.
5. Energi VQE dan FCI setelah run.

Alasan:

VQE problem statement harus menegaskan bahwa output bukan label, graph, atau bitstring, melainkan satu angka energi minimum molekul.

### 6. QAOA problem statement

File:

```text
frontend/src/components/qaoa/QAOAProblemStatement.tsx
```

Visual baru:

```text
Graph -> objektif Max-Cut -> partisi node + nilai cut
```

Data JSON/result yang dipakai:

1. `graph.adjacency_matrix`
2. `p_layers`
3. `result.exact.optimal_partition` jika tersedia
4. `result.exact.optimal_cut` jika tersedia

Output visual:

1. Graph input dari adjacency matrix.
2. Panel objektif `max C(z)`.
3. Graph output dengan node diberi warna partisi.
4. Edge yang terpotong diberi highlight.
5. Bitstring dan nilai cut.

Jika benchmark belum dijalankan, frontend menghitung Max-Cut kecil secara brute force dari adjacency matrix hanya untuk visual problem statement.

### 7. Page wiring

Files:

```text
frontend/src/pages/DJCombinedPage.tsx
frontend/src/pages/QFTCombinedPage.tsx
frontend/src/pages/VQECombinedPage.tsx
frontend/src/pages/QAOACombinedPage.tsx
```

Perubahan:

1. Menambahkan tab `Problem`.
2. Default tab menjadi `problem`.
3. Mengirim `selectedCaseData` ke komponen problem statement.
4. QFT, VQE, dan QAOA juga menerima `benchmarkResult` agar output aktual muncul setelah run.

### 8. Exports

Files:

```text
frontend/src/components/dj/index.ts
frontend/src/components/qft/index.ts
frontend/src/components/vqe/index.ts
frontend/src/components/qaoa/index.ts
```

Perubahan:

1. Export komponen problem statement masing-masing algoritma.

### 9. Quality cleanup

Perubahan pendukung agar frontend bersih saat lint/build:

1. `frontend/tsconfig.app.json`
   - Menambahkan `ignoreDeprecations: "6.0"` untuk mengatasi error TypeScript `baseUrl` deprecation.
2. `frontend/src/types/dj.ts`, `qft.ts`, `qaoa.ts`, `vqe.ts`
   - Mengubah empty interface menjadi type alias.
3. `frontend/src/components/vqe/VQEQuantumTab.tsx`
   - Memindahkan hook agar tidak conditional.
4. `frontend/src/components/qaoa/simulated-annealing/styles.ts`
   - Memindahkan style map non-component keluar dari `.tsx` untuk memenuhi Fast Refresh rule.
5. `frontend/src/components/charts/ConvergenceChart.tsx`, `QAOAQuantumTab.tsx`, `VQEStepFlowDiagram.tsx`
   - Membersihkan unused props/import/variable.

## Pseudocode Visual

### DJ

```text
truthTable = caseData.oracle_definition.truth_table
zeros = count output 0
ones = count output 1
classification = caseData.expected_classification
render input tiles -> render oracle question -> render classification output
```

### QFT

```text
signal = caseData.signal_data
if benchmark result exists:
  spectrum = result.fft.spectrum
  dominantBins = result.fft.dominant_bins
else:
  spectrum = DFT(signal)
  dominantBins = top magnitudes
render waveform -> transform icon -> spectrum bars
```

### VQE

```text
molecule = caseData.molecule_spec
preprocessing = caseData.preprocessing
render molecule H2 -> Hamiltonian/ansatz -> energy target
if result exists:
  show VQE energy and FCI reference
else:
  show target energy formula
```

### QAOA

```text
matrix = caseData.graph.adjacency_matrix
edges = upper triangular nonzero entries
if result exists:
  solution = result.exact
else:
  solution = brute force maxcut(matrix)
render input graph -> objective max C(z) -> partition graph + cut value
```

## Show Don't Tell Update

Setelah update prinsip `show don't tell`, seluruh komponen problem statement diperketat lagi agar tidak bergantung pada paragraf penjelasan. Teks panjang dihapus dan diganti menjadi label pendek, badge numerik, chart, graph, formula, dan output visual.

Perubahan visual akhir:

1. DJ: grid truth table, bar jumlah output 0/1, badge query `klasik → DJ`, dan kartu output `C/B`.
2. QFT: waveform `x[t]`, ikon transformasi `QFT`, dan bar spectrum `X[k]` dengan dominant bin.
3. VQE: molekul H-H, Hamiltonian `H = Σ cᵢPᵢ`, qubit mapping, serta target energi `E₀`.
4. QAOA: graph input, visual pemisahan kelompok 0/1, dan graph output dengan edge cut disorot.

Tidak ada paragraf panjang di dalam panel flow. Narasi hanya berupa judul, label, dan badge singkat.

## Testing

Passed:

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build -- --mode development
```

Build note:

1. Build passed.
2. Existing Vite warnings remain about large chunk size and Babel plugin timing.
3. These warnings do not block compilation.

## Manual Testing Plan

1. Open `/dj`.
   - Problem tab appears before clicking Run.
   - Change DJ case.
   - Truth table tiles and output classification must change following JSON.
2. Open `/qft`.
   - Problem tab shows waveform input and spectrum output.
   - QFT problem must not be blank.
   - Change QFT case; waveform and spectrum must change.
3. Open `/vqe`.
   - Problem tab shows molecule input, Hamiltonian/ansatz process, and energy output target.
   - After Run, VQE and FCI energy values appear.
4. Open `/qaoa`.
   - Problem tab shows input graph, Max-Cut objective, and output partition/cut.
   - Change QAOA case; graph and cut output must change.
5. Verify mobile layout stacks the three flow stages vertically without overflow.

## Success Criteria

1. ✅ All 4 algorithms have problem statement components
2. ✅ All visualizations use actual JSON data (not fabricated)
3. ✅ Problem tab accessible from all algorithm pages
4. ✅ TypeScript compilation passes
5. ✅ No lint warnings
6. ✅ Educational value provided through visual context
7. ✅ Gap filled: Users understand problem before running benchmark
8. ✅ "Show don't tell" principle followed - minimal text, high-quality visuals
9. ✅ Flow-based design with clear input → transform → output progression.
5. VQE explains output as ground state energy.
6. QAOA explains output as graph partition and cut value.
7. Lint and build pass.

## Visual Design Guidelines: "Show Don't Tell" Principle

### Philosophy
Following film-making principle: visualizations should be so good that minimal explanatory text is needed. The diagrams speak for themselves through flow-based progression.

### General Structure (Visual-First, Data-Driven)
```
┌─────────────────────────────────────────────────────┐
│  [Icon] Problem Statement                           │
│  [Algorithm Name]                                   │
├─────────────────────────────────────────────────────┤
│  [ACTUAL DATA VISUALIZATION FROM JSON]              │
│  - Truth table grid (DJ) / Waveform (QFT)          │
│  - Molecule structure (VQE) / Graph (QAOA)         │
│  - Flow: Input → Transform → Output                 │
│  - Minimal text - only essential labels             │
├─────────────────────────────────────────────────────┤
│  [Visual speaks for itself - no long paragraphs]    │
└─────────────────────────────────────────────────────┘
