#!/usr/bin/env node
/**
 * Sequential OECD API Test - All Dataflows (Rate Limit Safe)
 *
 * Tests all dataflows sequentially with delays to avoid rate limiting.
 */

import { OECDClient } from './dist/oecd-client.js';

const DELAY_MS = 1000; // 1 second delay between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAllDataflowsSequential() {
  console.log('🐌 Sequential OECD API Test - All Dataflows (Rate Limit Safe)\n');
  console.log('='.repeat(80));

  const client = new OECDClient();

  // Get all dataflows
  console.log('📋 Loading all dataflows...');
  const allDataflows = await client.listDataflows();
  console.log(`✅ Found ${allDataflows.length} dataflows\n`);

  console.log(`🔄 Testing all dataflows sequentially (${DELAY_MS}ms delay between requests)...\n`);

  const results = [];

  for (let i = 0; i < allDataflows.length; i++) {
    const df = allDataflows[i];
    const startTime = Date.now();

    console.log(`[${i + 1}/${allDataflows.length}] Testing ${df.category}/${df.id}...`);

    try {
      const data = await client.queryData({
        dataflowId: df.id,
        lastNObservations: 1
      });
      const duration = Date.now() - startTime;

      results.push({
        id: df.id,
        category: df.category,
        name: df.name,
        status: '✅',
        observations: data.length,
        duration,
        error: null
      });

      console.log(`   ✅ ${data.length} obs in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;

      results.push({
        id: df.id,
        category: df.category,
        name: df.name,
        status: '❌',
        observations: 0,
        duration,
        error: error.message
      });

      console.log(`   ❌ ${error.message}`);
    }

    // Rate limiting delay (except after last request)
    if (i < allDataflows.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // Sort results by category and status
  results.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.status !== b.status) return b.status.localeCompare(a.status); // ✅ first
    return a.id.localeCompare(b.id);
  });

  console.log('\n' + '='.repeat(80));
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
  const workingResults = results.filter(r => r.status === '✅');
  if (workingResults.length > 0) {
    const avgDuration = Math.round(
      workingResults.reduce((sum, r) => sum + r.duration, 0) / workingResults.length
    );
    const maxDuration = Math.max(...workingResults.map(r => r.duration));
    const minDuration = Math.min(...workingResults.map(r => r.duration));

    console.log('\n⏱️  PERFORMANCE (Working Dataflows):');
    console.log(`   Average response time: ${avgDuration}ms`);
    console.log(`   Fastest response: ${minDuration}ms`);
    console.log(`   Slowest response: ${maxDuration}ms`);
  }

  console.log('\n' + '='.repeat(80));

  if (successRate === 100) {
    console.log('✅ ALL DATAFLOWS WORKING! OECD API CONNECTIVITY VERIFIED!\\n');
  } else if (successRate >= 90) {
    console.log('⚠️  Most dataflows working. Check failed ones for API issues.\\n');
  } else {
    console.log('❌ CRITICAL: Many dataflows failing. OECD API may have issues.\\n');
  }

  return results;
}

testAllDataflowsSequential().catch(console.error);
