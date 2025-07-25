# Startupfuel

This project build 2 servers, the client in port 3000 and the server in the port 3001.
[Demo](https://x29befcxtq.us-east-2.awsapprunner.com/)
[Github](https://github.com/Frans06/test-startupfuel)

## Quick start

To install dependencies:

```bash
bun install
```

To setup:

```bash
cd app
bunx --bun shadcn@latest add badge button card chart checkbox dialog drawer dropdown-menu input label select separator sheet sidebar skeleton sonner table tabs toggle-group toggle tooltip
cd ..
bun run setup
cp server/.env.example src/.env
```

To run:

```bash
bun run dev

```

## Architecture consideration

The client and server was built using some tools that were choose carefully for speeding up the development and to give it the best performance and design. Some of this tools are:

- Tailwind (Design system)
- shadcn (Components library)
- react-query/trpc (server-client connector with type safety)
- BetterAuth (Easy to configure in client and server)
- react-i18next (Enhance translations/copy management)
- drizzle-orm (high performance ORM)
- cuid2 (generate friendly uuids)
- React-table (easy to built complex tables)
- React-form (easy to handle forms)

Note: Some files were joined to get under the 50 files limit, I would like to split them more to improve readability.

## Folder Structure

I divided the code into two Workspaces. App and Server. App is using vite and react, and server is using express. I manage de workspaces using bun and concurrently.

## Deployment

I'm using AWS copilot to deploy. Easy and simple.

Note: Accidentally I cleared up some of the commit I made before.
