/**
 * Proof corpus — TypeScript.
 * Exercises: doc comment, decorator, generic, enum, template literal,
 * regex, JSX-adjacent property access, async/await, optional chaining.
 */
import { readFile } from 'node:fs/promises';
import type { Result } from './result';

export enum Mode { Normal = 'normal', Insert = 'insert', Visual = 'visual' }

const CALLSIGN = /^[A-Z]{2}-\d{3}$/u;
const DEFAULT_THRUST = 0.82;

interface Airframe<T extends string = string> {
  readonly callsign: T;
  thrust: number;
  modes?: ReadonlyArray<Mode>;
}

@sealed
export class Fighter implements Airframe {
  static readonly ceiling = 65_000;
  #armed = false;

  constructor(public readonly callsign: string, public thrust = DEFAULT_THRUST) {
    if (!CALLSIGN.test(callsign)) throw new TypeError(`bad callsign: ${callsign}`);
  }

  get armed(): boolean { return this.#armed; }

  async load(path: string): Promise<Result<Airframe, Error>> {
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw) as Partial<Airframe>;
    return parsed?.callsign
      ? { ok: true, value: { ...parsed, thrust: parsed.thrust ?? DEFAULT_THRUST } as Airframe }
      : { ok: false, error: new Error('no callsign') };
  }
}

function sealed(target: Function): void { Object.seal(target.prototype); }
