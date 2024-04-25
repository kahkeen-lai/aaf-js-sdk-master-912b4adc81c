/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable unicorn/string-content */
import { IQueryFilter, IReport } from '../reporting-e2e-helper';
import * as Xaaf from '@xaaf/common';

const query = 'SELECT * FROM XandrSDK';

export class NewRelicReportReader {
  accountId: string;
  queryKey: string;
  platformAdvId: string;

  constructor(accountId, queryKey, platformAdvId) {
    this.accountId = accountId;
    this.queryKey = queryKey;
    this.platformAdvId = platformAdvId;
  }

  async runQuery(field: string, value: string): Promise<unknown> {
    const httpService = Xaaf.InjectionContainer.resolve<Xaaf.HttpService>(Xaaf.ContainerDef.httpService);
    const nrqlQuery = `${query} where platformAdvId = '${this.platformAdvId}' and ${field} = '${value}' since 10 minutes ago limit max`;
    const options = {
      url: `https://insights-api.newrelic.com/v1/accounts/${this.accountId}/query?nrql=${nrqlQuery}`,
      headers: { 'X-Query-Key': this.queryKey },
      json: true
    };
    try {
      const res = await httpService.get(options.url, options);
      return res.body;
    } catch (error) {
      console.error(error);
    }
  }

  async runQueryByMultipleFilters(SearchQuery: IQueryFilter[]): Promise<IReport> {
    let queryFilterString = `where platformAdvId = '${this.platformAdvId}'`;
    if (SearchQuery) {
      SearchQuery.forEach((item, index) => {
        queryFilterString += ` and  ${item.Field} ${item.Operator} ${item.Value} `;
      });
    }

    const nrqlQuery = `${query} ${queryFilterString} since 10 minutes ago limit max`;

    return await this.runQueryString(nrqlQuery);
  }

  async runQueryString(queryString: string): Promise<IReport> {
    const httpService = Xaaf.InjectionContainer.resolve<Xaaf.HttpService>(Xaaf.ContainerDef.httpService);
    console.debug(`Sending nrqlQuery to new relic: ${queryString}`);
    const options = {
      url: `https://insights-api.newrelic.com/v1/accounts/${this.accountId}/query?nrql=${queryString}`,
      headers: { 'X-Query-Key': this.queryKey },
      json: true
    };

    try {
      const res = await httpService.get(options.url, options);
      return res.body;
    } catch (error) {
      console.error(error);
    }
  }
}
