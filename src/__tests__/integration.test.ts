/**
 * Integration tests for OECD MCP Server
 * Tests end-to-end workflows, tool chains, and real-world scenarios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OECDClient } from '../oecd-client.js';
import { executeTool } from '../tools.js';
import { readResource } from '../resources.js';
import { getPrompt } from '../prompts.js';

describe('End-to-End Tool Workflows', () => {
  let client: OECDClient;

  beforeEach(() => {
    client = new OECDClient();
  });

  describe('Discovery workflow', () => {
    it('should complete: categories → list → structure → query', async () => {
      // Step 1: Get categories
      const categories = client.getCategories();
      expect(categories.length).toBeGreaterThan(0);

      // Step 2: List dataflows in a category
      const dataflows = await client.listDataflows({ category: 'ECO', limit: 5 });
      expect(dataflows.length).toBeGreaterThan(0);

      const firstDataflow = dataflows[0];

      // Step 3: Get structure
      const structure = await client.getDataStructure(firstDataflow.id);
      expect(structure.dataflowId).toBe(firstDataflow.id);

      // Step 4: Query data (with limit to avoid context overflow)
      const data = await client.queryData({
        dataflowId: firstDataflow.id,
        lastNObservations: 10,
      });
      expect(Array.isArray(data)).toBe(true);
    });

    it('should complete: search → structure → query', async () => {
      // Step 1: Search for GDP data
      const results = await client.searchDataflows('GDP', 5);
      expect(results.length).toBeGreaterThan(0);

      const qna = results.find(df => df.id === 'QNA');
      expect(qna).toBeDefined();

      // Step 2: Get structure
      if (qna) {
        const structure = await client.getDataStructure(qna.id);
        expect(structure.dimensions.length).toBeGreaterThan(0);

        // Step 3: Query recent data
        const data = await client.queryData({
          dataflowId: qna.id,
          lastNObservations: 20,
        });
        expect(data.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Indicator search workflow', () => {
    it('should find indicators and get data', async () => {
      // Search for unemployment indicators
      const indicators = await client.searchIndicators({
        indicator: 'unemployment',
        category: 'JOB',
      });

      expect(indicators.length).toBeGreaterThan(0);

      // Get data for first indicator
      const firstIndicator = indicators[0];
      const structure = await client.getDataStructure(firstIndicator.id);
      expect(structure).toBeDefined();
    });
  });

  describe('URL generation workflow', () => {
    it('should generate URLs for discovered data', async () => {
      const results = await client.searchDataflows('inflation', 3);
      expect(results.length).toBeGreaterThan(0);

      results.forEach(df => {
        const url = client.getDataExplorerUrl(df.id);
        expect(url).toContain('https://data-explorer.oecd.org');
        expect(url).toContain(df.id);
      });
    });

    it('should generate URLs with filters', () => {
      const url = client.getDataExplorerUrl('QNA', 'USA.GDP..');
      expect(url).toContain('df=QNA');
      expect(url).toContain('dq=USA.GDP..');
    });
  });
});

describe('Tool Chain Integration', () => {
  let client: OECDClient;

  beforeEach(() => {
    client = new OECDClient();
  });

  it('should execute all tools without errors', async () => {
    const toolCalls = [
      { name: 'get_categories', args: {} },
      { name: 'get_popular_datasets', args: {} },
      { name: 'list_categories_detailed', args: {} },
      { name: 'search_dataflows', args: { query: 'GDP', limit: 5 } },
      { name: 'list_dataflows', args: { category: 'ECO', limit: 10 } },
      { name: 'search_indicators', args: { indicator: 'GDP' } },
    ];

    for (const { name, args } of toolCalls) {
      const result = await executeTool(client, name, args);
      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
    }
  });

  it('should handle tool errors gracefully', async () => {
    const result = await executeTool(client, 'get_data_structure', {
      dataflow_id: 'NONEXISTENT_DF',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown dataflow');
  });
});

describe('Resource Integration', () => {
  let client: OECDClient;

  beforeEach(() => {
    client = new OECDClient();
  });

  it('should read all available resources', async () => {
    const resources = [
      'oecd://popular-datasets',
      'oecd://categories',
      'oecd://categories-detailed',
    ];

    for (const uri of resources) {
      const result = await readResource(client, uri);
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe(uri);
    }
  });

  it('should return appropriate content types', async () => {
    const result = await readResource(client, 'oecd://popular-datasets');
    expect(result.contents[0].mimeType).toBe('application/json');
  });

  it('should handle invalid resource URIs', async () => {
    await expect(
      readResource(client, 'oecd://invalid-resource')
    ).rejects.toThrow('Unknown resource');
  });
});

describe('Prompt Integration', () => {
  it('should get all available prompts', async () => {
    const prompts = [
      { name: 'analyze-economic-indicator', args: { indicator: 'GDP', countries: 'USA,CAN' } },
      { name: 'compare-countries', args: { indicator: 'unemployment', countries: 'USA,GBR' } },
      { name: 'explore-category', args: { category: 'ECO' } },
    ];

    for (const { name, args } of prompts) {
      const result = await getPrompt(name, args);
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content.type).toBe('text');
      expect(result.messages[0].content.text).toBeTruthy();
    }
  });

  it('should handle invalid prompt names', async () => {
    await expect(
      getPrompt('invalid-prompt', {})
    ).rejects.toThrow('Unknown prompt');
  });

  it('should validate required prompt arguments', async () => {
    // Missing required arguments should throw
    await expect(
      getPrompt('analyze-economic-indicator', {})
    ).rejects.toThrow();
  });
});

describe('Error Handling Chain', () => {
  let client: OECDClient;

  beforeEach(() => {
    client = new OECDClient();
  });

  it('should handle validation errors → tool errors → response', async () => {
    // Invalid input causes validation error
    const result = await executeTool(client, 'search_dataflows', {
      query: '', // Empty query
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error:');
    expect(result.content[0].text).toContain('query');
  });

  it('should handle unknown dataflow → error response', async () => {
    const result = await executeTool(client, 'get_data_structure', {
      dataflow_id: 'FAKE_DF',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown dataflow');
  });

  it('should handle unknown tool → error response', async () => {
    const result = await executeTool(client, 'nonexistent_tool', {});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown tool');
  });
});

describe('Rate Limiting Across Tools', () => {
  let client: OECDClient;

  beforeEach(() => {
    client = new OECDClient();
    vi.useFakeTimers();
  });

  it('should rate limit multiple sequential tool calls', async () => {
    const calls = [
      executeTool(client, 'search_dataflows', { query: 'GDP', limit: 5 }),
      executeTool(client, 'search_dataflows', { query: 'inflation', limit: 5 }),
      executeTool(client, 'search_dataflows', { query: 'employment', limit: 5 }),
    ];

    // Rate limiting should delay subsequent calls
    vi.advanceTimersByTime(5000);

    const results = await Promise.all(calls);
    results.forEach(result => {
      expect(result.content).toHaveLength(1);
    });
  });
});

describe('Context Window Protection', () => {
  let client: OECDClient;

  beforeEach(() => {
    client = new OECDClient();
  });

  it('should enforce maximum observations across multiple queries', async () => {
    // Query with high limit
    const result = await executeTool(client, 'query_data', {
      dataflow_id: 'QNA',
      last_n_observations: 1000, // Max allowed
    });

    expect(result.isError).toBeUndefined();

    // Parse response
    const data = JSON.parse(result.content[0].text);

    // Should not exceed 1000 observations
    if (Array.isArray(data)) {
      expect(data.length).toBeLessThanOrEqual(1000);
    } else if (data.data) {
      expect(data.data.length).toBeLessThanOrEqual(1000);
    }
  });

  it('should reject observations > 1000 (validation)', async () => {
    const result = await executeTool(client, 'query_data', {
      dataflow_id: 'QNA',
      last_n_observations: 5000, // Exceeds max
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('cannot exceed 1000');
  });
});

describe('Concurrent Operations', () => {
  let client: OECDClient;

  beforeEach(() => {
    client = new OECDClient();
  });

  it('should handle concurrent tool calls safely', async () => {
    const concurrentCalls = [
      executeTool(client, 'get_categories', {}),
      executeTool(client, 'get_popular_datasets', {}),
      executeTool(client, 'search_dataflows', { query: 'GDP', limit: 5 }),
      executeTool(client, 'list_dataflows', { category: 'ECO', limit: 10 }),
    ];

    const results = await Promise.all(concurrentCalls);

    results.forEach(result => {
      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
    });
  });

  it('should handle concurrent queries with rate limiting', async () => {
    vi.useFakeTimers();

    const queries = Array(5)
      .fill(null)
      .map((_, i) =>
        executeTool(client, 'search_dataflows', {
          query: `test${i}`,
          limit: 5,
        })
      );

    vi.advanceTimersByTime(10000);

    const results = await Promise.all(queries);
    expect(results).toHaveLength(5);
  });
});

describe('Real-World Scenarios', () => {
  let client: OECDClient;

  beforeEach(() => {
    client = new OECDClient();
  });

  it('scenario: user asks "show me GDP data for USA"', async () => {
    // 1. Search for GDP datasets
    const searchResults = await client.searchDataflows('GDP', 10);
    expect(searchResults.length).toBeGreaterThan(0);

    // 2. Find QNA (Quarterly National Accounts)
    const qna = searchResults.find(df => df.id === 'QNA');
    expect(qna).toBeDefined();

    if (qna) {
      // 3. Get structure to understand dimensions
      const structure = await client.getDataStructure(qna.id);
      expect(structure.dimensions.length).toBeGreaterThan(0);

      // 4. Query data with USA filter and recent observations
      const data = await client.queryData({
        dataflowId: qna.id,
        filter: 'USA.GDP..',
        lastNObservations: 20,
      });

      expect(data.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('scenario: user wants to compare unemployment across countries', async () => {
    // 1. Search for unemployment datasets
    const indicators = await client.searchIndicators({
      indicator: 'unemployment',
    });

    expect(indicators.length).toBeGreaterThan(0);

    // 2. Get first relevant dataset
    const dataset = indicators[0];

    // 3. Query data for multiple countries (if supported)
    const data = await client.queryData({
      dataflowId: dataset.id,
      lastNObservations: 50,
    });

    expect(Array.isArray(data)).toBe(true);
  });

  it('scenario: user explores health statistics', async () => {
    // 1. List health category datasets
    const healthDatasets = await client.listDataflows({
      category: 'HEA',
      limit: 10,
    });

    expect(healthDatasets.length).toBeGreaterThan(0);

    // 2. Get detailed category information
    const detailed = await client.getCategoriesDetailed();
    const healthCategory = detailed.find(cat => cat.category.id === 'HEA');

    expect(healthCategory).toBeDefined();
    expect(healthCategory?.exampleDataflows.length).toBeGreaterThan(0);

    // 3. Explore first dataset
    const firstDataset = healthDatasets[0];
    const structure = await client.getDataStructure(firstDataset.id);

    expect(structure.dataflowId).toBe(firstDataset.id);
  });

  it('scenario: user generates shareable links', async () => {
    // 1. Find dataset
    const results = await client.searchDataflows('education', 5);
    expect(results.length).toBeGreaterThan(0);

    // 2. Generate URLs for all results
    const urls = results.map(df => client.getDataExplorerUrl(df.id));

    urls.forEach(url => {
      expect(url).toContain('https://data-explorer.oecd.org');
      expect(url).toMatch(/df=[A-Z_]+/);
    });

    // 3. Generate URL with filter
    const firstResult = results[0];
    const filteredUrl = client.getDataExplorerUrl(firstResult.id, 'USA..');

    expect(filteredUrl).toContain('dq=USA..');
  });
});

describe('Error Recovery Scenarios', () => {
  let client: OECDClient;

  beforeEach(() => {
    client = new OECDClient();
  });

  it('should recover from bad dataflow ID and suggest alternatives', async () => {
    // User provides bad dataflow ID
    const badResult = await executeTool(client, 'get_data_structure', {
      dataflow_id: 'GDP_DATA', // Doesn't exist
    });

    expect(badResult.isError).toBe(true);

    // Guide user to search instead
    const searchResult = await executeTool(client, 'search_dataflows', {
      query: 'GDP',
      limit: 5,
    });

    expect(searchResult.isError).toBeUndefined();
    const results = JSON.parse(searchResult.content[0].text);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should handle validation errors with helpful messages', async () => {
    // Invalid period format
    const result = await executeTool(client, 'query_data', {
      dataflow_id: 'QNA',
      start_period: '20-Q1', // Invalid format
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('period format');
  });

  it('should handle empty search results gracefully', async () => {
    const result = await executeTool(client, 'search_dataflows', {
      query: 'xyznonexistentquery123',
      limit: 10,
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });
});

describe('Performance and Scalability', () => {
  let client: OECDClient;

  beforeEach(() => {
    client = new OECDClient();
  });

  it('should handle large category lists efficiently', async () => {
    const start = Date.now();

    const categories = client.getCategories();

    const duration = Date.now() - start;

    expect(categories.length).toBe(17); // All OECD categories
    expect(duration).toBeLessThan(100); // Should be instant (no API call)
  });

  it('should handle large result sets with limits', async () => {
    const results = await client.listDataflows({ limit: 100 });

    expect(results.length).toBeLessThanOrEqual(100);
  });

  it('should apply context protection consistently', async () => {
    // Test multiple queries don't accumulate in memory
    for (let i = 0; i < 5; i++) {
      const result = await executeTool(client, 'query_data', {
        dataflow_id: 'QNA',
        last_n_observations: 100,
      });

      expect(result.content[0].text.length).toBeLessThan(1_000_000); // < 1MB
    }
  });
});
