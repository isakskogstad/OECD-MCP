/**
 * Shared MCP resource definitions and handlers
 * Used by both stdio and HTTP transports to ensure consistency
 */

import { OECDClient } from './oecd-client.js';

/**
 * Resource definitions for MCP
 */
export const RESOURCE_DEFINITIONS = [
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
  {
    uri: 'oecd://countries',
    name: 'OECD Country Codes',
    description: 'ISO 3166-1 alpha-3 country codes for all OECD members, partners, and aggregates',
    mimeType: 'application/json',
  },
  {
    uri: 'oecd://filter-guide',
    name: 'SDMX Filter Syntax Guide',
    description: 'How to construct filters for OECD SDMX API queries',
    mimeType: 'application/json',
  },
  {
    uri: 'oecd://glossary',
    name: 'OECD Statistical Glossary',
    description: 'Definitions of key OECD statistical terms and concepts',
    mimeType: 'application/json',
  },
  {
    uri: 'oecd://llm-instructions',
    name: 'LLM Usage Instructions',
    description: 'System instructions for LLMs on how to effectively use this OECD MCP server',
    mimeType: 'text/markdown',
  },
];

/**
 * OECD Country data - ISO 3166-1 alpha-3 codes
 */
export const OECD_COUNTRIES = {
  description: 'ISO 3166-1 alpha-3 country codes used in OECD data queries',
  usage: 'Use these codes in the filter parameter for query_data, e.g., filter: "SWE.GDP.."',
  oecd_members: {
    AUS: { name: 'Australia', region: 'Oceania' },
    AUT: { name: 'Austria', region: 'Europe' },
    BEL: { name: 'Belgium', region: 'Europe' },
    CAN: { name: 'Canada', region: 'North America' },
    CHL: { name: 'Chile', region: 'South America' },
    COL: { name: 'Colombia', region: 'South America' },
    CRI: { name: 'Costa Rica', region: 'Central America' },
    CZE: { name: 'Czechia', region: 'Europe' },
    DNK: { name: 'Denmark', region: 'Europe' },
    EST: { name: 'Estonia', region: 'Europe' },
    FIN: { name: 'Finland', region: 'Europe' },
    FRA: { name: 'France', region: 'Europe' },
    DEU: { name: 'Germany', region: 'Europe' },
    GRC: { name: 'Greece', region: 'Europe' },
    HUN: { name: 'Hungary', region: 'Europe' },
    ISL: { name: 'Iceland', region: 'Europe' },
    IRL: { name: 'Ireland', region: 'Europe' },
    ISR: { name: 'Israel', region: 'Middle East' },
    ITA: { name: 'Italy', region: 'Europe' },
    JPN: { name: 'Japan', region: 'Asia' },
    KOR: { name: 'Korea', region: 'Asia' },
    LVA: { name: 'Latvia', region: 'Europe' },
    LTU: { name: 'Lithuania', region: 'Europe' },
    LUX: { name: 'Luxembourg', region: 'Europe' },
    MEX: { name: 'Mexico', region: 'North America' },
    NLD: { name: 'Netherlands', region: 'Europe' },
    NZL: { name: 'New Zealand', region: 'Oceania' },
    NOR: { name: 'Norway', region: 'Europe' },
    POL: { name: 'Poland', region: 'Europe' },
    PRT: { name: 'Portugal', region: 'Europe' },
    SVK: { name: 'Slovak Republic', region: 'Europe' },
    SVN: { name: 'Slovenia', region: 'Europe' },
    ESP: { name: 'Spain', region: 'Europe' },
    SWE: { name: 'Sweden', region: 'Europe' },
    CHE: { name: 'Switzerland', region: 'Europe' },
    TUR: { name: 'Türkiye', region: 'Europe/Asia' },
    GBR: { name: 'United Kingdom', region: 'Europe' },
    USA: { name: 'United States', region: 'North America' },
  },
  partners: {
    ARG: { name: 'Argentina', region: 'South America' },
    BRA: { name: 'Brazil', region: 'South America' },
    CHN: { name: 'China', region: 'Asia' },
    IND: { name: 'India', region: 'Asia' },
    IDN: { name: 'Indonesia', region: 'Asia' },
    RUS: { name: 'Russia', region: 'Europe/Asia' },
    SAU: { name: 'Saudi Arabia', region: 'Middle East' },
    ZAF: { name: 'South Africa', region: 'Africa' },
  },
  aggregates: {
    OECD: { name: 'OECD Total', description: 'All 38 OECD member countries' },
    EU27: { name: 'European Union (27)', description: 'EU member states' },
    EA19: { name: 'Euro Area (19)', description: 'Countries using the Euro' },
    G7: { name: 'G7 Countries', description: 'USA, JPN, DEU, GBR, FRA, ITA, CAN' },
    G20: { name: 'G20 Countries', description: 'Major economies' },
    WLD: { name: 'World', description: 'Global aggregate' },
  },
  regional_groups: {
    nordic: ['DNK', 'FIN', 'ISL', 'NOR', 'SWE'],
    baltic: ['EST', 'LVA', 'LTU'],
    benelux: ['BEL', 'NLD', 'LUX'],
    dach: ['DEU', 'AUT', 'CHE'],
    anglosphere: ['AUS', 'CAN', 'GBR', 'IRL', 'NZL', 'USA'],
  },
};

