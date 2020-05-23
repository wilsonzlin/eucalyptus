export const mapDefined = <V, R> (val: V | undefined, mapper: (val: V) => R): R | undefined => val === undefined ? undefined : mapper(val);

export const exists = <V> (val: V | null | undefined): val is V => val != undefined;
