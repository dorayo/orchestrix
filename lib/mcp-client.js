'use strict';

const https = require('https');
const http = require('http');
const { MCP_SERVER_URL } = require('./merge');

/**
 * Validate license key by calling MCP server tools/list
 * Returns: { valid: true, tier: string } or { valid: false, error: string }
 */
async function validateKey(key) {
  try {
    const response = await mcpRequest(key, 'tools/list', {});
    if (response.result) {
      return { valid: true, tier: 'pro' }; // If tools/list works, key is valid
    }
    return { valid: false, error: response.error?.message || 'Unknown error' };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

/**
 * Fetch init data from MCP server
 * Returns parsed response or null on failure
 */
async function fetchInit(key, type = 'all') {
  try {
    const response = await mcpRequest(key, 'tools/call', {
      name: 'orchestrix-init',
      arguments: { type },
    });
    if (response.result && response.result.content) {
      return response.result.content[0]?.text || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Send a JSON-RPC request to the MCP server
 */
function mcpRequest(key, method, params) {
  return new Promise((resolve, reject) => {
    const url = new URL(MCP_SERVER_URL);
    const transport = url.protocol === 'https:' ? https : http;

    const body = JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: 1,
    });

    // Detect proxy from environment
    const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY ||
                     process.env.http_proxy || process.env.HTTP_PROXY;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        Authorization: `Bearer ${key}`,
      },
      timeout: 15000,
    };

    // If proxy is set, try to use it (basic support)
    if (proxyUrl) {
      try {
        const proxy = new URL(proxyUrl);
        options.hostname = proxy.hostname;
        options.port = proxy.port;
        options.path = MCP_SERVER_URL;
        options.headers.Host = url.hostname;
      } catch {
        // Invalid proxy URL, proceed without proxy
      }
    }

    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch {
          reject(new Error(`Invalid response from MCP server: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('MCP server request timed out (15s)'));
    });

    req.write(body);
    req.end();
  });
}

module.exports = { validateKey, fetchInit, mcpRequest };
