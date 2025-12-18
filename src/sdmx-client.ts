/**
 * OECD SDMX API Client
 * Based on OECD Data API documentation (May 2024)
 * Base URL: https://sdmx.oecd.org/public/rest/
 */

import fetch from 'node-fetch';
import { KNOWN_DATAFLOWS, toSDMXDataflow, getDataflowById, searchDataflows as searchKnownDataflows } from './known-dataflows.js';

export const OECD_SDMX_BASE = 'https://sdmx.oecd.org/public/rest';
export const OECD_AGENCY = 'OECD';

export interface SDMXDataflow {
  id: string;
  version: string;
  name: string;
  description?: string;
  agencyID: string;
}

export interface SDMXDimension {
  id: string;
  name: string;
  values: Array<{
    id: string;
    name: string;
  }>;
}

export interface SDMXDataStructure {
  dataflowId: string;
  dimensions: SDMXDimension[];
  attributes: Array<{
    id: string;
    name: string;
  }>;
}

export interface SDMXObservation {
  dimensions: Record<string, string>;
  value: number | string;
  attributes?: Record<string, string>;
}

export class OECDSDMXClient {
  private baseUrl: string;
  private agency: string;
  private lastRequestTime: number = 0;
  private readonly MIN_REQUEST_INTERVAL_MS = 1500; // 1.5 seconds between requests to avoid rate limiting
  private readonly REQUEST_TIMEOUT_MS = 30000; // 30 second timeout for API requests
  private requestQueue: Promise<void> = Promise.resolve(); // Queue for rate limiting

  constructor(baseUrl: string = OECD_SDMX_BASE, agency: string = OECD_AGENCY) {
    this.baseUrl = baseUrl;
    this.agency = agency;
  }

