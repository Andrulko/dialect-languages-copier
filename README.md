# Crowdin Project Tools App

[cloudflarebutton]

A modern, full-stack Crowdin application built with Cloudflare Workers, React, and Tailwind CSS. This template provides a robust starting point for building Project Tools modules for Crowdin, leveraging Cloudflare's serverless infrastructure for optimal performance.

## 🚀 Features

- **Crowdin Integration**: Pre-configured with `@crowdin/app-project-module` for seamless integration.
- **Serverless Architecture**: Powered by Cloudflare Workers for global low-latency execution.
- **Modern Frontend**: Built with React 18, Vite, and styled with Tailwind CSS and Shadcn UI.
- **Database & Storage**: Out-of-the-box configuration for Cloudflare D1 (SQL) and KV (Key-Value) storage.
- **Cron Jobs**: Native integration with Cloudflare Scheduled Workers.
- **Type Safety**: End-to-end TypeScript configuration.

## 🛠 Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, Shadcn UI, React Router, Zustand, Lucide Icons.
- **Backend**: Cloudflare Workers, Node.js compatibility layer, Express (via Crowdin SDK).
- **Infrastructure**: Cloudflare D1, Cloudflare KV, Cloudflare Scheduled Workers.
- **Tooling**: Bun, TypeScript, ESLint, Wrangler.

## 📦 Prerequisites

Before you begin, ensure you have the following installed:
- [Bun](https://bun.sh/) (Runtime & Package Manager)
- A Cloudflare account and the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- A Crowdin account with Developer privileges

## 💻 Installation & Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure Environment Variables:**
   You will need to set up your environment variables for both local development and production. Update your `wrangler.jsonc` or `.dev.vars` file with your specific credentials:
   ```env
   CROWDIN_CLIENT_ID=your_client_id
   CROWDIN_CLIENT_SECRET=your_client_secret
   SCHEDULED_SECRET=your_cron_secret
   ```

3. **Initialize Cloudflare D1 & KV (Local):**
   Ensure your local environment simulates your bindings. If prompted by Wrangler, set up your local D1 database and KV namespaces.

## 🏃‍♂️ Local Development

Start the development server (which concurrently starts both the Vite frontend and the Worker backend via Wrangler):

```bash
bun run dev
```

The application will be available at `http://localhost:3000` (or your configured port).

## 🚀 Deployment

You can deploy this application directly to Cloudflare using the button below:

[cloudflarebutton]

### Manual Deployment

To deploy manually using the CLI, ensure you are logged into Cloudflare via Wrangler:

```bash
npx wrangler login
```

Then, run the deployment script:

```bash
bun run deploy
```

This command will build the React frontend and deploy both the static assets and the Worker to your Cloudflare account.

## 📁 Project Structure

- `/src`: Contains the React frontend code (Components, Hooks, Pages, Utils).
- `/worker`: Contains the Cloudflare Worker backend logic (`index.ts` and `app.ts`).
- `components.json`: Shadcn UI configuration.
- `wrangler.jsonc`: Cloudflare Workers configuration file (bindings, crons, env vars).
- `tailwind.config.js`: Tailwind styling and theme configuration.

## 🤝 Contributing

Contributions are welcome! Please ensure you follow the existing code styles and use `bun run lint` to verify your code before submitting a pull request.

## 📝 License

This project is licensed under the MIT License.