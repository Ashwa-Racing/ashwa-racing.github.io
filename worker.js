const DASH_HOST = 'dash.ashwaracing.org';
const PRIVATE_PATHS = new Set(['/admin', '/admin/', '/admin.html', '/_admin/resources']);

function notFound() {
  return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isDashboardPath = PRIVATE_PATHS.has(url.pathname);

    // The admin page and its resource links only exist on the Access-gated host.
    if (isDashboardPath && url.hostname !== DASH_HOST) return notFound();

    if (url.pathname === '/_admin/resources') {
      if (url.hostname !== DASH_HOST) return notFound();
      const secret = env.ADMIN_RESOURCE_LINKS;
      if (typeof secret !== 'string' || !secret.trim()) {
        return Response.json({ error: 'ADMIN_RESOURCE_LINKS is not available to this Worker deployment.' }, {
          status: 503,
          headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' }
        });
      }
      let links;
      try {
        links = JSON.parse(secret);
      } catch (error) {
        return Response.json({ error: 'ADMIN_RESOURCE_LINKS must contain a valid JSON object.' }, {
          status: 503,
          headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' }
        });
      }
      if (!links || typeof links !== 'object' || Array.isArray(links)) {
        return Response.json({ error: 'ADMIN_RESOURCE_LINKS must be a JSON object keyed by resource ID.' }, {
          status: 503,
          headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' }
        });
      }
      if (Object.keys(links).length === 0) {
        return Response.json({ error: 'ADMIN_RESOURCE_LINKS is set, but contains no resource links.' }, {
          status: 503,
          headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' }
        });
      }
      return Response.json(links, {
        headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' }
      });
    }

    return env.ASSETS.fetch(request);
  }
};
