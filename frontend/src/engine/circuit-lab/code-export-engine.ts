/**
 * Circuit Lab — Code Export Engine
 * Pure string builders for circuit code export.
 */

import type { CircuitProjectData, CircuitGateName } from './circuit-state';
import { getGateDefinition } from './circuit-state';

function formatCodeNumber(value: number): string {
  return value.toFixed(6).replace(/\.0+$/, '').replace(/(\.[0-9]*[1-9])0+$/, '$1');
}

export function buildQiskitSource(project: CircuitProjectData): string {
  const lines = [
    'from qiskit import QuantumCircuit',
    '',
    `qc = QuantumCircuit(${project.numQubits})`,
  ];

  let previousColumn = -1;
  for (const placement of project.placements) {
    if (placement.column !== previousColumn) {
      lines.push('', `# Column ${placement.column + 1}`);
      previousColumn = placement.column;
    }

    const targetRow = placement.targetRow ?? placement.row + 1;
    const angle = formatCodeNumber(placement.angle ?? getGateDefinition(placement.gate).defaultAngle ?? 0);

    switch (placement.gate) {
      case 'H': lines.push(`qc.h(${placement.row})`); break;
      case 'X': lines.push(`qc.x(${placement.row})`); break;
      case 'Y': lines.push(`qc.y(${placement.row})`); break;
      case 'Z': lines.push(`qc.z(${placement.row})`); break;
      case 'S': lines.push(`qc.s(${placement.row})`); break;
      case 'T': lines.push(`qc.t(${placement.row})`); break;
      case 'Rx': lines.push(`qc.rx(${angle}, ${placement.row})`); break;
      case 'Ry': lines.push(`qc.ry(${angle}, ${placement.row})`); break;
      case 'Rz': lines.push(`qc.rz(${angle}, ${placement.row})`); break;
      case 'CNOT': lines.push(`qc.cx(${placement.row}, ${targetRow})`); break;
      case 'SWAP': lines.push(`qc.swap(${placement.row}, ${targetRow})`); break;
      case 'CPhase': lines.push(`qc.cp(${angle}, ${placement.row}, ${targetRow})`); break;
    }
  }

  lines.push('', 'print(qc)');
  return lines.join('\n');
}

export function buildCirqSource(project: CircuitProjectData): string {
  const lines = [
    'import cirq',
    'import numpy as np',
    '',
    `q = cirq.LineQubit.range(${project.numQubits})`,
    'circuit = cirq.Circuit()',
  ];

  let previousColumn = -1;
  for (const placement of project.placements) {
    if (placement.column !== previousColumn) {
      lines.push('', `# Column ${placement.column + 1}`);
      previousColumn = placement.column;
    }

    const targetRow = placement.targetRow ?? placement.row + 1;
    const angle = formatCodeNumber(placement.angle ?? getGateDefinition(placement.gate).defaultAngle ?? 0);

    switch (placement.gate) {
      case 'H': lines.push(`circuit.append(cirq.H(q[${placement.row}]))`); break;
      case 'X': lines.push(`circuit.append(cirq.X(q[${placement.row}]))`); break;
      case 'Y': lines.push(`circuit.append(cirq.Y(q[${placement.row}]))`); break;
      case 'Z': lines.push(`circuit.append(cirq.Z(q[${placement.row}]))`); break;
      case 'S': lines.push(`circuit.append(cirq.S(q[${placement.row}]))`); break;
      case 'T': lines.push(`circuit.append(cirq.T(q[${placement.row}]))`); break;
      case 'Rx': lines.push(`circuit.append(cirq.rx(${angle}).on(q[${placement.row}]))`); break;
      case 'Ry': lines.push(`circuit.append(cirq.ry(${angle}).on(q[${placement.row}]))`); break;
      case 'Rz': lines.push(`circuit.append(cirq.rz(${angle}).on(q[${placement.row}]))`); break;
      case 'CNOT': lines.push(`circuit.append(cirq.CNOT(q[${placement.row}], q[${targetRow}]))`); break;
      case 'SWAP': lines.push(`circuit.append(cirq.SWAP(q[${placement.row}], q[${targetRow}]))`); break;
      case 'CPhase': lines.push(`circuit.append(cirq.CZPowGate(exponent=${angle} / np.pi).on(q[${placement.row}], q[${targetRow}]))`); break;
    }
  }

  lines.push('', 'print(circuit)');
  return lines.join('\n');
}

export function buildProjectQSource(project: CircuitProjectData): string {
  const lines = [
    'from projectq import MainEngine',
    'from projectq.meta import Control',
    'from projectq.ops import H, X, Y, Z, S, T, Rx, Ry, Rz, CNOT, Swap, R',
    '',
    'eng = MainEngine()',
    `qubits = eng.allocate_qureg(${project.numQubits})`,
  ];

  let previousColumn = -1;
  for (const placement of project.placements) {
    if (placement.column !== previousColumn) {
      lines.push('', `# Column ${placement.column + 1}`);
      previousColumn = placement.column;
    }

    const targetRow = placement.targetRow ?? placement.row + 1;
    const angle = formatCodeNumber(placement.angle ?? getGateDefinition(placement.gate).defaultAngle ?? 0);

    switch (placement.gate) {
      case 'H': lines.push(`H | qubits[${placement.row}]`); break;
      case 'X': lines.push(`X | qubits[${placement.row}]`); break;
      case 'Y': lines.push(`Y | qubits[${placement.row}]`); break;
      case 'Z': lines.push(`Z | qubits[${placement.row}]`); break;
      case 'S': lines.push(`S | qubits[${placement.row}]`); break;
      case 'T': lines.push(`T | qubits[${placement.row}]`); break;
      case 'Rx': lines.push(`Rx(${angle}) | qubits[${placement.row}]`); break;
      case 'Ry': lines.push(`Ry(${angle}) | qubits[${placement.row}]`); break;
      case 'Rz': lines.push(`Rz(${angle}) | qubits[${placement.row}]`); break;
      case 'CNOT': lines.push(`CNOT | (qubits[${placement.row}], qubits[${targetRow}])`); break;
      case 'SWAP': lines.push(`Swap | (qubits[${placement.row}], qubits[${targetRow}])`); break;
      case 'CPhase':
        lines.push(`with Control(eng, qubits[${placement.row}]):`);
        lines.push(`    R(${angle}) | qubits[${targetRow}]`);
        break;
    }
  }

  lines.push('', 'eng.flush()');
  return lines.join('\n');
}

export function buildCircuitCode(
  project: CircuitProjectData,
  format: 'json' | 'qiskit' | 'cirq' | 'projectq'
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(project, null, 2);
    case 'qiskit':
      return buildQiskitSource(project);
    case 'cirq':
      return buildCirqSource(project);
    case 'projectq':
      return buildProjectQSource(project);
    default:
      return '';
  }
}
