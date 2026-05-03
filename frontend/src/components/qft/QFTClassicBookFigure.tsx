import type { QFTBenchmarkResult } from '../../types/qft';
import { buildQFTBookFigureModel, type FigureMode } from './book-figure/engine';
import { QFTBookFigureSvg } from './book-figure/svg';
import { getQFTBookFigureId } from './qftBookFigure';

interface QFTClassicBookFigureProps {
  result: QFTBenchmarkResult;
  mode?: FigureMode;
}

export function QFTClassicBookFigure({ result, mode = 'screen' }: QFTClassicBookFigureProps) {
  const wrapperId = mode === 'export' ? getQFTBookFigureId(result.case_id) : undefined;
  const model = buildQFTBookFigureModel(result);

  return (
    <div
      id={wrapperId}
      className={mode === 'screen'
        ? 'w-full max-w-[1800px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
        : 'w-[1800px] rounded-2xl border border-slate-200 bg-white p-5'}
    >
      <QFTBookFigureSvg model={model} mode={mode} />
    </div>
  );
}
