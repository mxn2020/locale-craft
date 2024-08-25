import React from 'react';
import { Button } from '@/components/ui/button';
import { MousePointer, PenTool, Square, Circle } from 'lucide-react';
import { ToolbarButtonProps, ToolbarProps, Tool } from './types';

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon: Icon, isActive, onClick }) => (
  <Button
    variant={isActive ? 'secondary' : 'ghost'}
    size="icon"
    onClick={onClick}
  >
    <Icon className="h-4 w-4" />
  </Button>
);

const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolClick }) => (
  <div className="w-12 bg-muted p-2 flex flex-col items-center space-y-2">
    <ToolbarButton
      icon={MousePointer}
      isActive={activeTool === 'select'}
      onClick={() => onToolClick('select')}
    />
    <ToolbarButton
      icon={PenTool}
      isActive={activeTool === 'pen'}
      onClick={() => onToolClick('pen')}
    />
    <ToolbarButton
      icon={Square}
      isActive={activeTool === 'rectangle'}
      onClick={() => onToolClick('rectangle')}
    />
    <ToolbarButton
      icon={Circle}
      isActive={activeTool === 'ellipse'}
      onClick={() => onToolClick('ellipse')}
    />
  </div>
);

export default Toolbar;