/**
 * SDMX Filter Guide - Official syntax from OECD API documentation
 * Source: https://sis-cc.gitlab.io/dotstatsuite-documentation/using-api/typical-use-cases/
 */
export const SDMX_FILTER_GUIDE = {
  description: 'Guide for constructing SDMX dimension filters for OECD data queries',
  source: 'OECD SDMX API Documentation (2024)',

  syntax: {
    dimension_separator: {
      character: '.',
      description: 'Periods separate dimensions in the filter key',
      example: 'SWE.GDP.A',
    },
    multiple_values: {
      character: '+',
      description: 'Plus sign separates multiple values within a dimension',
      example: 'SWE+NOR+DNK.GDP.A',
    },
    wildcard: {
      character: '(empty)',
      description: 'Leave position empty (two dots) to select all values for that dimension',
      example: 'SWE..A',
    },
  },

  rules: [
    'The number of positions in the filter must match the number of dimensions in the dataset',
    'Dimensions must appear in the same order as defined in the Data Structure Definition (DSD)',
    'Use get_data_structure to see the dimension order for a specific dataset',
    'Empty positions (..) mean all values for that dimension',
    'Trailing empty dimensions can be omitted',
  ],

  query_parameters: {
    startPeriod: {
      description: 'Start of time range',
      formats: ['2020', '2020-Q1', '2020-01'],
      example: 'startPeriod=2020',
    },
    endPeriod: {
      description: 'End of time range',
      formats: ['2024', '2024-Q4', '2024-12'],
      example: 'endPeriod=2024',
    },
    lastNObservations: {
      description: 'Return only the last N observations',
      example: 'lastNObservations=10',
    },
  },

  examples: [
    {
      description: 'Swedish GDP data',
      filter: 'SWE.B1_GE..',
      explanation: 'REF_AREA=Sweden, MEASURE=GDP, other dimensions=all',
    },
    {
      description: 'Nordic countries comparison',
      filter: 'SWE+NOR+DNK+FIN..',
      explanation: 'Multiple countries using + separator',
    },
    {
      description: 'All OECD countries, specific measure',
      filter: 'OECD..GROWTH',
      explanation: 'OECD aggregate, wildcard for middle dimension, specific measure',
    },
    {
      description: 'USA quarterly data',
      filter: 'USA...Q',
      explanation: 'USA, wildcards, quarterly frequency',
    },
  ],

  common_mistakes: [
    {
      mistake: 'Using country names instead of codes',
      wrong: 'Sweden.GDP..',
      correct: 'SWE.B1_GE..',
    },
    {
      mistake: 'Using comma instead of plus for multiple values',
      wrong: 'SWE,NOR,DNK..',
      correct: 'SWE+NOR+DNK..',
    },
    {
      mistake: 'Wrong dimension order',
      solution: 'Always check get_data_structure first to see the correct order',
    },
    {
      mistake: 'Missing dimensions',
      wrong: 'SWE.GDP (only 2 dimensions when dataset has 4)',
      correct: 'SWE.GDP.. (use empty positions for remaining dimensions)',
    },
  ],

  workflow: [
    '1. Use search_dataflows to find the dataset you need',
    '2. Use get_data_structure to see dimensions and their order',
    '3. Build filter following the dimension order',
    '4. Use query_data with filter and time parameters',
    '5. Use get_dataflow_url to give users an interactive link',
  ],
};

