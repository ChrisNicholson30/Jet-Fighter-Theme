/**
 * Jet Fighter site — syntax highlighting.
 *
 * The point of this file is fidelity. Code samples on a theme's website are
 * usually coloured by whatever the site's highlighter happens to do, which
 * means the screenshots do not show the theme — they show a different
 * highlighter wearing the theme's colours.
 *
 * Here the tokenisers emit *Zed capture names*, and `resolve` implements Zed's
 * own lookup: longest dotted prefix, bounded below by the first segment
 * (crates/syntax_theme/src/syntax_theme.rs). So `function.method.call` resolves
 * against `function.method.call`, then `function.method`, then `function` —
 * exactly as it would in the editor. If a capture falls back on this page, it
 * falls back in Zed too.
 */

/**
 * Zed's highlight lookup. Returns the style for `capture`, or null.
 *
 * Zed searches the capture-name map over the range
 * [first segment, full name] and takes the longest entry that is a prefix of
 * `capture` on a dot boundary.
 */
export function resolve(capture, syntax) {
  if (!capture) return null;
  const first = capture.split('.')[0];
  let best = null;
  for (const name of Object.keys(syntax)) {
    if (name < first || name > capture) continue;
    const rest = capture.slice(name.length);
    if (capture.startsWith(name) && (rest === '' || rest.startsWith('.'))) {
      if (!best || name.length > best.length) best = name;
    }
  }
  return best ? { name: best, ...syntax[best] } : null;
}

const escapeHtml = (s) =>
  s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

/**
 * Scan `code` with an ordered rule list. Each rule is [regex, capture] or
 * [regex, fn] where fn returns sub-tokens, so a template literal can colour its
 * interpolation punctuation differently from its text.
 *
 * Rules are tried in order at each position; first match wins. Unmatched
 * characters fall through as plain text, which is what Zed does with any span
 * no capture claims.
 */
function scan(code, rules) {
  const out = [];
  let i = 0;
  outer: while (i < code.length) {
    for (const [re, capture] of rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (m && m.index === i && m[0].length > 0) {
        if (typeof capture === 'function') out.push(...capture(m));
        else out.push({ text: m[0], capture });
        i += m[0].length;
        continue outer;
      }
    }
    // Merge runs of unclaimed characters so the DOM stays small.
    const last = out[out.length - 1];
    if (last && last.capture === null) last.text += code[i];
    else out.push({ text: code[i], capture: null });
    i += 1;
  }
  return out;
}

const r = (source) => new RegExp(source, 'gy');

/** Template literal: text is a string, `${` and `}` are special punctuation. */
const template = (m) => {
  const out = [];
  const re = /\$\{|\}/g;
  let last = 0;
  let depth = 0;
  let match;
  while ((match = re.exec(m[0]))) {
    if (match[0] === '${') {
      if (match.index > last) out.push({ text: m[0].slice(last, match.index), capture: 'string' });
      out.push({ text: '${', capture: 'punctuation.special' });
      depth += 1;
      last = re.lastIndex;
    } else if (depth > 0) {
      if (match.index > last) {
        out.push(...scan(m[0].slice(last, match.index), RULES.ts.filter(([, c]) => c !== 'string')));
      }
      out.push({ text: '}', capture: 'punctuation.special' });
      depth -= 1;
      last = re.lastIndex;
    }
  }
  if (last < m[0].length) out.push({ text: m[0].slice(last), capture: 'string' });
  return out;
};

const COMMON = {
  number: [r('0[xXbBoO][0-9a-fA-F_]+|\\d[\\d_]*\\.?[\\d_]*(?:[eE][+-]?\\d+)?'), 'number'],
  punctBracket: [r('[\\[\\]{}()]'), 'punctuation.bracket'],
  punctDelim: [r('[;,.]'), 'punctuation.delimiter'],
  whitespace: [r('\\s+'), null],
};

const RULES = {};

