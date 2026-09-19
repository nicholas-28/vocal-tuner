import { vi } from 'vitest';

export type ParamEvent = Readonly<{
  method: 'set' | 'hold' | 'cancel' | 'ramp';
  value: number;
  time: number;
}>;

export class TestPadAudioParam {
  value = 0;
  readonly events: ParamEvent[] = [];

  cancelAndHoldAtTime = vi.fn((time: number) => {
    this.events.push({ method: 'hold', value: this.value, time });
  });

  cancelScheduledValues = vi.fn((time: number) => {
    this.events.push({ method: 'cancel', value: this.value, time });
  });

  setValueAtTime = vi.fn((value: number, time: number) => {
    this.value = value;
    this.events.push({ method: 'set', value, time });
  });

  linearRampToValueAtTime = vi.fn((value: number, time: number) => {
    this.value = value;
    this.events.push({ method: 'ramp', value, time });
  });
}

export class TestPadAudioNode {
  readonly connect = vi.fn((target: TestPadAudioNode) => {
    this.context.connections.push(`${this.name}->${target.name}`);
    return target;
  });

  readonly disconnect = vi.fn();

  constructor(
    readonly context: TestPadAudioContext,
    readonly name: string,
  ) {}
}

export class TestPadGainNode extends TestPadAudioNode {
  readonly gain = new TestPadAudioParam();
}

export class TestPadBiquadFilterNode extends TestPadAudioNode {
  type: BiquadFilterType = 'lowpass';
  readonly frequency = new TestPadAudioParam();
  readonly Q = new TestPadAudioParam();
}

export class TestPadOscillatorNode extends TestPadAudioNode {
  type: OscillatorType = 'sine';
  readonly frequency = new TestPadAudioParam();
  readonly start = vi.fn((time?: number) => {
    this.context.events.push(`${this.name}:start@${time ?? 'now'}`);
  });
  readonly stop = vi.fn((time?: number) => {
    this.context.events.push(`${this.name}:stop@${time ?? 'now'}`);
  });
}

type ResumeMode = 'running' | 'deferred' | 'stays-suspended' | 'reject';

export class TestPadAudioContext {
  static instances: TestPadAudioContext[] = [];
  static nextState: AudioContextState = 'running';
  static nextResumeMode: ResumeMode = 'running';

  state: AudioContextState;
  currentTime = 10;
  readonly destination = new TestPadAudioNode(this, 'destination');
  readonly gains: TestPadGainNode[] = [];
  readonly oscillators: TestPadOscillatorNode[] = [];
  readonly filters: TestPadBiquadFilterNode[] = [];
  readonly connections: string[] = [];
  readonly events: string[] = [];
  readonly resumeMode: ResumeMode;
  resolveResume: () => void = () => undefined;
  rejectResume: () => void = () => undefined;

  constructor() {
    this.state = TestPadAudioContext.nextState;
    this.resumeMode = TestPadAudioContext.nextResumeMode;
    this.events.push('context:construct');
    TestPadAudioContext.instances.push(this);
  }

  readonly createGain = vi.fn(() => {
    const gain = new TestPadGainNode(this, `gain-${this.gains.length}`);
    this.gains.push(gain);
    this.events.push(`${gain.name}:create`);
    return gain as unknown as GainNode;
  });

  readonly createOscillator = vi.fn(() => {
    const oscillator = new TestPadOscillatorNode(
      this,
      `oscillator-${this.oscillators.length}`,
    );
    this.oscillators.push(oscillator);
    this.events.push(`${oscillator.name}:create`);
    return oscillator as unknown as OscillatorNode;
  });

  readonly createBiquadFilter = vi.fn(() => {
    const filter = new TestPadBiquadFilterNode(
      this,
      `filter-${this.filters.length}`,
    );
    this.filters.push(filter);
    this.events.push(`${filter.name}:create`);
    return filter as unknown as BiquadFilterNode;
  });

  readonly resume = vi.fn(() => {
    this.events.push('context:resume');
    if (this.resumeMode === 'reject') {
      return Promise.reject(new Error('resume rejected'));
    }
    if (this.resumeMode === 'deferred') {
      return new Promise<void>((resolve, reject) => {
        this.resolveResume = () => {
          this.state = 'running';
          resolve();
        };
        this.rejectResume = () => reject(new Error('resume rejected'));
      });
    }
    if (this.resumeMode === 'running') this.state = 'running';
    return Promise.resolve();
  });

  readonly close = vi.fn(async () => {
    this.events.push('context:close');
    this.state = 'closed';
  });

  static reset() {
    TestPadAudioContext.instances = [];
    TestPadAudioContext.nextState = 'running';
    TestPadAudioContext.nextResumeMode = 'running';
  }
}

export const selectTestPadContext = () =>
  TestPadAudioContext as unknown as new () => AudioContext;
