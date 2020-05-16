import React, {useState} from 'react';
import {MCategory, service} from '../../service/Service';
import {SecondaryButton} from '../../ui/Button/view';
import {Dismissible} from '../../ui/Dismissible/view';
import {Flex, Margin} from '../../ui/Layout/view';
import {RouteView} from '../../ui/RouteView/view';
import {useServiceFetch} from '../../util/ServiceFetch';
import styles from './style.css';

const depthStyle = (depth: number) => ({
  marginLeft: `${depth}rem`,
});

const Category = ({
  category,
}: {
  category: MCategory;
}) => {
  const [controlsOpen, setControlsOpen] = useState<boolean>();

  return (
    <Dismissible<HTMLDivElement> onDismiss={() => setControlsOpen(false)}>
      {ref => (
        <div ref={ref} style={depthStyle(category.depth)}>
          <div className={styles.name} onMouseDown={() => setControlsOpen(true)}>{category.name}</div>
          {controlsOpen && (
            <div className={styles.controls}>
              <Flex space="end" align="centre">
                <SecondaryButton size="small" href={`#/explorer?category=${category.id}`}>View transactions</SecondaryButton>
                <Margin width={0.325}/>
                <SecondaryButton size="small">Add category before</SecondaryButton>
                <Margin width={0.325}/>
                <SecondaryButton size="small">Add subcategory</SecondaryButton>
                <Margin width={0.325}/>
                <SecondaryButton size="small">Add category after</SecondaryButton>
              </Flex>
            </div>
          )}
        </div>
      )}
    </Dismissible>
  );
};

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
            <Category key={c.id} category={c}/>
          ))}
        </div>
      )}
    </RouteView>
  );
};