  /**
   * Rate limiting: Ensure minimum delay between API requests
   * OECD SDMX API has strict per-IP rate limiting (~20-30 rapid requests trigger blocking)
   * Uses a queue to prevent race conditions with concurrent requests
   */
  private async enforceRateLimit(): Promise<void> {
    // Chain this request to the queue to prevent race conditions
    this.requestQueue = this.requestQueue.then(async () => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL_MS) {
        const delayNeeded = this.MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest;
        console.log(`⏱️  Rate limiting: waiting ${delayNeeded}ms before next OECD API request`);
        await new Promise(resolve => setTimeout(resolve, delayNeeded));
      }

      this.lastRequestTime = Date.now();
    });

    return this.requestQueue;
  }

  /**
   * Validate and sanitize filter parameter to prevent SSRF attacks
   * Only allows alphanumeric characters, dots, underscores, hyphens, colons, and plus signs
   */
  private sanitizeFilter(filter: string): string {
    // Allow SDMX filter syntax: alphanumeric, dots, underscores, hyphens, colons, plus, asterisks
    if (!/^[A-Za-z0-9._\-:+*]+$/.test(filter)) {
      throw new Error(`Invalid filter format: "${filter}". Only alphanumeric characters and ._-:+* are allowed.`);
    }
    return encodeURIComponent(filter);
  }

  /**
   * List all dataflows (datasets)
   * NOTE: Uses curated list of known working dataflows due to OECD SDMX API limitations
   */
  async listDataflows(): Promise<SDMXDataflow[]> {
    // Return known working dataflows
    return KNOWN_DATAFLOWS.map(toSDMXDataflow);
  }

  /**
   * Get dataflow structure (metadata)
   * NOTE: OECD SDMX API does not provide full structure definitions
   * Returns simplified structure based on known dataflows
   */
  async getDataStructure(dataflowId: string, version?: string): Promise<SDMXDataStructure> {
    // Find the known dataflow
    const knownDf = getDataflowById(dataflowId);
    if (!knownDf) {
      throw new Error(`Unknown dataflow: ${dataflowId}. Use listDataflows() to see available dataflows.`);
    }

    // Return simplified structure - OECD API doesn't expose full DSD
    return {
      dataflowId,
      dimensions: [
        {
          id: 'REF_AREA',
          name: 'Reference Area',
          values: [{ id: 'all', name: 'Use query_data to get actual dimension values' }],
        },
        {
          id: 'TIME_PERIOD',
          name: 'Time Period',
          values: [{ id: 'all', name: 'Time dimension' }],
        },
        {
          id: 'MEASURE',
          name: 'Measure',
          values: [{ id: 'all', name: 'Measured indicator' }],
        },
      ],
      attributes: [
        {
          id: 'UNIT_MEASURE',
          name: 'Unit of Measure',
        },
        {
          id: 'OBS_STATUS',
          name: 'Observation Status',
        },
      ],
    };
  }

  /**
   * Query data
   * GET /data/{agencyID},{DSD_ID}@{DF_ID},{version}/{filter}
   * ?format=jsondata&startPeriod=...&endPeriod=...
   */
  async queryData(
    dataflowId: string,
    filter: string = 'all',
    options: {
      startPeriod?: string;
      endPeriod?: string;
      lastNObservations?: number;
      version?: string;
    } = {}
  ): Promise<SDMXObservation[]> {
    // Find the known dataflow
    const knownDf = getDataflowById(dataflowId);
    if (!knownDf) {
      throw new Error(`Unknown dataflow: ${dataflowId}. Use listDataflows() to see available dataflows.`);
    }

    const params = new URLSearchParams({
      format: 'jsondata',
    });

    if (options.startPeriod) params.append('startPeriod', options.startPeriod);
    if (options.endPeriod) params.append('endPeriod', options.endPeriod);
    if (options.lastNObservations) params.append('lastNObservations', options.lastNObservations.toString());

    // Sanitize filter to prevent SSRF attacks
    const sanitizedFilter = filter === 'all' ? 'all' : this.sanitizeFilter(filter);

    // Format: /data/{AGENCY},{DSD_ID}@{DF_ID}/{filter}
    // NOTE: Version parameter omitted - OECD SDMX API doesn't require/accept it for most dataflows
    const url = `${this.baseUrl}/data/${knownDf.agency},${knownDf.fullId}/${sanitizedFilter}?${params.toString()}`;

    // Enforce rate limiting BEFORE making the API request
    await this.enforceRateLimit();

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorDetails = this.createDetailedError(response.status, dataflowId, filter);
        throw new Error(JSON.stringify(errorDetails));
      }

      const data = await response.json();

      // Parse observations with client-side limit as backup
      // OECD API sometimes ignores lastNObservations for large datasets
      const observations = this.parseDataObservations(data, options.lastNObservations);

      return observations;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`OECD API request timed out after ${this.REQUEST_TIMEOUT_MS / 1000} seconds`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Search dataflows by keyword
   */
  async searchDataflows(query: string): Promise<SDMXDataflow[]> {
    // Use known dataflows search
    const knownResults = searchKnownDataflows(query);
    return knownResults.map(toSDMXDataflow);
  }

  /**
   * Generate OECD Data Explorer URL
   */
  getDataExplorerUrl(dataflowId: string, filter?: string): string {
    const baseUrl = 'https://data-explorer.oecd.org/vis';
    if (filter) {
      return `${baseUrl}?df=${dataflowId}&dq=${filter}`;
    }
    return `${baseUrl}?df=${dataflowId}`;
  }

  // ========== PRIVATE ERROR HANDLING METHODS ==========

  /**
   * Create detailed error message with suggestions for common HTTP errors
   */
  private createDetailedError(statusCode: number, dataflowId: string, filter: string): object {
    const baseError = {
      error: `OECD API request failed`,
      statusCode,
      dataflowId,
      providedFilter: filter,
    };

    switch (statusCode) {
      case 400:
        return {
          ...baseError,
          message: 'Bad request - the query syntax is invalid',
          suggestions: [
            'Check that the dataflow_id is correct',
            'Verify the filter syntax follows SDMX format: DIM1.DIM2.DIM3',
            'Use dots (.) to separate dimensions, empty position means all values',
          ],
          example: `query_data({dataflow_id: "${dataflowId}", last_n_observations: 10})`,
        };

      case 404:
        return {
          ...baseError,
          message: 'Dataset or filter combination not found',
          suggestions: [
            `Verify "${dataflowId}" exists using search_dataflows or list_dataflows`,
            'Check that the filter values exist in the dataset',
            'Try querying without filter first to see available data',
          ],
          example: `search_dataflows({query: "${dataflowId}"})`,
        };

      case 422:
        return {
          ...baseError,
          message: 'Invalid filter format or dimension values',
          cause: 'The filter structure does not match the dataset dimensions, or the dimension values do not exist',
          suggestions: [
            '1. Use get_data_structure to see the dimension order for this dataset',
            '2. Ensure filter matches the exact dimension order',
            '3. Use valid country codes (ISO 3166-1 alpha-3): SWE, USA, DEU, etc.',
            '4. For multiple countries use + separator: SWE+NOR+DNK',
            '5. Empty position (..) means all values for that dimension',
            '6. Try a simpler query first with just last_n_observations',
          ],
          filterSyntax: {
            format: 'DIM1.DIM2.DIM3.DIM4',
            example: 'SWE.B1_GE..',
            multipleValues: 'SWE+NOR+DNK.B1_GE..',
            allValues: 'Use empty position (..) or omit trailing dimensions',
          },
          recommendedFirstStep: `get_data_structure({dataflow_id: "${dataflowId}"})`,
          simpleQueryExample: `query_data({dataflow_id: "${dataflowId}", last_n_observations: 10})`,
        };

      case 429:
        return {
          ...baseError,
          message: 'Rate limit exceeded - too many requests',
          suggestions: [
            'Wait a few seconds before retrying',
            'Reduce the frequency of API calls',
            'The server automatically enforces rate limiting between requests',
          ],
          retryAfter: '5 seconds',
        };

      case 500:
      case 502:
      case 503:
        return {
          ...baseError,
          message: 'OECD server error - temporary issue',
          suggestions: [
            'This is a server-side issue, not a problem with your query',
            'Wait a moment and try again',
            'If the problem persists, the OECD API may be under maintenance',
          ],
          checkStatus: 'https://data.oecd.org/',
        };

      default:
        return {
          ...baseError,
          message: `Unexpected error from OECD API`,
          suggestions: [
            'Check your query parameters',
            'Verify the dataflow_id exists',
            'Try a simpler query first',
          ],
        };
    }
  }

  // ========== PRIVATE PARSING METHODS ==========

  private parseDataObservations(data: any, clientSideLimit?: number): SDMXObservation[] {
    try {
      // SDMX-JSON data format
      const observations: SDMXObservation[] = [];
      const datasets = data?.data?.dataSets || [];

      for (const dataset of datasets) {
        const series = dataset.series || {};

        for (const [seriesKey, seriesData] of Object.entries(series)) {
          const dimensions = this.parseSeriesKey(seriesKey);
          const obs = (seriesData as any).observations || {};

          for (const [obsKey, obsValue] of Object.entries(obs)) {
            // Apply client-side limit as backup for when OECD API ignores lastNObservations
            if (clientSideLimit && observations.length >= clientSideLimit) {
              console.warn(`⚠️  Client-side limit reached: ${clientSideLimit} observations. OECD API may have ignored lastNObservations parameter.`);
              return observations;
            }

            const value = Array.isArray(obsValue) ? obsValue[0] : obsValue;

            observations.push({
              dimensions: {
                ...dimensions,
                TIME_PERIOD: obsKey,
              },
              value,
            });
          }
        }
      }

      return observations;
    } catch (error) {
      console.error('Error parsing observations:', error);
      return [];
    }
  }

  private parseSeriesKey(key: string): Record<string, string> {
    // Series key format: "0:1:2:3" where numbers are dimension value indices
    const parts = key.split(':');
    const dimensions: Record<string, string> = {};

    parts.forEach((part, index) => {
      dimensions[`DIM_${index}`] = part;
    });

    return dimensions;
  }
}
