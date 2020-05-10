import React from 'react';
import {RouteView} from '../../ui/RouteView/view';
import {Heading} from '../../ui/Text/view';

export const Home = ({}: {}) => (
  <RouteView route="/">
    {() => (
      <div>
        <Heading>Home</Heading>
      </div>
    )}
  </RouteView>
);
