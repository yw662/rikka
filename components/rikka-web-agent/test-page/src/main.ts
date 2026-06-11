// Initialize the WebMCP polyfill before any custom elements load
import { initializeWebMCPPolyfill } from '@mcp-b/webmcp-polyfill';
initializeWebMCPPolyfill();

// Then import the web agent — it will auto-register as a custom element
import '@takanashi/rikka-web-agent';
