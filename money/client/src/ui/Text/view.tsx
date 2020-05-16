import {Moment} from 'moment';
import React from 'react';
import {cls} from '../../util/Classes';
import styles from './style.css';

export const Heading = ({
  children,
}: {
  children: string;
}) => (
  <h1>{children}</h1>
);

export const Subheading = ({
  children,
}: {
  children: string;
}) => (
  <h2>{children}</h2>
);

export const DateTime = ({
  timestamp,
}: {
  timestamp: Moment;
}) => (
  <time dateTime={timestamp.toISOString()} title={timestamp.toString()}>{timestamp.format('d MMM YYYY')}</time>
);

const formatExpense = (amount: number): string => {
  const prefix = amount < 0 ? '+' : '';
  const digits = Math.abs(amount).toString();
  const cents = digits.slice(-2);
  const dollars = digits.slice(0, -2);
  const parts = [];
  for (let end = dollars.length; end > 0; end -= 3) {
    parts.unshift(dollars.slice(Math.max(0, end - 3), end));
  }
  return `${prefix}${parts.join(',') || '0'}.${cents}`;
};

export const InlineExpense = ({
  cents,
}: {
  cents: number;
}) => (
  <span className={cls(cents > 0 ? styles.moneyNegative : cents == 0 ? styles.moneyNeutral : styles.moneyPositive)}>
    {formatExpense(cents)}
  </span>
);

export const Expense = ({
  cents,
}: {
  cents: number;
}) => (
  <div className={styles.expense}><InlineExpense cents={cents}/></div>
);

export const SubtleState = ({
  children,
}: {
  children: string;
}) => (
  <span className={styles.subtleState}>{children}</span>
);

export const Label = ({
  children,
}: {
  children: string;
}) => (
  <div className={styles.label}>{children}</div>
);
