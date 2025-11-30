#!/usr/bin/env node

/**
 * OECD MCP Server - stdio transport
 * Provides access to OECD statistical data via SDMX API
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { OECDClient } from './oecd-client.js';
import { z } from 'zod';

const client = new OECDClient();

// Create MCP server
const server = new Server(
  {
    name: 'oecd-mcp-server',
    version: '3.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// ========== TOOLS ==========

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_dataflows',
        description:
          'Search for OECD datasets (dataflows) by keyword. Returns matching datasets with their IDs, names, and descriptions.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find relevant datasets',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 20)',
              default: 20,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'list_dataflows',
        description:
          'List available OECD dataflows (datasets), optionally filtered by category. Use this to browse datasets by topic area.',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description:
                'Optional category filter: ECO, HEA, EDU, ENV, TRD, JOB, NRG, AGR, GOV, SOC, DEV, STI, TAX, FIN, TRA, IND, REG',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 50)',
              default: 50,
            },
          },
        },
      },
      {
        name: 'get_data_structure',
        description:
          'Get the metadata and structure of a specific OECD dataset. Returns dimensions, attributes, and valid values for querying data.',
        inputSchema: {
          type: 'object',
          properties: {
            dataflow_id: {
              type: 'string',
              description: 'Dataflow ID (e.g., "QNA", "MEI", "HEALTH_STAT")',
            },
          },
          required: ['dataflow_id'],
        },
      },
      {
        name: 'query_data',
        description:
          'Query actual statistical data from an OECD dataset. Use dimension filters to specify what data to retrieve.',
        inputSchema: {
          type: 'object',
          properties: {
            dataflow_id: {
              type: 'string',
              description: 'Dataflow ID to query',
            },
            filter: {
              type: 'string',
              description:
                'Dimension filter (e.g., "USA.GDP.." for US GDP). Use "*" or "all" for all values. Get structure first to see valid dimensions.',
            },
            start_period: {
              type: 'string',
              description: 'Start period (e.g., "2020-Q1", "2020-01")',
            },
            end_period: {
              type: 'string',
              description: 'End period (e.g., "2023-Q4", "2023-12")',
            },
            last_n_observations: {
              type: 'number',
              description: 'Get only the last N observations',
            },
          },
          required: ['dataflow_id'],
        },
      },
      {
        name: 'get_categories',
        description:
          'Get all available OECD data categories (17 categories covering all topics: Economy, Health, Education, Environment, etc.)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_popular_datasets',
        description:
          'Get a curated list of commonly used OECD datasets across all categories.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'search_indicators',
        description:
          'Search for specific economic or social indicators by keyword (e.g., "inflation", "unemployment", "GDP").',
        inputSchema: {
          type: 'object',
          properties: {
            indicator: {
              type: 'string',
              description: 'Indicator to search for',
            },
            category: {
              type: 'string',
              description: 'Optional category filter',
            },
          },
          required: ['indicator'],
        },
      },
      {
        name: 'get_dataflow_url',
        description:
          'Generate an OECD Data Explorer URL for a dataset. Use this to provide users with a direct link to explore data visually in their browser.',
        inputSchema: {
          type: 'object',
          properties: {
            dataflow_id: {
              type: 'string',
              description: 'Dataflow ID',
            },
            filter: {
              type: 'string',
              description: 'Optional dimension filter',
            },
          },
          required: ['dataflow_id'],
        },
      },
      {
        name: 'list_categories_detailed',
        description:
          'Get all OECD data categories with example datasets for each category. Returns comprehensive information about all 17 categories.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_dataflows': {
        const { query, limit = 20 } = args as { query: string; limit?: number };
        const results = await client.searchDataflows(query, limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'list_dataflows': {
        const { category, limit = 50 } = args as { category?: string; limit?: number };
        const results = await client.listDataflows({ category, limit });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'get_data_structure': {
        const { dataflow_id } = args as { dataflow_id: string };
        const structure = await client.getDataStructure(dataflow_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(structure, null, 2),
            },
          ],
        };
      }

      case 'query_data': {
        const {
          dataflow_id,
          filter,
          start_period,
          end_period,
          last_n_observations,
        } = args as {
          dataflow_id: string;
          filter?: string;
          start_period?: string;
          end_period?: string;
          last_n_observations?: number;
        };

        const data = await client.queryData({
          dataflowId: dataflow_id,
          filter,
          startPeriod: start_period,
          endPeriod: end_period,
          lastNObservations: last_n_observations,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'get_categories': {
        const categories = client.getCategories();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(categories, null, 2),
            },
          ],
        };
      }

      case 'get_popular_datasets': {
        const datasets = client.getPopularDatasets();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(datasets, null, 2),
            },
          ],
        };
      }

      case 'search_indicators': {
        const { indicator, category } = args as { indicator: string; category?: string };
        const results = await client.searchIndicators({ indicator, category });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'get_dataflow_url': {
        const { dataflow_id, filter } = args as { dataflow_id: string; filter?: string };
        const url = client.getDataExplorerUrl(dataflow_id, filter);
        return {
          content: [
            {
              type: 'text',
              text: url,
            },
          ],
        };
      }

      case 'list_categories_detailed': {
        const detailed = await client.getCategoriesDetailed();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(detailed, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// ========== RESOURCES ==========

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'oecd://categories',
        name: 'OECD Data Categories',
        description: 'List of all 17 OECD data categories with descriptions',
        mimeType: 'application/json',
      },
      {
        uri: 'oecd://dataflows/popular',
        name: 'Popular OECD Datasets',
        description: 'Curated list of commonly used OECD datasets',
        mimeType: 'application/json',
      },
      {
        uri: 'oecd://api/info',
        name: 'OECD API Information',
        description: 'Information about the OECD SDMX API endpoints and usage',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case 'oecd://categories': {
      const categories = client.getCategories();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(categories, null, 2),
          },
        ],
      };
    }

    case 'oecd://dataflows/popular': {
      const popular = client.getPopularDatasets();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(popular, null, 2),
          },
        ],
      };
    }

    case 'oecd://api/info': {
      const info = client.getApiInfo();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(info, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// ========== PROMPTS ==========

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'analyze_economic_trend',
        description: 'Analyze economic indicators over time for specified countries',
        arguments: [
          {
            name: 'indicator',
            description: 'Economic indicator to analyze (e.g., "GDP", "inflation", "unemployment")',
            required: true,
          },
          {
            name: 'countries',
            description: 'Comma-separated list of country codes (e.g., "USA,GBR,DEU")',
            required: true,
          },
          {
            name: 'time_period',
            description: 'Time period for analysis (e.g., "2020-2023")',
            required: false,
          },
        ],
      },
      {
        name: 'compare_countries',
        description: 'Compare data across multiple countries for a specific indicator',
        arguments: [
          {
            name: 'indicator',
            description: 'Indicator to compare (e.g., "GDP per capita", "life expectancy")',
            required: true,
          },
          {
            name: 'countries',
            description: 'Comma-separated list of countries to compare',
            required: true,
          },
          {
            name: 'year',
            description: 'Year for comparison (optional)',
            required: false,
          },
        ],
      },
      {
        name: 'get_latest_statistics',
        description: 'Get the most recent statistics for a specific topic',
        arguments: [
          {
            name: 'topic',
            description: 'Topic to get statistics for (e.g., "unemployment", "inflation", "GDP growth")',
            required: true,
          },
          {
            name: 'country',
            description: 'Country code (optional, returns data for all countries if not specified)',
            required: false,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'analyze_economic_trend': {
      const { indicator, countries, time_period } = args as {
        indicator: string;
        countries: string;
        time_period?: string;
      };

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analyze the ${indicator} trend for ${countries}${time_period ? ` during ${time_period}` : ''}.

Steps:
1. Search for relevant OECD datasets containing ${indicator} data
2. Get the data structure to understand available dimensions
3. Query the data for the specified countries and time period
4. Analyze trends, compare countries, and highlight key insights
5. Provide a summary with visualizable data if possible`,
            },
          },
        ],
      };
    }

    case 'compare_countries': {
      const { indicator, countries, year } = args as {
        indicator: string;
        countries: string;
        year?: string;
      };

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Compare ${indicator} across ${countries}${year ? ` for the year ${year}` : ''}.

Steps:
1. Search for OECD datasets containing ${indicator}
2. Query data for all specified countries
3. Compare values and rankings
4. Highlight differences and similarities
5. Provide context about what the differences might indicate`,
            },
          },
        ],
      };
    }

    case 'get_latest_statistics': {
      const { topic, country } = args as { topic: string; country?: string };

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Get the latest ${topic} statistics${country ? ` for ${country}` : ' for all OECD countries'}.

Steps:
1. Search for datasets related to ${topic}
2. Identify the most relevant and recent dataset
3. Query the latest available data
4. Present key statistics and recent trends
5. Highlight any notable changes or patterns`,
            },
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OECD MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
