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

export const InlineExpense = ({
  cents,
}: {
  cents: number;
}) => (
  <span className={cls(cents > 0 ? styles.moneyNegative : cents == 0 ? styles.moneyNeutral : styles.moneyPositive)}>
    {cents < 0 && '+'}{(Math.abs(cents) / 100).toFixed(2)}
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
