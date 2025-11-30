// Detailed structure response inspection
import fetch from 'node-fetch';
import fs from 'fs';

async function testStructureDetailed() {
  const url = 'https://sdmx.oecd.org/public/rest/datastructure/OECD.CFE.EDS/DSD_FUA_CLIM/1.4?references=all';

  console.log('Fetching structure...\n');

  const res = await fetch(url, {
    headers: { Accept: 'application/json' }
  });

  if (res.ok) {
    const data = await res.json();

    // Save full response to file for inspection
    fs.writeFileSync('structure-response.json', JSON.stringify(data, null, 2));
    console.log('✓ Saved full response to structure-response.json\n');

    // Analyze all references
    console.log('Analyzing references:');
    if (data.references) {
      Object.entries(data.references).forEach(([urn, obj]) => {
        console.log(`\n${urn}`);
        console.log(`  Type: ${obj.type || 'unknown'}`);
        console.log(`  ID: ${obj.id}`);
        console.log(`  Name: ${obj.name}`);

        // Check if this is a DataStructure
        if (urn.includes('DataStructure') || urn.includes('DSD')) {
          console.log('  👉 This might be the data structure!');
          console.log('  Keys:', Object.keys(obj));
        }
      });
    }

    // Look for any object with dataStructureComponents
    console.log('\n\nSearching for dataStructureComponents...');
    const findComponents = (obj, path = '') => {
      if (obj && typeof obj === 'object') {
        if (obj.dataStructureComponents) {
          console.log(`✓ Found dataStructureComponents at: ${path}`);
          console.log('  Keys:', Object.keys(obj.dataStructureComponents));
          return obj;
        }
        for (const [key, value] of Object.entries(obj)) {
          const found = findComponents(value, `${path}.${key}`);
          if (found) return found;
        }
      }
      return null;
    };

    const structure = findComponents(data, 'root');
    if (!structure) {
      console.log('❌ No dataStructureComponents found in entire response');
    }

  } else {
    console.log('❌ Failed:', res.status, res.statusText);
  }
}

testStructureDetailed().catch(console.error);
