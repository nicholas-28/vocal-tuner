import { vi } from 'vitest';

class TestAudioParam {
  value = 0;
  cancelAndHoldAtTime() {}
  cancelScheduledValues() {}
  setValueAtTime(value: number) {
    this.value = value;
  }
  linearRampToValueAtTime(value: number) {
    this.value = value;
  }
  setTargetAtTime(value: number) {
    this.value = value;
  }
}

class TestAudioNode {
  disconnected = false;

  constructor(
    readonly context: TestReferenceDroneAudioContext,
    readonly name: string,
  ) {}

  connect(target: TestAudioNode) {
    this.context.connections.push(`${this.name}->${target.name}`);
    return target;
  }

  disconnect() {
    this.disconnected = true;
  }
}

class TestGainNode extends TestAudioNode {
  gain = new TestAudioParam();
}

class TestOscillatorNode extends TestAudioNode {
  type: OscillatorType = 'sine';
  frequency = new TestAudioParam();
  onended: (() => void) | null = null;
  started = false;

  start() {
    this.started = true;
  }

  stop() {
    queueMicrotask(() => this.onended?.());
  }
}

export class TestReferenceDroneAudioContext extends EventTarget {
  static instances: TestReferenceDroneAudioContext[] = [];
  state: AudioContextState = 'running';
  currentTime = 0;
  destination = new TestAudioNode(this, 'destination');
  gains: TestGainNode[] = [];
  oscillators: TestOscillatorNode[] = [];
  connections: string[] = [];

  constructor() {
    super();
    TestReferenceDroneAudioContext.instances.push(this);
  }

  createGain() {
    const gain = new TestGainNode(this, `gain-${this.gains.length}`);
    this.gains.push(gain);
    return gain;
  }

  createOscillator() {
    const oscillator = new TestOscillatorNode(
      this,
      `oscillator-${this.oscillators.length}`,
    );
    this.oscillators.push(oscillator);
    return oscillator;
  }

  async resume() {
    this.state = 'running';
    this.dispatchEvent(new Event('statechange'));
  }

  async close() {
    this.state = 'closed';
    this.dispatchEvent(new Event('statechange'));
  }
}

export function installReferenceDroneAudioMock() {
  TestReferenceDroneAudioContext.instances = [];
  vi.stubGlobal('AudioContext', TestReferenceDroneAudioContext);
}
