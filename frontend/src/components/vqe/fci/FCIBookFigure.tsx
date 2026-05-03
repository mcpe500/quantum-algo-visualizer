import { Download } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import type { VQEBenchmarkResult } from '../../../types/vqe';

interface FCIBookFigureProps {
  result: VQEBenchmarkResult;
}

type Complex = { re: number; im: number };

type FCIFlowDataset = {
  caseId: string;
  molecule: {
    formula: string;
    distanceAngstrom: number;
    basis: string;
    charge: number;
    multiplicity: number;
    electrons: number;
    spatialOrbitals: number;
    spinOrbitals: number;
    slaterDeterminants: string[];
  };
  preprocessing: {
    mapping: string;
    initialQubits: number;
    qubitReduction: string;
    targetQubits: number;
    removedQubits: number[];
  };
  hamiltonian: {
    qubits: number;
    terms: Record<string, number>;
  };
  classical: {
    matrixDimension: number;
    energy: number;
  };
};

const CANVAS_WIDTH = 1800;
const CANVAS_HEIGHT = 1260;

const COLORS = {
  bg: '#F8FAFC',
  panel: '#FFFFFF',
  text: '#0F172A',
  textSub: '#475569',
  border: '#CBD5E1',
  blue: '#2563EB',
  green: '#10B981',
  gray: '#64748B',
  amber: '#D97706',
  zTerm: '#0369A1',
  xTerm: '#BE123C',
};

const complex = (re: number, im = 0): Complex => ({ re, im });
const cAdd = (a: Complex, b: Complex): Complex => complex(a.re + b.re, a.im + b.im);
const cMul = (a: Complex, b: Complex): Complex =>
  complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const cScale = (a: Complex, scale: number): Complex => complex(a.re * scale, a.im * scale);

function pauliMatrix(symbol: string): Complex[][] {
  if (symbol === 'X') return [[complex(0), complex(1)], [complex(1), complex(0)]];
  if (symbol === 'Y') return [[complex(0), complex(0, -1)], [complex(0, 1), complex(0)]];
  if (symbol === 'Z') return [[complex(1), complex(0)], [complex(0), complex(-1)]];
  return [[complex(1), complex(0)], [complex(0), complex(1)]];
}

function kron(A: Complex[][], B: Complex[][]): Complex[][] {
  const rA = A.length;
  const cA = A[0].length;
  const rB = B.length;
  const cB = B[0].length;
  const C = Array.from({ length: rA * rB }, () => Array.from({ length: cA * cB }, () => complex(0)));

  for (let i = 0; i < rA; i += 1) {
    for (let j = 0; j < cA; j += 1) {
      for (let k = 0; k < rB; k += 1) {
        for (let l = 0; l < cB; l += 1) {
          C[i * rB + k][j * cB + l] = cMul(A[i][j], B[k][l]);
        }
      }
    }
  }

  return C;
}

function pauliStringMatrix(pauliString: string): Complex[][] {
  let matrix = pauliMatrix(pauliString[0]);
  for (let i = 1; i < pauliString.length; i += 1) {
    matrix = kron(matrix, pauliMatrix(pauliString[i]));
  }
  return matrix;
}

function buildHamiltonianMatrix(terms: Record<string, number>, nQubits: number): Complex[][] {
  const dim = 2 ** nQubits;
  const H = Array.from({ length: dim }, () => Array.from({ length: dim }, () => complex(0)));

  Object.entries(terms).forEach(([pauli, coeff]) => {
    const P = pauliStringMatrix(pauli);
    for (let row = 0; row < dim; row += 1) {
      for (let col = 0; col < dim; col += 1) {
        H[row][col] = cAdd(H[row][col], cScale(P[row][col], coeff));
      }
    }
  });

  return H;
}

function extractRealMatrix(matrix: Complex[][]): number[][] {
  return matrix.map((row) => row.map((cell) => cell.re));
}

