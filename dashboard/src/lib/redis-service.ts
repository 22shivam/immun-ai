import { createClient } from 'redis';
import { pipeline, env } from '@xenova/transformers';

// Configure transformers to use local models (not native bindings)
env.useBrowserCache = false;
env.allowLocalModels = false;

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;
let embedder: any = null;

// Initialize embedding model (lightweight sentence-transformers)
async function getEmbedder() {
  if (!embedder) {
    console.log('Loading embedding model...');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Embedding model loaded!');
  }
  return embedder;
}

// Get or create Redis client
export async function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = createClient({ url: redisUrl });

    redisClient.on('error', (err) => console.error('Redis Client Error', err));

    await redisClient.connect();
    console.log('✅ Connected to Redis');
  }
  return redisClient;
}

// Generate embedding for text
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = await getEmbedder();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magA * magB);
}

export interface AttackVector {
  id: string;
  category: string;
  severity: string;
  technique: string;
  prompt: string;
  tags: string[];
  embedding?: number[];
}

// Store attack vector in Redis
export async function storeAttackVector(attack: AttackVector): Promise<void> {
  const client = await getRedisClient();

  // Generate embedding if not provided
  if (!attack.embedding) {
    attack.embedding = await generateEmbedding(attack.prompt);
  }

  // Store in Redis as JSON
  await client.set(
    `attack:${attack.id}`,
    JSON.stringify({
      ...attack,
      embedding: attack.embedding, // Store embedding with attack
    })
  );

  // Add to category set
  await client.sAdd(`category:${attack.category}`, attack.id);

  // Add to severity set
  await client.sAdd(`severity:${attack.severity}`, attack.id);

  // Add to tags sets
  for (const tag of attack.tags) {
    await client.sAdd(`tag:${tag}`, attack.id);
  }
}

// Get all attacks
export async function getAllAttacks(): Promise<AttackVector[]> {
  const client = await getRedisClient();
  const keys = await client.keys('attack:*');

  const attacks: AttackVector[] = [];
  for (const key of keys) {
    const data = await client.get(key);
    if (data) {
      attacks.push(JSON.parse(data));
    }
  }

  return attacks;
}

// Semantic search for similar attacks
export async function searchSimilarAttacks(
  query: string,
  limit: number = 5
): Promise<Array<AttackVector & { similarity: number }>> {
  const client = await getRedisClient();

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);

  // Get all attacks
  const allAttacks = await getAllAttacks();

  // Calculate similarity scores
  const results = allAttacks.map((attack) => ({
    ...attack,
    similarity: attack.embedding
      ? cosineSimilarity(queryEmbedding, attack.embedding)
      : 0,
  }));

  // Sort by similarity and return top results
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

// Get attacks by category
export async function getAttacksByCategory(category: string): Promise<AttackVector[]> {
  const client = await getRedisClient();
  const ids = await client.sMembers(`category:${category}`);

  const attacks: AttackVector[] = [];
  for (const id of ids) {
    const data = await client.get(`attack:${id}`);
    if (data) {
      attacks.push(JSON.parse(data));
    }
  }

  return attacks;
}

// Get attacks by tag
export async function getAttacksByTag(tag: string): Promise<AttackVector[]> {
  const client = await getRedisClient();
  const ids = await client.sMembers(`tag:${tag}`);

  const attacks: AttackVector[] = [];
  for (const id of ids) {
    const data = await client.get(`attack:${id}`);
    if (data) {
      attacks.push(JSON.parse(data));
    }
  }

  return attacks;
}

// Get attack statistics
export async function getAttackStats(): Promise<{
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
}> {
  const client = await getRedisClient();
  const allAttacks = await getAllAttacks();

  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};

  for (const attack of allAttacks) {
    byCategory[attack.category] = (byCategory[attack.category] || 0) + 1;
    bySeverity[attack.severity] = (bySeverity[attack.severity] || 0) + 1;

    for (const tag of attack.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  return {
    total: allAttacks.length,
    byCategory,
    bySeverity,
    topTags,
  };
}
