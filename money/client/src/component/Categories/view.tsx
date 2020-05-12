import React from 'react';
import {MCategory, service} from '../../service/Service';
import {RouteView} from '../../ui/RouteView/view';
import {useServiceFetch} from '../../util/ServiceFetch';

export const Categories = ({}: {}) => {
  const {data: categories} = useServiceFetch<MCategory[]>({
    fetcher: () => service.getCategories().then(({categories}) => categories),
    initial: [],
    dependencies: [],
  });

  return (
    <RouteView route="/categories">
      {() => (
        <div>
          {categories.map(c => (
            <div key={c.id} style={{
              paddingLeft: `${c.depth}rem`,
            }}>{c.name}</div>
          ))}
        </div>
      )}
    </RouteView>
  );
};
