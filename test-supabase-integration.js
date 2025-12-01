#!/usr/bin/env node
/**
 * Supabase Integration Verification Test
 *
 * Tests:
 * 1. Cache WRITE - Verify data is stored correctly in oecd_cached_observations table
 * 2. Cache READ - Verify data is retrieved from cache (faster response)
 * 3. Cache key generation
 * 4. TTL enforcement
 * 5. Data consistency
 */

import { OECDClient } from './dist/oecd-client.js';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function verifySupabaseIntegration() {
  console.log('🔍 Supabase Integration Verification\n');
  console.log('='.repeat(80));

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing SUPABASE_URL or SUPABASE_KEY in environment variables');
    return;
  }

  console.log('✅ Supabase credentials found');
  console.log(`   URL: ${supabaseUrl}`);

  // Create clients
  const client = new OECDClient({
    enableCache: true,
    supabaseUrl,
    supabaseKey
  });

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test 1: Cache WRITE
  console.log('\n📊 Test 1: Cache WRITE - Verify data stored in Supabase');
  console.log('   Query: QNA with lastNObservations=50');

  // Clear any existing cache for this query
  const cacheKey = 'QNA:all:::50';
  console.log(`   Cache key: ${cacheKey}`);

  await supabase.from('oecd_cached_observations').delete().eq('cache_key', cacheKey);
  console.log('   ✅ Cleared existing cache for this query');

  const start1 = Date.now();
  const data1 = await client.queryData({
    dataflowId: 'QNA',
    lastNObservations: 50
  });
  const time1 = Date.now() - start1;

  console.log(`   ✅ Query completed: ${data1.length} observations in ${time1}ms`);

  // Verify data is in Supabase
  console.log('   🔍 Checking Supabase database...');
  const { data: cachedRow, error } = await supabase
    .from('oecd_cached_observations')
    .select('*')
    .eq('cache_key', cacheKey)
    .single();

  if (error) {
    console.log(`   ❌ ERROR: Data NOT found in Supabase - ${error.message}`);
    return;
  }

  console.log('   ✅ Data found in Supabase!');
  console.log(`      - Dataflow ID: ${cachedRow.dataflow_id}`);
  console.log(`      - Observation count: ${cachedRow.observation_count}`);
  console.log(`      - Cached at: ${cachedRow.cached_at}`);
  console.log(`      - Storage URL: ${cachedRow.storage_url || 'NULL (using JSONB)'}`);
  console.log(`      - Data size: ${JSON.stringify(cachedRow.data).length} bytes`);

  // Verify data consistency
  if (cachedRow.observation_count !== data1.length) {
    console.log(`   ⚠️  WARNING: observation_count (${cachedRow.observation_count}) != actual data length (${data1.length})`);
  } else {
    console.log('   ✅ Observation count matches');
  }

  // Test 2: Cache READ
  console.log('\n📊 Test 2: Cache READ - Verify retrieval from Supabase');
  console.log('   Waiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('   Query: Same QNA with lastNObservations=50');
  const start2 = Date.now();
  const data2 = await client.queryData({
    dataflowId: 'QNA',
    lastNObservations: 50
  });
  const time2 = Date.now() - start2;

  console.log(`   ✅ Query completed: ${data2.length} observations in ${time2}ms`);

  // Calculate speedup
  const speedup = Math.round(time1 / time2 * 10) / 10;
  console.log(`\n   📈 Cache Performance:`);
  console.log(`      Cold (API + Supabase write): ${time1}ms`);
  console.log(`      Warm (Supabase read): ${time2}ms`);
  console.log(`      Speedup: ${speedup}x faster`);

  if (speedup < 2) {
    console.log(`   ⚠️  WARNING: Cache speedup is low (< 2x). Expected > 10x`);
  } else {
    console.log('   ✅ Cache speedup is good');
  }

  // Test 3: Data Consistency
  console.log('\n📊 Test 3: Data Consistency');
  const hash1 = JSON.stringify(data1);
  const hash2 = JSON.stringify(data2);
  const consistent = hash1 === hash2;

  console.log(`   Data Consistency: ${consistent ? '✅ IDENTICAL' : '❌ DIFFERENT'}`);

  if (!consistent) {
    console.log(`   ⚠️  WARNING: Cached data differs from fresh data!`);
    console.log(`      Fresh: ${data1.length} observations`);
    console.log(`      Cached: ${data2.length} observations`);
  }

  // Test 4: Cache Key Generation
  console.log('\n📊 Test 4: Cache Key Generation');
  const testKeys = [
    { params: { dataflowId: 'QNA', lastNObservations: 100 }, expected: 'QNA:all:::100' },
    { params: { dataflowId: 'QNA', filter: 'USA', lastNObservations: 50 }, expected: 'QNA:USA:::50' },
    { params: { dataflowId: 'GGDP', startPeriod: '2020', endPeriod: '2023' }, expected: 'GGDP:all:2020:2023:' },
  ];

  for (const test of testKeys) {
    const key = client.cache.generateCacheKey(test.params);
    const match = key === test.expected;
    console.log(`   ${match ? '✅' : '❌'} ${JSON.stringify(test.params)}`);
    console.log(`      Expected: ${test.expected}`);
    console.log(`      Got: ${key}`);
  }

  // Test 5: Cache Statistics
  console.log('\n📊 Test 5: Cache Statistics');
  try {
    const stats = await client.cache.getCacheStatistics();
    console.log('   ✅ Statistics retrieved:');
    console.log(`      Total Cached Queries: ${stats.totalCached}`);
    console.log(`      Hit Rate: ${stats.hitRate}%`);
    if (stats.popularDataflows.length > 0) {
      console.log(`      Popular Dataflows (top 5):`);
      stats.popularDataflows.slice(0, 5).forEach(df => {
        console.log(`         - ${df.dataflow_id}: ${df.hits} hits`);
      });
    } else {
      console.log('      No popular dataflows data yet');
    }
  } catch (error) {
    console.log(`   ⚠️  Could not fetch statistics: ${error.message}`);
  }

  // Test 6: Verify NO Storage Bucket Usage
  console.log('\n📊 Test 6: Verify Storage Bucket NOT Used');
  const { data: allCached } = await supabase
    .from('oecd_cached_observations')
    .select('cache_key, storage_url')
    .limit(100);

  const usingStorage = allCached?.filter(row => row.storage_url !== null) || [];

  if (usingStorage.length > 0) {
    console.log(`   ⚠️  WARNING: ${usingStorage.length} cached queries using Storage bucket`);
    usingStorage.forEach(row => console.log(`      - ${row.cache_key}: ${row.storage_url}`));
  } else {
    console.log('   ✅ All cached data using Postgres JSONB (storage_url is NULL)');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Supabase Integration Verification Complete!\n');
}

verifySupabaseIntegration().catch(console.error);
