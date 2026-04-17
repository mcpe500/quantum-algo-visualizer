import type { DJAnimationPayload, DJAnimationStep } from '../../../types/dj';
import { PHASE_LABEL } from './constants';
import { hasMarker } from './helpers';

export function getStepHeadline(step: DJAnimationStep) {
  if (step.phase === 'pre-init') return 'Semua qubit mulai dari |0⟩';
  if (step.phase === 'init') return 'Siapkan register qubit';
  if (step.phase === 'prep') {
    if (step.ancilla_marker === 'H') return 'Ancilla → |−⟩';
    return 'Masuk ke superposisi';
  }
  if (step.phase === 'oracle') {
    if (step.operation.toLowerCase().includes('flip') && step.focus_input_bits) {
      return `Balik kontrol untuk input ${step.focus_input_bits}`;
    }
    if (step.focus_input_bits) return `Evaluasi oracle: input ${step.focus_input_bits}`;
    return 'Terapkan oracle';
  }
  if (step.phase === 'interference') return 'Pisahkan fase → amplitudo';
  if (step.phase === 'measure') return 'Ukur semua input';
  return step.operation;
}

export function getStepExplanation(step: DJAnimationStep, totalSteps: number) {
  if (step.phase === 'pre-init') {
    return 'Setiap qubit dimulai dari keadaan |0⟩. Pada Bloch sphere, panah menunjuk lurus ke atas (kutub utara).';
  }
  if (step.phase === 'init') {
    return 'Ancilla diputar ke |1⟩, lalu semua input diberi gerbang H sehingga masuk superposisi — pertengahan antara |0⟩ dan |1⟩.';
  }
  if (step.phase === 'prep') {
    if (step.ancilla_marker === 'H') {
      return 'Gerbang H pada ancilla membentuk |−⟩. Ini membuat salinan “negatif” dari superposisi, yang memungkinkan oracle menulis jawabannya di fase.';
    }
    return 'Gerbang H membuat superposisi. Semua input diuji sekaligus dalam satu sirkuit.';
  }
  if (step.phase === 'oracle') {
    if (step.operation.toLowerCase().includes('flip') && step.focus_input_bits) {
      return `Qubit yang bernilai 0 dibalik jadi 1 agar pola input ${step.focus_input_bits} bisa diuji oleh gerbang MCX.`;
    }
    if ((step.operation.toLowerCase().includes('mcx') || step.operation.toLowerCase().includes('cnot')) && step.focus_input_bits) {
      return `Gerbang multi-controlled X mengevaluasi f(${step.focus_input_bits}). Jika hasilnya 1, fase ancilla berubah — ini cara quantum menyimpan jawaban.`;
    }
    if (step.operation.toLowerCase().includes('restore') && step.focus_input_bits) {
      return `Qubit kontrol dikembalikan ke keadaan semula agar siap untuk pola input berikutnya.`;
    }
    if (step.operation === 'Oracle I') {
      return 'Oracle constant-zero tidak melakukan apa-apa. Semua input mendapat perlakuan sama.';
    }
    if (step.operation === 'Oracle X(anc)') {
      return 'Oracle constant-one cukup membalik ancilla. Semua input menghasilkan output 1.';
    }
    return step.description;
  }
  if (step.phase === 'interference') {
    return 'Gerbang H terakhir mengubah fase yang sudah disimpan menjadi amplitudo yang bisa diukur. Jika oracle constant, semua input kembali ke |0⟩.';
  }
  if (step.phase === 'measure') {
    return 'Setiap input diukur. Hasilnya: semua 0 → CONSTANT, ada yang 1 → BALANCED.';
  }
  return step.description || `Langkah ${step.step} dari ${totalSteps}.`;
}

export function getStepAccent(step: DJAnimationStep, totalSteps: number) {
  if (step.phase === 'pre-init') return 'Keadaan awal sebelum operasi';
  if (step.phase === 'init') return 'X = flip, H = superposisi';
  if (step.phase === 'prep') return 'Phase kickback butuh |−⟩';
  if (step.focus_input_bits) return `Pola dataset: ${step.focus_input_bits}`;
  if (step.phase === 'interference') return 'Fase → amplitudo → terukur';
  if (step.phase === 'measure') return 'Baca hasil akhir';
  return `Langkah ${step.step} dari ${totalSteps}`;
}

export function getContextGlossary(step: DJAnimationStep, nQubits: number) {
  const notes = [
    'Panah pada sphere = keadaan qubit saat ini',
    'Kolom menyala = operasi sedang diterapkan',
    'Ancilla = qubit bantu untuk menyimpan jawaban oracle',
  ];

  if (hasMarker(step, 'H', nQubits)) {
    notes.push('H = Hadamard, membuat superposisi');
  }

  if (step.phase === 'prep' && step.ancilla_marker === 'H') {
    notes.push('|−⟩ = salinan negatif superposisi');
  }

  if (hasMarker(step, '●', nQubits)) {
    notes.push('● = kontrol, harus aktif (=1)');
  }

  if (hasMarker(step, '⊕', nQubits)) {
    notes.push('⊕ = target X (ancilla)');
  }

  if (step.operation.toLowerCase().includes('mcx') || (hasMarker(step, '●', nQubits) && hasMarker(step, '⊕', nQubits))) {
    notes.push('MCX = multi-controlled X');
  }

  if (step.phase === 'interference') {
    notes.push('H akhir memisahkan fase jadi amplitudo');
  }

  return Array.from(new Set(notes)).slice(0, 6);
}

export function getExportNarration(mode: 'intro' | 'play' | 'outro', data: DJAnimationPayload, step: DJAnimationStep) {
  if (mode === 'intro') {
    return {
      headline: 'Cara baca animasi Deutsch-Jozsa',
      detail: 'Setiap qubit = Bloch sphere. Panah menunjuk ke keadaan quantum aktual. 1 kolom = 1 operasi sirkuit.',
      accent: 'Kolom yang menyala berarti operasi sedang diterapkan pada qubit.',
    };
  }

  if (mode === 'outro') {
    return {
      headline: `Hasil akhir: ${data.measurement.classification}`,
      detail: data.measurement.classification === 'CONSTANT'
        ? 'Semua qubit input kembali ke 0. Oracle memperlakukan semua input secara seragam.'
        : 'Muncul bit input non-zero. Oracle memberi pola fase berbeda untuk sebagian input.',
      accent: Object.entries(data.measurement.counts)
        .slice(0, 3)
        .map(([state, count]) => `|${state}>:${count}`)
        .join('   '),
    };
  }

  return {
    headline: `${PHASE_LABEL[step.phase] || step.phase} · ${step.comment || getStepHeadline(step)}`,
    detail: getStepExplanation(step, data.timeline.length),
    accent: getStepAccent(step, data.timeline.length),
  };
}
