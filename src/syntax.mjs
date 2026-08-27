/**
 * Jet Fighter — syntax.
 *
 * Zed resolves a highlight capture by longest dotted prefix: `keyword.control`
 * falls back to `keyword`, `function.method.call` to `function.method` and then
 * to `function` (crates/syntax_theme/src/syntax_theme.rs). So the 47 tokens the
 * bundled themes define are a working floor — but every capture that falls back
 * is a capture rendering in the same colour as its parent.
 *
 * This map defines the 47, and then the sub-captures that actually appear in
 * the grammars Zed ships (see `syntax_captures_in_grammars` in
 * data/zed-keys.json, 120 of them). Decorators stop looking like calls,
 * builtin types stop looking like user types, JSON keys stop looking like
 * strings.
 *
 * Two axes carry meaning, not one:
 *   hue   — what kind of thing this is
 *   style — italic marks the indirect: parameters, builtins, `self`, comments
 */

import { opaque } from './color.mjs';

export function buildSyntax(v) {
  // Every colour goes out as eight-digit #rrggbbaa. Six-digit values load, but
  // they defeat the alpha layering the rest of the theme depends on.
  const t = (color, extra = {}) => ({
    color: opaque(color),
    font_style: null,
    font_weight: null,
    ...extra,
  });
  const italic = (color) => t(color, { font_style: 'italic' });
  const bold = (color) => t(color, { font_weight: 700 });

  const {
    text, primary, accent, comment, danger, caution, go, string, number, type,
  } = v;

  // Punctuation recedes: it is the highest-population chromatic class on
  // screen, so on OLED it is also the most expensive one to make bright.
  const punct = v.punctuation;
  const docComment = v.docComment;

  return {
    // ---- the 47 the bundled themes define ------------------------------
    attribute: t(caution),
    boolean: t(number),
    comment: italic(comment),
    'comment.doc': italic(docComment),
    constant: t(number),
    constructor: t(primary),
    'diff.minus': t(danger),
    'diff.plus': t(go),
    embedded: t(text),
    emphasis: italic(text),
    'emphasis.strong': bold(text),
    enum: t(type),
    function: t(primary),
    'function.builtin': italic(primary),
    hint: italic(comment),
    keyword: t(accent),
    label: t(caution),
    link_text: italic(primary),
    link_uri: t(type),
    namespace: t(type),
    number: t(number),
    operator: t(type),
    predictive: italic(v.predictiveText),
    preproc: t(accent),
    primary: t(text),
    property: t(caution),
    punctuation: t(punct),
    'punctuation.bracket': t(punct),
    'punctuation.delimiter': t(punct),
    'punctuation.list_marker': t(primary),
    'punctuation.markup': t(comment),
    'punctuation.special': t(accent),
    selector: t(caution),
    'selector.pseudo': t(accent),
    string: t(string),
    'string.escape': t(number),
    'string.regex': t(go),
    'string.special': t(go),
    'string.special.symbol': t(number),
    tag: t(primary),
    'text.literal': t(string),
    title: bold(primary),
    type: t(type),
    variable: t(text),
    'variable.parameter': italic(text),
    'variable.special': italic(accent),
    variant: t(number),

    // ---- sub-captures the grammars actually emit ------------------------
    // Keywords
    'keyword.control': t(accent),
    'keyword.declaration': t(accent),
    'keyword.definition': t(accent),
    'keyword.directive': t(accent),
    'keyword.function': t(accent),
    'keyword.import': t(accent),
    'keyword.operator': t(accent),
    'keyword.preproc': t(accent),
    storageclass: t(accent),
    lifetime: italic(accent),
    'type.qualifier': t(accent),

    // Functions and methods
    'function.call': t(primary),
    'function.definition': t(primary),
    'function.method': t(primary),
    'function.method.call': t(primary),
    'function.method.constructor': t(primary),
    'function.special': italic(primary),
    'function.special.definition': italic(primary),
    'function.decorator': italic(accent),
    'function.decorator.call': italic(accent),
    'function.kwargs': italic(text),

    // Types
    'type.builtin': italic(type),
    'type.class': t(type),
    'type.class.builtin': italic(type),
    'type.class.call': t(type),
    'type.class.definition': t(type),
    'type.class.inheritance': t(type),
    'type.definition': t(type),
    'type.interface': t(type),
    'type.name': t(type),
    'type.unit': t(number),
    concept: t(type),
    module: t(type),
    import: t(accent),

    // Variables and members
    'variable.builtin': italic(accent),
    'variable.member': t(caution),
    'variable.other.member': t(caution),
    'property.name': t(caution),
    'property.json_key': t(primary),
    'attribute.builtin': italic(caution),
    'attribute.special': italic(caution),

    // Constants
    'constant.builtin': t(number),

    // Strings and regex
    'string.doc': italic(string),
    'string.escape.regex': t(number),
    'string.special.path': t(type),
    'keyword.operator.regex': t(accent),
    'operator.regex': t(accent),
    'punctuation.bracket.regex': t(punct),
    'punctuation.delimiter.regex': t(punct),
    'label.regex': t(caution),
    'number.quantifier.regex': t(number),

    // Markup — Markdown, and the JSX/HTML families
    'markup.heading': bold(primary),
    'markup.link.url': t(type),
    'emphasis.markup': italic(text),
    'emphasis.strong.markup': bold(text),
    'strikethrough.markup': t(comment),
    'link_text.markup': italic(primary),
    'link_uri.markup': t(type),
    'punctuation.list_marker.markup': t(primary),
    'punctuation.embedded.markup': t(punct),
    'title.markup': bold(primary),
    'text.literal.markup': t(string),

    'tag.jsx': t(primary),
    'tag.component.jsx': t(type),
    'tag.doctype': italic(comment),
    'attribute.jsx': t(caution),
    'text.jsx': t(text),
    'punctuation.bracket.jsx': t(punct),
    'punctuation.delimiter.jsx': t(punct),
    'punctuation.bracket.html': t(punct),
    'punctuation.delimiter.html': t(punct),

    // CSS
    'selector.class': t(caution),
    'selector.id': t(caution),
    keyframes: t(accent),
    media: t(accent),
    supports: t(accent),
    charset: t(accent),

    // JSDoc
    'keyword.jsdoc': italic(accent),
    'type.jsdoc': t(type),
    'variable.jsdoc': italic(text),

    // Diagnostics and diffs surfacing as captures
    warning: t(caution),
    'diff.delta': t(caution),
    'diff.delta.moved': italic(caution),
    'comment.unused': italic(v.predictiveText),

    // Fallbacks
    text: t(text),
    nested: t(text),
    none: t(text),
  };
}
