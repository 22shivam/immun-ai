import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Starting autonomous attack agent...');

    // Dynamic import to avoid bundling issues
    const { runAttackAgent } = await import('../../../lib/attack-agent');

    const report = await runAttackAgent();

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('Agent attack error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to run attack agent',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
