import { ROOMS, isWalkable, type RoomId } from './world'

/** Where the player is and how the camera is turned, kept while the visitor looks at a page and comes back. */
export interface PlayerState {
  room: RoomId
  x: number
  z: number
  yaw: number
  pitch: number
  distance: number
}

const STORAGE_KEY = 'samuelsulo-portfolio:3d-player'

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/** The state, if it is complete and still makes sense (the rooms may have changed since it was saved). */
export function parsePlayerState(raw: unknown): PlayerState | null {
  if (typeof raw !== 'object' || raw === null) return null
  const value = raw as Record<string, unknown>
  const { room, x, z, yaw, pitch, distance } = value
  if (!ROOMS.some((entry) => entry.id === room)) return null
  if (![x, z, yaw, pitch, distance].every(isNumber)) return null
  if (!isWalkable({ x: x as number, z: z as number }, room as RoomId)) return null
  return {
    room: room as RoomId,
    x: x as number,
    z: z as number,
    yaw: yaw as number,
    pitch: pitch as number,
    distance: distance as number,
  }
}

export function loadPlayerState(): PlayerState | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return stored ? parsePlayerState(JSON.parse(stored)) : null
  } catch {
    // Storage can be unavailable (private mode) or hold something else: start from the hub.
    return null
  }
}

export function savePlayerState(state: PlayerState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Not remembering the spot is fine.
  }
}
