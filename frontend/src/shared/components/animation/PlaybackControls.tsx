import { Gauge, LoaderCircle, Pause, Play, RotateCcw, SkipForward, Video } from 'lucide-react';

export interface PlaybackControlsProps {
  isPlaying: boolean;
  isLastStep: boolean;
  isExporting: boolean;
  isConverting: boolean;
  speed: number;
  currentStep: number;
  totalSteps: number;
  phaseColor: string;
  sliderAccent: string;
  exportBtnBorder: string;
  exportBtnBg: string;
  exportBtnText: string;
  exportBtnHover: string;
  speedSlider: { min: number; max: number; step: number };
  supportedVideoMimeType: string | null;
  ffmpegReady: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onExportVideo: () => void;
  onExportMp4: () => void;
  exportError: string | null;
  exportInfoText?: string;
  ffmpegWarning?: string;
}

export function PlaybackControls({
  isPlaying,
  isLastStep,
  isExporting,
  isConverting,
  speed,
  currentStep,
  totalSteps,
  phaseColor,
  sliderAccent,
  exportBtnBorder,
  exportBtnBg,
  exportBtnText,
  exportBtnHover,
  speedSlider,
  supportedVideoMimeType,
  ffmpegReady,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSpeedChange,
  onExportVideo,
  onExportMp4,
  exportError,
  exportInfoText,
  ffmpegWarning,
}: PlaybackControlsProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={isExporting}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>

        <button
          onClick={onStep}
          disabled={isLastStep || isExporting}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <SkipForward className="h-4 w-4" />
        </button>

        <button
          onClick={onReset}
          disabled={isExporting}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <div className="ml-1 flex min-w-[220px] flex-1 items-center gap-2">
          <Gauge className="h-4 w-4 text-slate-500" />
          <input
            type="range"
            min={speedSlider.min}
            max={speedSlider.max}
            step={speedSlider.step}
            value={speed}
            disabled={isExporting}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
            className={`h-1.5 flex-1 ${sliderAccent} disabled:cursor-not-allowed disabled:opacity-40`}
          />
          <span className="w-[62px] text-[11px] text-slate-600">{speed}ms</span>
        </div>

        <span className="font-mono text-[12px] text-slate-500">
          {currentStep + 1}/{totalSteps}
        </span>

        <button
          onClick={onExportVideo}
          disabled={isExporting || !supportedVideoMimeType}
          className={`ml-auto inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${exportBtnBorder} ${exportBtnBg} ${exportBtnText} ${exportBtnHover}`}
        >
          {isExporting && !isConverting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
          {isExporting && !isConverting ? 'Merekam...' : 'WebM 1080p'}
        </button>

        <button
          onClick={onExportMp4}
          disabled={isExporting || !supportedVideoMimeType || !ffmpegReady}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isConverting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
          {isConverting ? 'Mengkonversi ke MP4...' : 'MP4 1080p'}
        </button>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%`, backgroundColor: phaseColor }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3 text-[12px] leading-6 text-slate-500">
        <p>
          {exportInfoText ?? 'WebM = instant. MP4 = rekam lalu konversi via FFmpeg.wasm (~5-15 detik). Keduanya merekam canvas 1920x1080.'}
        </p>
        {!supportedVideoMimeType && (
          <p className="text-rose-600">
            Browser belum mendukung export video. Gunakan Chrome, Edge, atau Firefox terbaru.
          </p>
        )}
        {!ffmpegReady && (
          <p className="text-amber-600">
            {ffmpegWarning ?? 'MP4 tidak tersedia di browser ini. Gunakan browser modern yang mendukung WebAssembly + Worker.'}
          </p>
        )}
        {exportError && (
          <p className="text-rose-600">
            {exportError}
          </p>
        )}
      </div>
    </div>
  );
}
