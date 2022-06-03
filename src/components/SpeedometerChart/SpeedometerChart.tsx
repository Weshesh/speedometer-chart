import React, { CSSProperties, PureComponent } from 'react';
import { Coordinate, DrawArcInputs, SpeedometerChartProps, SpeedometerChartState, Threshold } from './SpeedometerTypes';
import drawArc from './utilities/drawArc';
import { findPointOnAnArc } from './utilities/findPointOnAnArc';
import { getSweepValue } from './utilities/getSweepValue';
import classNames from 'classnames';
import './SpeedometerChart.styles.scss';
import NumberBubble from '../NumberBubble';

class SpeedometerChart extends PureComponent<SpeedometerChartProps, SpeedometerChartState> {

  static defaultProps: SpeedometerChartProps = {
    isLoading: false,
    error: false,
    suffix: undefined,
    thresholds: [
      {
        start: 0,
        end: 100,
      }
    ],
    strokeWidth: 3,
    strokeBorder: 2,
    alignThresholds: true,
    small: false,
  };

  constructor(props: SpeedometerChartProps) {
    super(props);
    const thresholds = this.calculateThresholds();
    this.state = {
      currentValue: 0,
      chartOffset: this.calculateChartOffset(),
      chartRadius: this.calculateChartRadius(),
      arcValueModifiers: this.calculateArcValueModifier(thresholds),
      thresholds,
    };
  }

  componentDidMount(): void {
    if (this.props.percentValue !== undefined) this.changeValue();
  }

  componentDidUpdate(prevProps: SpeedometerChartProps): void {
    const { changingValueTimeout } = this.state;

    if (this.props.strokeWidth !== prevProps.strokeWidth ||
      this.props.strokeBorder !== prevProps.strokeBorder ||
      this.props.alignThresholds !== prevProps.alignThresholds ||
      this.props.thresholds !== prevProps.thresholds
    ) {
      const thresholds = this.calculateThresholds();
      this.setState({
        chartOffset: this.calculateChartOffset(),
        chartRadius: this.calculateChartRadius(),
        arcValueModifiers: this.calculateArcValueModifier(thresholds),
        thresholds,
      });
    }

    const inputHasChanged = prevProps.percentValue !== this.props.percentValue;

    if (inputHasChanged && changingValueTimeout) clearTimeout(changingValueTimeout);
    if (inputHasChanged) this.changeValue();
  }

  componentWillUnmount() {
    const { changingValueTimeout } = this.state;
    if (changingValueTimeout) clearTimeout(changingValueTimeout);
  }

  calculateChartOffset = (): number => {
    const { strokeWidth, strokeBorder } = this.props;
    return (strokeWidth + strokeBorder) / 2;
  };

  calculateChartRadius = (): number => {
    const { strokeWidth, strokeBorder } = this.props;
    return (100 - strokeWidth - strokeBorder) / 2;
  };

  calculateThresholds = (): Threshold[] => {
    const { strokeWidth, alignThresholds, thresholds } = this.props;
    if (alignThresholds && thresholds.length === 3) {
      return [
        {
          start: 0,
          end: thresholds[0].end,
          length: ((100 / 0.75) / 8),
          color: thresholds[0].color,
        },
        {
          start: thresholds[1].start,
          end: thresholds[1].end,
          length: ((100 / 0.75) / 2),
          color: thresholds[1].color,
        },
        {
          start: thresholds[2].start,
          end: 100,
          length: (((100 + strokeWidth * 3) / 0.75) / 8),
          color: thresholds[2].color,
        }
      ];
    } else {
      return thresholds;
    }
  };

  /**
   * Calculates a multiplier for every threshold.
   * Mostly needed when "render length" and "value length" arent the same.
   * I.e. "compressed" thresholds need their inputs be made "smaller"
   * and "inflated" thresholds need to make their inputs "bigger".
   */
  calculateArcValueModifier = (thresholds: Threshold[]): number[] => {
    const { strokeWidth, alignThresholds } = this.props;

    // Safest bet is to have thresholds always sum up to 100%,
    // otherwise the chart might be shortened or have caps in it.
    const arcRanges = thresholds.map(threshold => (
      threshold.end - threshold.start
    ));

    // If no length is defined in the configurations, calculate a reasonable default value.
    const getDefault = (threshold: Threshold) => (
      threshold.end - threshold.start
    );

    // An array of arc lengths.
    const arcLengths = thresholds.map(threshold => (
      threshold?.length ?? getDefault(threshold)
    ));

    // Sum of lengths. The chart should be able to accomodate any positive sum value.
    const sum = arcLengths.reduce((acc, curr) => acc + curr, 0);

    // Modifier to normalized arc lengths, so it would add up to 100%.
    const lengthModifier = alignThresholds && thresholds.length === 3 ? strokeWidth / 2 : 0;
    const modifier = (100 + lengthModifier) / sum;

    function getArcNormalizedLengths(): number[] {
      return (
        arcLengths.map((arcLength) =>
          arcLength * modifier
        )
      );
    }

    const normalizedArcLengths = modifier === 1
      ? arcLengths
      : getArcNormalizedLengths();

    return normalizedArcLengths.map(
      (normalizedArcLength, index) => (
        normalizedArcLength / arcRanges[index]
      )
    );
  };

