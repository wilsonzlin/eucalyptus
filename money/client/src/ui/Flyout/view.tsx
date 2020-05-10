import React, {createRef, ReactNode, useEffect} from 'react';
import {createPortal} from 'react-dom';
import {mapDefined} from '../../util/Optional';
import styles from './style.css';

export const Flyout = ({
  open,
  top,
  left,
  right,
  bottom,
  width,
  height,
  children,
}: {
  open: boolean;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  width?: number;
  height?: number;
  children: ReactNode;
}) => {
  const $pin = createRef<HTMLDivElement>();
  const $container = createRef<HTMLDivElement>();

  useEffect(() => {
    const {current: $c} = $container;
    const {current: $p} = $pin;
    if (!$c || !$p) {
      return;
    }

    const {top, left} = $p.getBoundingClientRect();
    Object.assign($c.style, {
      top: `${top}px`,
      left: `${left}px`,
    });
  });

  return !open ? null : (
    <div ref={$pin} className={styles.pin} style={{
      top: mapDefined(top, top => `${top * 100}%`),
      left: mapDefined(left, left => `${left * 100}%`),
      right: mapDefined(right, right => `${right * 100}%`),
      bottom: mapDefined(bottom, bottom => `${bottom * 100}%`),
    }}>
      {createPortal(
        <div ref={$container} className={styles.container} style={{
          width: mapDefined(width, width => `${width}rem`),
          height: mapDefined(height, height => `${height}rem`),
        }}>
          {children}
        </div>,
        document.body,
      )}
    </div>
  );
};
