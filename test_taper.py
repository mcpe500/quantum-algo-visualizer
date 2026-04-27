import numpy as np
from qiskit_nature.second_q.operators import FermionicOp
from qiskit_nature.second_q.mappers import JordanWignerMapper
from qiskit.quantum_info import SparsePauliOp, Pauli

# ---- Compute AO integrals ----
from scipy.special import erf

ANGSTROM_TO_BOHR = 1.8897259886
_STO3G_D = np.array([0.1543289673, 0.5353281423, 0.4446345422])
_STO3G_ALPHA_RAW = np.array([3.4252509100, 0.6239137298, 0.1688554040])
_H_ZETA = 1.24


def _boys0(t):
    if t < 1e-14:
        return 1.0
    return 0.5 * np.sqrt(np.pi / t) * erf(np.sqrt(t))


def _gov(a, b, Rab):
    p = a + b
    return (np.pi / p) ** 1.5 * np.exp(-a * b * Rab ** 2 / p)


def _gkin(a, b, Rab):
    p = a + b
    mu = a * b / p
    return mu * (3.0 - 2.0 * mu * Rab ** 2) * (np.pi / p) ** 1.5 * np.exp(-mu * Rab ** 2)


def _gnuc(a, b, Ra, Rb, Rc):
    p = a + b
    Rp = (a * Ra + b * Rb) / p
    Rpc = abs(Rp - Rc)
    Rab = abs(Ra - Rb)
    pre = -2.0 * np.pi / p * np.exp(-a * b * Rab ** 2 / p)
    if Rpc < 1e-14:
        return pre
    return pre * _boys0(p * Rpc ** 2)


def _geri(a, b, c, d, Ra, Rb, Rc, Rd):
    p = a + b
    q = c + d
    Rp = (a * Ra + b * Rb) / p
    Rq = (c * Rc + d * Rd) / q
    Rpq = abs(Rp - Rq)
    Rab = abs(Ra - Rb)
    Rcd = abs(Rc - Rd)
    pre = 2.0 * np.pi ** 2 / (p * q) * np.sqrt(np.pi / (p + q))
    eab = np.exp(-a * b * Rab ** 2 / p)
    ecd = np.exp(-c * d * Rcd ** 2 / q)
    if Rpq < 1e-14:
        return pre * eab * ecd
    return pre * eab * ecd * _boys0(p * q / (p + q) * Rpq ** 2)


def compute_h2_sto3g_integrals(distance_angstrom):
    R = distance_angstrom * ANGSTROM_TO_BOHR
    d = _STO3G_D
    alpha = _STO3G_ALPHA_RAW * _H_ZETA ** 2
    nprim = 3
    norms = np.array([(2.0 * alpha[k] / np.pi) ** 0.75 for k in range(nprim)])

    S = np.zeros((2, 2))
    T = np.zeros((2, 2))
    V = np.zeros((2, 2))
    eri = np.zeros((2, 2, 2, 2))

    for mu in range(2):
        Ra = 0.0 if mu == 0 else R
        for nu in range(2):
            Rb = 0.0 if nu == 0 else R
            Rab = abs(Ra - Rb)
            for i in range(nprim):
                for j in range(nprim):
                    pre = d[i] * d[j] * norms[i] * norms[j]
                    S[mu, nu] += pre * _gov(alpha[i], alpha[j], Rab)
                    T[mu, nu] += pre * _gkin(alpha[i], alpha[j], Rab)
                    V[mu, nu] += pre * _gnuc(alpha[i], alpha[j], Ra, Rb, 0.0)
                    V[mu, nu] += pre * _gnuc(alpha[i], alpha[j], Ra, Rb, R)

    for mu in range(2):
        Ra = 0.0 if mu == 0 else R
        for nu in range(2):
            Rb = 0.0 if nu == 0 else R
            for lam in range(2):
                Rc = 0.0 if lam == 0 else R
                for sig in range(2):
                    Rd = 0.0 if sig == 0 else R
                    val = 0.0
                    for i in range(nprim):
                        for j in range(nprim):
                            for k in range(nprim):
                                for l in range(nprim):
                                    val += (
                                        d[i] * d[j] * d[k] * d[l]
                                        * norms[i] * norms[j] * norms[k] * norms[l]
                                        * _geri(alpha[i], alpha[j], alpha[k], alpha[l], Ra, Rb, Rc, Rd)
                                    )
                    eri[mu, nu, lam, sig] = val

    h_core = T + V
    e_nuc = 1.0 / R

    bond = 1.0 / np.sqrt(2.0 * (1.0 + S[0, 1]))
    anti = 1.0 / np.sqrt(2.0 * (1.0 - S[0, 1]))
    C = np.array([[bond, anti], [bond, -anti]])

    h1_mo = C.T @ h_core @ C
    eri_mo = np.zeros((2, 2, 2, 2))
    for p in range(2):
        for q in range(2):
            for r in range(2):
                for s in range(2):
                    for mu in range(2):
                        for nu in range(2):
                            for lam in range(2):
                                for sig in range(2):
                                    eri_mo[p, q, r, s] += (
                                        C[mu, p] * C[nu, q] * C[lam, r] * C[sig, s] * eri[mu, nu, lam, sig]
                                    )

    return h1_mo, eri_mo, e_nuc


