import argparse
import json
import os

from services.dj_service import get_dj_cases, get_dj_classic_trace_payload
from services.common import dataset_dir


def main():
    parser = argparse.ArgumentParser(description='Run DJ classical traces for all dataset JSON cases.')
    parser.add_argument('--write-results', action='store_true', help='Write result JSON files under datasets/dj/results.')
    args = parser.parse_args()

    results_dir = os.path.join(dataset_dir('dj'), 'results')
    for case in get_dj_cases():
        case_id = case.get('case_id')
        result = get_dj_classic_trace_payload(case_id)
        if result is None:
            print(f'{case_id}: case not found')
            continue

        print(f'{case_id}: {result["classification"]}, {len(result["steps"])} steps')
        for step in result['steps']:
            print(f'  index={step["index"]} input={step["input"]} output={step["output"]} status={step["status"]}')

        if args.write_results:
            os.makedirs(results_dir, exist_ok=True)
            result_file = os.path.join(results_dir, f'{case_id}_classical.json')
            with open(result_file, 'w') as handle:
                json.dump(result, handle, indent=2)
            print(f'  -> Saved to {result_file}')


if __name__ == '__main__':
    main()
