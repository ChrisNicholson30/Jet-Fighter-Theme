/**
 * Code shown in the editor demo. Short enough to sit in a viewport, dense
 * enough that every major token class appears at least once — keywords,
 * types, functions, strings, numbers, properties, comments, and the italic
 * classes the theme uses as its second axis.
 */

export const SAMPLES = [
  {
    id: 'ts',
    label: 'TypeScript',
    file: 'airframe.ts',
    code: `/** Telemetry for a single airframe. */
import { readFile } from 'node:fs/promises';
import type { Result } from './result';

export enum Mode { Normal = 'normal', Insert = 'insert' }

const CALLSIGN = /^[A-Z]{2}-\\d{3}$/u;
const CEILING_FT = 65_000;

@sealed
export class Fighter {
  static readonly ceiling = CEILING_FT;
  #armed = false;

  constructor(public readonly callsign: string, public thrust = 0.82) {
    if (!CALLSIGN.test(callsign)) {
      throw new TypeError(\`bad callsign: \${callsign}\`);
    }
  }

  get armed(): boolean { return this.#armed; }

  async load(path: string): Promise<Result<Fighter, Error>> {
    const raw = await readFile(path, 'utf8');
    return { ok: true, value: JSON.parse(raw) };
  }
}`,
  },
  {
    id: 'rust',
    label: 'Rust',
    file: 'airframe.rs',
    code: `//! Mode annunciators for the cockpit HUD.

use std::collections::HashMap;
use std::fmt::{self, Display};

const CEILING_FT: u32 = 65_000;

#[derive(Debug, Clone, PartialEq)]
pub enum Mode { Normal, Insert, Visual { lines: bool } }

pub trait Annunciator {
    fn label(&self) -> &'static str;
    fn lit(&self) -> bool { true }
}

impl Annunciator for Mode {
    fn label(&self) -> &'static str {
        match self {
            Mode::Normal => "NORMAL",
            Mode::Insert => "INSERT",
            Mode::Visual { lines: true } => "V-LINE",
            Mode::Visual { .. } => "VISUAL",
        }
    }
}

impl<'a> Airframe<'a> {
    pub fn climb(&mut self, feet: u32) -> Result<u32, String> {
        if feet > CEILING_FT {
            return Err(format!("{feet} exceeds {CEILING_FT}"));
        }
        self.telemetry.insert("alt".into(), f64::from(feet));
        Ok(feet)
    }
}`,
  },
  {
    id: 'python',
    label: 'Python',
    file: 'airframe.py',
    code: `"""Airframe telemetry.

Doc comments read brighter than ordinary comments here — they are
meant to be read.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from enum import Enum
from functools import cached_property

CALLSIGN = re.compile(r"^[A-Z]{2}-\\d{3}$")
CEILING_FT: int = 65_000


class Mode(str, Enum):
    NORMAL = "normal"
    INSERT = "insert"


@dataclass(slots=True)
class Airframe:
    callsign: str
    thrust: float = 0.82
    telemetry: dict[str, float] = field(default_factory=dict)

    def __post_init__(self) -> None:
        # Parameters render italic; builtins do too.
        if not CALLSIGN.match(self.callsign):
            raise ValueError(f"bad callsign: {self.callsign!r}")

    @cached_property
    def modes(self) -> tuple[Mode, ...]:
        return tuple(m for m in Mode)`,
  },
  {
    id: 'go',
    label: 'Go',
    file: 'airframe.go',
    code: `// Package airframe models a single aircraft.
package airframe

import (
	"context"
	"errors"
	"fmt"
	"regexp"
)

const CeilingFt = 65_000

var callsignRe = regexp.MustCompile(\`^[A-Z]{2}-\\d{3}$\`)

var ErrNoCallsign = errors.New("airframe: no callsign")

type Mode int

const (
	Normal Mode = iota
	Insert
	Visual
)

type Airframe struct {
	Callsign  string             \`json:"callsign"\`
	Thrust    float64            \`json:"thrust,omitempty"\`
	Telemetry map[string]float64 \`json:"-"\`
}

func New(ctx context.Context, callsign string) (*Airframe, error) {
	if !callsignRe.MatchString(callsign) {
		return nil, fmt.Errorf("%w: %q", ErrNoCallsign, callsign)
	}
	return &Airframe{Callsign: callsign, Thrust: 0.82}, nil
}`,
  },
  {
    id: 'json',
    label: 'JSON',
    file: 'telemetry.json',
    code: `{
  "$schema": "https://zed.dev/schema/themes/v0.2.0.json",
  "callsign": "JF-001",
  "ceiling_ft": 65000,
  "thrust": 0.82,
  "armed": false,
  "modes": ["normal", "insert", "visual"],
  "telemetry": {
    "alt": null,
    "mach": 1.6,
    "heading": -180
  }
}`,
  },
];

export const DIFF_SAMPLE = `diff --git a/src/airframe.rs b/src/airframe.rs
index 8f2c1a4..b7e0d39 100644
--- a/src/airframe.rs
+++ b/src/airframe.rs
@@ -12,9 +12,11 @@ pub struct Airframe<'a> {
     pub callsign: &'a str,
-    pub thrust: f32,
+    pub thrust: f64,
+    telemetry: HashMap<String, f64>,
 }
 
 impl<'a> Airframe<'a> {
     pub fn new(callsign: &'a str) -> Self {
-        Self { callsign, thrust: 0.8 }
+        Self { callsign, thrust: 0.82, telemetry: HashMap::new() }
     }
 }`;

/** A terminal session, rendered with the theme's own ANSI colours. */
export const TERMINAL_SESSION = [
  { ansi: 'green', text: '~/jet-fighter' },
  { ansi: 'bright_black', text: ' on ' },
  { ansi: 'magenta', text: 'main' },
  { text: '\n' },
  { ansi: 'blue', text: '❯' },
  { text: ' npm test\n' },
  { ansi: 'bright_black', text: '\n> jet-fighter-zed@0.1.0 test\n\n' },
  { ansi: 'green', text: 'PASS' },
  { text: '  every key populated, no nulls, no duplicates\n' },
  { ansi: 'green', text: 'PASS' },
  { text: '  every token clears its floor on every surface\n' },
  { ansi: 'yellow', text: 'self-test' },
  { text: '  gate rejects syntax.keyword at ' },
  { ansi: 'red', text: '#7C3AED' },
  { text: ' (3.37:1)\n' },
  { ansi: 'green', text: 'PASS' },
  { text: '  every colour traces to the locked swatch\n' },
  { ansi: 'green', text: 'PASS' },
  { text: '  Stealth holds at ' },
  { ansi: 'cyan', text: '0.71×' },
  { text: ' Afterburner\n\n' },
  { ansi: 'blue', text: '❯' },
  { ansi: 'bright_black', text: ' ▊' },
];
