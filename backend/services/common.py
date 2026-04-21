import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
DATASETS_DIR = os.path.join(PROJECT_ROOT, 'datasets')

def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)

def dataset_dir(name):
    return os.path.join(DATASETS_DIR, name)

def _case_sort_key(case):
    case_id = case.get('case_id', '')
    try:
        return (0, int(case_id.split('-', 1)[1]))
    except (IndexError, ValueError, TypeError):
        return (1, case_id)

def load_case(dataset_name, case_id):
    file_path = os.path.join(dataset_dir(dataset_name), f'{case_id}.json')
    if not os.path.exists(file_path):
        return None
    return load_json(file_path)

def load_case_canonical(dataset_name, case_id):
    """
    Read canonical JSON. If it doesn't exist, generate from raw JSON,
    save to canonical folder, then return.
    """
    canonical_dir = os.path.join(dataset_dir(dataset_name), 'canonical')
    canonical_path = os.path.join(canonical_dir, f'{case_id}.canonical.json')

    if os.path.exists(canonical_path):
        return load_json(canonical_path)

    raw = load_case(dataset_name, case_id)
    if raw is None:
        return None

    from services.vqe_preprocess import preprocess_raw_to_canonical
    canonical = preprocess_raw_to_canonical(raw)

    os.makedirs(canonical_dir, exist_ok=True)
    with open(canonical_path, 'w') as f:
        json.dump(canonical, f, indent=2)

    return canonical

def list_cases(dataset_name, prefix):
    root = dataset_dir(dataset_name)
    cases = []
    if not os.path.isdir(root):
        return cases
    for fname in sorted(os.listdir(root)):
        file_path = os.path.join(root, fname)
        if not os.path.isfile(file_path):
            continue
        case_id, ext = os.path.splitext(fname)
        if ext.lower() != '.json':
            continue
        if not case_id.startswith(prefix):
            continue
        suffix = case_id[len(prefix):]
        if not suffix.isdigit():
            continue
        case = load_case(dataset_name, case_id)
        if case:
            cases.append(case)
    cases.sort(key=_case_sort_key)
    return cases
