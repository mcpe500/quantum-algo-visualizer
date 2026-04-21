import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());

function load(relPath) {
  return readFileSync(resolve(ROOT, relPath), 'utf8');
}

function assertContains(content, token, label) {
  if (!content.includes(token)) {
    throw new Error(`[FAIL] ${label}: wajib mengandung token \`${token}\``);
  }
}

function assertNotContains(content, token, label) {
  if (content.includes(token)) {
    throw new Error(`[FAIL] ${label}: tidak boleh mengandung token \`${token}\``);
  }
}

function run() {
  const djScene = load('src/components/dj/animation/scene-column.tsx');
  const qftScene = load('src/components/qft/animation/scene-primitives.tsx');
  const qaoaScene = load('src/components/qaoa/animation/scene-primitives.tsx');

  assertContains(djScene, 'LabeledBoxGate', 'DJ scene-column');
  assertContains(djScene, 'ControlDot', 'DJ scene-column');
  assertContains(djScene, 'TargetMarker', 'DJ scene-column');
  assertNotContains(djScene, '<LabeledSphereGate', 'DJ scene-column');
  assertNotContains(djScene, '<LabeledDiscGate', 'DJ scene-column');

  assertContains(qftScene, 'LabeledBoxGate', 'QFT scene-primitives');
  assertContains(qftScene, 'label="ENC"', 'QFT scene-primitives');
  assertContains(qftScene, 'label="SWAP"', 'QFT scene-primitives');
  assertContains(qftScene, 'label="M"', 'QFT scene-primitives');
  assertNotContains(qftScene, '<LabeledSphereGate', 'QFT scene-primitives');
  assertNotContains(qftScene, '<LabeledDiscGate', 'QFT scene-primitives');

  assertContains(qaoaScene, 'LabeledBoxGate', 'QAOA scene-primitives');
  assertContains(qaoaScene, 'label="ZZ"', 'QAOA scene-primitives');
  assertContains(qaoaScene, 'label="RX"', 'QAOA scene-primitives');
  assertContains(qaoaScene, 'label="M"', 'QAOA scene-primitives');
  assertNotContains(qaoaScene, '<LabeledSphereGate', 'QAOA scene-primitives');
  assertNotContains(qaoaScene, '<LabeledDiscGate', 'QAOA scene-primitives');

  console.log('[PASS] Boxed circuit engine verification passed (DJ/QFT/QAOA).');
}

run();
