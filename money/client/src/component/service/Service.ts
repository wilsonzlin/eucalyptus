import moment, {Moment} from 'moment';

type QueryParamValue = string | boolean | number;

const encodeQueryParamValue = (value: QueryParamValue): string => {
  switch (typeof value) {
  case 'string':
    return encodeURIComponent(value);
  case 'number':
    return value.toString();
  case 'boolean':
    return value ? '1' : '0';
  default:
    throw new TypeError(`Cannot encode ${value} as query parameter value`);
  }
};

const encodeQueryParamPair = ([name, value]: [string, QueryParamValue]) => `${encodeURIComponent(name)}=${encodeQueryParamValue(value)}`;

const encodeQueryParamPairs = (pairs: [string, QueryParamValue][]) => {
  return !pairs.length
    ? ''
    : `?${pairs.map(encodeQueryParamPair).join('&')}`;
};

const parseJsonTimestampValue = (val: string) => moment(val);

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

export class Service {
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
      xhr.open(method, `${this.prefix}${path}?${qs}`, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          const {status, responseText} = xhr;
          if (status >= 200 && status < 300) {
            resolve(JSON.parse(responseText));
          } else {
            reject(new ServiceError(xhr.status, responseText == null ? 'Failed to send request' : responseText));
          }
        }
      };
      xhr.send(
        !body
          ? null
          : body instanceof File
          ? body
          : JSON.stringify(body),
      );
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
      path: '/dataset_source',
      body: {name, comment},
    });
  }

  async listDatasetSources (): Promise<{
    sources: { id: number; name: string; }[];
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
        timestamp: timestampColumn,
        format: timestampFormat,
        description: descriptionColumn,
        amount: amountColumn,
      },
      body: data,
    });
  }

  async getDatasetDetails ({
    dataset,
  }: {
    dataset: number;
  }): Promise<{
    source: number;
    comment: string;
    created: Moment;
  }> {
    const res = await this.makeRequest<any>({
      method: 'GET',
      path: `/dataset/${dataset}`,
    });
    res.created = parseJsonTimestampValue(res.created);
    return res;
  }

  async getDatasetTransactions ({
    dataset,
  }: {
    dataset: number;
  }): Promise<{
    transactions: {
      id: number;
      comment: string;
      malformed: boolean;
      timestamp: Moment;
      description: string;
      amount: number;
    }[];
  }> {
    const res = await this.makeRequest<any>({
      method: 'GET',
      path: `/dataset/${dataset}/transactions`,
    });
    for (const t of res.transactions) {
      t.timestamp = parseJsonTimestampValue(t.timestamp);
    }
    return res;
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

  async getTransactionsByMonth ({
    year,
    month,
  }: {
    year: number;
    month: number;
  }): Promise<{
    transactions: {
      id: number;
      comment: string;
      malformed: boolean;
      timestamp: Moment;
      description: string;
      transaction_amount: number;
      combined_amount: number;
      combined_categories: number[];
    }[];
  }> {
    const res = await this.makeRequest<any>({
      method: 'GET',
      path: `/transactions/${year}/${month}`,
    });
    for (const t of res.transactions) {
      t.timestamp = parseJsonTimestampValue(t.timestamp);
    }
    return res;
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
      path: `/transaction/${transaction}/part`,
      body: {comment, amount, category},
    });
  }
}
