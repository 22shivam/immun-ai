/**
 * Seed Redis with healthcare attack vectors
 * Run: node dist/scripts/seed-redis.js
 */

import { storeAttackVector, getAttackStats, getRedisClient } from '../lib/redis-service';
import * as fs from 'fs';
import * as path from 'path';

async function seedRedis() {
  console.log('🌱 Seeding Redis with healthcare attack vectors...\n');

  // Load attack dataset
  const dataPath = path.join(__dirname, '..', '..', '..', 'data', 'healthcare-attacks.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`📚 Loaded ${data.count} attacks from dataset`);
  console.log(`   Source: ${data.source}\n`);

  console.log('🔄 Generating embeddings and storing in Redis...');

  let stored = 0;
  for (const attack of data.attacks) {
    try {
      await storeAttackVector(attack);
      stored++;
      process.stdout.write(`\r   Progress: ${stored}/${data.count} attacks stored`);
    } catch (error) {
      console.error(`\n   ❌ Failed to store attack ${attack.id}:`, error);
    }
  }

  console.log('\n\n📊 Attack Database Statistics:');
  const stats = await getAttackStats();

  console.log(`   Total attacks: ${stats.total}`);
  console.log('\n   By Category:');
  Object.entries(stats.byCategory).forEach(([cat, count]) => {
    console.log(`     ${cat}: ${count}`);
  });

  console.log('\n   By Severity:');
  Object.entries(stats.bySeverity).forEach(([sev, count]) => {
    console.log(`     ${sev}: ${count}`);
  });

  console.log('\n   Top Tags:');
  stats.topTags.forEach(({ tag, count }) => {
    console.log(`     ${tag}: ${count}`);
  });

  console.log('\n✅ Redis seeding complete!');
  console.log('\n💡 Try semantic search:');
  console.log('   "Find attacks using medical emergencies"');
  console.log('   "Show me SQL injection attempts"');
  console.log('   "Attacks that impersonate doctors"');

  // Close Redis connection
  const client = await getRedisClient();
  await client.quit();
  process.exit(0);
}

seedRedis().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
