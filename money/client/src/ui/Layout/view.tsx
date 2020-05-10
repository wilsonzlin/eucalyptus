import React, {ReactChild, ReactNode} from 'react';
import {camelCase, cls} from '../../util/Classes';
import {mapDefined} from '../../util/Optional';
import styles from './style.css';

export const Flex = ({
  children,
  align = 'stretch',
  flow = 'right',
  space = 'between',
  overflow = 'auto',
}: {
  children: ReactNode;
  align?: 'stretch' | 'centre' | 'start' | 'end';
  flow?: 'up' | 'down' | 'left' | 'right';
  space?: 'between' | 'around' | 'even' | 'start' | 'end' | 'sides';
  overflow?: 'hidden' | 'auto' | 'scroll' | 'forward' | 'reverse';
}) => (
  <div className={cls(
    styles.flex,
    styles[camelCase(`align-${align}`)],
    styles[camelCase(`flow-${flow}`)],
    styles[camelCase(`space-${space}`)],
    styles[camelCase(`overflow-${overflow}`)],
  )}>
    {children}
  </div>
);

export const FlexItem = ({
  priority,
}: {
  priority: number;
}) => (
  <div style={{
    flexGrow: priority > 0 ? priority : undefined,
    flexShrink: priority < 0 ? -priority : undefined,
  }}/>
);

export const Spacer = ({}: {}) => (
  <div className={styles.spacer}/>
);

export const Margin = (props: { height: number; } | { width: number; }) => (
  <div style={{
    height: mapDefined(props['height'], h => `${h}rem`) ?? '100%',
    width: mapDefined(props['width'], w => `${w}rem`) ?? '100%',
  }}/>
);
