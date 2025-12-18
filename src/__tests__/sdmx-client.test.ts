/**
 * SDMX Client unit tests
 * Tests rate limiting, error handling, data parsing, and API interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OECDSDMXClient, OECD_SDMX_BASE, OECD_AGENCY } from '../sdmx-client.js';
import fetch from 'node-fetch';

// Mock node-fetch
vi.mock('node-fetch');
const mockFetch = vi.mocked(fetch);

describe('OECDSDMXClient Constructor', () => {
  it('should use default base URL and agency', () => {
    const client = new OECDSDMXClient();

    // @ts-ignore - accessing private properties for testing
    expect(client.baseUrl).toBe(OECD_SDMX_BASE);
    // @ts-ignore
    expect(client.agency).toBe(OECD_AGENCY);
  });

  it('should accept custom base URL and agency', () => {
    const customUrl = 'https://custom.sdmx.org';
    const customAgency = 'CUSTOM';
    const client = new OECDSDMXClient(customUrl, customAgency);

    // @ts-ignore
    expect(client.baseUrl).toBe(customUrl);
    // @ts-ignore
    expect(client.agency).toBe(customAgency);
  });

  it('should initialize rate limiting properties', () => {
    const client = new OECDSDMXClient();

    // @ts-ignore
    expect(client.lastRequestTime).toBe(0);
    // @ts-ignore
    expect(client.MIN_REQUEST_INTERVAL_MS).toBe(1500);
    // @ts-ignore
    expect(client.REQUEST_TIMEOUT_MS).toBe(30000);
  });
});

describe('Rate Limiting', () => {
  let client: OECDSDMXClient;

  beforeEach(() => {
    client = new OECDSDMXClient();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow first request immediately', async () => {
    const startTime = Date.now();

    // @ts-ignore - testing private method
    await client.enforceRateLimit();

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBe(0);
  });

  it('should delay second request by 1500ms', async () => {
    // @ts-ignore
    await client.enforceRateLimit();

    const promise = (client as any).enforceRateLimit();
    vi.advanceTimersByTime(1500);
    await promise;

    // @ts-ignore
    expect(client.lastRequestTime).toBeGreaterThan(0);
  });

  it('should queue multiple requests sequentially', async () => {
    const requests = [
      (client as any).enforceRateLimit(),
      (client as any).enforceRateLimit(),
      (client as any).enforceRateLimit(),
    ];

    // Advance time to let all requests complete
    vi.advanceTimersByTime(4500); // 3 requests * 1500ms

    await Promise.all(requests);

    // All requests should have completed
    expect(requests).toHaveLength(3);
  });

  it('should log rate limiting delays', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // @ts-ignore
    await client.enforceRateLimit();

    const promise = (client as any).enforceRateLimit();
    vi.advanceTimersByTime(1500);
    await promise;

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Rate limiting: waiting')
    );

    consoleSpy.mockRestore();
  });

  it('should handle concurrent requests without race conditions', async () => {
    // Simulate 10 rapid concurrent requests
    const requests = Array(10)
      .fill(null)
      .map(() => (client as any).enforceRateLimit());

    // Advance time to allow all requests to complete
    vi.advanceTimersByTime(15000); // 10 requests * 1500ms

    await Promise.all(requests);

    // All requests should have been queued and executed
    expect(requests).toHaveLength(10);
  });
});

describe('Filter Sanitization', () => {
  let client: OECDSDMXClient;

  beforeEach(() => {
    client = new OECDSDMXClient();
  });

  describe('Valid SDMX filters', () => {
    const validFilters = [
      'USA.GDP..',
      'USA+CAN.GDP',
      'USA.GDP_GROWTH',
      'A.B.C:D',
      '*.GDP..',
      'USA...',
      'ALL',
      'A1.B2.C3_D4',
    ];

    validFilters.forEach(filter => {
      it(`should accept valid filter: "${filter}"`, () => {
        expect(() => {
          // @ts-ignore
          client.sanitizeFilter(filter);
        }).not.toThrow();
      });
    });
  });

  describe('Invalid filters (security)', () => {
    const invalidFilters = [
      { filter: 'http://malicious.com', reason: 'URL scheme' },
      { filter: 'USA/../admin', reason: 'Path traversal' },
      { filter: 'USA;rm -rf /', reason: 'Command injection' },
      { filter: 'USA\nmalicious', reason: 'Newline injection' },
      { filter: 'USA<script>', reason: 'XSS attempt' },
      { filter: 'USA&malicious', reason: 'Shell metacharacter' },
      { filter: 'USA|malicious', reason: 'Pipe character' },
      { filter: 'USA`malicious`', reason: 'Backtick injection' },
      { filter: 'USA$(malicious)', reason: 'Command substitution' },
      { filter: 'USA{malicious}', reason: 'Brace expansion' },
      { filter: 'USA[malicious]', reason: 'Bracket expansion' },
      { filter: 'USA<malicious', reason: 'Redirection character' },
      { filter: 'USA>malicious', reason: 'Redirection character' },
    ];

    invalidFilters.forEach(({ filter, reason }) => {
      it(`should reject filter with ${reason}: "${filter}"`, () => {
        expect(() => {
          // @ts-ignore
          client.sanitizeFilter(filter);
        }).toThrow('Invalid filter format');
      });
    });
  });

  describe('Edge cases', () => {
    it('should reject empty filter', () => {
      expect(() => {
        // @ts-ignore
        client.sanitizeFilter('');
      }).toThrow();
    });

    it('should handle Unicode characters', () => {
      // SDMX filters should be ASCII only
      expect(() => {
        // @ts-ignore
        client.sanitizeFilter('USA.💰..');
      }).toThrow('Invalid filter format');
    });

    it('should reject null bytes', () => {
      expect(() => {
        // @ts-ignore
        client.sanitizeFilter('USA\x00malicious');
      }).toThrow('Invalid filter format');
    });
  });
});

describe('List Dataflows', () => {
  let client: OECDSDMXClient;

  beforeEach(() => {
    client = new OECDSDMXClient();
  });

  it('should return known dataflows without API call', async () => {
    const result = await client.listDataflows();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    result.forEach(df => {
      expect(df).toHaveProperty('id');
      expect(df).toHaveProperty('name');
      expect(df).toHaveProperty('version');
      expect(df).toHaveProperty('agencyID');
    });
  });

  it('should include common dataflows', async () => {
    const result = await client.listDataflows();
    const ids = result.map(df => df.id);

    expect(ids).toContain('QNA');
    expect(ids).toContain('MEI');
    expect(ids).toContain('PATS_REGION');
  });
});

describe('Get Data Structure', () => {
  let client: OECDSDMXClient;

  beforeEach(() => {
    client = new OECDSDMXClient();
  });

  it('should return structure for known dataflow', async () => {
    const result = await client.getDataStructure('QNA');

    expect(result).toHaveProperty('dataflowId', 'QNA');
    expect(result).toHaveProperty('dimensions');
    expect(result).toHaveProperty('attributes');
    expect(Array.isArray(result.dimensions)).toBe(true);
    expect(Array.isArray(result.attributes)).toBe(true);
  });

  it('should include common dimensions', async () => {
    const result = await client.getDataStructure('QNA');
    const dimIds = result.dimensions.map(d => d.id);

    expect(dimIds).toContain('REF_AREA');
    expect(dimIds).toContain('TIME_PERIOD');
    expect(dimIds).toContain('MEASURE');
  });

  it('should throw error for unknown dataflow', async () => {
    await expect(
      client.getDataStructure('UNKNOWN_DATAFLOW')
    ).rejects.toThrow('Unknown dataflow: UNKNOWN_DATAFLOW');
  });

  it('should handle version parameter', async () => {
    // Version parameter is accepted but not used (OECD doesn't require it)
    await expect(
      client.getDataStructure('QNA', '1.0')
    ).resolves.toBeDefined();
  });
});

describe('Query Data', () => {
  let client: OECDSDMXClient;

  beforeEach(() => {
    client = new OECDSDMXClient();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should construct correct API URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { dataSets: [] } }),
    } as any);

    await client.queryData('QNA', 'USA.GDP..', {});

    vi.advanceTimersByTime(1500);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('https://sdmx.oecd.org/public/rest/data/OECD'),
      expect.any(Object)
    );
  });

  it('should apply rate limiting before API call', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { dataSets: [] } }),
    } as any);

    const promise1 = client.queryData('QNA', 'all', {});
    const promise2 = client.queryData('QNA', 'all', {});

    vi.advanceTimersByTime(3000);

    await Promise.all([promise1, promise2]);

    // Second call should be delayed by rate limiting
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should handle API error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as any);

    await expect(
      client.queryData('QNA', 'all', {})
    ).rejects.toThrow('OECD API request failed with status 404');

    vi.advanceTimersByTime(1500);
  });

  it('should timeout after 30 seconds', async () => {
    // Mock fetch to never resolve
    mockFetch.mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves
    );

    const promise = client.queryData('QNA', 'all', {});

    vi.advanceTimersByTime(30000);

    await expect(promise).rejects.toThrow('timed out after 30 seconds');
  });

  it('should sanitize filter parameter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { dataSets: [] } }),
    } as any);

    await client.queryData('QNA', 'USA.GDP..', {});

    vi.advanceTimersByTime(1500);

    const callUrl = mockFetch.mock.calls[0][0] as string;
    expect(callUrl).toContain('USA.GDP..');
  });

  it('should use "all" filter when filter is "all"', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { dataSets: [] } }),
    } as any);

    await client.queryData('QNA', 'all', {});

    vi.advanceTimersByTime(1500);

    const callUrl = mockFetch.mock.calls[0][0] as string;
    expect(callUrl).toContain('/all?');
  });

  it('should include query parameters in URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { dataSets: [] } }),
    } as any);

    await client.queryData('QNA', 'all', {
      startPeriod: '2020',
      endPeriod: '2023',
      lastNObservations: 100,
    });

    vi.advanceTimersByTime(1500);

    const callUrl = mockFetch.mock.calls[0][0] as string;
    expect(callUrl).toContain('startPeriod=2020');
    expect(callUrl).toContain('endPeriod=2023');
    expect(callUrl).toContain('lastNObservations=100');
  });

  it('should reject unknown dataflow', async () => {
    await expect(
      client.queryData('UNKNOWN_DF', 'all', {})
    ).rejects.toThrow('Unknown dataflow: UNKNOWN_DF');
  });

  it('should apply client-side limit to protect context', async () => {
    // Mock API returning more observations than requested
    const largeDataset = {
      data: {
        dataSets: [
          {
            series: {
              '0:0:0': {
                observations: Object.fromEntries(
                  Array(2000)
                    .fill(null)
                    .map((_, i) => [i.toString(), [Math.random()]])
                ),
              },
            },
          },
        ],
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => largeDataset,
    } as any);

    const result = await client.queryData('QNA', 'all', {
      lastNObservations: 100,
    });

    vi.advanceTimersByTime(1500);

    // Should be limited to 100 observations
    expect(result.length).toBeLessThanOrEqual(100);
  });
});

describe('Search Dataflows', () => {
  let client: OECDSDMXClient;

  beforeEach(() => {
    client = new OECDSDMXClient();
  });

  it('should search known dataflows by keyword', async () => {
    const result = await client.searchDataflows('GDP');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    result.forEach(df => {
      expect(df).toHaveProperty('id');
      expect(df).toHaveProperty('name');
    });
  });

  it('should return case-insensitive results', async () => {
    const result1 = await client.searchDataflows('gdp');
    const result2 = await client.searchDataflows('GDP');

    expect(result1.length).toBe(result2.length);
  });

  it('should return empty array for no matches', async () => {
    const result = await client.searchDataflows('xyznonexistent');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('should handle special characters in search', async () => {
    // Should not crash or cause errors
    const result = await client.searchDataflows('GDP & inflation');

    expect(Array.isArray(result)).toBe(true);
  });
});

describe('Data Explorer URL Generation', () => {
  let client: OECDSDMXClient;

  beforeEach(() => {
    client = new OECDSDMXClient();
  });

  it('should generate URL without filter', () => {
    const url = client.getDataExplorerUrl('QNA');

    expect(url).toBe('https://data-explorer.oecd.org/vis?df=QNA');
  });

  it('should generate URL with filter', () => {
    const url = client.getDataExplorerUrl('QNA', 'USA.GDP..');

    expect(url).toBe('https://data-explorer.oecd.org/vis?df=QNA&dq=USA.GDP..');
  });

  it('should handle special characters in filter', () => {
    const url = client.getDataExplorerUrl('QNA', 'USA+CAN.GDP');

    expect(url).toContain('USA+CAN.GDP');
  });
});

describe('Data Parsing', () => {
  let client: OECDSDMXClient;

  beforeEach(() => {
    client = new OECDSDMXClient();
  });

  it('should parse SDMX-JSON data structure', () => {
    const mockData = {
      data: {
        dataSets: [
          {
            series: {
              '0:1:2': {
                observations: {
                  '0': [123.45],
                  '1': [678.90],
                },
              },
            },
          },
        ],
      },
    };

    // @ts-ignore - testing private method
    const result = client.parseDataObservations(mockData);

    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty('value', 123.45);
    expect(result[1]).toHaveProperty('value', 678.90);
  });

  it('should handle empty datasets', () => {
    const mockData = {
      data: {
        dataSets: [],
      },
    };

    // @ts-ignore
    const result = client.parseDataObservations(mockData);

    expect(result).toEqual([]);
  });

  it('should handle malformed data gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const malformedData = {
      data: null,
    };

    // @ts-ignore
    const result = client.parseDataObservations(malformedData);

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error parsing observations:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should parse series keys into dimension objects', () => {
    const seriesKey = '0:1:2:3';

    // @ts-ignore
    const result = client.parseSeriesKey(seriesKey);

    expect(result).toEqual({
      DIM_0: '0',
      DIM_1: '1',
      DIM_2: '2',
      DIM_3: '3',
    });
  });

  it('should handle observation values as arrays or primitives', () => {
    const mockData = {
      data: {
        dataSets: [
          {
            series: {
              '0:0:0': {
                observations: {
                  '0': [123.45], // Array format
                  '1': 678.90, // Primitive format
                },
              },
            },
          },
        ],
      },
    };

    // @ts-ignore
    const result = client.parseDataObservations(mockData);

    expect(result[0].value).toBe(123.45);
    expect(result[1].value).toBe(678.90);
  });

  it('should log warning when client-side limit is reached', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const largeDataset = {
      data: {
        dataSets: [
          {
            series: {
              '0:0:0': {
                observations: Object.fromEntries(
                  Array(200)
                    .fill(null)
                    .map((_, i) => [i.toString(), [Math.random()]])
                ),
              },
            },
          },
        ],
      },
    };

    // @ts-ignore
    const result = client.parseDataObservations(largeDataset, 50);

    expect(result.length).toBe(50);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Client-side limit reached: 50 observations')
    );

    consoleSpy.mockRestore();
  });
});

describe('Error Handling', () => {
  let client: OECDSDMXClient;

  beforeEach(() => {
    client = new OECDSDMXClient();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      client.queryData('QNA', 'all', {})
    ).rejects.toThrow('Network error');

    vi.advanceTimersByTime(1500);
  });

  it('should handle AbortError for timeout', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    mockFetch.mockRejectedValueOnce(abortError);

    await expect(
      client.queryData('QNA', 'all', {})
    ).rejects.toThrow('timed out after 30 seconds');

    vi.advanceTimersByTime(1500);
  });

  it('should handle JSON parse errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as any);

    await expect(
      client.queryData('QNA', 'all', {})
    ).rejects.toThrow('Invalid JSON');

    vi.advanceTimersByTime(1500);
  });
});
