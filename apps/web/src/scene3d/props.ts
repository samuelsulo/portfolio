import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  CylinderGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three'
import type { DecorKind } from './world'

/** The few materials every prop is made of, shared so that a theme change recolors them all at once. */
export interface PropMaterials {
  /** Outlines, in the primary neon. */
  line: LineBasicMaterial
  /** Outlines, in the secondary neon. */
  accent: LineBasicMaterial
  /** Solid parts that glow, in the secondary neon. */
  glow: MeshBasicMaterial
  /** A see-through panel in the primary neon. */
  glass: MeshBasicMaterial
  /** The blinking lights. */
  led: MeshBasicMaterial
}

export interface Prop {
  object: Object3D
  /** Animates the prop; `time` is in seconds. */
  update?(time: number): void
}

function outline(geometry: BufferGeometry, material: LineBasicMaterial): LineSegments {
  return new LineSegments(new EdgesGeometry(geometry), material)
}

function box(
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
  material: LineBasicMaterial,
): LineSegments {
  const result = outline(new BoxGeometry(width, height, depth), material)
  result.position.set(x, y, z)
  return result
}

type BoxSpec = [width: number, height: number, depth: number, x: number, y: number, z: number]

/**
 * The outlines of several boxes as one object: a single draw call instead of one for each,
 * which is what keeps a room of racks, desks and containers cheap on a phone.
 */
function mergedBoxes(specs: BoxSpec[], material: LineBasicMaterial): LineSegments {
  const positions: number[] = []
  for (const [width, height, depth, x, y, z] of specs) {
    const box = new BoxGeometry(width, height, depth)
    const edges = new EdgesGeometry(box)
    const array = edges.getAttribute('position').array
    for (let i = 0; i < array.length; i += 3) {
      positions.push(array[i] + x, array[i + 1] + y, array[i + 2] + z)
    }
    box.dispose()
    edges.dispose()
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return new LineSegments(geometry, material)
}

const UP = new Vector3(0, 1, 0)

/** A thin neon tube along a path, thick enough to read as a light rather than a hairline. */
export function tube(points: Vector3[], radius: number, material: MeshBasicMaterial): Group {
  const group = new Group()
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i]
    const to = points[i + 1]
    const direction = to.clone().sub(from)
    const segment = new Mesh(new CylinderGeometry(radius, radius, direction.length(), 6), material)
    segment.position.copy(from).add(to).multiplyScalar(0.5)
    segment.quaternion.setFromUnitVectors(UP, direction.normalize())
    group.add(segment)
  }
  return group
}

// --- The props ---

