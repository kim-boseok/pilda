// Cloudflare Pages Function — 공공데이터포털(KHOA) API 중계
// 브라우저가 직접 호출하면 CORS로 막히므로, 이 함수가 서버 측에서 대신 호출해 전달한다.
// /api/khoa/* → https://apis.data.go.kr/*
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const target =
    'https://apis.data.go.kr' + url.pathname.replace(/^\/api\/khoa/, '') + url.search;

  const upstream = await fetch(target, {
    headers: { accept: 'application/json' },
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') || 'application/json',
      // 물때 예보는 자주 바뀌지 않으므로 10분 캐시로 API 호출량 절약
      'cache-control': 'public, max-age=600',
      'access-control-allow-origin': '*',
    },
  });
}
