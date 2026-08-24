# Contract and policy model

Required request fields are `publicationId`, `contentVersionId`, `channel`, `format`, `caption`, `assetVersion`, `scheduledFor`, `requestedBy`, `utm` and `compliance.audienceConsent`. Supported channels are Instagram, LinkedIn, Facebook and X. The project intentionally has no hidden fallback channel.

`utm` is not a revenue claim. It is an attribution identifier that a production analytics system can later join to measured click/conversion data.

Channel policy holds allowed formats, caption length, minimum publishing interval and disclosure requirement. LinkedIn fixture policy requires disclosure to show that governance can differ by channel. A regulated claim adds a compliance reviewer to the approval matrix.

Changing scheduled time or asset/content version changes revision scope and removes prior approvals. This prevents a reviewer approval for asset version 1 being reused for version 2.