function jacobiEigenvalues(matrix: number[][], maxIter = 1500, tol = 1e-9): number[] {
  const n = matrix.length;
  const D = matrix.map((row) => [...row]);

  for (let iter = 0; iter < maxIter; iter += 1) {
    let max = 0;
    let p = 0;
    let q = 0;

    for (let i = 0; i < n - 1; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        if (Math.abs(D[i][j]) > max) {
          max = Math.abs(D[i][j]);
          p = i;
          q = j;
        }
      }
    }

    if (max < tol) break;

    const diff = D[q][q] - D[p][p];
    let t: number;
    if (Math.abs(D[p][q]) < 1e-15) {
      t = 0;
    } else if (Math.abs(diff) < 1e-15) {
      t = 1;
    } else {
      const theta = diff / (2 * D[p][q]);
      t = 1 / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      if (theta < 0) t = -t;
    }

    const c = 1 / Math.sqrt(1 + t * t);
    const s = t * c;
    const tau = s / (1 + c);
    const h = t * D[p][q];

    D[p][p] -= h;
    D[q][q] += h;
    D[p][q] = 0;
    D[q][p] = 0;

    for (let i = 0; i < n; i += 1) {
      if (i !== p && i !== q) {
        const g = D[i][p];
        const hVal = D[i][q];
        D[i][p] = g - s * (hVal + g * tau);
        D[p][i] = D[i][p];
        D[i][q] = hVal + s * (g - hVal * tau);
        D[q][i] = D[i][q];
      }
    }
  }

  return D.map((row, index) => row[index]).sort((a, b) => a - b);
}

function inferDataset(result: VQEBenchmarkResult): FCIFlowDataset {
  const caseId = result.computational_trace?.case_id ?? (result.n_qubits === 4 ? 'VQE-02' : 'VQE-01');
  const isFull = result.n_qubits === 4 || caseId === 'VQE-02';

  return {
    caseId,
    molecule: {
      formula: result.molecule || 'H2',
      distanceAngstrom: 0.735,
      basis: 'STO-3G',
      charge: 0,
      multiplicity: 1,
      electrons: 2,
      spatialOrbitals: 2,
      spinOrbitals: 4,
      slaterDeterminants: ['|1100>', '|1010>', '|1001>', '|0110>', '|0101>', '|0011>'],
    },
    preprocessing: {
      mapping: 'Jordan-Wigner',
      initialQubits: 4,
      qubitReduction: isFull ? 'none' : 'z2_tapering',
      targetQubits: result.n_qubits,
      removedQubits: isFull ? [] : [2, 3],
    },
    hamiltonian: {
      qubits: result.n_qubits,
      terms: result.hamiltonian_terms,
    },
    classical: {
      matrixDimension: 2 ** result.n_qubits,
      energy: result.classical.energy,
    },
  };
}

