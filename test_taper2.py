from qiskit_nature.second_q.operators import FermionicOp
from qiskit_nature.second_q.mappers import JordanWignerMapper, TaperedQubitMapper
from qiskit.quantum_info import SparsePauliOp
import numpy as np
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


def compute_integrals(distance_angstrom):
    R = distance_angstrom * ANGSTROM_TO_BOHR
    d = _STO3G_D
    alpha = _STO3G_ALPHA_RAW * _H_ZETA ** 2
    nprim = 3
    norms = np.array([(2.0 * alpha[k] / np.pi) ** 0.75 for k in range(nprim)])

    S = np.zeros((2, 2))
    T_mat = np.zeros((2, 2))
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
                    T_mat[mu, nu] += pre * _gkin(alpha[i], alpha[j], Rab)
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

    h_core = T_mat + V
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


def build_fermionic_op(h1_mo, eri_mo, e_nuc):
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
    return op


if __name__ == "__main__":
    h1_mo, eri_mo, e_nuc = compute_integrals(0.735)
    print(f"h1_mo: [{h1_mo[0,0]:.10f}, {h1_mo[1,1]:.10f}]")
    print(f"eri: (00|00)={eri_mo[0,0,0,0]:.10f}, (00|11)={eri_mo[0,0,1,1]:.10f}, (01|01)={eri_mo[0,1,0,1]:.10f}, (11|11)={eri_mo[1,1,1,1]:.10f}")
    print(f"e_nuc = {e_nuc:.10f}")
    print()

    op = build_fermionic_op(h1_mo, eri_mo, e_nuc)

    mapper = JordanWignerMapper()
    qubit_op_4 = mapper.map(op)

    print("=== 4-qubit ===")
    for label, coeff in zip(qubit_op_4.paulis.to_labels(), qubit_op_4.coeffs):
        print(f"  {label}: {coeff.real:.10f}")

    tapered_mapper = TaperedQubitMapper(mapper)
    z2syms = tapered_mapper.z2symmetries
    print(f"\nZ2 symmetries found: {z2syms}")

    sector = [-1, -1]

    qubit_op_2 = tapered_mapper.taper_clifford(op, sector=sector)
    print(f"\n=== 2-qubit (sector {sector}) ===")
    if qubit_op_2 is not None:
        for label, coeff in zip(qubit_op_2.paulis.to_labels(), qubit_op_2.coeffs):
            print(f"  {label}: {coeff.real:.10f}")
    else:
        print("  None returned, trying taper instead")
        tapered_mapper = TaperedQubitMapper(JordanWignerMapper(), z2symmetries=z2syms)
        for s1 in [1, -1]:
            for s2 in [1, -1]:
                try:
                    result = tapered_mapper.taper_clifford(op, sector=[s1, s2])
                    if result is not None:
                        print(f"\n  Sector [{s1},{s2}]:")
                        for label, coeff in zip(result.paulis.to_labels(), result.coeffs):
                            print(f"    {label}: {coeff.real:.10f}")
                except Exception as e:
                    print(f"  Sector [{s1},{s2}] failed: {e}")
