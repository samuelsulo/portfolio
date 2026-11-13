import { describe, expect, it } from 'vitest'
import { GRAVITY, JUMP_SPEED, startJump, stepJump, type JumpState } from '../../src/scene3d/dances'

const floor: JumpState = { height: 0, speed: 0 }

function simulate(state: JumpState, seconds: number, dt = 1 / 60, ground = 0) {
  let peak = 0
  for (let t = 0; t < seconds; t += dt) {
    state = stepJump(state, dt, ground)
    peak = Math.max(peak, state.height)
  }
  return { state, peak }
}

describe('jump', () => {
  it('stays on the floor until it is asked for', () => {
    expect(stepJump(floor, 0.1)).toEqual(floor)
  })

  it('reaches the expected height and lands', () => {
    const { state, peak } = simulate(startJump(floor), 2, 1 / 2000)
    expect(peak).toBeCloseTo(JUMP_SPEED ** 2 / (2 * GRAVITY), 1)
    expect(state).toEqual(floor)
  })

  it('cannot be started again in mid air', () => {
    const rising = stepJump(startJump(floor), 0.1)
    expect(startJump(rising)).toBe(rising)
  })

  it('is high enough to climb onto a rack', () => {
    expect(JUMP_SPEED ** 2 / (2 * GRAVITY)).toBeGreaterThan(2.1)
  })

  it('lands on a prop under it and stays there', () => {
    const { state } = simulate(startJump(floor), 2, 1 / 60, 1.2)
    expect(state).toEqual({ height: 1.2, speed: 0 })
  })

  it('falls when what it stands on is gone, and can jump again from a prop', () => {
    const standing: JumpState = { height: 2, speed: 0 }
    expect(startJump(standing, 2).speed).toBe(JUMP_SPEED)
    expect(simulate(standing, 2).state).toEqual(floor)
    expect(startJump(standing, 0)).toBe(standing)
  })
})
