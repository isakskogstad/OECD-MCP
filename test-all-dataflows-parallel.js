#!/usr/bin/env node
/**
 * Parallel OECD API Test - All 46 Dataflows
 *
 * Tests all dataflows simultaneously to verify OECD API connectivity.
 * Uses minimal data (lastNObservations=1) for speed.
 */

import { OECDClient } from './dist/oecd-client.js';

async function testAllDataflowsParallel() {
  console.log('🚀 Parallel OECD API Test - All Dataflows\n');
  console.log('='.repeat(80));

  const client = new OECDClient();

  // Get all dataflows
  console.log('📋 Loading all dataflows...');
  const allDataflows = await client.listDataflows();
  console.log(`✅ Found ${allDataflows.length} dataflows\n`);

  // Create test promises for all dataflows in parallel
  console.log('🔄 Testing all dataflows in parallel (lastNObservations=1)...\n');

  const testPromises = allDataflows.map(async (df) => {
    const startTime = Date.now();
    try {
      const data = await client.queryData({
        dataflowId: df.id,
        lastNObservations: 1
      });
      const duration = Date.now() - startTime;
      return {
        id: df.id,
        category: df.category,
        name: df.name,
        status: '✅',
        observations: data.length,
        duration,
        error: null
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        id: df.id,
        category: df.category,
        name: df.name,
        status: '❌',
        observations: 0,
        duration,
        error: error.message
      };
    }
  });

  // Wait for all tests to complete
  const results = await Promise.all(testPromises);

  // Sort results by category and status
  results.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.status !== b.status) return b.status.localeCompare(a.status); // ✅ first
    return a.id.localeCompare(b.id);
  });

  console.log('='.repeat(80));
  console.log('📊 RESULTS BY CATEGORY\n');

  // Group by category
  const byCategory = results.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  // Print results by category
  for (const [category, catResults] of Object.entries(byCategory)) {
    const working = catResults.filter(r => r.status === '✅').length;
    const total = catResults.length;
    const percentage = Math.round((working / total) * 100);

    console.log(`\n${category} (${working}/${total} working - ${percentage}%)`);
    console.log('-'.repeat(80));

    catResults.forEach(r => {
      const durationStr = `${r.duration}ms`.padStart(6);
      const obsStr = r.observations > 0 ? `${r.observations} obs` : '';
      console.log(`${r.status} ${r.id.padEnd(25)} ${durationStr} ${obsStr}`);
      if (r.error) {
        console.log(`   Error: ${r.error}`);
      }
    });
  }

  // Overall summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 OVERALL SUMMARY\n');

  const totalWorking = results.filter(r => r.status === '✅').length;
  const totalFailed = results.filter(r => r.status === '❌').length;
  const totalDataflows = results.length;
  const successRate = Math.round((totalWorking / totalDataflows) * 100);

  console.log(`Total Dataflows: ${totalDataflows}`);
  console.log(`✅ Working: ${totalWorking} (${successRate}%)`);
  console.log(`❌ Failed: ${totalFailed}`);

  if (totalFailed > 0) {
    console.log('\n❌ FAILED DATAFLOWS:\n');
    results
      .filter(r => r.status === '❌')
      .forEach(r => {
        console.log(`   ${r.category}/${r.id}: ${r.error}`);
      });
  }

  // Performance stats
  const avgDuration = Math.round(
    results.reduce((sum, r) => sum + r.duration, 0) / results.length
  );
  const maxDuration = Math.max(...results.map(r => r.duration));
  const minDuration = Math.min(...results.filter(r => r.status === '✅').map(r => r.duration));

  console.log('\n⏱️  PERFORMANCE:');
  console.log(`   Average response time: ${avgDuration}ms`);
  console.log(`   Fastest response: ${minDuration}ms`);
  console.log(`   Slowest response: ${maxDuration}ms`);

  console.log('\n' + '='.repeat(80));

  if (successRate === 100) {
    console.log('✅ ALL DATAFLOWS WORKING! OECD API CONNECTIVITY VERIFIED!\n');
  } else if (successRate >= 90) {
    console.log('⚠️  Most dataflows working. Check failed ones for API issues.\n');
  } else {
    console.log('❌ CRITICAL: Many dataflows failing. OECD API may have issues.\n');
  }

  return results;
}

testAllDataflowsParallel().catch(console.error);
