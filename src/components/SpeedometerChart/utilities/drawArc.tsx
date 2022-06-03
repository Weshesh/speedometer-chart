import React from 'react';
import { DrawArcInputs } from '../SpeedometerTypes';

const drawArc = (inputs: DrawArcInputs): JSX.Element => {
  const { key, path, color, width, style, className } = inputs;

  return (
    <path
      key={ key }
      style={ style }
      className={ className }
      d={ path }
      stroke={ color ?? 'currentColor' }
      strokeWidth={ width }
      strokeLinecap='round'
      fill='transparent'
    />
  );
};

export default drawArc;
