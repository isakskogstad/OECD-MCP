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
export const OECD_CATEGORIES: OECDCategory[] = [
  {
    id: 'ECO',
    name: 'Economy',
    description: 'GDP, growth, inflation, interest rates, economic forecasts',
    exampleDatasets: ['QNA', 'MEI', 'EO'],
  },
  {
    id: 'HEA',
    name: 'Health',
    description: 'Healthcare spending, life expectancy, health outcomes',
    exampleDatasets: ['HEALTH_STAT', 'SHA', 'HEALTH_LVNG'],
  },
  {
    id: 'EDU',
    name: 'Education',
    description: 'PISA results, education spending, educational attainment',
    exampleDatasets: ['PISA', 'EAG', 'EDU_DEC'],
  },
  {
    id: 'ENV',
    name: 'Environment',
    description: 'Climate, emissions, pollution, green growth, biodiversity',
    exampleDatasets: ['GREEN_GROWTH', 'AIR_GHG', 'CIRCLE'],
  },
  {
    id: 'TRD',
    name: 'Trade',
    description: 'International trade, imports, exports, trade agreements',
    exampleDatasets: ['CTS', 'BTDIXE', 'EBOPS'],
  },
  {
    id: 'JOB',
    name: 'Employment',
    description: 'Labour market, unemployment, wages, working conditions',
    exampleDatasets: ['UN_DEN', 'AV_AN_WAGE', 'ELS'],
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
export const POPULAR_DATASETS: PopularDataset[] = [
  {
    id: 'QNA',
    name: 'Quarterly National Accounts',
    description: 'GDP and main aggregates, quarterly frequency',
    category: 'ECO',
  },
  {
    id: 'MEI',
    name: 'Main Economic Indicators',
    description: 'CPI, unemployment, production indices, monthly data',
    category: 'ECO',
  },
  {
    id: 'EO',
    name: 'Economic Outlook',
    description: 'Economic projections and forecasts',
    category: 'ECO',
  },
  {
    id: 'HEALTH_STAT',
    name: 'Health Statistics',
    description: 'Health status, healthcare resources, utilization',
    category: 'HEA',
  },
  {
    id: 'PISA',
    name: 'PISA Results',
    description: 'Student assessment in reading, mathematics, science',
    category: 'EDU',
  },
  {
    id: 'UN_DEN',
    name: 'Unemployment by Duration',
    description: 'Unemployment statistics by duration and demographics',
    category: 'JOB',
  },
  {
    id: 'GREEN_GROWTH',
    name: 'Green Growth Indicators',
    description: 'Environmental and economic indicators for green growth',
    category: 'ENV',
  },
  {
    id: 'CTS',
    name: 'Trade in Services',
    description: 'International trade in services by category',
    category: 'TRD',
  },
  {
    id: 'FDI',
    name: 'Foreign Direct Investment',
    description: 'FDI flows and stocks by country',
    category: 'FIN',
  },
  {
    id: 'REV',
    name: 'Revenue Statistics',
    description: 'Tax revenues by type and level of government',
    category: 'TAX',
  },
];
