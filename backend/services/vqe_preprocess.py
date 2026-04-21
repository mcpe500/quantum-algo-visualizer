import numpy as np
from scipy.special import erf


def preprocess_raw_to_canonical(raw):
    spec = raw['molecule_spec']
    prep = raw['preprocessing']
    exp = raw['experiment']
    target_qubits = int(prep['target_qubits'])

    hamiltonian_terms = _build_h2_hamiltonian(
        distance=float(spec['interatomic_distance_angstrom']),
        target_qubits=target_qubits,
    )

    return {
        'case_id': str(raw['case_id']),
        'description': f"{spec['formula']} molecule ground state energy - {target_qubits} qubit",
        'molecule': str(spec['formula']),
        'qubits': target_qubits,
        'ansatz': {
            'type': str(exp['ansatz_type']),
            'n_layers': int(exp['n_layers']),
        },
        'hamiltonian': {
            'terms': hamiltonian_terms,
        },
    }


ANGSTROM_TO_BOHR = 1.8897259886


def _build_h2_hamiltonian(distance, target_qubits):
    R = distance * ANGSTROM_TO_BOHR
    e_nuc = 1.0 / R

    d_coeff = np.array([0.1543289673, 0.5353281423, 0.4446345422])
    alpha_raw = np.array([3.4252509100, 0.6239137298, 0.1688554040])
    zeta = 1.24
    alpha = alpha_raw * zeta ** 2

    centers = [np.array([0.0, 0.0, 0.0]), np.array([0.0, 0.0, R])]
    nbf = 2

    S = np.zeros((nbf, nbf))
    T = np.zeros((nbf, nbf))
    V = np.zeros((nbf, nbf))
    tei = np.zeros((nbf, nbf, nbf, nbf))

    for mu in range(nbf):
        for nu in range(nbf):
            for i in range(3):
                for j in range(3):
                    ai, di = alpha[i], d_coeff[i]
                    aj, dj = alpha[j], d_coeff[j]
                    Rab = np.linalg.norm(centers[mu] - centers[nu])
                    ni = (2.0 * ai / np.pi) ** 0.75
                    nj = (2.0 * aj / np.pi) ** 0.75
                    prefactor = di * dj * ni * nj

                    S[mu, nu] += prefactor * _overlap(ai, aj, Rab)
                    T[mu, nu] += prefactor * _kinetic(ai, aj, Rab)

                    for C_pos in centers:
                        V[mu, nu] -= prefactor * _nuclear_attraction(
                            ai, aj, centers[mu], centers[nu], C_pos
                        )

    for mu in range(nbf):
        for nu in range(nbf):
            for lam in range(nbf):
                for sig in range(nbf):
                    val = 0.0
                    for i in range(3):
                        for j in range(3):
                            for k in range(3):
                                for l in range(3):
                                    ai, di = alpha[i], d_coeff[i]
                                    aj, dj = alpha[j], d_coeff[j]
                                    ak, dk = alpha[k], d_coeff[k]
                                    al, dl = alpha[l], d_coeff[l]
                                    ni = (2.0 * ai / np.pi) ** 0.75
                                    nj = (2.0 * aj / np.pi) ** 0.75
                                    nk = (2.0 * ak / np.pi) ** 0.75
                                    nl = (2.0 * al / np.pi) ** 0.75
                                    val += (
                                        di * dj * dk * dl * ni * nj * nk * nl
                                        * _electron_repulsion(
                                            ai, aj, ak, al,
                                            centers[mu], centers[nu],
                                            centers[lam], centers[sig],
                                        )
                                    )
                    tei[mu, nu, lam, sig] = val

    h1 = T + V

    X = np.linalg.inv(np.linalg.cholesky(S))

    n_occ = 1
    F = h1.copy()

    for _scf_iter in range(200):
        Fp = X.T @ F @ X
        eigvals, Cp = np.linalg.eigh(Fp)
        C = X @ Cp
        idx = np.argsort(eigvals)
        C = C[:, idx]
        eigvals = eigvals[idx]

        P = np.zeros((nbf, nbf))
        for m in range(n_occ):
            for mu in range(nbf):
                for nu in range(nbf):
                    P[mu, nu] += 2.0 * C[mu, m] * C[nu, m]

        G = np.zeros((nbf, nbf))
        for mu in range(nbf):
            for nu in range(nbf):
                for lam in range(nbf):
                    for sig in range(nbf):
                        G[mu, nu] += P[lam, sig] * (
                            tei[mu, nu, lam, sig] - 0.5 * tei[mu, sig, lam, nu]
                        )

        F_new = h1 + G

        if np.max(np.abs(F_new - F)) < 1e-10:
            F = F_new
            break
        F = 0.5 * F_new + 0.5 * F

    h1_mo = np.zeros((nbf, nbf))
    for mu in range(nbf):
        for nu in range(nbf):
            for i in range(nbf):
                for j in range(nbf):
                    h1_mo[i, j] += C[mu, i] * h1[mu, nu] * C[nu, j]

    tei_mo = np.zeros((nbf, nbf, nbf, nbf))
    for p in range(nbf):
        for q in range(nbf):
            for r in range(nbf):
                for s in range(nbf):
                    val = 0.0
                    for mu in range(nbf):
                        for nu in range(nbf):
                            for lam in range(nbf):
                                for sig in range(nbf):
                                    val += (
                                        C[mu, p] * C[nu, q] * C[lam, r] * C[sig, s]
                                        * tei[mu, nu, lam, sig]
                                    )
                    tei_mo[p, q, r, s] = val

    nmo = nbf
    n_spin = nmo * 2

    h1_spin = np.zeros((n_spin, n_spin))
    for p in range(nmo):
        for q in range(nmo):
            h1_spin[2 * p, 2 * q] = h1_mo[p, q]
            h1_spin[2 * p + 1, 2 * q + 1] = h1_mo[p, q]

    h2_spin = np.zeros((n_spin, n_spin, n_spin, n_spin))
    for p in range(nmo):
        for q in range(nmo):
            for r in range(nmo):
                for s in range(nmo):
                    h2_spin[2*p, 2*q, 2*r, 2*s] = tei_mo[p, q, r, s]
                    h2_spin[2*p, 2*q, 2*r+1, 2*s+1] = tei_mo[p, q, r, s]
                    h2_spin[2*p+1, 2*q+1, 2*r, 2*s] = tei_mo[p, q, r, s]
                    h2_spin[2*p+1, 2*q+1, 2*r+1, 2*s+1] = tei_mo[p, q, r, s]

    active_orbitals = _select_active_orbitals(nmo, target_qubits)
    active_spin = []
    for orb in active_orbitals:
        active_spin.extend([2 * orb, 2 * orb + 1])

    n_active = len(active_spin)
    terms = {}

    constant = e_nuc
    for i, p in enumerate(active_spin):
        constant += h1_spin[p, p]
        for j in range(i + 1, n_active):
            q = active_spin[j]
            constant += 0.5 * h2_spin[p, p, q, q]
            constant -= 0.5 * h2_spin[p, q, q, p]

    _add_term(terms, 'I' * target_qubits, constant)

    for i, p in enumerate(active_spin):
        coeff_z = -h1_spin[p, p]
        for j, q in enumerate(active_spin):
            if j == i:
                continue
            coeff_z -= 0.5 * h2_spin[p, p, q, q]
            coeff_z += 0.5 * h2_spin[p, q, q, p]
        pauli = ['I'] * target_qubits
        pauli[i] = 'Z'
        _add_term(terms, ''.join(pauli), coeff_z)

    for i in range(n_active):
        for j in range(i + 1, n_active):
            p, q = active_spin[i], active_spin[j]
            coeff_zz = 0.25 * (h2_spin[p, p, q, q] - h2_spin[p, q, q, p])
            pauli = ['I'] * target_qubits
            pauli[i] = 'Z'
            pauli[j] = 'Z'
            _add_term(terms, ''.join(pauli), coeff_zz)

    for i in range(n_active):
        for j in range(i + 1, n_active):
            p, q = active_spin[i], active_spin[j]
            t_pq = h1_spin[p, q]
            v_diag = 0.0
            for k in active_spin:
                v_diag += h2_spin[p, k, k, q] - h2_spin[p, k, q, k]

            v_offdiag = h2_spin[p, p, q, q]
            coeff_xx = 0.5 * t_pq + 0.25 * v_diag + 0.25 * v_offdiag
            coeff_yy = 0.5 * t_pq + 0.25 * v_diag - 0.25 * v_offdiag

            if abs(coeff_xx) > 1e-12:
                pauli = ['I'] * target_qubits
                pauli[i] = 'X'
                pauli[j] = 'X'
                _add_term(terms, ''.join(pauli), coeff_xx)

            if abs(coeff_yy) > 1e-12:
                pauli = ['I'] * target_qubits
                pauli[i] = 'Y'
                pauli[j] = 'Y'
                _add_term(terms, ''.join(pauli), coeff_yy)

    cleaned = {k: round(v, 10) for k, v in sorted(terms.items()) if abs(v) > 1e-12}
    return cleaned


