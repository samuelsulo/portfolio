import type { Vec2 } from './world'

export interface Input {
  /** Called when the player asks to use the object next to them (E or Enter). */
  onInteract: (() => void) | null
  /** Walking intent: `x` to the right, `z` forward, each from -1 to 1. */
  movement(): Vec2
  running(): boolean
  /** The camera turn since the last call: `x` around the player, `z` up and down (radians). */
  consumeOrbit(): Vec2
  /** The camera distance change since the last call. */
  consumeZoom(): number
  setEnabled(enabled: boolean): void
  dispose(): void
}

interface InputOptions {
  canvas: HTMLElement
  joystick: HTMLElement
  /** Called when the mouse is captured (the camera follows it without a button) or released. */
  onLockChange?: (locked: boolean) => void
}

const ORBIT_SPEED = 0.005
const LOOK_SPEED = 0.0025
const PINCH_SPEED = 0.03
const WHEEL_SPEED = 0.01
const KEYS_THAT_SCROLL = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'])

/** Keyboard, mouse, trackpad and touch, all reduced to a few numbers the loop reads. */
export function createInput({ canvas, joystick, onLockChange }: InputOptions): Input {
  const keys = new Set<string>()
  let enabled = true
  let orbitX = 0
  let orbitZ = 0
  let zoom = 0
  const stick = { x: 0, z: 0 }

  function isTyping(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLElement &&
      (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
    )
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!enabled || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
    if (KEYS_THAT_SCROLL.has(event.code)) event.preventDefault()
    if (event.repeat) return
    const onControl =
      event.target instanceof HTMLElement && ['BUTTON', 'A'].includes(event.target.tagName)
    if (event.code === 'KeyE' || (event.code === 'Enter' && !onControl)) {
      handle.onInteract?.()
      return
    }
    keys.add(event.code)
  }

  function onKeyUp(event: KeyboardEvent) {
    keys.delete(event.code)
  }

  function onBlur() {
    keys.clear()
  }

  // --- Dragging the canvas turns the camera (mouse, trackpad and finger) ---
  const pointers = new Map<number, Vec2>()
  let pinchDistance = 0

  function pinch(): number {
    const [a, b] = [...pointers.values()]
    return Math.hypot(a.x - b.x, a.z - b.z)
  }

  // --- With a mouse or a trackpad the camera follows the pointer, captured by a click ---
  function isLocked(): boolean {
    return document.pointerLockElement === canvas
  }

  function onLockChanged() {
    onLockChange?.(isLocked())
  }

  function onMouseMove(event: MouseEvent) {
    if (!isLocked() || !enabled) return
    orbitX += event.movementX * LOOK_SPEED
    orbitZ += event.movementY * LOOK_SPEED
  }

  /** Captures the mouse. Browsers refuse it for a moment after Escape, in which case dragging still works. */
  function lockPointer(): boolean {
    if (typeof canvas.requestPointerLock !== 'function') return false
    try {
      const request = canvas.requestPointerLock() as Promise<void> | undefined
      request?.catch(() => undefined)
    } catch {
      return false
    }
    return true
  }

  function onPointerDown(event: PointerEvent) {
    if (!enabled) return
    if (event.pointerType === 'mouse' && lockPointer()) return
    canvas.setPointerCapture(event.pointerId)
    pointers.set(event.pointerId, { x: event.clientX, z: event.clientY })
    if (pointers.size === 2) pinchDistance = pinch()
  }

  function onPointerMove(event: PointerEvent) {
    const previous = pointers.get(event.pointerId)
    if (!previous || !enabled) return
    const current = { x: event.clientX, z: event.clientY }
    pointers.set(event.pointerId, current)
    if (pointers.size === 2) {
      const next = pinch()
      zoom -= (next - pinchDistance) * PINCH_SPEED
      pinchDistance = next
      return
    }
    orbitX += (current.x - previous.x) * ORBIT_SPEED
    orbitZ += (current.z - previous.z) * ORBIT_SPEED
  }

  function onPointerUp(event: PointerEvent) {
    pointers.delete(event.pointerId)
    if (pointers.size === 2) pinchDistance = pinch()
  }

  // A pinch on a trackpad arrives as a wheel event with ctrlKey set. A plain
  // scroll is left alone so the page can still be scrolled down to the footer.
  function onWheel(event: WheelEvent) {
    if (!event.ctrlKey || !enabled) return
    event.preventDefault()
    zoom += event.deltaY * WHEEL_SPEED
  }

  // --- The on-screen joystick ---
  const knob = joystick.firstElementChild as HTMLElement | null
  let stickPointer: number | null = null

  function moveStick(event: PointerEvent) {
    const rect = joystick.getBoundingClientRect()
    const radius = rect.width / 2
    let dx = (event.clientX - (rect.left + radius)) / radius
    let dz = (event.clientY - (rect.top + radius)) / radius
    const length = Math.hypot(dx, dz)
    if (length > 1) {
      dx /= length
      dz /= length
    }
    // Pushing up walks forward.
    stick.x = dx
    stick.z = -dz
    if (knob) knob.style.transform = `translate(${dx * radius * 0.6}px, ${dz * radius * 0.6}px)`
  }

  function releaseStick() {
    stickPointer = null
    stick.x = 0
    stick.z = 0
    if (knob) knob.style.transform = ''
  }

  function onStickDown(event: PointerEvent) {
    if (!enabled) return
    stickPointer = event.pointerId
    joystick.setPointerCapture(event.pointerId)
    moveStick(event)
  }

  function onStickMove(event: PointerEvent) {
    if (event.pointerId === stickPointer) moveStick(event)
  }

  function onStickUp(event: PointerEvent) {
    if (event.pointerId === stickPointer) releaseStick()
  }

  document.addEventListener('pointerlockchange', onLockChanged)
  document.addEventListener('mousemove', onMouseMove)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  canvas.addEventListener('wheel', onWheel, { passive: false })
  joystick.addEventListener('pointerdown', onStickDown)
  joystick.addEventListener('pointermove', onStickMove)
  joystick.addEventListener('pointerup', onStickUp)
  joystick.addEventListener('pointercancel', onStickUp)

  const handle: Input = {
    onInteract: null,
    movement() {
      const pressed = (...codes: string[]) => codes.some((code) => keys.has(code))
      const x = (pressed('ArrowRight', 'KeyD') ? 1 : 0) - (pressed('ArrowLeft', 'KeyA') ? 1 : 0)
      const z = (pressed('ArrowUp', 'KeyW') ? 1 : 0) - (pressed('ArrowDown', 'KeyS') ? 1 : 0)
      return { x: x + stick.x, z: z + stick.z }
    },
    running: () => keys.has('ShiftLeft') || keys.has('ShiftRight'),
    consumeOrbit() {
      const orbit = { x: orbitX, z: orbitZ }
      orbitX = 0
      orbitZ = 0
      return orbit
    },
    consumeZoom() {
      const value = zoom
      zoom = 0
      return value
    },
    setEnabled(next) {
      enabled = next
      if (!next) {
        // The cursor is needed for the panels and the menus.
        if (isLocked()) document.exitPointerLock()
        keys.clear()
        releaseStick()
        pointers.clear()
      }
    },
    dispose() {
      if (isLocked()) document.exitPointerLock()
      document.removeEventListener('pointerlockchange', onLockChanged)
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
      joystick.removeEventListener('pointerdown', onStickDown)
      joystick.removeEventListener('pointermove', onStickMove)
      joystick.removeEventListener('pointerup', onStickUp)
      joystick.removeEventListener('pointercancel', onStickUp)
    },
  }
  return handle
}
