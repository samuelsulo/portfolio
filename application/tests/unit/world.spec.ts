import { describe, expect, it } from 'vitest'
import {
  DECOR,
  DESTINATIONS,
  HUB,
  ROOMS,
  START_POSITION,
  buildInteractables,
  isWalkable,
  itemsInRoom,
  moveDirection,
  nearestInteractable,
  resolveMove,
  roomById,
  spawnAfterPortal,
  PANEL_SIZE,
  wallSlots,
  yawToward,
} from '../../src/scene3d/world'
import { DANCE_IDS, dancePose, restPose, walkPose } from '../../src/scene3d/dances'
import { parsePlayerState } from '../../src/scene3d/session'

const content = {
  projectIds: ['a', 'b', 'c', 'd'],
  stackGroupIds: ['s1', 's2', 's3', 's4', 's5', 's6'],
  certificationIds: ['c1', 'c2', 'c3'],
  cvLanguages: ['it', 'en'] as ('it' | 'en')[],
}

const items = buildInteractables(content)

describe('3D world', () => {
  it('starts in the hub, on a free spot', () => {
    expect(isWalkable(START_POSITION, HUB)).toBe(true)
  })

  it('places every item inside its room, on a free stand point', () => {
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length)
    for (const item of items) {
      expect(isWalkable(item.stand, item.room), item.id).toBe(true)
    }
  })

  it('has a portal from the hub to every room and one back', () => {
    const hub = itemsInRoom(items, HUB).filter((item) => item.kind === 'portal')
    expect(hub.map((item) => item.refId).sort()).toEqual([...DESTINATIONS].sort())
    for (const target of DESTINATIONS) {
      const back = itemsInRoom(items, target).filter((item) => item.kind === 'portal')
      expect(back.map((item) => item.refId)).toEqual([HUB])
    }
  })

  it('leaves the CV room out when the site has no CV', () => {
    const without = buildInteractables({ ...content, cvLanguages: [] })
    expect(without.some((item) => item.refId === 'cv' || item.room === 'cv')).toBe(false)
  })

  it('makes the player appear in front of the way back, looking into the room', () => {
    for (const target of DESTINATIONS) {
      const spawn = spawnAfterPortal(items, HUB, target)
      expect(isWalkable(spawn.position, target), target).toBe(true)
      const back = itemsInRoom(items, target).find((item) => item.kind === 'portal')!
      // Looking at the middle of the room, away from the portal.
      const forward = { x: -Math.sin(spawn.yaw), z: -Math.cos(spawn.yaw) }
      const towardPortal = {
        x: back.position.x - spawn.position.x,
        z: back.position.z - spawn.position.z,
      }
      expect(forward.x * towardPortal.x + forward.z * towardPortal.z).toBeLessThan(0)
    }
    // Back in the hub, in front of the portal that was used.
    const spawn = spawnAfterPortal(items, 'work', HUB)
    const portal = itemsInRoom(items, HUB).find((item) => item.refId === 'work')!
    expect(isWalkable(spawn.position, HUB)).toBe(true)
    expect(
      Math.hypot(spawn.position.x - portal.position.x, spawn.position.z - portal.position.z),
    ).toBeLessThan(5)
  })

  it('keeps the props on the floor and out of the way of the items', () => {
    for (const prop of DECOR) {
      if (!prop.solid) continue
      const half = roomById(prop.room).half
      expect(prop.solid.minX, `${prop.room} ${prop.kind}`).toBeGreaterThanOrEqual(-half)
      expect(prop.solid.maxX).toBeLessThanOrEqual(half)
      expect(prop.solid.minZ).toBeGreaterThanOrEqual(-half)
      expect(prop.solid.maxZ).toBeLessThanOrEqual(half)
    }
  })

  it('stops at the walls and at the props, and slides along them', () => {
    expect(isWalkable({ x: 20, z: 0 }, HUB)).toBe(false)
    const wall = resolveMove({ x: 6.2, z: 0 }, { x: 20, z: 1 }, HUB)
    expect(isWalkable(wall, HUB)).toBe(true)
    expect(wall.z).toBe(1)
    // The pedestal in the middle of the hub is in the way.
    const blocked = resolveMove({ x: 0, z: 1.3 }, { x: 0, z: 1.1 }, HUB)
    expect(blocked).toEqual({ x: 0, z: 1.3 })
  })

  it('makes forward follow where the camera looks, and diagonals no faster', () => {
    const forward = moveDirection({ x: 0, z: 1 }, 0)
    expect(forward.x).toBeCloseTo(0)
    expect(forward.z).toBeCloseTo(-1)
    const right = moveDirection({ x: 1, z: 0 }, 0)
    expect(right.x).toBeCloseTo(1)
    const diagonal = moveDirection({ x: 1, z: 1 }, 0)
    expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(1)
  })

  it('turns the camera towards a point', () => {
    expect(yawToward({ x: 0, z: 5 }, { x: 0, z: 0 })).toBeCloseTo(0)
    const yaw = yawToward({ x: 3, z: 0 }, { x: 0, z: 0 })
    expect(-Math.sin(yaw)).toBeCloseTo(-1)
  })

  it('spreads items over the walls but the south one', () => {
    const work = roomById('work')
    const slots = wallSlots(work, 4)
    expect(slots).toHaveLength(4)
    expect(slots.every((slot) => slot.position.z < work.half)).toBe(true)
    expect(wallSlots(work, 0)).toEqual([])
    expect(ROOMS.length).toBe(DESTINATIONS.length + 1)
  })

  it('finds the closest item within reach', () => {
    const hub = itemsInRoom(items, HUB)
    const about = hub.find((item) => item.kind === 'about')!
    expect(nearestInteractable(about.stand, hub)?.id).toBe(about.id)
    expect(nearestInteractable({ x: 0, z: 6 }, hub, 0.1)).toBeNull()
  })

  it('resumes only from a saved state that still makes sense', () => {
    const saved = { room: 'work', x: 1, z: 2, yaw: 0.5, pitch: 0.4, distance: 6 }
    expect(parsePlayerState(saved)).toEqual(saved)
    expect(parsePlayerState({ ...saved, room: 'attic' })).toBeNull()
    expect(parsePlayerState({ ...saved, x: 99 })).toBeNull()
    expect(parsePlayerState({ ...saved, yaw: 'left' })).toBeNull()
    expect(parsePlayerState(null)).toBeNull()
  })

  it('has finite, bounded poses for every dance and for walking', () => {
    const angles = (pose: ReturnType<typeof restPose>) =>
      [pose.armLeft, pose.armRight, pose.legLeft, pose.legRight].flatMap((l) => [l.x, l.z, l.bend])
    for (const id of DANCE_IDS) {
      for (let t = 0; t < 10; t += 0.13) {
        const pose = dancePose(id, t)
        for (const angle of angles(pose)) {
          expect(Number.isFinite(angle), `${id} at ${t}`).toBe(true)
          expect(Math.abs(angle), `${id} at ${t}`).toBeLessThanOrEqual(3.3)
        }
        expect(Math.abs(pose.lift)).toBeLessThan(0.4)
      }
      // A dance moves the figure, it is not the resting pose.
      expect(dancePose(id, 0.37)).not.toEqual(restPose())
    }
    expect(walkPose(1, 0).legLeft.x).toBeCloseTo(0)
    expect(dancePose('spin', 2).spin).toBeGreaterThan(dancePose('spin', 1).spin)
  })

  it('hangs the panels of a wall with the same gap between them and to the corners', () => {
    for (const [room, kind] of [
      ['stack', 'stack'],
      ['work', 'work'],
      ['certifications', 'certification'],
    ] as const) {
      const onWall = itemsInRoom(items, room).filter((item) => item.kind === kind)
      const { width } = PANEL_SIZE[kind]
      const half = roomById(room).half - 0.4
      const walls = new Map<string, number[]>()
      for (const item of onWall) {
        // The coordinate along the wall: z on the side walls, x on the north one.
        const onSide = Math.abs(item.position.x) > half - 0.01
        const wall = onSide ? `side${Math.sign(item.position.x)}` : 'north'
        const along = onSide ? item.position.z : item.position.x
        walls.set(wall, [...(walls.get(wall) ?? []), along])
      }
      for (const positions of walls.values()) {
        const sorted = [...positions].sort((a, b) => a - b)
        const edges = [-half, ...sorted.flatMap((p) => [p - width / 2, p + width / 2]), half]
        const gaps = edges.flatMap((edge, i) => (i % 2 === 0 ? [edges[i + 1] - edge] : []))
        for (const gap of gaps) {
          expect(gap, `${room} ${JSON.stringify(gaps)}`).toBeGreaterThan(0.5)
          expect(gap).toBeCloseTo(gaps[0], 5)
        }
      }
    }
  })
})
