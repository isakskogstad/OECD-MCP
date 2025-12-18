/**
 * Shared MCP tool definitions and handlers
 * Used by both stdio and HTTP transports to ensure consistency
 */

import { OECDClient } from './oecd-client.js';
import {
  validateInput,
  SearchDataflowsSchema,
  ListDataflowsSchema,
  GetDataStructureSchema,
  QueryDataSchema,
  SearchIndicatorsSchema,
  GetDataflowUrlSchema,
} from './validation.js';

// Safety limits for context window protection
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;

/**
 * MCP tool definitions (schemas)
 * These define the interface for each tool
 */
export const TOOL_DEFINITIONS = [
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
            'Optional category filter: ECO, HEA, EDU, ENV, TRD, JOB, NRG, AGR, GOV, SOC, DEV, STI, TAX, FIN, TRA, IND, REG, HOU, MIG',
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
      'Query actual statistical data from an OECD dataset. ⚠️ IMPORTANT: Defaults to last 100 observations (max 1000) to protect context window. Use filters, time periods, or last_n_observations to control data size. Large datasets (e.g. SOCX_AGG) can have 70,000+ observations - always specify limits!',
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
            'Dimension filter (e.g., "USA.GDP..\" for US GDP). Use "*" or "all" for all values. Get structure first to see valid dimensions.',
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
          description: 'Get only the last N observations (default: 100, max: 1000 to protect against context overflow)',
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
      'Get all OECD data categories with example datasets for each category. Returns comprehensive information about all 19 categories.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Tool handler function type
 */
export type ToolHandler = (client: OECDClient, args: any) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

/**
 * Tool handlers implementation
 * Each handler takes the client and arguments, returns MCP-formatted response
 */
export const TOOL_HANDLERS: Record<string, ToolHandler> = {
  search_dataflows: async (client, args) => {
    const validated = validateInput(SearchDataflowsSchema, args, 'search_dataflows');
    const results = await client.searchDataflows(validated.query, validated.limit);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  },

  list_dataflows: async (client, args) => {
    const validated = validateInput(ListDataflowsSchema, args, 'list_dataflows');
    const results = await client.listDataflows({
      category: validated.category,
      limit: validated.limit,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  },

  get_data_structure: async (client, args) => {
    const validated = validateInput(GetDataStructureSchema, args, 'get_data_structure');
    const structure = await client.getDataStructure(validated.dataflow_id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(structure, null, 2),
        },
      ],
    };
  },

  query_data: async (client, args) => {
    const validated = validateInput(QueryDataSchema, args, 'query_data');

    // Apply safety limits to protect LLM context window
    let effectiveLimit = validated.last_n_observations ?? DEFAULT_LIMIT;
    let limitApplied = false;

    if (effectiveLimit > MAX_LIMIT) {
      effectiveLimit = MAX_LIMIT;
      limitApplied = true;
    }

    const data = await client.queryData({
      dataflowId: validated.dataflow_id,
      filter: validated.filter,
      startPeriod: validated.start_period,
      endPeriod: validated.end_period,
      lastNObservations: effectiveLimit,
    });

    // Add warning if limit was applied or dataset is large
    let response = JSON.stringify(data, null, 2);

    if (limitApplied || data.length >= MAX_LIMIT * 0.8) {
      const warning = {
        warning: limitApplied
          ? `⚠️ Requested ${validated.last_n_observations} observations but limited to ${MAX_LIMIT} to protect context window.`
          : `⚠️ Returning ${data.length} observations (near max limit of ${MAX_LIMIT}). Consider using filters or time periods to reduce data size.`,
        total_observations: data.length,
        data: data,
      };
      response = JSON.stringify(warning, null, 2);
    }

    return {
      content: [
        {
          type: 'text',
          text: response,
        },
      ],
    };
  },

  get_categories: async (client, _args) => {
    const categories = client.getCategories();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(categories, null, 2),
        },
      ],
    };
  },

  get_popular_datasets: async (client, _args) => {
    const datasets = client.getPopularDatasets();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(datasets, null, 2),
        },
      ],
    };
  },

  search_indicators: async (client, args) => {
    const validated = validateInput(SearchIndicatorsSchema, args, 'search_indicators');
    const results = await client.searchIndicators({
      indicator: validated.indicator,
      category: validated.category,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  },

  get_dataflow_url: async (client, args) => {
    const validated = validateInput(GetDataflowUrlSchema, args, 'get_dataflow_url');
    const url = client.getDataExplorerUrl(validated.dataflow_id, validated.filter);
    return {
      content: [
        {
          type: 'text',
          text: url,
        },
      ],
    };
  },

  list_categories_detailed: async (client, _args) => {
    const detailed = await client.getCategoriesDetailed();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(detailed, null, 2),
        },
      ],
    };
  },
};

/**
 * Execute a tool by name with error handling
 */
export async function executeTool(
  client: OECDClient,
  name: string,
  args: any
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  try {
    const handler = TOOL_HANDLERS[name];
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }
    return await handler(client, args);
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
}
