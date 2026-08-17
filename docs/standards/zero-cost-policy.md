# Zero-Cost-First Policy

The default development and test path must not require a paid API, trial subscription, or payment card.

External integrations use a provider boundary:

```text
business logic -> provider interface -> local mock (default)
                                  \-> real adapter (optional)
```

Local open-source components are preferred. Optional adapters may document paid providers, but CI and the primary demo must remain reproducible without them.

