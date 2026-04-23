import type { FormulaStory } from '../types';

export const FORMULA_STORIES: FormulaStory[] = [
  {
    id: 'story-dj-core',
    title: 'Deutsch-Jozsa: dari Oracle ke Keputusan',
    algorithm: 'dj',
    steps: [
      {
        formulaId: 'dj-oracle-function',
        title: 'Definisi Fungsi Oracle',
        connectingText: 'Algoritma dimulai dengan fungsi biner yang harus diidentifikasi sebagai konstan atau seimbang.',
      },
      {
        formulaId: 'oracle-unitary',
        title: 'Embedding ke Operator Unitary',
        connectingText: 'Fungsi klasik dipetakan ke operator reversibel agar dapat dieksekusi dalam sirkuit kuantum.',
      },
      {
        formulaId: 'dj-phase-kickback',
        title: 'Phase Kickback',
        connectingText: 'Informasi nilai fungsi dipindahkan ke fase sehingga bisa dibaca melalui interferensi.',
      },
      {
        formulaId: 'dj-classical-bound',
        title: 'Perbandingan dengan Klasik',
        connectingText: 'Batas query klasik menunjukkan keunggulan kuantum untuk kasus Deutsch-Jozsa.',
      },
    ],
  },
  {
    id: 'story-qft-core',
    title: 'QFT: Dari DFT ke Sirkuit Kuantum',
    algorithm: 'qft',
    steps: [
      {
        formulaId: 'dft-definition',
        title: 'Fondasi DFT',
        connectingText: 'Transformasi Fourier klasik menjadi basis konseptual untuk memahami QFT.',
      },
      {
        formulaId: 'qft-definition',
        title: 'Definisi QFT',
        connectingText: 'QFT menerapkan transformasi fase pada superposisi basis komputasional.',
      },
      {
        formulaId: 'qft-twiddle-factor',
        title: 'Twiddle Factor',
        connectingText: 'Akar satuan kompleks direalisasikan sebagai fase dalam transformasi kuantum.',
      },
      {
        formulaId: 'crk-gate-matrix',
        title: 'Implementasi CR_k',
        connectingText: 'Rotasi fase dikonstruksi menggunakan gerbang controlled rotation.',
      },
      {
        formulaId: 'qft-gate-count',
        title: 'Kompleksitas Gerbang',
        connectingText: 'Jumlah gerbang tumbuh polinomial dan dapat dihitung langsung dari jumlah qubit.',
      },
    ],
  },
  {
    id: 'story-vqe-core',
    title: 'VQE: Optimisasi Energi Ground State',
    algorithm: 'vqe',
    steps: [
      {
        formulaId: 'eigenvalue-equation',
        title: 'Persamaan Eigenvalue',
        connectingText: 'Masalah fisika kuantum dirumuskan sebagai pencarian nilai eigen energi terendah.',
      },
      {
        formulaId: 'hamiltonian-decomposition',
        title: 'Dekomposisi Hamiltonian',
        connectingText: 'Hamiltonian dipecah ke suku Pauli agar dapat diukur pada perangkat kuantum.',
      },
      {
        formulaId: 'variational-energy',
        title: 'Energi Variational',
        connectingText: 'Energi dihitung sebagai ekspektasi parameterized state terhadap Hamiltonian.',
      },
      {
        formulaId: 'ground-state-energy',
        title: 'Target Ground State',
        connectingText: 'Optimisasi parameter diarahkan untuk mendekati energi ground state.',
      },
      {
        formulaId: 'fci-state-expansion',
        title: 'Akurasi terhadap FCI',
        connectingText: 'FCI digunakan sebagai baseline untuk menilai kualitas hasil VQE.',
      },
    ],
  },
  {
    id: 'story-qaoa-core',
    title: 'QAOA: Dari Cost Function ke Ansatz',
    algorithm: 'qaoa',
    steps: [
      {
        formulaId: 'maxcut-cost-function',
        title: 'Fungsi Biaya Max-Cut',
        connectingText: 'Masalah optimisasi graf dirumuskan sebagai fungsi biaya klasik.',
      },
      {
        formulaId: 'cost-hamiltonian',
        title: 'Cost Hamiltonian',
        connectingText: 'Fungsi biaya dikonversi ke Hamiltonian agar bisa dievolusikan secara kuantum.',
      },
      {
        formulaId: 'mixer-hamiltonian',
        title: 'Mixer Hamiltonian',
        connectingText: 'Mixer menjaga eksplorasi ruang solusi selama iterasi ansatz.',
      },
      {
        formulaId: 'qaoa-state-p1',
        title: 'QAOA State p=1',
        connectingText: 'State ansatz dibentuk dari komposisi unitary cost dan mixer.',
      },
      {
        formulaId: 'acceptance-probability',
        title: 'Interpretasi Energi',
        connectingText: 'Perubahan energi dapat dipetakan ke probabilitas penerimaan dalam pendekatan termal klasik.',
      },
    ],
  },
];