def _select_active_orbitals(nmo, target_qubits):
    n_active_orbitals = target_qubits // 2
    if n_active_orbitals >= nmo:
        return list(range(nmo))
    if n_active_orbitals == 1:
        return [nmo // 2 - 1]
    half = n_active_orbitals // 2
    center = nmo // 2
    return list(range(center - half, center - half + n_active_orbitals))


def _add_term(terms, pauli, coeff):
    if abs(coeff) < 1e-12:
        return
    terms[pauli] = terms.get(pauli, 0.0) + coeff


def _overlap(a, b, Rab):
    p = a + b
    return (np.pi / p) ** 1.5 * np.exp(-a * b * Rab ** 2 / p)


def _kinetic(a, b, Rab):
    p = a + b
    mu_ab = a * b / p
    return mu_ab * (3.0 - 2.0 * mu_ab * Rab ** 2) * (np.pi / p) ** 1.5 * np.exp(
        -mu_ab * Rab ** 2
    )


def _nuclear_attraction(a, b, Ra, Rb, Rc):
    p = a + b
    Rp = (a * Ra + b * Rb) / p
    Rpc = np.linalg.norm(Rp - Rc)
    Rab = np.linalg.norm(Ra - Rb)
    prefactor = -2.0 * np.pi / p * np.exp(-a * b * Rab ** 2 / p)
    if Rpc < 1e-14:
        return prefactor
    return prefactor * _boys0(p * Rpc ** 2)


def _electron_repulsion(a, b, c, d, Ra, Rb, Rc, Rd):
    p = a + b
    q = c + d
    Rp = (a * Ra + b * Rb) / p
    Rq = (c * Rc + d * Rd) / q
    Rpq = np.linalg.norm(Rp - Rq)
    Rab = np.linalg.norm(Ra - Rb)
    Rcd = np.linalg.norm(Rc - Rd)

    prefactor = 2.0 * np.pi ** 2 / (p * q) * np.sqrt(np.pi / (p + q))
    exp_ab = np.exp(-a * b * Rab ** 2 / p)
    exp_cd = np.exp(-c * d * Rcd ** 2 / q)

    if Rpq < 1e-14:
        return prefactor * exp_ab * exp_cd
    return prefactor * exp_ab * exp_cd * _boys0(p * q / (p + q) * Rpq ** 2)


def _boys0(t):
    if t < 1e-14:
        return 1.0
    return 0.5 * np.sqrt(np.pi / t) * erf(np.sqrt(t))