# ---- Build FermionicOp and map ----
def build_hamiltonian_qiskit(h1_mo, eri_mo, e_nuc, target_qubits):
    op = FermionicOp({"": e_nuc}, num_spin_orbitals=4)

    for p in range(2):
        for q in range(2):
            if abs(h1_mo[p, q]) < 1e-14:
                continue
            for spin in range(2):
                i = 2 * p + spin
                j = 2 * q + spin
                op += FermionicOp({f"+_{i} -_{j}": h1_mo[p, q]}, num_spin_orbitals=4)

    for pa in range(2):
        for qa in range(2):
            for ra in range(2):
                for sa in range(2):
                    for pa_spin in range(2):
                        for qa_spin in range(2):
                            for ra_spin in range(2):
                                for sa_spin in range(2):
                                    i = 2 * pa + pa_spin
                                    j = 2 * qa + qa_spin
                                    k = 2 * ra + ra_spin
                                    l = 2 * sa + sa_spin

                                    direct = 0.0
                                    if pa_spin == ra_spin and qa_spin == sa_spin:
                                        direct = eri_mo[pa, ra, qa, sa]

                                    exchange = 0.0
                                    if pa_spin == sa_spin and qa_spin == ra_spin:
                                        exchange = eri_mo[pa, sa, qa, ra]

                                    val = 0.5 * (direct - exchange)
                                    if abs(val) < 1e-14:
                                        continue

                                    op += FermionicOp(
                                        {f"+_{i} +_{j} -_{l} -_{k}": val},
                                        num_spin_orbitals=4,
                                    )

    mapper = JordanWignerMapper()
    qubit_op = mapper.map(op)

    if target_qubits == 4:
        return _sparse_pauli_to_dict(qubit_op)

    return _taper_to_2(qubit_op)


def _sparse_pauli_to_dict(qubit_op):
    result = {}
    for label, coeff in zip(qubit_op.paulis.to_labels(), qubit_op.coeffs):
        result[label] = round(coeff.real, 10)
    return {k: v for k, v in sorted(result.items()) if abs(v) > 1e-10}


