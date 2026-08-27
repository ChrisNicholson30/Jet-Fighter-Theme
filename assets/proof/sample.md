# Jet Fighter — proof corpus

A **Markdown** file, so the markup tokens get exercised too: _emphasis_,
**strong**, `inline code`, ~~strikethrough~~, and [a link](https://zed.dev).

## Modes

| Mode | Chip | Meaning |
|---|---|---|
| `NORMAL` | primary | cruise |
| `INSERT` | go | cleared to write |
| `REPLACE` | danger | armed, you are overwriting |

1. Ordered list marker
2. Second item
   - Nested unordered marker
   - With `code` inside

> A block quote, which renders through `punctuation.markup`.

```rust
fn climb(feet: u32) -> Result<u32, String> {
    if feet > 65_000 { return Err("above ceiling".into()); }
    Ok(feet)
}
```
