import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Fog,
  Group,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three'
import {
  HUB,
  INTERACT_RADIUS,
  PANEL_SIZE,
  START_SPAWN,
  decorOf,
  groundAt,
  itemsInRoom,
  moveDirection,
  nearestInteractable,
  resolveMove,
  roomById,
  spawnAfterPortal,
  WALL_INSET,
  type Interactable,
  type Room,
  type RoomId,
  type Side,
  type Spawn,
  type Vec2,
} from './world'
import { createPortal, createProp, type Prop, type PropMaterials } from './props'
import {
  CARD_HEIGHT,
  CARD_SCALE,
  CARD_WIDTH,
  drawCard,
  type CardColors,
  type CardSpec,
} from './cards'
import {
  dancePose,
  jumpPose,
  startJump,
  stepJump,
  walkPose,
  type DanceId,
  type JumpState,
} from './dances'
import { createInput } from './input'
import type { PlayerState } from './session'
import { createStickman } from './stickman'

export interface ExplorerOptions {
  canvas: HTMLCanvasElement
  /** Holds the floating labels (HTML, so they are translated and accessible). */
  labelLayer: HTMLElement
  /** The joystick, the pad that is dragged to walk on touch screens. */
  joystick: HTMLElement
  interactables: Interactable[]
  /** Where to put the player instead of the start of the hub, e.g. when coming back to the page. */
  resume?: PlayerState | null
  /** Whether the picture of an object is fetched only when the player comes close to it, to spare what they may never look at. */
  isDeferred?(item: Interactable): boolean
  /** The picture shown on the wall for an object, when it has one (the others show a card). */
  imageFor(item: Interactable): string | null
  onNearby(item: Interactable | null): void
  onRoom(room: RoomId): void
  /** Called when the mouse is captured (the camera follows it) or released. */
  onLook(locked: boolean): void
  /** Called when the figure starts a dance, and with null when it stops. */
  onDance(id: DanceId | null): void
  /** Called when the player appears in another room, to play a transition. */
  onTeleport(): void
  /** Called for every object but the portals, which the explorer handles itself. */
  onInteract(item: Interactable): void
}

export interface Explorer {
  setLabels(labels: Record<string, string>): void
  /** The cards of the objects without a picture, by item id. */
  setCards(cards: Record<string, CardSpec>): void
  /** Triggers the object the player stands next to, same as pressing E. */
  interact(): void
  /** Moves the player to another room, as a portal does. */
  goTo(room: RoomId): void
  /** Makes the figure jump, same as pressing Space (nothing happens in mid air). */
  jump(): void
  /** Makes the figure dance until it is moved or told to stop (null). */
  dance(id: DanceId | null): void
  /** Stops drawing frames (e.g. under a full screen sheet) to save the battery, and starts again. */
  suspend(suspended: boolean): void
  /** Stops reading the keyboard, e.g. while a panel is open. */
  setPaused(paused: boolean): void
  /** Where the player is now, to be given back as `resume`. */
  getState(): PlayerState
  dispose(): void
}

const WALL_HEIGHT = 3.2
const WALL_THICKNESS = 0.3
const WALK_SPEED = 3.4
const RUN_SPEED = 6
const CAMERA_HEIGHT = 1.4
const LABEL_RANGE = 12
/** While the visitor only looks (no input for a few seconds) the scene is drawn at half of 60 frames a second. */
const IDLE_INTERVAL = 1000 / 30
const IDLE_AFTER = 8000
/** How close the player must be for a deferred picture to be fetched. */
const DEFERRED_RANGE = 5

interface Palette {
  background: string
  floor: string
  line: string
  accent: string
  figure: string
  success: string
  surface: string
  muted: string
}

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement)
  const value = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  return {
    background: value('--color-bg', '#05060a'),
    floor: value('--color-bg-alt', '#090b12'),
    line: value('--color-neon-primary', '#35e6ff'),
    accent: value('--color-neon-secondary', '#b24bf3'),
    figure: value('--color-text', '#e9ebf3'),
    success: value('--color-neon-success', '#45f0a6'),
    surface: value('--color-surface', '#10131c'),
    muted: value('--color-text-muted', '#a3a9bd'),
  }
}

/** Draws a thin outline around a geometry, the look of the whole world. */
function outline(geometry: BufferGeometry, material: LineBasicMaterial): LineSegments {
  return new LineSegments(new EdgesGeometry(geometry), material)
}

