import type { FormulaDefinition } from './types';
import { FORMULA_COMPUTATION_MAP } from './computation';

const BASE_FORMULA_REGISTRY: FormulaDefinition[] = [

  // ============================================================================
  // GATES
  // ============================================================================

  {
    id: 'h-gate-matrix',
    latex: 'H = \\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 & 1 \\\\ 1 & -1 \\end{pmatrix}',
    title: 'Hadamard Gate',
    category: 'gates',
    tags: ['hadamard', 'H', 'superposisi', 'superposition', 'gerbang', 'gate'],
    chapter: ['2', '4'],
    description: 'Gerbang Hadamard menciptakan superposisi merata dari keadaan dasar. Mentransformasi |0⟩ menjadi |+⟩ dan |1⟩ menjadi |−⟩ dengan probabilitas yang sama.',
    variables: [
      { symbol: 'H', name: 'Hadamard', description: 'Matriks gerbang Hadamard 2×2' }
    ],
    relatedFormulas: [
      { targetId: 'superposition-state', type: 'implements', label: 'menciptakan' },
      { targetId: 'pauli-x-matrix', type: 'related', label: 'kombinasi dengan' },
      { targetId: 'phase-kickback', type: 'derives', label: 'basis untuk' }
    ]
  },
  {
    id: 'pauli-x-matrix',
    latex: 'X = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}',
    title: 'Pauli-X Gate',
    category: 'gates',
    tags: ['pauli-x', 'X', 'NOT', 'bit-flip', 'gerbang'],
    chapter: ['2'],
    description: 'Gerbang Pauli-X berperan sebagai gerbang NOT dalam komputasi kuantum. Mentransformasi |0⟩ ke |1⟩ dan |1⟩ ke |0⟩.',
    variables: [
      { symbol: 'X', name: 'Pauli-X', description: 'Matriks Pauli-X 2×2' }
    ],
    relatedFormulas: [
      { targetId: 'h-gate-matrix', type: 'related', label: 'digunakan dengan' },
      { targetId: 'bloch-sphere-state', type: 'implements', label: 'rotasi pada' },
      { targetId: 'pauli-y-matrix', type: 'related', label: 'keluarga Pauli' }
    ]
  },
  {
    id: 'pauli-y-matrix',
    latex: 'Y = \\begin{pmatrix} 0 & -i \\\\ i & 0 \\end{pmatrix}',
    title: 'Pauli-Y Gate',
    category: 'gates',
    tags: ['pauli-y', 'Y', 'bit-flip', 'phase-flip', 'gerbang'],
    chapter: ['2'],
    description: 'Gerbang Pauli-Y menimbulkan rotasi pada sumbu-Y Bloch sphere. Mengakibatkan perubahan fase dan bit secara simultan.',
    variables: [
      { symbol: 'Y', name: 'Pauli-Y', description: 'Matriks Pauli-Y 2×2' }
    ],
    relatedFormulas: [
      { targetId: 'pauli-x-matrix', type: 'related', label: 'keluarga Pauli' },
      { targetId: 'pauli-z-matrix', type: 'related', label: 'keluarga Pauli' },
      { targetId: 'bloch-sphere-state', type: 'implements', label: 'rotasi pada' }
    ]
  },
  {
    id: 'pauli-z-matrix',
    latex: 'Z = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}',
    title: 'Pauli-Z Gate',
    category: 'gates',
    tags: ['pauli-z', 'Z', 'phase-flip', 'gerbang'],
    chapter: ['2'],
    description: 'Gerbang Pauli-Z menimbulkan rotasi pada sumbu-Z Bloch sphere. Mengubah fase kondisi |1⟩ sementara |0⟩ tetap.',
    variables: [
      { symbol: 'Z', name: 'Pauli-Z', description: 'Matriks Pauli-Z 2×2' }
    ],
    relatedFormulas: [
      { targetId: 'pauli-y-matrix', type: 'related', label: 'keluarga Pauli' },
      { targetId: 'phase-gate-s', type: 'related', label: 'khusus dari' },
      { targetId: 'phase-kickback', type: 'implements', label: 'mekanisme' }
    ]
  },
  {
    id: 'phase-gate-s',
    latex: 'S = \\begin{pmatrix} 1 & 0 \\\\ 0 & i \\end{pmatrix}',
    title: 'Phase Gate (S)',
    category: 'gates',
    tags: ['phase', 'S', 'π/2', 'gerbang'],
    chapter: ['2', '4'],
    description: 'Gerbang Phase memperkenalkan rotasi π/2 pada sumbu-Z Bloch sphere.',
    variables: [
      { symbol: 'S', name: 'Phase Gate', description: 'Matriks gerbang Phase 2×2' }
    ],
    relatedFormulas: [
      { targetId: 'pauli-z-matrix', type: 'derives', label: 'akar dari' },
      { targetId: 't-gate', type: 'derives', label: 'akar dari' },
      { targetId: 'phase-kickback', type: 'implements', label: 'mekanisme' }
    ]
  },
  {
    id: 't-gate',
    latex: 'T = \\begin{pmatrix} 1 & 0 \\\\ 0 & e^{i\\pi/4} \\end{pmatrix}',
    title: 'T Gate',
    category: 'gates',
    tags: ['T', 'π/4', 'toffoli', 'gerbang'],
    chapter: ['2'],
    description: 'Gerbang T menambahkan fase π/4 dan merupakan gerbang fundamental untuk komputasi kuantum toleransi kesalahan.',
    variables: [
      { symbol: 'T', name: 'T Gate', description: 'Matriks gerbang T 2×2' }
    ],
    relatedFormulas: [
      { targetId: 'phase-gate-s', type: 'derives', label: 'akar dari' },
      { targetId: 'cnot-gate-matrix', type: 'related', label: 'komponen Toffoli' },
      { targetId: 'oracle-unitary', type: 'related', label: 'digunakan dalam' }
    ]
  },
  {
    id: 'cnot-gate-matrix',
    latex: 'CNOT = \\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 0 & 1 \\\\ 0 & 0 & 1 & 0 \\end{pmatrix}',
    title: 'CNOT Gate',
    category: 'gates',
    tags: ['CNOT', 'controlled-NOT', 'entangel', 'gerbang'],
    chapter: ['2', '4'],
    description: 'Gerbang CNOT adalah gerbang controlled yang membalik qubit target jika dan hanya jika qubit kontrol dalam keadaan |1⟩. Gerbang ini esensial untuk menciptakan entangled state.',
    variables: [
      { symbol: 'CNOT', name: 'CNOT Gate', description: 'Matriks gerbang CNOT 4×4' }
    ],
    relatedFormulas: [
      { targetId: 'bell-state-phi', type: 'implements', label: 'menciptakan' },
      { targetId: 'cz-gate-matrix', type: 'related', label: 'alternatif' },
      { targetId: 'swap-gate-matrix', type: 'related', label: 'dekomposisi' }
    ]
  },
  {
    id: 'cz-gate-matrix',
    latex: 'CZ = \\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 1 & 0 \\\\ 0 & 0 & 0 & -1 \\end{pmatrix}',
    title: 'Controlled-Z (CZ) Gate',
    category: 'gates',
    tags: ['CZ', 'controlled-phase', 'phase', 'gerbang'],
    chapter: ['2', '4'],
    description: 'Gerbang CZ memperkenalkan fase -1 jika kedua qubit dalam keadaan |1⟩. Bersifat simetris karena kontrol dan target dapat dipertukarkan.',
    variables: [
      { symbol: 'CZ', name: 'CZ Gate', description: 'Matriks gerbang CZ 4×4' }
    ],
    relatedFormulas: [
      { targetId: 'cnot-gate-matrix', type: 'related', label: 'ekuivalen dengan' },
      { targetId: 'phase-kickback', type: 'implements', label: 'mekanisme' },
      { targetId: 'bell-state-phi', type: 'related', label: 'menciptakan' }
    ]
  },
  {
    id: 'swap-gate-matrix',
    latex: 'SWAP = \\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 0 & 1 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 0 & 1 \\end{pmatrix}',
    title: 'SWAP Gate',
    category: 'gates',
    tags: ['SWAP', 'tukar', 'qubit', 'gerbang'],
    chapter: ['2'],
    description: 'Gerbang SWAP menukar posisi dua qubit. Matriksnya menunjukkan pemetaan |00⟩→|00⟩, |01⟩→|10⟩, |10⟩→|01⟩, |11⟩→|11⟩.',
    variables: [
      { symbol: 'SWAP', name: 'SWAP Gate', description: 'Matriks gerbang SWAP 4×4' }
    ],
    relatedFormulas: [
      { targetId: 'cnot-gate-matrix', type: 'related', label: 'dekomposisi CNOT' },
      { targetId: 'qft-gate-count', type: 'related', label: 'digunakan dalam' },
      { targetId: 'qft-circuit-construction', type: 'related', label: 'komponen' }
    ]
  },

  // ============================================================================
  // STATE REPRESENTATION
  // ============================================================================

  {
    id: 'statevector-general',
    latex: '|\\psi\\rangle = \\sum_{i=0}^{N-1} \\alpha_i |i\\rangle',
    title: 'General Statevector',
    category: 'state-representation',
    tags: ['statevector', 'amplitudo', 'superposisi', 'keadaan'],
    chapter: ['2'],
    description: 'Statevector adalah representasi keadaan kuantum sebagai kombinasi linear dari basis komputasional. Setiap koefisien αᵢ adalah amplitudo kompleks.',
    variables: [
      { symbol: '|ψ⟩', name: 'Statevector', description: 'Vektor keadaan kuantum' },
      { symbol: 'αᵢ', name: 'Amplitudo', description: 'Amplitudo kompleks untuk keadaan |i⟩' },
      { symbol: 'N', name: 'Dimensional', description: 'Dimensi ruang Hilbert (2ⁿ untuk n qubit)' }
    ],
    relatedFormulas: [
      { targetId: 'normalization-condition', type: 'implements', label: 'dibatasi oleh' },
      { targetId: 'bloch-sphere-state', type: 'related', label: 'representasi geometris' },
      { targetId: 'single-qubit-state', type: 'specializes', label: 'khusus untuk' }
    ]
  },
  {
    id: 'single-qubit-state',
    latex: '|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle',
    title: 'Single Qubit State',
    category: 'state-representation',
    tags: ['single-qubit', 'dua-keadaan', 'superposisi', 'qubit'],
    chapter: ['2'],
    description: 'Keadaan satu qubit diekspresikan sebagai kombinasi linear dari dua keadaan basis ortogonal |0⟩ dan |1⟩ dengan amplitudo α dan β.',
    variables: [
      { symbol: 'α', name: 'Amplitudo 0', description: 'Amplitudo kompleks untuk |0⟩' },
      { symbol: 'β', name: 'Amplitudo 1', description: 'Amplitudo kompleks untuk |1⟩' }
    ],
    relatedFormulas: [
      { targetId: 'normalization-condition', type: 'implements', label: 'syarat' },
      { targetId: 'bloch-sphere-state', type: 'equivalent', label: 'koordinat Bloch' },
      { targetId: 'statevector-general', type: 'generalizes', label: 'umum untuk' }
    ]
  },
  {
    id: 'normalization-condition',
    latex: '\\sum_{i=0}^{N-1} |\\alpha_i|^2 = 1',
    title: 'Normalization Condition',
    category: 'state-representation',
    tags: ['normalisasi', 'probabilitas', 'kekuatan', 'kondisi'],
    chapter: ['2'],
    description: 'Kondisi normalisasi memastikan total probabilitas sama dengan 1. Setiap amplitudo kompleks harus memenuhi bahwa jumlah kuadrat modulusnya sama dengan 1.',
    variables: [
      { symbol: 'αᵢ', name: 'Amplitudo', description: 'Amplitudo kompleks ke-i' },
      { symbol: '|αᵢ|²', name: 'Probabilitas', description: 'Kuadrat modulus atau probabilitas' }
    ],
    relatedFormulas: [
      { targetId: 'statevector-general', type: 'implements', label: 'membatasi' },
      { targetId: 'single-qubit-state', type: 'implements', label: 'membatasi' },
      { targetId: 'plus-minus-states', type: 'implements', label: 'contoh' }
    ]
  },
  {
    id: 'bloch-sphere-state',
    latex: '|\\psi\\rangle = \\cos\\frac{\\theta}{2}|0\\rangle + e^{i\\phi}\\sin\\frac{\\theta}{2}|1\\rangle',
    title: 'Bloch Sphere Representation',
    category: 'state-representation',
    tags: ['bloch', 'sphere', 'parametrizasi', 'sudut', 'fase'],
    chapter: ['2'],
    description: 'Setiap keadaan qubit murni dapat direpresentasikan sebagai titik pada permukaan bola radius 1. Sudut θ dan φ menentukan posisi titik pada bola Bloch.',
    variables: [
      { symbol: 'θ', name: 'Polar Angle', description: 'Sudut dari sumbu-Z (0 ≤ θ ≤ π)' },
      { symbol: 'φ', name: 'Azimuthal Angle', description: 'Sudut dari sumbu-X pada bidang XY (0 ≤ φ < 2π)' }
    ],
    relatedFormulas: [
      { targetId: 'single-qubit-state', type: 'equivalent', label: 'ekuivalen dengan' },
      { targetId: 'pauli-x-matrix', type: 'related', label: 'rotasi sumbu X' },
      { targetId: 'pauli-z-matrix', type: 'related', label: 'rotasi sumbu Z' }
    ]
  },
  {
    id: 'bell-state-phi',
    latex: '|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle)',
    title: 'Bell State |Φ⁺⟩',
    category: 'state-representation',
    tags: ['bell', 'entangled', 'maximally-entangled', 'EPR'],
    chapter: ['2', '4'],
    description: 'Keadaan Bell adalah keadaan terentangle maksimum dua qubit. Mengukur salah satu qubit secara instan menentukan keadaan qubit lainnya.',
    variables: [
      { symbol: '|Φ⁺⟩', name: 'Bell State', description: 'Vektor keadaan Bell' }
    ],
    relatedFormulas: [
      { targetId: 'cnot-gate-matrix', type: 'implements', label: 'diciptakan oleh' },
      { targetId: 'entanglement-definition', type: 'implements', label: 'contoh' },
      { targetId: 'h-gate-matrix', type: 'related', label: 'gerbang untuk' }
    ]
  },
  {
    id: 'plus-minus-states',
    latex: '|+\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}, \\quad |-\\rangle = \\frac{|0\\rangle - |1\\rangle}{\\sqrt{2}}',
    title: 'Plus/Minus States',
    category: 'state-representation',
    tags: ['plus', 'minus', 'superposisi', 'diagonal', 'basis'],
    chapter: ['2'],
    description: 'Kehadaan |+⟩ dan |−⟩ adalah keadaan superposisi dengan fase berbeda. Keadaan |−⟩ merupakan keadaan eigen Pauli-Z dengan eigenvalue -1.',
    variables: [
      { symbol: '|+⟩', name: 'Plus State', description: 'Superposisi merata dengan fase 0' },
      { symbol: '|−⟩', name: 'Minus State', description: 'Superposisi merata dengan fase π' }
    ],
    relatedFormulas: [
      { targetId: 'h-gate-matrix', type: 'implements', label: 'diciptakan oleh' },
      { targetId: 'normalization-condition', type: 'implements', label: 'syarat' },
      { targetId: 'phase-kickback', type: 'implements', label: 'peran dalam' }
    ]
  },

  // ============================================================================
  // DEUTSCH-JOZSA
  // ============================================================================

  {
    id: 'dj-oracle-function',
    latex: 'f: \\{0,1\\}^n \\rightarrow \\{0,1\\}',
    title: 'Oracle Function f',
    category: 'dj',
    tags: ['oracle', 'function', 'Deutsch-Jozsa', 'evaluasi'],
    chapter: ['3'],
    description: 'Fungsi oracle dalam algoritma Deutsch-Jozsa memetakan string bit n ke satu bit output. Fungsi ini bisa bersifat konstan (selalu 0 atau 1) atau seimbang (seimbang 0 dan 1).',
    variables: [
      { symbol: 'f', name: 'Oracle Function', description: 'Fungsi yang dievaluasi oracle kuantum' },
      { symbol: 'n', name: 'Input Bits', description: 'Jumlah qubit input' }
    ],
    relatedFormulas: [
      { targetId: 'oracle-unitary', type: 'implements', label: 'diimplementasikan sebagai' },
      { targetId: 'dj-classical-bound', type: 'related', label: 'dibandingkan dengan' },
      { targetId: 'dj-phase-kickback', type: 'implements', label: 'mekanisme' }
    ]
  },
  {
    id: 'oracle-unitary',
    latex: 'U_f|x\\rangle|y\\rangle = |x\\rangle|y \\oplus f(x)\\rangle',
    title: 'Oracle Unitary Operator',
    category: 'dj',
    tags: ['oracle', 'unitary', 'modulo', 'xor', 'Deutsch-Jozsa'],
    chapter: ['3'],
    description: 'Operator unitary oracle menambahkan evaluasi fungsi f pada qubit ancilla. Operasi XOR kuantum ini mereversibel dan dapat dibatalkan.',
    variables: [
      { symbol: 'U_f', name: 'Oracle Unitary', description: 'Operator unitary oracle' },
      { symbol: '⊕', name: 'XOR', description: 'Penjumlahan modulo 2 (XOR)' }
    ],
    relatedFormulas: [
      { targetId: 'dj-oracle-function', type: 'derived-from', label: 'mewakili' },
      { targetId: 'dj-phase-kickback', type: 'implements', label: 'memungkinkan' },
      { targetId: 't-gate', type: 'related', label: 'terkait implementasi' }
    ]
  },
  {
    id: 'dj-phase-kickback',
    latex: 'U_f|x\\rangle|-\\rangle = (-1)^{f(x)}|x\\rangle|-\\rangle',
    title: 'Phase Kickback with |−⟩',
    category: 'dj',
    tags: ['phase-kickback', 'minus-state', 'Deutsch-Jozsa'],
    chapter: ['3'],
    description: 'Dengan memilih ancilla dalam keadaan |−⟩, efek f(x) dikonversi menjadi fase global. Fenomena ini adalah kunci keunggulan algoritma Deutsch-Jozsa.',
    variables: [
      { symbol: '|−⟩', name: 'Minus State', description: 'Keadaan eigen dengan eigenvalue -1 untuk Z' }
    ],
    relatedFormulas: [
      { targetId: 'plus-minus-states', type: 'implements', label: 'syarat' },
      { targetId: 'oracle-unitary', type: 'implements', label: 'input ke' },
      { targetId: 'pauli-z-matrix', type: 'related', label: 'eigenstate' }
    ]
  },
  {
    id: 'dj-classical-bound',
    latex: 'm > 2^{n-1} + 1',
    title: 'Classical Lower Bound',
    category: 'dj',
    tags: ['classical', 'bound', 'sample', 'Deutsch-Jozsa'],
    chapter: ['3'],
    description: 'Algoritma klasik membutuhkan lebih dari 2ⁿ⁻¹+1 evaluasi untuk memastikan hasil pada fungsi seimbang. Batas ini menunjukkan keunggulan eksponensial kuantum.',
    variables: [
      { symbol: 'm', name: 'Measurements', description: 'Jumlah pengukuran klasik yang diperlukan' },
      { symbol: 'n', name: 'Qubits', description: 'Jumlah qubit input' }
    ],
    relatedFormulas: [
      { targetId: 'complexity-classical', type: 'derived-from', label: 'berdasarkan' },
      { targetId: 'dj-oracle-function', type: 'related', label: 'evaluasi' },
      { targetId: 'dj-phase-kickback', type: 'contrast-with', label: 'kuantum lebih baik' }
    ]
  },

  // ============================================================================
  // QFT
  // ============================================================================

  {
    id: 'dft-definition',
    latex: 'X[k] = \\sum_{j=0}^{N-1} x[j] \\omega^{jk}, \\quad \\omega = e^{-2\\pi i/N}',
    title: 'Discrete Fourier Transform (DFT)',
    category: 'qft',
    tags: ['DFT', 'FFT', 'transform', 'frekuensi'],
    chapter: ['3'],
    description: 'DFT klasik mentransformasi vektor x dimensi N ke domain frekuensi. Transformasi ini menjadi dasar untuk memahami QFT.',
    variables: [
      { symbol: 'X[k]', name: 'DFT Output', description: 'Komponen frekuensi ke-k' },
      { symbol: 'x[j]', name: 'Input', description: 'Sinyal input pada waktu j' },
      { symbol: 'ω', name: 'Twiddle Factor', description: 'Akar primitive ke-N dari unity' }
    ],
    relatedFormulas: [
      { targetId: 'qft-definition', type: 'quantum-version', label: 'versi kuantum' },
      { targetId: 'fft-complexity', type: 'related', label: 'kompleksitas klasik' },
      { targetId: 'qft-gate-complexity', type: 'contrast-with', label: 'kuantum vs klasik' }
    ]
  },
  {
    id: 'qft-definition',
    latex: 'QFT_N|x\\rangle = \\frac{1}{\\sqrt{N}}\\sum_{k=0}^{N-1} e^{2\\pi i x k/N}|k\\rangle',
    title: 'Quantum Fourier Transform',
    category: 'qft',
    tags: ['QFT', 'transform', 'quantum', 'frekuensi'],
    chapter: ['3'],
    description: 'QFT adalah versi kuantum dari DFT yang beroperasi secara paralel pada superposisi semua status. Eksponensial fase bergantung pada indeks x.',
    variables: [
      { symbol: 'QFT_N', name: 'QFT Operator', description: 'Operator transformasi Fourier kuantum' },
      { symbol: 'N', name: 'Dimension', description: 'Dimensi ruang (2ⁿ untuk n qubit)' }
    ],
    relatedFormulas: [
      { targetId: 'dft-definition', type: 'derived-from', label: 'dasar klasik' },
      { targetId: 'qft-twiddle-factor', type: 'implements', label: 'menggunakan' },
      { targetId: 'qft-gate-count', type: 'result', label: 'kompleksitas' }
    ]
  },
  {
    id: 'qft-twiddle-factor',
    latex: '\\omega^{jk} = e^{-2\\pi i jk/N}',
    title: 'Twiddle Factor',
    category: 'qft',
    tags: ['twiddle', 'phase', 'roots-of-unity', 'QFT'],
    chapter: ['3'],
    description: 'Twiddle factor adalah komponen phase dalam QFT. Faktor ini merepresentasikan akar unity yang digunakan dalam transformasi.',
    variables: [
      { symbol: 'ω', name: 'Twiddle', description: 'e^{-2πi/N}' },
      { symbol: 'j,k', name: 'Indices', description: 'Indeks yang Mengkombinasikan' }
    ],
    relatedFormulas: [
      { targetId: 'qft-definition', type: 'implements', label: 'komponen' },
      { targetId: 'crk-gate-matrix', type: 'implements', label: 'diimplementasikan sebagai' },
      { targetId: 'euler-identity', type: 'derived-from', label: 'berdasarkan' }
    ]
  },
  {
    id: 'crk-gate-matrix',
    latex: 'CR_k = \\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 1 & 0 \\\\ 0 & 0 & 0 & e^{2\\pi i / 2^{k}} \\end{pmatrix}',
    title: 'CR_k Gate Matrix',
    category: 'qft',
    tags: ['CRk', 'controlled-rotation', 'QFT', 'gate'],
    chapter: ['3'],
    description: 'Gerbang CR_k adalah gerbang rotasi tercontrolled yang memperkenalkan fase e^{2πi/2^k}. Gerbang ini merupakan komponen fundamental dalam sirkuit QFT.',
    variables: [
      { symbol: 'CR_k', name: 'CRk Gate', description: 'Matriks gerbang CR_k 4×4' },
      { symbol: 'k', name: 'Rotation Index', description: 'Indeks rotasi menentukan sudut fase' }
    ],
    relatedFormulas: [
      { targetId: 'qft-twiddle-factor', type: 'implements', label: 'mewakili' },
      { targetId: 'qft-gate-count', type: 'used-in', label: 'komponen' },
      { targetId: 'cz-gate-matrix', type: 'related', label: 'khusus k=0' }
    ]
  },
  {
    id: 'qft-gate-count',
    latex: '\\frac{n(n+1)}{2}',
    title: 'QFT Gate Count',
    category: 'qft',
    tags: ['gate-count', 'complexity', 'QFT', 'qubit'],
    chapter: ['3'],
    description: 'Jumlah gerbang yang dibutuhkan untuk QFT pada n qubit adalah n(n+1)/2. Ini menunjukkan pertumbuhan polinomial.',
    variables: [
      { symbol: 'n', name: 'Qubit Count', description: 'Jumlah qubit' }
    ],
    relatedFormulas: [
      { targetId: 'qft-definition', type: 'result', label: 'analisis' },
      { targetId: 'qft-gate-complexity', type: 'equivalent', label: 'sama dengan' },
      { targetId: 'crk-gate-matrix', type: 'used-in', label: 'jumlah' }
    ]
  },

  // ============================================================================
  // VQE
  // ============================================================================

  {
    id: 'eigenvalue-equation',
    latex: '\\hat{H}|\\psi_i\\rangle = E_i|\\psi_i\\rangle',
    title: 'Eigenvalue Equation',
    category: 'vqe',
    tags: ['eigenvalue', 'eigenstate', ' Hamiltonian', 'persamaan'],
    chapter: ['4'],
    description: 'Persamaan eigenvalue menghubungkan Hamiltonian dengan energi eigenvalue-nya.',
    variables: [
      { symbol: 'Ĥ', name: 'Hamiltonian', description: 'Operator Hamiltonian sistem' },
      { symbol: 'Eᵢ', name: 'Eigenvalue', description: 'Energi eigenvalue ke-i' },
      { symbol: '|ψᵢ⟩', name: 'Eigenstate', description: 'Keadaan eigen yang sesuai' }
    ],
    relatedFormulas: [
      { targetId: 'ground-state-energy', type: 'specializes', label: 'minimum dari' },
      { targetId: 'hamiltonian-decomposition', type: 'implements', label: 'didekomposisi sebagai' },
      { targetId: 'variational-energy', type: 'computed-by', label: 'dihitung via' }
    ]
  },
  {
    id: 'ground-state-energy',
    latex: 'E_0 = \\min_{(|\\psi\\rangle)} \\langle\\psi|\\hat{H}|\\psi\\rangle',
    title: 'Ground State Energy',
    category: 'vqe',
    tags: ['ground-state', 'minimum', 'energy', 'variational'],
    chapter: ['4'],
    description: 'Energi ground state adalah nilai minimum ekspektasi Hamiltonian terhadap semua keadaan yang mungkin. Menemukan E₀ adalah tujuan utama VQE.',
    variables: [
      { symbol: 'E₀', name: 'Ground State Energy', description: 'Energi terendah sistem' }
    ],
    relatedFormulas: [
      { targetId: 'eigenvalue-equation', type: 'specializes', label: 'minimum pada' },
      { targetId: 'variational-energy', type: 'equivalent', label: 'optimisasi' },
      { targetId: 'fci-state-expansion', type: 'related', label: 'target' }
    ]
  },
  {
    id: 'variational-energy',
    latex: 'E(\\vec{\\theta}) = \\langle\\psi(\\vec{\\theta})|\\hat{H}|\\psi(\\vec{\\theta})\\rangle = \\sum_l c_l \\langle P_l \\rangle_{\\vec{\theta}}',
    title: 'Variational Energy Expression',
    category: 'vqe',
    tags: ['variational', 'energy', 'expectation', 'parameter'],
    chapter: ['4'],
    description: 'Energi variasional dihitung sebagai ekspektasi Hamiltonian terhadap keadaan ansatz. Ekspresi ini bergantung pada parameter θ yang dioptimisasi.',
    variables: [
      { symbol: 'E(θ)', name: 'Variational Energy', description: 'Energi sebagai fungsi parameter' },
      { symbol: '|ψ(θ)⟩', name: 'Ansatz State', description: 'Keadaan uji dengan parameter θ' },
      { symbol: 'cₗ', name: 'Coefficient', description: 'Koefisien dari dekomposisi Hamiltonian' }
    ],
    relatedFormulas: [
      { targetId: 'hamiltonian-decomposition', type: 'derived-from', label: 'berdasarkan' },
      { targetId: 'ground-state-energy', type: 'equivalent', label: 'minimum mendekati' },
      { targetId: 'fci-state-expansion', type: 'contrast-with', label: 'FCI vs VQE' }
    ]
  },
  {
    id: 'hamiltonian-decomposition',
    latex: '\\hat{H} = \\sum_{l} c_l P_l',
    title: 'Hamiltonian Decomposition',
    category: 'vqe',
    tags: ['decomposition', 'pauli', 'string', ' Hamiltonian'],
    chapter: ['4'],
    description: 'Hamiltonian dipecah menjadi kombinasi linear dari product Pauli strings. Setiap suku Pₗ adalah tensor product dari operator Pauli.',
    variables: [
      { symbol: 'Pₗ', name: 'Pauli String', description: 'Product operator Pauli ke-l' },
      { symbol: 'cₗ', name: 'Coefficient', description: 'Koefisien real untuk suku ke-l' }
    ],
    relatedFormulas: [
      { targetId: 'eigenvalue-equation', type: 'implements', label: 'mewakili' },
      { targetId: 'variational-energy', type: 'derived-from', label: 'digunakan dalam' },
      { targetId: 'pauli-x-matrix', type: 'related', label: 'komponen Pauli' }
    ]
  },
  {
    id: 'fci-state-expansion',
    latex: '|\\Psi_{FCI}\\rangle = \\sum_I c_I |D_I\\rangle',
    title: 'FCI State Expansion',
    category: 'vqe',
    tags: ['FCI', 'full-ci', 'determinant', 'expansion'],
    chapter: ['4'],
    description: 'Full Configuration Interaction (FCI) memperluas keadaan sebagai kombinasi linear dari semua determinan yang mungkin. Koefisien cₗ menyatakan berat relativitas setiap determinan.',
    variables: [
      { symbol: '|Ψ_FCI⟩', name: 'FCI State', description: 'Keadaan FCI akurat penuh' },
      { symbol: '|D_I⟩', name: 'Determinant', description: 'Determinan Slater ke-I' },
      { symbol: 'c_I', name: 'CI Coefficient', description: 'Koefisien konfigurasi interaksi' }
    ],
    relatedFormulas: [
      { targetId: 'ground-state-energy', type: 'target', label: 'target akurasi' },
      { targetId: 'variational-energy', type: 'contrast-with', label: 'perbandingan' },
      { targetId: 'statevector-general', type: 'related', label: 'struktur serupa' }
    ]
  },

  // ============================================================================
  // QAOA
  // ============================================================================

  {
    id: 'maxcut-cost-function',
    latex: 'C(\\vec{z}) = \\sum_{(i,j) \\in E} \\frac{1 - z_i z_j}{2}',
    title: 'Max-Cut Cost Function',
    category: 'qaoa',
    tags: ['maxcut', 'cost', 'function', 'graph', 'optimization'],
    chapter: ['4'],
    description: 'Fungsi biaya Max-Cut menghitung jumlah edge yang melintasi pemisahan. Untuk setiap edge (i,j), nilainya 1 jika zᵢ ≠ zⱼ dan 0 jika zᵢ = zⱼ.',
    variables: [
      { symbol: 'C(z)', name: 'Cost', description: 'Nilai fungsi biaya' },
      { symbol: 'zᵢ', name: 'Bit Variable', description: 'Variabel biner untuk node i (±1)' },
      { symbol: 'E', name: 'Edge Set', description: 'Himpunan edge pada graf' }
    ],
    relatedFormulas: [
      { targetId: 'cost-hamiltonian', type: 'discretized', label: 'diubah ke' },
      { targetId: 'qaoa-state-p1', type: 'encoded-in', label: 'diencode dalam' },
      { targetId: 'acceptance-probability', type: 'related', label: 'probabilitas' }
    ]
  },
  {
    id: 'cost-hamiltonian',
    latex: '\\hat{H}_C = \\sum_{(i,j) \\in E} \\frac{I - Z_i Z_j}{2}',
    title: 'Cost Hamiltonian',
    category: 'qaoa',
    tags: ['cost', 'hamiltonian', 'Z', 'operator'],
    chapter: ['4'],
    description: 'Hamiltonian biaya adalah representasi operator dari fungsi biaya klasik. Eigenvalue dari Hamiltonian ini memberikan nilai biaya untuk keadaan komputasi basis.',
    variables: [
      { symbol: 'Ĥ_C', name: 'Cost Hamiltonian', description: 'Operator Hamiltonian biaya' },
      { symbol: 'Zᵢ', name: 'Pauli-Z', description: 'Operator Pauli-Z pada qubit i' }
    ],
    relatedFormulas: [
      { targetId: 'maxcut-cost-function', type: 'quantized', label: 'kuantisasi dari' },
      { targetId: 'qaoa-state-p1', type: 'used-in', label: 'digunakan dalam' },
      { targetId: 'hamiltonian-decomposition', type: 'specializes', label: 'bentuk khusus' }
    ]
  },
  {
    id: 'qaoa-state-p1',
    latex: '|\\psi(\\gamma,\\beta)\\rangle = e^{-i\\beta \\hat{H}_M} e^{-i\\gamma \\hat{H}_C} |+\\\rangle^{\\otimes n}',
    title: 'QAOA State (p=1)',
    category: 'qaoa',
    tags: ['qaoa', 'state', 'ansatz', 'parameter'],
    chapter: ['4'],
    description: 'Keadaan QAOA dengan p=1 dibentuk dengan menerapkan dua unitary exponensial secara berurutan pada keadaan awal superposisi merata.',
    variables: [
      { symbol: 'γ', name: 'Gamma', description: 'Parameter untuk unitary biaya' },
      { symbol: 'β', name: 'Beta', description: 'Parameter untuk unitary mixer' }
    ],
    relatedFormulas: [
      { targetId: 'cost-hamiltonian', type: 'uses', label: 'komponen biaya' },
      { targetId: 'mixer-hamiltonian', type: 'uses', label: 'komponen mixer' },
      { targetId: 'variational-energy', type: 'related', label: 'struktur serupa' }
    ]
  },
  {
    id: 'mixer-hamiltonian',
    latex: '\\hat{H}_M = \\sum_{i=1}^{n} X_i',
    title: 'Mixer Hamiltonian',
    category: 'qaoa',
    tags: ['mixer', 'hamiltonian', 'X', 'driver'],
    chapter: ['4'],
    description: 'Hamiltonian mixer adalah jumlah operator Pauli-X yang mendorong eksplorasi ruang solusi. Mixer ini memastikan semua konfigurasi bit dapat dicapai.',
    variables: [
      { symbol: 'Ĥ_M', name: 'Mixer Hamiltonian', description: 'Operator Hamiltonian mixer' },
      { symbol: 'Xᵢ', name: 'Pauli-X', description: 'Operator Pauli-X pada qubit i' }
    ],
    relatedFormulas: [
      { targetId: 'qaoa-state-p1', type: 'used-in', label: 'digunakan dalam' },
      { targetId: 'pauli-x-matrix', type: 'derived-from', label: 'dasar' },
      { targetId: 'h-gate-matrix', type: 'related', label: 'menciptakan |+⟩' }
    ]
  },

  // ============================================================================
  // COMPLEXITY
  // ============================================================================

  {
    id: 'complexity-classical',
    latex: 'O(2^n)',
    title: 'Classical Complexity',
    category: 'complexity',
    tags: ['classical', 'exponential', 'complexity', 'brute-force'],
    chapter: ['3'],
    description: 'Kompleksitas klasik untuk masalah seperti Deutsch-Jozsa atau pencarian brute force tumbuh secara eksponensial dengan jumlah qubit n.',
    variables: [
      { symbol: 'n', name: 'Input Size', description: 'Ukuran input (jumlah qubit)' }
    ],
    relatedFormulas: [
      { targetId: 'dj-classical-bound', type: 'implements', label: 'batas konkret' },
      { targetId: 'qft-gate-complexity', type: 'contrast-with', label: 'kuantum polinomial' },
      { targetId: 'complexity-quantum', type: 'contrast-with', label: 'kuantum' }
    ]
  },
  {
    id: 'fft-complexity',
    latex: 'O(N \\log N)',
    title: 'FFT Complexity',
    category: 'complexity',
    tags: ['FFT', 'fast-fourier', 'transform', 'logarithmic'],
    chapter: ['3'],
    description: 'Fast Fourier Transform klasik memiliki kompleksitas O(N log N). Untuk N = 2ⁿ, ini setara dengan O(n2ⁿ).',
    variables: [
      { symbol: 'N', name: 'Points', description: 'Jumlah titik data' },
      { symbol: 'n', name: 'Log Points', description: 'log₂ N' }
    ],
    relatedFormulas: [
      { targetId: 'dft-definition', type: 'algorithm', label: 'algoritma untuk' },
      { targetId: 'qft-gate-complexity', type: 'contrast-with', label: 'kuantum lebih baik' },
      { targetId: 'qft-definition', type: 'related', label: 'QFT sebagai analog' }
    ]
  },
  {
    id: 'qft-gate-complexity',
    latex: 'O(n^2)',
    title: 'QFT Gate Complexity',
    category: 'complexity',
    tags: ['QFT', 'polynomial', 'gate', 'complexity'],
    chapter: ['3'],
    description: 'Kompleksitas gerbang QFT tumbuh secara polinomial kuadratik dengan jumlah qubit, jauh lebih baik daripada FFT klasik O(n2ⁿ).',
    variables: [
      { symbol: 'n', name: 'Qubit Count', description: 'Jumlah qubit' }
    ],
    relatedFormulas: [
      { targetId: 'qft-gate-count', type: 'derived-from', label: 'dihitung dari' },
      { targetId: 'fft-complexity', type: 'contrast-with', label: 'klasik vs kuantum' },
      { targetId: 'complexity-classical', type: 'contrast-with', label: 'alternatif' }
    ]
  },

  // ============================================================================
  // EQUATIONS / CONSTANTS
  // ============================================================================

  {
    id: 'euler-identity',
    latex: 'e^{i\\theta} = \\cos\\theta + i\\sin\\theta',
    title: "Euler's Identity",
    category: 'equations',
    tags: ['euler', 'complex', 'exponential', 'phase'],
    chapter: ['2', '3'],
    description: 'Identitas Euler menghubungkan eksponensial kompleks dengan fungsi trigonometri. Representasi ini fundamental untuk memahami fase kuantum.',
    variables: [
      { symbol: 'e', name: "Euler's Number", description: 'Bilangan Euler (basis logaritma natural)' },
      { symbol: 'θ', name: 'Angle', description: 'Sudut fase dalam radian' }
    ],
    relatedFormulas: [
      { targetId: 'qft-twiddle-factor', type: 'derived-from', label: 'digunakan dalam' },
      { targetId: 'bloch-sphere-state', type: 'derived-from', label: 'phase dalam' },
      { targetId: 'phase-kickback', type: 'related', label: 'mekanisme fase' }
    ]
  },
  {
    id: 'normalization-constant',
    latex: 'C = \\sqrt{\\sum_j |x[j]|^2}',
    title: 'Normalization Constant',
    category: 'equations',
    tags: ['normalization', 'constant', 'probability', 'amplitude'],
    chapter: ['2'],
    description: 'Konstanta normalisasi C memastikan bahwa vektor ternormalisasi memiliki panjang unit. Digunakan setelah superposisi untuk mendapatkan kondisi normalisasi.',
    variables: [
      { symbol: 'C', name: 'Normalizer', description: 'Konstanta normalisasi' },
      { symbol: 'x[j]', name: 'Components', description: 'Komponen vektor yang akan dinormalisasi' }
    ],
    relatedFormulas: [
      { targetId: 'normalization-condition', type: 'implements', label: 'menghitung' },
      { targetId: 'statevector-general', type: 'related', label: 'applied to' },
      { targetId: 'single-qubit-state', type: 'related', label: 'contoh' }
    ]
  },
  {
    id: 'acceptance-probability',
    latex: 'P = e^{-\\Delta E/T}',
    title: 'Acceptance Probability (Thermal)',
    category: 'equations',
    tags: ['probability', 'thermal', 'metropolis', 'boltzmann'],
    chapter: ['4'],
    description: 'Probabilitas acceptance dalam algoritma Metropolis Monte Carlo adalah e^{-ΔE/T}. Jika ΔE negatif (energi lebih rendah), transisi diterima selalu.',
    variables: [
      { symbol: 'P', name: 'Probability', description: 'Probabilitas acceptance' },
      { symbol: 'ΔE', name: 'Energy Difference', description: 'Selisih energi antara state baru dan lama' },
      { symbol: 'T', name: 'Temperature', description: 'Parameter temperatur' }
    ],
    relatedFormulas: [
      { targetId: 'ground-state-energy', type: 'related', label: 'target' },
      { targetId: 'maxcut-cost-function', type: 'related', label: 'ΔE dihitung dari' },
      { targetId: 'variational-energy', type: 'related', label: 'energi' }
    ]
  },

  // ============================================================================
  // FOUNDATIONAL / CROSS-CATEGORY
  // ============================================================================

  {
    id: 'entanglement-definition',
    latex: '|\\psi\\rangle \\neq |\\psi_A\\rangle \\otimes |\\psi_B\\rangle',
    title: 'Entanglement Definition',
    category: 'foundational',
    tags: ['entanglement', 'separability', 'non-product', 'korelasi'],
    chapter: ['2', '4'],
    description: 'Keadaan terentagle adalah keadaan yang tidak dapat difaktorkan menjadi produk tensor dua subsistem. Mengukur satu partikel secara instan mempengaruhi partikel lain.',
    variables: [
      { symbol: '|ψ⟩', name: 'Entangled State', description: 'Keadaan kuantum terentagle' },
      { symbol: '|ψ_A⟩ ⊗ |ψ_B⟩', name: 'Product State', description: 'Keadaan produk tensor (tidak terentagle)' }
    ],
    relatedFormulas: [
      { targetId: 'bell-state-phi', type: 'implements', label: 'contoh terkenal' },
      { targetId: 'cnot-gate-matrix', type: 'implements', label: 'diciptakan oleh' },
      { targetId: 'statevector-general', type: 'related', label: 'struktur' }
    ]
  },
  {
    id: 'phase-kickback',
    latex: '\\text{Controlled-}U|0\\rangle|\\phi\\rangle = |0\\rangle|\\phi\\rangle \\Rightarrow \\text{effect on control}',
    title: 'Phase Kickback Mechanism',
    category: 'foundational',
    tags: ['phase-kickback', 'controlled', 'eigenvalue', 'mekanisme'],
    chapter: ['2', '3'],
    description: 'Phase kickback terjadi ketika eigenvalue dari unitary target mempengaruhi fase keadaan kontrol. Mekanisme ini esensial untuk algoritma Deutsch-Jozsa dan banyak algoritma kuantum lainnya.',
    variables: [
      { symbol: 'U', name: 'Unitary', description: 'Operator unitary target' },
      { symbol: '|φ⟩', name: 'Eigenstate', description: 'Eigenstate dari U dengan eigenvalue e^{iθ}' }
    ],
    relatedFormulas: [
      { targetId: 'dj-phase-kickback', type: 'implements', label: 'contoh DJ' },
      { targetId: 'cz-gate-matrix', type: 'implements', label: 'contoh CZ' },
      { targetId: 'pauli-z-matrix', type: 'related', label: 'eigenstate Z' }
    ]
  },
  {
    id: 'superposition-state',
    latex: '\\text{Superposition: } |\\psi\\rangle = \\sum_i c_i |i\\rangle, \\text{ with } \\sum_i |c_i|^2 = 1',
    title: 'Quantum Superposition Principle',
    category: 'foundational',
    tags: ['superposition', 'coherence', 'linearity', 'superposisi'],
    chapter: ['2'],
    description: 'Prinsip superposisi adalah pilar mekanika kuantum yang menyatakan bahwa setiap kombinasi linear dari keadaan basis juga merupakan keadaan yang valid.',
    variables: [
      { symbol: 'cᵢ', name: 'Coefficient', description: 'Koefisien(superposisi amplitudo)' }
    ],
    relatedFormulas: [
      { targetId: 'h-gate-matrix', type: 'implements', label: 'diciptakan oleh' },
      { targetId: 'normalization-condition', type: 'implements', label: 'syarat' },
      { targetId: 'statevector-general', type: 'related', label: 'formalisasi' }
    ]
  }

];

export const FORMULA_REGISTRY: FormulaDefinition[] = BASE_FORMULA_REGISTRY.map((formula) => ({
  ...formula,
  computation: FORMULA_COMPUTATION_MAP[formula.id] ?? formula.computation,
}));
