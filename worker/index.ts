import handler from 'vinext/server/fetch-handler';
import { handleWorkspace } from './workspace';

export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    if (new URL(request.url).pathname.startsWith('/api/')) {
      return handleWorkspace(request, env);
    }
    return handler.fetch(request, env, ctx);
  },
};
