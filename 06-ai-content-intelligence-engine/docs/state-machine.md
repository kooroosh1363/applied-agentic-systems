# State machine

`discovered → scored → needs_review/backlog/rejected → approved → planned → published → measured`. Archive transitions exist at controlled stages. An engine can score; only an identified `content_reviewer` can approve or reject. Backlog promotion requires `approved`, and published/measured states require external evidence. Invalid skips such as `discovered → published` fail closed.
