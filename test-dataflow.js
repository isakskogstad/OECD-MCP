// Test dataflow endpoint to see if it contains structure info
import fetch from 'node-fetch';
import fs from 'fs';

async function testDataflow() {
  // Try getting the specific dataflow
  const url = 'https://sdmx.oecd.org/public/rest/dataflow/OECD.CFE.EDS/DSD_FUA_CLIM@DF_LAND_TEMP/1.2?detail=full&references=all';

  console.log('Testing dataflow endpoint with references=all\n');
  console.log('URL:', url, '\n');

  const res = await fetch(url, {
    headers: { Accept: 'application/json' }
  });

  if (res.ok) {
    const data = await res.json();
    fs.writeFileSync('dataflow-response.json', JSON.stringify(data, null, 2));
    console.log('✓ Status:', res.status);
    console.log('✓ Top-level keys:', Object.keys(data));

    // Check references
    if (data.references) {
      const refCount = Object.keys(data.references).length;
      console.log(`✓ references: ${refCount} items`);

      // Look for DataStructure in references
      Object.entries(data.references).forEach(([urn, obj]) => {
        if (urn.includes('DataStructure') && !urn.includes('Dataflow')) {
          console.log('\n✓ Found DataStructure!');
          console.log('  URN:', urn);
          console.log('  ID:', obj.id);
          console.log('  Keys:', Object.keys(obj));

          if (obj.dataStructureComponents) {
            console.log('  ✓✓ HAS dataStructureComponents!');
            console.log('    Keys:', Object.keys(obj.dataStructureComponents));
          }
        }
      });
    }

    console.log('\n✓ Saved to dataflow-response.json');
  } else {
    console.log('❌ Failed:', res.status, res.statusText);
  }
}

testDataflow().catch(console.error);
