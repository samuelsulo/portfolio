/**
 * The geometry of the 3D portfolio, with no dependency on three.js so it is
 * cheap to unit test: the rooms, where the player can walk, what stands in the
 * way, where the things to interact with are and where the portals lead. The
 * renderer (`explorer.ts`) only draws what is described here.
 *
 * Every room is centred on the origin and only one is shown at a time: the
 * rooms are not connected, the player moves between them through portals.
 *
 * Axes: x to the right, z towards the viewer (the "south"), the unit is the metre.
 */

export interface Vec2 {
  x: number
  z: number
}

export interface Rect {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export type RoomId = 'hub' | 'work' | 'stack' | 'certifications' | 'cv' | 'contact'
export type Side = 'north' | 'south' | 'west' | 'east'
export type InteractableKind =
  'portal' | 'about' | 'work' | 'stack' | 'certification' | 'cv' | 'contact'
export type CvLanguage = 'it' | 'en'

export interface Room {
  id: RoomId
  /** Half of the side of the (square) room. */
  half: number
}

/** What the rooms need to know about the site content to place its items. */
export interface WorldContent {
  projectIds: string[]
  stackGroupIds: string[]
  certificationIds: string[]
  /** The languages a CV is published in, none when the site has no CV. */
  cvLanguages: CvLanguage[]
}

export interface Interactable {
  /** Unique, `<kind>:<content id>` (portals: `portal:<from>><to>`). */
  id: string
  kind: InteractableKind
  /** The content id (project, stack group, certification, language), or the target room of a portal. */
  refId: string
  room: RoomId
  /** Where the object stands, on the wall or in the middle of the room. */
  position: Vec2
  /** Rotation around the vertical axis that makes the object face into the room. */
  rotationY: number
  /** Where the player must be close to for the prompt to appear. */
  stand: Vec2
}

export type DecorKind =
  | 'rack'
  | 'cloud'
  | 'desk'
  | 'cubes'
  | 'database'
  | 'globe'
  | 'containers'
  | 'lock'
  | 'branch'
  | 'antenna'
  | 'brackets'
  | 'pedestal'

export interface Decor {
  room: RoomId
  kind: DecorKind
  position: Vec2
  rotationY: number
  /** Height of a floating prop, 0 for one standing on the floor. */
  height: number
  /** The floor area it takes up, null when the player can walk through or under it. */
  solid: Rect | null
  /** How high the top of the solid is, where the player can stand after a jump (0 without a solid). */
  top: number
}

export const HUB: RoomId = 'hub'
/** The rooms the hub has a portal to, in the order of the portals. */
export const DESTINATIONS: readonly RoomId[] = ['work', 'stack', 'certifications', 'cv', 'contact']

export const ROOMS: readonly Room[] = [
  { id: 'hub', half: 7 },
  { id: 'work', half: 6 },
  { id: 'stack', half: 6 },
  { id: 'certifications', half: 6 },
  { id: 'cv', half: 6 },
  { id: 'contact', half: 6 },
]

export const WALL_INSET = 0.4
export const INTERACT_RADIUS = 2.6
export const PLAYER_RADIUS = 0.35
export const START_POSITION: Vec2 = { x: 0, z: 4.5 }

const STAND_DISTANCE = 1.7
const SPAWN_DISTANCE = 4.3

const OFFSETS: Record<Side, Vec2> = {
  north: { x: 0, z: -1 },
  south: { x: 0, z: 1 },
  west: { x: -1, z: 0 },
  east: { x: 1, z: 0 },
}

const OPPOSITE: Record<Side, Side> = {
  north: 'south',
  south: 'north',
  west: 'east',
  east: 'west',
}

export function roomById(id: RoomId): Room {
  return ROOMS.find((room) => room.id === id)!
}

/** The area of a room the player can walk in (inside the walls). */
export function roomRect(room: Room): Rect {
  const half = room.half - WALL_INSET
  return { minX: -half, maxX: half, minZ: -half, maxZ: half }
}

// --- Decorations ---

/** Half of the width and depth each standing prop takes up. */
const FOOTPRINT: Partial<Record<DecorKind, [number, number]>> = {
  rack: [0.5, 0.4],
  desk: [1.1, 0.55],
  database: [0.65, 0.65],
  containers: [1.3, 0.7],
  lock: [0.55, 0.55],
  antenna: [0.45, 0.45],
  pedestal: [0.9, 0.9],
}

/** The height of the top of each standing prop, matching how tall it is drawn in `props.ts`. */
const TOP: Partial<Record<DecorKind, number>> = {
  rack: 2,
  desk: 0.78,
  database: 1.4,
  containers: 1.2,
  lock: 1.2,
  antenna: 0.3,
  pedestal: 1.1,
}

/** A solid at most this much above the feet is stepped on instead of being a wall. */
export const STEP_HEIGHT = 0.1

function decor(
  room: RoomId,
  kind: DecorKind,
  x: number,
  z: number,
  rotationY = 0,
  height = 0,
): Decor {
  const footprint = FOOTPRINT[kind]
  return {
    room,
    kind,
    position: { x, z },
    rotationY,
    height,
    top: footprint ? (TOP[kind] ?? 0) : 0,
    solid: footprint
      ? {
          minX: x - footprint[0],
          maxX: x + footprint[0],
          minZ: z - footprint[1],
          maxZ: z + footprint[1],
        }
      : null,
  }
}

const FACING_NORTH = Math.PI

/** What fills the rooms: the tools of the trade, along the free walls and floating in the middle. */
export const DECOR: readonly Decor[] = [
  // The hub: the pedestal that introduces the visitor, and a server aisle behind the starting point, with the cloud and the infrastructure above.
  decor('hub', 'pedestal', 0, 0),
  decor('hub', 'rack', -5.6, 6.2, FACING_NORTH),
  decor('hub', 'rack', -4.5, 6.2, FACING_NORTH),
  decor('hub', 'rack', 4.5, 6.2, FACING_NORTH),
  decor('hub', 'rack', 5.6, 6.2, FACING_NORTH),
  decor('hub', 'database', -5.7, 3.6),
  decor('hub', 'containers', 5.2, 3.5),
  decor('hub', 'cloud', -3.2, -0.8, 0, 2.6),
  decor('hub', 'cubes', 3.2, -0.8, 0, 2.6),
  // Work: a developer's corner and the containers that ship it.
  decor('work', 'desk', -3.8, 4.9, FACING_NORTH),
  decor('work', 'containers', 3.9, 4.8),
  decor('work', 'branch', 0, 0),
  // Stack: servers, data and infrastructure as code.
  decor('stack', 'rack', -4.6, 5.1, FACING_NORTH),
  decor('stack', 'rack', -3.5, 5.1, FACING_NORTH),
  decor('stack', 'database', 4.6, 4.8),
  decor('stack', 'cubes', 0, 0, 0, 2.7),
  decor('stack', 'cloud', 0, -1.5, 0, 2.7),
  // Certifications: security first.
  decor('certifications', 'lock', -4.2, 4.6),
  decor('certifications', 'database', 4.2, 4.6),
  decor('certifications', 'cloud', 0, 0, 0, 2.6),
  // The CV: two desks and the code.
  decor('cv', 'desk', -3.9, 4.9, FACING_NORTH),
  decor('cv', 'desk', 3.9, 4.9, FACING_NORTH),
  decor('cv', 'brackets', 0, 0, 0, 2.5),
  // Contact: the antennas and the network.
  decor('contact', 'antenna', -4.4, 4.8),
  decor('contact', 'antenna', 4.4, 4.8),
  decor('contact', 'globe', 0, -0.5, 0, 2.4),
]

export function decorOf(room: RoomId): Decor[] {
  return DECOR.filter((item) => item.room === room)
}

// --- Walking ---

function inside(rect: Rect, point: Vec2, margin: number): boolean {
  return (
    point.x >= rect.minX + margin &&
    point.x <= rect.maxX - margin &&
    point.z >= rect.minZ + margin &&
    point.z <= rect.maxZ - margin
  )
}

/**
 * Whether a player of that radius, with the feet at the height `feet`, can stand at the point: inside
 * the walls and not in a prop. A prop whose top is within a step of the feet (or below them) is not
 * in the way: the player is above it.
 */
export function isWalkable(point: Vec2, room: RoomId, radius = PLAYER_RADIUS, feet = 0): boolean {
  if (!inside(roomRect(roomById(room)), point, radius)) return false
  return !decorOf(room).some(
    (item) => item.solid && item.top > feet + STEP_HEIGHT && inside(item.solid, point, -radius),
  )
}

/**
 * The height of the floor under the point for a player with the feet at `feet`: the top of the
 * highest prop they are above (the same area that blocks them from the side), else 0.
 */
export function groundAt(point: Vec2, room: RoomId, feet: number, radius = PLAYER_RADIUS): number {
  let ground = 0
  for (const item of decorOf(room)) {
    if (item.solid && item.top <= feet + STEP_HEIGHT && inside(item.solid, point, -radius)) {
      ground = Math.max(ground, item.top)
    }
  }
  return ground
}

/**
 * Moves from `from` towards `to`, stopping at the walls and the props: if the
 * straight move is blocked it tries each axis alone, so the player slides along
 * an obstacle instead of sticking to it.
 */
export function resolveMove(
  from: Vec2,
  to: Vec2,
  room: RoomId,
  radius = PLAYER_RADIUS,
  feet = 0,
): Vec2 {
  if (isWalkable(to, room, radius, feet)) return to
  const alongX = { x: to.x, z: from.z }
  if (isWalkable(alongX, room, radius, feet)) return alongX
  const alongZ = { x: from.x, z: to.z }
  if (isWalkable(alongZ, room, radius, feet)) return alongZ
  return from
}

/**
 * Turns the input (`x`: right is positive, `z`: forward is positive, both in
 * -1..1) into a world direction, relative to where the camera looks. `yaw` is
 * the camera's angle around the player.
 */
export function moveDirection(input: Vec2, yaw: number): Vec2 {
  const forward = { x: -Math.sin(yaw), z: -Math.cos(yaw) }
  const right = { x: -forward.z, z: forward.x }
  const x = right.x * input.x + forward.x * input.z
  const z = right.z * input.x + forward.z * input.z
  const length = Math.hypot(x, z)
  // A diagonal must not be faster than a straight line, but a light touch on
  // the joystick still walks slower than a full push.
  return length > 1 ? { x: x / length, z: z / length } : { x, z }
}

/** The camera yaw that makes it look from `from` towards `to`. */
export function yawToward(from: Vec2, to: Vec2): number {
  return Math.atan2(from.x - to.x, from.z - to.z)
}

// --- Objects on the walls ---

interface WallSlot {
  position: Vec2
  rotationY: number
  stand: Vec2
}

function slotOnWall(room: Room, side: Side, along: number): WallSlot {
  const offset = OFFSETS[side]
  const inward = OFFSETS[OPPOSITE[side]]
  const wall = room.half - WALL_INSET
  const position =
    offset.x !== 0 ? { x: offset.x * wall, z: along } : { x: along, z: offset.z * wall }
  return {
    position,
    // An object faces +z at rotation 0.
    rotationY: Math.atan2(inward.x, inward.z),
    stand: {
      x: position.x + inward.x * STAND_DISTANCE,
      z: position.z + inward.z * STAND_DISTANCE,
    },
  }
}

/**
 * The size, in metres, of what hangs on a wall for each kind of object: the renderer draws
 * them at this size and the spacing below is computed from the width.
 */
export const PANEL_SIZE: Record<InteractableKind, { width: number; height: number }> = {
  portal: { width: 2.2, height: 2.2 },
  about: { width: 1.8, height: 1.8 },
  work: { width: 2.6, height: 1.7 },
  stack: { width: 3, height: 2.25 },
  certification: { width: 1.6, height: 1.6 },
  cv: { width: 1.7, height: 2.4 },
  contact: { width: 3, height: 2.25 },
}

/**
 * `count` objects of a width along a wall, with the same gap between each two of them and
 * between the first and last one and the corners, so no hole is bigger than another.
 */
function spread(room: Room, side: Side, count: number, width: number): WallSlot[] {
  const length = 2 * (room.half - WALL_INSET)
  const gap = (length - count * width) / (count + 1)
  return Array.from({ length: count }, (_, index) =>
    slotOnWall(room, side, -length / 2 + gap * (index + 1) + width * (index + 0.5)),
  )
}

/**
 * Spreads `count` objects over the walls of a room, evenly. The south wall is
 * left free: that is where the way back is.
 */
export function wallSlots(room: Room, count: number, width = PANEL_SIZE.work.width): WallSlot[] {
  const sides = ['north', 'west', 'east'] as const
  return sides.flatMap((side, index) =>
    spread(
      room,
      side,
      Math.floor(count / sides.length) + (index < count % sides.length ? 1 : 0),
      width,
    ),
  )
}

/** Where the portals of the hub stand: most of them along the north wall, the others on the sides. */
export function portalSlots(room: Room, count: number): WallSlot[] {
  const north = Math.ceil(count / 2)
  const west = Math.ceil((count - north) / 2)
  return [
    ...spread(room, 'north', north, PANEL_SIZE.portal.width),
    ...spread(room, 'west', west, PANEL_SIZE.portal.width),
    ...spread(room, 'east', count - north - west, PANEL_SIZE.portal.width),
  ]
}

/** Every object of the world, placed from the site content. */
export function buildInteractables(content: WorldContent): Interactable[] {
  const items: Interactable[] = []
  const hub = roomById(HUB)

  items.push({
    id: 'about:hub',
    kind: 'about',
    refId: 'hub',
    room: HUB,
    position: { x: 0, z: 0 },
    rotationY: 0,
    stand: { x: 0, z: STAND_DISTANCE },
  })

  const destinations = DESTINATIONS.filter((id) => id !== 'cv' || content.cvLanguages.length > 0)
  portalSlots(hub, destinations.length).forEach((slot, index) => {
    items.push({
      id: `portal:${HUB}>${destinations[index]}`,
      kind: 'portal',
      refId: destinations[index],
      room: HUB,
      ...slot,
    })
  })

  const place = (room: RoomId, kind: InteractableKind, ids: string[]) => {
    const slots = wallSlots(roomById(room), ids.length, PANEL_SIZE[kind].width)
    ids.forEach((refId, index) => {
      items.push({ id: `${kind}:${refId}`, kind, refId, room, ...slots[index] })
    })
  }
  place('work', 'work', content.projectIds)
  place('stack', 'stack', content.stackGroupIds)
  place('certifications', 'certification', content.certificationIds)
  place('cv', 'cv', content.cvLanguages)
  place('contact', 'contact', ['contact'])

  // The way back to the hub, on the south wall of every other room.
  for (const target of destinations) {
    items.push({
      id: `portal:${target}>${HUB}`,
      kind: 'portal',
      refId: HUB,
      room: target,
      ...slotOnWall(roomById(target), 'south', 0),
    })
  }

  return items
}

export function itemsInRoom(items: readonly Interactable[], room: RoomId): Interactable[] {
  return items.filter((item) => item.room === room)
}

/** The closest object whose stand point is within reach, if any. */
export function nearestInteractable(
  point: Vec2,
  items: readonly Interactable[],
  radius = INTERACT_RADIUS,
): Interactable | null {
  let best: Interactable | null = null
  let bestDistance = radius
  for (const item of items) {
    const distance = Math.hypot(point.x - item.stand.x, point.z - item.stand.z)
    if (distance <= bestDistance) {
      best = item
      bestDistance = distance
    }
  }
  return best
}

export interface Spawn {
  position: Vec2
  /** The camera yaw, looking into the room. */
  yaw: number
}

/** The first spot of the visit: the hub, with the portals in front. */
export const START_SPAWN: Spawn = { position: START_POSITION, yaw: 0 }

/**
 * Where the player appears after going through a portal: in front of the
 * portal that leads back to where they came from, looking into the room.
 */
export function spawnAfterPortal(items: readonly Interactable[], from: RoomId, to: RoomId): Spawn {
  // Coming from a room that is not linked to this one (the room list jumps
  // anywhere), the way back to the hub is the closest thing to an entrance.
  const portalIn = (target: RoomId) =>
    items.find((item) => item.kind === 'portal' && item.room === to && item.refId === target)
  const back = portalIn(from) ?? portalIn(HUB)
  if (!back) return START_SPAWN
  const position = {
    x: back.position.x + Math.sin(back.rotationY) * SPAWN_DISTANCE,
    z: back.position.z + Math.cos(back.rotationY) * SPAWN_DISTANCE,
  }
  return { position, yaw: yawToward(position, { x: 0, z: 0 }) }
}
