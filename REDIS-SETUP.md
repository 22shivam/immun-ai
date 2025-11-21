# RedisVL Attack Vector Database Setup

This project uses RedisVL for semantic search over healthcare AI attack vectors.

## Prerequisites

1. **Redis Server** - You need a running Redis instance

### Option 1: Local Redis (Recommended for Development)

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:latest
```

### Option 2: Redis Cloud (Free Tier)

1. Go to https://redis.com/try-free/
2. Create a free account
3. Create a new database
4. Copy the connection URL
5. Add to `.env`:
```
REDIS_URL=redis://default:password@hostname:port
```

## Setup Steps

### 1. Install Dependencies

```bash
cd dashboard
npm install
```

### 2. Seed Redis with Attack Vectors

This loads 50 curated healthcare attack prompts into Redis with embeddings:

```bash
npm run seed-redis
```

**Output:**
```
🌱 Seeding Redis with healthcare attack vectors...
📚 Loaded 35 attacks from dataset
🔄 Generating embeddings and storing in Redis...
   Progress: 35/35 attacks stored

📊 Attack Database Statistics:
   Total attacks: 35

   By Category:
     prompt_injection: 10
     social_engineering: 10
     tool_manipulation: 8
     data_exfiltration: 7

✅ Redis seeding complete!
```

### 3. Start the Dashboard

```bash
npm run dev
```

Open http://localhost:3000

## Using Semantic Search

### In the Dashboard

1. Scroll to **"🔍 Semantic Attack Search"** section
2. Try these queries:
   - `"medical emergency attacks"`
   - `"SQL injection attempts"`
   - `"impersonate doctor"`
   - `"extract SSN data"`
   - `"email exfiltration"`

3. Click on any result to load it into the custom prompt area
4. Click **"🚀 Run Attack"** to test it

### How It Works

```
┌─────────────────────────────────────────────┐
│ User Query: "medical emergency attacks"    │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │ Generate Embedding          │
        │ (all-MiniLM-L6-v2)         │
        └─────────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │ Calculate Cosine Similarity │
        │ with all 35 stored attacks  │
        └─────────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │ Return Top 5 Matches with   │
        │ Similarity Scores (%)       │
        └─────────────────────────────┘
```

## Attack Database Schema

Each attack is stored with:

```json
{
  "id": "SE-001",
  "category": "social_engineering",
  "severity": "critical",
  "technique": "Medical Emergency",
  "prompt": "URGENT: This is Dr. Williams...",
  "tags": ["urgency", "authority", "medical_emergency"],
  "embedding": [0.123, -0.456, ...] // 384-dim vector
}
```

## Redis Keys Structure

```
attack:PI-001             → Full attack JSON with embedding
attack:SE-002             → Full attack JSON with embedding

category:prompt_injection → Set of attack IDs
category:social_engineering → Set of attack IDs

severity:critical         → Set of attack IDs
severity:high            → Set of attack IDs

tag:urgency              → Set of attack IDs
tag:medical_emergency    → Set of attack IDs
```

## API Endpoints

### POST /api/search-attacks
Semantic search for attacks

```bash
curl -X POST http://localhost:3000/api/search-attacks \
  -H "Content-Type: application/json" \
  -d '{"query": "medical emergency", "limit": 5}'
```

### GET /api/search-attacks?action=stats
Get database statistics

```bash
curl http://localhost:3000/api/search-attacks?action=stats
```

### GET /api/search-attacks?action=category&param=prompt_injection
Get attacks by category

## Troubleshooting

### Redis Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution:** Start Redis server (`brew services start redis`)

### Out of Memory
```
Error: OOM command not allowed
```
**Solution:** Redis ran out of memory. Clear database:
```bash
redis-cli FLUSHALL
npm run seed-redis
```

### Embedding Model Download Slow
First run downloads ~25MB model. This is normal and only happens once.
Model cached in `~/.cache/huggingface`

## Dataset Sources

- OWASP LLM Top 10 (2025)
- Open-Prompt-Injection (USENIX Security 2024)
- SPML Chatbot Prompt Injection (HuggingFace)
- Custom healthcare-specific attacks

## RedisVL Prize Criteria

✅ Semantic vector search
✅ Embedding generation (all-MiniLM-L6-v2)
✅ Cosine similarity matching
✅ Category & tag indexing
✅ Real-time attack discovery
✅ Integration with AI security demo
