import type { VaultSkeleton } from '@swift2/core';
import { VaultReader } from '../components/VaultReader';
import { loadSkeleton } from '../lib/vault';

// Vault content is static between deploys; cache the skeleton for an hour.
export const revalidate = 3600;

const EMPTY: VaultSkeleton = { eras: [], milestones: [], monthItems: [] };

export default async function Page() {
  // In environments without Supabase env (e.g. CI build), degrade to an empty
  // skeleton rather than failing the build. Real deploys have the env set.
  let skeleton = EMPTY;
  try {
    skeleton = await loadSkeleton();
  } catch (err) {
    console.warn('Vault skeleton unavailable at render:', (err as Error).message);
  }
  return <VaultReader skeleton={skeleton} />;
}