function classifyPauliTerm(pauli: string): 'identity' | 'diagonal' | 'offdiagonal' {
  if ([...pauli].every((char) => char === 'I')) return 'identity';
  if ([...pauli].every((char) => char === 'I' || char === 'Z')) return 'diagonal';
  return 'offdiagonal';
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke?: string,
  shadow = true
) {
  if (shadow) {
    ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
  }

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  if (stroke) {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function drawBadge(ctx: CanvasRenderingContext2D, label: string, x: number, y: number) {
  const color = label === 'COMPUTED' ? COLORS.green : label === 'CONCEPT' ? COLORS.gray : label === 'NOT PROVIDED' ? COLORS.amber : COLORS.blue;
  const width = label.length * 7 + 18;
  drawRoundedRect(ctx, x, y, width, 24, 5, color, undefined, false);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + width / 2, y + 16);
  ctx.textAlign = 'left';
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = COLORS.textSub) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 12;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawPathArrow(ctx: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.strokeStyle = COLORS.textSub;
  ctx.lineWidth = 3;
  ctx.stroke();

  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  drawArrow(ctx, prev.x, prev.y, last.x, last.y);
}

function formatHartree(value: number): string {
  return `${value.toFixed(6)} Ha`;
}

function drawHeader(ctx: CanvasRenderingContext2D, dataset: FCIFlowDataset) {
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 36px Arial';
  ctx.fillText('Flow Diagram FCI Klasik untuk VQE - H2/STO-3G Exact Diagonalization', 48, 62);
  ctx.fillStyle = COLORS.textSub;
  ctx.font = '19px Arial';
  ctx.fillText('Alur transformasi dari input dataset menjadi baseline FCI untuk evaluasi energi ground state VQE.', 48, 96);
  ctx.fillStyle = COLORS.blue;
  ctx.font = 'italic 16px Arial';
  ctx.fillText(`Aktif: ${dataset.caseId}`, 1600, 62);
}

function drawNodeTitle(ctx: CanvasRenderingContext2D, title: string, x: number, y: number, badge: string, badgeOffset = 0) {
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 20px Arial';
  ctx.fillText(title, x + 20, y + 36);
  drawBadge(ctx, badge, x + 400 - badgeOffset, y + 16);
}

function drawNode1(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, dataset: FCIFlowDataset) {
  drawRoundedRect(ctx, x, y, w, h, 12, COLORS.panel, COLORS.border);
  drawNodeTitle(ctx, '[1] Molecular Dataset', x, y, 'DATASET');
  ctx.beginPath();
  ctx.arc(x + 135, y + 128, 31, 0, Math.PI * 2);
  ctx.fillStyle = '#DBEAFE';
  ctx.fill();
  ctx.strokeStyle = COLORS.border;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 280, y + 128, 31, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 166, y + 128);
  ctx.lineTo(x + 249, y + 128);
  ctx.lineWidth = 5;
  ctx.strokeStyle = COLORS.text;
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 25px Arial';
  ctx.fillText('H', x + 126, y + 137);
  ctx.fillText('H', x + 271, y + 137);
  ctx.font = '15px Arial';
  ctx.fillText(`${dataset.molecule.distanceAngstrom} A`, x + 190, y + 106);
  ctx.font = '14px Consolas';
  ctx.fillStyle = COLORS.textSub;
  ctx.fillText(`Molecule : ${dataset.molecule.formula}`, x + 42, y + 218);
  ctx.fillText(`Basis    : ${dataset.molecule.basis}`, x + 42, y + 240);
  ctx.fillText(`Charge   : ${dataset.molecule.charge} | Mult: ${dataset.molecule.multiplicity}`, x + 42, y + 262);
  ctx.fillText(`Electrons: ${dataset.molecule.electrons}`, x + 42, y + 284);
}

