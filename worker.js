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
      let links = {};
      try {
        links = JSON.parse(env.ADMIN_RESOURCE_LINKS || '{}');
        if (!links || typeof links !== 'object' || Array.isArray(links)) links = {};
      } catch (error) {
        return new Response('Dashboard links are temporarily unavailable.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
      }
      return Response.json(links, {
        headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' }
      });
    }

    return env.ASSETS.fetch(request);
  }
};
