import { NextRequest, NextResponse } from 'next/server';
import {
  searchSimilarAttacks,
  getAttacksByCategory,
  getAttacksByTag,
  getAttackStats,
  getAllAttacks,
} from '../../../lib/redis-service';

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 5 } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Semantic search: "${query}"`);

    const results = await searchSimilarAttacks(query, limit);

    return NextResponse.json({
      query,
      results: results.map((r) => ({
        id: r.id,
        category: r.category,
        severity: r.severity,
        technique: r.technique,
        prompt: r.prompt,
        tags: r.tags,
        similarity: (r.similarity * 100).toFixed(1), // Convert to percentage
      })),
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search attacks' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const param = searchParams.get('param');

    switch (action) {
      case 'stats':
        const stats = await getAttackStats();
        return NextResponse.json(stats);

      case 'category':
        if (!param) {
          return NextResponse.json(
            { error: 'Category parameter required' },
            { status: 400 }
          );
        }
        const categoryAttacks = await getAttacksByCategory(param);
        return NextResponse.json({ attacks: categoryAttacks });

      case 'tag':
        if (!param) {
          return NextResponse.json(
            { error: 'Tag parameter required' },
            { status: 400 }
          );
        }
        const tagAttacks = await getAttacksByTag(param);
        return NextResponse.json({ attacks: tagAttacks });

      case 'all':
        const allAttacks = await getAllAttacks();
        return NextResponse.json({ attacks: allAttacks });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: stats, category, tag, or all' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Get attacks error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get attacks' },
      { status: 500 }
    );
  }
}
