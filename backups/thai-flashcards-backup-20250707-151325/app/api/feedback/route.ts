import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const FEEDBACK_FILE = path.join(process.cwd(), 'feedback.json');

export async function POST(req: NextRequest) {
  try {
    const { feedback, username, includeConsoleLogs, includeGenerationDetails } = await req.json();
    if (!feedback || typeof feedback !== 'string') {
      return NextResponse.json({ error: 'Invalid feedback' }, { status: 400 });
    }

    // Read existing feedback
    let feedbackList = [];
    try {
      const data = await fs.readFile(FEEDBACK_FILE, 'utf-8');
      feedbackList = JSON.parse(data);
    } catch (e) {
      // File may not exist yet
      feedbackList = [];
    }

    // Append new feedback
    feedbackList.push({
      feedback,
      username: username || 'anonymous',
      includeConsoleLogs: !!includeConsoleLogs,
      includeGenerationDetails: !!includeGenerationDetails,
      timestamp: new Date().toISOString(),
    });

    // Write back to file
    await fs.writeFile(FEEDBACK_FILE, JSON.stringify(feedbackList, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback storage error:', error);
    return NextResponse.json({ error: 'Failed to store feedback' }, { status: 500 });
  }
} 