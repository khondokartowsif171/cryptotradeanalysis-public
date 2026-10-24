import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {Interface} from 'ethers';
const require=createRequire(import.meta.url),h=React.createElement;
const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'https://crypto.auraajenticai.cloud',pretendToBeVisual:true});
globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.localStorage=dom.window.localStorage;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function load(relative,dependencies={}) {
 const source=readFileSync(new URL(relative,import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,require:id=>dependencies[id]||require(id),console,window,document,localStorage,Event:window.Event});return exports;
}
const payment=load('../src/lib/payment.ts'),sub=load('../src/lib/subscription.ts');
const payer='0x0000000000000000000000000000000000000001',recipient='0x0000000000000000000000000000000000000002';
const method={id:'polygon-usdc',network:'Polygon',chainId:137,token:'USDC',tokenAddress:'0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',decimals:6,confirmations:64,explorer:'https://polygonscan.com',rpcUrls:[],nativeCurrency:{name:'POL',symbol:'POL',decimals:18}};
const invoice={id:'00000000-0000-4000-8000-000000000001',plan:'pro',cycle:'monthly',method:method.id,chain_id:137,token:'USDC',token_address:method.tokenAddress,token_decimals:6,payer_address:payer,treasury_address:recipient,amount_usd:'19.00',amount_units:'19000000',duration_days:30,required_confirmations:64,status:'pending',tx_hash:null,created_at:new Date().toISOString(),expires_at:new Date(Date.now()+3600000).toISOString()};
test('payment calldata sends exact stablecoin units, no native transfer or token approval; rejects wrong wallet, network and expired invoice',()=>{
 const tx=payment.paymentTransaction(invoice,payer,137);assert.equal(tx.value,0n);assert.equal(tx.chainId,137n);assert.equal(tx.to.toLowerCase(),method.tokenAddress);
 const parsed=new Interface(['function transfer(address to,uint256 amount)']).parseTransaction({data:tx.data});assert.equal(parsed.name,'transfer');assert.equal(parsed.args.amount,19000000n);assert.equal(parsed.args.to.toLowerCase(),recipient);
 assert.throws(()=>payment.paymentTransaction(invoice,recipient,137));assert.throws(()=>payment.paymentTransaction(invoice,payer,1));assert.throws(()=>payment.paymentTransaction({...invoice,expires_at:new Date(0).toISOString()},payer,137));assert.throws(()=>payment.paymentTransaction({...invoice,status:'confirmed'},payer,137));
 assert.equal(sub.activeTier({tier:'vip',tier_expires_at:new Date(0).toISOString()}),'free');assert.equal(sub.activeTier({tier:'vip',tier_expires_at:new Date(Date.now()+3600000).toISOString()}),'vip');
});
const Dialog={Dialog:({open,children})=>open?h('div',{role:'dialog'},children):null,DialogContent:({children})=>h('div',null,children),DialogTitle:({children})=>h('h2',null,children),DialogDescription:({children})=>h('p',null,children)};
const plans=[{id:'free',name:'Free Explorer',priceUsd:0,features:['5 coins']},{id:'pro',name:'Pro Trader',priceUsd:19,yearlyPriceUsd:149,features:['Premium feed']},{id:'vip',name:'VIP Whale / Quant',priceUsd:49,yearlyPriceUsd:399,features:['Read-only client API']}];
const click=async text=>{const button=[...document.querySelectorAll('button')].find(button=>button.textContent===text);assert.ok(button,`Missing button ${text}`);assert.equal(button.disabled,false,`Disabled button ${text}`);await act(async()=>button.click());};
function component(api,user,send) {
 return load('../src/components/PricingModal.tsx',{
  '@/contexts/AppContext':{useAppContext:()=>({user,refreshUser:async()=>{},linkWallet:async()=>true})},
  '@/contexts/WalletContext':{useWallet:()=>({connectWallet:async()=>({account:payer,provider:{send:async()=> '0x89',getSigner:async()=>({getAddress:async()=>payer,sendTransaction:send})}})})},
  '@/services/api':{api},'@/components/ui/dialog':Dialog,'@/lib/subscription':sub,'@/lib/payment':payment,
  '@/lib/utils':{parseWeb3Error:error=>({description:error.message})},'@/components/ClientApiKeys':{default:()=>null},
 }).default;
}
test('checkout requires review, preserves a submitted hash during outages, and activates only after server confirmation',async()=>{
 const sends=[],creates=[];let mode='outage';
 const api={billing:{getPlans:async()=>({data:{version:2,plans,treasury:{EVM:recipient,paymentMethods:[method]}}}),intents:async()=>({data:{intents:[]}}),createIntent:async data=>{creates.push(data);return {data:{intent:invoice}};},submitTx:async()=>{if(mode==='outage') throw Error('Network unavailable; do not pay again');return {data:{status:'confirmed',success:true,intent:{...invoice,status:'confirmed',tx_hash:'0x'+'a'.repeat(64)}}};}}};
 const user={id:'user-a',wallet_address:payer,tier:'free'};
 const Component=component(api,user,async tx=>{sends.push(tx);return {hash:'0x'+'a'.repeat(64)};});const root=createRoot(document.getElementById('root'));
 try {
  await act(async()=>root.render(h(Component,{open:true,onClose(){}})));
  assert.match(document.body.textContent,/Pro Trader/);assert.match(document.body.textContent,/VIP Whale/);
  await click('Create invoice to review');assert.equal(sends.length,0);assert.equal(creates[0].method,'polygon-usdc');
  await click('Review USDC payment in MetaMask');assert.equal(sends.length,1);assert.equal(sends[0].value,0n);
  assert.match(document.body.textContent,/do not pay again/);
  const payButton=[...document.querySelectorAll('button')].find(button=>button.textContent==='Review USDC payment in MetaMask');assert.equal(payButton.disabled,true);
  assert.equal(JSON.parse(localStorage.getItem('cryptox:payment:user-a')).txHash,'0x'+'a'.repeat(64));
  mode='confirmed';const form=document.querySelector('form');await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
  assert.match(document.body.textContent,/Payment verified/);assert.equal(sends.length,1);assert.equal(localStorage.getItem('cryptox:payment:user-a'),null);
 } finally {await act(async()=>root.unmount());}
});
test('older backend configuration disables checkout instead of requesting a payment',async()=>{
 let creates=0,sends=0;
 const api={billing:{getPlans:async()=>({data:{plans,treasury:{EVM:recipient,acceptedTokens:[]}}}),intents:async()=>({data:{intents:[]}}),createIntent:async()=>{creates++;}}};
 const Component=component(api,{id:'user-b',wallet_address:payer,tier:'free'},async()=>{sends++;});const root=createRoot(document.getElementById('root'));
 try {await act(async()=>root.render(h(Component,{open:true,onClose(){}})));assert.match(document.body.textContent,/server update is complete/);const button=[...document.querySelectorAll('button')].find(button=>button.textContent==='Create invoice to review');assert.equal(button.disabled,true);assert.equal(creates,0);assert.equal(sends,0);}finally{await act(async()=>root.unmount());}
});
