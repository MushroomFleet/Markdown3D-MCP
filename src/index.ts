#!/usr/bin/env node
import { Markdown3DServer } from './server.js';

const server = new Markdown3DServer();
server.run().catch(console.error);
