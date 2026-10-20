#!/usr/bin/env node
// npm create free-drawing-plugin: questions in the terminal, then the package of a plugin
import { main } from './src/cli.js';

process.exitCode = await main();
