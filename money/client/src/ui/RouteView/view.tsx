import {useCallback, useEffect, useMemo, useState} from 'react';

type RouteComponent = {
  name: string;
  parameter?: 'string' | 'integer' | 'number';
};

type PathParameters = { [name: string]: string | number };

const parseRoute = (route: string): RouteComponent[] => {
  return route.split('/').filter(p => p).map(raw => {
    const [name, type] = raw.split(':');
    return {
      name,
      parameter: {
        '': undefined,
        'i': 'integer',
        'n': 'number',
        's': 'string',
      }[type],
    };
  });
};

const matchRoute = (path: string, route: RouteComponent[]): PathParameters | undefined => {
  const pathParameters: PathParameters = {};
  const pathComponents = path.split('/').filter(p => p);
  if (pathComponents.length !== route.length) {
    return undefined;
  }

  for (const [i, pathComponent] of pathComponents.entries()) {
    const {name, parameter} = route[i];
    switch (parameter) {
    case undefined:
      if (name !== pathComponent) {
        return undefined;
      }
      break;

    case 'string':
      pathParameters[name] = pathComponent;
      break;

    case 'integer':
      const asInteger = Number.parseInt(pathComponent, 10);
      if (!Number.isSafeInteger(asInteger)) {
        return undefined;
      }
      pathParameters[name] = asInteger;
      break;

    case 'number':
      const asNumber = Number.parseFloat(pathComponent);
      if (!Number.isFinite(asNumber)) {
        return undefined;
      }
      pathParameters[name] = asNumber;
      break;
    }
  }

  return pathParameters;
};

export function useRoute<T extends PathParameters>(route: string): T {
  const routeComponents = useMemo(() => parseRoute(route), [route]);

  const [pathParameters, setPathParameters] = useState<PathParameters | undefined>();

  const hashChangeHandler = useCallback(() => setPathParameters(matchRoute(location.hash.slice(1), routeComponents)), []);

  useEffect(() => {
    window.addEventListener('hashchange', hashChangeHandler);
    hashChangeHandler();
    return () => window.removeEventListener('hashchange', hashChangeHandler);
  }, [hashChangeHandler]);

  return pathParameters as any;
}

export function RouteView<T extends PathParameters>({
  route,
  children,
}: {
  route: string;
  children: (params: T) => JSX.Element;
}) {
  const pathParameters = useRoute<T>(route);
  return pathParameters ? children(pathParameters) : null;
}
