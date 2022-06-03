export function getSweepValue(arcLength: number): number {
  const { PI } = Math;

  const lengthOfThechart = (3 * PI) / 2;
  const lengthInPercentage = arcLength / 100;
  const lengthInRadian = lengthOfThechart * lengthInPercentage;

  const arcIsMoreThanHalfTheChart = lengthInRadian % (2 * PI) > PI;
  const sweepValue = arcIsMoreThanHalfTheChart
    ? 1
    : 0;

  return sweepValue;
}