def _taper_to_2(qubit_op_4):
    pauli_mats = {
        "I": np.eye(2),
        "X": np.array([[0, 1], [1, 0]]),
        "Y": np.array([[0, -1j], [1j, 0]]),
        "Z": np.array([[1, 0], [0, -1]]),
    }

    def pauli_to_matrix(label):
        mat = np.array([[1.0]])
        for c in label:
            mat = np.kron(mat, pauli_mats[c])
        return mat

    H_4 = sum(
        coeff.real * pauli_to_matrix(label)
        for label, coeff in zip(qubit_op_4.paulis.to_labels(), qubit_op_4.coeffs)
    )

    T1 = np.kron(np.kron(np.eye(2), np.eye(2)), np.kron(pauli_mats["Z"], pauli_mats["Z"]))
    T1 = np.kron(pauli_mats["Z"], np.kron(pauli_mats["Z"], np.kron(pauli_mats["Z"], pauli_mats["Z"])))

    T2 = np.kron(pauli_mats["Z"], np.kron(np.eye(2), np.kron(pauli_mats["Z"], np.eye(2))))

    eT1, vT1 = np.linalg.eigh(T1)
    eT2, vT2 = np.linalg.eigh(T2)

    hf_idx = int("0011", 2)
    print(f"HF state index: {hf_idx}")
    hf_vec = np.zeros(16)
    hf_vec[hf_idx] = 1.0

    sector_T1 = hf_vec @ T1 @ hf_vec
    sector_T2 = hf_vec @ T2 @ hf_vec
    print(f"HF sector: T1={sector_T1.real:.0f}, T2={sector_T2.real:.0f}")

    mask = np.ones(16, dtype=bool)
    for i in range(16):
        bits = format(i, "04b")
        t1_val = 1
        t2_val = 1
        for b in bits:
            t1_val *= 1 if b == "0" else -1
        z0 = 1 if bits[3] == "0" else -1
        z2 = 1 if bits[1] == "0" else -1
        t2_val = z0 * z2
        if t1_val != sector_T1.real or t2_val != sector_T2.real:
            mask[i] = False

    sector_indices = np.where(mask)[0]
    print(f"Sector indices: {sector_indices} (count: {len(sector_indices)})")

    H_2 = np.zeros((4, 4))
    for i, si in enumerate(sector_indices):
        for j, sj in enumerate(sector_indices):
            H_2[i, j] = H_4[si, sj].real

    print(f"2-qubit Hamiltonian matrix:\n{H_2}")

    pauli_2 = {
        "II": np.eye(4) / 4,
        "IX": np.kron(np.eye(2), pauli_mats["X"]) / 4,
        "IY": np.kron(np.eye(2), pauli_mats["Y"]) / 4,
        "IZ": np.kron(np.eye(2), pauli_mats["Z"]) / 4,
        "XI": np.kron(pauli_mats["X"], np.eye(2)) / 4,
        "XX": np.kron(pauli_mats["X"], pauli_mats["X"]) / 4,
        "XY": np.kron(pauli_mats["X"], pauli_mats["Y"]) / 4,
        "XZ": np.kron(pauli_mats["X"], pauli_mats["Z"]) / 4,
        "YI": np.kron(pauli_mats["Y"], np.eye(2)) / 4,
        "YX": np.kron(pauli_mats["Y"], pauli_mats["X"]) / 4,
        "YY": np.kron(pauli_mats["Y"], pauli_mats["Y"]) / 4,
        "YZ": np.kron(pauli_mats["Y"], pauli_mats["Z"]) / 4,
        "ZI": np.kron(pauli_mats["Z"], np.eye(2)) / 4,
        "ZX": np.kron(pauli_mats["Z"], pauli_mats["X"]) / 4,
        "ZY": np.kron(pauli_mats["Z"], pauli_mats["Y"]) / 4,
        "ZZ": np.kron(pauli_mats["Z"], pauli_mats["Z"]) / 4,
    }

    result = {}
    for name, mat in pauli_2.items():
        coeff = np.trace(mat @ H_2).real
        if abs(coeff) > 1e-10:
            result[name] = round(coeff, 10)

    return dict(sorted(result.items()))


if __name__ == "__main__":
    h1_mo, eri_mo, e_nuc = compute_h2_sto3g_integrals(0.735)
    print(f"h1_mo: diag=[{h1_mo[0,0]:.10f}, {h1_mo[1,1]:.10f}], off={h1_mo[0,1]:.10f}")
    print(f"eri: (00|00)={eri_mo[0,0,0,0]:.10f}, (00|11)={eri_mo[0,0,1,1]:.10f}, (01|01)={eri_mo[0,1,0,1]:.10f}, (11|11)={eri_mo[1,1,1,1]:.10f}")
    print(f"e_nuc = {e_nuc:.10f}")
    print()

    print("=== 4-qubit Hamiltonian ===")
    h4 = build_hamiltonian_qiskit(h1_mo, eri_mo, e_nuc, 4)
    for k, v in h4.items():
        print(f"  {k}: {v}")
    print()

    print("=== 2-qubit Hamiltonian (Z2 tapered) ===")
    h2 = build_hamiltonian_qiskit(h1_mo, eri_mo, e_nuc, 2)

    print("Expected VQE-01:")
    print("  II: -1.0524, ZI: 0.3979, IZ: -0.3979, ZZ: -0.0113, XX: 0.1809, YY: 0.1809")
