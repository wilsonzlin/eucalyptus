import React, {ReactChild} from 'react';
import {cls} from '../../util/Classes';
import styles from './style.css';

type ButtonProps = {
  children: ReactChild | ReactChild[];
  submit?: boolean;
  type: 'primary' | 'secondary' | 'warning' | 'error';
  onClick?: () => void;
};

const Button = ({
  children,
  submit = false,
  type,
  onClick,
}: ButtonProps) => (
  <button
    type={submit ? 'submit' : 'button'}
    className={cls(styles.button, styles[type])}
    onClick={onClick}
  >{children}</button>
);

export const PrimaryButton = (props: Omit<ButtonProps, 'type'>) => Button({...props, type: 'primary'});
export const SecondaryButton = (props: Omit<ButtonProps, 'type'>) => Button({...props, type: 'secondary'});
