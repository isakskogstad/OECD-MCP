/**
 * OECD SDMX API Client
 * Based on OECD Data API documentation (May 2024)
 * Base URL: https://sdmx.oecd.org/public/rest/
 */

import fetch, { Response, RequestInit } from 'node-fetch';
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
  private readonly MAX_RETRIES = 3; // Maximum retry attempts for transient errors
  private readonly INITIAL_RETRY_DELAY_MS = 1000; // Initial delay before first retry
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
   * Check if an error is retryable (network/TLS errors or server errors)
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const retryablePatterns = [
        'econnreset',
        'etimedout',
        'econnrefused',
        'enotfound',
        'socket hang up',
        'network',
        'tls',
        'ssl',
        'certificate',
        'getaddrinfo',
        'dns',
      ];
      return retryablePatterns.some(pattern => message.includes(pattern));
    }
    return false;
  }

  /**
   * Fetch with retry logic for handling transient network/TLS errors
   * Uses exponential backoff for retries
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    context: { dataflowId: string; operation: string }
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      // Enforce rate limiting before each attempt
      await this.enforceRateLimit();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Retry on server errors (5xx)
        if (response.status >= 500 && attempt < this.MAX_RETRIES) {
          const delay = this.INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
          console.warn(`⚠️  Server error ${response.status} for ${context.operation} (${context.dataflowId}), retrying in ${delay}ms (attempt ${attempt + 1}/${this.MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);

        // Handle timeout
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error(`OECD API request timed out after ${this.REQUEST_TIMEOUT_MS / 1000} seconds`);
          if (attempt < this.MAX_RETRIES) {
            const delay = this.INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
            console.warn(`⚠️  Request timeout for ${context.operation} (${context.dataflowId}), retrying in ${delay}ms (attempt ${attempt + 1}/${this.MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          break;
        }

        // Handle retryable network/TLS errors
        if (this.isRetryableError(error) && attempt < this.MAX_RETRIES) {
          const delay = this.INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
          console.warn(`⚠️  Network error for ${context.operation} (${context.dataflowId}): ${error instanceof Error ? error.message : 'Unknown'}, retrying in ${delay}ms (attempt ${attempt + 1}/${this.MAX_RETRIES})`);
          lastError = error instanceof Error ? error : new Error(String(error));
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Non-retryable error
        throw error;
      }
    }

    // All retries exhausted
    throw lastError || new Error(`Failed after ${this.MAX_RETRIES} retries`);
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
   * Get dataflow structure (metadata) by fetching from OECD API
   * Retrieves actual dimension definitions and possible values
   */
  async getDataStructure(dataflowId: string, version?: string): Promise<SDMXDataStructure> {
    // Find the known dataflow
    const knownDf = getDataflowById(dataflowId);
    if (!knownDf) {
      throw new Error(`Unknown dataflow: ${dataflowId}. Use listDataflows() to see available dataflows.`);
    }

    // Try to fetch real structure from OECD API with retry logic
    try {
      // Query for a small sample of data to get structure metadata
      const params = new URLSearchParams({
        format: 'jsondata',
        lastNObservations: '1',
      });

      const url = `${this.baseUrl}/data/${knownDf.agency},${knownDf.fullId}/all?${params.toString()}`;

      const response = await this.fetchWithRetry(
        url,
        { headers: { Accept: 'application/json' } },
        { dataflowId, operation: 'getDataStructure' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch structure: ${response.status}`);
      }

      const data = await response.json();
      return this.parseDataStructure(dataflowId, data);
    } catch (error) {
      // Fallback to basic structure if API call fails
      console.warn(`Failed to fetch structure for ${dataflowId}, using fallback:`, error);
      return this.getFallbackStructure(dataflowId);
    }
  }

  /**
   * Parse structure from SDMX-JSON response
   */
  private parseDataStructure(dataflowId: string, data: any): SDMXDataStructure {
    const { seriesDimensions, observationDimensions } = this.extractDimensionMetadata(data);

    // Combine series and observation dimensions
    const allDimensions: SDMXDimension[] = [];

    for (const dim of seriesDimensions) {
      allDimensions.push({
        id: dim.id,
        name: dim.name,
        values: (dim.values || []).slice(0, 50).map((v: any) => ({
          id: v.id,
          name: v.name || v.id,
        })),
      });
    }

    for (const dim of observationDimensions) {
      allDimensions.push({
        id: dim.id,
        name: dim.name,
        values: (dim.values || []).slice(0, 20).map((v: any) => ({
          id: v.id,
          name: v.name || v.id,
        })),
      });
    }

    // Extract attributes if available
    const attributes = this.extractAttributes(data);

    return {
      dataflowId,
      dimensions: allDimensions.length > 0 ? allDimensions : this.getFallbackStructure(dataflowId).dimensions,
      attributes,
    };
  }

  /**
   * Extract attribute definitions from response
   */
  private extractAttributes(data: any): Array<{ id: string; name: string }> {
    const structures = data?.data?.structures || [];
    if (structures.length > 0 && structures[0]?.attributes) {
      const attrs = structures[0].attributes;
      const allAttrs = [...(attrs.series || []), ...(attrs.observation || [])];
      return allAttrs.map((a: any) => ({
        id: a.id,
        name: a.name || a.id,
      }));
    }

    // Try alternative format
    const altAttrs = data?.structure?.attributes;
    if (altAttrs) {
      const allAttrs = [...(altAttrs.series || []), ...(altAttrs.observation || [])];
      return allAttrs.map((a: any) => ({
        id: a.id,
        name: a.name || a.id,
      }));
    }

    return [
      { id: 'UNIT_MEASURE', name: 'Unit of Measure' },
      { id: 'OBS_STATUS', name: 'Observation Status' },
    ];
  }

  /**
   * Fallback structure when API call fails
   */
  private getFallbackStructure(dataflowId: string): SDMXDataStructure {
    return {
      dataflowId,
      dimensions: [
        {
          id: 'REF_AREA',
          name: 'Reference Area',
          values: [
            { id: 'SWE', name: 'Sweden' },
            { id: 'USA', name: 'United States' },
            { id: 'DEU', name: 'Germany' },
            { id: 'GBR', name: 'United Kingdom' },
            { id: 'FRA', name: 'France' },
            { id: 'JPN', name: 'Japan' },
            { id: 'OECD', name: 'OECD Total' },
          ],
        },
        {
          id: 'TIME_PERIOD',
          name: 'Time Period',
          values: [{ id: 'varies', name: 'Time dimension (use start_period/end_period parameters)' }],
        },
        {
          id: 'MEASURE',
          name: 'Measure',
          values: [{ id: 'varies', name: 'See dataset documentation for available measures' }],
        },
      ],
      attributes: [
        { id: 'UNIT_MEASURE', name: 'Unit of Measure' },
        { id: 'OBS_STATUS', name: 'Observation Status' },
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

    // Use fetchWithRetry for automatic retry on transient errors
    const response = await this.fetchWithRetry(
      url,
      { headers: { Accept: 'application/json' } },
      { dataflowId, operation: 'queryData' }
    );

    if (!response.ok) {
      const errorDetails = this.createDetailedError(response.status, dataflowId, filter);
      throw new Error(JSON.stringify(errorDetails));
    }

    const data = await response.json();

    // Parse observations with client-side limit as backup
    // OECD API sometimes ignores lastNObservations for large datasets
    const observations = this.parseDataObservations(data, options.lastNObservations);

    return observations;
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

  /**
   * Extract dimension metadata from SDMX-JSON response
   * Returns arrays of dimension definitions with their possible values
   */
  private extractDimensionMetadata(data: any): {
    seriesDimensions: Array<{ id: string; name: string; values: Array<{ id: string; name: string }> }>;
    observationDimensions: Array<{ id: string; name: string; values: Array<{ id: string; name: string }> }>;
  } {
    const structures = data?.data?.structures || data?.structure?.dimensions || [];

    // Try new SDMX-JSON format first
    if (structures.length > 0 && structures[0]?.dimensions) {
      const dims = structures[0].dimensions;
      return {
        seriesDimensions: dims.series || [],
        observationDimensions: dims.observation || [],
      };
    }

    // Try alternative structure format (data.structure.dimensions)
    const altStructure = data?.structure?.dimensions;
    if (altStructure) {
      return {
        seriesDimensions: altStructure.series || [],
        observationDimensions: altStructure.observation || [],
      };
    }

    return { seriesDimensions: [], observationDimensions: [] };
  }

  private parseDataObservations(data: any, clientSideLimit?: number): SDMXObservation[] {
    try {
      // SDMX-JSON data format
      const observations: SDMXObservation[] = [];
      const datasets = data?.data?.dataSets || [];

      // Extract dimension metadata for mapping indexes to real names
      const { seriesDimensions, observationDimensions } = this.extractDimensionMetadata(data);

      for (const dataset of datasets) {
        const series = dataset.series || {};

        for (const [seriesKey, seriesData] of Object.entries(series)) {
          const dimensions = this.parseSeriesKeyWithMetadata(seriesKey, seriesDimensions);
          const obs = (seriesData as any).observations || {};

          for (const [obsKey, obsValue] of Object.entries(obs)) {
            // Apply client-side limit as backup for when OECD API ignores lastNObservations
            if (clientSideLimit && observations.length >= clientSideLimit) {
              console.warn(`⚠️  Client-side limit reached: ${clientSideLimit} observations. OECD API may have ignored lastNObservations parameter.`);
              return observations;
            }

            const value = Array.isArray(obsValue) ? obsValue[0] : obsValue;

            // Map observation dimension (usually TIME_PERIOD) using metadata
            const timeDimension = this.mapObservationDimension(obsKey, observationDimensions);

            observations.push({
              dimensions: {
                ...dimensions,
                ...timeDimension,
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

  /**
   * Parse series key with dimension metadata to get actual names and values
   */
  private parseSeriesKeyWithMetadata(
    key: string,
    seriesDimensions: Array<{ id: string; name: string; values: Array<{ id: string; name: string }> }>
  ): Record<string, string> {
    const parts = key.split(':');
    const dimensions: Record<string, string> = {};

    parts.forEach((valueIndex, dimIndex) => {
      const dimension = seriesDimensions[dimIndex];
      if (dimension) {
        // Get the actual value from the dimension's values array
        const valueObj = dimension.values[parseInt(valueIndex, 10)];
        const actualValue = valueObj?.id || valueIndex;
        dimensions[dimension.id] = actualValue;
      } else {
        // Fallback to DIM_X if no metadata available
        dimensions[`DIM_${dimIndex}`] = valueIndex;
      }
    });

    return dimensions;
  }

  /**
   * Map observation dimension index to actual value (usually TIME_PERIOD)
   */
  private mapObservationDimension(
    obsKey: string,
    observationDimensions: Array<{ id: string; name: string; values: Array<{ id: string; name: string }> }>
  ): Record<string, string> {
    const result: Record<string, string> = {};

    // Usually there's only one observation dimension (TIME_PERIOD)
    const timeDim = observationDimensions[0];
    if (timeDim) {
      const valueObj = timeDim.values[parseInt(obsKey, 10)];
      const actualValue = valueObj?.id || obsKey;
      result[timeDim.id] = actualValue;
    } else {
      // Fallback
      result['TIME_PERIOD'] = obsKey;
    }

    return result;
  }
}
