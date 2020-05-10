import moment, {isMoment, Moment} from 'moment';
import {IDStore} from '../ui/IDInput/view';

export type MTransactionPart = {
  id: number;
  comment: string;
  amount: number;
  category_id: number;
  category_name: number;
}

export type MTransaction = {
  id: number;
  comment: string;
  malformed: boolean;
  timestamp: Moment;
  description: string;
  transaction_amount: number;
  combined_amount: number;
  combined_categories: { id: number; name: string; }[];
};

export type MDataset = {
  id: number;
  source_id: number;
  source_name: string;
  comment: string;
  created: Moment;
};

export type MDatasetSource = {
  id: number;
  name: string;
};

// Query parameters and JSON object body properties might have Moment values, so serialise them to UNIX timestamps as accepted by server.
const serialiseDateTime = (val: Moment) => val.unix();

// Server JSON object response bodies might have DateTime values, so deserialise them to Moment instances.
function maybeDeserialiseDateTime (this: any, key: string, val: any) {
  if (key.startsWith('_ts:')) {
    this[key.slice(4)] = moment.unix(val);
  } else {
    return val;
  }
}

type QueryParamValue = string | boolean | number | Moment | undefined;

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
      return serialiseDateTime(value).toString();
    }
    // Fall through.
  default:
    throw new TypeError(`Cannot encode ${value} as query parameter value`);
  }
};

const encodeQueryParamPair = ([name, value]: [string, QueryParamValue]) => value == undefined
  ? ''
  : `${encodeURIComponent(name)}=${encodeQueryParamValue(value)}`;

const encodeQueryParamPairs = (pairs: [string, QueryParamValue][]) => {
  pairs = pairs.filter(([_, value]) => value != undefined);
  return !pairs.length
    ? ''
    : `?${pairs.map(encodeQueryParamPair).join('&')}`;
};

export class ServiceError extends Error {
  private readonly status: number;

  constructor (status: number, message: string) {
    super(message);
    this.status = status;
  }

  isClient () {
    return this.status >= 400 && this.status < 500;
  }
}

class Service {
  constructor (
    private readonly prefix: string,
  ) {
  }

  private makeRequest<T> ({
    method,
    path,
    query,
    body,
  }: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    query?: { [name: string]: QueryParamValue } | Map<string, QueryParamValue> | [string, QueryParamValue][];
    body?: object | File;
  }): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const qs = encodeQueryParamPairs(
        !query
          ? []
          : Array.isArray(query)
          ? query
          : query instanceof Map
            ? [...query.entries()]
            : Object.entries(query),
      );
      xhr.open(method, `${this.prefix}${path}${qs}`, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          const {status, responseText} = xhr;
          if (status >= 200 && status < 300) {
            resolve(JSON.parse(responseText, maybeDeserialiseDateTime));
          } else {
            reject(new ServiceError(xhr.status, responseText == null ? 'Failed to send request' : responseText));
          }
        }
      };
      if (body instanceof File) {
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.send(body);
      } else if (!body) {
        xhr.send(null);
      } else {
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(body, (_, value) => isMoment(value) ? serialiseDateTime(value) : value));
      }
    });
  }

  async createDatasetSource ({
    name,
    comment,
  }: {
    name: string;
    comment: string;
  }): Promise<{
    id: number;
  }> {
    return this.makeRequest({
      method: 'POST',
      path: '/dataset_sources',
      body: {name, comment},
    });
  }

  async getDatasetSources (): Promise<{
    sources: MDatasetSource[];
  }> {
    return this.makeRequest({
      method: 'GET',
      path: '/dataset_sources',
    });
  }

  async createDataset ({
    source,
    timestampColumn,
    timestampFormat,
    descriptionColumn,
    amountColumn,
    data,
  }: {
    source: number;
    timestampColumn: number;
    timestampFormat: string;
    descriptionColumn: number;
    amountColumn: number;
    data: File,
  }): Promise<{
    id: number;
  }> {
    return this.makeRequest({
      method: 'POST',
      path: `/dataset_source/${source}/datasets`,
      query: {
        timestamp_column: timestampColumn,
        timestamp_format: timestampFormat,
        description_column: descriptionColumn,
        amount_column: amountColumn,
      },
      body: data,
    });
  }

  async getDatasets (): Promise<{
    datasets: MDataset[];
  }> {
    return await this.makeRequest<any>({
      method: 'GET',
      path: `/datasets`,
    });
  }

  async getDataset ({
    dataset,
  }: {
    dataset: number;
  }): Promise<MDataset> {
    return this.makeRequest<any>({
      method: 'GET',
      path: `/dataset/${dataset}`,
    });
  }

  async createCategory ({
    name,
    target,
    mode,
  }: {
    name: string;
    target?: number;
    mode: 'after' | 'before' | 'first' | 'root';
  }): Promise<{
    id: number;
  }> {
    return this.makeRequest({
      method: 'POST',
      path: '/categories',
      body: {name, target, mode},
    });
  }

  async suggestCategories ({
    query,
  }: {
    query: string;
  }): Promise<{
    suggestions: { id: number; label: string; }[];
  }> {
    return this.makeRequest({
      method: 'GET',
      path: '/categories',
      query: {
        suggestions_query: query,
      },
    });
  }

  async getTransactions ({
    year,
    month,
    dataset,
  }: {
    year?: number;
    month?: number;
    dataset?: number;
  }): Promise<{
    transactions: MTransaction[];
  }> {
    return await this.makeRequest<any>({
      method: 'GET',
      path: `/transactions`,
      query: {year, month, dataset},
    });
  }

  async updateTransaction ({
    transaction,
    comment,
    timestamp,
    description,
    amount,
  }: {
    transaction: number;
    comment?: string;
    timestamp?: Moment;
    description?: string;
    amount?: number;
  }): Promise<{}> {
    return this.makeRequest({
      method: 'PATCH',
      path: `/transaction/${transaction}`,
      body: {comment, timestamp, description, amount},
    });
  }

  async deleteTransaction ({
    transaction,
  }: {
    transaction: number;
  }): Promise<{}> {
    return this.makeRequest({
      method: 'DELETE',
      path: `/transaction/${transaction}`,
    });
  }

  async createTransactionPart ({
    transaction,
    comment,
    amount,
    category,
  }: {
    transaction: number;
    comment: string;
    amount: number;
    category?: number;
  }): Promise<{
    id: number;
  }> {
    return this.makeRequest({
      method: 'POST',
      path: `/transaction/${transaction}/parts`,
      body: {comment, amount, category},
    });
  }

  async getTransactionParts ({
    transaction,
  }: {
    transaction: number;
  }): Promise<{
    parts: MTransactionPart[];
  }> {
    return this.makeRequest({
      method: 'GET',
      path: `/transaction/${transaction}/parts`,
    });
  }
}

export const service = new Service('');

export const categoryIDStore = new IDStore(query => service.suggestCategories({query}).then(({suggestions}) => suggestions));