function drawNode2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, dataset: FCIFlowDataset) {
  drawRoundedRect(ctx, x, y, w, h, 12, COLORS.panel, COLORS.border);
  drawNodeTitle(ctx, '[2] Orbital Space', x, y, 'DATASET');
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.text;
  ctx.beginPath();
  ctx.moveTo(x + 100, y + 122);
  ctx.lineTo(x + 250, y + 122);
  ctx.moveTo(x + 100, y + 195);
  ctx.lineTo(x + 250, y + 195);
  ctx.stroke();
  ctx.fillStyle = COLORS.textSub;
  ctx.font = '14px Arial';
  ctx.fillText('sigma_u* (antibonding)', x + 275, y + 126);
  ctx.fillText('sigma_g (bonding)', x + 275, y + 200);
  ctx.fillStyle = COLORS.blue;
  [148, 198].forEach((cx) => {
    ctx.beginPath();
    ctx.arc(x + cx, y + 195, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 15px Arial';
  ctx.fillText(`${dataset.molecule.spatialOrbitals} Spatial Orbitals | ${dataset.molecule.spinOrbitals} Spin Orbitals`, x + 40, y + 256);
  ['sigma_g up', 'sigma_g dn', 'sigma_u* up', 'sigma_u* dn'].forEach((label, index) => {
    const bx = x + 40 + index * 102;
    drawRoundedRect(ctx, bx, y + 274, 88, 26, 4, '#F1F5F9', COLORS.border, false);
    ctx.fillStyle = COLORS.textSub;
    ctx.font = '12px Arial';
    ctx.fillText(label, bx + 9, y + 292);
  });
}

function drawNode3(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, dataset: FCIFlowDataset) {
  drawRoundedRect(ctx, x, y, w, h, 12, COLORS.panel, COLORS.border);
  drawNodeTitle(ctx, '[3] Slater Determinants', x, y, 'DATASET');
  ctx.font = '16px Arial';
  ctx.fillStyle = COLORS.textSub;
  ctx.fillText('Kombinasi konfigurasi: C(4,2) = 6', x + 40, y + 84);
  dataset.molecule.slaterDeterminants.forEach((det, index) => {
    const bx = x + 58 + (index % 2) * 162;
    const by = y + 116 + Math.floor(index / 2) * 54;
    drawRoundedRect(ctx, bx, by, 138, 42, 6, '#F8FAFC', COLORS.border, false);
    ctx.fillStyle = COLORS.text;
    ctx.font = '18px Consolas';
    ctx.fillText(det, bx + 33, by + 27);
  });
}

function drawNode4(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, dataset: FCIFlowDataset) {
  drawRoundedRect(ctx, x, y, w, h, 12, COLORS.panel, COLORS.border);
  drawNodeTitle(ctx, '[4] Fermion-to-Qubit Mapping', x, y, 'DATASET + CONCEPT', 56);
  ctx.fillStyle = COLORS.textSub;
  ctx.font = '14px Arial';
  ctx.fillText('Jordan-Wigner Transform:', x + 40, y + 84);
  ctx.fillStyle = COLORS.blue;
  ctx.font = 'italic 18px Georgia';
  ctx.fillText('a_p^dagger -> 1/2 (prod Z_j)(X_p - iY_p)', x + 60, y + 114);
  const tapered = dataset.preprocessing.qubitReduction === 'z2_tapering';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 15px Arial';
  ctx.fillText(`Symmetry Reduction: ${tapered ? 'Z2 Tapering' : 'None'}`, x + 40, y + 172);
  for (let i = 0; i < 4; i += 1) {
    const active = !tapered || i < dataset.preprocessing.targetQubits;
    const cx = x + 82 + i * 66;
    ctx.beginPath();
    ctx.arc(cx, y + 226, 22, 0, Math.PI * 2);
    ctx.fillStyle = active ? COLORS.green : '#E2E8F0';
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.stroke();
    ctx.fillStyle = active ? '#FFFFFF' : COLORS.textSub;
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`q${i}`, cx - 8, y + 231);
    if (!active) {
      ctx.beginPath();
      ctx.moveTo(cx - 15, y + 211);
      ctx.lineTo(cx + 15, y + 241);
      ctx.strokeStyle = COLORS.amber;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
  ctx.fillStyle = COLORS.textSub;
  ctx.font = '14px Arial';
  ctx.fillText(tapered ? '4 qubits -> removed [2,3] -> 2 qubits aktif' : '4 qubits aktif penuh', x + 40, y + 284);
}

function drawNode5(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, dataset: FCIFlowDataset) {
  drawRoundedRect(ctx, x, y, w, h, 12, COLORS.panel, COLORS.border);
  drawNodeTitle(ctx, '[5] Pauli-Sum Hamiltonian', x, y, 'DATASET');
  ctx.fillStyle = COLORS.blue;
  ctx.font = 'italic 18px Georgia';
  ctx.fillText('H = sum c_k P_k', x + 40, y + 76);
  ctx.fillStyle = COLORS.textSub;
  ctx.font = '12px Arial';
  ctx.fillText('Abu: identity, biru: diagonal Z, merah: off-diag X/Y', x + 178, y + 76);
  ctx.font = '13px Consolas';
  Object.entries(dataset.hamiltonian.terms).forEach(([pauli, coeff], index) => {
    const type = classifyPauliTerm(pauli);
    ctx.fillStyle = type === 'identity' ? COLORS.gray : type === 'diagonal' ? COLORS.zTerm : COLORS.xTerm;
    const col = index >= 8 ? 1 : 0;
    const row = index >= 8 ? index - 8 : index;
    const sign = coeff >= 0 ? '+' : '';
    ctx.fillText(`${pauli}: ${sign}${coeff.toFixed(8)}`, x + 40 + col * 238, y + 108 + row * 22);
  });
}

function drawNode6(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, matrix: number[][]) {
  drawRoundedRect(ctx, x, y, w, h, 12, COLORS.panel, COLORS.border);
  drawNodeTitle(ctx, '[6] Dense Matrix H', x, y, 'COMPUTED', 8);
  const dim = matrix.length;
  ctx.fillStyle = COLORS.textSub;
  ctx.font = '14px Arial';
  ctx.fillText(`Dimensi: ${dim} x ${dim}`, x + 40, y + 76);
  ctx.fillStyle = COLORS.blue;
  ctx.font = 'italic 15px Georgia';
  ctx.fillText('H_mat = sum c_k M(P_k)', x + 170, y + 76);

  if (dim === 4) {
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const val = matrix[row][col];
        const bx = x + 48 + col * 102;
        const by = y + 106 + row * 52;
        drawRoundedRect(ctx, bx, by, 92, 42, 4, '#F8FAFC', COLORS.border, false);
        ctx.fillStyle = Math.abs(val) > 1e-6 ? COLORS.text : COLORS.gray;
        ctx.font = '14px Consolas';
        ctx.fillText(val.toFixed(4), bx + 11, by + 27);
      }
    }
  } else {
    const maxVal = Math.max(...matrix.flat().map(Math.abs), 1);
    const startX = x + 134;
    const startY = y + 104;
    const cell = 12;
    for (let row = 0; row < dim; row += 1) {
      for (let col = 0; col < dim; col += 1) {
        const val = matrix[row][col];
        const intensity = Math.abs(val) / maxVal;
        let r = 241;
        let g = 245;
        let b = 249;
        if (val > 1e-6) {
          g = 255 - Math.floor(intensity * 200);
          b = 255 - Math.floor(intensity * 200);
          r = 255;
        } else if (val < -1e-6) {
          r = 255 - Math.floor(intensity * 200);
          g = 255 - Math.floor(intensity * 200);
          b = 255;
        }
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(startX + col * cell, startY + row * cell, cell - 1, cell - 1);
      }
    }
    ctx.fillStyle = COLORS.textSub;
    ctx.font = '12px Arial';
    ctx.fillText('Heatmap 16x16 (merah +, biru -)', x + 148, y + 322);
  }
}

function drawNode7(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  drawRoundedRect(ctx, x, y, w, h, 12, COLORS.panel, COLORS.border);
  drawNodeTitle(ctx, '[7] Exact Diagonalization', x, y, 'COMPUTED', 8);
  drawRoundedRect(ctx, x + 95, y + 112, 330, 124, 8, '#F1F5F9', COLORS.border, false);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 18px Arial';
  ctx.fillText('Eigensolver Operator', x + 165, y + 153);
  ctx.fillStyle = COLORS.blue;
  ctx.font = 'italic 20px Georgia';
  ctx.fillText('H c = E c', x + 214, y + 193);
  drawArrow(ctx, x + 25, y + 174, x + 95, y + 174, COLORS.blue);
  ctx.fillStyle = COLORS.text;
  ctx.font = '14px Arial';
  ctx.fillText('Matrix H', x + 24, y + 160);
  drawArrow(ctx, x + 425, y + 174, x + 494, y + 174, COLORS.green);
  ctx.fillText('Eigenvalues', x + 405, y + 160);
}

function drawNode8(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, eigenvalues: number[]) {
  drawRoundedRect(ctx, x, y, w, h, 12, COLORS.panel, COLORS.border);
  drawNodeTitle(ctx, '[8] Eigenvalue Spectrum', x, y, 'COMPUTED', 8);
  const min = eigenvalues[0] ?? 0;
  const max = eigenvalues[eigenvalues.length - 1] ?? min + 1;
  const range = Math.max(Math.abs(max - min), 1e-9);
  const mapY = (energy: number) => y + 270 - ((energy - min) / range) * 174;
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 60, y + 282);
  ctx.lineTo(x + 60, y + 82);
  ctx.stroke();
  ctx.fillStyle = COLORS.textSub;
  ctx.font = '13px Arial';
  ctx.fillText('Energy', x + 42, y + 70);
  eigenvalues.forEach((energy, index) => {
    const ey = mapY(energy);
    ctx.beginPath();
    ctx.moveTo(x + 60, ey);
    ctx.lineTo(x + 256, ey);
    ctx.lineWidth = index === 0 ? 4 : index === 1 ? 3 : 2;
    ctx.strokeStyle = index === 0 ? COLORS.green : index === 1 ? COLORS.zTerm : COLORS.gray;
    ctx.stroke();
    if (index < 4 || index === eigenvalues.length - 1) {
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = 'bold 13px Consolas';
      ctx.fillText(`E${index} = ${formatHartree(energy)}`, x + 270, ey + 4);
    }
  });
  if (eigenvalues.length > 1) {
    const gap = eigenvalues[1] - eigenvalues[0];
    drawArrow(ctx, x + 438, mapY(eigenvalues[1]), x + 438, mapY(eigenvalues[0]), COLORS.zTerm);
    ctx.fillStyle = COLORS.zTerm;
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Delta = ${formatHartree(gap)}`, x + 342, (mapY(eigenvalues[0]) + mapY(eigenvalues[1])) / 2 + 5);
  }
  ctx.fillStyle = COLORS.green;
  ctx.font = 'bold 13px Arial';
  ctx.fillText('Ground state', x + 384, mapY(eigenvalues[0] ?? 0) + 22);
}

function drawNode9(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fciEnergy: number) {
  drawRoundedRect(ctx, x, y, w, h, 12, COLORS.panel, COLORS.border);
  drawNodeTitle(ctx, '[9] FCI Reference untuk VQE', x, y, 'CONCEPT');
  drawBadge(ctx, 'NOT PROVIDED', x + 374, y + 46);
  const baselineY = y + 224;
  ctx.fillStyle = '#FEF2F2';
  ctx.fillRect(x + 58, y + 102, 402, 122);
  ctx.beginPath();
  ctx.moveTo(x + 58, baselineY);
  ctx.lineTo(x + 460, baselineY);
  ctx.lineWidth = 4;
  ctx.strokeStyle = COLORS.green;
  ctx.stroke();
  ctx.fillStyle = COLORS.xTerm;
  ctx.font = 'italic 17px Arial';
  ctx.fillText('Area konseptual VQE: E_VQE >= E_FCI', x + 112, y + 134);
  drawArrow(ctx, x + 260, y + 146, x + 260, baselineY - 10, COLORS.xTerm);
  ctx.fillStyle = COLORS.green;
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`E_FCI (Baseline) = E0 = ${formatHartree(fciEnergy)}`, x + 110, baselineY + 26);
  drawRoundedRect(ctx, x + 26, y + 278, 468, 34, 4, '#FFFBEB', COLORS.amber, false);
  ctx.fillStyle = COLORS.amber;
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Accuracy = (1 - |E_VQE - E_FCI| / |E_FCI|) x 100% (E_VQE tidak dihitung pada alur FCI)', x + 260, y + 300);
  ctx.textAlign = 'left';
}

function drawLegend(ctx: CanvasRenderingContext2D) {
  const y = 1216;
  drawRoundedRect(ctx, 36, y - 28, 1420, 44, 8, 'rgba(255,255,255,0.82)', undefined, false);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 14px Arial';
  ctx.fillText('LEGENDA STATUS ANGKA:', 48, y);
  drawBadge(ctx, 'DATASET', 235, y - 17);
  ctx.fillStyle = COLORS.textSub;
  ctx.font = '13px Arial';
  ctx.fillText('dari dataset', 318, y);
  drawBadge(ctx, 'COMPUTED', 438, y - 17);
  ctx.fillText('dihitung di browser', 534, y);
  drawBadge(ctx, 'CONCEPT', 700, y - 17);
  ctx.fillText('ilustrasi teori', 792, y);
  drawBadge(ctx, 'NOT PROVIDED', 936, y - 17);
  ctx.fillText('tidak tersedia pada alur FCI', 1066, y);
}

function drawFCIFigure(ctx: CanvasRenderingContext2D, dataset: FCIFlowDataset, realMatrix: number[][], eigenvalues: number[]) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawHeader(ctx, dataset);
  drawLegend(ctx);

  const w = 520;
  const h = 320;
  const P = [
    { x: 50, y: 130 },
    { x: 640, y: 130 },
    { x: 1230, y: 130 },
    { x: 1230, y: 500 },
    { x: 640, y: 500 },
    { x: 50, y: 500 },
    { x: 50, y: 870 },
    { x: 640, y: 870 },
    { x: 1230, y: 870 },
  ];

  drawArrow(ctx, P[0].x + w, P[0].y + h / 2, P[1].x, P[1].y + h / 2);
  drawArrow(ctx, P[1].x + w, P[1].y + h / 2, P[2].x, P[2].y + h / 2);
  drawPathArrow(ctx, [
    { x: P[2].x + w / 2, y: P[2].y + h },
    { x: P[2].x + w / 2, y: P[3].y },
  ]);
  drawArrow(ctx, P[3].x, P[3].y + h / 2, P[4].x + w, P[4].y + h / 2);
  drawArrow(ctx, P[4].x, P[4].y + h / 2, P[5].x + w, P[5].y + h / 2);
  drawPathArrow(ctx, [
    { x: P[5].x + w / 2, y: P[5].y + h },
    { x: P[5].x + w / 2, y: P[6].y },
  ]);
  drawArrow(ctx, P[6].x + w, P[6].y + h / 2, P[7].x, P[7].y + h / 2);
  drawArrow(ctx, P[7].x + w, P[7].y + h / 2, P[8].x, P[8].y + h / 2);

  drawNode1(ctx, P[0].x, P[0].y, w, h, dataset);
  drawNode2(ctx, P[1].x, P[1].y, w, h, dataset);
  drawNode3(ctx, P[2].x, P[2].y, w, h, dataset);
  drawNode4(ctx, P[3].x, P[3].y, w, h, dataset);
  drawNode5(ctx, P[4].x, P[4].y, w, h, dataset);
  drawNode6(ctx, P[5].x, P[5].y, w, h, realMatrix);
  drawNode7(ctx, P[6].x, P[6].y, w, h);
  drawNode8(ctx, P[7].x, P[7].y, w, h, eigenvalues);
  drawNode9(ctx, P[8].x, P[8].y, w, h, dataset.classical.energy);
}

export function FCIBookFigure({ result }: FCIBookFigureProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dataset = useMemo(() => inferDataset(result), [result]);
  const computed = useMemo(() => {
    const complexMatrix = buildHamiltonianMatrix(dataset.hamiltonian.terms, dataset.hamiltonian.qubits);
    const realMatrix = extractRealMatrix(complexMatrix);
    const eigenvalues = jacobiEigenvalues(realMatrix);
    return { realMatrix, eigenvalues };
  }, [dataset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = '100%';
    canvas.style.maxWidth = `${CANVAS_WIDTH}px`;
    canvas.style.height = 'auto';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFCIFigure(ctx, dataset, computed.realMatrix, computed.eigenvalues);
  }, [computed, dataset]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `vqe-fci-flow-${dataset.caseId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-black leading-tight text-slate-950">Navigasi Flow Diagram FCI</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Diagram FCI klasik direkonstruksi dari Hamiltonian aktif dan siap diunduh sebagai gambar.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Download PNG
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <canvas ref={canvasRef} aria-label={`Flow diagram FCI klasik ${dataset.caseId}`} />
      </div>
    </div>
  );
}
