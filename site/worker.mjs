import legacyGameRedirects from './dist/legacy-game-redirects.json' with { type: 'json' };

export default {
  fetch(request, env) {
    const url = new URL(request.url);
    const source = url.pathname.replace(/\/(?:index\.html)?$/, '');
    if (Object.hasOwn(legacyGameRedirects, source)) {
      url.pathname = legacyGameRedirects[source];
      return Response.redirect(url, 301);
    }
    return env.ASSETS.fetch(request);
  },
};
