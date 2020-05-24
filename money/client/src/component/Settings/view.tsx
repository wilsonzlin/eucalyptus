import React from 'react';
import {service} from '../../service/Service';
import {IndependentInput} from '../../ui/IndependentInput/view';
import {Labelled} from '../../ui/Labelled/view';
import {RouteView} from '../../ui/RouteView/view';
import {Heading} from '../../ui/Text/view';
import {TextInput} from '../../ui/TextInput/view';

export const Settings = ({}: {}) => {
  return (
    <RouteView route="/settings">
      {() => (
        <div>
          <Heading>Settings</Heading>
          <Labelled label="Name">
            <IndependentInput
              initialValue={() => service.getName().then(({name}) => name)}
              onChange={name => service.setName({name})}
              Input={TextInput}
            />
          </Labelled>
        </div>
      )}
    </RouteView>
  );
};
