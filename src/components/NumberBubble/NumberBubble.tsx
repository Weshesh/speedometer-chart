import React, { PureComponent } from 'react';
import classNames from 'classnames';
import './NumberBubble.styles.scss';
import Spinner from '../Spinner';
import CountUp from 'react-countup';

type NumberBubbleProps = {
  value?: number,
  bubbleSize: number,
  shouldShow: boolean,
  isLoading: boolean,
  error: boolean,
  suffix?: string,
};

class NumberBubble extends PureComponent<NumberBubbleProps> {

  static defaultProps = {
    bubbleSize: 56,
    children: '',
    isLoading: false,
    shouldShow: true,
    error: false,
  };

  private prevStart?: number;

  render() {
    const { bubbleSize, shouldShow, isLoading, error, suffix, value } = this.props;

    const roundedValue = value === undefined ? undefined : Math.round(value * 100) / 100;

    const classes = classNames({
      'dgc-number-bubble-container': true,
      'show': shouldShow,
    });

    const loaderClasses = classNames({
      'dgc-number-bubble-loader': true,
      'show': isLoading,
      'error': error,
    });

    const valueClasses = classNames({
      'dgc-number-bubble-value': true,
      'loading': isLoading,
      'error': error,
      'withValue': roundedValue !== undefined
    });

    return (
      <div className={ classes } style={{
        width: `${ bubbleSize }px`,
        height: `${ bubbleSize }px`,
      }}>
        <div className={ valueClasses }>
          {
            !error && roundedValue !== undefined
              ?
              <CountUp
                key={ value }
                end={ roundedValue }
                decimals={ value === 0 || roundedValue >= 1 ? 0 : roundedValue >= 0.1 ? 1 : 2 }
                start={ this.prevStart || 0 }
                duration={ 0.3 }
                suffix={ suffix || '' }
                onEnd={ () => { this.prevStart = roundedValue; } }
              />
              :
              error ?
                <svg width="25%" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.5 1L12.5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12.5 1L1.5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                : undefined

          }
        </div>
        <div className={ loaderClasses }>
          <Spinner size={ bubbleSize - 6 }/>
        </div>
      </div>
    );
  }
}

export default NumberBubble;
