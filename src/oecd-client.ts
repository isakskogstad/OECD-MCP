/**
 * High-level OECD Client for MCP Server
 * Wraps the SDMX client with MCP-specific functionality
 */

import { OECDSDMXClient, SDMXDataflow } from './sdmx-client.js';
import {
  OECD_CATEGORIES,
  POPULAR_DATASETS,
  OECDCategory,
  PopularDataset,
  DataflowFilter,
  DataQuery,
  IndicatorSearch,
} from './types.js';

export class OECDClient {
  private sdmxClient: OECDSDMXClient;

  constructor() {
    this.sdmxClient = new OECDSDMXClient();
  }

  /**
   * Get all OECD data categories
   */
  getCategories(): OECDCategory[] {
    return OECD_CATEGORIES;
  }

  /**
   * Get popular OECD datasets
   */
  getPopularDatasets(): PopularDataset[] {
    return POPULAR_DATASETS;
  }

  /**
   * Get category by ID
   */
  getCategory(categoryId: string): OECDCategory | undefined {
    return OECD_CATEGORIES.find((cat) => cat.id === categoryId);
  }

  /**
   * List dataflows with optional category filter
   */
  async listDataflows(filter?: DataflowFilter): Promise<SDMXDataflow[]> {
    const allDataflows = await this.sdmxClient.listDataflows();

    let filtered = allDataflows;

    // Filter by category if specified
    if (filter?.category) {
      const category = this.getCategory(filter.category);
      if (category) {
        // Filter by example datasets in category
        const categoryDataflowIds = new Set(category.exampleDatasets);
        filtered = filtered.filter((df) => categoryDataflowIds.has(df.id));
      }
    }

    // Apply limit
    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  /**
   * Search dataflows by query
   */
  async searchDataflows(query: string, limit: number = 20): Promise<SDMXDataflow[]> {
    const results = await this.sdmxClient.searchDataflows(query);
    return results.slice(0, limit);
  }

  /**
   * Get data structure for a dataflow
   */
  async getDataStructure(dataflowId: string) {
    return this.sdmxClient.getDataStructure(dataflowId);
  }

  /**
   * Query data from a dataflow
   */
  async queryData(params: DataQuery) {
    return this.sdmxClient.queryData(params.dataflowId, params.filter || 'all', {
      startPeriod: params.startPeriod,
      endPeriod: params.endPeriod,
      lastNObservations: params.lastNObservations,
    });
  }

  /**
   * Search for indicators by keyword
   */
  async searchIndicators(params: IndicatorSearch): Promise<SDMXDataflow[]> {
    const allDataflows = await this.sdmxClient.listDataflows();
    const lowerIndicator = params.indicator.toLowerCase();

    let filtered = allDataflows.filter((df) => {
      return (
        df.name.toLowerCase().includes(lowerIndicator) ||
        df.id.toLowerCase().includes(lowerIndicator) ||
        (df.description && df.description.toLowerCase().includes(lowerIndicator))
      );
    });

    // Filter by category if specified
    if (params.category) {
      const category = this.getCategory(params.category);
      if (category) {
        const categoryDataflowIds = new Set(category.exampleDatasets);
        filtered = filtered.filter((df) => categoryDataflowIds.has(df.id));
      }
    }

    return filtered;
  }

  /**
   * Get OECD Data Explorer URL for a dataflow
   */
  getDataExplorerUrl(dataflowId: string, filter?: string): string {
    return this.sdmxClient.getDataExplorerUrl(dataflowId, filter);
  }

  /**
   * Get detailed category information with example datasets
   */
  async getCategoriesDetailed(): Promise<
    Array<{
      category: OECDCategory;
      exampleDataflows: SDMXDataflow[];
    }>
  > {
    const allDataflows = await this.sdmxClient.listDataflows();
    const dataflowMap = new Map(allDataflows.map((df) => [df.id, df]));

    return OECD_CATEGORIES.map((category) => ({
      category,
      exampleDataflows: category.exampleDatasets
        .map((id) => dataflowMap.get(id))
        .filter((df): df is SDMXDataflow => df !== undefined),
    }));
  }

  /**
   * Get API information
   */
  getApiInfo() {
    return {
      baseUrl: 'https://sdmx.oecd.org/public/rest/',
      format: 'SDMX-JSON (Statistical Data and Metadata eXchange)',
      authentication: 'None required (public API)',
      documentation: 'https://data.oecd.org/',
      dataExplorer: 'https://data-explorer.oecd.org/',
      endpoints: {
        listDataflows: '/dataflow/OECD',
        getStructure: '/dataflow/OECD/{dataflowID}/{version}?references=descendants',
        queryData: '/data/OECD,{dataflowID},{version}/{filter}/?format=jsondata',
      },
    };
  }
}
