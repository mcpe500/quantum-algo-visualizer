import os
import json
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from api.dj import create_dj_circuit, run_quantum_dj

case_id = 'DJ-02'
n_qubits = 3
# datasets are 2 levels up from backend/debug_dj.py
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
file_path = os.path.join(BASE_DIR, 'datasets', 'dj', f'{case_id}.json')
print(f"File path: {file_path}")
with open(file_path) as f:
    case = json.load(f)

truth_table = case['oracle_definition']['truth_table']
print(f'Case: {case_id}')
print(f'n_qubits: {n_qubits}')
print(f'Truth table: {truth_table}')
print(f'Expected: BALANCED')
print()

qc = create_dj_circuit(n_qubits, truth_table)
print(f'Circuit depth: {qc.depth()}')
print(f'Gate count: {len(qc.data)}')
print()
print('Gates:')
for instr, qargs, cargs in qc.data:
    print(f'  {instr.name} on qubits {[qargs[i].index for i in range(len(qargs))]}')
print()

result = run_quantum_dj(n_qubits, truth_table, shots=1024)
print(f'Quantum result: {result["result"]}')
print(f'Counts: {result["counts"]}')
