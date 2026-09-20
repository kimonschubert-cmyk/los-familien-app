---
name: LOS Familien-App
description: "Use when changing the German family activity web app, its vanilla HTML/CSS/JavaScript UI, or the Node-style API functions under api/."
applyTo: ["index.html", "api/**/*.js"]
---
# LOS Familien-App

- Keep the app dependency-light and compatible with its current no-build setup. Prefer plain HTML, CSS, and JavaScript over introducing a framework or bundler.
- Preserve the German user-facing language and existing family-oriented terminology in `index.html`.
- Keep API keys and other secrets in environment variables. Never place credentials in client-side code or commit them to the repository.
- Keep API handlers compatible with the existing request/response shape and handle CORS preflight requests when changing browser-facing endpoints.
- Keep UI state and persisted family/list data consistent with the existing browser-side storage and screen-navigation patterns before adding new abstractions.
- When changing behavior, update or add a focused test in `api/test.js` when the change affects an API function; manually verify browser-only UI changes in the app.
- Keep changes small and avoid unrelated formatting or visual redesigns.
- Treat the user as the product planner: clarify the intended LOS! capability only when needed, then implement the agreed behavior directly in the project.
- After each feature change, run the narrowest relevant test or manual verification, report what works and what remains uncertain, and use the user's feedback for the next iteration.