import type { VQEBenchmarkResult } from '../../../types/vqe';

export interface FCIMoleculeSpec {
  formula: string;
  distanceAngstrom: number;
  basis: string;
  charge: number;
  multiplicity: number;
}

export interface FCIVisualizationModel {
  molecule: FCIMoleculeSpec;
  distanceBohr: number;
  nuclearRepulsionHartree: number;
  electronCount: number;
  totalSpin: number;
  alphaElectrons: number;
  betaElectrons: number;
  spatialBasisCount: number;
  spatialOrbitals: Array<{
    id: string;
    label: string;
    role: string;
    occupancy: string;
  }>;
  spinOrbitals: string[];
  determinants: Array<{
    bitstring: string;
    label: string;
    spinClass: 'singlet' | 'mixed' | 'triplet';
  }>;
  singletConfigurations: Array<{
    id: string;
    name: string;
    notation: string;
    interpretation: string;
    weightHint: 'dominant' | 'correlation' | 'symmetry';
  }>;
  flow: Array<{
    id: string;
    title: string;
    value: string;
    detail: string;
  }>;
  ignoredVqeFields: string[];
  output: {
    energyHartree: number;
    matrixSize: string;
    eigenProblem: string;
  };
}

const ANGSTROM_TO_BOHR = 1.88973;

function normalizeBasis(value: string | undefined): string {
  return (value ?? 'sto-3g').toUpperCase();
}

function inferMoleculeSpec(result: VQEBenchmarkResult): FCIMoleculeSpec {
  return {
    formula: result.molecule || 'H2',
    distanceAngstrom: 0.735,
    basis: 'STO-3G',
    charge: 0,
    multiplicity: 1,
  };
}

function chooseSpinClass(bitstring: string): 'singlet' | 'mixed' | 'triplet' {
  if (bitstring === '1100' || bitstring === '0011') return 'singlet';
  if (bitstring === '1001' || bitstring === '0110') return 'mixed';
  return 'triplet';
}

export function buildFCIVisualizationModel(result: VQEBenchmarkResult): FCIVisualizationModel {
  const molecule = inferMoleculeSpec(result);
  const distanceBohr = molecule.distanceAngstrom * ANGSTROM_TO_BOHR;
  const nuclearRepulsionHartree = 1 / distanceBohr;
  const electronCount = 2 - molecule.charge;
  const totalSpin = (molecule.multiplicity - 1) / 2;
  const alphaElectrons = electronCount / 2;
  const betaElectrons = electronCount / 2;
  const spatialBasisCount = 2;
  const spinOrbitals = ['phi1 alpha', 'phi1 beta', 'phi2 alpha', 'phi2 beta'];
  const determinantBits = ['1100', '1010', '1001', '0110', '0101', '0011'];

  return {
    molecule: {
      ...molecule,
      basis: normalizeBasis(molecule.basis),
    },
    distanceBohr,
    nuclearRepulsionHartree,
    electronCount,
    totalSpin,
    alphaElectrons,
    betaElectrons,
    spatialBasisCount,
    spatialOrbitals: [
      { id: 'chi1', label: 'chi1', role: 'H kiri 1s', occupancy: 'AO' },
      { id: 'chi2', label: 'chi2', role: 'H kanan 1s', occupancy: 'AO' },
      { id: 'phi1', label: 'phi1', role: 'bonding sigma_g', occupancy: 'lower' },
      { id: 'phi2', label: 'phi2', role: 'antibonding sigma_u*', occupancy: 'upper' },
    ],
    spinOrbitals,
    determinants: determinantBits.map((bitstring) => ({
      bitstring,
      label: bitstring
        .split('')
        .map((bit, index) => (bit === '1' ? spinOrbitals[index] : null))
        .filter(Boolean)
        .join(' + '),
      spinClass: chooseSpinClass(bitstring),
    })),
    singletConfigurations: [
      {
        id: 'phi-1',
        name: 'Phi1',
        notation: 'bonding^2',
        interpretation: 'dua elektron mengisi orbital bonding',
        weightHint: 'dominant',
      },
      {
        id: 'phi-2',
        name: 'Phi2',
        notation: 'antibonding^2',
        interpretation: 'double excitation untuk korelasi',
        weightHint: 'correlation',
      },
      {
        id: 'phi-3',
        name: 'Phi3',
        notation: 'open-shell singlet',
        interpretation: 'satu elektron di tiap MO, total spin 0',
        weightHint: 'symmetry',
      },
    ],
    flow: [
      {
        id: 'dataset',
        title: 'Dataset Molekul',
        value: `${molecule.formula}, R=${molecule.distanceAngstrom.toFixed(3)} A`,
        detail: `${normalizeBasis(molecule.basis)}, charge ${molecule.charge}, M=${molecule.multiplicity}`,
      },
      {
        id: 'geometry',
        title: 'Geometri',
        value: `R=${distanceBohr.toFixed(5)} bohr`,
        detail: `E_nuc=${nuclearRepulsionHartree.toFixed(4)} Ha`,
      },
      {
        id: 'basis',
        title: 'Basis dan Spin',
        value: `${spatialBasisCount} AO -> ${spinOrbitals.length} spin orbital`,
        detail: `${electronCount} e-, singlet, Nalpha=Nbeta=1`,
      },
      {
        id: 'integrals',
        title: 'Integral Engine',
        value: 'S, T, V, h, (munu|lamsig)',
        detail: 'AO integral membentuk Hamiltonian elektronik',
      },
      {
        id: 'mo',
        title: 'AO ke MO',
        value: 'chi -> phi',
        detail: 'bonding dan antibonding dari koefisien C',
      },
      {
        id: 'config',
        title: 'Konfigurasi',
        value: '6 determinant -> 3 CSF singlet',
        detail: 'FCI mencampur seluruh konfigurasi valid',
      },
      {
        id: 'matrix',
        title: 'Matrix FCI',
        value: 'H_ij=<Phi_i|H|Phi_j>',
        detail: 'diagonal energi, off-diagonal mixing',
      },
      {
        id: 'solve',
        title: 'Diagonalization',
        value: 'H C = E C',
        detail: 'ambil eigenvalue paling rendah',
      },
    ],
    ignoredVqeFields: ['mapping', 'target_qubits', 'ansatz_type', 'n_layers', 'shots'],
    output: {
      energyHartree: result.classical.energy,
      matrixSize: '3 x 3 singlet CSF',
      eigenProblem: 'E0 = min eig(H_FCI)',
    },
  };
}
