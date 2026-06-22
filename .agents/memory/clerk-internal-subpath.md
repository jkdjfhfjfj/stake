---
name: Clerk internal subpath
description: publishableKeyFromHost lives at @clerk/react/internal subpath export; never add it as a package.json link dependency.
---

## The Rule

Import `publishableKeyFromHost` directly from the subpath:
```typescript
import { publishableKeyFromHost } from "@clerk/react/internal";
```

Do NOT add `"internal": "link:@clerk/react/internal"` to `package.json` dependencies.

**Why:** `link:` in pnpm is for local filesystem paths, not subpath exports of installed packages. Adding `"internal": "link:@clerk/react/internal"` creates a broken dependency that crashes Vite's module resolution on startup with no clear error message.

**How to apply:** `@clerk/react` v6+ exports `./internal` as a proper subpath (confirmed in package.json exports field). Just import it directly. No extra package.json entry needed.
