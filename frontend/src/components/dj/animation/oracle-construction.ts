import type { DJAnimationPayload } from '../../../types/dj';

export interface OracleGateBlock {
  inputBits: string;
  zeroControls: string[];
  flipQubits: string[];
  mcxControls: string[];
  restoreQubits: string[];
  isActive: boolean;
}

export interface OracleConstructionRow {
  inputBits: string;
  stepNumber: number;
  intro: string;
  subSteps: {
    phase: 'init' | 'flip' | 'mcx' | 'restore';
    label: string;
    detail: string;
    gate: string;
    affected: string;
  }[];
  gateSequence: string;
  zeroControls: string[];
}

export interface OracleConstructionModel {
  profile: 'constant-zero' | 'constant-one' | 'balanced';
  intro: string;
  overviewBlock: {
    label: string;
    content: string;
    gateCount: number;
  } | null;
  steps: string[];
  gateSummary: string;
  rows: OracleConstructionRow[];
  activeBits: string | null;
}

function getQubitLabel(index: number): string {
  return `q${index}`;
}

function buildBalancedRows(data: DJAnimationPayload) {
  const onesRows = data.truth_table.filter((entry) => entry.output === 1);

  return onesRows.map((entry, rowIndex) => {
    const zeroControls = entry.input
      .split('')
      .flatMap((bit, index) => (bit === '0' ? [getQubitLabel(index)] : []));

    const flipQubits = zeroControls;
    const mcxControls = Array.from({ length: data.n_qubits }, (_, index) => getQubitLabel(index));
    const restoreQubits = zeroControls;

    const subSteps = [
      {
        phase: 'init' as const,
        label: 'Inisialisasi',
        detail: 'Ancilla siap di |0⟩. Tidak ada operasi.',
        gate: '—',
        affected: 'ancilla',
      },
      {
        phase: 'flip' as const,
        label: flipQubits.length > 0 ? 'X Temporary' : 'Tidak perlu flip',
        detail: flipQubits.length > 0
          ? `Bit 0 pada ${flipQubits.join(', ')} dibalik sementara.Semua kontrol jadi 1.`
          : 'Semua bit input sudah 1. Tidak perlu X sementara.',
        gate: flipQubits.length > 0 ? `X on ${flipQubits.join(', ')}` : 'skip',
        affected: flipQubits.length > 0 ? flipQubits.join(', ') : '—',
      },
      {
        phase: 'mcx' as const,
        label: 'MCX',
        detail: `Kontrol dari ${mcxControls.join(', ')} ke ancilla.Tepat pola "${entry.input}" yang di-MCX.`,
        gate: 'MCX',
        affected: `controls: ${mcxControls.join(', ')} → ancilla`,
      },
      {
        phase: 'restore' as const,
        label: restoreQubits.length > 0 ? 'Restore X' : 'Tidak perlu restore',
        detail: restoreQubits.length > 0
          ? `X pada ${restoreQubits.join(', ')} dikembalikan. Register input pulih ke |0⟩/ |1⟩ semula.`
          : 'Tidak ada X sementara. Register sudah dalam keadaan semula.',
        gate: restoreQubits.length > 0 ? `X on ${restoreQubits.join(', ')}` : 'skip',
        affected: restoreQubits.length > 0 ? restoreQubits.join(', ') : '—',
      },
    ];

    const gateSequence = flipQubits.length > 0
      ? `[X ${flipQubits.join(', ')}] → [MCX] → [X ${restoreQubits.join(', ')}]`
      : '[MCX]';

    return {
      inputBits: entry.input,
      stepNumber: rowIndex + 1,
      intro: `Pola input "${entry.input}" memicu f(x)=1. Dibangun satu blok oracle khusus untuk pola ini.`,
      subSteps,
      gateSequence,
      zeroControls,
    } satisfies OracleConstructionRow;
  });
}

export function buildOracleConstructionModel(
  data: DJAnimationPayload,
  activeBits: string | null,
): OracleConstructionModel {
  if (data.oracle_summary.profile === 'constant-zero') {
    return {
      profile: 'constant-zero',
      intro: 'Semua baris bernilai f(x)=0. Oracle tidak menandai pola input apa pun.',
      overviewBlock: {
        label: 'Identitas Oracle',
        content: 'Tidak ada blok MCX. Fase oracle = identitas.',
        gateCount: 0,
      },
      steps: [
        'Baca truth table → semua output = 0.',
        'Tidak perlu MCX karena tidak ada input yang menghasilkan 1.',
        'Fase oracle tetap identitas. Interferensi langsung terjadi.',
      ],
      gateSummary: 'Oracle = Identitas (tanpa X, tanpa MCX, tanpa restore).',
      rows: [],
      activeBits,
    };
  }

  if (data.oracle_summary.profile === 'constant-one') {
    return {
      profile: 'constant-one',
      intro: 'Semua baris bernilai f(x)=1. Setiap input triggers keluaran 1.',
      overviewBlock: {
        label: 'X pada Ancilla',
        content: 'Semua input diperlakukan sama. Cukup balik ancilla sekali dengan X.',
        gateCount: 1,
      },
      steps: [
        'Baca truth table → semua output = 1.',
        'Semua input diperlakukan sama. Tidak perlu bedakan pola.',
        'Satu X pada ancilla = representasi oracle constant-one.',
        'Tidak perlu MCX karena tidak ada pola spesifik yang ditarget.',
      ],
      gateSummary: 'Oracle = X pada ancilla. Balanced blok = 0. Total 1 gate.',
      rows: [],
      activeBits,
    };
  }

  const rows = buildBalancedRows(data);
  const totalGates = rows.reduce((acc, row) => {
    const gates = row.subSteps.filter((s) => s.gate !== 'skip');
    return acc + gates.length;
  }, 0);

  return {
    profile: 'balanced',
    intro: `${rows.length} dari ${data.oracle_summary.total_inputs} input bernilai 1. Setiap input tersebut dibangun jadi satu blok oracle dengan sequence X → MCX → X.`,
    overviewBlock: {
      label: `${rows.length} Blok Oracle`,
      content: `Setiap blok = [X sementara pada bit 0] → [MCX ke ancilla] → [restore X]. Total ${totalGates} gate beroperasi.`,
      gateCount: totalGates,
    },
    steps: [
      'Pilih baris dengan f(x)=1 dari truth table.',
      'Untuk setiap pola input:',
      '  - Flip sementara bit yang = 0 → semua kontrol jadi 1.',
      '  - MCX dari seluruh input qubit ke ancilla.',
      '  - Restore X pada bit yang tadi di-flip.',
      'Blok berikutnya berlaku untuk pola input berikutnya.',
    ],
    gateSummary: `Oracle = ${rows.length} blok MCX. Tiap blok = X → MCX → X. Total ${totalGates} gate.`,
    rows,
    activeBits,
  };
}
