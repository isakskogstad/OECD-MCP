/**
 * OECD SDMX API Contract Tests
 * Verifies that the OECD API responses match expected structure
 */

import { describe, it, expect } from 'vitest';
import { OECDSDMXClient } from '../../src/sdmx-client.js';

const client = new OECDSDMXClient();

describe('OECD SDMX API Contract', () => {
  describe('Dataflow Endpoint', () => {
    it('should return array of known dataflows', async () => {
      const dataflows = await client.listDataflows();

      expect(dataflows).toBeInstanceOf(Array);
      expect(dataflows.length).toBeGreaterThan(0);
    });

    it('should return dataflows with correct structure', async () => {
      const dataflows = await client.listDataflows();
      const firstDataflow = dataflows[0];

      expect(firstDataflow).toHaveProperty('id');
      expect(firstDataflow).toHaveProperty('name');
      expect(firstDataflow).toHaveProperty('version');
      expect(firstDataflow).toHaveProperty('agencyID');

      expect(typeof firstDataflow.id).toBe('string');
      expect(typeof firstDataflow.name).toBe('string');
      expect(typeof firstDataflow.version).toBe('string');
      expect(typeof firstDataflow.agencyID).toBe('string');
    });

    it('should include known dataflows', async () => {
      const dataflows = await client.listDataflows();
      const dataflowIds = dataflows.map((df) => df.id);

      // Check for curated dataflows
      const knownDataflows = ['DF_LAND_TEMP', 'DF_CLIM_PROJ', 'DF_HEAT_STRESS'];
      const hasKnownDataflows = knownDataflows.every((id) => dataflowIds.includes(id));

      expect(hasKnownDataflows).toBe(true);
    });
  });

  describe('Data Structure Endpoint', () => {
    it('should return structure for DF_LAND_TEMP dataflow', async () => {
      const structure = await client.getDataStructure('DF_LAND_TEMP');

      expect(structure).toHaveProperty('dataflowId');
      expect(structure).toHaveProperty('dimensions');
      expect(structure).toHaveProperty('attributes');

      expect(structure.dataflowId).toBe('DF_LAND_TEMP');
      expect(structure.dimensions).toBeInstanceOf(Array);
      expect(structure.attributes).toBeInstanceOf(Array);
    }, 20000);

    it('should return dimensions with correct structure', async () => {
      const structure = await client.getDataStructure('DF_LAND_TEMP');

      expect(structure.dimensions.length).toBeGreaterThan(0);

      const firstDimension = structure.dimensions[0];
      expect(firstDimension).toHaveProperty('id');
      expect(firstDimension).toHaveProperty('name');
      expect(firstDimension).toHaveProperty('values');

      expect(typeof firstDimension.id).toBe('string');
      expect(typeof firstDimension.name).toBe('string');
      expect(firstDimension.values).toBeInstanceOf(Array);
    }, 20000);

    it('should throw error for unknown dataflow', async () => {
      await expect(client.getDataStructure('UNKNOWN_DATAFLOW')).rejects.toThrow(
        'Unknown dataflow'
      );
    });
  });

  describe('Data Query Endpoint', () => {
    it('should return observations for valid query', async () => {
      const observations = await client.queryData('DF_LAND_TEMP', 'all', {
        lastNObservations: 5,
      });

      expect(observations).toBeInstanceOf(Array);
      expect(observations.length).toBeGreaterThan(0);
    }, 30000);

    it('should return observations with correct structure', async () => {
      const observations = await client.queryData('DF_LAND_TEMP', 'all', {
        lastNObservations: 1,
      });

      expect(observations.length).toBeGreaterThan(0);

      const firstObs = observations[0];
      expect(firstObs).toHaveProperty('dimensions');
      expect(firstObs).toHaveProperty('value');

      expect(typeof firstObs.dimensions).toBe('object');
      expect(['number', 'string']).toContain(typeof firstObs.value);
    }, 30000);

    it('should throw error for unknown dataflow in query', async () => {
      await expect(client.queryData('UNKNOWN_DATAFLOW', 'all')).rejects.toThrow(
        'Unknown dataflow'
      );
    });
  });

  describe('Search Functionality', () => {
    it('should search dataflows by keyword', async () => {
      const results = await client.searchDataflows('temperature');

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);

      const hasTemperatureRelated = results.some(
        (df) =>
          df.name.toLowerCase().includes('temperature') ||
          df.id.toLowerCase().includes('temp') ||
          (df.description && df.description.toLowerCase().includes('temperature'))
      );

      expect(hasTemperatureRelated).toBe(true);
    });

    it('should return empty array for non-matching search', async () => {
      const results = await client.searchDataflows('xyzabc123nonexistent');
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0);
    });
  });

  describe('Data Explorer URL', () => {
    it('should generate valid Data Explorer URL', () => {
      const url = client.getDataExplorerUrl('DF_LAND_TEMP');

      expect(url).toContain('data-explorer.oecd.org');
      expect(url).toContain('df=DF_LAND_TEMP');
    });

    it('should include filter in URL when provided', () => {
      const url = client.getDataExplorerUrl('DF_LAND_TEMP', 'USA');

      expect(url).toContain('data-explorer.oecd.org');
      expect(url).toContain('df=DF_LAND_TEMP');
      expect(url).toContain('dq=USA');
    });
  });

  describe('API Availability', () => {
    it('should successfully list known dataflows', async () => {
      const dataflows = await client.listDataflows();
      expect(dataflows.length).toBeGreaterThan(0);
    });
  });
});
