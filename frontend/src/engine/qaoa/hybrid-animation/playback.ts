/**
 * QAOA Hybrid Animation Playback Engine.
 * Wraps shared playback controller with speed control.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePlaybackController, type PlaybackState } from '../../core/playback';

export interface QaoaHybridPlaybackState extends PlaybackState {
  speed: number;
}

export function useQaoaHybridPlayback(totalSteps: number, defaultSpeed: number = 1350) {
  const [speed, setSpeed] = useState(defaultSpeed);
  const speedRef = useRef(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const { state, dispatch, play, pause, reset, stepForward, jump } = usePlaybackController(totalSteps, speed);

  const handlePlay = useCallback(() => {
    play();
  }, [play]);

  const handlePause = useCallback(() => {
    pause();
  }, [pause]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  const handleStep = useCallback(() => {
    stepForward();
  }, [stepForward]);

  const handleJump = useCallback(
    (step: number) => {
      jump(step);
    },
    [jump]
  );

  return {
    state: { ...state, speed },
    speed,
    setSpeed,
    speedRef,
    play: handlePlay,
    pause: handlePause,
    reset: handleReset,
    stepForward: handleStep,
    jump: handleJump,
    dispatch,
  };
}
