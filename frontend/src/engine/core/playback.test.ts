import { describe, it, expect } from 'vitest';
import { playbackReducer, createInitialPlaybackState } from './playback';

describe('playbackReducer', () => {
  it('should start playing from beginning', () => {
    const state = createInitialPlaybackState(10);
    const next = playbackReducer(state, { type: 'play' });
    expect(next.isPlaying).toBe(true);
    expect(next.currentStep).toBe(0);
  });

  it('should reset to step 0 and stop', () => {
    const state = { currentStep: 5, isPlaying: true, totalSteps: 10 };
    const next = playbackReducer(state, { type: 'reset' });
    expect(next.isPlaying).toBe(false);
    expect(next.currentStep).toBe(0);
  });

  it('should step forward and pause', () => {
    const state = { currentStep: 3, isPlaying: true, totalSteps: 10 };
    const next = playbackReducer(state, { type: 'step-forward' });
    expect(next.isPlaying).toBe(false);
    expect(next.currentStep).toBe(4);
  });

  it('should clamp step-forward at last step', () => {
    const state = { currentStep: 9, isPlaying: true, totalSteps: 10 };
    const next = playbackReducer(state, { type: 'step-forward' });
    expect(next.currentStep).toBe(9);
  });

  it('should jump to a specific step', () => {
    const state = createInitialPlaybackState(10);
    const next = playbackReducer(state, { type: 'jump', step: 7 });
    expect(next.currentStep).toBe(7);
    expect(next.isPlaying).toBe(false);
  });

  it('should clamp jump within bounds', () => {
    const state = createInitialPlaybackState(10);
    expect(playbackReducer(state, { type: 'jump', step: -1 }).currentStep).toBe(0);
    expect(playbackReducer(state, { type: 'jump', step: 99 }).currentStep).toBe(9);
  });

  it('should tick forward and stop at end', () => {
    let state = createInitialPlaybackState(3);
    state = playbackReducer(state, { type: 'tick' });
    expect(state.currentStep).toBe(1);
    expect(state.isPlaying).toBe(true);

    state = playbackReducer(state, { type: 'tick' });
    expect(state.currentStep).toBe(2);
    expect(state.isPlaying).toBe(false); // last step reached
  });

  it('should update total steps and clamp current step', () => {
    const state = { currentStep: 8, isPlaying: false, totalSteps: 10 };
    const next = playbackReducer(state, { type: 'set-total', totalSteps: 5 });
    expect(next.totalSteps).toBe(5);
    expect(next.currentStep).toBe(4);
  });
});
