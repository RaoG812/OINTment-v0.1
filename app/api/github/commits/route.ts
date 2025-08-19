import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo');
  const branch = searchParams.get('branch') || 'main';
  if (!repo) {
    return NextResponse.json({ error: 'repo required' }, { status: 400 });
  }

  const commitsRes = await fetch(
    `https://api.github.com/repos/${repo}/commits?sha=${branch}`,
    { headers: { Accept: 'application/vnd.github+json' } }
  );
  if (!commitsRes.ok) {
    return NextResponse.json({ error: 'github fetch failed' }, { status: commitsRes.status });
  }
  const commitsData = await commitsRes.json();

  const list = await Promise.all(
    commitsData.slice(0, 20).map(async (c: any) => {
      let status = 'unknown';
      try {
        const statusRes = await fetch(
          `https://api.github.com/repos/${repo}/commits/${c.sha}/status`,
          { headers: { Accept: 'application/vnd.github+json' } }
        );
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          status = statusData.state;
        }
      } catch {
        // ignore
      }
      return {
        sha: c.sha,
        message: c.commit.message,
        date: c.commit.author?.date,
        status
      };
    })
  );

  return NextResponse.json(list);
}

