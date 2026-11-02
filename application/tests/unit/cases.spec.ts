import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import casesData from '../../src/data/cases.json'
import projects from '../../src/data/projects.json'
import it_ from '../../src/i18n/locales/it.json'
import en from '../../src/i18n/locales/en.json'
import type { CaseData } from '../../src/types/content'

const cases = casesData as unknown as Record<string, CaseData>
const publicDir = resolve(__dirname, '../../public')

type Tree = { [key: string]: Tree | string }

function has(tree: Tree, key: string): boolean {
  let node: Tree | string = tree
  for (const part of key.split('.')) {
    if (typeof node === 'string' || !(part in node)) return false
    node = node[part]
  }
  return typeof node === 'string'
}

function imagesOf(material: CaseData['materials'][number]) {
  switch (material.type) {
    case 'images':
      return material.images
    case 'devices':
      return [material.desktop, material.tablet, material.phone]
    case 'cards':
      return material.cards.flatMap((card) => (card.image ? [card.image] : []))
    default:
      return []
  }
}

function keysOf(caseId: string, material: CaseData['materials'][number]): string[] {
  const base = `cases.items.${caseId}.materials.${material.id}`
  const keys = [`cases.tabs.${material.id}`, `cases.groups.${material.group}`]
  for (const fact of material.facts)
    keys.push(`${base}.facts.${fact}.label`, `${base}.facts.${fact}.value`)
  for (const image of imagesOf(material)) keys.push(image.alt)
  if (material.type === 'cards') {
    for (const card of material.cards)
      keys.push(`${base}.cards.${card.id}.title`, `${base}.cards.${card.id}.text`)
  }
  if (material.type === 'design') {
    for (const swatch of material.swatches) keys.push(`cases.swatch.${swatch.id}`)
    for (const font of material.fonts) keys.push(`cases.typeRole.${font.role}`)
  }
  return keys
}

describe('cases', () => {
  it('has a case for every work', () => {
    expect(
      projects.filter((project) => !(project.id in cases)).map((project) => project.id),
    ).toEqual([])
  })

  it('shows on each card only materials the case actually has', () => {
    const missing: string[] = []
    for (const project of projects) {
      const ids = new Set(cases[project.id].materials.map((material) => material.id))
      for (const chip of project.materials)
        if (!ids.has(chip)) missing.push(`${project.id}:${chip}`)
    }
    expect(missing).toEqual([])
  })

  it('points every image to an existing file', () => {
    const missing: string[] = []
    for (const [caseId, work] of Object.entries(cases)) {
      for (const material of work.materials) {
        for (const image of imagesOf(material)) {
          if (!existsSync(resolve(publicDir, `.${image.src}`)))
            missing.push(`${caseId}: ${image.src}`)
        }
      }
    }
    expect(missing).toEqual([])
  })

  it('has every translation a case needs, in both languages', () => {
    const missing: string[] = []
    for (const [caseId, work] of Object.entries(cases)) {
      const wanted = [`cases.items.${caseId}.lead`]
      for (const meta of work.meta) {
        wanted.push(
          `cases.items.${caseId}.meta.${meta}.label`,
          `cases.items.${caseId}.meta.${meta}.value`,
        )
      }
      for (const material of work.materials) wanted.push(...keysOf(caseId, material))
      for (const [name, tree] of [
        ['it', it_],
        ['en', en],
      ] as const) {
        for (const key of wanted) if (!has(tree as Tree, key)) missing.push(`${name}: ${key}`)
      }
    }
    expect(missing).toEqual([])
  })
})