RULES.ts = [
  [r('/\\*\\*[\\s\\S]*?\\*/'), 'comment.doc'],
  [r('/\\*[\\s\\S]*?\\*/'), 'comment'],
  [r('//[^\\n]*'), 'comment'],
  [r('`(?:\\\\.|[^`\\\\])*`'), template],
  [r("'(?:\\\\.|[^'\\\\])*'|\"(?:\\\\.|[^\"\\\\])*\""), 'string'],
  [r('/(?![/*])(?:\\\\.|\\[(?:\\\\.|[^\\]\\\\])*\\]|[^/\\\\\\n])+/[gimsuyd]*'), 'string.regex'],
  [r('@[A-Za-z_$][\\w$]*'), 'function.decorator'],
  [r('#?[A-Za-z_$][\\w$]*(?=\\s*\\()'), 'function.call'],
  [r('\\b(?:import|export|from|as|default|const|let|var|function|class|extends|implements|interface|type|enum|namespace|declare|return|if|else|for|while|do|switch|case|break|continue|new|delete|typeof|instanceof|in|of|await|async|yield|throw|try|catch|finally|public|private|protected|readonly|static|abstract|override|satisfies|keyof|infer|is|asserts)\\b'), 'keyword'],
  [r('\\b(?:true|false|null|undefined)\\b'), 'constant.builtin'],
  [r('\\b(?:this|super|globalThis)\\b'), 'variable.builtin'],
  [r('\\b(?:string|number|boolean|any|unknown|never|void|object|symbol|bigint)\\b'), 'type.builtin'],
  [r('\\b[A-Z][A-Za-z0-9_]*\\b'), 'type'],
  [r('(?<=\\.)\\s*[A-Za-z_$][\\w$]*'), 'variable.member'],
  [r('#?[A-Za-z_$][\\w$]*(?=\\s*:)'), 'property'],
  COMMON.number,
  COMMON.punctBracket,
  COMMON.punctDelim,
  [r('[=+\\-*/%<>!&|^~?:]+'), 'operator'],
  COMMON.whitespace,
];

RULES.rust = [
  [r('///[^\\n]*|//![^\\n]*'), 'comment.doc'],
  [r('//[^\\n]*'), 'comment'],
  [r('/\\*[\\s\\S]*?\\*/'), 'comment'],
  [r('r#*"(?:[^"]|"(?!#))*"#*|b?"(?:\\\\.|[^"\\\\])*"'), 'string'],
  [r("b?'(?:\\\\.|[^'\\\\])'"), 'string'],
  [r('#!?\\[[^\\]]*\\]'), 'attribute'],
  [r("'[a-z_][\\w]*"), 'lifetime'],
  [r('[A-Za-z_][\\w]*!(?=\\s*[\\(\\[{])'), 'function.special'],
  [r('[A-Za-z_][\\w]*(?=\\s*\\()'), 'function.call'],
  [r('\\b(?:as|async|await|break|const|continue|crate|dyn|else|enum|extern|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|static|struct|super|trait|type|union|unsafe|use|where|while)\\b'), 'keyword'],
  [r('\\b(?:true|false|None|Some|Ok|Err)\\b'), 'constant.builtin'],
  [r('\\b(?:self|Self)\\b'), 'variable.builtin'],
  [r('\\b(?:u8|u16|u32|u64|u128|usize|i8|i16|i32|i64|i128|isize|f32|f64|bool|char|str|String|Vec|Option|Result|HashMap|Box|Arc|Rc)\\b'), 'type.builtin'],
  [r('\\b[A-Z][A-Za-z0-9_]*\\b'), 'type'],
  [r('\\b[A-Z][A-Z0-9_]+\\b'), 'constant'],
  COMMON.number,
  COMMON.punctBracket,
  [r('::|[;,.]'), 'punctuation.delimiter'],
  [r('[=+\\-*/%<>!&|^~?]+'), 'operator'],
  COMMON.whitespace,
];

RULES.python = [
  [r('"""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\''), 'string.doc'],
  [r('#[^\\n]*'), 'comment'],
  [r('[rbfu]{0,2}"(?:\\\\.|[^"\\\\])*"|[rbfu]{0,2}\'(?:\\\\.|[^\'\\\\])*\''), 'string'],
  [r('@[A-Za-z_][\\w.]*'), 'function.decorator'],
  [r('[A-Za-z_][\\w]*(?=\\s*\\()'), 'function.call'],
  [r('\\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|match|case)\\b'), 'keyword'],
  [r('\\b(?:True|False|None)\\b'), 'constant.builtin'],
  [r('\\b(?:self|cls|__init__|__post_init__|__repr__)\\b'), 'variable.builtin'],
  [r('\\b(?:int|str|float|bool|bytes|list|dict|tuple|set|frozenset|type|object)\\b'), 'type.builtin'],
  [r('\\b[A-Z][A-Za-z0-9_]*\\b'), 'type'],
  COMMON.number,
  COMMON.punctBracket,
  COMMON.punctDelim,
  [r('[=+\\-*/%<>!&|^~:]+'), 'operator'],
  COMMON.whitespace,
];

