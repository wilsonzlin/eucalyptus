import React from 'react';
import {RouteLink} from '../../ui/RouteLink/view';
import {Datasets} from '../Datasets/view';
import {Home} from '../Home/view';
import styles from './style.css';

export const App = () => {
  return (
    <div className={styles.app}>
      <div className={styles.banner}>
        <div className={styles.menu}>
          <RouteLink path="/">Home</RouteLink>
          <RouteLink path="/datasets">Datasets</RouteLink>
        </div>
      </div>

      <div className={styles.view}>
        <Home/>
        <Datasets/>
      </div>
    </div>
  );
};
