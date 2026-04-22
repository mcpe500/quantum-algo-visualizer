export interface HardwareSpec {
  id: string;
  name: string;
  company: string;
  description: string;
  medium: string;
  operatingTemp: string;
  operatingTempKelvin: number;
  singleQubitGateTime: string;
  twoQubitGateTime: string;
  singleQubitFidelity: number;
  twoQubitFidelity: number;
  coherenceTimeT1: string;
  coherenceTimeT2: string;
  maxQubits: number;
  connectivity: string;
  color: string;
  icon: string;
  metrics: {
    gateSpeed: number;
    gateFidelity: number;
    coherence: number;
    scalability: number;
    connectivity: number;
    roomTempOperation: number;
  };
  features: string[];
  limitations: string[];
  gateImplementation: {
    singleQubit: string;
    twoQubit: string;
    stimulus: string;
  };
}

export const HARDWARE_SPECS: HardwareSpec[] = [
  {
    id: 'photonic',
    name: 'Photonic',
    company: 'Xanadu, PsiQuantum',
    description: 'Komputasi kuantum menggunakan foton sebagai qubit. Beroperasi pada suhu ruang.',
    medium: 'Foton',
    operatingTemp: 'Suhu Ruang',
    operatingTempKelvin: 300,
    singleQubitGateTime: '~fs - ps',
    twoQubitGateTime: '~ns - us',
    singleQubitFidelity: 0.99,
    twoQubitFidelity: 0.93,
    coherenceTimeT1: 'Tak terbatas',
    coherenceTimeT2: 'Tak terbatas',
    maxQubits: 216,
    connectivity: 'Reconfigurable',
    color: '#F59E0B',
    icon: 'sun',
    metrics: {
      gateSpeed: 10,
      gateFidelity: 7,
      coherence: 10,
      scalability: 8,
      connectivity: 9,
      roomTempOperation: 10,
    },
    features: [
      'Operasi suhu ruang',
      'Coherence time sangat tinggi',
      'Kompatibel dengan fiber optik',
      'Miniaturisasi menggunakan silikon fotoni',
    ],
    limitations: [
      'Gate probabilistik',
      'Photon-photon interaction sulit',
      'Multiplexing overhead tinggi',
      'Sensitif terhadap optical loss',
    ],
    gateImplementation: {
      singleQubit: 'Beam splitters & phase shifters',
      twoQubit: 'Fusion gates & measurement-based',
      stimulus: 'Laser pulses & homodyne detection',
    },
  },
  {
    id: 'superconducting',
    name: 'Superconducting',
    company: 'IBM, Google, Rigetti',
    description: 'Qubit berbasis arus listrik superkonduktor pada Josephson Junction.',
    medium: 'Cooper pairs',
    operatingTemp: '~15 mK',
    operatingTempKelvin: 0.015,
    singleQubitGateTime: '~10-20 ns',
    twoQubitGateTime: '~50-500 ns',
    singleQubitFidelity: 0.999,
    twoQubitFidelity: 0.995,
    coherenceTimeT1: '~100-500 us',
    coherenceTimeT2: '~100-300 us',
    maxQubits: 1121,
    connectivity: 'Nearest-neighbor',
    color: '#3B82F6',
    icon: 'zap',
    metrics: {
      gateSpeed: 10,
      gateFidelity: 9,
      coherence: 4,
      scalability: 9,
      connectivity: 4,
      roomTempOperation: 1,
    },
    features: [
      'Gate speed sangat tinggi',
      'Skalabilitas fabrikasi matang',
      'Qubit count tertinggi',
      'Kontrol microwave matang',
    ],
    limitations: [
      'Memerlukan kryogenik ekstrem',
      'Coherence time pendek',
      'Fabrication variability',
      'Thermal cycling effects',
    ],
    gateImplementation: {
      singleQubit: 'Microwave pulses (~5 GHz)',
      twoQubit: 'Cross-resonance / iSWAP',
      stimulus: 'Microwave generators',
    },
  },
  {
    id: 'trapped-ions',
    name: 'Trapped Ions',
    company: 'IonQ, Quantinuum',
    description: 'Ion bermuatan dalam medan elektromagnetik RF. Gerbang menggunakan laser.',
    medium: 'Ion',
    operatingTemp: 'Suhu Ruang',
    operatingTempKelvin: 300,
    singleQubitGateTime: '~1-10 us',
    twoQubitGateTime: '~1-100 us',
    singleQubitFidelity: 0.999999,
    twoQubitFidelity: 0.999,
    coherenceTimeT1: '~0.2-50 s',
    coherenceTimeT2: '~0.2-600 s',
    maxQubits: 32,
    connectivity: 'All-to-all',
    color: '#8B5CF6',
    icon: 'atom',
    metrics: {
      gateSpeed: 3,
      gateFidelity: 10,
      coherence: 10,
      scalability: 5,
      connectivity: 10,
      roomTempOperation: 8,
    },
    features: [
      'Gate fidelity tertinggi',
      'Coherence time sangat panjang',
      'All-to-all connectivity',
      'Qubit identik',
    ],
    limitations: [
      'Gate speed lambat',
      'Skalabilitas terbatas',
      'Kompleksitas sistem laser',
      'Waktu komputasi panjang',
    ],
    gateImplementation: {
      singleQubit: 'Laser / microwave driven',
      twoQubit: 'Molmer-Sorensen (phonon bus)',
      stimulus: 'Sinar laser (UV/Visible)',
    },
  },
  {
    id: 'neutral-atoms',
    name: 'Neutral Atoms',
    company: 'QuEra, Pasqal',
    description: 'Atom netral dalam array optical tweezers. Rydberg blockade untuk gates.',
    medium: 'Atom Netral',
    operatingTemp: '~10-100 uK',
    operatingTempKelvin: 0.0001,
    singleQubitGateTime: '~1-10 us',
    twoQubitGateTime: '~0.5-1 us',
    singleQubitFidelity: 0.999,
    twoQubitFidelity: 0.98,
    coherenceTimeT1: '~1-10 s',
    coherenceTimeT2: '~1-10 s',
    maxQubits: 256,
    connectivity: 'Reconfigurable',
    color: '#10B981',
    icon: 'circle-dot',
    metrics: {
      gateSpeed: 6,
      gateFidelity: 8,
      coherence: 9,
      scalability: 8,
      connectivity: 9,
      roomTempOperation: 2,
    },
    features: [
      'Konektivitas dinamis',
      'Scalabilitas tinggi',
      'Operasi paralel',
      'Long coherence times',
    ],
    limitations: [
      'Gate errors dari Rydberg',
      'Transportasi lambat',
      'Vacuum requirements',
      'Crosstalk optik',
    ],
    gateImplementation: {
      singleQubit: 'Raman rotations',
      twoQubit: 'Rydberg blockade (CZ)',
      stimulus: 'Laser (Optical Tweezers)',
    },
  },
  {
    id: 'silicon-spin',
    name: 'Silicon Spin',
    company: 'Intel, QuTech',
    description: 'Spin elektron dalam quantum dot silikon. Kompatibel dengan CMOS.',
    medium: 'Spin Elektron',
    operatingTemp: '~10-100 mK',
    operatingTempKelvin: 0.01,
    singleQubitGateTime: '~10-100 ns',
    twoQubitGateTime: '~100 ns - 1 us',
    singleQubitFidelity: 0.999,
    twoQubitFidelity: 0.97,
    coherenceTimeT1: '~1-10 ms',
    coherenceTimeT2: '~100 us - 1 ms',
    maxQubits: 6,
    connectivity: 'Nearest-neighbor',
    color: '#EC4899',
    icon: 'cpu',
    metrics: {
      gateSpeed: 9,
      gateFidelity: 8,
      coherence: 7,
      scalability: 10,
      connectivity: 4,
      roomTempOperation: 1,
    },
    features: [
      'Kompatibilitas CMOS',
      'Ukuran sangat kecil',
      'Potensi skalabilitas ekstrem',
      'Low power',
    ],
    limitations: [
      'Operasi pada suhu sangat rendah',
      'Kontrol sangat sensitif',
      'Scaling masih terbatas',
      'Readout menantang',
    ],
    gateImplementation: {
      singleQubit: 'EDSR / ESR (microwave)',
      twoQubit: 'Exchange interaction',
      stimulus: 'Magnetic Field / Microwave',
    },
  },
  {
    id: 'topological',
    name: 'Topological',
    company: 'Microsoft',
    description: 'Majorana zero modes pada semiconductor-superconductor nanowires.',
    medium: 'Majorana Fermions',
    operatingTemp: '~10-50 mK',
    operatingTempKelvin: 0.02,
    singleQubitGateTime: 'N/A (braiding)',
    twoQubitGateTime: 'N/A (braiding)',
    singleQubitFidelity: 0.99,
    twoQubitFidelity: 0.99,
    coherenceTimeT1: 'Teoritis tak terbatas',
    coherenceTimeT2: 'Teoritis tak terbatas',
    maxQubits: 1,
    connectivity: 'Nearest-neighbor',
    color: '#6366F1',
    icon: 'shield',
    metrics: {
      gateSpeed: 2,
      gateFidelity: 10,
      coherence: 10,
      scalability: 3,
      connectivity: 4,
      roomTempOperation: 1,
    },
    features: [
      'Toleransi kesalahan intrinsik',
      'Proteksi topologis',
      'Gate fidelity teoritis tinggi',
      'Potensi koreksi kesalahan efisien',
    ],
    limitations: [
      'Belum terbukti secara eksperimental',
      'Kontroversi ilmiah',
      'Kompleksitas fabrikasi',
      'Scalability belum jelas',
    ],
    gateImplementation: {
      singleQubit: 'Braiding operations',
      twoQubit: 'Braiding + measurement',
      stimulus: 'Braiding Operations',
    },
  },
  {
    id: 'nv-centers',
    name: 'NV Centers',
    company: 'Harvard, TU Delft',
    description: 'Spin elektron pada defek nitrogen-vacancy dalam intan.',
    medium: 'Defek dalam Intan',
    operatingTemp: 'Suhu Ruang / 4K',
    operatingTempKelvin: 300,
    singleQubitGateTime: '~10-100 ns',
    twoQubitGateTime: '~us (elektron-nuklir)',
    singleQubitFidelity: 0.99,
    twoQubitFidelity: 0.95,
    coherenceTimeT1: '~1-10 ms',
    coherenceTimeT2: '~1-10 ms',
    maxQubits: 3,
    connectivity: 'Lokal',
    color: '#14B8A6',
    icon: 'gem',
    metrics: {
      gateSpeed: 7,
      gateFidelity: 6,
      coherence: 8,
      scalability: 2,
      connectivity: 3,
      roomTempOperation: 10,
    },
    features: [
      'Operasi suhu ruang',
      'Coherence time sangat panjang',
      'Quantum sensing',
      'Single-shot readout',
    ],
    limitations: [
      'Scalabilitas terbatas',
      'Gate speed lambat',
      'Fabrication sulit',
      'Multi-NV coupling sulit',
    ],
    gateImplementation: {
      singleQubit: 'Microwave pulses (2.87 GHz)',
      twoQubit: 'Hyperfine coupling (elektron-nuklir)',
      stimulus: 'Laser & Microwave Pulses',
    },
  },
];

export const METRIC_LABELS: Record<string, string> = {
  gateSpeed: 'Gate Speed',
  gateFidelity: 'Gate Fidelity',
  coherence: 'Coherence Time',
  scalability: 'Scalability',
  connectivity: 'Connectivity',
  roomTempOperation: 'Room Temp Op',
};
