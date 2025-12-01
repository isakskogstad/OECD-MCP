/**
 * Type definitions for OECD MCP Server
 */

export interface OECDCategory {
  id: string;
  name: string;
  description: string;
  exampleDatasets: string[];
}

export interface PopularDataset {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface DataflowFilter {
  category?: string;
  limit?: number;
}

export interface DataQuery {
  dataflowId: string;
  filter?: string;
  startPeriod?: string;
  endPeriod?: string;
  lastNObservations?: number;
}

export interface IndicatorSearch {
  indicator: string;
  category?: string;
}

// OECD Data Categories
// NOTE: exampleDatasets ONLY includes actually implemented dataflows (see known-dataflows.ts)
export const OECD_CATEGORIES: OECDCategory[] = [
  {
    id: 'ECO',
    name: 'Economy',
    description: 'GDP, growth, inflation, interest rates, economic forecasts',
    exampleDatasets: ['QNA', 'MEI'], // Quarterly National Accounts, Main Economic Indicators
  },
  {
    id: 'HEA',
    name: 'Health',
    description: 'Healthcare spending, life expectancy, health outcomes',
    exampleDatasets: ['HEALTH_STAT'], // Health Statistics - Perceived Health Status
  },
  {
    id: 'EDU',
    name: 'Education',
    description: 'PISA results, education spending, educational attainment',
    exampleDatasets: ['EAG_FIN'], // Education at a Glance - Financial Indicators
  },
  {
    id: 'ENV',
    name: 'Environment',
    description: 'Climate, emissions, pollution, green growth, biodiversity',
    exampleDatasets: ['DF_LAND_TEMP', 'DF_HEAT_STRESS', 'DF_COASTAL_FLOOD', 'DF_RIVER_FLOOD', 'DF_DROUGHT', 'DF_FIRES', 'DF_PRECIP', 'DF_CLIM_PROJ'], // Climate indicators for cities
  },
  {
    id: 'TRD',
    name: 'Trade',
    description: 'International trade, imports, exports, trade agreements',
    exampleDatasets: ['TIS'], // Trade in Services
  },
  {
    id: 'JOB',
    name: 'Employment',
    description: 'Labour market, unemployment, wages, working conditions',
    exampleDatasets: ['AVD_DUR'], // Unemployment by Duration
  },
  {
    id: 'NRG',
    name: 'Energy',
    description: 'Energy production, consumption, renewables, energy prices',
    exampleDatasets: ['IEA_ENERGY', 'IEA_REN', 'IEA_PRICES'],
  },
  {
    id: 'AGR',
    name: 'Agriculture and Fisheries',
    description: 'Agricultural production, food security, fisheries',
    exampleDatasets: ['FISH_AQUA', 'FISH_FLEET', 'PSE'],
  },
  {
    id: 'GOV',
    name: 'Government',
    description: 'Public sector, governance, trust in government, e-government',
    exampleDatasets: ['GOV_2023', 'SNA_TABLE11', 'GGDP'],
  },
  {
    id: 'SOC',
    name: 'Social Protection and Well-being',
    description: 'Social spending, inequality, quality of life',
    exampleDatasets: ['SOCX_AGG', 'IDD', 'BLI'],
  },
  {
    id: 'DEV',
    name: 'Development',
    description: 'Development aid, ODA, international cooperation',
    exampleDatasets: ['TABLE1', 'TABLE2A', 'CRS'],
  },
  {
    id: 'STI',
    name: 'Innovation and Technology',
    description: 'R&D spending, patents, digital economy, artificial intelligence',
    exampleDatasets: ['MSTI_PUB', 'PATS_IPC', 'ICT_ACCESS'],
  },
  {
    id: 'TAX',
    name: 'Taxation',
    description: 'Tax revenues, tax rates, tax policy',
    exampleDatasets: ['REV', 'CTS_CIT', 'CTS_PIT'],
  },
  {
    id: 'FIN',
    name: 'Finance',
    description: 'Financial markets, banking, insurance, pensions',
    exampleDatasets: ['FDI', 'FI', 'PENSION'],
  },
  {
    id: 'TRA',
    name: 'Transport',
    description: 'Infrastructure, mobility, freight, passenger transport',
    exampleDatasets: ['ITF_GOODS', 'ITF_PASSENGER', 'ITF_INV'],
  },
  {
    id: 'IND',
    name: 'Industry and Services',
    description: 'Industrial production, services sector, productivity',
    exampleDatasets: ['PDB_LV', 'SNA_TABLE6A', 'STAN08BIS'],
  },
  {
    id: 'REG',
    name: 'Regional Statistics',
    description: 'Sub-national data, cities, regions, territorial indicators',
    exampleDatasets: ['REGION_DEMOGR', 'REGION_ECONOM', 'REGION_INNOV'],
  },
];

// Popular OECD Datasets
// NOTE: This list includes both AVAILABLE (✅) and UNAVAILABLE (❌) datasets via SDMX API
// See known-dataflows.ts for actually implemented dataflows
export const POPULAR_DATASETS: PopularDataset[] = [
  // ✅ AVAILABLE via SDMX API
  {
    id: 'QNA',
    name: 'Quarterly National Accounts',
    description: '✅ AVAILABLE - GDP and main aggregates, quarterly frequency',
    category: 'ECO',
  },
  {
    id: 'MEI',
    name: 'Main Economic Indicators',
    description: '✅ AVAILABLE - Composite Leading Indicators (CLI), monthly frequency',
    category: 'ECO',
  },
  {
    id: 'HEALTH_STAT',
    name: 'Health Statistics',
    description: '✅ AVAILABLE - Perceived health status by age and gender',
    category: 'HEA',
  },

  // ❌ NOT YET IMPLEMENTED or NOT AVAILABLE via SDMX API
  {
    id: 'EO',
    name: 'Economic Outlook',
    description: '⏳ NOT YET IMPLEMENTED - Economic projections and forecasts',
    category: 'ECO',
  },
  {
    id: 'PISA',
    name: 'PISA Results',
    description: '❌ NOT AVAILABLE via SDMX - Available as downloadable files only from OECD website',
    category: 'EDU',
  },
  {
    id: 'AVD_DUR',
    name: 'Unemployment by Duration',
    description: '✅ AVAILABLE - Average duration of unemployment in months',
    category: 'JOB',
  },
  {
    id: 'EAG_FIN',
    name: 'Education Finance',
    description: '✅ AVAILABLE - Education spending per student by education level',
    category: 'EDU',
  },
  {
    id: 'TIS',
    name: 'Trade in Services',
    description: '✅ AVAILABLE - International trade in services by country',
    category: 'TRD',
  },
  {
    id: 'GREEN_GROWTH',
    name: 'Green Growth Indicators',
    description: '⏳ NOT YET IMPLEMENTED - Environmental and economic indicators',
    category: 'ENV',
  },
  {
    id: 'FDI',
    name: 'Foreign Direct Investment',
    description: '⏳ NOT YET IMPLEMENTED - FDI flows and stocks by country',
    category: 'FIN',
  },
  {
    id: 'REV',
    name: 'Revenue Statistics',
    description: '⏳ NOT YET IMPLEMENTED - Tax revenues by type and government level',
    category: 'TAX',
  },
];