  /**
   * Calculate an offset for every threshold.
   */
  calculateArcValueOffsets = (): number[] => {
    const { arcValueModifiers, thresholds } = this.state;

    const sortedTresholds = this.getSortedTresholds();

    const offsetPerSegment = thresholds.map((t, index) => {
      const arcLength = t.end - t.start;
      return arcLength * arcValueModifiers[index];
    });

    const cumulativeSegments = Array.from(
      new Array(sortedTresholds.length)
    ).map(() => 0);

    offsetPerSegment.forEach((offset, index) => {
      if (typeof cumulativeSegments[index + 1] === 'number') {
        cumulativeSegments[index + 1] += offset;
      }
    });

    cumulativeSegments.forEach((segment, index) => {
      if (typeof cumulativeSegments[index + 1] === 'number') {
        cumulativeSegments[index + 1] += segment;
      }
    });

    return cumulativeSegments;
  };

  getSortedTresholds = (sortingOrder: 'DESC' | 'ASC' = 'ASC'): Threshold[] => {
    const { thresholds } = this.state;

    return sortingOrder === 'ASC'
      ? thresholds.slice().sort((a, b) => (a.start > b.start) ? 1 : -1)
      : thresholds.slice().sort((a, b) => (a.start < b.start) ? 1 : -1);
  };

  changeValue = (): void => {
    const { percentValue } = this.props;
    const { currentValue, thresholds } = this.state;

    const inputValue = percentValue ?? 0;
    const lowestPossibleValue = thresholds[0].start;
    const newValue = inputValue < lowestPossibleValue
      ? lowestPossibleValue
      : inputValue;

    const valueDifference = Math.abs(currentValue - newValue);
    const step = valueDifference / 10;

    const valuesDiffer = currentValue !== newValue;
    const differenceIsBigEnoughToChange = (valueDifference > step && valueDifference > .05);

    if (valuesDiffer && differenceIsBigEnoughToChange) {
      const change = currentValue > newValue
        ? step * (-1)
        : step;

      this.setState({
        currentValue: currentValue + change,
        changingValueTimeout: setTimeout(() => this.changeValue(), 10)
      });

    } else {
      this.setState({
        currentValue: newValue,
        changingValueTimeout: undefined
      });
    }
  };

  /**
   * An utility for converting chart values into rendering values (basically emant as a percentage of chart).
   * @param inputValue An actual value as a percentage.
   * @param index
   * @param valueThreshold
   * @returns Correct value for drawing, as a simplification, think of it as a value of 0 - 100%.
   */
  convertValueToCorrectPercentage = (
    inputValue: number,
    index: number,
    valueThreshold: Threshold
  ): number => {
    const { arcValueModifiers } = this.state;

    const sortedTresholds = this.getSortedTresholds();
    const thresholdIndex = sortedTresholds.length - 1 - index;
    const thresholdModifier = arcValueModifiers[thresholdIndex];
    const valueOffset = this.calculateArcValueOffsets()[thresholdIndex];
    return ((inputValue - valueThreshold.start) * thresholdModifier) + valueOffset;
  };

  findPoint = (inputValue: number): Coordinate => {
    const { chartOffset, chartRadius } = this.state;

    return (
      findPointOnAnArc(
        chartRadius,
        inputValue,
        chartOffset
      )
    );
  };

  getModifierIndex = (inputIndex: number) => {
    const maxThresholdIndex = this.state.thresholds.length - 1;
    return maxThresholdIndex - inputIndex;
  };

