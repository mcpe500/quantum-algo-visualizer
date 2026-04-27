ini adalah referensi visualisasi:
```
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VQE Dataset Visualization - 5 Creative Versions</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #0a0a0f; color: #e2e8f0; }
        .mono { font-family: 'Space Mono', monospace; }

        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 4px; }

        /* Animations */
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
            50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
        }
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes wave {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(2); }
        }
        @keyframes slideIn {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes growUp {
            from { transform: scaleY(0); }
            to { transform: scaleY(1); }
        }

        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .animate-slide-in { animation: slideIn 0.6s ease-out forwards; }

        /* Version 1: Lego Styles */
        .lego-block {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
        }
        .lego-block:hover { transform: translateY(-5px) rotateX(10deg); }
        .lego-stud { 
            box-shadow: inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.3);
        }

        /* Version 2: Landscape Styles */
        .mountain-path {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            animation: drawPath 3s ease-out forwards;
        }
        @keyframes drawPath {
            to { stroke-dashoffset: 0; }
        }

        /* Version 3: Orchestra Styles */
        .instrument-bar {
            transform-origin: bottom;
            animation: wave 2s ease-in-out infinite;
        }
        .instrument-bar:nth-child(2n) { animation-delay: 0.1s; }
        .instrument-bar:nth-child(3n) { animation-delay: 0.2s; }
        .instrument-bar:nth-child(4n) { animation-delay: 0.3s; }

        /* Version 4: Kitchen Styles */
        .bubble {
            animation: rise 4s ease-in infinite;
            opacity: 0;
        }
        @keyframes rise {
            0% { transform: translateY(0) scale(0.5); opacity: 0; }
            20% { opacity: 0.8; }
            100% { transform: translateY(-100px) scale(1.2); opacity: 0; }
        }

        /* Version 5: City Styles */
        .building {
            transform-origin: bottom;
            animation: growUp 1s ease-out forwards;
            transform: scaleY(0);
        }
        .window-light {
            animation: flicker 3s infinite;
        }
        @keyframes flicker {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }

        /* Tab System */
        .tab-btn {
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .tab-btn::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            width: 0;
            height: 3px;
            background: #3b82f6;
            transition: all 0.3s ease;
            transform: translateX(-50%);
        }
        .tab-btn.active::after { width: 80%; }
        .tab-btn.active { color: #60a5fa; background: rgba(59, 130, 246, 0.1); }

        /* Data Badge */
        .data-badge {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 1px solid #334155;
            transition: all 0.2s;
        }
        .data-badge:hover { border-color: #60a5fa; transform: translateY(-2px); }

        /* Tooltip */
        .tooltip {
            position: relative;
        }
        .tooltip:hover .tooltip-text {
            visibility: visible;
            opacity: 1;
        }
        .tooltip-text {
            visibility: hidden;
            opacity: 0;
            position: absolute;
            bottom: 125%;
            left: 50%;
            transform: translateX(-50%);
            background: #1e293b;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            white-space: nowrap;
            font-size: 0.75rem;
            border: 1px solid #475569;
            z-index: 50;
            transition: opacity 0.2s;
        }

        /* Pauli Color Coding */
        .pauli-I { color: #94a3b8; }
        .pauli-Z { color: #ef4444; }
        .pauli-X { color: #3b82f6; }
        .pauli-Y { color: #22c55e; }

        /* Energy Level Indicator */
        .energy-level {
            background: linear-gradient(to top, #dc2626 0%, #f59e0b 50%, #22c55e 100%);
        }
    </style>
<base target="_blank">
</head>
<body class="min-h-screen">
    <!-- Header -->
    <header class="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center animate-pulse-glow">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-white">VQE Dataset Visualizer</h1>
                        <p class="text-xs text-slate-400">5 Creative Interpretations • Data-Driven • No Physics Background Required</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">Live JSON Data</span>
                    <span class="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono border border-blue-500/20">Interactive</span>
                </div>
            </div>
        </div>
    </header>

    <!-- Dataset Selector -->
    <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="flex gap-4 mb-6">
            <button onclick="switchDataset('VQE-01')" id="btn-vqe01" class="dataset-btn px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold transition-all hover:bg-blue-500 active:scale-95">
                Dataset VQE-01 (2 Qubits)
            </button>
            <button onclick="switchDataset('VQE-02')" id="btn-vqe02" class="dataset-btn px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold transition-all hover:bg-slate-700 active:scale-95 border border-slate-700">
                Dataset VQE-02 (4 Qubits)
            </button>
        </div>

        <!-- Version Tabs -->
        <div class="flex gap-2 mb-8 overflow-x-auto pb-2">
            <button onclick="switchVersion(1)" class="tab-btn active px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap" data-version="1">
                🧱 v1. Lego Molecular
            </button>
            <button onclick="switchVersion(2)" class="tab-btn px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap text-slate-400 hover:text-white" data-version="2">
                🏔️ v2. Energy Landscape
            </button>
            <button onclick="switchVersion(3)" class="tab-btn px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap text-slate-400 hover:text-white" data-version="3">
                🎵 v3. Pauli Orchestra
            </button>
            <button onclick="switchVersion(4)" class="tab-btn px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap text-slate-400 hover:text-white" data-version="4">
                👨‍🍳 v4. Quantum Kitchen
            </button>
            <button onclick="switchVersion(5)" class="tab-btn px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap text-slate-400 hover:text-white" data-version="5">
                🏙️ v5. Coefficient City
            </button>
        </div>

        <!-- Version 1: Lego Molecular Builder -->
        <div id="version-1" class="version-content">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Raw Data as Lego -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                        <span class="w-8 h-8 rounded bg-red-500 flex items-center justify-center text-sm">1</span>
                        Raw Dataset: The Molecule Box
                    </h3>
                    <div class="relative h-80 flex items-center justify-center perspective-1000" id="lego-raw">
                        <!-- Generated by JS -->
                    </div>
                    <div class="mt-4 grid grid-cols-2 gap-2 text-xs mono" id="lego-raw-data">
                        <!-- Generated by JS -->
                    </div>
                </div>

                <!-- Transformation -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                        <span class="w-8 h-8 rounded bg-amber-500 flex items-center justify-center text-sm">2</span>
                        Transformation: Breaking into Qubits
                    </h3>
                    <div class="relative h-80 flex items-center justify-center" id="lego-transform">
                        <!-- Generated by JS -->
                    </div>
                    <div class="mt-4 text-xs text-slate-400" id="lego-transform-desc">
                        <!-- Generated by JS -->
                    </div>
                </div>

                <!-- FCI -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                        <span class="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center text-sm">3</span>
                        FCI: The Perfect Blueprint
                    </h3>
                    <div class="relative h-80 flex items-center justify-center" id="lego-fci">
                        <!-- Generated by JS -->
                    </div>
                    <div class="mt-4 text-xs text-slate-400" id="lego-fci-desc">
                        Full Configuration Interaction = The "God View" of all possible electron arrangements
                    </div>
                </div>

                <!-- VQE -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                        <span class="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-sm">4</span>
                        VQE: Smart Building with Trial & Error
                    </h3>
                    <div class="relative h-80 flex items-center justify-center" id="lego-vqe">
                        <!-- Generated by JS -->
                    </div>
                    <div class="mt-4 text-xs text-slate-400" id="lego-vqe-desc">
                        <!-- Generated by JS -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Version 2: Energy Landscape -->
        <div id="version-2" class="version-content hidden">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Raw: The Map -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4">📍 Raw: Location Coordinates</h3>
                    <div class="h-64 relative bg-slate-800 rounded-xl overflow-hidden" id="landscape-raw">
                        <!-- Generated by JS -->
                    </div>
                    <div class="mt-3 text-xs text-slate-400" id="landscape-raw-desc"></div>
                </div>

                <!-- Transform: Path Planning -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4">🗺️ Transform: Trail Markers</h3>
                    <div class="h-64 relative bg-slate-800 rounded-xl overflow-hidden" id="landscape-transform">
                        <!-- Generated by JS -->
                    </div>
                    <div class="mt-3 text-xs text-slate-400">Jordan-Wigner mapping creates trail markers (qubits) from terrain features</div>
                </div>

                <!-- FCI: Full Survey -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4">🏔️ FCI: Complete Terrain Survey</h3>
                    <div class="h-64 relative" id="landscape-fci">
                        <!-- Generated by JS -->
                    </div>
                    <div class="mt-3 text-xs text-slate-400">Classical computer surveys EVERY possible path (impossible for big molecules)</div>
                </div>
            </div>

            <!-- VQE: The Hiker -->
            <div class="mt-6 bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <h3 class="text-lg font-bold mb-4">🥾 VQE: The Smart Hiker (Trial & Error)</h3>
                <div class="relative h-96 bg-slate-800 rounded-xl overflow-hidden" id="landscape-vqe">
                    <!-- Generated by JS -->
                </div>
                <div class="mt-4 flex gap-4 text-xs">
                    <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-red-500"></div> High Energy (Bad guess)</div>
                    <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-yellow-500"></div> Medium Energy</div>
                    <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-emerald-500"></div> Ground State (Best answer)</div>
                </div>
            </div>
        </div>

        <!-- Version 3: Pauli Orchestra -->
        <div id="version-3" class="version-content hidden">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Raw: Sheet Music -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4">🎼 Raw: The Composition Request</h3>
                    <div class="h-72 flex items-center justify-center" id="orchestra-raw">
                        <!-- Generated by JS -->
                    </div>
                </div>

                <!-- Transform: Instrument Assignment -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4">🎻 Transform: Assigning Instruments</h3>
                    <div class="h-72 flex items-end justify-center gap-3 pb-8" id="orchestra-transform">
                        <!-- Generated by JS -->
                    </div>
                    <div class="text-center text-xs text-slate-400 mt-2">Each qubit = one musician in the orchestra</div>
                </div>

                <!-- FCI: Perfect Recording -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4">🎙️ FCI: Studio Perfect Recording</h3>
                    <div class="h-72 flex items-center justify-center" id="orchestra-fci">
                        <!-- Generated by JS -->
                    </div>
                </div>

                <!-- VQE: Live Jam Session -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4">🎸 VQE: Live Jam & Tuning</h3>
                    <div class="h-72 flex items-end justify-center gap-2 pb-8" id="orchestra-vqe">
                        <!-- Generated by JS -->
                    </div>
                    <div class="text-center text-xs text-slate-400 mt-2">Each term plays with volume = coefficient. VQE adjusts the mixer.</div>
                </div>
            </div>
        </div>

        <!-- Version 4: Quantum Kitchen -->
        <div id="version-4" class="version-content hidden">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Raw: Ingredients -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4">🥘 Raw: Ingredients List</h3>
                    <div class="h-80 relative" id="kitchen-raw">
                        <!-- Generated by JS -->
                    </div>
                </div>

                <!-- Transform: Prep Station -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4">🔪 Transform: Prep & Chop</h3>
                    <div class="h-80 relative" id="kitchen-transform">
                        <!-- Generated by JS -->
                    </div>
                </div>

                <!-- FCI: Master Chef Tasting -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4">👨‍🍳 FCI: Master Chef (Knows All Recipes)</h3>
                    <div class="h-80 relative" id="kitchen-fci">
                        <!-- Generated by JS -->
                    </div>
                </div>

                <!-- VQE: Home Cook Iteration -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4">🍳 VQE: Home Cook (Taste & Adjust)</h3>
                    <div class="h-80 relative" id="kitchen-vqe">
                        <!-- Generated by JS -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Version 5: Coefficient City -->
        <div id="version-5" class="version-content hidden">
            <div class="grid grid-cols-1 gap-6">
                <!-- Raw: City Planning Office -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4">🏛️ Raw: City Planning Documents</h3>
                    <div class="h-48 flex items-center gap-4 overflow-x-auto" id="city-raw">
                        <!-- Generated by JS -->
                    </div>
                </div>

                <!-- Transform: Zoning Map -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4">🗺️ Transform: Zoning the Land (Qubit Allocation)</h3>
                    <div class="h-48 flex items-center justify-center" id="city-transform">
                        <!-- Generated by JS -->
                    </div>
                </div>

                <!-- FCI vs VQE: City Skyline -->
                <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 class="text-lg font-bold mb-4">🏙️ FCI vs VQE: The Skyline</h3>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <div class="text-sm font-semibold text-emerald-400 mb-2">FCI: Theoretical Perfect Skyline</div>
                            <div class="h-64 relative bg-slate-800 rounded-xl overflow-hidden flex items-end justify-center gap-1 px-4 pb-4" id="city-fci">
                                <!-- Generated by JS -->
                            </div>
                        </div>
                        <div>
                            <div class="text-sm font-semibold text-blue-400 mb-2">VQE: Approximated Skyline (Getting Close!)</div>
                            <div class="h-64 relative bg-slate-800 rounded-xl overflow-hidden flex items-end justify-center gap-1 px-4 pb-4" id="city-vqe">
                                <!-- Generated by JS -->
                            </div>
                        </div>
                    </div>
                    <div class="mt-4 text-xs text-slate-400 text-center">
                        Building height = |coefficient|. Color = Pauli type (I=Gray, Z=Red, X=Blue, Y=Green)
                    </div>
                </div>
            </div>
        </div>

        <!-- Data Inspector Panel -->
        <div class="mt-8 bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Live Data Inspector
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-slate-950 rounded-xl p-4 border border-slate-800">
                    <div class="text-xs text-slate-500 mb-2 mono">RAW JSON</div>
                    <pre class="text-xs text-emerald-400 mono overflow-auto max-h-48" id="inspector-raw"></pre>
                </div>
                <div class="bg-slate-950 rounded-xl p-4 border border-slate-800">
                    <div class="text-xs text-slate-500 mb-2 mono">CANONICAL JSON</div>
                    <pre class="text-xs text-blue-400 mono overflow-auto max-h-48" id="inspector-canonical"></pre>
                </div>
            </div>
        </div>
    </div>

    <script>
        // ============================================
        // DATASET DEFINITIONS (From user's JSON)
        // ============================================
        const datasets = {
            'VQE-01': {
                raw: {
                    case_id: "VQE-01",
                    problem_type: "molecule_ground_state",
                    molecule_spec: {
                        formula: "H2",
                        interatomic_distance_angstrom: 0.735,
                        basis: "sto-3g",
                        charge: 0,
                        multiplicity: 1
                    },
                    preprocessing: {
                        mapping: "jordan_wigner",
                        target_qubits: 2
                    },
                    experiment: {
                        ansatz_type: "ry_linear",
                        n_layers: 1,
                        shots: 1024,
                        classical_reference: "FCI"
                    }
                },
                canonical: {
                    case_id: "VQE-01",
                    description: "H2 molecule ground state energy - 2 qubit",
                    molecule: "H2",
                    qubits: 2,
                    ansatz: { type: "ry_linear", n_layers: 1 },
                    hamiltonian: {
                        terms: {
                            "II": -1.0524,
                            "ZI": 0.3979,
                            "IZ": -0.3979,
                            "ZZ": -0.0113,
                            "XX": 0.1809,
                            "YY": 0.1809
                        }
                    }
                }
            },
            'VQE-02': {
                raw: {
                    case_id: "VQE-02",
                    problem_type: "molecule_ground_state",
                    molecule_spec: {
                        formula: "H2",
                        interatomic_distance_angstrom: 0.735,
                        basis: "sto-3g",
                        charge: 0,
                        multiplicity: 1
                    },
                    preprocessing: {
                        mapping: "jordan_wigner",
                        target_qubits: 4
                    },
                    experiment: {
                        ansatz_type: "ry_linear",
                        n_layers: 2,
                        shots: 1024,
                        classical_reference: "FCI"
                    }
                },
                canonical: {
                    case_id: "VQE-02",
                    description: "H2 molecule ground state energy - 4 qubit",
                    molecule: "H2",
                    qubits: 4,
                    ansatz: { type: "ry_linear", n_layers: 2 },
                    hamiltonian: {
                        terms: {
                            "IIII": 1.3224824848,
                            "IIIZ": -0.4377785557,
                            "IIZI": -0.4377785557,
                            "IIZZ": 0.3983164337,
                            "IZII": -0.9387415432,
                            "IZIZ": 0.2752861221,
                            "IZZI": 0.3938721587,
                            "XXYY": -0.1185860366,
                            "XYYX": 0.1185860366,
                            "YXXY": 0.1185860366,
                            "YYXX": -0.1185860366,
                            "ZIII": -0.9387415432,
                            "ZIIZ": 0.3938721587,
                            "ZIZI": 0.2752861221,
                            "ZZII": 0.4138937639
                        }
                    }
                }
            }
        };

        let currentDataset = 'VQE-01';
        let currentVersion = 1;

        // ============================================
        // UTILITY FUNCTIONS
        // ============================================
        function getPauliColor(char) {
            const colors = {
                'I': 'bg-slate-600',
                'Z': 'bg-red-500',
                'X': 'bg-blue-500',
                'Y': 'bg-emerald-500'
            };
            return colors[char] || 'bg-slate-600';
        }

        function getPauliTextColor(char) {
            const colors = {
                'I': 'text-slate-400',
                'Z': 'text-red-400',
                'X': 'text-blue-400',
                'Y': 'text-emerald-400'
            };
            return colors[char] || 'text-slate-400';
        }

        function getCoefficientHeight(coef, maxCoef) {
            const absCoef = Math.abs(coef);
            return Math.max(20, (absCoef / maxCoef) * 180);
        }

        // ============================================
        // VERSION 1: LEGO MOLECULAR BUILDER
        // ============================================
        function renderLegoRaw() {
            const data = datasets[currentDataset].raw;
            const container = document.getElementById('lego-raw');
            const info = document.getElementById('lego-raw-data');

            // Create H2 molecule as Lego blocks
            const distance = data.molecule_spec.interatomic_distance_angstrom;
            const scale = distance * 100;

            container.innerHTML = `
                <div class="relative w-full h-full flex items-center justify-center">
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="w-64 h-2 bg-slate-700 rounded"></div>
                    </div>
                    <div class="flex items-center gap-4" style="transform: translateX(-${scale/2}px)">
                        <div class="lego-block animate-float" style="animation-delay: 0s">
                            <div class="w-20 h-20 bg-red-500 rounded-lg shadow-lg flex flex-col items-center justify-center relative">
                                <div class="absolute -top-3 left-2 w-4 h-3 bg-red-400 rounded lego-stud"></div>
                                <div class="absolute -top-3 right-2 w-4 h-3 bg-red-400 rounded lego-stud"></div>
                                <span class="text-2xl font-bold text-white">H</span>
                                <span class="text-xs text-red-200">Atom 1</span>
                            </div>
                        </div>
                        <div class="w-${Math.min(scale, 32)} h-1 bg-slate-500"></div>
                        <div class="lego-block animate-float" style="animation-delay: 0.5s">
                            <div class="w-20 h-20 bg-blue-500 rounded-lg shadow-lg flex flex-col items-center justify-center relative">
                                <div class="absolute -top-3 left-2 w-4 h-3 bg-blue-400 rounded lego-stud"></div>
                                <div class="absolute -top-3 right-2 w-4 h-3 bg-blue-400 rounded lego-stud"></div>
                                <span class="text-2xl font-bold text-white">H</span>
                                <span class="text-xs text-blue-200">Atom 2</span>
                            </div>
                        </div>
                    </div>
                    <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-800 px-3 py-1 rounded-full text-xs mono">
                        Distance: ${distance} Å
                    </div>
                </div>
            `;

            info.innerHTML = `
                <div class="data-badge p-2 rounded-lg">Formula: ${data.molecule_spec.formula}</div>
                <div class="data-badge p-2 rounded-lg">Basis: ${data.molecule_spec.basis}</div>
                <div class="data-badge p-2 rounded-lg">Charge: ${data.molecule_spec.charge}</div>
                <div class="data-badge p-2 rounded-lg">Multiplicity: ${data.molecule_spec.multiplicity}</div>
            `;
        }

        function renderLegoTransform() {
            const data = datasets[currentDataset];
            const container = document.getElementById('lego-transform');
            const desc = document.getElementById('lego-transform-desc');
            const qubits = data.canonical.qubits;

            let qubitBlocks = '';
            for (let i = 0; i < qubits; i++) {
                qubitBlocks += `
                    <div class="lego-block animate-float" style="animation-delay: ${i * 0.2}s">
                        <div class="w-16 h-16 bg-amber-500 rounded-lg shadow-lg flex flex-col items-center justify-center relative mx-1">
                            <div class="absolute -top-2 left-1 w-3 h-2 bg-amber-400 rounded lego-stud"></div>
                            <div class="absolute -top-2 right-1 w-3 h-2 bg-amber-400 rounded lego-stud"></div>
                            <span class="text-lg font-bold text-white">Q${i}</span>
                            <span class="text-[10px] text-amber-200">qubit</span>
                        </div>
                    </div>
                `;
            }

            container.innerHTML = `
                <div class="flex flex-col items-center gap-4">
                    <div class="flex items-center gap-2">
                        ${qubitBlocks}
                    </div>
                    <div class="text-xs text-slate-400 text-center max-w-xs">
                        The molecule is "broken" into ${qubits} quantum building blocks using <span class="text-amber-400 font-mono">${data.raw.preprocessing.mapping}</span> mapping
                    </div>
                    <div class="flex gap-2 mt-2">
                        <div class="px-2 py-1 bg-slate-800 rounded text-[10px] mono">Ansatz: ${data.canonical.ansatz.type}</div>
                        <div class="px-2 py-1 bg-slate-800 rounded text-[10px] mono">Layers: ${data.canonical.ansatz.n_layers}</div>
                    </div>
                </div>
            `;

            desc.innerHTML = `Transformation Algorithm:<br>
            <span class="text-amber-400">1.</span> Map electron orbitals → qubits<br>
            <span class="text-amber-400">2.</span> Encode Hamiltonian as Pauli strings<br>
            <span class="text-amber-400">3.</span> Prepare variational circuit with ${data.canonical.ansatz.n_layers} layer(s)`;
        }

        function renderLegoFCI() {
            const container = document.getElementById('lego-fci');
            container.innerHTML = `
                <div class="relative w-full h-full flex items-center justify-center">
                    <div class="absolute inset-0 flex items-center justify-center opacity-20">
                        <div class="w-48 h-48 border-4 border-emerald-500 rounded-full animate-spin-slow"></div>
                        <div class="absolute w-32 h-32 border-4 border-emerald-400 rounded-full animate-spin-slow" style="animation-direction: reverse; animation-duration: 12s;"></div>
                    </div>
                    <div class="relative z-10 text-center">
                        <div class="w-24 h-24 bg-emerald-500 rounded-xl shadow-lg flex items-center justify-center mx-auto mb-3 animate-pulse-glow">
                            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <div class="text-emerald-400 font-bold text-lg">FCI Reference</div>
                        <div class="text-xs text-slate-400 mt-1">Classical "Perfect Answer"</div>
                        <div class="mt-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-300 mono">
                            Exact Solution
                        </div>
                    </div>
                </div>
            `;
        }

        function renderLegoVQE() {
            const data = datasets[currentDataset];
            const container = document.getElementById('lego-vqe');
            const desc = document.getElementById('lego-vqe-desc');

            container.innerHTML = `
                <div class="relative w-full h-full flex items-center justify-center">
                    <div class="flex flex-col items-center gap-3">
                        <div class="flex items-center gap-4">
                            <div class="text-center">
                                <div class="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center mb-1">
                                    <span class="text-xs text-slate-400">Guess 1</span>
                                </div>
                                <div class="text-[10px] text-red-400">High Energy ❌</div>
                            </div>
                            <div class="text-slate-600">→</div>
                            <div class="text-center">
                                <div class="w-16 h-16 bg-slate-600 rounded-lg flex items-center justify-center mb-1">
                                    <span class="text-xs text-slate-300">Guess 2</span>
                                </div>
                                <div class="text-[10px] text-yellow-400">Better ⚠️</div>
                            </div>
                            <div class="text-slate-600">→</div>
                            <div class="text-center">
                                <div class="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mb-1 animate-pulse-glow">
                                    <span class="text-xs text-white font-bold">Guess N</span>
                                </div>
                                <div class="text-[10px] text-emerald-400">Ground State ✓</div>
                            </div>
                        </div>
                        <div class="mt-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-300 mono">
                            ${data.raw.experiment.shots} shots per iteration
                        </div>
                    </div>
                </div>
            `;

            desc.innerHTML = `VQE = "Smart Lego Builder"<br>
            Instead of trying ALL combinations (FCI), VQE makes educated guesses and learns from mistakes.<br>
            Classical optimizer adjusts quantum circuit parameters to minimize energy.`;
        }

        // ============================================
        // VERSION 2: ENERGY LANDSCAPE
        // ============================================
        function renderLandscapeRaw() {
            const data = datasets[currentDataset].raw;
            const container = document.getElementById('landscape-raw');
            const desc = document.getElementById('landscape-raw-desc');

            container.innerHTML = `
                <div class="absolute inset-0 bg-slate-700">
                    <div class="absolute top-4 left-4 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div class="absolute top-4 left-8 text-[10px] text-red-300">H Atom 1</div>
                    <div class="absolute top-4 right-4 w-3 h-3 bg-blue-500 rounded-full animate-pulse" style="animation-delay: 0.5s"></div>
                    <div class="absolute top-4 right-8 text-[10px] text-blue-300">H Atom 2</div>
                    <svg class="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <line x1="20%" y1="20%" x2="80%" y2="20%" stroke="#64748b" stroke-width="2" stroke-dasharray="5,5"/>
                    </svg>
                    <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900 px-3 py-1 rounded text-xs mono">
                        d = ${data.molecule_spec.interatomic_distance_angstrom} Å
                    </div>
                </div>
            `;

            desc.innerHTML = `We have two hydrogen atoms sitting ${data.molecule_spec.interatomic_distance_angstrom} Å apart. 
            Like two hikers at fixed coordinates. We need to find the lowest energy path between them.`;
        }

        function renderLandscapeTransform() {
            const data = datasets[currentDataset];
            const container = document.getElementById('landscape-transform');
            const qubits = data.canonical.qubits;

            let markers = '';
            for (let i = 0; i < qubits; i++) {
                markers += `
                    <div class="absolute top-1/2 transform -translate-y-1/2" style="left: ${20 + (i * (60 / (qubits - 1 || 1)))}%">
                        <div class="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-xs font-bold animate-float" style="animation-delay: ${i * 0.3}s">
                            ${i}
                        </div>
                        <div class="absolute top-10 left-1/2 transform -translate-x-1/2 text-[10px] text-amber-300 whitespace-nowrap">qubit ${i}</div>
                    </div>
                `;
            }

            container.innerHTML = `
                <div class="absolute inset-0 bg-slate-700">
                    <svg class="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <path d="M0,80 Q50,20 100,80 T200,80" fill="none" stroke="#475569" stroke-width="2"/>
                        <path d="M0,100 Q50,40 100,100 T200,100" fill="none" stroke="#475569" stroke-width="2"/>
                    </svg>
                    ${markers}
                    <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded">
                        ${data.raw.preprocessing.mapping} mapping
                    </div>
                </div>
            `;
        }

        function renderLandscapeFCI() {
            const container = document.getElementById('landscape-fci');
            container.innerHTML = `
                <div class="relative w-full h-full bg-slate-800 rounded-xl overflow-hidden">
                    <svg class="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style="stop-color:#1e293b"/>
                                <stop offset="100%" style="stop-color:#0f172a"/>
                            </linearGradient>
                        </defs>
                        <path d="M0,200 L0,150 Q50,50 100,120 T200,80 T300,140 T400,60 L400,200 Z" fill="url(#mountainGrad)" stroke="#334155" stroke-width="2"/>
                        <path d="M0,200 L0,180 Q50,120 100,160 T200,130 T300,170 T400,140 L400,200 Z" fill="#1e293b" stroke="#475569" stroke-width="1" opacity="0.7"/>
                        <circle cx="200" cy="80" r="6" fill="#ef4444" class="animate-pulse"/>
                        <text x="200" y="65" text-anchor="middle" fill="#ef4444" font-size="10" font-family="monospace">FCI Exact</text>
                    </svg>
                    <div class="absolute bottom-2 left-2 text-[10px] text-slate-500">Classical: surveys ALL terrain</div>
                </div>
            `;
        }

        function renderLandscapeVQE() {
            const container = document.getElementById('landscape-vqe');
            container.innerHTML = `
                <div class="relative w-full h-full bg-slate-800 rounded-xl overflow-hidden">
                    <svg class="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="terrain" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style="stop-color:#1e293b"/>
                                <stop offset="100%" style="stop-color:#020617"/>
                            </linearGradient>
                        </defs>
                        <path d="M0,300 L0,200 Q100,100 200,180 T400,120 T600,200 T800,140 L800,300 Z" fill="url(#terrain)" stroke="#334155" stroke-width="2"/>

                        <!-- Hiker path -->
                        <path d="M100,250 Q200,200 300,180 T500,140 T650,160" fill="none" stroke="#3b82f6" stroke-width="3" stroke-dasharray="8,4" class="mountain-path"/>

                        <!-- Hiker positions -->
                        <circle cx="100" cy="250" r="8" fill="#ef4444"/>
                        <text x="100" y="270" text-anchor="middle" fill="#ef4444" font-size="10">Start</text>

                        <circle cx="300" cy="180" r="8" fill="#f59e0b"/>
                        <text x="300" y="200" text-anchor="middle" fill="#f59e0b" font-size="10">Iteration 5</text>

                        <circle cx="500" cy="140" r="8" fill="#22c55e" class="animate-pulse"/>
                        <text x="500" y="120" text-anchor="middle" fill="#22c55e" font-size="10">Ground State!</text>

                        <!-- Energy level indicator -->
                        <rect x="750" y="100" width="20" height="150" fill="#1e293b" stroke="#475569" rx="4"/>
                        <rect x="752" y="120" width="16" height="130" fill="url(#energyGrad)" opacity="0.8"/>
                        <text x="760" y="95" text-anchor="middle" fill="#94a3b8" font-size="8">E↑</text>
                    </svg>
                    <div class="absolute top-4 left-4 bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-700">
                        <div class="text-xs text-blue-400 font-bold">VQE Hiker</div>
                        <div class="text-[10px] text-slate-400">Feels slope → adjusts direction → repeats</div>
                    </div>
                </div>
            `;
        }

        // ============================================
        // VERSION 3: PAULI ORCHESTRA
        // ============================================
        function renderOrchestraRaw() {
            const data = datasets[currentDataset].raw;
            const container = document.getElementById('orchestra-raw');

            container.innerHTML = `
                <div class="text-center">
                    <div class="w-32 h-40 bg-slate-800 rounded-lg border-2 border-slate-600 mx-auto mb-4 relative overflow-hidden">
                        <div class="absolute top-2 left-2 right-2 h-2 bg-slate-600 rounded"></div>
                        <div class="absolute top-6 left-4 text-[10px] text-slate-400 mono">ORDER #${data.case_id}</div>
                        <div class="absolute top-12 left-4 right-4 space-y-1">
                            <div class="h-1 bg-slate-600 rounded"></div>
                            <div class="h-1 bg-slate-600 rounded w-3/4"></div>
                            <div class="h-1 bg-slate-600 rounded w-1/2"></div>
                        </div>
                        <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                            <div class="text-2xl">🎼</div>
                        </div>
                    </div>
                    <div class="text-sm text-slate-300">Composition Request</div>
                    <div class="text-xs text-slate-500 mt-1">${data.molecule_spec.formula} at ${data.molecule_spec.interatomic_distance_angstrom}Å</div>
                </div>
            `;
        }

        function renderOrchestraTransform() {
            const data = datasets[currentDataset];
            const container = document.getElementById('orchestra-transform');
            const qubits = data.canonical.qubits;

            const instruments = ['🎻', '🎺', '🎹', '🥁', '🎸', '🎷'];
            let html = '';
            for (let i = 0; i < qubits; i++) {
                html += `
                    <div class="flex flex-col items-center gap-1">
                        <div class="text-2xl animate-float" style="animation-delay: ${i * 0.2}s">${instruments[i % instruments.length]}</div>
                        <div class="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-amber-400">${i}</div>
                        <div class="text-[10px] text-slate-500">Qubit</div>
                    </div>
                `;
            }
            container.innerHTML = html;
        }

        function renderOrchestraFCI() {
            const container = document.getElementById('orchestra-fci');
            container.innerHTML = `
                <div class="text-center">
                    <div class="w-40 h-40 mx-auto mb-4 relative">
                        <div class="absolute inset-0 bg-emerald-500/20 rounded-full animate-pulse"></div>
                        <div class="absolute inset-4 bg-emerald-500/30 rounded-full animate-pulse" style="animation-delay: 0.3s"></div>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <div class="text-4xl">🎙️</div>
                        </div>
                    </div>
                    <div class="text-emerald-400 font-bold">Studio Recording (FCI)</div>
                    <div class="text-xs text-slate-500 mt-1">Every instrument plays every possible note</div>
                    <div class="text-xs text-slate-500">Then pick the perfect combination</div>
                </div>
            `;
        }

        function renderOrchestraVQE() {
            const data = datasets[currentDataset];
            const container = document.getElementById('orchestra-vqe');
            const terms = data.canonical.hamiltonian.terms;
            const maxCoef = Math.max(...Object.values(terms).map(Math.abs));

            let html = '';
            let delay = 0;
            for (const [term, coef] of Object.entries(terms)) {
                const height = getCoefficientHeight(coef, maxCoef);
                const colorClass = coef < 0 ? 'bg-red-500' : 'bg-blue-500';

                html += `
                    <div class="flex flex-col items-center gap-1 tooltip">
                        <div class="text-[10px] text-slate-400 mono">${term}</div>
                        <div class="w-8 ${colorClass} rounded-t instrument-bar relative overflow-hidden" style="height: ${height}px; animation-delay: ${delay}s">
                            <div class="absolute inset-0 bg-white/20"></div>
                        </div>
                        <div class="text-[9px] text-slate-500 mono">${coef.toFixed(2)}</div>
                        <div class="tooltip-text">${term}: ${coef}</div>
                    </div>
                `;
                delay += 0.1;
            }
            container.innerHTML = html;
        }

        // ============================================
        // VERSION 4: QUANTUM KITCHEN
        // ============================================
        function renderKitchenRaw() {
            const data = datasets[currentDataset].raw;
            const container = document.getElementById('kitchen-raw');

            container.innerHTML = `
                <div class="flex items-center justify-center h-full gap-6">
                    <div class="text-center">
                        <div class="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/50 mb-2">
                            <span class="text-3xl">🥩</span>
                        </div>
                        <div class="text-xs text-red-400 font-bold">H Atom</div>
                        <div class="text-[10px] text-slate-500">Ingredient 1</div>
                    </div>
                    <div class="flex flex-col items-center">
                        <div class="text-2xl text-slate-600">+</div>
                        <div class="text-[10px] text-slate-500">${data.molecule_spec.interatomic_distance_angstrom}Å apart</div>
                    </div>
                    <div class="text-center">
                        <div class="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center border-2 border-blue-500/50 mb-2">
                            <span class="text-3xl">🥩</span>
                        </div>
                        <div class="text-xs text-blue-400 font-bold">H Atom</div>
                        <div class="text-[10px] text-slate-500">Ingredient 2</div>
                    </div>
                </div>
                <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
                    <span class="text-xs text-slate-300">Recipe: </span>
                    <span class="text-xs text-amber-400 mono">${data.molecule_spec.basis}</span>
                    <span class="text-xs text-slate-500"> basis</span>
                </div>
            `;
        }

        function renderKitchenTransform() {
            const data = datasets[currentDataset];
            const container = document.getElementById('kitchen-transform');
            const qubits = data.canonical.qubits;

            let choppingBoards = '';
            for (let i = 0; i < qubits; i++) {
                choppingBoards += `
                    <div class="relative">
                        <div class="w-16 h-20 bg-amber-800 rounded-lg border-2 border-amber-700 flex items-center justify-center">
                            <div class="text-2xl">🔪</div>
                        </div>
                        <div class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] text-amber-400 whitespace-nowrap">
                            Qubit ${i}
                        </div>
                    </div>
                `;
            }

            container.innerHTML = `
                <div class="flex items-center justify-center h-full gap-4">
                    <div class="text-center">
                        <div class="text-4xl mb-2">🥩</div>
                        <div class="text-[10px] text-slate-500">Whole Molecule</div>
                    </div>
                    <div class="text-2xl text-slate-600">→</div>
                    <div class="flex gap-3">
                        ${choppingBoards}
                    </div>
                </div>
                <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-slate-400">
                    Jordan-Wigner = "Chopping technique" that preserves flavor (physics)
                </div>
            `;
        }

        function renderKitchenFCI() {
            const container = document.getElementById('kitchen-fci');
            container.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <div class="relative inline-block mb-4">
                            <div class="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500 animate-pulse-glow">
                                <span class="text-4xl">👨‍🍳</span>
                            </div>
                            <div class="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold text-white">★</div>
                        </div>
                        <div class="text-emerald-400 font-bold">Master Chef (FCI)</div>
                        <div class="text-xs text-slate-400 mt-2 max-w-xs">
                            Tastes EVERY possible combination of ingredients<br>
                            (all electron configurations)<br>
                            Guarantees the perfect dish
                        </div>
                        <div class="mt-3 text-[10px] text-emerald-500/60 mono">
                            Problem: Takes too long for big recipes
                        </div>
                    </div>
                </div>
            `;
        }

        function renderKitchenVQE() {
            const data = datasets[currentDataset];
            const container = document.getElementById('kitchen-vqe');

            container.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <div class="relative inline-block mb-4">
                            <div class="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center border-2 border-blue-500">
                                <span class="text-4xl">🍳</span>
                            </div>
                            <div class="absolute top-0 right-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white animate-pulse">!</div>
                        </div>
                        <div class="text-blue-400 font-bold">Home Cook (VQE)</div>
                        <div class="text-xs text-slate-400 mt-2 max-w-xs">
                            1. Cooks a small batch (ansatz)<br>
                            2. Tastes it (measure energy)<br>
                            3. Adjusts seasoning (optimize params)<br>
                            4. Repeats until delicious!
                        </div>
                        <div class="mt-3 flex justify-center gap-2">
                            <div class="bubble w-2 h-2 bg-blue-400 rounded-full" style="animation-delay: 0s"></div>
                            <div class="bubble w-2 h-2 bg-blue-400 rounded-full" style="animation-delay: 0.5s"></div>
                            <div class="bubble w-2 h-2 bg-blue-400 rounded-full" style="animation-delay: 1s"></div>
                        </div>
                    </div>
                </div>
            `;
        }

        // ============================================
        // VERSION 5: COEFFICIENT CITY
        // ============================================
        function renderCityRaw() {
            const data = datasets[currentDataset].raw;
            const container = document.getElementById('city-raw');

            container.innerHTML = `
                <div class="flex items-center gap-4 px-4">
                    <div class="w-32 h-32 bg-slate-800 rounded-xl border border-slate-700 p-3 flex flex-col justify-between shrink-0">
                        <div class="text-[10px] text-slate-500 uppercase tracking-wider">Blueprint</div>
                        <div class="space-y-1">
                            <div class="h-1 bg-slate-600 rounded w-full"></div>
                            <div class="h-1 bg-slate-600 rounded w-3/4"></div>
                            <div class="h-1 bg-slate-600 rounded w-1/2"></div>
                            <div class="h-1 bg-slate-600 rounded w-5/6"></div>
                        </div>
                        <div class="text-[10px] text-amber-400 mono">${data.case_id}</div>
                    </div>
                    <div class="text-2xl text-slate-600">→</div>
                    <div class="flex gap-3">
                        <div class="w-24 h-24 bg-red-500/10 rounded-xl border border-red-500/30 flex items-center justify-center">
                            <div class="text-center">
                                <div class="text-2xl">🏗️</div>
                                <div class="text-[10px] text-red-400 mt-1">H₂ Site A</div>
                            </div>
                        </div>
                        <div class="w-24 h-24 bg-blue-500/10 rounded-xl border border-blue-500/30 flex items-center justify-center">
                            <div class="text-center">
                                <div class="text-2xl">🏗️</div>
                                <div class="text-[10px] text-blue-400 mt-1">H₂ Site B</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        function renderCityTransform() {
            const data = datasets[currentDataset];
            const container = document.getElementById('city-transform');
            const qubits = data.canonical.qubits;

            let zones = '';
            const zoneColors = ['bg-red-500/20 border-red-500/40', 'bg-blue-500/20 border-blue-500/40', 'bg-emerald-500/20 border-emerald-500/40', 'bg-amber-500/20 border-amber-500/40'];

            for (let i = 0; i < qubits; i++) {
                zones += `
                    <div class="w-20 h-20 ${zoneColors[i % zoneColors.length]} rounded-xl border-2 flex items-center justify-center relative">
                        <div class="text-xs font-bold text-white">Zone ${i}</div>
                        <div class="absolute -bottom-6 text-[10px] text-slate-400">1 qubit</div>
                    </div>
                `;
            }

            container.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="text-xs text-slate-500">Land divided into:</div>
                    <div class="flex gap-3">
                        ${zones}
                    </div>
                </div>
            `;
        }

        function renderCityFCI() {
            const data = datasets[currentDataset];
            const container = document.getElementById('city-fci');
            const terms = data.canonical.hamiltonian.terms;
            const maxCoef = Math.max(...Object.values(terms).map(Math.abs));

            let html = '';
            let delay = 0;
            for (const [term, coef] of Object.entries(terms)) {
                const height = getCoefficientHeight(coef, maxCoef);
                const isNegative = coef < 0;

                // Color based on Pauli type dominance
                let barColor = 'bg-slate-600';
                if (term.includes('X') && !term.includes('Y') && !term.includes('Z')) barColor = 'bg-blue-600';
                else if (term.includes('Y') && !term.includes('X') && !term.includes('Z')) barColor = 'bg-emerald-600';
                else if (term.includes('Z') && !term.includes('X') && !term.includes('Y')) barColor = 'bg-red-600';
                else if (term.includes('I') && term.replace(/I/g, '').length === 0) barColor = 'bg-slate-500';
                else barColor = 'bg-purple-600';

                html += `
                    <div class="flex flex-col items-center flex-1 tooltip" style="min-width: 30px;">
                        <div class="building ${barColor} rounded-t w-full relative overflow-hidden" style="height: ${height}px; animation-delay: ${delay}s">
                            ${Array(3).fill(0).map(() => `
                                <div class="absolute w-1 h-1 bg-yellow-300 rounded-full window-light" style="left: ${Math.random() * 80 + 10}%; top: ${Math.random() * 80 + 10}%"></div>
                            `).join('')}
                        </div>
                        <div class="text-[8px] text-slate-500 mono mt-1 truncate w-full text-center">${term}</div>
                        <div class="tooltip-text">${term}: ${coef}</div>
                    </div>
                `;
                delay += 0.05;
            }
            container.innerHTML = html;
        }

        function renderCityVQE() {
            const data = datasets[currentDataset];
            const container = document.getElementById('city-vqe');
            const terms = data.canonical.hamiltonian.terms;
            const maxCoef = Math.max(...Object.values(terms).map(Math.abs));

            let html = '';
            let delay = 0;
            for (const [term, coef] of Object.entries(terms)) {
                const height = getCoefficientHeight(coef, maxCoef) * 0.85; // Slightly shorter = approximation
                const isNegative = coef < 0;

                let barColor = 'bg-slate-600';
                if (term.includes('X') && !term.includes('Y') && !term.includes('Z')) barColor = 'bg-blue-600';
                else if (term.includes('Y') && !term.includes('X') && !term.includes('Z')) barColor = 'bg-emerald-600';
                else if (term.includes('Z') && !term.includes('X') && !term.includes('Y')) barColor = 'bg-red-600';
                else if (term.includes('I') && term.replace(/I/g, '').length === 0) barColor = 'bg-slate-500';
                else barColor = 'bg-purple-600';

                html += `
                    <div class="flex flex-col items-center flex-1 tooltip" style="min-width: 30px;">
                        <div class="building ${barColor} rounded-t w-full relative overflow-hidden opacity-80" style="height: ${height}px; animation-delay: ${delay}s">
                            <div class="absolute inset-0 bg-blue-500/20 animate-pulse"></div>
                            ${Array(2).fill(0).map(() => `
                                <div class="absolute w-1 h-1 bg-yellow-300 rounded-full window-light" style="left: ${Math.random() * 80 + 10}%; top: ${Math.random() * 80 + 10}%"></div>
                            `).join('')}
                        </div>
                        <div class="text-[8px] text-slate-500 mono mt-1 truncate w-full text-center">${term}</div>
                        <div class="tooltip-text">${term}: ${coef} (approx)</div>
                    </div>
                `;
                delay += 0.05;
            }
            container.innerHTML = html;
        }

        // ============================================
        // DATA INSPECTOR
        // ============================================
        function updateInspector() {
            document.getElementById('inspector-raw').textContent = JSON.stringify(datasets[currentDataset].raw, null, 2);
            document.getElementById('inspector-canonical').textContent = JSON.stringify(datasets[currentDataset].canonical, null, 2);
        }

        // ============================================
        // MAIN CONTROLLER
        // ============================================
        function switchDataset(id) {
            currentDataset = id;

            // Update buttons
            document.getElementById('btn-vqe01').className = id === 'VQE-01' 
                ? 'dataset-btn px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold transition-all hover:bg-blue-500 active:scale-95'
                : 'dataset-btn px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold transition-all hover:bg-slate-700 active:scale-95 border border-slate-700';
            document.getElementById('btn-vqe02').className = id === 'VQE-02'
                ? 'dataset-btn px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold transition-all hover:bg-blue-500 active:scale-95'
                : 'dataset-btn px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold transition-all hover:bg-slate-700 active:scale-95 border border-slate-700';

            renderAll();
        }

        function switchVersion(v) {
            currentVersion = v;

            // Update tabs
            document.querySelectorAll('.tab-btn').forEach(btn => {
                if (parseInt(btn.dataset.version) === v) {
                    btn.classList.add('active');
                    btn.classList.remove('text-slate-400');
                } else {
                    btn.classList.remove('active');
                    btn.classList.add('text-slate-400');
                }
            });

            // Show/hide content
            document.querySelectorAll('.version-content').forEach(el => el.classList.add('hidden'));
            document.getElementById(`version-${v}`).classList.remove('hidden');

            renderAll();
        }

        function renderAll() {
            updateInspector();

            // Version 1
            renderLegoRaw();
            renderLegoTransform();
            renderLegoFCI();
            renderLegoVQE();

            // Version 2
            renderLandscapeRaw();
            renderLandscapeTransform();
            renderLandscapeFCI();
            renderLandscapeVQE();

            // Version 3
            renderOrchestraRaw();
            renderOrchestraTransform();
            renderOrchestraFCI();
            renderOrchestraVQE();

            // Version 4
            renderKitchenRaw();
            renderKitchenTransform();
            renderKitchenFCI();
            renderKitchenVQE();

            // Version 5
            renderCityRaw();
            renderCityTransform();
            renderCityFCI();
            renderCityVQE();
        }

        // Initialize
        renderAll();
    </script>
</body>
</html>
```

yang saya mau gini versi 1 dan 2 itu kalau digabungkan KONSEP NYA, inget ya konsepnya digabungkan itu bisa.
yang Raw Dataset nya bisa ambil dari versi 1(soalnya v2 kayaknya ngebug itu ato ada issue tapi biarin)
terus Transform: Trail Markers dan Transformation: Breaking into Qubits perlu diperjelaskan
tapi yang bagian FCI kayaknya V2 lebih bagus, seperti ada gamabr nya. tapi ya gitu perlu dipastikan(pastikan gambar sesuai dengan semacam algoritma asli jadi bisa merepresentasikan kodingan/pseudocode,dll)
