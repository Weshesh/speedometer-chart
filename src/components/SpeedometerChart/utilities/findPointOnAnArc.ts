import { Coordinate } from '../SpeedometerTypes';

/**
 * Takes in the radius of the and arc length (Usually a value in the range of 0% to 100%).
 * returns x and y coordinates;
 */
export function findPointOnAnArc(radius: number, chartValueInPercentage: number, offset: number): Coordinate {
  const { cos, sin, PI } = Math;

  const percentageAsFractionalNumber = chartValueInPercentage / 100;
  const startingPointOffSet = (3 * PI) / 4;
  const lengthOfThechart = (3 * PI) / 2;
  const radians = (lengthOfThechart * percentageAsFractionalNumber) + startingPointOffSet;

  const xModifier = cos(radians);
  const yModifier = sin(radians);

  const coordinate = (modifier: number) => (modifier + 1) * radius + offset;

  const outputCoordinates = {
    x: coordinate(xModifier),
    y: coordinate(yModifier)
  };

  return outputCoordinates;
}
