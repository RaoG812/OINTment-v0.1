import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo');
  if (!repo) {
    return NextResponse.json({ error: 'repo required' }, { status: 400 });
  }
  const res = await fetch(`https://api.github.com/repos/${repo}/branches`, {
    headers: { Accept: 'application/vnd.github+json' }
  });
  if (!res.ok) {
    // Return an empty array with 200 status so the client can handle missing repos gracefully
    return NextResponse.json([]);
  }
  const data = await res.json();
  const branches = Array.isArray(data) ? data.map((b: any) => b.name) : [];
  return NextResponse.json(branches);
}

