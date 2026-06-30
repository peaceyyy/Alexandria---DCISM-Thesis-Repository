# Alexandria Frontend

The production Next.js application lives in this `Alexandria/` directory.

## Local development

```powershell
cd Alexandria
npm.cmd install
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Current routes

| Route | Purpose | Status |
| --- | --- | --- |
| `/` | Public landing page | Implemented |
| `/login` | Account login | Placeholder pending auth implementation |
| `/sign-up` | USC account registration | Placeholder pending auth implementation |

New frontend work belongs under `Alexandria/app/`. The repository-level
`frontend/` directory is legacy and is not the application workspace.
