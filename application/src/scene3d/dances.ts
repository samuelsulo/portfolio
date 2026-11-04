/**
 * The poses of the stickman, as plain numbers so they can be tested without
 * three.js. All angles are in radians and "raw": a positive `x` swings a limb
 * backwards, a positive `z` swings it towards +x (so for the right arm it is
 * "out" and for the left arm "across"), a positive elbow bends the forearm
 * forward and a positive knee bends the shin backward.
 */

export interface LimbPose {
  x: number
  z: number
  /** The elbow or the knee. */
  bend: number
}

export interface Pose {
  /** How high the whole figure is lifted, in metres. */
  lift: number
  /** A turn of the whole figure around the vertical axis. */
  spin: number
  /** The upper body: leaning forward (`tiltX`) or sideways (`tiltZ`) and twisting. */
  tiltX: number
  tiltZ: number
  twist: number
  /** The hips sliding sideways, in metres. */
  shiftX: number
  headNod: number
  headTilt: number
  headTwist: number
  armLeft: LimbPose
  armRight: LimbPose
  legLeft: LimbPose
  legRight: LimbPose
}

export const DANCE_IDS = [
  'floss',
  'disco',
  'robot',
  'wave',
  'jacks',
  'spin',
  'headbang',
  'coding',
] as const
export type DanceId = (typeof DANCE_IDS)[number]

const limb = (x = 0, z = 0, bend = 0): LimbPose => ({ x, z, bend })

export function restPose(): Pose {
  return {
    lift: 0,
    spin: 0,
    tiltX: 0,
    tiltZ: 0,
    twist: 0,
    shiftX: 0,
    headNod: 0,
    headTilt: 0,
    headTwist: 0,
    armLeft: limb(),
    armRight: limb(),
    legLeft: limb(),
    legRight: limb(),
  }
}

/** Walking: the legs swing, the arms swing the other way and the body bobs. `amount` is 0 at rest and 1 at a walk. */
export function walkPose(phase: number, amount: number): Pose {
  const swing = Math.sin(phase) * 0.75 * amount
  const pose = restPose()
  pose.lift = Math.abs(Math.cos(phase)) * 0.05 * amount
  pose.legLeft = limb(swing, 0, Math.max(0, -swing) * 0.9)
  pose.legRight = limb(-swing, 0, Math.max(0, swing) * 0.9)
  pose.armLeft = limb(-swing, 0, 0.25 * amount)
  pose.armRight = limb(swing, 0, 0.25 * amount)
  return pose
}

/** Jump physics (metres and seconds). The apex is JUMP_SPEED^2 / (2 * GRAVITY), about 2.25 m: enough to climb onto a rack. */
export const JUMP_SPEED = 10.4
export const GRAVITY = 24

export interface JumpState {
  /** Height of the feet above the floor. */
  height: number
  /** Vertical speed, positive going up. */
  speed: number
}

/** Starts a jump, only when standing (on the floor or on a prop at `ground`): pressing the key in mid air does nothing. */
export function startJump(state: JumpState, ground = 0): JumpState {
  return state.height > ground || state.speed !== 0
    ? state
    : { height: state.height, speed: JUMP_SPEED }
}

/**
 * Moves a jump forward by `dt` seconds. `ground` is the height of what is under the feet: the
 * figure lands on it, and falls when it is no longer there (walking off the edge of a prop).
 */
export function stepJump(state: JumpState, dt: number, ground = 0): JumpState {
  if (state.height <= ground && state.speed <= 0) return { height: ground, speed: 0 }
  const speed = state.speed - GRAVITY * dt
  const height = state.height + speed * dt
  return height <= ground && speed <= 0 ? { height: ground, speed: 0 } : { height, speed }
}

/** In the air: the arms go up and the knees are tucked, more so while going up. */
export function jumpPose(speed: number): Pose {
  const pose = restPose()
  const rise = Math.max(-1, Math.min(1, speed / JUMP_SPEED))
  const tuck = 0.35 + 0.35 * Math.max(0, rise)
  pose.legLeft = limb(-0.3 * tuck, 0, tuck * 1.2)
  pose.legRight = limb(0.2 * tuck, 0, tuck * 0.8)
  pose.armLeft = limb(0, 0.5 + 0.9 * Math.max(0, rise), 0)
  pose.armRight = limb(0, -(0.5 + 0.9 * Math.max(0, rise)), 0)
  return pose
}

const mix = (from: number, to: number, amount: number) => from + (to - from) * amount

type Dance = (t: number) => Pose

