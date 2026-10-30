import { getConfig } from './config';
import { createServer } from './app';

const config = getConfig();
const { httpServer } = await createServer(config);

httpServer.listen(config.port, config.host, () => {
  console.log(`> ${config.dev ? 'Development' : 'Production'} mode`);
  console.log(`> Local: http://localhost:${config.port}/`);
});
