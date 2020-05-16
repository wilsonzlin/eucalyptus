export class AssertionError extends Error {
}

export class UnreachableError extends AssertionError {
}

export const assertInstanceOf = <V> (val: unknown, type: new (...args: any[]) => V): V => {
  if (!(val instanceof type)) {
    throw new AssertionError();
  }
  return val;
};

export const assertExists = <V> (val: V | null | undefined): V => {
  if (val == undefined) {
    throw new AssertionError();
  }
  return val;
};
