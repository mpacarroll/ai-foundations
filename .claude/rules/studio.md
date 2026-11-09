---
paths:
  - "studio/**"
---
# Studio (guided labs)

- `studio/` is plain static JS (UMD modules, no bundler). Logic in course.js, grader.js, progress.js, workshop.js is shared by the page and Node tests; app.js only wires the DOM.
- Feedback must stay deterministic and model-free. New course content needs a strong and weak sample in `studio/test/fixtures.js`.
- localStorage key `af-studio-v1`; bump SCHEMA_VERSION only with a migration, since unknown versions are treated as damaged.
- Progress codes (`AF1.` prefix) must never carry learner text; a test enforces it.
- Courses are registered in `studio/catalog.js`. Lab ids must be unique across all courses (a test enforces it); progress is keyed by lab id.
- `state.course` is optional and was added without a version bump; keep new state fields optional the same way.
- QA bar: `cd studio && npm test && npm run e2e`.
