# Sojourner story quiz

The quiz at `/story/sojourner#story-quiz` checks comprehension of **Sojourner: The Journey Through the Stars**. Its ten questions cover the ten published chapters, with four choices and one correct answer per question.

## Reader experience

- Pick one answer. A correct choice turns green with a check mark and **Good job!** A wrong choice turns red with an X; the correct choice is then revealed in green.
- A short explanation and a link to the relevant chapter appear after answering. Readers use **Previous question** to review an answer and **Next question** to continue at their own pace.
- Only the first choice counts. Clicking again cannot inflate the score.
- Refreshing the page starts a new attempt. Answers live in the current page session.
- After question ten, the results show a score out of ten, a review of all answers with chapter links, and **Try again**.
- The quiz is the final step in the scrolling story's scene list. Scrolling past the final clip brings the quiz into the same frame. The final clip's **Take the quiz** button advances to that step too.
- Chapter review links jump within the current story. **Back to quiz** returns to the current attempt after revisiting an earlier scene.
- The full-text story also includes the quiz after its last chapter. The old `/games/story-quiz` URL redirects to the final step in the scrolling story.
- Keyboard focus moves to the next question or results heading. Feedback is announced through a live region. Labels and marks communicate results independently of color.

The quiz uses existing site theme tokens and a scoped CSS module. Explicit green/red answer fills remain readable in all six themes. No dependencies, new imagery, AI calls, storage keys, or changes to the stars/progression system are required.

## Story evidence

`lib/sojourner-quiz.ts` stores an exact supporting quote and its chapter/paragraph reference for each question. `tests/sojourner-quiz.test.mjs` checks those quotes against `content/stories.json` so later manuscript changes can flag questions for editorial review. It also checks the ten chapters, four distinct choices, and valid answer indices. The question wording and distractors were manually reviewed for a single correct answer.

| Question | Chapter | Topic | Correct choice |
| --- | --- | --- | --- |
| 1 | 1 | Journey to Mars | Nearly seven months |
| 2 | 2 | Airbags | Cushioning the impact |
| 3 | 3 | Blocked ramp | An airbag that had not fully retracted |
| 4 | 4 | Communication | Pathfinder relayed the rover's information |
| 5 | 5 | APXS | Chemical elements in rocks and soil |
| 6 | 6 | Signal delay | Several minutes one way |
| 7 | 7 | Mission duration | Eighty-three days instead of the seven-day plan |
| 8 | 8 | Last rock studied | Chimp |
| 9 | 9 | Last listening attempt | No signal came |
| 10 | 10 | Legacy | Preparing the way for later Mars rovers |

Sources and credits:

- Primary editorial source: `content/stories.json`, Sojourner chapters 1–10; [published full story](https://cosmic-juniors.vercel.app/story/sojourner/text).
- The scrolling adaptation is in `lib/story/sojourner.ts`. All ten correct answers also appear in that adaptation.
- Existing factual references: [NASA Science: Mars Pathfinder](https://science.nasa.gov/mission/mars-pathfinder/) and [NASA PDS: Mars Pathfinder rover instrument host](https://pds.nasa.gov/data/mpfr-m-apxs-2-edr-v1.0/mprv_0001/document/insthost.htm).

The manuscript is unchanged. Its distinction between lost communication and unknown later rover movements is preserved; the quiz does not invent an endpoint or claim that Sojourner still communicates.

## Original implementation

Reviewed baseline: `66ad3929d4c7f20fc2d7bdefd2d6b8bcdf43d659`, shared by `main` and `claude/modest-albattani-uf9pob` when fetched on November 14, 2026. The historical `feature/globe-detail-compatible-v2` update at `0e12a2768be3bbb652d736c05f54d49344cf3833` is already an ancestor of that baseline. The terrain ZIP was not reapplied.

Implementation branch: `feature/sojourner-story-quiz`. Existing rover models/parts, globe surfaces, explorer windows, journey datasets and Pathfinder simulator are untouched. No deletions, package changes or migrations.

## Local checks

Run the type checker and quiz data tests from the repository root.

```sh
npm run lint
node --test tests/sojourner-quiz.test.mjs
```

With the app running locally, use Python Playwright and Chromium to check the transition from the final clip to the quiz within the same frame, and the full-text story. The script also checks the legacy redirect, scoring, answer review, retry, responsive layouts, and theme colors.

```sh
python tests/sojourner-quiz.browser.py
```

The test uses a system `chromium` if available, otherwise Playwright's installed Chromium. `CHROMIUM_PATH` can select another executable. `QUIZ_ARTIFACT_DIR` selects the screenshot/report directory; the default is a temporary directory outside the repository. This browser test is optional and adds no application runtime dependencies.
