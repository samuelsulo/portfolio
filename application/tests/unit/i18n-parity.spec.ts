import { describe, expect, it } from 'vitest'
import it_ from '../../src/i18n/locales/it.json'
import en from '../../src/i18n/locales/en.json'
import projects from '../../src/data/projects.json'
import stack from '../../src/data/stack.json'

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
