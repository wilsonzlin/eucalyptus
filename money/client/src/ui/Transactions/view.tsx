import {Moment} from 'moment';
import React from 'react';
import {categoryIDStore, MTransaction, MTransactionPart, service} from '../../service/Service';
import {useServiceFetch} from '../../util/ServiceFetch';
import {PrimaryButton} from '../Button/view';
import {IDInput} from '../IDInput/view';
import {IndependentInput} from '../IndependentInput/view';
import {Labelled} from '../Labelled/view';
import {Flex, Margin} from '../Layout/view';
import {ModifiableDisplayValue} from '../ModifiableDisplayValue/view';
import {NumberInput} from '../NumberInput/view';
import {Table} from '../Table/view';
import {DateTime, Expense, SubtleState} from '../Text/view';
import {TextInput} from '../TextInput/view';
import styles from './style.css';

const TransactionCommentTextInput = ({
  value, onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <TextInput lines={5} columns={50} value={value} onChange={onChange}/>
);

const CommentIndependentInput = ({
  initialValue,
  Input,
  onChange,
}: {
  initialValue: string;
  Input: (props: { value: string, onChange: (value: string) => void }) => JSX.Element;
  onChange: (value: string) => Promise<any>;
}) => (
  <IndependentInput<string>
    initialValue={initialValue}
    onChange={onChange}
    Input={({value, onChange}) => (
      <ModifiableDisplayValue<string>
        value={value}
        onChange={onChange}
        Input={Input}
      >
        {value || <SubtleState>No comment</SubtleState>}
      </ModifiableDisplayValue>
    )}
  />
);

const TransactionDetails = ({
  transaction: {
    id,
    comment,
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
        <Labelled label="Comment">
          <CommentIndependentInput
            initialValue={comment}
            Input={TransactionCommentTextInput}
            onChange={comment => service.updateTransaction({transaction: id, comment})}
          />
        </Labelled>
        <Labelled label="Transaction amount">
          <Expense cents={transaction_amount}/>
        </Labelled>
      </Flex>

      <Margin height={1}/>

      <Labelled label="Parts">
        <Table
          spacing="dense"
          columns={[
            {width: 0.5, label: 'Comment'},
            {width: 0.25, label: 'Category'},
            {width: 0.25, label: 'Amount'},
          ]}
          rows={parts.map(p => ({
            key: p.id,
            cells: [
              <CommentIndependentInput
                initialValue={p.comment}
                Input={TextInput}
                onChange={comment => service.updateTransactionPart({transactionPart: p.id, comment})}
              />,
              <IndependentInput<number | undefined>
                initialValue={p.category_id ?? undefined}
                onChange={val => service.updateTransactionPart({transactionPart: p.id, category: val ?? null})}
                Input={({value, onChange}) => (
                  <IDInput
                    idStore={categoryIDStore}
                    multiple={false}
                    value={value}
                    onChange={onChange}
                  />
                )}
              />,
              <IndependentInput<number>
                initialValue={p.amount}
                onChange={amount => service.updateTransactionPart({transactionPart: p.id, amount})}
                Input={({value, onChange}) => (
                  <ModifiableDisplayValue<number>
                    value={value}
                    onChange={onChange}
                    Input={NumberInput}
                  >
                    <Expense cents={value}/>
                  </ModifiableDisplayValue>
                )}
              />,
            ],
          }))}
        />
        <PrimaryButton size="small" onClick={() => service.createTransactionPart({
          transaction: id,
          comment: 'New transaction part',
          amount: 0,
        })}>Add part</PrimaryButton>
      </Labelled>
    </div>
  );
};

export const Transactions = ({
  from,
  to,
  dataset,
  category,
}: {
  from?: Moment;
  to?: Moment;
  dataset?: number;
  category?: number;
}) => {
  const {data: transactions} = useServiceFetch<MTransaction[]>({
    fetcher: () => service.getTransactions({from, to, dataset, category}).then(({transactions}) => transactions),
    initial: [],
    dependencies: [from, to, dataset, category],
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
