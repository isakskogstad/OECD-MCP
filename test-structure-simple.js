// Test structure endpoint WITHOUT references=all
import fetch from 'node-fetch';
import fs from 'fs';

async function testStructureSimple() {
  // Try without references=all
  const url1 = 'https://sdmx.oecd.org/public/rest/datastructure/OECD.CFE.EDS/DSD_FUA_CLIM/1.4';

  console.log('Test 1: Without references=all\n');
  console.log('URL:', url1, '\n');

  const res1 = await fetch(url1, {
    headers: { Accept: 'application/json' }
  });

  if (res1.ok) {
    const data1 = await res1.json();
    fs.writeFileSync('structure-no-refs.json', JSON.stringify(data1, null, 2));
    console.log('✓ Status:', res1.status);
    console.log('✓ Top-level keys:', Object.keys(data1));

    // Look for data.dataStructures
    if (data1.data && data1.data.dataStructures) {
      console.log('✓ Found data.dataStructures:', data1.data.dataStructures.length, 'items');

      const ds = data1.data.dataStructures[0];
      if (ds) {
        console.log('  ID:', ds.id);
        console.log('  Keys:', Object.keys(ds));

        if (ds.dataStructureComponents) {
          console.log('  ✓ HAS dataStructureComponents!');
          console.log('    Keys:', Object.keys(ds.dataStructureComponents));
        }
      }
    }

    // Save for inspection
    console.log('\n✓ Saved to structure-no-refs.json');
  } else {
    console.log('❌ Failed:', res1.status, res1.statusText);
  }
}

testStructureSimple().catch(console.error);
