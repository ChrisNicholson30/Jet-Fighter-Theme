//! Proof corpus — Rust.
//! Exercises: lifetimes, attributes, macros, traits, generics, match, `self`.

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

#[derive(Default)]
pub struct Airframe<'a> {
    pub callsign: &'a str,
    pub thrust: f64,
    telemetry: HashMap<String, f64>,
}

impl<'a> Airframe<'a> {
    pub fn new(callsign: &'a str) -> Self {
        Self { callsign, thrust: 0.82, telemetry: HashMap::new() }
    }

    pub fn climb(&mut self, feet: u32) -> Result<u32, String> {
        if feet > CEILING_FT {
            return Err(format!("{} exceeds ceiling {CEILING_FT}", feet));
        }
        self.telemetry.insert("alt".into(), f64::from(feet));
        Ok(feet)
    }
}

impl Display for Mode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { write!(f, "{}", self.label()) }
}
