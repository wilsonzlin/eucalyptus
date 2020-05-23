import moment from 'moment';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {assertExists, UnreachableError} from '../../util/Assert';

type RouteComponent = {
  name: string;
  parameter?: 'datetime' | 'string' | 'integer' | 'number';
  isArray: boolean;
};

const parseRouteComponent = (raw: string): RouteComponent => {
  const [_, name, type, arraySuffix] = assertExists(/^([a-zA-Z0-9_]+):?([a-z]?)((?:\[])?)$/.exec(raw));
  return {
    name,
    parameter: {
      '': undefined,
      'd': 'datetime',
      'i': 'integer',
      'n': 'number',
      's': 'string',
    }[type],
    isArray: !!arraySuffix,
  };
};

type Route = {
  path: RouteComponent[];
  query: { [param: string]: RouteComponent };
}

const parseRoute = (routeRaw: string): Route => {
  const [path, query = ''] = routeRaw.split('?');

  return {
    path: path.split('/').filter(p => p).map(parseRouteComponent),
    query: Object.fromEntries(
      query
        .split('&')
        .filter(p => p)
        .map(c => c.split('='))
        .map(([name, v]) => [name, parseRouteComponent(v)]),
    ),
  };
};

type RouteArguments = { [name: string]: any };

const parsePathComponent = (valueRaw: string, type: RouteComponent['parameter']) => {
  switch (type) {
  case 'datetime':
    const asMoment = moment.unix(Number.parseInt(valueRaw, 10));
    if (!asMoment.isValid()) {
      return undefined;
    }
    return asMoment;

  case 'string':
    return valueRaw;

  case 'integer':
    const asInteger = Number.parseInt(valueRaw, 10);
    if (!Number.isSafeInteger(asInteger)) {
      return undefined;
    }
    return asInteger;

  case 'number':
    const asNumber = Number.parseFloat(valueRaw);
    if (!Number.isFinite(asNumber)) {
      return undefined;
    }
    return asNumber;

  default:
    throw new UnreachableError();
  }
};

const matchRoute = (urlRaw: string, route: Route): RouteArguments | undefined => {
  const pathParameters: RouteArguments = {};
  const [pathRaw, queryRaw = ''] = urlRaw.split('?');
  // Don't use map as there could be duplicate parameter names for a list.
  const query = queryRaw
    .split('&')
    .filter(p => p)
    .map(p => p.split('='))
    .map(([name, value = '']) => [decodeURIComponent(name), decodeURIComponent(value)]);
  const pathComponents = pathRaw.split('/').filter(p => p).map(p => decodeURIComponent(p));
  if (pathComponents.length !== route.path.length) {
    return undefined;
  }

  for (const [i, pathComponent] of pathComponents.entries()) {
    const {name, parameter} = route.path[i];
    if (parameter === undefined) {
      if (pathComponent !== name) {
        return undefined;
      }
      continue;
    }
    const value = parsePathComponent(pathComponent, parameter);
    if (value === undefined) {
      return undefined;
    }
    pathParameters[name] = value;
  }

  for (const [name, valueRaw] of query) {
    const param = route.query[name];
    if (!param) {
      continue;
    }
    const value = parsePathComponent(valueRaw, param.parameter);
    if (value == undefined) {
      continue;
    }
    if (param.isArray) {
      if (!pathParameters[param.name]) {
        pathParameters[param.name] = [];
      }
      pathParameters[param.name].push(value);
    } else {
      pathParameters[param.name] = value;
    }
  }

  return pathParameters;
};

export function useRoute<T extends RouteArguments> (routeRaw: string): T {
  const route = useMemo(() => parseRoute(routeRaw), [routeRaw]);

  const [pathParameters, setPathParameters] = useState<RouteArguments | undefined>();

  const hashChangeHandler = useCallback(() => setPathParameters(matchRoute(location.hash.slice(1), route)), []);

  useEffect(() => {
    window.addEventListener('hashchange', hashChangeHandler);
    hashChangeHandler();
    return () => window.removeEventListener('hashchange', hashChangeHandler);
  }, [hashChangeHandler]);

  return pathParameters as any;
}

export function RouteView<T extends RouteArguments> ({
  route,
  children,
}: {
  route: string;
  children: (params: T) => JSX.Element;
}) {
  const pathParameters = useRoute<T>(route);
  return pathParameters ? children(pathParameters) : null;
}
