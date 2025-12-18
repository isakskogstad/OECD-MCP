/**
 * Shared MCP prompt definitions and handlers
 * Used by both stdio and HTTP transports to ensure consistency
 */

/**
 * Prompt definitions for MCP
 */
export const PROMPT_DEFINITIONS = [
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
  {
    name: 'explore_dataset',
    description: 'Guided exploration of a specific OECD dataset - learn its structure, available dimensions, and how to query it',
    arguments: [
      {
        name: 'dataflow_id',
        description: 'Dataset ID to explore (e.g., "QNA", "MEI", "HEALTH_STAT")',
        required: true,
      },
    ],
  },
  {
    name: 'find_data_for_question',
    description: 'Help find the right OECD dataset to answer a research question',
    arguments: [
      {
        name: 'question',
        description: 'Research question to answer (e.g., "How has healthcare spending changed in Europe?")',
        required: true,
      },
    ],
  },
  {
    name: 'build_filter',
    description: 'Interactive help to construct a correct SDMX filter for querying OECD data',
    arguments: [
      {
        name: 'dataflow_id',
        description: 'Dataset ID to build filter for',
        required: true,
      },
      {
        name: 'countries',
        description: 'Countries to include (e.g., "SWE,NOR" or "Nordic")',
        required: false,
      },
      {
        name: 'indicator',
        description: 'Indicator or measure to filter for (if known)',
        required: false,
      },
    ],
  },
  {
    name: 'nordic_comparison',
    description: 'Compare Nordic countries (Sweden, Norway, Denmark, Finland, Iceland) on any indicator',
    arguments: [
      {
        name: 'indicator',
        description: 'Indicator to compare across Nordic countries (e.g., "GDP", "unemployment", "life expectancy")',
        required: true,
      },
      {
        name: 'year',
        description: 'Year for comparison (optional, defaults to latest)',
        required: false,
      },
    ],
  },
];

/**
 * Get a prompt by name with arguments
 */
