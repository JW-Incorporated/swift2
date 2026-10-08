/**
 * Version of the /api wire contract (the shapes in packages/shared/src/api).
 * Sent on every /api/* response as the `x-api-version` header.
 *
 * Bump only on a breaking change to any shape in packages/shared/src/api.
 * Additive changes (a new optional field, a new endpoint) do not bump.
 */
export const API_VERSION = 1;