const DANCES: Record<DanceId, Dance> = {
  // The arms swing across the body while the hips go the other way.
  floss(t) {
    const p = Math.sin(t * 7)
    const pose = restPose()
    pose.shiftX = -0.14 * p
    pose.tiltZ = -0.12 * p
    pose.armLeft = limb(-0.5, 0.9 * p - 0.1, 0.2)
    pose.armRight = limb(-0.5, 0.9 * p + 0.1, 0.2)
    pose.legLeft = limb(0, 0, 0.25 + 0.2 * Math.max(0, p))
    pose.legRight = limb(0, 0, 0.25 + 0.2 * Math.max(0, -p))
    pose.headTilt = 0.15 * p
    return pose
  },

  // One arm points to the sky and then the other, in time.
  disco(t) {
    const side = Math.tanh(4 * Math.sin(t * 3.5))
    const right = (1 + side) / 2
    const left = 1 - right
    const pose = restPose()
    pose.armRight = limb(-0.3 * right, mix(0.5, 2.6, right), mix(1.5, 0, right))
    pose.armLeft = limb(-0.3 * left, -mix(0.5, 2.6, left), mix(1.5, 0, left))
    pose.tiltZ = 0.12 * side
    pose.shiftX = 0.08 * side
    pose.lift = 0.04 * Math.abs(Math.sin(t * 3.5))
    pose.legRight = limb(0, 0.1, 0.1 + 0.5 * left)
    pose.legLeft = limb(0, -0.1, 0.1 + 0.5 * right)
    pose.headTilt = -0.2 * side
    return pose
  },

  // Stiff and angular: the joints jump from one position to the next.
  robot(t) {
    const step = Math.floor(t * 3.5) % 4
    const pose = restPose()
    pose.armRight = limb(
      -[1.57, 0, 1.57, 0.4][step],
      [0.2, 1.57, 0.2, 0.5][step],
      [1.57, 0, 1.57, 1.57][step],
    )
    pose.armLeft = limb(
      -[0, 1.57, 0.4, 1.57][step],
      -[1.57, 0.2, 0.5, 0.2][step],
      [0, 1.57, 1.57, 0][step],
    )
    pose.headTwist = [0.6, 0, -0.6, 0][step]
    pose.twist = [0.3, 0, -0.3, 0][step]
    pose.legLeft = limb(0, -0.1, 0)
    pose.legRight = limb(0, 0.1, 0)
    return pose
  },

  // A hand in the air, waving at whoever is watching.
  wave(t) {
    const wave = Math.sin(t * 9)
    const pose = restPose()
    pose.armRight = limb(0, 2.5 + 0.25 * wave, 0.5 + 0.5 * wave)
    pose.armLeft = limb(-0.2, -0.45, 1.3)
    pose.tiltZ = 0.06 * Math.sin(t * 3)
    pose.headTilt = 0.15
    pose.legLeft = limb(0, -0.08, 0.05)
    pose.legRight = limb(0, 0.08, 0.05)
    return pose
  },

  // Jumping jacks: arms up and legs apart, then back down.
  jacks(t) {
    const open = (Math.sin(t * 6) + 1) / 2
    const pose = restPose()
    pose.lift = 0.14 * open
    pose.armRight = limb(0, mix(0.15, 3, open), 0)
    pose.armLeft = limb(0, -mix(0.15, 3, open), 0)
    pose.legRight = limb(0, mix(0.04, 0.5, open), 0.1)
    pose.legLeft = limb(0, -mix(0.04, 0.5, open), 0.1)
    return pose
  },

  // A pirouette with the arms out.
  spin(t) {
    const pose = restPose()
    pose.spin = t * 6
    pose.lift = 0.05 + 0.05 * Math.sin(t * 6)
    pose.armRight = limb(0, 1.5 + 0.15 * Math.sin(t * 6), 0)
    pose.armLeft = limb(0, -1.5 - 0.15 * Math.sin(t * 6), 0)
    pose.legLeft = limb(0, -0.1, 0.4)
    pose.legRight = limb(-0.15, 0.1, 0)
    return pose
  },

  // Air guitar and a lot of head.
  headbang(t) {
    const beat = Math.sin(t * 9)
    const pose = restPose()
    pose.headNod = 0.55 * beat
    pose.tiltX = 0.12 * beat
    pose.lift = -0.05 + 0.03 * beat
    pose.armRight = limb(-0.9, 0.1, 1.2 + 0.3 * Math.sin(t * 18))
    pose.armLeft = limb(-0.7, -0.3, 1.7)
    pose.legLeft = limb(0, -0.3, 0.4)
    pose.legRight = limb(0, 0.3, 0.4)
    return pose
  },

  // Typing in the air, looking down at the screen, tapping a foot.
  coding(t) {
    const pose = restPose()
    pose.armLeft = limb(-0.9, -0.15, 1.3 + 0.35 * Math.sin(t * 14))
    pose.armRight = limb(-0.9, 0.15, 1.3 + 0.35 * Math.sin(t * 14 + Math.PI))
    pose.headNod = 0.3
    pose.tiltX = 0.08
    pose.tiltZ = 0.04 * Math.sin(t * 3)
    pose.legRight = limb(-0.1 * Math.max(0, Math.sin(t * 7)), 0.05, 0.1)
    pose.legLeft = limb(0, -0.05, 0.1)
    return pose
  },
}

/** The pose of a dance `time` seconds after it started. */
export function dancePose(id: DanceId, time: number): Pose {
  return DANCES[id](time)
}
