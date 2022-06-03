import { CSSProperties } from 'react';

export interface Coordinate {
  x: number,
  y: number
}

export interface Threshold {
  start: number,
  end: number,
  length?: number,
  color?: string,
}

export interface SpeedometerChartProps {
  percentValue?: number,
  absoluteValue?: number,
  unitLabel?: string,
  universeLabel?: string,
  errorLabel?: string,
  placeholderLabel?: string,
  isLoading?: boolean,
  error: boolean,
  suffix?: string,
  thresholds: Threshold[],
  strokeWidth: number,
  strokeBorder: number,
  showLabels?: boolean,
  alignThresholds: boolean,
  small: boolean,
}

export interface SpeedometerChartState {
  currentValue: number,
  chartOffset: number,
  chartRadius: number,
  arcValueModifiers: number[],
  changingValueTimeout?: NodeJS.Timeout,
  thresholds: Threshold[],
}

export interface DrawArcInputs {
  key: string,
  path: string,
  color?: string,
  width: number,
  style?: CSSProperties,
  className?: string
}
