import React from 'react';
import {categoryIDStore, MTransaction, MTransactionPart, service} from '../../service/Service';
import {useServiceFetch} from '../../util/ServiceFetch';
import {IDInput} from '../IDInput/view';
import {IndependentInput} from '../IndependentInput/view';
import {Label} from '../Label/view';
import {Flex, Margin} from '../Layout/view';
import {Table} from '../Table/view';
import {DateTime, Expense, SubtleState} from '../Text/view';
import {TextInput} from '../TextInput/view';
import styles from './style.css';

const TransactionDetails = ({
  transaction: {
    id,
    timestamp,
    description,
    combined_amount,
    comment,
    combined_categories,
    malformed,
    transaction_amount,
  },
}: {
  transaction: MTransaction;
}) => {
  const {data: parts, refresh: refreshParts} = useServiceFetch<MTransactionPart[]>({
    fetcher: () => service.getTransactionParts({transaction: id}).then(({parts}) => parts),
    initial: [],
    dependencies: [id],
  });

  return (
    <div className={styles.transactionDetails}>
      <Flex>
        <Label label="Comment">
          <TextInput lines={5} columns={50} value={comment} onChange={() => void 0}/>
        </Label>
        <Label label="Transaction amount">
          <Expense cents={transaction_amount}/>
        </Label>
      </Flex>

      <Margin height={1}/>

      <Label label="Parts">
        <Table
          heading={false}
          spacing="dense"
          columns={[
            {width: 0.5, label: 'Comment'},
            {width: 0.25, label: 'Category'},
            {width: 0.25, label: 'Amount'},
          ]}
          rows={parts.map(p => ({
            key: p.id,
            cells: [
              <div>{p.comment || <SubtleState>No comment</SubtleState>}</div>,
              <IndependentInput<number | undefined>
                initialValue={undefined}
                onChange={async (val) => void 0 /* TODO */}
                Input={({value, onChange}) => (
                  <IDInput
                    idStore={categoryIDStore}
                    multiple={false}
                    value={value}
                    onChange={onChange}
                  />
                )}
              />,
              <Expense cents={p.amount}/>,
            ],
          }))}
        />
      </Label>
    </div>
  );
};

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
    <Table
      columns={[
        {width: 0.2, label: 'Time'},
        {width: 0.65, label: 'Description'},
        {width: 0.15, label: 'Amount'},
      ]}
      rows={transactions.map(t => ({
        key: t.id,
        cells: [
          <DateTime timestamp={t.timestamp}/>,
          t.description,
          <Expense cents={t.combined_amount}/>,
        ],
        Expansion: () => (
          <TransactionDetails transaction={t}/>
        ),
      }))}
    />
  );
};