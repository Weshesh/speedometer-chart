import React, { PureComponent } from 'react';
import './Spinner.styles.scss';

type SpinnerProps = {
  size: number,
  stroke: string,
  strokeWidth: number,
};

class Spinner extends PureComponent<SpinnerProps> {

  static defaultProps = {
    size: 60,
    stroke: '#A7A7A7',
    strokeWidth: 2,
  };

  render() {
    const { size, stroke, strokeWidth } = this.props;
    const viewBoxSideLength = size;
    const circleCenter = (size / 2);
    const radius = circleCenter - (strokeWidth / 2);

    const circumference = 2 * Math.PI * radius;

    const spinnerStyleVariables = {
      '--dgc-spinner-circumference': circumference,
      '--dgc-spinner-offset-0': circumference * .95,
      '--dgc-spinner-offset-50': circumference * .15,
    } as React.CSSProperties;

    return (
      <svg
        className='spinner'
        width={ `${ viewBoxSideLength }px` }
        height={ `${ viewBoxSideLength }px` }
        viewBox={ `0 0 ${ viewBoxSideLength } ${ viewBoxSideLength }` }
        style={ spinnerStyleVariables }
        xmlns='http://www.w3.org/2000/svg'
      >
        <circle
          className='path'
          stroke={ stroke }
          strokeWidth={ strokeWidth }
          cx={ circleCenter }
          cy={ circleCenter }
          r={ radius }
        />
      </svg>
    );
  }
}

export default Spinner;