function rack(m: PropMaterials): Prop {
  const object = new Group()
  const slabs: BoxSpec[] = []
  const lights: [number, number][] = []
  for (let i = 0; i < 6; i++) {
    const y = 0.3 + i * 0.3
    slabs.push([0.8, 0.22, 0.04, 0, y, 0.36])
    for (const x of [-0.3, -0.18]) lights.push([x, y])
  }
  object.add(mergedBoxes([[0.9, 2, 0.7, 0, 1, 0]], m.line), mergedBoxes(slabs, m.accent))

  // All the blinking lights of the rack are one object, each an instance that is shown or hidden.
  const leds = new InstancedMesh(new BoxGeometry(0.07, 0.07, 0.04), m.led, lights.length)
  leds.frustumCulled = false
  const dummy = new Object3D()
  const shown: boolean[] = []
  object.add(leds)
  return {
    object,
    update(time) {
      let changed = false
      lights.forEach(([x, y], index) => {
        const on = Math.sin(time * 3 + index * 1.7) > -0.2
        if (shown[index] === on) return
        shown[index] = on
        dummy.position.set(x, y, 0.39)
        dummy.scale.setScalar(on ? 1 : 0)
        dummy.updateMatrix()
        leds.setMatrixAt(index, dummy.matrix)
        changed = true
      })
      if (changed) leds.instanceMatrix.needsUpdate = true
    },
  }
}
function cloud(m: PropMaterials): Prop {
  const object = new Group()
  const puffs: [number, number, number, number][] = [
    [-0.7, 0, 0, 0.45],
    [0, 0.2, 0, 0.65],
    [0.75, 0, 0, 0.5],
    [0.2, -0.05, 0.35, 0.4],
  ]
  // The four puffs are one object (they move together).
  const positions: number[] = []
  for (const [x, y, z, radius] of puffs) {
    const sphere = new IcosahedronGeometry(radius, 1)
    const edges = new EdgesGeometry(sphere)
    const array = edges.getAttribute('position').array
    for (let i = 0; i < array.length; i += 3) {
      positions.push(array[i] + x, array[i + 1] * 0.75 + y, array[i + 2] + z)
    }
    sphere.dispose()
    edges.dispose()
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  object.add(new LineSegments(geometry, m.line))
  return {
    object,
    update(time) {
      object.position.y = Math.sin(time * 0.9) * 0.1
      object.rotation.y = time * 0.15
    },
  }
}
function cubes(m: PropMaterials): Prop {
  const object = new Group()
  const blocks = [
    outline(new BoxGeometry(0.6, 0.6, 0.6), m.line),
    outline(new BoxGeometry(0.45, 0.45, 0.45), m.accent),
    outline(new BoxGeometry(0.3, 0.3, 0.3), m.line),
  ]
  blocks[0].position.set(0, 0, 0)
  blocks[1].position.set(0.8, 0.3, 0)
  blocks[2].position.set(-0.7, -0.25, 0.2)
  object.add(...blocks)
  return {
    object,
    update(time) {
      blocks.forEach((block, index) => {
        block.rotation.y = time * (0.4 + index * 0.15)
        block.rotation.x = time * 0.2
      })
      object.position.y = Math.sin(time * 0.8) * 0.12
    },
  }
}

function database(m: PropMaterials): Prop {
  const object = new Group()
  const positions: number[] = []
  for (let i = 0; i < 3; i++) {
    const disc = new CylinderGeometry(0.55, 0.55, 0.36, 16)
    const edges = new EdgesGeometry(disc)
    const array = edges.getAttribute('position').array
    for (let j = 0; j < array.length; j += 3) {
      positions.push(array[j], array[j + 1] + 0.2 + i * 0.5, array[j + 2])
    }
    disc.dispose()
    edges.dispose()
    const ring = new Mesh(new TorusGeometry(0.55, 0.02, 6, 24), m.glow)
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.2 + i * 0.5 + 0.19
    object.add(ring)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  object.add(new LineSegments(geometry, m.line))
  return { object }
}
function desk(m: PropMaterials): Prop {
  const object = new Group()
  object.add(
    mergedBoxes(
      [
        [2, 0.06, 0.9, 0, 0.75, 0],
        [0.06, 0.75, 0.8, -0.9, 0.375, 0],
        [0.06, 0.75, 0.8, 0.9, 0.375, 0],
        [0.6, 0.03, 0.2, 0, 0.8, 0.25],
      ],
      m.line,
    ),
    // The monitor and the keyboard face +z, the way the desk is turned.
    mergedBoxes([[1, 0.6, 0.05, 0, 1.2, -0.15]], m.accent),
  )
  const screen = new Mesh(new PlaneGeometry(0.92, 0.52), m.glass)
  screen.position.set(0, 1.2, -0.12)
  object.add(screen)
  const code = new Group()
  for (let i = 0; i < 5; i++) {
    const width = 0.3 + ((i * 37) % 5) * 0.1
    const line = new Mesh(new BoxGeometry(width, 0.025, 0.01), m.glow)
    line.position.set(-0.4 + width / 2, 1.38 - i * 0.1, -0.1)
    code.add(line)
  }
  object.add(code)
  return {
    object,
    update(time) {
      code.children.forEach((line, index) => {
        line.visible = Math.sin(time * 1.5 + index * 2.1) > -0.6
      })
    },
  }
}
function globe(m: PropMaterials): Prop {
  const object = new Group()
  const sphere = outline(new IcosahedronGeometry(0.8, 1), m.line)
  const ring = new Mesh(new TorusGeometry(1.05, 0.02, 6, 48), m.glow)
  ring.rotation.x = Math.PI / 2.6
  object.add(sphere, ring)
  return {
    object,
    update(time) {
      sphere.rotation.y = time * 0.5
      ring.rotation.z = time * 0.6
      object.position.y = Math.sin(time * 0.9) * 0.1
    },
  }
}

function containers(m: PropMaterials): Prop {
  const object = new Group()
  const plain: BoxSpec[] = []
  const top: BoxSpec[] = []
  for (const [x, y, z, group] of [
    [-0.65, 0.3, 0, plain],
    [0.65, 0.3, 0, plain],
    [0, 0.9, 0, top],
  ] as const) {
    group.push([1.2, 0.6, 0.6, x, y, z])
    // The ribs of the corrugated side.
    for (let i = -2; i <= 2; i++) group.push([0.02, 0.5, 0.62, x + i * 0.22, y, z])
  }
  object.add(mergedBoxes(plain, m.line), mergedBoxes(top, m.accent))
  return { object }
}
function lock(m: PropMaterials): Prop {
  const object = new Group()
  const base = outline(new CylinderGeometry(0.45, 0.5, 0.6, 12), m.line)
  base.position.y = 0.3
  const body = outline(new BoxGeometry(0.7, 0.5, 0.3), m.accent)
  body.position.y = 0.95
  const shackle = outline(new TorusGeometry(0.22, 0.03, 6, 16, Math.PI), m.accent)
  shackle.position.y = 1.2
  const keyhole = new Mesh(new CircleGeometry(0.06, 12), m.glow)
  keyhole.position.set(0, 0.95, 0.16)
  object.add(base, body, shackle, keyhole)
  return {
    object,
    update(time) {
      object.rotation.y = Math.sin(time * 0.5) * 0.4
    },
  }
}

function branch(m: PropMaterials): Prop {
  const object = new Group()
  const y = 0.03
  const paths: [number, number][][] = [
    [
      [0, -1.6],
      [0, 1.6],
    ],
    [
      [0, -0.6],
      [1.1, 0.2],
      [1.1, 1.6],
    ],
    [
      [0, 0.4],
      [-1, 1.1],
    ],
  ]
  for (const path of paths) {
    object.add(
      tube(
        path.map(([x, z]) => new Vector3(x, y, z)),
        0.03,
        m.glow,
      ),
    )
    for (const [x, z] of path) {
      const node = new Mesh(new CircleGeometry(0.12, 16), m.glow)
      node.rotation.x = -Math.PI / 2
      node.position.set(x, y + 0.01, z)
      object.add(node)
    }
  }
  return { object }
}

function antenna(m: PropMaterials): Prop {
  const object = new Group()
  const base = box(0.8, 0.3, 0.8, 0, 0.15, 0, m.line)
  const mast = outline(new CylinderGeometry(0.05, 0.14, 3, 6), m.line)
  mast.position.y = 1.8
  object.add(base, mast)
  const rings: Mesh[] = []
  for (let i = 0; i < 3; i++) {
    const ring = new Mesh(new TorusGeometry(0.22 + i * 0.16, 0.012, 6, 24), m.glow)
    ring.rotation.x = Math.PI / 2
    ring.position.y = 2.7
    rings.push(ring)
    object.add(ring)
  }
  const tip = new Mesh(new SphereGeometry(0.08, 8, 6), m.led)
  tip.position.y = 3.35
  object.add(tip)
  return {
    object,
    update(time) {
      // Waves leaving the antenna, one ring after the other.
      rings.forEach((ring, index) => {
        const phase = (time * 0.8 + index / 3) % 1
        ring.position.y = 2.7 + phase * 0.5
        ring.scale.setScalar(0.6 + phase)
        ring.visible = phase < 0.9
      })
      tip.visible = Math.sin(time * 4) > 0
    },
  }
}

function brackets(m: PropMaterials): Prop {
  const object = new Group()
  const point = (x: number, y: number) => new Vector3(x, y, 0)
  object.add(tube([point(-0.5, 0.5), point(-1.1, 0), point(-0.5, -0.5)], 0.05, m.glow))
  object.add(tube([point(0.5, 0.5), point(1.1, 0), point(0.5, -0.5)], 0.05, m.glow))
  object.add(tube([point(0.2, 0.55), point(-0.2, -0.55)], 0.05, m.glow))
  return {
    object,
    update(time) {
      object.rotation.y = Math.sin(time * 0.6) * 0.6
      object.position.y = Math.sin(time * 0.9) * 0.1
    },
  }
}

const BUILDERS: Record<DecorKind, (materials: PropMaterials) => Prop> = {
  rack,
  cloud,
  desk,
  cubes,
  database,
  globe,
  containers,
  lock,
  branch,
  antenna,
  brackets,
  pedestal: createPedestal,
}

export function createProp(kind: DecorKind, materials: PropMaterials): Prop {
  return BUILDERS[kind](materials)
}

// --- Things the visitor uses ---

/** The doorway to another room: a glowing frame around a swirling disc. */
export function createPortal(m: PropMaterials): Prop {
  const object = new Group()
  const frame = new Mesh(new TorusGeometry(1, 0.07, 6, 32), m.glow)
  const disc = new Mesh(new CircleGeometry(0.95, 32), m.glass)
  const swirl = new Mesh(new TorusGeometry(0.7, 0.025, 4, 24, Math.PI * 1.4), m.glow)
  const swirlOuter = new Mesh(new TorusGeometry(0.45, 0.02, 4, 20, Math.PI * 1.2), m.glow)
  object.add(frame, disc, swirl, swirlOuter)
  return {
    object,
    update(time) {
      swirl.rotation.z = time * 1.6
      swirlOuter.rotation.z = -time * 2.1
      disc.scale.setScalar(0.96 + Math.sin(time * 2.5) * 0.04)
    },
  }
}

/** The pedestal in the middle of the hub, with the globe that introduces the visitor to the rest. */
export function createPedestal(m: PropMaterials): Prop {
  const object = new Group()
  const column = outline(new CylinderGeometry(0.7, 0.9, 1.1, 12), m.line)
  column.position.y = 0.55
  const ring = new Mesh(new TorusGeometry(0.8, 0.03, 8, 32), m.glow)
  ring.rotation.x = Math.PI / 2
  ring.position.y = 1.15
  const sphere = outline(new IcosahedronGeometry(0.45, 1), m.accent)
  sphere.position.y = 1.75
  object.add(column, ring, sphere)
  return {
    object,
    update(time) {
      sphere.rotation.y = time * 0.7
      sphere.rotation.x = time * 0.3
      sphere.position.y = 1.75 + Math.sin(time * 1.2) * 0.08
      ring.scale.setScalar(1 + Math.sin(time * 2) * 0.04)
    },
  }
}
