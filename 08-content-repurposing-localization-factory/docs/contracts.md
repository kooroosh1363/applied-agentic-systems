# Contracts, formats and terminology

## Source contract

The source includes stable event/content identity, source version and locale, brand version, requested target locales, requested formats, typed segments, optional subtitle timing and an explicit evidence boundary.

## Output formats

| Format | Contract | Main control |
|---|---|---|
| localized article | title, body, CTA, language and direction | terminology and completeness |
| social post | channel-ready caption | forbidden wording and PII |
| email | subject and body | subject length and brand review |
| SRT subtitles | numbered timestamped cues | overlap and reading speed |
| carousel copy | slides with alt text | accessibility and direction |

## Translation memory

Only approved exact source-target pairs are used in the zero-cost reference path. Missing pairs receive an explicit `NEEDS_TRANSLATION:<segmentId>` marker. QA blocks the package until a human creates and approves a memory entry.

## Glossary

The versioned glossary contains target terms, do-not-translate tokens and forbidden localized phrases. Its version is written into every package so a reviewer can reconstruct the policy used.

## RTL/LTR

Locale profiles explicitly define direction. Persian outputs receive `dir=rtl`; English and Spanish receive `dir=ltr`. Direction is data, not an assumption left to a publishing UI.
