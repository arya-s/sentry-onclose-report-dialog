# Sentry Report Dialog `onClose` demo

This is a sample project to demonstrate the usage of an `onClose` callback that can be added to [Sentry's report dialog](https://docs.sentry.io/platforms/javascript/enriching-events/user-feedback/#embeddable-javascript-widget) options.
In this demo, the background will turn red when the report dialog is open and green after closing it.

[demo.webm](https://github.com/arya-s/sentry-onclose-report-dialog/assets/934045/2bf7336e-b589-4ddd-b7d4-a9ab104f2b7e)

### Example usage:

```typescript
import { showReportDialog } from '@sentry/react';
...

// Refresh the page after the user closes the report dialog
showReportDialog({ onClose: () => location.reload() });
```

## Requirements

- A running sentry devserver that includes [commit 6af8179](https://github.com/arya-s/sentry/commit/6af8179558758ddc514055145547b443f27582d2).

## Getting started

1. Setup and run `sentry devserver`, see (https://develop.sentry.dev/environment/)
2. Set up sentry with your local dsn in `index.tsx`, e.g.

```typescript
import { init } from '@sentry/react';
...

init({
  dsn: 'http://be6167975a3d120e0a783ed697576bf0@127.0.0.1:8000/3',
});
```

3. Run `npm install`
4. Run `npm run dev`