  renderChartBackdrops = (): JSX.Element[][] => {
    const {
      strokeWidth,
      strokeBorder,
      isLoading
    } = this.props;
    const { chartRadius } = this.state;

    const arcRadius = `${chartRadius} ${chartRadius}`;
    const sortedTresholds = this.getSortedTresholds('DESC');

    return sortedTresholds.map((threshold, index) => {
      const backdropBorderKey = `${index}-backdrop-border`;
      const backdropKey = `${index}-backdrop`;

      const pathStartValue = this.convertValueToCorrectPercentage(
        threshold.end,
        index,
        threshold
      );

      const pathEndValue = this.convertValueToCorrectPercentage(
        threshold.start,
        index,
        threshold
      );

      const startPosition = this.findPoint(pathStartValue);
      const endPosition = this.findPoint(pathEndValue);

      const pathStartCoordinates = `${startPosition.x} ${startPosition.y}`;
      const pathEndCoordinates = `${endPosition.x} ${endPosition.y}`;

      const arcLength = threshold.end - threshold.start;
      const arcLengthModifier = this.state.arcValueModifiers[this.getModifierIndex(index)];
      const sweep = getSweepValue(arcLength * arcLengthModifier);

      const backdropPath = `M ${pathStartCoordinates} A ${arcRadius} 0 ${sweep} 0 ${pathEndCoordinates}`;

      const strokeBorderWidth = strokeWidth + strokeBorder;
      const borderStyles = isLoading
        ? { opacity: 0 }
        : {};

      const backdropArcBorderInputs: DrawArcInputs = {
        key: backdropBorderKey,
        path: backdropPath,
        width: strokeBorderWidth,
        style: borderStyles,
        className: 'dgc-speedometer-backdrop-border'
      };

      const backdropArcInputs: DrawArcInputs = {
        key: backdropKey,
        path: backdropPath,
        width: strokeWidth,
        className: 'dgc-speedometer-backdrop-arc'
      };

      return [
        drawArc(backdropArcBorderInputs),
        drawArc(backdropArcInputs)
      ];
    });
  };

  renderChartValue = (): JSX.Element => {
    const { percentValue, strokeWidth, strokeBorder, isLoading } = this.props;
    const { currentValue, chartRadius, arcValueModifiers } = this.state;

    const arcRadius = `${chartRadius} ${chartRadius}`;
    const sortedTresholds = this.getSortedTresholds('DESC');

    const noValue = isLoading || percentValue === undefined;
    const maxThresholdIndex = sortedTresholds.length - 1;
    const highestPossibleValue = sortedTresholds[0].end;
    const lowestPossibleValue = sortedTresholds[maxThresholdIndex].start;


    // Loading state arc, drawn separately to avoid drawing issues.
    const loadingArcValue = currentValue > highestPossibleValue
      ? highestPossibleValue
      : currentValue;

    const loadingArcValueThresholdIndex = sortedTresholds.findIndex(e => (
      loadingArcValue >= e.start || loadingArcValue === e.end
    ));

    const pathStartValue = this.convertValueToCorrectPercentage(
      loadingArcValue,
      loadingArcValueThresholdIndex,
      sortedTresholds[loadingArcValueThresholdIndex]
    );

    const pathEndValue = this.convertValueToCorrectPercentage(
      lowestPossibleValue,
      maxThresholdIndex,
      sortedTresholds[maxThresholdIndex]
    );

    const startPosition = this.findPoint(pathStartValue);
    const endPosition = this.findPoint(pathEndValue);

    const pathStartCoordinates = `${ startPosition.x } ${ startPosition.y }`;
    const pathEndCoordinates = `${ endPosition.x } ${ endPosition.y }`;

    let lenghtFromThresholds = 0;
    sortedTresholds.forEach((t, i) => {
      if (i > loadingArcValueThresholdIndex) {
        const arcLengthModifier = arcValueModifiers[this.getModifierIndex(i)];
        lenghtFromThresholds += (t.end - t.start) * arcLengthModifier;
      }
    });

    const lastThresholdValueModifier = arcValueModifiers[this.getModifierIndex(loadingArcValueThresholdIndex)];
    const lenghtOfTheLastThreshold = (loadingArcValue - sortedTresholds[loadingArcValueThresholdIndex].start) * lastThresholdValueModifier;
    const fullArcLength = lenghtOfTheLastThreshold + lenghtFromThresholds;

    const sweep = getSweepValue(fullArcLength);
    const path = `M ${ pathStartCoordinates } A ${ arcRadius } 0 ${ sweep } 0 ${ pathEndCoordinates }`;

    const shouldShow = isLoading && percentValue !== undefined;

    const loadingStateArcInputs: DrawArcInputs = {
      key: 'loading-state-arc',
      path,
      width: strokeWidth,
      className: `dgc-speedometer-loading-state-arc ${shouldShow ? 'show' : ''}`
    };

    const loadingArc = drawArc(loadingStateArcInputs);

    // Active state ("true") value arcs.
    const arcs = sortedTresholds.map((threshold, index) => {
      if (currentValue >= threshold.start) {
        const thresholdValue = currentValue > threshold.end
          ? threshold.end
          : currentValue;

        const pathStartValue = this.convertValueToCorrectPercentage(thresholdValue, index, threshold);
        const pathEndValue = this.convertValueToCorrectPercentage(threshold.start, index, threshold);

        const startPosition = this.findPoint(pathStartValue);
        const endPosition = this.findPoint(pathEndValue);

        const pathStartCoordinates = `${ startPosition.x } ${ startPosition.y }`;
        const pathEndCoordinates = `${ endPosition.x } ${ endPosition.y }`;

        const arcLength = thresholdValue - threshold.start;
        const arcLengthModifier = arcValueModifiers[sortedTresholds.length - index -1];
        const sweep = getSweepValue(arcLength * arcLengthModifier);
        const path = `M ${ pathStartCoordinates } A ${ arcRadius } 0 ${ sweep } 0 ${ pathEndCoordinates }`;

        const valueBorderKey = `${index}-value-border`;
        const valueKey = `${index}-value`;

        const valueArcBorderClasses = `dgc-speedometer-value-arc-border ${ noValue ? 'loading': ''}`;
        const valueArcClasses = classNames({
          'dgc-speedometer-value-arc': true,
          'loading': noValue,
        });

        const transitionMultiplier = noValue
          ? index
          : maxThresholdIndex - index;

        const valueArcTransitionDelay = {
          transitionDelay: `${ transitionMultiplier * 75 }ms`
        };

        const valueArcBorderInputs: DrawArcInputs = {
          key: valueBorderKey,
          path,
          width: (strokeWidth + strokeBorder),
          className: valueArcBorderClasses,
          style: valueArcTransitionDelay
        };

        const valueArcInputs: DrawArcInputs = {
          key: valueKey,
          path,
          color: threshold?.color,
          width: strokeWidth,
          className: valueArcClasses,
          style: valueArcTransitionDelay
        };

        return (
          [
            drawArc(valueArcBorderInputs),
            drawArc(valueArcInputs)
          ]
        );
      } else {
        return [];
      }
    });

    return (
      <>
        { arcs }
        { loadingArc }
      </>
    );
  };

