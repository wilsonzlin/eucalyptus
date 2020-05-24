import moment, {isMoment, Moment} from 'moment';
import {IDStore} from '../ui/IDInput/view';
import {exists} from '../util/Optional';
import {encodeQuery, QueryParams} from '../util/QueryString';

export type MTransactionsAnalysisPoint = {
  category_name?: string | null;
  combined_amount: number;
  time_unit?: string;
};

export type MTag = {
  id: number;
  name: string;
  comment: string;
};

export type MCategory = {
  id: number;
  name: string;
  comment: string;
  depth: number;
};

export type MTransactionPart = {
  id: number;
  comment: string;
  amount: number;
  category: { id: number; name: string; } | null;
  tags: { id: number; name: string }[];
};

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

// Server JSON object response bodies might have DateTime values, so deserialise them to Moment instances.
function maybeDeserialiseDateTime (this: any, key: string, val: any) {
  if (key.startsWith('_ts:')) {
    this[key.slice(4)] = moment.unix(val);
  } else {
    return val;
  }
}

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
    query?: QueryParams;
    body?: object | File;
  }): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const qs = encodeQuery(query);
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
        xhr.send(JSON.stringify(body, (_, value) => isMoment(value) ? value.unix() : value));
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
      query: {query},
    });
  }

  async getCategories (): Promise<{
    categories: MCategory[];
  }> {
    return this.makeRequest({
      method: 'GET',
      path: '/categories',
    });
  }

  async getCategoryName ({
    id,
  }: {
    id: number;
  }): Promise<{
    name: string;
  }> {
    return this.makeRequest({
      method: 'GET',
      path: `/category/${id}/name`,
    });
  }

  async getTransactions ({
    from,
    to,
    dataset,
    categories,
    tags,
  }: {
    from?: Moment;
    to?: Moment;
    dataset?: number;
    categories?: number[];
    tags?: number[];
  }): Promise<{
    transactions: MTransaction[];
  }> {
    return await this.makeRequest<any>({
      method: 'GET',
      path: `/transactions`,
      query: {from, to, dataset, category: categories, tag: tags},
    });
  }

  async getTransactionsAnalysis ({
    from,
    to,
    splitBy,
    timeUnit,
    categories,
    tags,
  }: {
    from?: Moment;
    to?: Moment;
    splitBy: 'category' | 'none',
    timeUnit: 'year' | 'month' | 'day' | 'none';
    categories?: number[];
    tags?: number[];
  }): Promise<{
    analysis: MTransactionsAnalysisPoint[];
  }> {
    return this.makeRequest({
      method: 'GET',
      path: '/transactions/analysis',
      query: {from, to, split_by: splitBy, time_unit: timeUnit, category: categories, tag: tags},
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
  }) {
    const res = await this.makeRequest<{
      parts: MTransactionPart[];
    }>({
      method: 'GET',
      path: `/transaction/${transaction}/parts`,
    });
    categoryIDStore.addLabels(
      res.parts
        .map(({category}) => category && ({id: category.id, label: category.name}))
        .filter(exists),
    );
    tagIDStore.addLabels(
      res.parts
        .flatMap(({tags}) => tags)
        .map(tag => ({id: tag.id, label: tag.name})),
    );
    return res;
  }

  async updateTransactionPart ({
    transactionPart,
    comment,
    amount,
    category,
    tags,
  }: {
    transactionPart: number;
    comment?: string;
    amount?: number;
    category?: number | null;
    tags?: number[];
  }): Promise<{}> {
    return this.makeRequest({
      method: 'PATCH',
      path: `/transaction_part/${transactionPart}`,
      body: {comment, amount, category, tags},
    });
  }

  async createTag ({
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
      path: '/tags',
      body: {name, comment},
    });
  }

  async getTags (): Promise<{
    tags: MTag[];
  }> {
    return this.makeRequest({
      method: 'GET',
      path: '/tags',
    });
  }

  async getTagName ({
    id,
  }: {
    id: number;
  }): Promise<{
    name: string;
  }> {
    return this.makeRequest({
      method: 'GET',
      path: `/tag/${id}/name`,
    });
  }

  async suggestTags ({
    query,
  }: {
    query: string;
  }): Promise<{
    suggestions: { id: number; label: string; }[];
  }> {
    return this.makeRequest({
      method: 'GET',
      path: '/tags',
      query: {query},
    });
  }

  async getName (): Promise<{
    name: string;
  }> {
    return this.makeRequest({
      method: 'GET',
      path: '/setting/name',
    });
  }

  async setName ({
    name,
  }: {
    name: string;
  }): Promise<{}> {
    return this.makeRequest({
      method: 'PUT',
      path: '/setting/name',
      body: {name},
    });
  }
}

export const service = new Service('');

export const categoryIDStore = new IDStore(
  query => service.suggestCategories({query}).then(({suggestions}) => suggestions),
  id => service.getCategoryName({id}).then(({name}) => name),
);

export const tagIDStore = new IDStore(
  query => service.suggestTags({query}).then(({suggestions}) => suggestions),
  id => service.getTagName({id}).then(({name}) => name),
);
