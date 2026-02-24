export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const params = url.searchParams;

  const serviceKey = env.WEATHER_KEY;
  if (!serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing WEATHER_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  const upstream = new URL('https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst');
  params.set('serviceKey', serviceKey);
  upstream.search = params.toString();

  const res = await fetch(upstream.toString());
  return new Response(res.body, {
    status: res.status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
