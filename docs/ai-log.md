# AI Log

| Tool | Prompt | Output Used | Output Rejected | Verification | Commit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ChatGPT | Plain-language explanation of Next.js, TS, and Tailwind stack | Architectural overview & ecosystem rationale | Vague non-technical buzzwords | Cross-referenced against Next.js documentation | Pending |
| Gemini | Plain-language explanation of Next.js, TS, and Tailwind stack | Nuance on App Router routing & layout efficiency | Lengthy boilerplate code snippets | Validated against Next.js 14/15 App Router specs | Pending |
| Google AI Studio | App Shell Architect prompt for commands and minimal layout | Semantic layout hierarchy and `<main>`/`<article>` structure | Monolithic component CSS suggestions | Ran `npm run dev` and verified layout in Chrome | Pending |

## Comparative Observations (ChatGPT vs. Gemini)
1. **Perspective Focus:** ChatGPT emphasized team onboarding velocity and developer familiarity with Tailwind, whereas Gemini centered on build-time static generation and performance implications.
2. **Structural Depth:** Gemini broke down the Next.js App Router boundary model explicitly, while ChatGPT kept the explanation at a broader framework-comparison level.