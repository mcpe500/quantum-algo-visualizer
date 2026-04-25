import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface FormulaDisplayProps {
  latex: string;
  displayMode?: boolean;
  fontSize?: string;
  color?: string;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  size?: 'default' | 'mini';
}

export function FormulaDisplay({
  latex,
  displayMode = false,
  fontSize,
  color,
  className = '',
  onClick,
  style,
  size = 'default',
}: FormulaDisplayProps) {
  const renderedLatex = katex.renderToString(latex, {
    displayMode: size === 'default' ? displayMode : false,
    throwOnError: false,
    output: 'html',
  });

  const isMini = size === 'mini';
  const computedFontSize = fontSize ?? (isMini ? '0.875rem' : '1.2rem');
  const computedColor = color ?? (isMini ? '#94a3b8' : '#e2e8f0');

  return (
    <div
      className={`formula-display ${isMini ? 'formula-display--mini' : ''} ${displayMode ? 'formula-display--block' : ''} ${className}`}
      onClick={onClick}
      style={{
        color: computedColor,
        fontSize: computedFontSize,
        lineHeight: isMini ? 1.5 : 1.6,
        overflow: isMini ? 'hidden' : 'auto',
        overflowY: isMini ? undefined : 'hidden',
        textOverflow: isMini ? 'ellipsis' : undefined,
        whiteSpace: isMini ? 'nowrap' : undefined,
        maxWidth: '100%',
        minWidth: 0,
        ...(onClick ? { cursor: 'pointer' } : {}),
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: renderedLatex }}
    />
  );
}
