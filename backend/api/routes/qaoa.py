from datetime import datetime
from flask import jsonify, request
from api import api_bp
from services.qaoa_service import (
    get_qaoa_cases,
    get_qaoa_case_or_none,
    get_qaoa_aggregate_payload,
    get_qaoa_animation_payload,
    get_qaoa_circuit_payload,
    get_qaoa_classical_payload,
    get_qaoa_trace_payload,
    run_qaoa_payload,
    enrich_case_graph,
)


def _parse_int(value, default):
    try:
        return int(value)
    except (TypeError, ValueError):
        return int(default)


def _parse_bool(value, default=False):
    if value is None:
        return bool(default)
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {'1', 'true', 'yes', 'on'}


def _parse_layer_values(raw_value, default):
    if raw_value is None:
        return default
    text = str(raw_value).strip()
    if not text:
        return default
    if ',' not in text:
        try:
            return float(text)
        except ValueError:
            return default

    parsed = []
    for part in text.split(','):
        part = part.strip()
        if not part:
            continue
        try:
            parsed.append(float(part))
        except ValueError:
            continue
    return parsed or default

@api_bp.route('/qaoa/cases', methods=['GET'])
def qaoa_cases():
    cases = get_qaoa_cases()
    return jsonify({'cases': [enrich_case_graph(c) for c in cases]})

@api_bp.route('/qaoa/dataset/<case_id>', methods=['GET'])
def qaoa_dataset(case_id):
    case = get_qaoa_case_or_none(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(enrich_case_graph(case))

@api_bp.route('/qaoa/benchmark', methods=['POST'])
def qaoa_run():
    data = request.get_json() or {}
    case_id = data.get('case_id', 'QAOA-01')
    shots = int(data.get('shots', 1024))
    payload = run_qaoa_payload(
        case_id=case_id,
        shots=shots,
        optimizer_seed=_parse_int(data.get('optimizer_seed'), 42),
        simulator_seed=_parse_int(data.get('simulator_seed'), 42),
        max_iter=_parse_int(data.get('maxiter'), 120),
        include_aggregate=_parse_bool(data.get('include_aggregate'), True),
        aggregate_seed_start=_parse_int(data.get('aggregate_seed_start'), 0),
        aggregate_seed_count=_parse_int(data.get('aggregate_seed_count'), 8),
        aggregate_max_iter=_parse_int(data.get('aggregate_maxiter'), 120),
    )
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    payload['timestamp'] = datetime.now().isoformat()
    return jsonify(payload)


@api_bp.route('/qaoa/aggregate/<case_id>', methods=['GET'])
def qaoa_aggregate(case_id):
    payload = get_qaoa_aggregate_payload(
        case_id,
        seed_start=_parse_int(request.args.get('seed_start'), 0),
        seed_count=_parse_int(request.args.get('seed_count'), 8),
        max_iter=_parse_int(request.args.get('maxiter'), 120),
    )
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    payload['timestamp'] = datetime.now().isoformat()
    return jsonify(payload)

@api_bp.route('/qaoa/animation/<case_id>', methods=['GET'])
def qaoa_animation(case_id):
    shots = int(request.args.get('shots', 1024))
    payload = get_qaoa_animation_payload(
        case_id=case_id,
        shots=shots,
        optimizer_seed=_parse_int(request.args.get('optimizer_seed'), 42),
        simulator_seed=_parse_int(request.args.get('simulator_seed'), 42),
        max_iter=_parse_int(request.args.get('maxiter'), 120),
    )
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    payload['timestamp'] = datetime.now().isoformat()
    return jsonify(payload)

@api_bp.route('/qaoa/circuit/<case_id>', methods=['GET'])
def qaoa_circuit(case_id):
    gamma = _parse_layer_values(request.args.get('gamma'), 0.5)
    beta = _parse_layer_values(request.args.get('beta'), 0.3)
    payload = get_qaoa_circuit_payload(case_id, gamma, beta)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(payload)

@api_bp.route('/qaoa/circuit-image/<case_id>', methods=['GET'])
def qaoa_circuit_image(case_id):
    from services.qaoa_service import get_qaoa_circuit_image_payload
    gamma = _parse_layer_values(request.args.get('gamma'), 0.5)
    beta = _parse_layer_values(request.args.get('beta'), 0.3)
    payload = get_qaoa_circuit_image_payload(case_id, gamma, beta)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    if 'error' in payload:
        return jsonify(payload), 500
    return jsonify(payload)

@api_bp.route('/qaoa/trace/<case_id>', methods=['GET'])
def qaoa_trace(case_id):
    gamma = _parse_layer_values(request.args.get('gamma'), 0.5)
    beta = _parse_layer_values(request.args.get('beta'), 0.3)
    payload = get_qaoa_trace_payload(case_id, gamma, beta)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(payload)

@api_bp.route('/qaoa/classical-run', methods=['POST'])
def qaoa_classical_run():
    data = request.get_json() or {}
    case_id = data.get('case_id', 'QAOA-01')
    payload = get_qaoa_classical_payload(case_id)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(payload)
