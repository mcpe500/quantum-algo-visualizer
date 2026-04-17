from datetime import datetime
from flask import jsonify, request
from api import api_bp
from services.dj_service import (
    get_dj_cases,
    get_dj_case_or_none,
    get_dj_circuit_payload,
    get_dj_circuit_image_payload,
    get_dj_classic_trace_payload,
    get_dj_quantum_trace_grouped_payload,
    get_dj_quantum_trace_payload,
    get_dj_animation_payload,
    run_dj_benchmark_payload,
)


@api_bp.route('/dj/cases', methods=['GET'])
def dj_cases():
    return jsonify({'cases': get_dj_cases()})


@api_bp.route('/dj/dataset/<case_id>', methods=['GET'])
def dj_dataset(case_id):
    case = get_dj_case_or_none(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(case)

@api_bp.route('/dj/benchmark', methods=['POST'])
def dj_benchmark():
    data = request.get_json() or {}
    case_id = data.get('case_id', 'DJ-01')
    shots = data.get('shots', 1024)
    payload = run_dj_benchmark_payload(case_id=case_id, shots=shots)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    payload['timestamp'] = datetime.now().isoformat()
    return jsonify(payload)

@api_bp.route('/dj/circuit/<int:n_qubits>', methods=['GET'])
def dj_circuit(n_qubits):
    return jsonify(get_dj_circuit_payload(n_qubits or 3))

@api_bp.route('/dj/circuit-image/<case_id>', methods=['GET'])
def dj_circuit_image(case_id):
    import traceback
    try:
        payload = get_dj_circuit_image_payload(case_id=case_id, boxed=False)
        if payload is None:
            return jsonify({'error': f'Case {case_id} not found'}), 404
        if 'error' in payload:
            return jsonify(payload), 500
        return jsonify(payload)
    except Exception as e:
        error_msg = f'Error generating circuit image: {str(e)}'
        print(error_msg)
        traceback.print_exc()
        return jsonify({'error': error_msg, 'trace': traceback.format_exc()}), 500

@api_bp.route('/dj/circuit-image-boxed/<case_id>', methods=['GET'])
def dj_circuit_image_boxed(case_id):
    import traceback
    try:
        payload = get_dj_circuit_image_payload(case_id=case_id, boxed=True)
        if payload is None:
            return jsonify({'error': f'Case {case_id} not found'}), 404
        if 'error' in payload:
            return jsonify(payload), 500
        return jsonify(payload)
    except Exception as e:
        error_msg = f'Error generating boxed circuit image: {str(e)}'
        print(error_msg)
        traceback.print_exc()
        return jsonify({'error': error_msg, 'trace': traceback.format_exc()}), 500

@api_bp.route('/dj/classic-run', methods=['POST'])
def dj_classic_run():
    data = request.get_json() or {}
    case_id = data.get('case_id', 'DJ-01')
    payload = get_dj_classic_trace_payload(case_id)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(payload)

@api_bp.route('/dj/trace/<case_id>', methods=['GET'])
def dj_quantum_trace(case_id):
    payload = get_dj_quantum_trace_payload(case_id)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(payload)

@api_bp.route('/dj/quantum-trace-grouped', methods=['POST'])
def dj_quantum_trace_grouped():
    data = request.get_json() or {}
    case_id = data.get('case_id', 'DJ-01')
    payload = get_dj_quantum_trace_grouped_payload(case_id)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(payload)

@api_bp.route('/dj/animation/<case_id>', methods=['GET'])
def dj_animation(case_id):
    shots = request.args.get('shots', 1024, type=int)
    payload = get_dj_animation_payload(case_id, shots=shots)
    if payload is None:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(payload)
