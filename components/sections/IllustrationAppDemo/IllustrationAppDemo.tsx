import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng, toJpeg, toSvg } from 'html-to-image';
import jsPDF from 'jspdf';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import TopBar from './TopBar';
import Toolbar from './Toolbar';
import DrawingCanvas from './DrawingCanvas';
import Sidebar from './Sidebar';
import { renderShape, renderCurrentPath, renderGrid, renderRulers } from './renderUtils';
import { Shape, Layer, Preferences, Tool, Point } from './types';

const IllustrationAppDemo: React.FC = () => {
  const { t } = useTranslation();
  const [showDemo, setShowDemo] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [activeTab, setActiveTab] = useState<string>('draw');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [fillColor, setFillColor] = useState<string>('transparent');
  const [brushSize, setBrushSize] = useState<number>(5);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<string | { start: Point; end: Point } | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeIds, setSelectedShapeIds] = useState<number[]>([]);
  const [undoStack, setUndoStack] = useState<Shape[][]>([]);
  const [redoStack, setRedoStack] = useState<Shape[][]>([]);
  const [zoom, setZoom] = useState<number>(100);
  const [layers, setLayers] = useState<Layer[]>([
    { id: 1, name: t('layer1'), visible: true },
    { id: 2, name: t('layer2'), visible: true }
  ]);
  const [activeLayerId, setActiveLayerId] = useState<number>(1);
  const [preferences, setPreferences] = useState<Preferences>({
    showGrid: false,
    snapToGrid: false,
    gridSize: 20,
    showRulers: false,
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Update layer names when language changes
    setLayers(prevLayers => prevLayers.map((layer, index) => ({
      ...layer,
      name: t(`layer${index + 1}`)
    })));
  }, [t]);

  const handleToolClick = (tool: Tool) => {
    setActiveTool(tool);
    if (tool !== 'select') {
      setSelectedShapeIds([]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'select') {
      handleSelectionStart(e);
    } else {
      handleDrawingStart(e);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'select') {
      handleSelectionMove(e);
    } else {
      handleDrawingMove(e);
    }
  };

  const handleMouseUp = () => {
    if (activeTool === 'select') {
      handleSelectionEnd();
    } else {
      handleDrawingEnd();
    }
  };

  const handleSelectionStart = (e: React.MouseEvent<SVGSVGElement>) => {
    const point = getMousePosition(e);
    const clickedShapeId = getShapeAtPoint(point);
    
    if (clickedShapeId !== null) {
      if (e.shiftKey) {
        setSelectedShapeIds(prev => 
          prev.includes(clickedShapeId) 
            ? prev.filter(id => id !== clickedShapeId)
            : [...prev, clickedShapeId]
        );
      } else {
        setSelectedShapeIds([clickedShapeId]);
      }
      setIsDragging(true);
      setDragStart(point);
    } else {
      setSelectedShapeIds([]);
    }
  };

  const handleSelectionMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !dragStart) return;

    const currentPoint = getMousePosition(e);
    const dx = currentPoint.x - dragStart.x;
    const dy = currentPoint.y - dragStart.y;

    setShapes(prevShapes => 
      prevShapes.map(shape => 
        selectedShapeIds.includes(shape.id) ? moveShape(shape, dx, dy) : shape
      )
    );

    setDragStart(currentPoint);
  };

  const handleSelectionEnd = () => {
    if (isDragging) {
      setUndoStack(prevStack => [...prevStack, shapes]);
      setRedoStack([]);
    }
    setIsDragging(false);
    setDragStart(null);
  };

  const handleDrawingStart = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDrawing(true);
    const point = getMousePosition(e);
    
    if (activeTool === 'pen') {
      setCurrentPath(`M ${point.x} ${point.y}`);
    } else {
      setCurrentPath({ start: point, end: point });
    }
  };

  const handleDrawingMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;

    const point = getMousePosition(e);
    
    if (activeTool === 'pen') {
      setCurrentPath(prevPath => `${prevPath} L ${point.x} ${point.y}`);
    } else {
      setCurrentPath(prevPath => ({ ...prevPath as { start: Point; end: Point }, end: point }));
    }
  };

  const handleDrawingEnd = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    if (currentPath) {
      const newShape: Shape = {
        id: Date.now(),
        type: activeTool as 'pen' | 'rectangle' | 'ellipse',
        path: currentPath,
        strokeColor,
        fillColor: activeTool === 'pen' ? 'none' : fillColor,
        strokeWidth: brushSize,
        layerId: activeLayerId
      };
      setShapes(prevShapes => [...prevShapes, newShape]);
      setUndoStack(prevStack => [...prevStack, shapes]);
      setRedoStack([]);
    }
    setCurrentPath(null);
  };

  const getMousePosition = (e: React.MouseEvent<SVGSVGElement>): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = svg.width.baseVal.value / rect.width;
    const scaleY = svg.height.baseVal.value / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const getShapeAtPoint = (point: Point): number | null => {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (shape.type === 'rectangle') {
        const { start, end } = shape.path as { start: Point; end: Point };
        if (point.x >= Math.min(start.x, end.x) && point.x <= Math.max(start.x, end.x) &&
            point.y >= Math.min(start.y, end.y) && point.y <= Math.max(start.y, end.y)) {
          return shape.id;
        }
      }
      // Add more shape type checks as needed
    }
    return null;
  };

  const moveShape = (shape: Shape, dx: number, dy: number): Shape => {
    switch (shape.type) {
      case 'pen':
        return {
          ...shape,
          path: (shape.path as string).replace(/(-?\d+\.?\d*)/g, (match, p1) => {
            const num = parseFloat(p1);
            return (num + (match.indexOf('L') === -1 ? dx : dy)).toString();
          })
        };
      case 'rectangle':
      case 'ellipse':
        const { start, end } = shape.path as { start: Point; end: Point };
        return {
          ...shape,
          path: {
            start: { x: start.x + dx, y: start.y + dy },
            end: { x: end.x + dx, y: end.y + dy }
          }
        };
      default:
        return shape;
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prevShapes = undoStack[undoStack.length - 1];
    setRedoStack(prevStack => [...prevStack, shapes]);
    setShapes(prevShapes);
    setUndoStack(prevStack => prevStack.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextShapes = redoStack[redoStack.length - 1];
    setUndoStack(prevStack => [...prevStack, shapes]);
    setShapes(nextShapes);
    setRedoStack(prevStack => prevStack.slice(0, -1));
  };

  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom - 10, 50));
  };

  const handleExport = async (format: string) => {
    if (!svgRef.current) return;
    try {
      let dataUrl: string = '';  // Initialize dataUrl with an empty string
  
      switch (format) {
        case 'PNG':
          dataUrl = await toPng(svgRef.current as any);
          break;
        case 'JPEG':
          // Create a temporary canvas
          const svgElement = svgRef.current as SVGSVGElement;
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
  
          if (context) {
            // Set canvas dimensions to match the SVG
            canvas.width = svgElement.clientWidth;
            canvas.height = svgElement.clientHeight;
  
            // Fill the canvas with white
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
  
            // Convert the SVG to an image and draw it on the canvas
            const svgDataUrl = await toPng(svgElement as any);
            const image = new Image();
            image.src = svgDataUrl;
            await new Promise((resolve) => {
              image.onload = () => {
                context.drawImage(image, 0, 0);
                resolve(null);
              };
            });
  
            // Export the canvas content as a JPEG
            dataUrl = canvas.toDataURL('image/jpeg');
          }
          break;
        case 'SVG':
          dataUrl = await toSvg(svgRef.current as any);
          break;
        case 'PDF':
          const imgData = await toPng(svgRef.current as any);
          const pdf = new jsPDF();
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
  
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save('illustration.pdf');
          toast({
            title: t('exported_as_pdf'),
            description: t('pdf_export_success'),
          });
          return;
        default:
          throw new Error('Unsupported format');
      }
  
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `illustration.${format.toLowerCase()}`;
        link.href = dataUrl;
        link.click();
        toast({
          title: t('exported_as', { format }),
          description: t('export_success'),
        });
      } else {
        throw new Error('Failed to generate data URL for export');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: t('export_failed'),
        description: t('export_error_try_again'),
        variant: "destructive",
      });
    }
  };
  


  const toggleLayerVisibility = (layerId: number) => {
    setLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };


  const handleLaunchDemo = () => {
    setShowDemo(true);
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-[800px] mx-auto border rounded-lg overflow-hidden shadow-lg relative">
      <AnimatePresence>
        {!showDemo && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h2
              className="text-4xl font-bold mb-4"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {t('welcome_to_illustration_app')}
            </motion.h2>
            <motion.p
              className="text-xl mb-8"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {t('experience_power_of_digital_illustration')}
            </motion.p>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 10 }}
            >
              <Button onClick={handleLaunchDemo} variant="secondary" size="lg">
                {t('launch_demo')}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showDemo && (
        <>
          <TopBar
            undoStack={undoStack}
            redoStack={redoStack}
            onUndo={handleUndo}
            onRedo={handleRedo}
            activeLayer={layers.find(layer => layer.id === activeLayerId)}
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onExport={handleExport}
            preferences={preferences}
            setPreferences={setPreferences}
          />
          <div className="flex flex-1 overflow-hidden">
            <Toolbar
              activeTool={activeTool}
              onToolClick={handleToolClick}
              preferences={preferences}
              setPreferences={setPreferences}
            />
            <DrawingCanvas
              svgRef={svgRef}
              zoom={zoom}
              preferences={preferences}
              layers={layers}
              shapes={shapes}
              selectedShapeIds={selectedShapeIds}
              currentPath={currentPath}
              activeTool={activeTool}
              strokeColor={strokeColor}
              fillColor={fillColor}
              brushSize={brushSize}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            />
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              strokeColor={strokeColor}
              setStrokeColor={setStrokeColor}
              fillColor={fillColor}
              setFillColor={setFillColor}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              layers={layers}
              setLayers={setLayers}
              activeLayerId={activeLayerId}
              setActiveLayerId={setActiveLayerId}
              toggleLayerVisibility={toggleLayerVisibility}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default IllustrationAppDemo;