/**
 * OECD Statistical Glossary
 * Definitions of key statistical terms and concepts
 */
export const OECD_GLOSSARY = {
  description: 'Definitions of key OECD statistical terms and concepts',
  source: 'OECD Statistics Directorate',

  economic_indicators: {
    GDP: {
      term: 'Gross Domestic Product',
      definition: 'Total value of goods and services produced within a country in a given period',
      variants: {
        nominal: 'GDP at current prices (not adjusted for inflation)',
        real: 'GDP adjusted for inflation (constant prices)',
        per_capita: 'GDP divided by total population',
        PPP: 'GDP adjusted for Purchasing Power Parity across countries',
      },
    },
    CLI: {
      term: 'Composite Leading Indicator',
      definition: 'A composite indicator designed to predict turning points in the business cycle',
      interpretation: 'Values above 100 indicate expansion, below 100 indicate contraction',
    },
    CPI: {
      term: 'Consumer Price Index',
      definition: 'Measures changes in prices of a basket of goods and services consumed by households',
      use: 'Primary measure of inflation',
    },
    unemployment_rate: {
      term: 'Unemployment Rate',
      definition: 'Percentage of the labour force that is unemployed and actively seeking work',
      formula: '(Unemployed persons / Labour force) × 100',
    },
  },

  demographic_terms: {
    working_age_population: {
      definition: 'Population aged 15-64 years',
      note: 'Some OECD datasets use 15+ or 16-64 depending on national definitions',
    },
    labour_force: {
      definition: 'All persons of working age who are either employed or unemployed',
      excludes: 'Students, retirees, homemakers not seeking work',
    },
    dependency_ratio: {
      definition: 'Ratio of dependents (aged 0-14 and 65+) to working-age population',
      formula: '((Population 0-14) + (Population 65+)) / (Population 15-64) × 100',
    },
  },

  data_quality: {
    OBS_STATUS: {
      term: 'Observation Status',
      codes: {
        A: 'Normal value',
        B: 'Break in series',
        E: 'Estimated value',
        F: 'Forecast',
        M: 'Missing value',
        P: 'Provisional',
        S: 'Strike or other disruption',
      },
    },
    UNIT_MEASURE: {
      term: 'Unit of Measure',
      common_values: {
        PC: 'Percentage',
        PC_GDP: 'Percentage of GDP',
        PC_CHNG: 'Percentage change',
        IDX: 'Index (usually base year = 100)',
        USD: 'US Dollars',
        USD_PPP: 'US Dollars at PPP',
        HEADS: 'Number of persons',
        MLN_USD: 'Millions of US Dollars',
      },
    },
  },

  time_dimensions: {
    FREQ: {
      term: 'Frequency',
      codes: {
        A: 'Annual',
        Q: 'Quarterly',
        M: 'Monthly',
        W: 'Weekly',
        D: 'Daily',
      },
    },
    TIME_PERIOD: {
      term: 'Time Period',
      formats: {
        annual: '2024',
        quarterly: '2024-Q1, 2024-Q2, 2024-Q3, 2024-Q4',
        monthly: '2024-01, 2024-02, ..., 2024-12',
      },
    },
  },

  adjustment_types: {
    SA: 'Seasonally adjusted - removes seasonal patterns',
    NSA: 'Not seasonally adjusted - raw data',
    SCA: 'Seasonally and calendar adjusted',
    WDA: 'Working day adjusted',
    TREND: 'Trend - removes seasonal and irregular components',
  },

  aggregates: {
    OECD: 'Average or total for all 38 OECD member countries',
    EU27: 'European Union (27 member states after Brexit)',
    EA19: 'Euro Area (19 countries using the Euro)',
    G7: 'Group of Seven major advanced economies',
    G20: 'Group of Twenty major economies',
    WLD: 'World total or average',
  },
};

