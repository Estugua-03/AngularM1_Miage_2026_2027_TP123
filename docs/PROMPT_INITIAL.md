# Prompt initial effectivement reçu le 2 octobre 2026

```text
Help me complete all mandatory requirements of TP1, TP2, and TP3 in this repository. Use one coding agent and work through the assignments sequentially.

Read first:

- README.md
- SUJET_ETUDIANT_TP1.md
- SUJET_ETUDIANT_TP2.md
- SUJET_ETUDIANT_TP3.md
- API_CONTRACT.md
- CONSEILS_POUR_UTIISER_ASSISTANT_AI.md
- RAPPORT_IA_MODELE.md
- The applicable AGENTS.md, tool-specific instructions, and best-practices.md files in both subprojects.

Before editing:

- Inspect the existing frontend and backend.
- Identify what already works, what is missing, installed package versions, and available build/test commands.
- Produce a checklist of mandatory requirements and the annotated login flow required by TP1.
- Check the Git state and preserve any existing user changes.

Implementation:

- Complete TP1, then TP2, then TP3.
- Reuse existing functionality and make focused changes.
- Preserve the backend and HTTP contract for the mandatory missions.
- Do not implement optional extensions unless I request them.
- Respect the required Angular architecture: components call services; use Reactive Forms, Signals, inject(), and the required template control flow.
- Verify authentication, profile updates, expired/invalid token handling, server pagination, upload validation, authenticated Blob/ObjectURL playback and cleanup, deletion with confirmation, and upload progress.
- Implement the required Angular SnackBar feedback and at least three meaningful frontend tests that do not depend on a running backend or MongoDB.
- Include clear educational comments where they help an M1 student understand the code.

Configuration and secrets:

- Do not read or display real .env files, MongoDB credentials, JWT secrets, or access tokens.
- Use .env.example to identify configuration requirements and tell me what I must configure locally.
- Never include sensitive information in logs, screenshots, documentation, commits, or prompts.

Verification and reporting:

- After each stage, run the relevant available tests and build checks, fix failures, and check for regressions.
- Verify browser behavior and Network requests where browser access is available. Otherwise, give me precise manual checks.
- Explain changes using actual filenames and methods, including the component → service → HttpClient → API flow.
- Update RAPPORT_IA_MODELE.md for every mission with the actual prompts, files consulted and modified, errors, verification commands, and observed results.
- Save genuine evidence in the project and link it from the report.
- Never invent screenshots, passing tests, successful browser checks, or claims about what I personally understand.
- Clearly distinguish verified results from remaining manual checks.

Git workflow:

- Work on main throughout the project.
- Before pushing, verify that origin points to my personal GitHub repository. Never push to the teacher’s repository.
- Preserve original permanently at the untouched teacher commit. If it does not exist, identify that commit and create and push original before making changes. If the baseline is uncertain, ask me rather than guessing.
- After completing and verifying TP1, commit its implementation, report, and evidence; create branch TP1 at that commit; push main and TP1.
- After completing and verifying TP2, commit the changes; create branch TP1+2 containing both completed assignments; push main and TP1+2.
- After completing and verifying TP3, commit the changes; create branch TP1+2+3 containing all three completed assignments; push main and TP1+2+3.
- Keep original, TP1, TP1+2, and TP1+2+3 as fixed snapshots. Continue subsequent development on main.
- I authorize these commits and pushes to my personal repository.
- Never force-push, overwrite existing snapshot branches, or commit secrets, .env files, node_modules, or runtime uploads.
- Review the staged changes before each commit. Include only files relevant to the assignment.
- If verification is blocked, report the blocker before marking a TP complete or creating its completed snapshot.

Autonomy:

- Continue through ordinary implementation and fixes without asking permission at every step.
- Ask before a major rewrite, backend/API change, optional extension, or destructive action.
- If credentials, account access, or manual evidence are required, explain exactly what I need to provide or do. Continue independent work where possible.

Finish with:

- A completed requirement checklist.
- Build and test results, plus any remaining manual checks.
- A summary of the branches and pushes actually completed.
- Short explanations and practice questions that help me prepare to defend the code and tests orally.
```

Retour utilisateur réellement reçu à la question sur origin personnel et health 200 : « Oui et oui. » Aucun autre succès navigateur n'en découle.
