/**
 * Known OECD SDMX Dataflows
 * Based on actual OECD SDMX API structure (December 2024)
 *
 * NOTE: OECD SDMX API uses complex agency IDs like "OECD.CFE.EDS", not simple "OECD"
 * This is a curated list of working dataflows for common OECD statistics
 */

export interface KnownDataflow {
  id: string;
  fullId: string; // Format: DSD_ID@DF_ID
  agency: string;
  version: string;
  name: string;
  description: string;
  category: string;
}

/**
 * Curated list of working OECD dataflows
 * These have been verified to work with the SDMX API structure endpoints
 */
export const KNOWN_DATAFLOWS: KnownDataflow[] = [
  // ========================================
  // ECONOMIC INDICATORS (OECD.SDD.NAD, OECD.SDD.STES)
  // ========================================
  {
    id: 'QNA',
    fullId: 'DSD_NAMAIN1@DF_QNA',
    agency: 'OECD.SDD.NAD',
    version: '1.0',
    name: 'Quarterly National Accounts',
    description: 'GDP and main aggregates - quarterly frequency. Includes GDP, consumption, investment, government spending by country and quarter.',
    category: 'ECO',
  },
  {
    id: 'MEI',
    fullId: 'DSD_STES@DF_CLI',
    agency: 'OECD.SDD.STES',
    version: '1.0',
    name: 'Main Economic Indicators - Composite Leading Indicators',
    description: 'Composite Leading Indicators (CLI) designed to provide early signals of turning points in business cycles. Monthly frequency.',
    category: 'ECO',
  },

  // ========================================
  // HEALTH STATISTICS (OECD.ELS.HD)
  // ========================================
  {
    id: 'HEALTH_STAT',
    fullId: 'DSD_HEALTH_STAT@DF_PHS',
    agency: 'OECD.ELS.HD',
    version: '1.0',
    name: 'Health Statistics - Perceived Health Status',
    description: 'Percentage of population aged 15+ reporting good/very good health status, by age and gender.',
    category: 'HEA',
  },

  // ========================================
  // EDUCATION (OECD.EDU.IMEP)
  // ========================================
  {
    id: 'EAG_FIN',
    fullId: 'DSD_EAG_UOE_FIN@DF_UOE_INDIC_FIN_PERSTUD',
    agency: 'OECD.EDU.IMEP',
    version: '3.0',
    name: 'Education at a Glance - Financial Indicators per Student',
    description: 'Education spending per student by education level. Part of UNESCO-UIS/OECD/EUROSTAT (UOE) data collection.',
    category: 'EDU',
  },

  // ========================================
  // EMPLOYMENT & LABOUR (OECD.ELS.SAE)
  // ========================================
  {
    id: 'AVD_DUR',
    fullId: 'DSD_DUR@DF_AVD_DUR',
    agency: 'OECD.ELS.SAE',
    version: '1.0',
    name: 'Unemployment by Duration - Average Duration',
    description: 'Average duration of unemployment in months by country and demographic characteristics.',
    category: 'JOB',
  },

  // ========================================
  // TRADE (OECD.SDD.TPS)
  // ========================================
  {
    id: 'TIS',
    fullId: 'DSD_BOP@DF_TIS',
    agency: 'OECD.SDD.TPS',
    version: '1.0',
    name: 'Trade in Services',
    description: 'International trade in services by country and service category, based on Balance of Payments.',
    category: 'TRD',
  },

  // ========================================
  // CLIMATE & ENVIRONMENT (OECD.CFE.EDS - Functional Urban Areas)
  // ========================================
  {
    id: 'DF_LAND_TEMP',
    fullId: 'DSD_FUA_CLIM@DF_LAND_TEMP',
    agency: 'OECD.CFE.EDS',
    version: '1.2',
    name: 'Land surface temperature - Cities and FUAs',
    description: 'Land surface temperature indicators in functional urban areas and cities',
    category: 'ENV',
  },
  {
    id: 'DF_CLIM_PROJ',
    fullId: 'DSD_FUA_CLIM@DF_CLIM_PROJ',
    agency: 'OECD.CFE.EDS',
    version: '1.4',
    name: 'Climate projections by scenario, 2030–2060 – Cities and FUAs',
    description: 'Climate projections for cities based on different scenarios (SSP)',
    category: 'ENV',
  },
  {
    id: 'DF_COASTAL_FLOOD',
    fullId: 'DSD_FUA_CLIM@DF_COASTAL_FLOOD',
    agency: 'OECD.CFE.EDS',
    version: '1.1',
    name: 'Coastal flooding - Cities and FUAs',
    description: 'Population and built-up exposure to coastal floods',
    category: 'ENV',
  },
  {
    id: 'DF_DROUGHT',
    fullId: 'DSD_FUA_CLIM@DF_DROUGHT',
    agency: 'OECD.CFE.EDS',
    version: '1.2',
    name: 'Drought - Cities and FUAs',
    description: 'Soil moisture anomaly estimates in functional urban areas',
    category: 'ENV',
  },
  {
    id: 'DF_FIRES',
    fullId: 'DSD_FUA_CLIM@DF_FIRES',
    agency: 'OECD.CFE.EDS',
    version: '1.1',
    name: 'Wildfires - Cities and FUAs',
    description: 'Population and land exposure to wildfires',
    category: 'ENV',
  },
  {
    id: 'DF_HEAT_STRESS',
    fullId: 'DSD_FUA_CLIM@DF_HEAT_STRESS',
    agency: 'OECD.CFE.EDS',
    version: '1.1',
    name: 'Heat stress - Cities and FUAs',
    description: 'Population exposure to heat stress (UTCI index)',
    category: 'ENV',
  },
  {
    id: 'DF_PRECIP',
    fullId: 'DSD_FUA_CLIM@DF_PRECIP',
    agency: 'OECD.CFE.EDS',
    version: '1.1',
    name: 'Precipitation - FUAs',
    description: 'Total precipitation and extreme precipitation days',
    category: 'ENV',
  },
  {
    id: 'DF_RIVER_FLOOD',
    fullId: 'DSD_FUA_CLIM@DF_RIVER_FLOOD',
    agency: 'OECD.CFE.EDS',
    version: '1.1',
    name: 'River flooding - Cities and FUAs',
    description: 'Population and built-up exposure to river floods',
    category: 'ENV',
  },
];

/**
 * Get dataflow by ID (short ID like "DF_LAND_TEMP")
 */
export function getDataflowById(id: string): KnownDataflow | undefined {
  return KNOWN_DATAFLOWS.find((df) => df.id === id);
}

/**
 * Search dataflows by keyword
 */
export function searchDataflows(query: string): KnownDataflow[] {
  const lowerQuery = query.toLowerCase();
  return KNOWN_DATAFLOWS.filter(
    (df) =>
      df.id.toLowerCase().includes(lowerQuery) ||
      df.name.toLowerCase().includes(lowerQuery) ||
      df.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get dataflows by category
 */
export function getDataflowsByCategory(category: string): KnownDataflow[] {
  return KNOWN_DATAFLOWS.filter((df) => df.category === category);
}

/**
 * Convert KnownDataflow to SDMXDataflow format
 */
export function toSDMXDataflow(kdf: KnownDataflow) {
  return {
    id: kdf.id,
    version: kdf.version,
    name: kdf.name,
    description: kdf.description,
    agencyID: kdf.agency,
  };
}
