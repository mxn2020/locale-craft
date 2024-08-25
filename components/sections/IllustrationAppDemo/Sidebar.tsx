import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DrawingTools from './DrawingTools';
import LayersList from './LayersList';
import { SidebarProps } from './types';

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  strokeColor, 
  setStrokeColor, 
  fillColor, 
  setFillColor, 
  brushSize, 
  setBrushSize, 
  layers, 
  setLayers,
  activeLayerId, 
  setActiveLayerId, 
  toggleLayerVisibility 
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-48 bg-muted p-4 space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="draw">{t('draw')}</TabsTrigger>
          <TabsTrigger value="layers">{t('layers')}</TabsTrigger>
        </TabsList>
        <TabsContent value="draw">
          <DrawingTools
            strokeColor={strokeColor}
            setStrokeColor={setStrokeColor}
            fillColor={fillColor}
            setFillColor={setFillColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
          />
        </TabsContent>
        <TabsContent value="layers">
          <LayersList
            layers={layers}
            setLayers={setLayers}
            activeLayerId={activeLayerId}
            setActiveLayerId={setActiveLayerId}
            toggleLayerVisibility={toggleLayerVisibility}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Sidebar;