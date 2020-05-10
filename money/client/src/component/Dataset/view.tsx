import React from 'react';
import {MDataset, service} from '../../service/Service';
import {MaybeErrorAlert} from '../../ui/Alert/view';
import {OptionalView} from '../../ui/OptionalView/view';
import {useRoute} from '../../ui/RouteView/view';
import {Heading} from '../../ui/Text/view';
import {Transactions} from '../../ui/Transactions/view';
import {mapDefined} from '../../util/Optional';
import {useServiceFetch} from '../../util/ServiceFetch';

export const Dataset = ({}: {}) => {
  const pathParameters = useRoute<{ id: number }>('/dataset/id:i');

  const {data: dataset, loading, error} = useServiceFetch<MDataset | undefined>({
    fetcher: async () => mapDefined(pathParameters?.id, dataset => service.getDataset({dataset})),
    initial: undefined,
    dependencies: [pathParameters?.id],
  });

  return !pathParameters ? null : (
    <OptionalView props={dataset}>
      {({id, comment, source_name}) => (
        <div>
          <Heading>{source_name}</Heading>
          <p>{comment}</p>
          <MaybeErrorAlert>{error}</MaybeErrorAlert>
          <Transactions
            dataset={id}
          />
        </div>
      )}
    </OptionalView>
  );
};
