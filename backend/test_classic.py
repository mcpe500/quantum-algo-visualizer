from services.dj_service import get_dj_cases, get_dj_classic_trace_payload


def main():
    for case in get_dj_cases():
        case_id = case.get('case_id')
        result = get_dj_classic_trace_payload(case_id)
        if result is None:
            print(f'=== {case_id} ===')
            print('case not found')
            continue

        print(f'\n=== {case_id} ===')
        print(f'n_qubits: {result["n_qubits"]}')
        print(f'classification: {result["classification"]}')
        print(f'steps count: {len(result["steps"])}')
        for step in result['steps']:
            print(f'  {step}')


if __name__ == '__main__':
    main()
