import { handleNegotiatedDocument } from './lib/agent-readable-http/shared.ts';

export default {
  fetch: handleWorkersRequest,
} satisfies ExportedHandler<Env>;

export function handleWorkersRequest(request: Request, env: Env): Promise<Response> {
  return handleNegotiatedDocument({
    request,
    fetchPublicAsset: (input) => env.ASSETS.fetch(input),
    fetchInternalAsset: (input) => env.ASSETS.fetch(input),
  });
}
