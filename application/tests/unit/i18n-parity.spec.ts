import { describe, expect, it } from 'vitest'
import it_ from '../../public/content/locales/it.json'
import en from '../../public/content/locales/en.json'
import projects from '../../public/content/data/projects.json'
import stack from '../../public/content/data/stack.json'

type Tree = { [key: string]: Tree | string }

function flatten(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : flatten(value, `${prefix}${key}.`),
  )
}

describe('translations', () => {
  const itKeys = new Set(flatten(it_ as Tree))
  const enKeys = new Set(flatten(en as Tree))

  it('defines the same keys in Italian and English', () => {
    expect([...itKeys].filter((key) => !enKeys.has(key))).toEqual([])
    expect([...enKeys].filter((key) => !itKeys.has(key))).toEqual([])
  })

  it('has every key the data files point to', () => {
    const wanted: string[] = []
    for (const project of projects) {
      wanted.push(`${project.translationKey}.title`, `${project.translationKey}.description`)
      wanted.push(project.imageAlt)
      for (const material of project.materials) wanted.push(`projects.materials.${material}`)
      wanted.push(`projects.kind.${project.kind}`)
    }
    for (const group of stack) {
      wanted.push(`${group.translationKey}.title`, `${group.translationKey}.tag`)
    }
    expect(wanted.filter((key) => !itKeys.has(key))).toEqual([])
    expect(wanted.filter((key) => !enKeys.has(key))).toEqual([])
  })
})
