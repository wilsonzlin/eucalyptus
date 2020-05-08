import React from 'react';
import {RouteView} from '../../ui/RouteView/view';

export const Home = ({}: {}) => (
  <RouteView route="/">
    {() => (
      <div>
        <h1>Home</h1>
      </div>
    )}
  </RouteView>
);
