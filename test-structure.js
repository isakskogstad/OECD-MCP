// Test to see actual structure response format
import fetch from 'node-fetch';

async function testStructure() {
  const url = 'https://sdmx.oecd.org/public/rest/datastructure/OECD.CFE.EDS/DSD_FUA_CLIM/1.4?references=all';

  console.log('Fetching structure...\n');

  const res = await fetch(url, {
    headers: { Accept: 'application/json' }
  });

  if (res.ok) {
    const data = await res.json();
    console.log('Top-level keys:', Object.keys(data));
    console.log('\n');

    if (data.data) {
      console.log('data keys:', Object.keys(data.data));

      if (data.data.dataStructures) {
        console.log('dataStructures found:', data.data.dataStructures.length);
      } else {
        console.log('❌ No dataStructures in data');
      }
    }

    if (data.resources) {
      console.log('\n✓ resources found:', Object.keys(data.resources).length, 'keys');
      console.log('First 3 resource keys:', Object.keys(data.resources).slice(0, 3));
    }

    if (data.references) {
      console.log('\n✓ references found:', Object.keys(data.references).length, 'keys');
      console.log('First 3 reference keys:', Object.keys(data.references).slice(0, 3));
    }

    // Try to find dataStructures in resources or references
    console.log('\nSearching for dataStructures...');

    if (data.resources) {
      const dsInResources = Object.values(data.resources).find(r => r && typeof r === 'object' && r.id === 'DSD_FUA_CLIM');
      if (dsInResources) {
        console.log('✓ Found dataStructure in resources:', dsInResources.id);
        console.log('  Keys:', Object.keys(dsInResources));
      }
    }

    // Log a small sample to see structure
    console.log('\nFull response sample (first 500 chars):');
    console.log(JSON.stringify(data, null, 2).substring(0, 500));

  } else {
    console.log('❌ Failed:', res.status, res.statusText);
  }
}

testStructure().catch(console.error);
