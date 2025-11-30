// Find which agencies have the popular datasets
import fetch from 'node-fetch';

const targetDataflows = ['QNA', 'MEI', 'HEALTH_STAT', 'PISA', 'UN_DEN', 'GREEN_GROWTH', 'CTS', 'FDI', 'REV'];

const agencies = [
  'OECD.SDD.NAD',    // National Accounts
  'OECD.SDD.SSIS',   // Short-term statistics
  'OECD.ELS.SAE',    // Employment
  'OECD.SDD.TPS',    // Trade and prices
  'OECD.SDD.PSD',    // Prices and statistics
  'OECD.CTPA.FDI',   // Foreign direct investment
  'OECD.CTP.TPD',    // Tax policy
  'OECD.ELS.HD',     // Health data
  'OECD.EDU.IMEP',   // Education
  'OECD.ENV.EPI',    // Environment
];

async function findDataflows() {
  const results = {};

  for (const agency of agencies) {
    try {
      const res = await fetch(`https://sdmx.oecd.org/public/rest/dataflow/${agency}`, {
        headers: { Accept: 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        const refs = data.references || {};
        const dataflows = Object.values(refs);

        const found = dataflows.filter(df =>
          targetDataflows.includes(df.id)
        );

        if (found.length > 0) {
          console.log(`\n${agency}:`);
          found.forEach(df => {
            console.log(`  - ${df.id}: ${df.name}`);
            if (!results[df.id]) results[df.id] = agency;
          });
        }
      }
    } catch (error) {
      // Skip agencies that don't exist
    }
  }

  console.log('\n\nSummary:');
  console.log(JSON.stringify(results, null, 2));
}

findDataflows().catch(console.error);
