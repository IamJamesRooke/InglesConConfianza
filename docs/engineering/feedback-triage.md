# Feedback triage

Use this routine when the owner says, “let us go through the feedback”. The
feedback repository is private: `IamJamesRooke/InglesConConfianza-feedback`.
Never use the public project repository for feedback.

Set the repository once for the session:

```sh
repo=IamJamesRooke/InglesConConfianza-feedback
```

## 1. Collect new feedback

List open issues labelled `nuevo`, including the fields needed for triage:

```sh
gh issue list -R "$repo" --state open --label nuevo --json number,title,labels,body,createdAt
```

Save the JSON if useful, but do not copy names or comment text into public
files. The issue number is the safe reference outside the private repository.

## 2. Open the batch

Give the owner one line counting issues by type. Use the labels on the issues:

```sh
gh issue list -R "$repo" --state open --label nuevo --json labels --limit 1000 \
  | jq -r '[.[] | (.labels | map(.name) | map(select(. as $x | ["problema","idea","elogio","pregunta","sin clasificar"] | index($x))) | .[0] // "sin clasificar")] | group_by(.) | map("\(.[0]): \(length)") | join("; ")'
```

Then open each issue as needed:

```sh
gh issue view NUMBER -R "$repo" --json number,title,labels,body,createdAt
```

## 3. Classify

Read every issue labelled `sin clasificar`. Assign `problema`, `idea`,
`elogio`, or `pregunta` from its text. Apply the type label and remove the
old label:

```sh
gh issue edit NUMBER -R "$repo" --add-label problema --remove-label "sin clasificar"
```

Use the equivalent type label when appropriate. Do not guess when the text is
ambiguous; mark it as a question for the owner.

## 4. Cluster

Group issues by the automatic lesson label and slide-kind label, then by slide
number or slide ID from the payload. Merge duplicates in the private repo:

```sh
gh issue comment DUPLICATE -R "$repo" --body "Duplicate of #CANONICAL; keeping #CANONICAL for triage."
gh issue close DUPLICATE -R "$repo"
```

Show praise and problems side by side when they concern the same slide. Keep
the cluster summary to issue numbers and neutral descriptions outside the
private repo.

## 5. Propose an outcome

For each cluster, propose one of: fix, will not fix, or question. Explain it
in plain language and put the cheapest safe fix first. For a visual report,
try to reproduce it from the payload: lesson, slide, typed answer, screen
size, browser, and any relevant pointer or answer details.

Use an isolated port and throwaway feedback/test data. Never use the owner's
`localhost:3000`. Record only the result, not a learner's name or comment:

```sh
UX_CHECK_PORT=3100 npx playwright test tests/ux/RELEVANT.spec.ts
```

## 6. Get the owner’s decision

The owner decides. Turn the decision into a label and remove `nuevo`:

```sh
gh issue edit NUMBER -R "$repo" --add-label decidido-arreglar --remove-label nuevo
gh issue edit NUMBER -R "$repo" --add-label decidido-no --remove-label nuevo
```

Use `pregunta` while waiting for an answer when that is the decision. Preserve
the type label as well.

## 7. Route agreed fixes

For an agreed fix, add a concise item to `docs/backlog.md` or send the scoped
work directly to a sub-agent. The fixing commit message must reference the
issue as `feedback#42` — never a bare `#42`, which GitHub would link to issue
42 of the public project repo — so the issue can be closed with a short private
comment:

```sh
gh issue comment NUMBER -R "$repo" --body "Fixed in commit COMMIT_SHA."
gh issue close NUMBER -R "$repo"
```

## 8. Preserve praise

Never close praise unread. First write its conclusion in `docs/what-works.md`
with the issue number as evidence, then close it:

```sh
gh issue comment NUMBER -R "$repo" --body "Recorded in docs/what-works.md."
gh issue close NUMBER -R "$repo"
```

## 9. Privacy check

The feedback repo is private. Never paste names or comment text into the
public project repo, commit messages, or public docs. Refer to private issues
by number only. Before finishing, verify that only the intended issue labels,
private comments, and explicitly requested documentation changed.
