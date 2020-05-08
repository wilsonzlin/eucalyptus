import React from 'react';
import {AssertionError} from '../../util/assert';

export function HiddenInput<T extends string | number | boolean> ({
  value,
}: {
  value: T;
}) {
  switch (typeof value) {
  case 'boolean':
    return <input hidden type="checkbox" checked={value}/>;
  case 'number':
    return <input hidden type="number" value={value}/>;
  case 'string':
    return <input hidden type="text" value={value}/>;
  default:
    throw new AssertionError();
  }
}
