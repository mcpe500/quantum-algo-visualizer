import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from api.dj import run_classic_brute_force_stepped, load_case

# Test each case
for case_id in ['DJ-01', 'DJ-02', 'DJ-03', 'DJ-04']:
    case = load_case(case_id)
    n_qubits = case['n_qubits']
    truth_table = case['oracle_definition']['truth_table']
    
    result = run_classic_brute_force_stepped(n_qubits, truth_table, case_id)
    
    print(f'\n=== {case_id} ===')
    print(f'n_qubits: {result["n_qubits"]}')
    print(f'classification: {result["classification"]}')
    print(f'steps count: {len(result["steps"])}')
    for step in result['steps']:
        print(f'  {step}')
    
    # Save to file
    results_dir = os.path.join(os.path.dirname(__file__), 'datasets', 'dj', 'results')
    os.makedirs(results_dir, exist_ok=True)
    import json
    result_file = os.path.join(results_dir, f'{case_id}_classical.json')
    with open(result_file, 'w') as f:
        json.dump(result, f, indent=2)
    print(f'Saved to {result_file}')
