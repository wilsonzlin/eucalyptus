import React, {createRef, ReactNode, useEffect, useState} from 'react';
import {mapDefined} from '../../util/Optional';
import {Dismissible} from '../Dismissible/view';
import styles from './style.css';

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

  const [containerTop, setContainerTop] = useState<number>(0);
  const [containerLeft, setContainerLeft] = useState<number>(0);

  useEffect(() => {
    if (!open) {
      return;
    }

    const {current: $p} = $pin;
    if (!$p) {
      return;
    }

    const {top, left} = $p.getBoundingClientRect();
    setContainerTop(top);
    setContainerLeft(left);
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
      <Dismissible<HTMLDivElement> onDismiss={onDismiss}>
        {ref => (
          <div ref={ref} className={styles.container} style={{
            top: `${containerTop}px`,
            left: `${containerLeft}px`,
            width: mapDefined(width, width => `${width}rem`),
            height: mapDefined(height, height => `${height}rem`),
          }}>
            {children}
          </div>
        )}
      </Dismissible>
    </div>
  );
};
