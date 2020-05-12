import React, {ReactChild, useCallback, useState} from 'react';
import {camelCase, cls} from '../../util/Classes';
import {Flex} from '../Layout/view';
import {Label} from '../Text/view';
import styles from './style.css';

type RowProps = {
  cells: (ReactChild | ReactChild[])[];
  onSelect?: () => void;
  Expansion?: () => (ReactChild | ReactChild[]);
};

const Row = ({
  cells,
  onSelect,
  Expansion,
  widths,
}: RowProps & {
  widths: number[];
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [hovering, setHovering] = useState<boolean>(false);

  const rowClickHandler = useCallback(() => {
    if (onSelect) {
      onSelect();
      return;
    }
    if (Expansion) {
      setExpanded(!expanded);
    }
  }, [expanded]);

  const rowMouseOverHandler = useCallback(() => setHovering(true), []);
  const rowMouseOutHandler = useCallback(() => setHovering(false), []);

  return (
    <div className={cls(styles.rowContainer, hovering && styles.hovering)}>
      <div
        className={cls(styles.row, !!(Expansion || onSelect) && styles.selectable)}
        onClick={rowClickHandler}
        onMouseOver={rowMouseOverHandler}
        onMouseOut={rowMouseOutHandler}
      >
        <Flex>
          {cells.map((c, i) => (
            <div key={i} className={styles.cell} style={{width: `${widths[i] * 100}%`}}>{c}</div>
          ))}
        </Flex>
      </div>
      {expanded && (
        <div className={styles.rowExpansion}>
          {Expansion!()}
        </div>
      )}
    </div>
  );
};

export const Table = ({
  heading = true,
  spacing = 'normal',
  columns,
  rows,
}: {
  heading?: boolean;
  spacing?: 'sparse' | 'normal' | 'dense';
  columns: {
    label: string;
    width: number;
  }[];
  rows: (RowProps & { key: string | number })[];
}) => (
  <div className={cls(styles.table, styles[camelCase(`spacing-${spacing}`)])}>
    {heading && (
      <Flex>
        {columns.map((c, i) => (
          <div key={i} className={cls(styles.heading, styles.cell)} style={{width: `${c.width * 100}%`}}>
            <Label>{c.label}</Label>
          </div>
        ))}
      </Flex>
    )}
    <div className={styles.rows}>
      {rows.map(({key, ...r}) => (
        <Row key={key} widths={columns.map(c => c.width)} {...r}/>
      ))}
    </div>
  </div>
);
