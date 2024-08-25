import React from 'react';
import { Shape, Point, Tool } from './types';

export const renderShape = (shape: Shape): React.ReactElement => {
  switch (shape.type) {
    case 'pen':
      return (
        <path
          d={shape.path as string}
          stroke={shape.strokeColor}
          strokeWidth={shape.strokeWidth}
          fill={shape.fillColor}
        />
      );
    case 'rectangle':
      const { start, end } = shape.path as { start: Point; end: Point };
      return (
        <rect
          x={Math.min(start.x, end.x)}
          y={Math.min(start.y, end.y)}
          width={Math.abs(end.x - start.x)}
          height={Math.abs(end.y - start.y)}
          stroke={shape.strokeColor}
          strokeWidth={shape.strokeWidth}
          fill={shape.fillColor}
        />
      );
    case 'ellipse':
      const { start: s, end: e } = shape.path as { start: Point; end: Point };
      return (
        <ellipse
          cx={(s.x + e.x) / 2}
          cy={(s.y + e.y) / 2}
          rx={Math.abs(e.x - s.x) / 2}
          ry={Math.abs(e.y - s.y) / 2}
          stroke={shape.strokeColor}
          strokeWidth={shape.strokeWidth}
          fill={shape.fillColor}
        />
      );
    default:
      return <></>;
  }

  return <></>;
};

export const renderCurrentPath = (
  currentPath: string | { start: Point; end: Point },
  activeTool: Tool,
  strokeColor: string,
  fillColor: string,
  brushSize: number
): React.ReactElement => {
  if (activeTool === 'pen') {
    return (
      <path
        d={currentPath as string}
        stroke={strokeColor}
        strokeWidth={brushSize}
        fill="none"
      />
    );
  } else {
    return renderShape({
      id: 0,
      type: activeTool as 'rectangle' | 'ellipse',
      path: currentPath as { start: Point; end: Point },
      strokeColor,
      fillColor,
      strokeWidth: brushSize,
      layerId: 0
    });
  }
};

export const renderGrid = (
  svgRef: React.RefObject<SVGSVGElement>,
  gridSize: number,
  zoom: number
): React.ReactElement => {
  const width = svgRef.current?.clientWidth || 0;
  const height = svgRef.current?.clientHeight || 0;
  const scaledGridSize = gridSize * (zoom / 100);

  return (
    <g>
      {Array.from({ length: Math.ceil(width / scaledGridSize) }).map((_, i) => (
        <line
          key={`vertical-${i}`}
          x1={i * scaledGridSize}
          y1={0}
          x2={i * scaledGridSize}
          y2={height}
          stroke="#ddd"
          strokeWidth={0.5}
        />
      ))}
      {Array.from({ length: Math.ceil(height / scaledGridSize) }).map((_, i) => (
        <line
          key={`horizontal-${i}`}
          x1={0}
          y1={i * scaledGridSize}
          x2={width}
          y2={i * scaledGridSize}
          stroke="#ddd"
          strokeWidth={0.5}
        />
      ))}
    </g>
  );
};

export const renderRulers = (): React.ReactElement => {
  const rulerSize = 20;
  const width = 800; // Assuming a fixed width, adjust as needed
  const height = 600; // Assuming a fixed height, adjust as needed

  return (
    <>
      <svg width={width} height={rulerSize} style={{ position: 'absolute', top: 0, left: rulerSize }}>
        <rect width={width} height={rulerSize} fill="#f0f0f0" />
        {Array.from({ length: Math.ceil(width / 100) }).map((_, i) => (
          <g key={`h-${i}`}>
            <line x1={i * 100} y1={0} x2={i * 100} y2={rulerSize} stroke="#000" />
            <text x={i * 100 + 2} y={rulerSize - 2} fontSize="10">{i * 100}</text>
          </g>
        ))}
      </svg>
      <svg width={rulerSize} height={height} style={{ position: 'absolute', top: rulerSize, left: 0 }}>
        <rect width={rulerSize} height={height} fill="#f0f0f0" />
        {Array.from({ length: Math.ceil(height / 100) }).map((_, i) => (
          <g key={`v-${i}`}>
            <line x1={0} y1={i * 100} x2={rulerSize} y2={i * 100} stroke="#000" />
            <text x={2} y={i * 100 + 10} fontSize="10">{i * 100}</text>
          </g>
        ))}
      </svg>
    </>
  );
};