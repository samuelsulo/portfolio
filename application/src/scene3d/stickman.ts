import { CylinderGeometry, Group, Material, Mesh, SphereGeometry } from 'three'
import type { LimbPose, Pose } from './dances'

export interface Stickman {
  root: Group
  /** Puts the figure in a pose (see `dances.ts`). */
  apply(pose: Pose): void
}

const THICKNESS = 0.035
const HIPS = 0.9
const SHOULDERS = 0.52
const UPPER_LEG = 0.45
const UPPER_ARM = 0.32

interface Joint {
  /** Swings from the hip or the shoulder. */
  top: Group
  /** Swings from the knee or the elbow. */
  bend: Group
}

/** A limb of two segments that hangs from its top, so rotating a joint swings what is below it. */
function limb(material: Material, length: number, x: number, y: number): Joint {
  const top = new Group()
  top.position.set(x, y, 0)
  const upper = new CylinderGeometry(THICKNESS, THICKNESS, length, 6)
  upper.translate(0, -length / 2, 0)
  top.add(new Mesh(upper, material))

  const bend = new Group()
  bend.position.y = -length
  const lower = new CylinderGeometry(THICKNESS, THICKNESS, length, 6)
  lower.translate(0, -length / 2, 0)
  bend.add(new Mesh(lower, material))
  top.add(bend)
  return { top, bend }
}

function setLimb(joint: Joint, pose: LimbPose) {
  joint.top.rotation.x = pose.x
  joint.top.rotation.z = pose.z
  joint.bend.rotation.x = pose.bend
}

/** The player: a stickman made of a few primitives, so it costs no download. */
export function createStickman(material: Material): Stickman {
  const root = new Group()
  // Everything hangs from the hips, so that lifting, leaning and twisting pivot there.
  const hips = new Group()
  hips.position.y = HIPS
  root.add(hips)

  const upperBody = new Group()
  hips.add(upperBody)

  const torso = new CylinderGeometry(THICKNESS, THICKNESS, SHOULDERS, 6)
  torso.translate(0, SHOULDERS / 2, 0)
  upperBody.add(new Mesh(torso, material))

  const head = new Group()
  head.position.y = SHOULDERS
  const skull = new Mesh(new SphereGeometry(0.17, 16, 12), material)
  skull.position.y = 0.22
  head.add(skull)
  upperBody.add(head)

  const armLeft = limb(material, UPPER_ARM, -0.2, SHOULDERS - 0.04)
  const armRight = limb(material, UPPER_ARM, 0.2, SHOULDERS - 0.04)
  const legLeft = limb(material, UPPER_LEG, -0.1, 0)
  const legRight = limb(material, UPPER_LEG, 0.1, 0)
  upperBody.add(armLeft.top, armRight.top)
  hips.add(legLeft.top, legRight.top)

  return {
    root,
    apply(pose) {
      hips.position.set(pose.shiftX, HIPS + pose.lift, 0)
      upperBody.rotation.set(pose.tiltX, pose.twist, pose.tiltZ)
      head.rotation.set(pose.headNod, pose.headTwist, pose.headTilt)
      setLimb(armLeft, pose.armLeft)
      setLimb(armRight, pose.armRight)
      setLimb(legLeft, pose.legLeft)
      setLimb(legRight, pose.legRight)
    },
  }
}
