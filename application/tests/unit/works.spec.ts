import { describe, expect, it } from 'vitest'
import { filterWorks } from '../../src/utils/works'

const works = [
  { id: 'a', kind: 'client' as const },
  { id: 'b', kind: 'demo' as const },
  { id: 'c', kind: 'demo' as const },
]

describe('filterWorks', () => {
  it('returns every work for "all", in order', () => {
    expect(filterWorks(works, 'all').map((work) => work.id)).toEqual(['a', 'b', 'c'])
  })

  it('keeps only the requested kind', () => {
    expect(filterWorks(works, 'client').map((work) => work.id)).toEqual(['a'])
    expect(filterWorks(works, 'demo').map((work) => work.id)).toEqual(['b', 'c'])
  })
})
