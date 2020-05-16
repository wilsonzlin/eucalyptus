import React, {ReactChild} from 'react';
import {cls} from '../../util/Classes';
import styles from './style.css';

type ButtonProps = {
  children: ReactChild | ReactChild[];
  submit?: boolean;
  href?: string;
  route?: string;
  style: 'primary' | 'secondary' | 'cautious' | 'dangerous';
  size?: 'large' | 'medium' | 'small';
  onClick?: () => void;
};

const Button = ({
  children,
  submit = false,
  href,
  route,
  style,
  size = 'medium',
  onClick,
}: ButtonProps) => {
  const Element = href != undefined || route != undefined ? 'a' : 'button';

  return (
    <Element
      href={route ? `#${route}` : href}
      type={submit ? 'submit' : 'button'}
      className={cls(styles.button, styles[style], styles[size])}
      onClick={onClick}
    >{children}</Element>
  );
};

export const PrimaryButton = (props: Omit<ButtonProps, 'style'>) => Button({...props, style: 'primary'});

export const SecondaryButton = (props: Omit<ButtonProps, 'style'>) => Button({...props, style: 'secondary'});