/**
 * LLM Instructions for OECD MCP Server
 * Guidance for AI assistants on how to effectively use this server
 */
export const LLM_INSTRUCTIONS = `# Instructions for LLMs Using OECD MCP Server

## Overview
You have access to OECD's statistical database containing 5,000+ datasets across 19 categories covering economy, health, education, environment, trade, employment, and more.

## Recommended Workflow

### Step 1: Find the Right Dataset
- Use \`search_dataflows\` with keywords (e.g., "GDP", "unemployment", "inflation")
- Or use \`list_dataflows\` with category filter (ECO, HEA, EDU, ENV, TRD, JOB, etc.)
- Or use \`get_popular_datasets\` for commonly used data
- Or use \`search_indicators\` for specific economic/social indicators

### Step 2: Understand the Structure
- Call \`get_data_structure\` with the dataflow_id
- Note the dimension order - this is CRITICAL for building filters
- Check what values are available for each dimension

### Step 3: Query the Data
- Build filter matching dimension order from structure
- Always use \`last_n_observations\` to limit data size (default: 100, max: 1000)
- Use \`start_period\` and \`end_period\` for time ranges

### Step 4: Provide User Access
- Call \`get_dataflow_url\` to give user a link to OECD Data Explorer
- This lets them explore and download data interactively

## Critical Rules

### DO:
- Always check structure before building filters
- Limit queries with \`last_n_observations\` (default: 100, max: 1000)
- Use ISO 3166-1 alpha-3 country codes (SWE, not Sweden)
- Combine multiple countries with + (SWE+NOR+DNK)
- Use empty positions (..) for wildcard dimensions

### DON'T:
- Never guess filter format - check structure first
- Never query without limits - large datasets have 70,000+ observations
- Never use country names - always use codes
- Never assume dimension order - it varies by dataset

## Common Country Codes
- Nordic: SWE, NOR, DNK, FIN, ISL
- Major economies: USA, GBR, DEU, FRA, JPN, CHN
- Aggregates: OECD, EU27, G7, G20, WLD

## Filter Syntax
- Dimensions separated by periods: SWE.GDP.A
- Multiple values with plus: SWE+NOR+DNK.GDP.A
- Wildcards with empty position: SWE..A (all values for middle dimension)

## Error Handling
- 422 errors usually mean invalid filter - check structure and dimension order
- Timeout errors - try smaller query with \`last_n_observations\` or retry
- Empty results - verify filter values exist in the dataset's codelists

## Example Workflow

User: "What's Sweden's GDP growth?"

1. Search: \`search_dataflows({query: "GDP"})\`
   → Found QNA (Quarterly National Accounts)

2. Structure: \`get_data_structure({dataflow_id: "QNA"})\`
   → Dimensions: REF_AREA, TRANSACTION, PRICE_BASE, ADJUSTMENT, FREQ

3. Query: \`query_data({dataflow_id: "QNA", filter: "SWE.B1_GE..", last_n_observations: 20})\`
   → Returns GDP data

4. Link: \`get_dataflow_url({dataflow_id: "QNA", filter: "SWE.B1_GE"})\`
   → https://data-explorer.oecd.org/vis?df=QNA&dq=SWE.B1_GE

## Available Resources
- \`oecd://countries\` - Country codes and regional groups
- \`oecd://filter-guide\` - Detailed filter syntax guide
- \`oecd://glossary\` - Statistical terms and definitions
- \`oecd://categories\` - All 19 data categories
- \`oecd://dataflows/popular\` - Commonly used datasets
- \`oecd://api/info\` - API endpoint information
`;

/**
 * Read a resource by URI
 */
export function readResource(
  client: OECDClient,
  uri: string
): {
  contents: Array<{
    uri: string;
    mimeType: string;
    text: string;
  }>;
} {
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

    case 'oecd://countries': {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(OECD_COUNTRIES, null, 2),
          },
        ],
      };
    }

    case 'oecd://filter-guide': {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(SDMX_FILTER_GUIDE, null, 2),
          },
        ],
      };
    }

    case 'oecd://glossary': {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(OECD_GLOSSARY, null, 2),
          },
        ],
      };
    }

    case 'oecd://llm-instructions': {
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: LLM_INSTRUCTIONS,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}
