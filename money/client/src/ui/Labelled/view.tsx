import React, {ReactChild} from 'react';
import {Label} from '../Text/view';
import styles from './style.css';

export const Labelled = ({
  label,
  children,
}: {
  label: string;
  children: ReactChild | ReactChild[];
}) => (
  <div className={styles.label}>
    <Label>{label}</Label>
    <div className={styles.content}>
      {children}
    </div>
  </div>
);
