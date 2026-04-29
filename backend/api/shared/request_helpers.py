from flask import jsonify, request


def json_body():
    return request.get_json(silent=True) or {}


def first_case_id(cases):
    if not cases:
        return None
    case_id = cases[0].get('case_id')
    return case_id if case_id else None


def resolve_case_id(requested_case_id, cases):
    if requested_case_id:
        return str(requested_case_id)
    return first_case_id(cases)


def no_cases_response(algorithm_name):
    return jsonify({'error': f'No {algorithm_name} dataset cases available'}), 404


def parse_int(value, default):
    try:
        return int(value)
    except (TypeError, ValueError):
        return int(default)


def parse_bool(value, default=False):
    if value is None:
        return bool(default)
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {'1', 'true', 'yes', 'on'}


def parse_float(value, default):
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)
