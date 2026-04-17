import type { DJAnimationPayload } from '../../../types/dj';

export interface OracleConstructionRow {
  inputBits: string;
  zeroControlLabels: string[];
  temporaryFlipLabels: string[];
  controlLabels: string[];
  mcxTargetLabel: string;
}

export interface OracleConstructionModel {
  intro: string;
  steps: string[];
  rows: OracleConstructionRow[];
  gateSummary: string;
}

function getQubitLabel(index: number) {
  return `q${index}`;
}

function buildBalancedRows(data: DJAnimationPayload) {
  return data.truth_table
    .filter((entry) => entry.output === 1)
    .map((entry) => {
      const zeroControlLabels = entry.input
        .split('')
        .flatMap((bit, index) => (bit === '0' ? [getQubitLabel(index)] : []));

      const controlLabels = Array.from({ length: data.n_qubits }, (_, index) => getQubitLabel(index));

      return {
        inputBits: entry.input,
        zeroControlLabels,
        temporaryFlipLabels: [...zeroControlLabels],
        controlLabels,
        mcxTargetLabel: 'ancilla',
      } satisfies OracleConstructionRow;
    });
}

export function buildOracleConstructionModel(data: DJAnimationPayload): OracleConstructionModel {
  if (data.oracle_summary.profile === 'constant-zero') {
    return {
      intro: 'Semua baris pada truth table bernilai 0. Karena tidak ada input yang harus memicu keluaran 1, oracle tidak perlu menandai pola input apa pun.',
      steps: [
        'Baca seluruh truth table dari dataset aktif.',
        'Hitung jumlah baris dengan f(x)=1.',
        'Jika jumlahnya 0, fase oracle cukup dibiarkan sebagai identitas.',
        'Akibatnya tidak ada blok kontrol tambahan di antara dua barrier oracle.',
      ],
      rows: [],
      gateSummary: 'Oracle aktual: Identity. Tidak ada X, tidak ada MCX, tidak ada restore.',
    };
  }

  if (data.oracle_summary.profile === 'constant-one') {
    return {
      intro: 'Semua baris pada truth table bernilai 1. Karena setiap input harus menghasilkan keluaran 1, oracle tidak perlu membedakan pola input tertentu.',
      steps: [
        'Baca seluruh truth table dari dataset aktif.',
        'Hitung jumlah baris dengan f(x)=1.',
        'Jika semua input bernilai 1, cukup balik ancilla sekali dengan gerbang X.',
        'Satu X pada ancilla sudah merepresentasikan oracle constant-one untuk seluruh dataset.',
      ],
      rows: [],
      gateSummary: 'Oracle aktual: X pada ancilla sekali. Tidak perlu MCX karena semua input diperlakukan sama.',
    };
  }

  const rows = buildBalancedRows(data);

  return {
    intro: `${rows.length} dari ${data.oracle_summary.total_inputs} input bernilai 1. Setiap baris bernilai 1 diubah menjadi satu blok oracle yang benar-benar mengikuti pola bit pada dataset.`,
    steps: [
      'Pilih hanya baris dengan f(x)=1 dari truth table.',
      'Untuk satu pola input, setiap bit 0 dibalik sementara dengan gerbang X agar semua kontrol efektif menjadi 1.',
      'Jalankan MCX dari seluruh qubit input ke ancilla untuk menandai tepat pola itu.',
      'Kembalikan lagi X sementara supaya register input tetap kembali ke basis semula sebelum pola berikutnya diproses.',
    ],
    rows,
    gateSummary: `Oracle aktual dibangun dari ${rows.length} blok pola. Tiap blok = temporary X -> MCX -> restore X.`,
  };
}
