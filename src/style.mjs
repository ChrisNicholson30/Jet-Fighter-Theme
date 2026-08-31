/**
 * Jet Fighter — style builder.
 *
 * One function maps a variant palette to the complete Zed style object. Every
 * variant runs through this single code path, which is what guarantees they
 * cannot drift apart in key coverage: if a key is populated for one variant it
 * is populated for all of them, and a `null` is impossible by construction.
 *
 * Key inventory is 185 UI keys, taken from the Zed source rather than from
 * One Dark — see `data/zed-keys.json`. One Dark itself populates only 139 of
 * them, so "diff against One Dark" (the obvious coverage check) silently
 * misses the vim mode indicators, the minimap, indent guides, diff hunks and
 * the debugger accent.
 */

import { alpha, mix, opaque, bestOn } from './color.mjs';

export function buildStyle(v) {
  // ---------------------------------------------------------------------
  // Local shorthands.
  // ---------------------------------------------------------------------
  const ed = v.background;      // editor ground — the darkest (or lightest) plane
  const sf = v.surface;         // chrome: panels, tab bar, status bar, title bar
  const pn = v.panel;           // elevated surfaces
  const mu = v.muted;           // borders and rules. Never text.
  const tx = v.text;            // body text
  const bright = v.textRamp.bright;
  const R = v.textRamp;

  /** Fill strength. Stealth pulls every large translucent fill down (brief §6 rule 4). */
  const F = v.fillScale ?? 1;
  const fill = (hex, a) => alpha(hex, Math.min(1, a * F));

  /** Text ramp, expressed as alpha over whatever surface the text lands on. */
  const txMuted = alpha(tx, R.muted);
  const txPlaceholder = alpha(tx, R.placeholder);
  const txDisabled = alpha(tx, R.disabled);

  /** More emphasis / less emphasis, in the direction this variant's ground runs. */
  const emphasise = (c, t) => mix(c, v.poles.fg, t);
  const recede = (c, t) => mix(c, v.poles.bg, t);

  // ---------------------------------------------------------------------
  // Terminal ANSI. 24 keys, every one distinct — asserted by the gate.
  //
  // `bright` moves a hue toward the variant's light pole and `dim` toward its
  // dark pole, so the emphasis ordering dim < normal < bright holds in every
  // variant rather than only on a dark ground.
  // ---------------------------------------------------------------------
  const ansiBright = (c) => emphasise(c, 0.72);
  // 0.75 is the shallowest dim step that keeps every hue above the recessive
  // floor while still reading as clearly dimmer than normal (dE 16 or better).
  const ansiDim = (c) => recede(c, 0.75);

  const ansi = (name, hue) => ({
    [`terminal.ansi.${name}`]: opaque(hue),
    [`terminal.ansi.bright_${name}`]: opaque(ansiBright(hue)),
    [`terminal.ansi.dim_${name}`]: opaque(ansiDim(hue)),
  });

  /**
   * Which hue fills each ANSI slot. The default is the variant's own roles,
   * which is right for every build whose roles sit on the hues their slots are
   * named after — all three core variants.
   *
   * A special variant that reassigns roles must not drag the terminal with it.
   * ANSI is a compatibility surface, not a design surface: programs assume
   * `blue` is blue, and a theme that ships a gold `terminal.ansi.blue` because
   * gold happens to be its primary breaks every tool that colours its own
   * output — and the breakage looks like the tool's fault, not the theme's.
   * Such a variant supplies `ansiHues` and the six slots keep their names.
   */
  const hues = v.ansiHues ?? {
    red: v.danger,
    green: v.go,
    yellow: v.caution,
    blue: v.primary,
    magenta: v.accent,
    cyan: v.type,
  };

  // ---------------------------------------------------------------------
  // Vim / Helix mode annunciators.
  //
  // Eighteen keys that no bundled Zed theme populates. Treated here as cockpit
  // mode lights: an illuminated chip per mode, each a distinct hue, with the
  // chip's label colour chosen automatically as whichever of the variant's two
  // neutral poles contrasts better against that chip. The gate then checks the
  // pair it picked, so the label is never the wrong side of legible.
  // ---------------------------------------------------------------------
  const chipLabel = (chip) => bestOn(chip, [v.poles.bg, v.poles.fg]);
  const mode = (name, chip) => ({
    [`vim.${name}.background`]: opaque(chip),
    [`vim.${name}.foreground`]: opaque(chipLabel(chip)),
  });

  /**
   * The neutral-state signal: information, a rename, and the annunciator for the
   * mode where nothing is happening. Defaults to the primary, which is what
   * every core build wants — a cool accent doubling as the "nothing is wrong"
   * hue, and the reason the two have never needed separating.
   *
   * They are two jobs, though, and a variant whose primary is red cannot let one
   * colour do both. `info` beside `error` and `version_control.renamed` beside
   * `.deleted` would each be two reds telling the reader opposite things. Worse,
   * `NORMAL` beside `REPLACE`: the annunciator exists to be read at a glance,
   * and `REPLACE` means you are overwriting. In a build where everything else is
   * red, the red lamp has to be reserved for the mode that earns it.
   */
  const signal = v.signal ?? v.primary;

  const status = (name, hex) => ({
    [name]: opaque(hex),
    [`${name}.background`]: fill(hex, 0.16),
    [`${name}.border`]: fill(hex, 0.48),
  });

  return {
    // -------------------------------------------------------------------
    // Window
    // -------------------------------------------------------------------
    'background.appearance': 'opaque',

    // -------------------------------------------------------------------
    // Borders
    // -------------------------------------------------------------------
    border: opaque(mu),
    'border.variant': opaque(recede(mu, 0.62)),
    'border.focused': opaque(v.secondary), // secondary is a field colour, not a text colour
    'border.selected': fill(v.primary, 0.62),
    'border.transparent': '#00000000',
    'border.disabled': opaque(recede(mu, 0.52)),

    // -------------------------------------------------------------------
    // Surfaces
    // -------------------------------------------------------------------
    background: opaque(sf),
    'surface.background': opaque(sf),
    'elevated_surface.background': opaque(pn),

    // -------------------------------------------------------------------
    // Elements. Hover and active run a faint primary wash rather than a
    // neutral one, so interactive chrome reads as lit rather than merely
    // lighter.
    // -------------------------------------------------------------------
    'element.background': opaque(mix(pn, sf, 0.6)),
    'element.hover': fill(v.primary, 0.1),
    'element.active': fill(v.primary, 0.16),
    'element.selected': fill(v.secondary, 0.34),
    'element.disabled': opaque(mix(pn, sf, 0.38)),
    'element.selection_background': fill(v.secondary, 0.34),
    'drop_target.background': fill(v.primary, 0.2),
    'drop_target.border': fill(v.primary, 0.6),

    'ghost_element.background': '#00000000',
    'ghost_element.hover': fill(v.primary, 0.08),
    'ghost_element.active': fill(v.primary, 0.14),
    'ghost_element.selected': fill(v.secondary, 0.26),
    'ghost_element.disabled': fill(pn, 0.35),

    // -------------------------------------------------------------------
    // Text and icons
    // -------------------------------------------------------------------
    text: opaque(tx),
    'text.muted': txMuted,
    'text.placeholder': txPlaceholder,
    'text.disabled': txDisabled,
    'text.accent': opaque(v.primary),

    icon: opaque(tx),
    'icon.muted': txMuted,
    'icon.disabled': txDisabled,
    'icon.placeholder': txPlaceholder,
    'icon.accent': opaque(v.primary),

    'debugger.accent': opaque(v.danger),

    // -------------------------------------------------------------------
    // Chrome: title bar, tabs, toolbar, status bar
    //
    // The active tab takes the editor ground rather than the elevated panel
    // colour, so the tab opens into the buffer instead of floating above it.
    // This is the one place the build departs from the brief's §4 role table,
    // and it matches how every bundled Zed theme handles the active tab.
    // -------------------------------------------------------------------
    'status_bar.background': opaque(sf),
    'title_bar.background': opaque(sf),
    'title_bar.inactive_background': opaque(mix(sf, ed, 0.55)),
    'toolbar.background': opaque(ed),
    'tab_bar.background': opaque(sf),
    'tab.inactive_background': opaque(sf),
    'tab.active_background': opaque(ed),

    'search.match_background': fill(v.secondary, 0.42),
    'search.active_match_background': fill(v.caution, 0.45),

    // -------------------------------------------------------------------
    // Panels and panes. `panel.focused_border` and `pane.focused_border` are
    // null in One Dark; both are populated here.
    // -------------------------------------------------------------------
    'panel.background': opaque(sf),
    'panel.focused_border': opaque(v.primary),
    'panel.indent_guide': fill(tx, 0.1),
    'panel.indent_guide_hover': fill(v.primary, 0.45),
    'panel.indent_guide_active': fill(v.primary, 0.75),
    'panel.overlay_background': alpha(sf, 0.92),
    'panel.overlay_hover': alpha(pn, 0.92),
    'pane.focused_border': opaque(v.primary),
    'pane_group.border': opaque(mu),

    // -------------------------------------------------------------------
    // Scrollbar and minimap. The whole minimap group is absent from One Dark.
    // -------------------------------------------------------------------
    'scrollbar.thumb.background': fill(tx, 0.14),
    'scrollbar.thumb.hover_background': fill(tx, 0.24),
    'scrollbar.thumb.active_background': fill(tx, 0.34),
    'scrollbar.thumb.border': fill(mu, 0.6),
    'scrollbar.track.background': '#00000000',
    'scrollbar.track.border': opaque(recede(mu, 0.55)),

    'minimap.thumb.background': fill(tx, 0.1),
    'minimap.thumb.hover_background': fill(tx, 0.16),
    'minimap.thumb.active_background': fill(tx, 0.22),
    'minimap.thumb.border': fill(mu, 0.5),

    // -------------------------------------------------------------------
    // Editor
    // -------------------------------------------------------------------
    'editor.foreground': opaque(tx),
    'editor.background': opaque(ed),
    'editor.gutter.background': opaque(ed),
    'editor.subheader.background': opaque(sf),
    'editor.active_line.background': fill(pn, v.activeLineAlpha),
    'editor.highlighted_line.background': fill(v.primary, 0.14),
    'editor.debugger_active_line.background': fill(v.caution, 0.2),
    'editor.line_number': alpha(tx, v.lineNumberAlpha),
    'editor.active_line_number': opaque(v.primary), // the current line reads lit
    'editor.hover_line_number': alpha(tx, 0.66),
    'editor.invisible': alpha(tx, v.invisibleAlpha),
    'editor.wrap_guide': fill(mu, 0.5),
    'editor.active_wrap_guide': fill(mu, 0.9),
    'editor.indent_guide': fill(tx, 0.09),
    'editor.indent_guide_active': fill(v.primary, 0.45),
    'editor.document_highlight.read_background': fill(v.primary, 0.16),
    'editor.document_highlight.write_background': fill(v.accent, 0.22),
    'editor.document_highlight.bracket_background': fill(v.type, 0.26),

    // Diff hunks — six keys, none of which exist in One Dark.
    'editor.diff_hunk.added.background': fill(v.go, 0.18),
    'editor.diff_hunk.added.hollow_background': fill(v.go, 0.08),
    'editor.diff_hunk.added.hollow_border': fill(v.go, 0.55),
    'editor.diff_hunk.deleted.background': fill(v.danger, 0.18),
    'editor.diff_hunk.deleted.hollow_background': fill(v.danger, 0.08),
    'editor.diff_hunk.deleted.hollow_border': fill(v.danger, 0.55),

    // -------------------------------------------------------------------
    // Terminal
    // -------------------------------------------------------------------
    'terminal.background': opaque(ed),
    'terminal.foreground': opaque(tx),
    'terminal.ansi.background': opaque(ed),
    'terminal.bright_foreground': opaque(bright),
    'terminal.dim_foreground': alpha(tx, 0.6),

    // Black and white poles are built from the variant's own neutrals so the
    // six values stay distinct. One Light ships `black` and `bright_black`
    // both as #000000; nothing here doubles up.
    'terminal.ansi.black': opaque(v.ansiBlack),
    // `bright_black` is the one place the dim < normal < bright emphasis rule
    // does not apply: universally it is the grey terminals use for dimmed
    // prompts and secondary output, so it is lighter than black on every
    // ground. Programs assume that; a darker "bright black" would break them.
    'terminal.ansi.bright_black': opaque(v.comment),
    'terminal.ansi.dim_black': opaque(recede(v.ansiBlack, 0.52)),
    'terminal.ansi.white': opaque(v.ansiWhite),
    'terminal.ansi.bright_white': opaque(emphasise(v.ansiWhite, 0.55)),
    'terminal.ansi.dim_white': opaque(recede(v.ansiWhite, 0.55)),

    ...ansi('red', hues.red),
    ...ansi('green', hues.green),
    ...ansi('yellow', hues.yellow),
    ...ansi('blue', hues.blue),
    ...ansi('magenta', hues.magenta),
    ...ansi('cyan', hues.cyan),

    // -------------------------------------------------------------------
    // Links
    // -------------------------------------------------------------------
    'link_text.hover': opaque(v.primary),

    // -------------------------------------------------------------------
    // Version control. Added / deleted / modified / conflict never share a
    // hue — checked by the gate, not by eye.
    // -------------------------------------------------------------------
    'version_control.added': opaque(v.go),
    'version_control.deleted': opaque(v.danger),
    'version_control.modified': opaque(v.caution),
    'version_control.renamed': opaque(signal),
    'version_control.conflict': opaque(v.conflictColor),
    'version_control.ignored': alpha(v.comment, 0.86),
    'version_control.word_added': fill(v.go, 0.3),
    'version_control.word_deleted': fill(v.danger, 0.3),
    'version_control.conflict_marker.ours': fill(v.go, 0.18),
    'version_control.conflict_marker.theirs': fill(v.primary, 0.18),

    // -------------------------------------------------------------------
    // Vim and Helix mode annunciators
    // -------------------------------------------------------------------
    ...mode('normal', signal),           // cruise — nothing is happening
    ...mode('insert', v.go),             // cleared to write
    ...mode('replace', v.danger),        // armed — you are overwriting
    ...mode('visual', v.accent),
    ...mode('visual_line', v.secondary),
    ...mode('visual_block', v.type),
    ...mode('helix_normal', v.caution),
    ...mode('helix_select', v.number),
    'vim.yank.background': fill(v.caution, 0.3),
    'vim.helix_jump_label.foreground': opaque(v.danger),

    // -------------------------------------------------------------------
    // Status colours
    // -------------------------------------------------------------------
    ...status('error', v.danger),
    ...status('warning', v.caution),
    ...status('success', v.go),
    ...status('info', signal),
    ...status('hint', v.comment),
    ...status('created', v.go),
    ...status('deleted', v.danger),
    ...status('modified', v.caution),
    ...status('renamed', signal),
    ...status('conflict', v.conflictColor),
    ...status('predictive', v.comment),
    ...status('ignored', v.comment),
    ...status('hidden', v.comment),
    ...status('unreachable', v.comment),

    // `ignored`, `hidden` and `unreachable` are deliberately recessive: they
    // mark things the reader is meant to skip over. They keep the comment hue
    // but sit below it in emphasis.
    ignored: alpha(v.comment, 0.86),
    hidden: alpha(v.comment, 0.86),
    unreachable: alpha(v.comment, 0.8),
    predictive: opaque(v.predictiveText),
  };
}

/**
 * Collaborator colours. Eight, mutually distinguishable, each with a matching
 * cursor / background / selection.
 *
 * Ordering matters: players are handed out in join order, so the near-siblings
 * in the palette (sky-400 / sky-300, violet / purple, amber / orange) are
 * spaced as far apart in the sequence as the palette allows.
 */
export function buildPlayers(v) {
  const order = [
    v.signatureCursor ?? v.primary, // Stealth runs a magenta primary cursor
    v.secondary,
    v.go,
    v.caution,
    v.danger,
    v.type,
    v.signatureCursor ? v.string : v.accent,
    v.number,
  ];
  return order.map((c) => ({
    cursor: opaque(c),
    background: opaque(c),
    selection: alpha(c, 0.24),
  }));
}

/**
 * `accents` colours the indent guides when `indent_guides.coloring` is set to
 * `indent_aware`. One Dark leaves the array empty and Zed falls back to its
 * own built-in ramp, which has nothing to do with the active theme. Populating
 * it keeps indent colouring inside the palette.
 */
export function buildAccents(v) {
  return [v.primary, v.accent, v.go, v.caution, v.type, v.secondary, v.danger, v.number, v.string]
    .map((c) => alpha(c, 0.55));
}
