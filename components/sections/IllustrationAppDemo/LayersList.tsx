import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { LayersListProps } from './types';

const LayersList: React.FC<LayersListProps> = ({ layers, setLayers, activeLayerId, setActiveLayerId, toggleLayerVisibility }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      {layers.map(layer => (
        <div key={layer.id} className="flex items-center justify-between">
          <div 
            className={`flex items-center space-x-2 cursor-pointer ${activeLayerId === layer.id ? 'font-bold' : ''}`}
            onClick={() => setActiveLayerId(layer.id)}
          >
            <span>{layer.name}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleLayerVisibility(layer.id)}
          >
            {layer.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        </div>
      ))}
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full"
        onClick={() => setLayers(prev => [...prev, { id: Date.now(), name: t('newLayer', { count: prev.length + 1 }), visible: true }])}
      >
        {t('addLayer')}
      </Button>
    </div>
  );
};

export default LayersList;