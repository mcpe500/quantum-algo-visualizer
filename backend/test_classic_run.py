import os
import sys
import json

DATASETS_DIR = 'D:/Ivan/TA/document5/quantum-algo-visualizer/datasets/dj'

def load_case(case_id):
    file_path = os.path.join(DATASETS_DIR, f'{case_id}.json')
    with open(file_path) as f:
        return json.load(f)

def run_classic_brute_force_stepped(n_qubits, truth_table, case_id):
    steps = []
    max_evals = 2 ** (n_qubits - 1) + 1

    first_input = format(0, f'0{n_qubits}b')
    first_output = truth_table[first_input]
    steps.append({
        'index': 0,
        'input': first_input,
        'output': first_output,
        'status': 'checked'
    })

    result = 'CONSTANT'
    for i in range(1, max_evals):
        input_bin = format(i, f'0{n_qubits}b')
        output = truth_table[input_bin]
        if output != first_output:
            steps.append({
                'index': i,
                'input': input_bin,
                'output': output,
                'status': 'differs'
            })
            result = 'BALANCED'
            break
        else:
            steps.append({
                'index': i,
                'input': input_bin,
                'output': output,
                'status': 'checked'
            })

    return {
        'case_id': case_id,
        'n_qubits': n_qubits,
        'classification': result,
        'steps': steps
    }

# Test all cases
for case_id in ['DJ-01', 'DJ-02', 'DJ-03', 'DJ-04']:
    case = load_case(case_id)
    n_qubits = case['n_qubits']
    truth_table = case['oracle_definition']['truth_table']
    
    result = run_classic_brute_force_stepped(n_qubits, truth_table, case_id)
    
    print(f'{case_id}: {result["classification"]}, {len(result["steps"])} steps')
    for step in result['steps']:
        print(f'  index={step["index"]} input={step["input"]} output={step["output"]} status={step["status"]}')
    
    # Save to file
    results_dir = os.path.join(DATASETS_DIR, 'results')
    os.makedirs(results_dir, exist_ok=True)
    result_file = os.path.join(results_dir, f'{case_id}_classical.json')
    with open(result_file, 'w') as f:
        json.dump(result, f, indent=2)
    print(f'  -> Saved to {result_file}')
