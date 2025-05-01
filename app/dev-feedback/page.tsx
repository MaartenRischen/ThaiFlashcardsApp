import { promises as fs } from 'fs';
import path from 'path';
import React from 'react';
import { cookies } from 'next/headers';

const FEEDBACK_FILE = path.join(process.cwd(), 'feedback.json');
const PASSWORD_COOKIE = 'dev_feedback_pw';

type FeedbackEntry = {
  feedback: string;
  timestamp: string;
};

async function getFeedbackList() {
  try {
    const data = await fs.readFile(FEEDBACK_FILE, 'utf-8');
    return JSON.parse(data).reverse(); // Most recent first
  } catch {
    return [];
  }
}

export default async function DevFeedbackPage() {
  const cookieStore = cookies();
  const pw = cookieStore.get(PASSWORD_COOKIE)?.value;
  const correctPw = process.env.DEV_FEEDBACK_PASSWORD;
  const isAuthed = pw && correctPw && pw === correctPw;
  const feedbackList = isAuthed ? await getFeedbackList() : [];

  return (
    <div className="min-h-screen bg-[#181818] text-gray-200 flex flex-col items-center py-12">
      <h1 className="text-2xl font-bold mb-8 text-yellow-400">Feedback Dashboard</h1>
      {!isAuthed ? (
        <form method="POST" className="bg-[#222] p-6 rounded shadow max-w-xs w-full flex flex-col gap-4">
          <label htmlFor="pw" className="text-sm">Enter password:</label>
          <input type="password" name="pw" id="pw" className="rounded p-2 bg-[#181818] border border-gray-600 text-white" />
          <button type="submit" className="bg-yellow-400 text-black font-bold rounded py-2">Login</button>
        </form>
      ) : (
        <div className="w-full max-w-2xl space-y-6">
          {feedbackList.length === 0 ? (
            <div className="text-gray-400">No feedback yet.</div>
          ) : feedbackList.map((entry: FeedbackEntry, i: number) => (
            <div key={i} className="bg-[#232323] border border-gray-700 rounded p-4">
              <div className="text-xs text-gray-400 mb-2">{new Date(entry.timestamp).toLocaleString()}</div>
              <div className="whitespace-pre-line text-base">{entry.feedback}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';

// Handle password POST
export async function POST(req: Request) {
  const data = await req.formData();
  const pw = data.get('pw');
  if (pw && pw === process.env.DEV_FEEDBACK_PASSWORD) {
    // Set cookie for 1 day
    return new Response(null, {
      status: 302,
      headers: {
        'Set-Cookie': `${PASSWORD_COOKIE}=${pw}; Path=/; Max-Age=86400; HttpOnly`,
        Location: '/dev-feedback',
      },
    });
  }
  // Wrong password, reload
  return new Response(null, {
    status: 302,
    headers: { Location: '/dev-feedback' },
  });
} 