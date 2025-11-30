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
  // Regional/Urban Statistics (OECD.CFE.EDS - Functional Urban Areas)
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
