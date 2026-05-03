/**
 * Playback engine for timeline-based animations.
 * Provides reducer and hook for managing playback state across components.
 */

import { useEffect, useReducer, useCallback } from 'react';

export interface PlaybackState {
  currentStep: number;
  isPlaying: boolean;
  totalSteps: number;
}

export type PlaybackAction =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'step-forward' }
  | { type: 'jump'; step: number }
  | { type: 'tick' }
  | { type: 'set-total'; totalSteps: number };

export function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case 'play':
      return state.currentStep >= state.totalSteps - 1
        ? { ...state, currentStep: 0, isPlaying: true }
        : { ...state, isPlaying: true };

    case 'pause':
      return { ...state, isPlaying: false };

    case 'reset':
      return { ...state, currentStep: 0, isPlaying: false };

    case 'step-forward':
      return {
        ...state,
        isPlaying: false,
        currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1),
      };

    case 'jump':
      return {
        ...state,
        isPlaying: false,
        currentStep: clamp(action.step, 0, state.totalSteps - 1),
      };

    case 'tick': {
      const next = Math.min(state.currentStep + 1, state.totalSteps - 1);
      return {
        ...state,
        currentStep: next,
        isPlaying: next < state.totalSteps - 1,
      };
    }

    case 'set-total':
      return {
        ...state,
        totalSteps: action.totalSteps,
        currentStep: Math.min(state.currentStep, action.totalSteps - 1),
      };

    default:
      return state;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function createInitialPlaybackState(totalSteps: number): PlaybackState {
  return {
    currentStep: 0,
    isPlaying: false,
    totalSteps,
  };
}

export function usePlaybackController(totalSteps: number, intervalMs: number = 1000) {
  const [state, dispatch] = useReducer(playbackReducer, createInitialPlaybackState(totalSteps));

  useEffect(() => {
    dispatch({ type: 'set-total', totalSteps });
  }, [totalSteps]);

  useEffect(() => {
    if (!state.isPlaying || state.totalSteps <= 0) return;
    if (state.currentStep >= state.totalSteps - 1) return;

    const timer = window.setInterval(() => {
      dispatch({ type: 'tick' });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [state.isPlaying, state.totalSteps, intervalMs]);

  const play = useCallback(() => dispatch({ type: 'play' }), []);
  const pause = useCallback(() => dispatch({ type: 'pause' }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);
  const stepForward = useCallback(() => dispatch({ type: 'step-forward' }), []);
  const jump = useCallback((step: number) => dispatch({ type: 'jump', step }), []);

  return {
    state,
    dispatch,
    play,
    pause,
    reset,
    stepForward,
    jump,
  };
}
