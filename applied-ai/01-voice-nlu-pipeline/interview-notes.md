# Interview notes (NLU vs LLM)

## Phrasing (prefer)

| Instead of | Say |
|------------|-----|
| Voice → API → DB | Voice → **structured fields** → **server save** → DB |
| «LLM inside the product» | **Deterministic NLU** + platform STT |
| «We trained a neural network» | **Rule + dictionary pipeline** with automated tests |

## Beauty salon block

Example domain: **beauty salon appointment** (manicure, client name, tomorrow 12:00, price). Same engine class as CRM booking, not a generic “master” app.

## Cannot claim (unless you built it)

- Fine-tuned GPT / PyTorch model in production
- LLM parses every utterance end-to-end

## Can claim

- Shipped voice booking / voice planning in production web apps
- Fuzzy name match after STT errors (Levenshtein)
- Regression tests on real messy phrases (see `npm test`)

## Optional future demo (not current prod)

Hybrid: **rules first**, LLM only when confidence is low - separate pet repo, not this pipeline.
