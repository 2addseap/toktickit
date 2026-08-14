# Lab 1 — AI Use and Reflection

**LLM/agent used:** Antigravity (Gemini 3.7 Flash)

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Review the Lab 1 labsheet requirements and verify the Issue 1 foundation setup. | Audited the project structure, identified missing root `.gitignore` and empty `README.md`. |
| 2 | Add a standard `.gitignore` and write complete project setup instructions in `README.md`. | Created `.gitignore` and `README.md` covering prerequisites, setup, migration, and testing. |
| 3 | Implement `GET /api/health` in Express backend and verify with Supertest. | Updated `server/src/app.ts` and confirmed `health.test.ts` passed with HTTP 200. |
| 4 | Create the frontend `Check System` UI in React with loading, Online, and Offline states. | Updated `client/src/App.tsx` and `client/src/api.ts` with Bootstrap styling. |
| 5 | Implement Vitest UI tests for heading, category loading, and API failure states. | Added unit tests in `client/tests/lab-01/App.test.tsx` verifying UI-01, UI-02, and UI-03. |
| 6 | Define Prisma Category model, run PostgreSQL migration, and write idempotent seed script. | Added model to `schema.prisma`, ran `prisma migrate dev`, and wrote `upsert` seeding in `seed.ts`. |
| 7 | Implement `GET /api/categories` endpoint and Supertest assertion. | Added route in `server/src/app.ts` and automated test in `server/tests/lab-01/categories.test.ts`. |
| 8 | Run full test suites across client and server and summarize submission requirements. | Ran `npm test` on both packages, verifying 100% test pass rate, and prepared submission checklist. |

## Reflection
Using Antigravity with Gemini 3.7 Flash allowed rapid scaffolding and vertical slice verification across all layers (database, API, UI, and automated tests). Breaking down the requirements by GitHub Issue and strictly following the Git Flow branching model ensured clean commits and verifiable acceptance criteria. When running migrations, specifying the exact Prisma model definitions beforehand prevented empty schema generation errors.