RULES.go = [
  [r('//[^\\n]*'), 'comment'],
  [r('/\\*[\\s\\S]*?\\*/'), 'comment'],
  [r('`[^`]*`'), 'string'],
  [r('"(?:\\\\.|[^"\\\\])*"'), 'string'],
  [r('[A-Za-z_][\\w]*(?=\\s*\\()'), 'function.call'],
  [r('\\b(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var)\\b'), 'keyword'],
  [r('\\b(?:true|false|nil|iota)\\b'), 'constant.builtin'],
  [r('\\b(?:string|int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|float32|float64|byte|rune|bool|error|any)\\b'), 'type.builtin'],
  [r('\\b[A-Z][A-Za-z0-9_]*\\b'), 'type'],
  COMMON.number,
  COMMON.punctBracket,
  COMMON.punctDelim,
  [r('[=+\\-*/%<>!&|^~:]+'), 'operator'],
  COMMON.whitespace,
];

RULES.json = [
  [r('"(?:\\\\.|[^"\\\\])*"(?=\\s*:)'), 'property.json_key'],
  [r('"(?:\\\\.|[^"\\\\])*"'), 'string'],
  [r('\\b(?:true|false)\\b'), 'boolean'],
  [r('\\bnull\\b'), 'constant.builtin'],
  [r('-?\\d[\\d_]*\\.?\\d*(?:[eE][+-]?\\d+)?'), 'number'],
  COMMON.punctBracket,
  [r('[:,]'), 'punctuation.delimiter'],
  COMMON.whitespace,
];

/** Diffs are rendered from the theme's diff tokens, not from syntax. */
RULES.diff = [
  [r('^diff [^\\n]*|^index [^\\n]*|^--- [^\\n]*|^\\+\\+\\+ [^\\n]*'), 'comment'],
  [r('^@@[^\\n]*@@'), 'diff.delta'],
  [r('^\\+[^\\n]*'), 'diff.plus'],
  [r('^-[^\\n]*'), 'diff.minus'],
  [r('[^\\n]+'), null],
  COMMON.whitespace,
];

export function tokenize(code, lang) {
  const rules = RULES[lang];
  if (!rules) throw new Error(`No rules for language: ${lang}`);
  if (lang === 'diff') {
    // Diff rules are line-anchored, so scan a line at a time.
    return code.split('\n').flatMap((line, i) => [
      ...(i ? [{ text: '\n', capture: null }] : []),
      ...scan(line, rules),
    ]);
  }
  return scan(code, rules);
}

/** Render tokens to HTML, resolving each capture through Zed's own rule. */
export function highlight(code, lang, syntax, classFor) {
  return tokenize(code, lang)
    .map(({ text, capture }) => {
      const style = resolve(capture, syntax);
      if (!style) return escapeHtml(text);
      return `<span class="${classFor(style.name)}">${escapeHtml(text)}</span>`;
    })
    .join('');
}

export { escapeHtml };

/**
 * Highlight into an array of lines.
 *
 * Splitting highlighted *HTML* on newlines is the obvious approach and it is
 * wrong: any token that spans lines — a block comment, a template literal, a
 * Rust attribute — gets its opening and closing tag on different lines, so the
 * browser repairs the markup and the code drifts out of step with the gutter.
 * Splitting the *tokens* instead keeps every line independently well-formed.
 */
export function highlightLines(code, lang, syntax, classFor) {
  const lines = [[]];
  for (const { text, capture } of tokenize(code, lang)) {
    const style = resolve(capture, syntax);
    const cls = style ? classFor(style.name) : null;
    const parts = text.split('\n');
    parts.forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part === '') return;
      const html = escapeHtml(part);
      lines[lines.length - 1].push(cls ? `<span class="${cls}">${html}</span>` : html);
    });
  }
  return lines.map((parts) => parts.join(''));
}
