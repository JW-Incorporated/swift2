import { notFound } from 'next/navigation';
import type { VaultSkeleton } from '@swift2/core';
import { ReaderShell } from '../../../../components/scrubber/ReaderShell';
import { VARIANTS, variantBySlug } from '../../../../components/scrubber/types';
import { loadSkeleton } from '../../../../lib/vault';

// Vault content is static between deploys; cache the skeleton for an hour.
export const revalidate = 3600;

const EMPTY: VaultSkeleton = { eras: [], milestones: [], monthItems: [] };

export function generateStaticParams() {
  return VARIANTS.map((v) => ({ variant: v.slug }));
}

export default async function ScrubberVariantPage({
  params,
}: {
  params: { variant: string };
}) {
  const info = variantBySlug(params.variant);
  if (!info) notFound();

  // Degrade to an empty skeleton if Supabase env is absent (e.g. CI build),
  // exactly like the production reader — real previews have the env set.
  let skeleton = EMPTY;
  try {
    skeleton = await loadSkeleton();
  } catch (err) {
    console.warn('Vault skeleton unavailable at render:', (err as Error).message);
  }

  return <ReaderShell skeleton={skeleton} variant={info.id} />;
}
