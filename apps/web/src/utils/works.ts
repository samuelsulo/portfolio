import type { ProjectItem, WorkKind } from '@/types/content'

export type WorkFilter = 'all' | WorkKind

export const WORK_FILTERS: readonly WorkFilter[] = ['all', 'client', 'demo']

/** The works to show for a filter, keeping the order of the data file. */
export function filterWorks<T extends Pick<ProjectItem, 'kind'>>(
  items: T[],
  filter: WorkFilter,
): T[] {
  return filter === 'all' ? items : items.filter((item) => item.kind === filter)
}
