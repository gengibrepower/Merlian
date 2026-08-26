import { createApp } from './http/app.js';

const port = Number(process.env.PORT ?? 3000);

createApp().listen(port, () => {
  console.log(`merlian listening on :${port}`);
})

