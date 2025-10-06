import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Sentiment from 'sentiment';

const sentiment = new Sentiment();

// Threshold for flagging negative comments
const NEGATIVITY_THRESHOLD = -2; // Score below this will be flagged

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postSlug, author, content } = body;

    // Validate input
    if (!postSlug || !author || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate length
    if (author.length > 100) {
      return NextResponse.json(
        { error: 'Name too long (max 100 characters)' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    if (content.length < 3) {
      return NextResponse.json(
        { error: 'Comment too short (min 3 characters)' },
        { status: 400 }
      );
    }

    // Analyze sentiment
    const analysis = sentiment.analyze(content);
    const sentimentScore = analysis.score;

    // Flag if too negative
    const flagged = sentimentScore < NEGATIVITY_THRESHOLD;

    // Auto-reject extremely negative comments (score below -5)
    if (sentimentScore < -5) {
      return NextResponse.json(
        {
          error: 'Comment rejected due to negative content. Please keep comments constructive and respectful.',
          flagged: true
        },
        { status: 400 }
      );
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        postSlug,
        author: author.trim(),
        content: content.trim(),
        sentiment: sentimentScore,
        flagged,
        approved: !flagged, // Auto-approve if not flagged
      },
    });

    return NextResponse.json({
      comment,
      message: flagged
        ? 'Comment submitted for review due to detected negativity'
        : 'Comment posted successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postSlug = searchParams.get('postSlug');

    if (!postSlug) {
      return NextResponse.json(
        { error: 'postSlug is required' },
        { status: 400 }
      );
    }

    // Get only approved comments
    const comments = await prisma.comment.findMany({
      where: {
        postSlug,
        approved: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        author: true,
        content: true,
        createdAt: true,
        sentiment: true,
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
