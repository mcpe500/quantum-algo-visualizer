from datetime import datetime
from flask import jsonify, request
from api import api_bp
from services.qaoa_service import (
    get_qaoa_cases,
    get_qaoa_case_or_none,
    get_qaoa_animation_payload,
    get_qaoa_circuit_payload,
    get_qaoa_classical_payload,
    get_qaoa_trace_payload,
    run_qaoa_payload,
)

@api_bp.route('/qaoa/cases', methods=['GET'])
def qaoa_cases():
    return jsonify({'cases': get_qaoa_cases()})

@api_bp.route('/qaoa/dataset/<case_id>', methods=['GET'])
def qaoa_dataset(case_id):
    case = get_qaoa_case_or_none(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(case)

@api_bp.route('/qaoa/benchmark', methods=['POST'])
def qaoa_run():
    data = request.get_json() or {}
    case_id = data.get('case_id', 'QAOA-01')
    shots = int(data.get('shots', 1024))
    payload = run_qaoa_payload(case_id=case_id, shots=shots)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    payload['timestamp'] = datetime.now().isoformat()
    return jsonify(payload)

@api_bp.route('/qaoa/animation/<case_id>', methods=['GET'])
def qaoa_animation(case_id):
    shots = int(request.args.get('shots', 1024))
    payload = get_qaoa_animation_payload(case_id=case_id, shots=shots)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    payload['timestamp'] = datetime.now().isoformat()
    return jsonify(payload)

@api_bp.route('/qaoa/circuit/<case_id>', methods=['GET'])
def qaoa_circuit(case_id):
    gamma = float(request.args.get('gamma', 0.5))
    beta = float(request.args.get('beta', 0.3))
    payload = get_qaoa_circuit_payload(case_id, gamma, beta)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(payload)

@api_bp.route('/qaoa/circuit-image/<case_id>', methods=['GET'])
def qaoa_circuit_image(case_id):
    from services.qaoa_service import get_qaoa_circuit_image_payload
    gamma = float(request.args.get('gamma', 0.5))
    beta = float(request.args.get('beta', 0.3))
    payload = get_qaoa_circuit_image_payload(case_id, gamma, beta)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    if 'error' in payload:
        return jsonify(payload), 500
    return jsonify(payload)

@api_bp.route('/qaoa/trace/<case_id>', methods=['GET'])
def qaoa_trace(case_id):
    gamma = float(request.args.get('gamma', 0.5))
    beta = float(request.args.get('beta', 0.3))
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
