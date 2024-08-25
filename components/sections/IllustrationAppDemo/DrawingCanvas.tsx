import React from 'react';
import { DrawingCanvasProps, Shape, Point } from './types';
import { renderShape, renderCurrentPath, renderGrid, renderRulers } from './renderUtils';

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ 
  svgRef, 
  zoom, 
  preferences, 
  layers, 
  shapes, 
  selectedShapeIds,
  currentPath, 
  activeTool, 
  strokeColor, 
  fillColor, 
  brushSize, 
  onMouseDown, 
  onMouseMove, 
  onMouseUp
}) => (
  <div className="flex-1 bg-white overflow-hidden relative">
    {preferences.showRulers && renderRulers()}
    <svg
      ref={svgRef}
      className="w-full h-full"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ 
        transform: `scale(${zoom / 100})`, 
        transformOrigin: 'top left',
        marginLeft: preferences.showRulers ? '20px' : '0',
        marginTop: preferences.showRulers ? '20px' : '0',
      }}
    >
      {preferences.showGrid && renderGrid(svgRef, preferences.gridSize, zoom)}
      {layers.map(layer => 
        layer.visible && shapes.filter(shape => shape.layerId === layer.id).map(shape => (
          <g key={shape.id}>
            {renderShape(shape)}
            {selectedShapeIds.includes(shape.id) && renderSelectionOutline(shape)}
          </g>
        ))
      )}
      {currentPath && renderCurrentPath(currentPath, activeTool, strokeColor, fillColor, brushSize)}
    </svg>
  </div>
);

const renderSelectionOutline = (shape: Shape) => {
  switch (shape.type) {
    case 'rectangle': {
      const { start, end } = shape.path as { start: Point; end: Point };
      return (
        <rect
          x={Math.min(start.x, end.x) - 2}
          y={Math.min(start.y, end.y) - 2}
          width={Math.abs(end.x - start.x) + 4}
          height={Math.abs(end.y - start.y) + 4}
          stroke="#007bff"
          strokeWidth={1}
          fill="none"
          strokeDasharray="4 4"
        />
      );
    }
    case 'ellipse': {
      const { start, end } = shape.path as { start: Point; end: Point };
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      return (
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx + 2}
          ry={ry + 2}
          stroke="#007bff"
          strokeWidth={1}
          fill="none"
          strokeDasharray="4 4"
        />
      );
    }
    case 'pen': {
      // For pen tool, we'll create a bounding box
      const points = (shape.path as string).split(/[ML]/).slice(1).map(pair => {
        const [x, y] = pair.trim().split(' ').map(Number);
        return { x, y };
      });
      const minX = Math.min(...points.map(p => p.x));
      const minY = Math.min(...points.map(p => p.y));
      const maxX = Math.max(...points.map(p => p.x));
      const maxY = Math.max(...points.map(p => p.y));
      return (
        <rect
          x={minX - 2}
          y={minY - 2}
          width={maxX - minX + 4}
          height={maxY - minY + 4}
          stroke="#007bff"
          strokeWidth={1}
          fill="none"
          strokeDasharray="4 4"
        />
      );
    }
    default:
      return null;
  }
};

export default DrawingCanvas;