export function getPrompt(
  name: string,
  args: Record<string, string | undefined>
): {
  messages: Array<{
    role: string;
    content: {
      type: string;
      text: string;
    };
  }>;
} {
  switch (name) {
    case 'analyze_economic_trend': {
      const { indicator, countries, time_period } = args as {
        indicator: string;
        countries: string;
        time_period?: string;
      };

      // Parse countries and time period for concrete tool suggestions
      const countryList = countries.split(',').map((c) => c.trim().toUpperCase());
      const countryFilter = countryList.join('+');
      const timeParts = time_period?.match(/(\d{4})-(\d{4})/);
      const startYear = timeParts?.[1];
      const endYear = timeParts?.[2];

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analyze the ${indicator} trend for ${countries}${time_period ? ` during ${time_period}` : ''}.

## Execute these tool calls in order:

### 1. Find the dataset
\`\`\`json
{"tool": "search_dataflows", "arguments": {"query": "${indicator}", "limit": 5}}
\`\`\`

### 2. Get the structure (replace DATAFLOW_ID with result from step 1)
\`\`\`json
{"tool": "get_data_structure", "arguments": {"dataflow_id": "DATAFLOW_ID"}}
\`\`\`

### 3. Query the data
\`\`\`json
{"tool": "query_data", "arguments": {
  "dataflow_id": "DATAFLOW_ID",
  "filter": "${countryFilter}..",
  ${startYear ? `"start_period": "${startYear}",` : ''}
  ${endYear ? `"end_period": "${endYear}",` : ''}
  "last_n_observations": 100
}}
\`\`\`

### 4. Provide interactive link
\`\`\`json
{"tool": "get_dataflow_url", "arguments": {"dataflow_id": "DATAFLOW_ID", "filter": "${countryFilter}"}}
\`\`\`

## Analysis instructions:
- Compare trends across ${countryList.join(', ')}
- Identify growth rates and turning points
- Highlight the highest/lowest performers
- Note any data gaps or provisional values (OBS_STATUS)`,
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

      // Parse countries for concrete tool suggestions
      const countryList = countries.split(',').map((c) => c.trim().toUpperCase());
      const countryFilter = countryList.join('+');

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Compare ${indicator} across ${countries}${year ? ` for the year ${year}` : ''}.

## Execute these tool calls in order:

### 1. Find the dataset
\`\`\`json
{"tool": "search_dataflows", "arguments": {"query": "${indicator}", "limit": 5}}
\`\`\`

### 2. Get the structure (replace DATAFLOW_ID with result from step 1)
\`\`\`json
{"tool": "get_data_structure", "arguments": {"dataflow_id": "DATAFLOW_ID"}}
\`\`\`

### 3. Query comparative data
\`\`\`json
{"tool": "query_data", "arguments": {
  "dataflow_id": "DATAFLOW_ID",
  "filter": "${countryFilter}..",
  ${year ? `"start_period": "${year}",\n  "end_period": "${year}",` : '"last_n_observations": 50'}
}}
\`\`\`

### 4. Provide interactive link
\`\`\`json
{"tool": "get_dataflow_url", "arguments": {"dataflow_id": "DATAFLOW_ID", "filter": "${countryFilter}"}}
\`\`\`

## Comparison instructions:
- Countries to compare: ${countryList.join(', ')}
- Rank countries from highest to lowest
- Calculate percentage differences from the mean
- Identify outliers (>1 std deviation from mean)
- Note OECD average if available for context`,
            },
          },
        ],
      };
    }

    case 'get_latest_statistics': {
      const { topic, country } = args as { topic: string; country?: string };

      const countryFilter = country ? country.toUpperCase() : 'OECD';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Get the latest ${topic} statistics${country ? ` for ${country}` : ' for all OECD countries'}.

## Execute these tool calls in order:

### 1. Find relevant datasets
\`\`\`json
{"tool": "search_dataflows", "arguments": {"query": "${topic}", "limit": 5}}
\`\`\`

### 2. Get the structure (replace DATAFLOW_ID with best match from step 1)
\`\`\`json
{"tool": "get_data_structure", "arguments": {"dataflow_id": "DATAFLOW_ID"}}
\`\`\`

### 3. Query latest data
\`\`\`json
{"tool": "query_data", "arguments": {
  "dataflow_id": "DATAFLOW_ID",
  "filter": "${countryFilter}..",
  "last_n_observations": 10
}}
\`\`\`

### 4. Provide interactive link
\`\`\`json
{"tool": "get_dataflow_url", "arguments": {"dataflow_id": "DATAFLOW_ID", "filter": "${countryFilter}"}}
\`\`\`

## Presentation instructions:
- Focus on: ${country || 'OECD aggregate and key economies'}
- Show the most recent value with its time period
- Compare to previous period (% change)
- Note data quality (OBS_STATUS: P=provisional, E=estimate)
- Include the Data Explorer URL for user verification`,
            },
          },
        ],
      };
    }

    case 'explore_dataset': {
      const { dataflow_id } = args as { dataflow_id: string };
      const dataflowId = dataflow_id.toUpperCase();

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Explore the OECD dataset: ${dataflowId}

## Execute these tool calls:

### 1. Get dataset structure
\`\`\`json
{"tool": "get_data_structure", "arguments": {"dataflow_id": "${dataflowId}"}}
\`\`\`

### 2. Get sample data (small query)
\`\`\`json
{"tool": "query_data", "arguments": {"dataflow_id": "${dataflowId}", "last_n_observations": 10}}
\`\`\`

### 3. Provide interactive link
\`\`\`json
{"tool": "get_dataflow_url", "arguments": {"dataflow_id": "${dataflowId}"}}
\`\`\`

## Exploration guide:
After getting the structure, explain:
1. **Purpose**: What data does this dataset contain?
2. **Dimensions**: List each dimension with example values
3. **Time coverage**: What time periods are available?
4. **Geography**: Which countries/regions are covered?
5. **Example queries**: Provide 2-3 filter examples for common use cases
6. **Data Explorer link**: Include URL for interactive browsing`,
            },
          },
        ],
      };
    }

    case 'find_data_for_question': {
      const { question } = args as { question: string };

      // Extract likely keywords from the question
      const keywords = question
        .toLowerCase()
        .replace(/[?.,!]/g, '')
        .split(' ')
        .filter((w) => w.length > 3)
        .slice(0, 5);

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Find OECD data to answer: "${question}"

## Execute these searches:

### 1. Search by question keywords
\`\`\`json
{"tool": "search_dataflows", "arguments": {"query": "${keywords.slice(0, 3).join(' ')}", "limit": 10}}
\`\`\`

### 2. Search indicators
\`\`\`json
{"tool": "search_indicators", "arguments": {"indicator": "${keywords[0] || 'economic'}"}}
\`\`\`

### 3. Check popular datasets
\`\`\`json
{"tool": "get_popular_datasets", "arguments": {}}
\`\`\`

## Analysis instructions:
1. **Identify relevant datasets** from search results
2. **Explain relevance** - why each dataset might answer the question
3. **Recommend best option** - which dataset is most suitable
4. **Suggest next steps** - what filters/queries would answer the question
5. **Note limitations** - any data gaps or caveats`,
            },
          },
        ],
      };
    }

    case 'build_filter': {
      const { dataflow_id, countries, indicator } = args as {
        dataflow_id: string;
        countries?: string;
        indicator?: string;
      };

      const dataflowId = dataflow_id.toUpperCase();

      // Handle country groups
      let countryFilter = '';
      if (countries) {
        const countryUpper = countries.toUpperCase();
        if (countryUpper === 'NORDIC') {
          countryFilter = 'SWE+NOR+DNK+FIN+ISL';
        } else if (countryUpper === 'G7') {
          countryFilter = 'USA+JPN+DEU+GBR+FRA+ITA+CAN';
        } else if (countryUpper === 'DACH') {
          countryFilter = 'DEU+AUT+CHE';
        } else {
          countryFilter = countryUpper.split(',').join('+');
        }
      }

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Build an SDMX filter for dataset: ${dataflowId}
${countries ? `Countries: ${countries} → ${countryFilter}` : ''}
${indicator ? `Indicator: ${indicator}` : ''}

## Step 1: Get dataset structure
\`\`\`json
{"tool": "get_data_structure", "arguments": {"dataflow_id": "${dataflowId}"}}
\`\`\`

## Step 2: Build the filter

After getting the structure, guide the user through:

1. **Dimension order**: List dimensions in correct order
2. **Available values**: Show valid codes for each dimension
3. **Filter construction**: Build filter step by step

### SDMX Filter Rules:
- Dimensions separated by periods: \`A.B.C.D\`
- Multiple values with plus: \`A+B.C.D\`
- Wildcards (all values) with empty: \`A..D\`
- Must match dimension count exactly

### Example filter template:
Based on structure, suggest filter like:
\`\`\`
${countryFilter || '[COUNTRY]'}.${indicator || '[MEASURE]'}..
\`\`\`

## Step 3: Test the filter
\`\`\`json
{"tool": "query_data", "arguments": {"dataflow_id": "${dataflowId}", "filter": "[BUILT_FILTER]", "last_n_observations": 5}}
\`\`\`

## Step 4: Provide link
\`\`\`json
{"tool": "get_dataflow_url", "arguments": {"dataflow_id": "${dataflowId}", "filter": "[BUILT_FILTER]"}}
\`\`\``,
            },
          },
        ],
      };
    }

    case 'nordic_comparison': {
      const { indicator, year } = args as { indicator: string; year?: string };
      const nordicFilter = 'SWE+NOR+DNK+FIN+ISL';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Compare Nordic countries on: ${indicator}${year ? ` (${year})` : ''}

Nordic countries: Sweden (SWE), Norway (NOR), Denmark (DNK), Finland (FIN), Iceland (ISL)

## Execute these tool calls:

### 1. Find relevant dataset
\`\`\`json
{"tool": "search_dataflows", "arguments": {"query": "${indicator}", "limit": 5}}
\`\`\`

### 2. Get structure (replace DATAFLOW_ID)
\`\`\`json
{"tool": "get_data_structure", "arguments": {"dataflow_id": "DATAFLOW_ID"}}
\`\`\`

### 3. Query Nordic data
\`\`\`json
{"tool": "query_data", "arguments": {
  "dataflow_id": "DATAFLOW_ID",
  "filter": "${nordicFilter}..",
  ${year ? `"start_period": "${year}",\n  "end_period": "${year}",` : '"last_n_observations": 20'}
}}
\`\`\`

### 4. Interactive link
\`\`\`json
{"tool": "get_dataflow_url", "arguments": {"dataflow_id": "DATAFLOW_ID", "filter": "${nordicFilter}"}}
\`\`\`

## Comparison format:
Present results as a Nordic ranking:
| Rank | Country | Value | vs Nordic Avg |
|------|---------|-------|---------------|
| 1    | ...     | ...   | +X%           |

Highlight:
- Which Nordic country leads
- How close/spread the values are
- Notable patterns or outliers
- Historical context if available`,
            },
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}
