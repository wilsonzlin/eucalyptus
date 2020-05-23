export class AssertionError extends Error {
}

export class UnreachableError extends AssertionError {
}

export const assertState = (chk: boolean, msg?: string): void => {
  if (!chk) {
    throw new AssertionError(msg);
  }
};

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

export const assertDefined = <V> (val: V | undefined): V => {
  if (val === undefined) {
    throw new AssertionError();
  }
  return val;
};

export const assertIndexOf = (idx: number): number => {
  if (idx < 0) {
    throw new AssertionError('indexOf failed');
  }
  return idx;
};
