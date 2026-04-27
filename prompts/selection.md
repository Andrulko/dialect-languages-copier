# Template Selection

Crowdin app with Project Tools module.

Use when:
- Building project-specific tools and utilities
- Creating project management extensions
- Developing project analysis and reporting tools
- Building project-level integrations with external APIs
- Creating custom project workflows and automation

Avoid when:
- Integrating custom AI providers (use AI Provider instead)
- Building machine translation integrations (use Custom MT instead)
- Building editor extensions (use Editor Right Panel instead)
- Transforming files during import/export (use File Processing instead)
- Building organization-wide tools (use Organization Menu instead)
- Building user profile tools (use Profile Resources Menu instead)

Built with:
- Crowdin Apps JS API
- Crowdin Apps SDK (@crowdin/app-project-module)
- React
- ShadCN UI
- Tailwind
- Lucide Icons
- ESLint
- Vite
- TypeScript
- Express.js
- Cloudflare Workers
