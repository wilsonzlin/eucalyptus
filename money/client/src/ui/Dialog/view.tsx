import React, {ReactChild} from 'react';
import {Modal} from '../Modal/view';
import styles from './styles.css';

export const Dialog = ({
  open,
  title,
  children,
}: {
  open: boolean;
  title: string;
  children: ReactChild | ReactChild[];
}) => (
  <Modal open={open}>
    <div className={styles.dialog}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.content}>{children}</div>
    </div>
  </Modal>
);
