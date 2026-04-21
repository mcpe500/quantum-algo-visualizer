import { StoryScene as DJStoryScene } from '../dj/animation/scene-primitives';
import { QFTStoryScene } from '../qft/animation/scene-primitives';
import { QAOAStoryScene } from '../qaoa/animation/scene-primitives';
import type { DJAnimationPayload } from '../../types/dj';
import type { QFTAnimationPayload } from '../../types/qft';
import type { QAOAAnimationPayload } from '../../types/qaoa';

export interface QuantumSceneOrchestratorProps {
  algorithm: 'dj' | 'qft' | 'qaoa';
  data: DJAnimationPayload | QFTAnimationPayload | QAOAAnimationPayload;
  currentStep: number;
  cameraMode: 'fixed' | 'orbit';
}

export function QuantumSceneOrchestrator({
  algorithm,
  data,
  currentStep,
  cameraMode,
}: QuantumSceneOrchestratorProps) {
  if (algorithm === 'dj') {
    return (
      <DJStoryScene
        data={data as DJAnimationPayload}
        currentStep={currentStep}
        cameraMode={cameraMode}
      />
    );
  }

  if (algorithm === 'qft') {
    return (
      <QFTStoryScene
        data={data as QFTAnimationPayload}
        currentStep={currentStep}
        cameraMode={cameraMode}
      />
    );
  }

  if (algorithm === 'qaoa') {
    const qaoaData = data as QAOAAnimationPayload;
    const activeStep = qaoaData.timeline[currentStep];
    return (
      <QAOAStoryScene
        data={qaoaData}
        activeStep={activeStep}
        cameraMode={cameraMode}
      />
    );
  }

  return null;
}
