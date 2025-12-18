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
// NOTE: exampleDatasets includes all implemented dataflows (see known-dataflows.ts)
export const OECD_CATEGORIES: OECDCategory[] = [
  {
    id: 'ECO',
    name: 'Economy',
    description: 'GDP, growth, inflation, interest rates, productivity, economic forecasts',
    exampleDatasets: ['QNA', 'MEI', 'PDB_LV'], // Quarterly National Accounts, Main Economic Indicators, Productivity
  },
  {
    id: 'HEA',
    name: 'Health',
    description: 'Healthcare spending, life expectancy, health outcomes, hospital resources',
    exampleDatasets: ['HEALTH_STAT', 'SHA', 'HEALTH_REAC'], // Perceived Health, System of Health Accounts, Acute Care Beds
  },
  {
    id: 'EDU',
    name: 'Education',
    description: 'Education spending, educational attainment, graduation rates',
    exampleDatasets: ['EAG_FIN', 'EAG_NEAC', 'EAG_GRAD_ENTR_RATE'], // Finance, Attainment, Graduation Rates
  },
  {
    id: 'ENV',
    name: 'Environment',
    description: 'Climate, emissions, pollution, green growth, biodiversity',
    exampleDatasets: ['DF_LAND_TEMP', 'DF_HEAT_STRESS', 'DF_COASTAL_FLOOD', 'DF_RIVER_FLOOD', 'DF_DROUGHT', 'DF_FIRES', 'DF_PRECIP', 'DF_CLIM_PROJ', 'GREEN_GROWTH'],
  },
  {
    id: 'TRD',
    name: 'Trade',
    description: 'International trade, imports, exports, trade in value added',
    exampleDatasets: ['TIS', 'TISP', 'TIVA'], // Trade in Services, by Partner, Value Added
  },
  {
    id: 'JOB',
    name: 'Employment',
    description: 'Labour market, unemployment, wages, working hours',
    exampleDatasets: ['AVD_DUR', 'LFS_SEXAGE_I_R', 'ANHRS'], // Unemployment Duration, Labour Force Stats, Hours Worked
  },
  {
    id: 'NRG',
    name: 'Energy',
    description: 'Energy production, consumption, renewables, natural resources',
    exampleDatasets: ['NAT_RES'],
  },
  {
    id: 'AGR',
    name: 'Agriculture and Fisheries',
    description: 'Agricultural production, food security, fisheries',
    exampleDatasets: ['AGR_OUTLOOK'],
  },
  {
    id: 'GOV',
    name: 'Government',
    description: 'Public sector, governance, trust in government, e-government',
    exampleDatasets: ['GOV_2023'],
  },
  {
    id: 'SOC',
    name: 'Social Protection and Well-being',
    description: 'Social spending, inequality, quality of life',
    exampleDatasets: ['IDD', 'SOCX_AGG', 'INCOME_INEQ'],
  },
  {
    id: 'DEV',
    name: 'Development',
    description: 'Development aid, ODA, international cooperation',
    exampleDatasets: ['DAC2A', 'DAC3A', 'ODF'],
  },
  {
    id: 'STI',
    name: 'Innovation and Technology',
    description: 'R&D spending, patents, digital economy, ICT usage',
    exampleDatasets: ['MSTI', 'PAT_DEV', 'ICT_IND'],
  },
  {
    id: 'TAX',
    name: 'Taxation',
    description: 'Tax revenues, tax rates, tax policy',
    exampleDatasets: [], // Not yet implemented
  },
  {
    id: 'FIN',
    name: 'Finance',
    description: 'Financial markets, banking, foreign direct investment',
    exampleDatasets: ['FDI'],
  },
  {
    id: 'TRA',
    name: 'Transport',
    description: 'Infrastructure, mobility, freight, passenger transport',
    exampleDatasets: [], // Not yet implemented
  },
  {
    id: 'IND',
    name: 'Industry and Services',
    description: 'Industrial production, services sector',
    exampleDatasets: [], // Not yet implemented
  },
  {
    id: 'REG',
    name: 'Regional Statistics',
    description: 'Sub-national data, cities, regions, territorial indicators',
    exampleDatasets: ['REGION_ECONOM', 'REGION_LABOUR'],
  },
  {
    id: 'HOU',
    name: 'Housing',
    description: 'House prices, property markets, housing affordability',
    exampleDatasets: ['HPI', 'RPPI'], // House Price Index, Real Property Price Indicators
  },
  {
    id: 'MIG',
    name: 'Migration',
    description: 'International migration flows, immigration statistics, asylum seekers',
    exampleDatasets: ['MIG'], // International Migration Database
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
    description: '✅ AVAILABLE - Environmental and economic indicators for green growth monitoring',
    category: 'ENV',
  },
  {
    id: 'FDI',
    name: 'Foreign Direct Investment',
    description: '✅ AVAILABLE - FDI flows and stocks by country and industry',
    category: 'FIN',
  },
  {
    id: 'REV',
    name: 'Revenue Statistics',
    description: '⏳ NOT YET IMPLEMENTED - Tax revenues by type and government level',
    category: 'TAX',
  },
];
