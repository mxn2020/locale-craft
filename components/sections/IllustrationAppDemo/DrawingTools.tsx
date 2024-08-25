import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { DrawingToolsProps } from './types';

const DrawingTools: React.FC<DrawingToolsProps> = ({ strokeColor, setStrokeColor, fillColor, setFillColor, brushSize, setBrushSize }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="stroke-color">{t('strokeColor')}</Label>
        <Input
          id="stroke-color"
          type="color"
          value={strokeColor}
          onChange={(e) => setStrokeColor(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="fill-color">{t('fillColor')}</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="fill-color"
            type="color"
            value={fillColor === 'transparent' ? '#ffffff' : fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            disabled={fillColor === 'transparent'}
          />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFillColor(fillColor === 'transparent' ? '#ffffff' : 'transparent')}
        >
          {fillColor === 'transparent' ? 'Enable Fill' : 'Disable Fill'}
        </Button>
        </div>
      </div>
      <div>
        <Label htmlFor="brush-size">{t('brushSize')}</Label>
        <Slider
          id="brush-size"
          min={1}
          max={20}
          step={1}
          value={[brushSize]}
          onValueChange={(value) => setBrushSize(value[0])}
        />
      </div>
    </div>
  );
};

export default DrawingTools;