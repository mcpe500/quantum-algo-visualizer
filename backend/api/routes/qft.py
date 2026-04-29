from datetime import datetime
from flask import jsonify, request
from api import api_bp
from api.shared.request_helpers import json_body, no_cases_response, parse_int, resolve_case_id
from services.qft_service import (
    get_qft_cases,
    get_qft_case_or_none,
    get_qft_circuit_payload,
    get_qft_classical_payload,
    get_qft_trace_payload,
    get_qft_animation_payload,
    run_qft_payload,
)

@api_bp.route('/qft/cases', methods=['GET'])
def qft_cases():
    return jsonify({'cases': get_qft_cases()})

@api_bp.route('/qft/dataset/<case_id>', methods=['GET'])
def qft_dataset(case_id):
    case = get_qft_case_or_none(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(case)

@api_bp.route('/qft/benchmark', methods=['POST'])
def qft_run():
    data = json_body()
    case_id = resolve_case_id(data.get('case_id'), get_qft_cases())
    if case_id is None:
        return no_cases_response('QFT')
    shots = parse_int(data.get('shots'), 1024)
    payload = run_qft_payload(case_id=case_id, shots=shots)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    payload['timestamp'] = datetime.now().isoformat()
    return jsonify(payload)

@api_bp.route('/qft/circuit/<case_id>', methods=['GET'])
def qft_circuit(case_id):
    payload = get_qft_circuit_payload(case_id)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(payload)

@api_bp.route('/qft/circuit-image/<case_id>', methods=['GET'])
def qft_circuit_image(case_id):
    from services.qft_service import get_qft_circuit_image_payload
    payload = get_qft_circuit_image_payload(case_id)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    if 'error' in payload:
        return jsonify(payload), 500
    return jsonify(payload)

@api_bp.route('/qft/trace/<case_id>', methods=['GET'])
def qft_trace(case_id):
    payload = get_qft_trace_payload(case_id)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(payload)

@api_bp.route('/qft/classical-run', methods=['POST'])
def qft_classical_run():
    data = json_body()
    case_id = resolve_case_id(data.get('case_id'), get_qft_cases())
    if case_id is None:
        return no_cases_response('QFT')
    payload = get_qft_classical_payload(case_id=case_id)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(payload)


@api_bp.route('/qft/animation/<case_id>', methods=['GET'])
def qft_animation(case_id):
    shots = parse_int(request.args.get('shots'), 1024)
    payload = get_qft_animation_payload(case_id=case_id, shots=shots)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    payload['timestamp'] = datetime.now().isoformat()
    return jsonify(payload)
