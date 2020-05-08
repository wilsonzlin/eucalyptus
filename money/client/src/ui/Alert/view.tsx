import React, {ReactChild} from 'react';
import {cls} from '../../util/Classes';
import styles from './style.css';

type AlertProps = {
  children: ReactChild | ReactChild[];
  type: 'error' | 'warning' | 'info';
};

const Alert = ({
  children,
  type,
}: AlertProps) => (
  <div className={cls(styles.alert, styles[type])}>
    {children}
  </div>
);

export const ErrorAlert = (props: Omit<AlertProps, 'type'>) => Alert({...props, type: 'error'});

export const MaybeErrorAlert = (props: Omit<AlertProps, 'type'> & { children: string }) => props.children ? ErrorAlert(props) : null;

export const InfoAlert = (props: Omit<AlertProps, 'type'>) => Alert({...props, type: 'info'});
