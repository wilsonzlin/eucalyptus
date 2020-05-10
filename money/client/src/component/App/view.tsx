import React from 'react';
import {Flex} from '../../ui/Layout/view';
import {RouteLink} from '../../ui/RouteLink/view';
import {Dataset} from '../Dataset/view';
import {Datasets} from '../Datasets/view';
import {Home} from '../Home/view';
import styles from './style.css';

export const App = () => {
  return (
    <div className={styles.app}>
      <div className={styles.banner}>
        <Flex space="start" align="centre">
          <RouteLink path="/">Home</RouteLink>
          <RouteLink path="/datasets">Datasets</RouteLink>
        </Flex>
      </div>

      <div className={styles.view}>
        <Home/>
        <Dataset/>
        <Datasets/>
      </div>
    </div>
  );
};
