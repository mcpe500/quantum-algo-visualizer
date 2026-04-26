from datetime import datetime
from flask import jsonify, request
from api import api_bp
from services.vqe_service import (
    get_vqe_cases,
    get_vqe_case_or_none,
    get_vqe_dataset_payload,
    get_vqe_circuit_payload,
    get_vqe_circuit_image_payload,
    get_vqe_classical_payload,
    get_vqe_trace_payload,
    run_vqe_payload,
)
import math

@api_bp.route('/vqe/cases', methods=['GET'])
def vqe_cases():
    return jsonify({'cases': get_vqe_cases()})

@api_bp.route('/vqe/dataset/<case_id>', methods=['GET'])
def vqe_dataset(case_id):
    case = get_vqe_dataset_payload(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(case)

@api_bp.route('/vqe/benchmark', methods=['POST'])
def vqe_run():
    data = request.get_json() or {}
    case_id = data.get('case_id', 'VQE-01')
    shots = int(data.get('shots', 1024))
    payload = run_vqe_payload(case_id=case_id, shots=shots)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    payload['timestamp'] = datetime.now().isoformat()
    return jsonify(payload)

@api_bp.route('/vqe/circuit/<case_id>', methods=['GET'])
def vqe_circuit(case_id):
    theta = float(request.args.get('theta', math.pi / 4))
    payload = get_vqe_circuit_payload(case_id, theta)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(payload)

@api_bp.route('/vqe/circuit-image/<case_id>', methods=['GET'])
def vqe_circuit_image(case_id):
    from services.vqe_service import get_vqe_circuit_image_payload
    payload = get_vqe_circuit_image_payload(case_id)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    if 'error' in payload:
        return jsonify(payload), 500
    return jsonify(payload)

@api_bp.route('/vqe/trace/<case_id>', methods=['GET'])
def vqe_trace(case_id):
    theta = float(request.args.get('theta', math.pi / 4))
    payload = get_vqe_trace_payload(case_id, theta)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(payload)

@api_bp.route('/vqe/classical-run', methods=['POST'])
def vqe_classical_run():
    data = request.get_json() or {}
    case_id = data.get('case_id', 'VQE-01')
    payload = get_vqe_classical_payload(case_id)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(payload)
