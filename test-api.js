// Quick test script to explore OECD SDMX API
import fetch from 'node-fetch';

async function testEndpoints() {
  console.log('Testing OECD SDMX API endpoints...\n');

  // Test 1: List all dataflows
  try {
    console.log('1. Testing /dataflow/all...');
    const res1 = await fetch('https://sdmx.oecd.org/public/rest/dataflow/all', {
      headers: { Accept: 'application/json' }
    });

    if (res1.ok) {
      const data = await res1.json();
      const refs = data.references || {};
      const dataflows = Object.values(refs);
      console.log(`   ✓ Success! Found ${dataflows.length} dataflows`);

      // Show first OECD dataflow
      const oecdFlow = dataflows.find(df => df.agencyID && df.agencyID.includes('OECD'));
      if (oecdFlow) {
        console.log(`   First OECD dataflow: ${oecdFlow.id} (${oecdFlow.agencyID})`);
        console.log(`   Name: ${oecdFlow.name}`);
      }
    } else {
      console.log(`   ✗ Failed: ${res1.status} ${res1.statusText}`);
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }

  console.log('');

  // Test 2: Try to get structure for a specific dataflow
  // Based on what we saw, try with full agency ID
  try {
    console.log('2. Testing structure endpoint with OECD.CFE.EDS agency...');
    const res2 = await fetch('https://sdmx.oecd.org/public/rest/datastructure/OECD.CFE.EDS/DSD_FUA_CLIM/1.4?references=all', {
      headers: { Accept: 'application/json' }
    });

    console.log(`   Status: ${res2.status} ${res2.statusText}`);

    if (res2.ok) {
      const data = await res2.json();
      console.log(`   ✓ Structure endpoint works!`);
      console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }

  console.log('');

  // Test 3: Try data endpoint
  try {
    console.log('3. Testing data endpoint...');
    const res3 = await fetch('https://sdmx.oecd.org/public/rest/data/OECD.CFE.EDS,DSD_FUA_CLIM@DF_LAND_TEMP,1.2/all?format=jsondata&lastNObservations=1', {
      headers: { Accept: 'application/json' }
    });

    console.log(`   Status: ${res3.status} ${res3.statusText}`);

    if (res3.ok) {
      const data = await res3.json();
      console.log(`   ✓ Data endpoint works!`);
      console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }
}

testEndpoints().catch(console.error);
