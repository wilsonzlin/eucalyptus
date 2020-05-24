import React from 'react';
import {service} from '../../service/Service';
import {Flex} from '../../ui/Layout/view';
import {RouteLink} from '../../ui/RouteLink/view';
import {useServiceFetch} from '../../util/ServiceFetch';
import {Categories} from '../Categories/view';
import {Dataset} from '../Dataset/view';
import {Datasets} from '../Datasets/view';
import {Explorer} from '../Explorer/view';
import {Home} from '../Home/view';
import {Settings} from '../Settings/view';
import styles from './style.css';

export const App = () => {
  const {data: name} = useServiceFetch<string>({
    fetcher: () => service.getName().then(({name}) => name),
    dependencies: [],
    defaultValue: '',
  });

  return (
    <div className={styles.app}>
      <Flex space="between" align="centre">
        <div>{name && `${name}'s `}Money</div>
        <Flex space="start" align="centre">
          <RouteLink path="/">Home</RouteLink>
          <RouteLink path="/categories">Categories</RouteLink>
          <RouteLink path="/datasets">Datasets</RouteLink>
          <RouteLink path="/explorer">Explorer</RouteLink>
          <RouteLink path="/settings">Settings</RouteLink>
        </Flex>
      </Flex>

      <div className={styles.view}>
        <Home/>
        <Categories/>
        <Dataset/>
        <Datasets/>
        <Explorer/>
        <Settings/>
      </div>
    </div>
  );
};
