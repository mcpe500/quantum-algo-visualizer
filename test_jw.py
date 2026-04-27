from qiskit_nature.second_q.operators import FermionicOp
from qiskit_nature.second_q.mappers import JordanWignerMapper
import numpy as np

h00 = -1.2593923177
h11 = -0.2886210031
h1_mo = np.array([[h00, 0.0], [0.0, h11]])

g0000 = 0.7966328675
g0011 = 0.7877443175
g0101 = 0.2371720732
g1111 = 0.8277875278
g0001 = 0.1855004456  # (00|01) from SCF output - wait, this is 0 because offdiag h1_mo=0
g0111 = 0.6391294879  # (01|11) - also should be 0?

e_nuc = 1.0 / (0.735 * 1.8897259886)


def get_eri_chem(p, q, r, s):
    if p == q and r == s:
        if p == 0 and r == 0:
            return g0000
        if p == 0 and r == 1:
            return g0011
        if p == 1 and r == 0:
            return g0011
        if p == 1 and r == 1:
            return g1111
    if p == r and q == s:
        if p == 0 and q == 0:
            return g0000
        if p == 0 and q == 1:
            return g0101
        if p == 1 and q == 0:
            return g0101
        if p == 1 and q == 1:
            return g1111
    return 0.0


eri_mo = np.zeros((2, 2, 2, 2))
eri_mo[0, 0, 0, 0] = g0000
eri_mo[0, 0, 1, 1] = g0011
eri_mo[1, 1, 0, 0] = g0011
eri_mo[0, 1, 0, 1] = g0101
eri_mo[1, 0, 1, 0] = g0101
eri_mo[0, 1, 1, 0] = g0101
eri_mo[1, 0, 0, 1] = g0101
eri_mo[1, 1, 1, 1] = g1111


def chem_not(p, r, q, s):
    return eri_mo[p, r, q, s] if 0 <= p < 2 and 0 <= r < 2 and 0 <= q < 2 and 0 <= s < 2 else 0.0


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
                for sa_spin in range(2):
                    for ra_spin in range(2):
                        for pa_spin in range(2):
                            for qa_spin in range(2):
                                i = 2 * pa + pa_spin
                                j = 2 * qa + qa_spin
                                k = 2 * ra + ra_spin
                                l = 2 * sa + sa_spin

                                direct = 0.0
                                if pa_spin == ra_spin and qa_spin == sa_spin:
                                    direct = chem_not(pa, ra, qa, sa)

                                exchange = 0.0
                                if pa_spin == sa_spin and qa_spin == ra_spin:
                                    exchange = chem_not(pa, sa, qa, ra)

                                val = 0.5 * (direct - exchange)
                                if abs(val) < 1e-14:
                                    continue

                                op += FermionicOp(
                                    {f"+_{i} +_{j} -_{l} -_{k}": val},
                                    num_spin_orbitals=4,
                                )

mapper = JordanWignerMapper()
qubit_op = mapper.map(op)

print("4-qubit Hamiltonian from qiskit_nature JW:")
for label in sorted(qubit_op.paulis.to_labels()):
    coeff = qubit_op.coeffs[qubit_op.paulis.to_labels().index(label)]
    print(f"  {label}: {coeff.real:.10f}")
print(f"Total: {len(qubit_op)} terms")
print()

expected_4q = {
    "IIII": -0.097,
    "IIIZ": 0.071,
    "IIZI": -0.071,
    "IIZZ": 0.171,
    "IZII": 0.071,
    "IZIZ": 0.171,
    "IZZI": -0.218,
    "IZZZ": 0.174,
    "ZIII": -0.071,
    "ZIIZ": 0.171,
    "ZIZI": -0.218,
    "ZIZZ": -0.099,
    "ZZII": 0.171,
    "ZZIZ": -0.099,
    "ZZZI": 0.174,
    "ZZZZ": 0.048,
}
print("Expected VQE-02 (4-qubit):")
for k, v in sorted(expected_4q.items()):
    print(f"  {k}: {v:.4f}")