  renderChildren = (): JSX.Element => {
    const { percentValue, isLoading, error, suffix, absoluteValue, unitLabel, universeLabel, errorLabel, small, placeholderLabel } = this.props;
    const classes = classNames({
      'dgc-speedometer-children-container': true,
      'loading': isLoading,
    });

    const shouldShow = percentValue !== undefined || isLoading || error;

    return (
      <div className={ classes }>
        <div className='dgc-speedometer-children-content'>

          { placeholderLabel && <div className='dgc-speedometer-children-content--placeholder-label'>{placeholderLabel}</div> }

          <NumberBubble isLoading={ isLoading } bubbleSize={ small ? 48 : 96 } error={ error } suffix={ suffix } value={ percentValue } shouldShow={ shouldShow } />

          { !small && !error && percentValue !== undefined &&
            <>
              <div className='dgc-speedometer-children-content--universe-label'>
                { universeLabel }
              </div>
              <div className='dgc-speedometer-children-content--universe-estimate-value'>
                { absoluteValue === undefined ? undefined : absoluteValue.toLocaleString() }
              </div>
              <div className='dgc-speedometer-children-content--unit-label'>
                { unitLabel }
              </div>
            </>
          }

          {
            !small && error &&
            <div className='dgc-speedometer-children-content--error-label'>
              { errorLabel }
            </div>
          }

        </div>
      </div>
    );
  };

  render(): JSX.Element {
    const { showLabels, strokeWidth, alignThresholds, small, absoluteValue, unitLabel } = this.props;
    const { chartRadius } = this.state;

    const sortedTresholds = this.getSortedTresholds();

    const gapInRadians = alignThresholds && sortedTresholds.length === 3 ? strokeWidth / 2 / chartRadius : 0;

    const svgStyle: CSSProperties = {
      transform: `rotate(-${gapInRadians}rad)`
    };

    const containerClasses = classNames({
      'dgc-speedometer-container': true,
      'small': small,
    });

    return (
      <div className={ containerClasses }>
        <div className='dgc-speedometer-chart-container'>
          {
            showLabels &&
            <div className='dgc-speedometer-chart--threshold-label left'>
              { sortedTresholds[1] && <span>{`${sortedTresholds[0].end}%`}</span> }
              <div className='dgc-speedometer-chart--threshold-label--tick'/>
            </div>
          }
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMinYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            className='dgc-speedometer-chart'
            style={ svgStyle }
          >
            { this.renderChartBackdrops() }
            { this.renderChartValue() }
          </svg>
          { this.renderChildren() }
          {
            showLabels &&
            <div className='dgc-speedometer-chart--threshold-label'>
              <div className='dgc-speedometer-chart--threshold-label--tick'/>
              { sortedTresholds[1] && <span>{ `${sortedTresholds[1].end}%` }</span> }
            </div>
          }
        </div>
        {
          small && absoluteValue !== undefined &&
          <div className='dgc-speedometer-chart--small-value-label'>
            <span className="value">{ absoluteValue.toLocaleString() }</span>
            { unitLabel && <span className="unit">{ unitLabel }</span> }
          </div>
        }
      </div>
    );
  }
}

export default SpeedometerChart;
