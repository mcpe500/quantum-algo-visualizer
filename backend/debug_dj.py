import argparse

from services.dj_service import create_dj_circuit, get_dj_cases, get_dj_case_or_none, run_quantum_dj


def first_case_id():
    cases = get_dj_cases()
    return cases[0].get('case_id') if cases else None


def main():
    parser = argparse.ArgumentParser(description='Debug a DJ circuit from dataset JSON.')
    parser.add_argument('--case-id', default=None)
    parser.add_argument('--shots', type=int, default=1024)
    args = parser.parse_args()

    case_id = args.case_id or first_case_id()
    if case_id is None:
        raise SystemExit('No DJ dataset cases available')

    case = get_dj_case_or_none(case_id)
    if case is None:
        raise SystemExit(f'Case {case_id} not found')

    n_qubits = int(case['n_qubits'])
    truth_table = case['oracle_definition']['truth_table']
    expected = case.get('expected_classification')

    print(f'Case: {case_id}')
    print(f'n_qubits: {n_qubits}')
    print(f'Truth table: {truth_table}')
    print(f'Expected: {expected}')
    print()

    qc = create_dj_circuit(n_qubits, truth_table)
    print(f'Circuit depth: {qc.depth()}')
    print(f'Gate count: {len(qc.data)}')
    print()
    print('Gates:')
    for instr, qargs, _ in qc.data:
        qubits = [getattr(qarg, 'index', getattr(qarg, '_index', 0)) for qarg in qargs]
        print(f'  {instr.name} on qubits {qubits}')
    print()

    result = run_quantum_dj(n_qubits, truth_table, shots=args.shots)
    print(f'Quantum result: {result["result"]}')
    print(f'Counts: {result["counts"]}')


if __name__ == '__main__':
    main()
