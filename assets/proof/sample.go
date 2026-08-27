// Proof corpus — Go.
// Exercises: struct tags, interfaces, goroutines, channels, error handling,
// builtin types, method receivers.
package airframe

import (
	"context"
	"errors"
	"fmt"
	"regexp"
)

const CeilingFt = 65_000

var callsignRe = regexp.MustCompile(`^[A-Z]{2}-\d{3}$`)

var ErrNoCallsign = errors.New("airframe: no callsign")

type Mode int

const (
	Normal Mode = iota
	Insert
	Visual
)

func (m Mode) String() string {
	switch m {
	case Normal:
		return "NORMAL"
	case Insert:
		return "INSERT"
	default:
		return "VISUAL"
	}
}

type Annunciator interface {
	Label() string
	Lit() bool
}

type Airframe struct {
	Callsign  string             `json:"callsign"`
	Thrust    float64            `json:"thrust,omitempty"`
	Telemetry map[string]float64 `json:"-"`
}

func New(ctx context.Context, callsign string) (*Airframe, error) {
	if !callsignRe.MatchString(callsign) {
		return nil, fmt.Errorf("%w: %q", ErrNoCallsign, callsign)
	}
	return &Airframe{Callsign: callsign, Thrust: 0.82, Telemetry: map[string]float64{}}, nil
}
