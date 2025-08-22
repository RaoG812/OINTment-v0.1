// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { githubHeaders } from '../../../../lib/github'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo');
  const path = searchParams.get('path') || '';
  let branch = searchParams.get('branch') || '';
  if (!branch && repo) {
    try {
      const infoRes = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: githubHeaders(req)
      });
      if (infoRes.ok) {
        const info = await infoRes.json();
        branch = info.default_branch || 'main';
      }
    } catch {
      branch = 'main';
    }
  }
  if (!branch) branch = 'main';
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

