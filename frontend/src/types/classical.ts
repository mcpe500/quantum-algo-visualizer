export interface ClassicalStep {
  index: number;
  input: string;
  output: number;
  status: 'checked' | 'differs';
}

export interface ClassicalResult {
  case_id: string;
  n_qubits: number;
  classification: 'CONSTANT' | 'BALANCED';
  steps: ClassicalStep[];
  pseudocode: string[];
}

export interface DJDataset {
  case_id: string;
  n_qubits: number;
  expected_classification: 'CONSTANT' | 'BALANCED';
  oracle_definition: {
    truth_table: Record<string, number>;
  };
}
