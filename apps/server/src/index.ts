import { getConfig } from './config';
import { createServer } from './app';

const config = getConfig();
const { httpServer, close } = await createServer(config);

httpServer.listen(config.port, config.host, () => {
  console.log(`> ${config.dev ? 'Development' : 'Production'} mode`);
  console.log(`> Local: http://localhost:${config.port}/`);
});

// stopped (deployment, Ctrl+C): drawings of the rooms saved first, given back to their users joining again
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await close();
    process.exit(0);
  });
}
