import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
const require = createRequire(import.meta.url);
function load(relative, dependencies = {}, globals = {}) {
  const source = fs.readFileSync(new URL(relative, import.meta.url), 'utf8').replaceAll('import.meta.env.PROD', 'true');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: id => dependencies[id] || require(id), console, URLSearchParams, ...globals });
  return exports;
}
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://crypto.auraajenticai.cloud' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const accountA = '0x0000000000000000000000000000000000000001';
const accountB = '0x0000000000000000000000000000000000000002';

test('wallet restores once, shares state, deduplicates connect, handles cancellation and never signs passively', async () => {
  const calls = [], messages = [], events = new Map();
  let accounts = [accountA], chain = '0x1', approve = async () => accounts;
  window.ethereum = {
    isMetaMask: true,
    async request({ method }) {
      calls.push(method);
      if (method === 'eth_accounts') return accounts;
      if (method === 'eth_chainId') return chain;
      if (method === 'eth_requestAccounts') return approve();
      throw Error(`Unexpected wallet method ${method}`);
    },
    on(name, handler) { events.set(name, handler); },
    removeListener(name, handler) { if (events.get(name) === handler) events.delete(name); },
  };
  const { WalletProvider, useWallet } = load('../src/contexts/WalletContext.tsx', {
    '@/data/contracts': { CONTRACTS: { CryptoXToken: { address: accountB } }, CRX_TOKEN_ABI: [] },
    '@/components/ui/use-toast': { toast: message => messages.push(message) },
    '@/lib/utils': load('../src/lib/utils.ts'),
  }, { window });
  let first, second;
  function First() { first = useWallet(); return null; }
  function Second() { second = useWallet(); return null; }
  const root = createRoot(document.getElementById('root'));
  await act(async () => { root.render(React.createElement(WalletProvider, null, React.createElement(First), React.createElement(Second))); });
  assert.equal(first.account, accountA);
  assert.equal(second.account, accountA);
  assert.deepEqual(calls, ['eth_accounts', 'eth_chainId']);
  assert.equal(events.size, 2);
  accounts = [accountB]; chain = '0x38';
  await act(async () => { events.get('accountsChanged')(accounts); });
  assert.equal(first.account, accountB);
  assert.equal(second.chainId, 56);
  assert.equal(calls.includes('eth_requestAccounts'), false);
  let resolve;
  approve = () => new Promise(done => { resolve = done; });
  await act(async () => {
    const one = first.connectWallet(), two = second.connectWallet();
    assert.equal(one, two);
    resolve(accounts);
    await one;
  });
  assert.equal(calls.filter(call => call === 'eth_requestAccounts').length, 1);
  approve = async () => { throw { code: 4001, message: 'User rejected request' }; };
  await act(async () => { assert.equal(await first.connectWallet(), null); });
  assert.equal(messages.at(-1).title, 'Connection Cancelled');
  assert.equal(messages.at(-1).variant, 'default');
  accounts = [];
  await act(async () => { events.get('accountsChanged')([]); });
  assert.equal(first.account, null);
  assert.equal(second.contract, null);
  assert.equal(calls.some(method => /sign|sendTransaction|switch/i.test(method)), false);
  await act(async () => root.unmount());
  assert.equal(events.size, 0);
});

test('swap links preserve buy/sell amount and configured chain, reject guessed tokens', () => {
  const { swapLink } = load('../src/lib/swap.ts');
  const metadata = load('../src/data/coinMetadata.ts');
  const btc = metadata.getCoinMetadata('btc', 'BTC');
  const buy = new URL(swapLink(btc, 'buy', '0.01'));
  assert.equal(buy.searchParams.get('chain'), 'ethereum');
  assert.equal(buy.searchParams.get('field'), 'output');
  assert.equal(buy.searchParams.get('value'), '0.01');
  const sell = new URL(swapLink(metadata.COIN_METADATA.arbitrum, 'sell', '3'));
  assert.equal(sell.searchParams.get('chain'), 'arbitrum');
  assert.equal(sell.searchParams.get('field'), 'input');
  assert.equal(swapLink(metadata.getCoinMetadata('unknown', 'ZZZ'), 'buy', '1'), null);
  assert.equal(metadata.getCoinMetadata('unknown', 'ZZZ').contractAddress, '');
  assert.equal(swapLink(btc, 'buy', 'Infinity'), null);
});

test('PWA chooses correct mobile installation instructions and consumes native prompt once', () => {
  const events = new Map();
  const browserWindow = { matchMedia: () => ({ matches: false, addEventListener() {} }), addEventListener: (name, callback) => events.set(name, callback) };
  const pwa = load('../src/lib/pwa.ts', {}, { window: browserWindow, navigator: {} });
  assert.equal(pwa.installPlatform('iPhone Safari'), 'ios');
  assert.equal(pwa.installPlatform('Macintosh Safari', 'MacIntel', 5), 'ios');
  assert.equal(pwa.installPlatform('Android Chrome'), 'android');
  assert.equal(pwa.installPlatform('Macintosh Safari'), 'mac-safari');
  pwa.initializePwa();
  let prevented = false;
  const prompt = { preventDefault: () => { prevented = true; } };
  events.get('beforeinstallprompt')(prompt);
  assert.equal(prevented, true);
  assert.equal(pwa.consumeInstallPrompt(), prompt);
  assert.equal(pwa.consumeInstallPrompt(), null);
  events.get('appinstalled')();
  assert.equal(pwa.getInstallSnapshot().installed, true);
});

test('service worker leaves API, MCP, auth, writes and third-party requests on the network', () => {
  const events = new Map();
  vm.runInNewContext(fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), {
    self: { location: { origin: 'https://crypto.auraajenticai.cloud' }, addEventListener: (name, fn) => events.set(name, fn) }, URL,
  });
  for (const path of ['/api/auth/me', '/api/prices', '/mcp', '/mcp/info', '/connector', '/auth', 'https://external.test/assets/a.js']) {
    let intercepted = false;
    events.get('fetch')({ request: { method: 'GET', url: new URL(path, 'https://crypto.auraajenticai.cloud').href }, respondWith: () => { intercepted = true; } });
    assert.equal(intercepted, false, path);
  }
  let intercepted = false;
  events.get('fetch')({ request: { method: 'POST', url: 'https://crypto.auraajenticai.cloud/order' }, respondWith: () => { intercepted = true; } });
  assert.equal(intercepted, false);
});
