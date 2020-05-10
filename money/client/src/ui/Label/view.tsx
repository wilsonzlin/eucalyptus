import React, {ReactChild} from 'react';
import styles from './style.css';

export const Label = ({
  label,
  children,
}: {
  label: string;
  children: ReactChild | ReactChild[];
}) => (
  <div className={styles.label}>
    <div className={styles.text}>{label}</div>
    <div className={styles.content}>
      {children}
    </div>
  </div>
);
