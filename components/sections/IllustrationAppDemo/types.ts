import { ReactNode } from 'react';

export type Point = {
  x: number;
  y: number;
};

export type Shape = {
  id: number;
  type: 'pen' | 'rectangle' | 'ellipse';
  path: string | { start: Point; end: Point };
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  layerId: number;
};

export type Layer = {
  id: number;
  name: string;
  visible: boolean;
};

export type Preferences = {
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showRulers: boolean;
};

export type Tool = 'select' | 'pen' | 'rectangle' | 'ellipse';

export interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
}

export interface ToolbarProps {
  activeTool: Tool;
  onToolClick: (tool: Tool) => void;
  preferences: Preferences;
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>;
}

export interface TopBarProps {
    undoStack: Shape[][];
    redoStack: Shape[][];
    onUndo: () => void;
    onRedo: () => void;
    activeLayer: Layer | undefined;
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onExport: (format: 'SVG' | 'PNG' | 'JPEG' | 'PDF') => void;
    preferences: Preferences;
    setPreferences: React.Dispatch<React.SetStateAction<Preferences>>;
  }
  
  

  export interface DrawingCanvasProps {
    svgRef: React.RefObject<SVGSVGElement>;
    zoom: number;
    preferences: Preferences;
    layers: Layer[];
    shapes: Shape[];
    selectedShapeIds: number[];
    currentPath: string | { start: Point; end: Point } | null;
    activeTool: Tool;
    strokeColor: string;
    fillColor: string;
    brushSize: number;
    onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void;
    onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
    onMouseUp: () => void;
  }
  

export interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  activeLayerId: number;
  setActiveLayerId: (id: number) => void;
  toggleLayerVisibility: (id: number) => void;
}

export interface DrawingToolsProps {
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
}

export interface LayersListProps {
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  activeLayerId: number;
  setActiveLayerId: (id: number) => void;
  toggleLayerVisibility: (id: number) => void;
}