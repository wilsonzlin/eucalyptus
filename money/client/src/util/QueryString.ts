import {isMoment, Moment} from 'moment';

export type QueryParamSingleValue = string | boolean | number | Moment | undefined;

export type QueryParamValue = QueryParamSingleValue | QueryParamSingleValue[];

const encodeQueryParamValue = (value: QueryParamValue): string => {
  switch (typeof value) {
  case 'string':
    return encodeURIComponent(value);
  case 'number':
    return value.toString();
  case 'boolean':
    return value ? '1' : '0';
  case 'object':
    if (isMoment(value)) {
      return value.unix().toString();
    }
    // Fall through.
  default:
    throw new TypeError(`Cannot encode ${value} as query parameter value`);
  }
};

export const encodeQueryParamPairs = (pairs: [string, QueryParamValue][]) => {
  pairs = pairs.filter(([_, value]) => value != undefined);
  if (!pairs.length) {
    return '';
  }
  return '?' + pairs
    .flatMap(([name, value]) => Array<QueryParamSingleValue>()
      .concat(value)
      .map(v => `${encodeURIComponent(name)}=${encodeQueryParamValue(v)}`),
    )
    .join('&');
};

export type QueryParams = { [name: string]: QueryParamValue } | Map<string, QueryParamValue> | [string, QueryParamValue][];

export const encodeQuery = (params: QueryParams | undefined) => {
  return encodeQueryParamPairs(
    !params ? []
      : Array.isArray(params) ? params
      : params instanceof Map ? [...params.entries()]
        : Object.entries(params),
  );
};
