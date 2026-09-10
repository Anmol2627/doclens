'use server';

import { revalidatePath } from 'next/cache';

export async function clearAppCache() {
  // Invalidate the entire app cache to ensure all pages (handoff, timeline, context) get fresh data
  revalidatePath('/', 'layout');
}
