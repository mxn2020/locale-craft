import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Undo, Redo, ZoomIn, ZoomOut, Download, Settings, Grid, Ruler } from 'lucide-react';
import { TopBarProps } from './types';

const TopBar: React.FC<TopBarProps> = ({ 
  undoStack, 
  redoStack, 
  onUndo, 
  onRedo, 
  activeLayer, 
  zoom, 
  onZoomIn, 
  onZoomOut, 
  onExport,
  preferences,
  setPreferences
}) => {
  const { t } = useTranslation();

  return (
    <div className="h-10 bg-muted border-b flex items-center justify-between px-4">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={onUndo} disabled={undoStack.length === 0}>
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onRedo} disabled={redoStack.length === 0}>
          <Redo className="h-4 w-4" />
        </Button>
        <span>{t('activeLayer')}: {activeLayer?.name}</span>
      </div>
      <div className="flex items-center space-x-2">
        <Button 
          variant={preferences.showGrid ? "secondary" : "ghost"} 
          size="icon" 
          onClick={() => setPreferences(prev => ({ ...prev, showGrid: !prev.showGrid }))}
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button 
          variant={preferences.showRulers ? "secondary" : "ghost"} 
          size="icon" 
          onClick={() => setPreferences(prev => ({ ...prev, showRulers: !prev.showRulers }))}
        >
          <Ruler className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span>{zoom}%</span>
        <Button variant="ghost" size="icon" onClick={onZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onExport('SVG')}>{t('exportSVG')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('PNG')}>{t('exportPNG')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('JPEG')}>{t('exportJPEG')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('PDF')}>{t('exportPDF')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TopBar;