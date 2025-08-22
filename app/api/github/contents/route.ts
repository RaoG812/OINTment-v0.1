// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { githubHeaders } from '../../../../lib/github'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo');
  const path = searchParams.get('path') || '';
  const branch = searchParams.get('branch') || 'main';
  if (!repo) {
    return NextResponse.json({ error: 'repo required' }, { status: 400 });
  }

  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`,
    { headers: githubHeaders(req) }
  );
  if (!res.ok) {
    return NextResponse.json({ error: 'github fetch failed' }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}

