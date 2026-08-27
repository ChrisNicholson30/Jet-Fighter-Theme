"""Proof corpus — Python.

Exercises: decorators, f-strings, type hints, dunder methods, comprehensions,
keyword arguments, `self`, builtins.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from enum import Enum
from functools import cached_property

CALLSIGN = re.compile(r"^[A-Z]{2}-\d{3}$")
CEILING_FT: int = 65_000


class Mode(str, Enum):
    NORMAL = "normal"
    INSERT = "insert"
    VISUAL = "visual"


@dataclass(slots=True)
class Airframe:
    callsign: str
    thrust: float = 0.82
    telemetry: dict[str, float] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not CALLSIGN.match(self.callsign):
            raise ValueError(f"bad callsign: {self.callsign!r}")

    @cached_property
    def modes(self) -> tuple[Mode, ...]:
        return tuple(m for m in Mode if m is not Mode.VISUAL)

    def climb(self, feet: int, *, strict: bool = True) -> int:
        if strict and feet > CEILING_FT:
            raise OverflowError(f"{feet} exceeds ceiling {CEILING_FT}")
        self.telemetry["alt"] = float(feet)
        return feet