function loop(points: number[], material: LineBasicMaterial): LineLoop {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3))
  return new LineLoop(geometry, material)
}

const SIDES: Record<Side, Vec2> = {
  north: { x: 0, z: -1 },
  south: { x: 0, z: 1 },
  west: { x: -1, z: 0 },
  east: { x: 1, z: 0 },
}

interface RoomView {
  group: Group
  props: Prop[]
}

export function createExplorer(options: ExplorerOptions): Explorer {
  const { canvas, labelLayer, interactables } = options

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  const renderer = new WebGLRenderer({
    canvas,
    // On a dense screen the lines are already fine, and smoothing them again costs fill rate and battery.
    antialias: pixelRatio < 2,
    alpha: false,
    // The scene is light: on a laptop with two GPUs it does not need the powerful one.
    powerPreference: 'low-power',
  })
  renderer.setPixelRatio(pixelRatio)

  const scene = new Scene()
  scene.add(new AmbientLight(0xffffff, 1))
  const camera = new PerspectiveCamera(60, 1, 0.1, 80)

  // Shared materials: changing the theme only recolors these.
  const palette = readPalette()
  const lineMaterial = new LineBasicMaterial({ color: palette.line })
  const accentMaterial = new LineBasicMaterial({ color: palette.accent })
  const gridMaterial = new LineBasicMaterial({
    color: palette.line,
    transparent: true,
    opacity: 0.12,
  })
  const floorMaterial = new MeshBasicMaterial({ color: palette.floor, side: DoubleSide })
  const wallMaterial = new MeshBasicMaterial({
    color: palette.line,
    transparent: true,
    opacity: 0.07,
    side: DoubleSide,
    depthWrite: false,
  })
  const glowMaterial = new MeshBasicMaterial({ color: palette.accent })
  const glassMaterial = new MeshBasicMaterial({
    color: palette.line,
    transparent: true,
    opacity: 0.2,
    side: DoubleSide,
    depthWrite: false,
  })
  const ledMaterial = new MeshBasicMaterial({ color: palette.success })
  const figureMaterial = new MeshBasicMaterial({ color: palette.figure })
  scene.fog = new Fog(palette.background, 12, 36)

  const materials: PropMaterials = {
    line: lineMaterial,
    accent: accentMaterial,
    glow: glowMaterial,
    glass: glassMaterial,
    led: ledMaterial,
  }

  function applyPalette() {
    const next = readPalette()
    renderer.setClearColor(next.background)
    ;(scene.fog as Fog).color.set(next.background)
    lineMaterial.color.set(next.line)
    gridMaterial.color.set(next.line)
    wallMaterial.color.set(next.line)
    glassMaterial.color.set(next.line)
    accentMaterial.color.set(next.accent)
    glowMaterial.color.set(next.accent)
    floorMaterial.color.set(next.floor)
    ledMaterial.color.set(next.success)
    figureMaterial.color.set(next.figure)
  }
  applyPalette()

  // --- The rooms: each one is built the first time the player enters it ---
  const textures: Texture[] = []
  const loader = new TextureLoader()
  const views = new Map<RoomId, RoomView>()

  /** The textures of each room: those of the rooms that are not on screen are freed from the GPU, see `enter`. */
  const roomTextures = new Map<RoomId, Texture[]>()
  function track(room: RoomId, texture: Texture) {
    textures.push(texture)
    roomTextures.set(room, [...(roomTextures.get(room) ?? []), texture])
  }

  function loadImage(url: string, room: RoomId, onLoad: (texture: Texture) => void) {
    loader.load(url, (texture) => {
      texture.colorSpace = SRGBColorSpace
      track(room, texture)
      onLoad(texture)
    })
  }

  function place(object: Object3D, x: number, y: number, z: number, rotationY: number) {
    object.position.set(x, y, z)
    object.rotation.y = rotationY
  }

  function addShell(room: Room, group: Group) {
    const size = room.half * 2
    const floor = new Mesh(new PlaneGeometry(size, size), floorMaterial)
    floor.rotation.x = -Math.PI / 2
    group.add(floor)

    // A grid on the floor, like the paper of a blueprint.
    const gridPoints: number[] = []
    for (let i = -room.half; i <= room.half; i += 2) {
      gridPoints.push(i, 0.01, -room.half, i, 0.01, room.half)
      gridPoints.push(-room.half, 0.01, i, room.half, 0.01, i)
    }
    const gridGeometry = new BufferGeometry()
    gridGeometry.setAttribute('position', new Float32BufferAttribute(gridPoints, 3))
    group.add(new LineSegments(gridGeometry, gridMaterial))

    // Thin walls whose inner face is where the walkable area ends.
    const inner = room.half - WALL_INSET
    const length = 2 * (inner + WALL_THICKNESS)
    const center = inner + WALL_THICKNESS / 2
    for (const side of Object.keys(SIDES) as Side[]) {
      const offset = SIDES[side]
      const alongX = offset.z !== 0
      const geometry = new BoxGeometry(
        alongX ? length : WALL_THICKNESS,
        WALL_HEIGHT,
        alongX ? WALL_THICKNESS : length,
      )
      const wall = new Mesh(geometry, wallMaterial)
      wall.position.set(offset.x * center, WALL_HEIGHT / 2, offset.z * center)
      const edges = outline(geometry, lineMaterial)
      edges.position.copy(wall.position)
      group.add(wall, edges)
    }

    // Neon strips along the walls.
    for (const [height, material] of [
      [0.12, accentMaterial],
      [WALL_HEIGHT - 0.2, lineMaterial],
    ] as const) {
      group.add(
        loop(
          [
            -inner,
            height,
            -inner,
            inner,
            height,
            -inner,
            inner,
            height,
            inner,
            -inner,
            height,
            inner,
          ],
          material,
        ),
      )
    }
  }

  /** The rings on the floor of the hub, around the pedestal. */
  function addFloorRings(group: Group) {
    for (const [radius, material] of [
      [2.4, accentMaterial],
      [3.3, lineMaterial],
    ] as const) {
      const points: number[] = []
      for (let i = 0; i < 64; i++) {
        const angle = (i / 64) * Math.PI * 2
        points.push(Math.cos(angle) * radius, 0.02, Math.sin(angle) * radius)
      }
      group.add(loop(points, material))
    }
  }

  // --- Pictures and cards on the walls ---
  interface Frame {
    item: Interactable
    canvas: HTMLCanvasElement | null
  }
  const frames = new Map<string, Frame>()
  /** The pictures that wait for the player to come close (see `isDeferred`). */
  const pendingImages: { item: Interactable; show: () => void }[] = []
  let cards: Record<string, CardSpec> = {}

  /** Draws the card of a frame again, e.g. after a language or theme change. */
  function drawFrame(frame: Frame, texture: CanvasTexture) {
    const spec = cards[frame.item.id]
    if (!spec || !frame.canvas) return
    const next = readPalette()
    const colors: CardColors = {
      background: next.surface,
      border: next.line,
      text: next.figure,
      muted: next.muted,
      primary: next.line,
      accent: next.accent,
    }
    void drawCard(frame.canvas, spec, colors).then(() => (texture.needsUpdate = true))
  }

  const cardTextures = new Map<string, CanvasTexture>()
  function redrawCards() {
    for (const [id, texture] of cardTextures) drawFrame(frames.get(id)!, texture)
  }

  /** A framed picture, or a card when the item has none. */
  function addFramed(
    group: Group,
    item: Interactable,
    image: string | null,
    { width, height }: { width: number; height: number },
  ) {
    const holder = new Group()
    place(holder, item.position.x, 1.7, item.position.z, item.rotationY)
    // Out of the wall surface, so the picture is not hidden inside the wall.
    holder.translateZ(0.05)
    holder.add(outline(new BoxGeometry(width + 0.2, height + 0.2, 0.08), accentMaterial))
    const plane = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }),
    )
    plane.position.z = 0.05
    plane.scale.set(width, height, 1)
    holder.add(plane)
    group.add(holder)

    if (image) {
      const show = () =>
        loadImage(image, item.room, (texture) => {
          const material = plane.material as MeshBasicMaterial
          material.map = texture
          material.opacity = 1
          material.needsUpdate = true
          const size = texture.image as { width: number; height: number }
          const aspect = size.width / size.height
          const fitted = Math.min(width / aspect, height)
          plane.scale.set(fitted * aspect, fitted, 1)
        })
      // Some pictures are only worth fetching once the player walks up to them.
      if (options.isDeferred?.(item)) pendingImages.push({ item, show })
      else show()
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = CARD_WIDTH * CARD_SCALE
    canvas.height = CARD_HEIGHT * CARD_SCALE
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    track(item.room, texture)
    const material = plane.material as MeshBasicMaterial
    material.map = texture
    material.opacity = 1
    frames.set(item.id, { item, canvas })
    cardTextures.set(item.id, texture)
    drawFrame(frames.get(item.id)!, texture)
  }

  function buildRoom(id: RoomId): RoomView {
    const room = roomById(id)
    const group = new Group()
    const props: Prop[] = []
    addShell(room, group)
    if (id === HUB) addFloorRings(group)

    const add = (prop: Prop, x: number, y: number, z: number, rotationY: number) => {
      place(prop.object, x, y, z, rotationY)
      props.push(prop)
      group.add(prop.object)
    }

    for (const item of decorOf(id)) {
      add(
        createProp(item.kind, materials),
        item.position.x,
        item.height,
        item.position.z,
        item.rotationY,
      )
    }

    for (const item of itemsInRoom(interactables, id)) {
      const { x, z } = item.position
      if (item.kind === 'about') {
        // The pedestal it stands on is part of the decor of the hub.
        continue
      } else if (item.kind === 'portal') {
        add(createPortal(materials), x, 1.25, z, item.rotationY)
        props[props.length - 1].object.translateZ(0.2)
      } else if (item.kind === 'work') {
        addFramed(group, item, options.imageFor(item), PANEL_SIZE.work)
      } else if (item.kind === 'certification') {
        addFramed(group, item, options.imageFor(item), PANEL_SIZE.certification)
      } else if (item.kind === 'cv') {
        addFramed(group, item, options.imageFor(item), PANEL_SIZE.cv)
      } else {
        // A stack group or the contact details.
        addFramed(group, item, null, PANEL_SIZE[item.kind])
      }
    }

    scene.add(group)
    return { group, props }
  }

  // --- The player ---
  const player = createStickman(figureMaterial)
  scene.add(player.root)
  const position: Vec2 = { ...START_SPAWN.position }
  let heading = Math.PI
  let yaw = START_SPAWN.yaw
  let pitch = 0.45
  let distance = 6.5
  let walkPhase = 0
  let jumping: JumpState = { height: 0, speed: 0 }
  let currentDance: { id: DanceId; start: number } | null = null

  function setDance(id: DanceId | null) {
    currentDance = id ? { id, start: performance.now() / 1000 } : null
    options.onDance(id)
  }
  let paused = false
  let currentRoom: RoomId = HUB
  let nearby: Interactable | null = null
  /** The objects of the room the player is in, kept so that the loop does not filter the list every frame. */
  let roomItems: Interactable[] = []

  function enter(room: RoomId, spawn: Spawn) {
    currentRoom = room
    roomItems = itemsInRoom(interactables, room)
    if (!views.has(room)) views.set(room, buildRoom(room))
    for (const [id, view] of views) view.group.visible = id === room
    // What is not on screen does not need to be in video memory: it is uploaded again if the player comes back.
    for (const [id, list] of roomTextures)
      if (id !== room) list.forEach((texture) => texture.dispose())
    for (const element of labelElements.values()) element.hidden = true
    position.x = spawn.position.x
    position.z = spawn.position.z
    yaw = spawn.yaw
    // The figure looks where the camera does.
    heading = spawn.yaw + Math.PI
    nearby = null
    jumping = { height: 0, speed: 0 }
    if (currentDance) setDance(null)
    options.onNearby(null)
    options.onRoom(room)
  }

  function teleport(room: RoomId) {
    if (room === currentRoom) return
    enter(room, spawnAfterPortal(interactables, currentRoom, room))
    options.onTeleport()
  }

  // --- Labels ---
  const labelElements = new Map<string, HTMLElement>()
  for (const item of interactables) {
    const element = document.createElement('div')
    element.className =
      item.kind === 'portal' ? 'explore__label explore__label--portal' : 'explore__label'
    element.hidden = true
    labelLayer.appendChild(element)
    labelElements.set(item.id, element)
  }

  function setLabels(labels: Record<string, string>) {
    for (const [id, element] of labelElements) element.textContent = labels[id] ?? ''
  }

  const projected = new Vector3()
  /** The last style written to each label: an unchanged one is not written again, which would make the browser restyle it. */
  const labelStyles = new Map<string, string>()
  function updateLabels(width: number, height: number) {
    for (const item of roomItems) {
      const element = labelElements.get(item.id)!
      const distanceToItem = Math.hypot(position.x - item.position.x, position.z - item.position.z)
      projected.set(item.position.x, item.kind === 'portal' ? 2.6 : 2.9, item.position.z)
      projected.project(camera)
      const visible = distanceToItem < LABEL_RANGE && projected.z < 1 && Math.abs(projected.x) < 1.1
      if (element.hidden === visible) element.hidden = !visible
      if (!visible) continue
      const x = Math.round((projected.x * 0.5 + 0.5) * width)
      const y = Math.round((-projected.y * 0.5 + 0.5) * height)
      const opacity = Math.max(0.35, 1 - distanceToItem / LABEL_RANGE).toFixed(2)
      const style = `${x},${y},${opacity}`
      if (labelStyles.get(item.id) === style) continue
      labelStyles.set(item.id, style)
      element.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`
      element.style.opacity = opacity
    }
  }

  // --- Input ---
  const input = createInput({ canvas, joystick: options.joystick, onLockChange: options.onLook })

  function interact() {
    if (!nearby) return
    if (nearby.kind === 'portal') teleport(nearby.refId as RoomId)
    else options.onInteract(nearby)
  }

  input.onInteract = () => {
    if (!paused) interact()
  }

  // --- Sizing, theme and the loop ---
  let width = 1
  let height = 1
  function resize() {
    const rect = canvas.parentElement!.getBoundingClientRect()
    width = Math.max(1, Math.floor(rect.width))
    height = Math.max(1, Math.floor(rect.height))
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  resize()
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas.parentElement!)

  function onThemeChange() {
    applyPalette()
    redrawCards()
  }
  const themeObserver = new MutationObserver(onThemeChange)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
  const colorScheme = window.matchMedia('(prefers-color-scheme: light)')
  colorScheme.addEventListener('change', onThemeChange)

  if (options.resume) {
    const { room, x, z, yaw: savedYaw, pitch: savedPitch, distance: savedDistance } = options.resume
    pitch = savedPitch
    distance = savedDistance
    enter(room, { position: { x, z }, yaw: savedYaw })
  } else {
    enter(HUB, START_SPAWN)
  }

  const target = new Vector3()
  let frame = 0
  let last = performance.now()
  let lastActivity = performance.now()

  function tick(now: number) {
    frame = requestAnimationFrame(tick)
    // While the visitor plays, one frame for every refresh of the screen (120 or 144Hz included).
    const idle = now - lastActivity > IDLE_AFTER && !currentDance
    if (idle && now - last < IDLE_INTERVAL - 1) return
    // A long pause (hidden tab) must not become one huge step.
    const dt = Math.min((now - last) / 1000, 0.1)
    last = now

    const orbit = input.consumeOrbit()
    if (orbit.x !== 0 || orbit.z !== 0) lastActivity = now
    yaw -= orbit.x
    pitch = Math.min(1.2, Math.max(0.1, pitch + orbit.z))
    distance = Math.min(9, Math.max(3, distance + input.consumeZoom()))

    // The feet at the start of the frame decide what is in the way and what is stood on.
    const feet = jumping.height
    if (!paused && input.consumeJump()) {
      const started = startJump(jumping, groundAt(position, currentRoom, feet))
      if (started !== jumping) {
        jumping = started
        lastActivity = now
        if (currentDance) setDance(null)
      }
    }

    const move = paused ? { x: 0, z: 0 } : input.movement()
    const direction = moveDirection(move, yaw)
    const strength = Math.min(1, Math.hypot(direction.x, direction.z))
    const walking = strength > 0.05
    let speed = 0
    if (walking) {
      lastActivity = now
      speed = (input.running() ? RUN_SPEED : WALK_SPEED) * strength
      const next = resolveMove(
        position,
        {
          x: position.x + (direction.x / strength) * speed * dt,
          z: position.z + (direction.z / strength) * speed * dt,
        },
        currentRoom,
        undefined,
        feet,
      )
      position.x = next.x
      position.z = next.z

      // Turn the figure towards where it walks, along the shortest way.
      const wanted = Math.atan2(direction.x, direction.z)
      const delta = Math.atan2(Math.sin(wanted - heading), Math.cos(wanted - heading))
      heading += delta * Math.min(1, dt * 12)
      walkPhase += dt * speed * 2.2
      // Walking away ends the dance.
      if (currentDance) setDance(null)
    }

    // Vertical step after the move: the figure lands on, or falls off, whatever is now under it.
    jumping = stepJump(jumping, dt, groundAt(position, currentRoom, feet))
    const airborne = jumping.height > groundAt(position, currentRoom, jumping.height)

    if (airborne) {
      player.apply(jumpPose(jumping.speed))
      player.root.rotation.y = heading
    } else if (walking) {
      player.apply(walkPose(walkPhase, Math.min(1, speed / WALK_SPEED)))
      player.root.rotation.y = heading
    } else if (currentDance) {
      const pose = dancePose(currentDance.id, now / 1000 - currentDance.start)
      player.apply(pose)
      player.root.rotation.y = heading + pose.spin
    } else {
      player.apply(walkPose(walkPhase, 0))
      player.root.rotation.y = heading
    }
    player.root.position.set(position.x, jumping.height, position.z)

    for (let index = pendingImages.length - 1; index >= 0; index--) {
      const { item, show } = pendingImages[index]
      const reach = Math.hypot(position.x - item.position.x, position.z - item.position.z)
      if (item.room === currentRoom && reach < DEFERRED_RANGE) {
        pendingImages.splice(index, 1)
        show()
      }
    }

    const time = now / 1000
    views.get(currentRoom)?.props.forEach((prop) => prop.update?.(time))

    // Third person camera, orbiting around the figure's chest. The walls are
    // see-through, so it can sit outside the room.
    target.set(position.x, CAMERA_HEIGHT + jumping.height, position.z)
    camera.position.set(
      target.x + Math.sin(yaw) * Math.cos(pitch) * distance,
      target.y + Math.sin(pitch) * distance,
      target.z + Math.cos(yaw) * Math.cos(pitch) * distance,
    )
    camera.lookAt(target)

    const closest = paused ? null : nearestInteractable(position, roomItems, INTERACT_RADIUS)
    if (closest?.id !== nearby?.id) {
      nearby = closest
      options.onNearby(nearby)
    }

    renderer.render(scene, camera)
    updateLabels(width, height)
  }

  // The loop runs only while there is something to see: not in a hidden tab, not under a full screen
  // sheet, and not when the page is scrolled so that the canvas is out of view.
  let suspended = false
  let onScreen = true
  function refreshLoop() {
    const shouldRun = !suspended && onScreen && !document.hidden
    if (shouldRun && !frame) {
      last = performance.now()
      lastActivity = last
      frame = requestAnimationFrame(tick)
    } else if (!shouldRun && frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }
  }
  document.addEventListener('visibilitychange', refreshLoop)
  const visibilityObserver =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entries) => {
          onScreen = entries.some((entry) => entry.isIntersecting)
          refreshLoop()
        })
  visibilityObserver?.observe(canvas)
  refreshLoop()

  function dispose() {
    suspended = true
    refreshLoop()
    document.removeEventListener('visibilitychange', refreshLoop)
    visibilityObserver?.disconnect()
    resizeObserver.disconnect()
    themeObserver.disconnect()
    colorScheme.removeEventListener('change', onThemeChange)
    input.dispose()
    for (const element of labelElements.values()) element.remove()
    scene.traverse((object: Object3D) => {
      const mesh = object as Mesh
      mesh.geometry?.dispose()
      const material = mesh.material as Material | Material[] | undefined
      if (Array.isArray(material)) material.forEach((item) => item.dispose())
      else material?.dispose()
    })
    textures.forEach((texture) => texture.dispose())
    renderer.dispose()
    renderer.forceContextLoss()
  }

  return {
    setLabels,
    setCards(next) {
      cards = next
      redrawCards()
    },
    interact,
    goTo: teleport,
    jump: () => input.jump(),
    dance: setDance,
    suspend(next) {
      if (next === suspended) return
      suspended = next
      refreshLoop()
    },
    getState: () => ({ room: currentRoom, x: position.x, z: position.z, yaw, pitch, distance }),
    setPaused(next) {
      paused = next
      input.setEnabled(!next)
    },
    dispose,
  }
}
