import { createApp } from './app';
import { env } from './config/env';

createApp().listen(env.PORT, () => {
  console.log(`aber-api listening on port ${env.PORT}`);
});
