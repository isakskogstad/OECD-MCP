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

  constructor(baseUrl: string = OECD_SDMX_BASE, agency: string = OECD_AGENCY) {
    this.baseUrl = baseUrl;
    this.agency = agency;
  }

  /**
   * Rate limiting: Ensure minimum delay between API requests
   * OECD SDMX API has strict per-IP rate limiting (~20-30 rapid requests trigger blocking)
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL_MS) {
      const delayNeeded = this.MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest;
      console.log(`⏱️  Rate limiting: waiting ${delayNeeded}ms before next OECD API request`);
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }

    this.lastRequestTime = Date.now();
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

    // Format: /data/{AGENCY},{DSD_ID}@{DF_ID}/{filter}
    // NOTE: Version parameter omitted - OECD SDMX API doesn't require/accept it for most dataflows
    const url = `${this.baseUrl}/data/${knownDf.agency},${knownDf.fullId}/${filter}?${params.toString()}`;

    // Enforce rate limiting BEFORE making the API request
    await this.enforceRateLimit();

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SDMX API error: ${response.status} ${response.statusText}`);
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
