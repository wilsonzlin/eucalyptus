import React from 'react';
import {MTransaction, service} from '../../service/Service';
import {useServiceFetch} from '../../util/ServiceFetch';
import styles from './style.css';

export const Transactions = ({
  year,
  month,
  dataset,
}: {
  year?: number;
  month?: number;
  dataset?: number;
}) => {
  const {data: transactions} = useServiceFetch<MTransaction[]>({
    fetcher: () => service.getTransactions({year, month, dataset}).then(({transactions}) => transactions),
    initial: [],
    dependencies: [year, month, dataset],
  });

  return (
    <div className={styles.transactions}>
      <div className={styles.headings}>
        <div className={styles.heading}>Time</div>
        <div className={styles.heading}>Description</div>
      </div>
      <div className={styles.body}>
        {transactions.map(t => (
          <div key={t.id}>
            <div>{t.timestamp}</div>
            <div>{t.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
