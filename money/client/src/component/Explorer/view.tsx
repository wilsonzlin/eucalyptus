import React from 'react';
import {OptionalView} from '../../ui/OptionalView/view';
import {useRoute} from '../../ui/RouteView/view';
import {Transactions} from '../../ui/Transactions/view';

export const Explorer = ({}: {}) => {
  const args: {
    from?: number;
    to?: number;
    category?: number;
  } = useRoute('/explorer?from=from:i&to=to:i&category=category:i');

  return (
    <OptionalView props={args}>
      {props => (
        <Transactions
          category={props.category}
        />
      )}
    </OptionalView>
  );
};
