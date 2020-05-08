import React from 'react';
import {createPortal} from 'react-dom';
import styles from './style.css';

export const Modal = ({
  open,
  children,
}: {
  open: boolean;
  children: JSX.Element;
}) => {
  return !open ? null : createPortal(
    <div className={styles.modal}>
      <div className={styles.contentContainer}>
        {children}
      </div>
    </div>,
    document.body,
  );
};
