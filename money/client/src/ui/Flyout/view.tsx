import React, {createRef, ReactNode, useEffect} from 'react';
import {mapDefined} from '../../util/Optional';
import styles from './style.css';

const EVENTS = ['resize', 'mousedown', 'wheel', 'touchstart', 'fullscreenchange', 'orientationchange', 'scroll'];

/**
 * Content that floats relative to some element and can be easily dismissed, like a context menu or dropdown list.
 * It will call the dismiss handler when interaction occurs outside it, such as clicking, resizing, or scrolling.
 *
 * The floating element has fixed positioning but stays within the DOM tree so that events and state (e.g. focus) can still be easily detected by parents.
 */
export const Floating = ({
  open,
  onDismiss,
  top,
  left,
  right,
  bottom,
  width,
  height,
  children,
}: {
  open: boolean;
  onDismiss: () => void;
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
    if (!open) {
      return;
    }

    const {current: $c} = $container;
    const {current: $p} = $pin;
    if (!$c || !$p) {
      return;
    }

    const outsideEventHandler = (e: Event) => {
      if (!$container.current?.contains(e.target as any)) {
        onDismiss();
      }
    };
    const unbindHandlers = () => {
      for (const e of EVENTS) {
        document.removeEventListener(e, outsideEventHandler, true);
      }
    };
    for (const e of EVENTS) {
      document.addEventListener(e, outsideEventHandler, true);
    }

    const {top, left} = $p.getBoundingClientRect();
    Object.assign($c.style, {
      top: `${top}px`,
      left: `${left}px`,
    });

    return () => unbindHandlers();
  });

  // Don't use a portal, as this component is often used with parents that require detecting whether focus is still inside them,
  // and a portal will cause this component to leave their DOM tree.
  return !open ? null : (
    <div ref={$pin} className={styles.pin} style={{
      top: mapDefined(top, top => `${top * 100}%`),
      left: mapDefined(left, left => `${left * 100}%`),
      right: mapDefined(right, right => `${right * 100}%`),
      bottom: mapDefined(bottom, bottom => `${bottom * 100}%`),
    }}>
      <div ref={$container} className={styles.container} style={{
        width: mapDefined(width, width => `${width}rem`),
        height: mapDefined(height, height => `${height}rem`),
      }}>
        {children}
      </div>
    </div>
  );
};
