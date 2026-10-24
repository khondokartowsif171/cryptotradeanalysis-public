import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { randomUUID,createHash } from 'node:crypto';
import express from 'express';
import { PGlite } from '@electric-sql/pglite';
import { Interface,Wallet } from 'ethers';
import { BillingStore,loadClientUser } from '../dist/billing/store.js';
import { WalletAuth } from '../dist/billing/walletAuth.js';
import { verifyReceipt } from '../dist/billing/verify.js';
import { createBillingRouter } from '../dist/billing/router.js';
import { createWatchlistRouter } from '../dist/routes/watchlist.js';
import { createPortfolioRouter } from '../dist/routes/portfolio.js';
import { createApiKeyRouter,createClientApiRouter } from '../dist/routes/clientApi.js';
import { generateToken } from '../dist/middleware/auth.js';
const tokenInterface = new Interface(['event Transfer(address indexed from,address indexed to,uint256 value)']);
const hash = suffix => '0x'+suffix.toString(16).padStart(64,'0');
function rpcFixture(intent, overrides = {}) {
  const transactionHash=overrides.txHash || hash(1), blockHash=hash(200);
  const event=tokenInterface.encodeEventLog('Transfer',[overrides.from || intent.payer_address,overrides.to || intent.treasury_address,overrides.amount ?? BigInt(intent.amount_units)]);
  const receipt={transactionHash,status:'0x1',blockHash,blockNumber:'0x64',logs:[{address:intent.token_address,...event}],...overrides.receipt};
  return async method => {
    if(method==='eth_chainId') return overrides.chain || '0x'+intent.chain_id.toString(16);
    if(method==='eth_getTransactionReceipt') return overrides.notMined ? null : receipt;
    if(method==='eth_blockNumber') return '0x'+(99+(overrides.confirmations ?? intent.required_confirmations)).toString(16);
    if(method==='eth_getBlockByNumber') return {hash:overrides.blockHash || blockHash,timestamp:'0x'+Math.floor((overrides.timestamp || Date.now())/1000).toString(16)};
    throw Error('Unexpected RPC: '+method);
  };
}
test('verified billing, wallet identity and plan limits use PostgreSQL', {timeout:90000}, async t => {
  const pg=new PGlite();
  await pg.exec(readFileSync(new URL('../migrations/001_init.sql',import.meta.url),'utf8'));
  await pg.exec("ALTER TABLE users ADD COLUMN tier TEXT; ALTER TABLE users ADD COLUMN tier_expires_at TIMESTAMPTZ;");
  const legacy=randomUUID();
  await pg.query("INSERT INTO users(id,email,password_hash,tier,tier_expires_at) VALUES($1,'legacy@example.test','not-used','vip',NOW()+INTERVAL '7 days')",[legacy]);
  const migration=readFileSync(new URL('../migrations/002_verified_billing.sql',import.meta.url),'utf8'); await pg.exec(migration);
  const db={query:(sql,values)=>pg.query(sql,values),transaction:work=>pg.transaction(tx=>work((sql,values)=>tx.query(sql,values)))};
  const store=new BillingStore(db), walletA=Wallet.createRandom(),walletB=Wallet.createRandom();
  const alice=randomUUID(),bob=randomUUID(),charlie=randomUUID();
  for(const [id,email,address] of [[alice,'alice@example.test',walletA.address],[bob,'bob@example.test',walletB.address],[charlie,'charlie@example.test',null]]) await db.query('INSERT INTO users(id,email,wallet_address) VALUES($1,$2,$3)',[id,email,address?.toLowerCase() || null]);
  const sessions={}; for(const id of [alice,bob,charlie]) sessions[id]=generateToken({userId:id,email:id+'@example.test'});
  let verificationCalls=0, mode='confirmed';
  const app=express(); app.use(express.json());
  app.use('/billing',createBillingRouter(db,async(intent,txHash)=>{
    verificationCalls++; if(mode==='outage') throw Error('simulated RPC outage');
    return verifyReceipt(intent,txHash,rpcFixture(intent,{txHash,...(mode==='pending'?{confirmations:1}:{})}));
  }));
  app.use('/watchlist',createWatchlistRouter(db.query)); app.use('/portfolio',createPortfolioRouter(db.query));
  app.use('/client-api/keys',createApiKeyRouter(db)); app.use('/client-api',createClientApiRouter(db));
  const http=app.listen(0,'127.0.0.1'); await once(http,'listening'); const base=`http://127.0.0.1:${http.address().port}`;
  const call=async(path,body,user=alice,method=body?'POST':'GET')=>{
    const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(user?{Authorization:'Bearer '+(sessions[user]||user)}:{})},...(body?{body:JSON.stringify(body)}:{})});
    return {status:response.status,body:await response.json()};
  };
  t.after(async()=>{await new Promise(resolve=>http.close(resolve));await pg.close();});
  let first;
  await t.test('rejects hash-only activation and unlinked/unsupported invoices; isolates invoice ownership',async()=>{
    assert.equal((await call('/billing/intents',{plan:'pro',method:'polygon-usdc'},null)).status,401);
    assert.equal((await call('/billing/submit-tx',{plan:'vip',txHash:hash(1),token:'ETH',network:'Ethereum'})).status,400);
    assert.equal((await call('/billing/intents',{plan:'pro',method:'polygon-usdc'},charlie)).status,409);
    assert.equal((await call('/billing/intents',{plan:'pro',method:'fake-token'})).status,400);
    const result=await call('/billing/intents',{plan:'pro',method:'polygon-usdc'}); assert.equal(result.status,201,JSON.stringify(result.body)); first=result.body.intent;
    assert.equal(first.amount_units,'19000000'); assert.equal(first.chain_id,137);
    assert.equal((await call('/billing/intents',{plan:'pro',method:'polygon-usdc'})).body.intent.id,first.id);
    assert.equal((await loadClientUser(db.query,alice)).tier,'free');
    assert.equal((await loadClientUser(db.query,legacy)).tier,'vip');
    assert.equal((await call('/billing/submit-tx',{intentId:first.id,txHash:hash(1)},bob)).status,404); assert.equal(verificationCalls,0);
  });
  await t.test('rejects wrong sender, recipient, token, amount, chain, date, failed transaction and reorg',async()=>{
    for(const overrides of [{from:walletB.address},{to:walletB.address},{amount:1n},{receipt:{logs:[]}},{receipt:{status:'0x0'}},{receipt:{transactionHash:hash(9)}},{chain:'0x1'},{timestamp:new Date(first.created_at).getTime()-60000},{timestamp:new Date(first.expires_at).getTime()+60000},{blockHash:hash(999)}]) await assert.rejects(()=>verifyReceipt(first,hash(1),rpcFixture(first,overrides)));
    const counterfeit=tokenInterface.encodeEventLog('Transfer',[first.payer_address,first.treasury_address,19000000n]);
    await assert.rejects(()=>verifyReceipt(first,hash(1),rpcFixture(first,{receipt:{logs:[{...counterfeit,address:walletB.address}]}})));
    const pending=await verifyReceipt(first,hash(1),rpcFixture(first,{confirmations:63})); assert.equal(pending.pending,true); assert.equal(pending.confirmations,63);
    assert.equal((await verifyReceipt(first,hash(1),rpcFixture(first,{notMined:true}))).pending,true);
    assert.equal((await verifyReceipt(first,hash(1),rpcFixture(first))).pending,false);
  });
  await t.test('pending confirmations and outages never activate a tier',async()=>{
    mode='pending';assert.equal((await call('/billing/submit-tx',{intentId:first.id,txHash:hash(1)})).status,202);
    assert.equal((await loadClientUser(db.query,alice)).tier,'free');
    mode='outage';assert.equal((await call('/billing/submit-tx',{intentId:first.id,txHash:hash(1)})).status,503);
    assert.equal((await loadClientUser(db.query,alice)).tier,'free');mode='confirmed';
  });
  await t.test('verified payment activates once; retries and duplicate hashes never grant again',async()=>{
    const result=await call('/billing/submit-tx',{intentId:first.id,txHash:hash(1)}); assert.equal(result.status,200,JSON.stringify(result.body)); assert.equal(result.body.user.tier,'pro');
    const expiry=(await loadClientUser(db.query,alice)).tier_expires_at;
    assert.equal((await call('/billing/submit-tx',{intentId:first.id,txHash:hash(1)})).status,200);
    assert.equal(+new Date((await loadClientUser(db.query,alice)).tier_expires_at),+new Date(expiry));
    assert.equal((await db.query('SELECT * FROM verified_payments')).rows.length,1);
    assert.equal((await db.query("SELECT * FROM subscription_grants WHERE source_id LIKE 'payment:%'")).rows.length,1);
    const invoice=(await call('/billing/intents',{plan:'pro',cycle:'yearly',method:'polygon-usdc'})).body.intent;
    assert.equal((await call('/billing/submit-tx',{intentId:invoice.id,txHash:hash(1)})).status,409);
    assert.equal((await call('/billing/intents',null,bob)).body.intents.length,0);
    assert.equal((await call('/portfolio',null,bob)).status,403);
  });
  await t.test('free watchlist limits and paid private portfolio access are enforced on the server',async()=>{
    const six=['btc','eth','sol','bnb','xrp','ada'];
    assert.equal((await call('/watchlist',{coin_ids:six},bob,'PUT')).status,403);
    assert.equal((await call('/watchlist',{coin_ids:six.slice(0,5)},bob,'PUT')).status,200);
    assert.equal((await call('/watchlist',{coin_ids:six},alice,'PUT')).status,200);
    assert.equal((await call('/portfolio',{holdings:[{symbol:'BTC',amount:2}]},alice,'PUT')).status,200);
    assert.equal((await call('/portfolio',null,alice)).body.portfolio[0].amount,2);
    assert.equal((await call('/portfolio',{holdings:[{symbol:'BTC',amount:-1}]},alice,'PUT')).status,400);
    assert.equal((await call('/client-api/keys',{name:'Pro cannot create VIP key'},alice)).status,403);
  });
  await t.test('concurrent retries are idempotent and failed grants roll back payment ownership',async()=>{
    const intent=await store.create(alice,'pro','monthly','ethereum-usdc');
    const proof=(await verifyReceipt(intent,hash(2),rpcFixture(intent,{txHash:hash(2)}))).payment;
    const prior=+new Date((await loadClientUser(db.query,alice)).tier_expires_at);
    await Promise.all([store.confirm(alice,intent.id,hash(2),proof),store.confirm(alice,intent.id,hash(2),proof)]);
    const next=+new Date((await loadClientUser(db.query,alice)).tier_expires_at);assert.ok(Math.abs((next-prior)-30*86400000)<1000);
    const another=await store.create(bob,'pro','monthly','polygon-usdc');
    const broken=new BillingStore({query:db.query,transaction:work=>db.transaction(query=>work((sql,values)=>{if(sql.startsWith('INSERT INTO subscription_grants')) throw Error('simulated storage failure');return query(sql,values);} ))});
    await assert.rejects(()=>broken.confirm(bob,another.id,hash(3),proof));
    assert.equal((await db.query('SELECT * FROM verified_payments WHERE tx_hash=$1',[hash(3)])).rows.length,0);assert.equal((await loadClientUser(db.query,bob)).tier,'free');
  });
  await t.test('wallet challenges bind signatures to purpose and account and are consumed once',async()=>{
    const wallets=new WalletAuth(db), message='arbitrary signed message';
    const arbitrarySignature=await walletB.signMessage(message); await assert.rejects(()=>wallets.verify(walletB.address,arbitrarySignature,message));
    async function signedIssue(wallet,purpose='login',userId=null){const result=await wallets.issue(wallet.address,purpose,userId);return {message:result.nonce,signature:await wallet.signMessage(result.nonce)};}
    const issued=await signedIssue(walletB);assert.equal((await wallets.verify(walletB.address,issued.signature,issued.message)).id,bob);await assert.rejects(()=>wallets.verify(walletB.address,issued.signature,issued.message));
    const expired=await signedIssue(walletB);await db.query("UPDATE wallet_challenges SET expires_at=NOW()-INTERVAL '1 second' WHERE message=$1",[expired.message]);await assert.rejects(()=>wallets.verify(walletB.address,expired.signature,expired.message));
    const fresh=Wallet.createRandom(),link=await signedIssue(fresh,'link',charlie);await assert.rejects(()=>wallets.verify(fresh.address,link.signature,link.message));assert.equal((await wallets.verify(fresh.address,link.signature,link.message,'link',charlie)).id,charlie);
    const wrong=await signedIssue(walletA,'link',charlie);await assert.rejects(()=>wallets.verify(walletA.address,wrong.signature,wrong.message,'link',charlie));
    const login=await signedIssue(walletB);await assert.rejects(()=>wallets.verify(walletA.address,login.signature,login.message));
  });
  await t.test('VIP keys are hashed and isolated; paid expiry immediately removes access and preserves earlier annual Pro',async()=>{
    const annual=await store.create(alice,'pro','yearly','arbitrum-usdc');const annualProof=(await verifyReceipt(annual,hash(4),rpcFixture(annual,{txHash:hash(4)}))).payment;await store.confirm(alice,annual.id,hash(4),annualProof);
    const vip=await store.create(alice,'vip','monthly','base-usdc');const vipProof=(await verifyReceipt(vip,hash(5),rpcFixture(vip,{txHash:hash(5)}))).payment;await store.confirm(alice,vip.id,hash(5),vipProof);
    assert.equal((await loadClientUser(db.query,alice)).tier,'vip');
    const key=await call('/client-api/keys',{name:'Test read-only bot'});assert.equal(key.status,201,JSON.stringify(key.body));
    const stored=(await db.query('SELECT key_hash FROM client_api_keys WHERE id=$1',[key.body.details.id])).rows[0];assert.equal(stored.key_hash,createHash('sha256').update(key.body.key).digest('hex'));assert.notEqual(stored.key_hash,key.body.key);
    assert.equal((await call('/client-api/keys',null,bob)).body.keys.length,0);
    assert.equal((await call('/client-api/portfolio',null,key.body.key)).body.portfolio[0].amount,2);
    await db.query("UPDATE subscription_grants SET starts_at=NOW()-INTERVAL '2 days',ends_at=NOW()-INTERVAL '1 second' WHERE user_id=$1 AND tier='vip'",[alice]);
    assert.equal((await loadClientUser(db.query,alice)).tier,'pro');assert.equal((await call('/client-api/portfolio',null,key.body.key)).status,403);
    assert.equal((await call('/client-api/keys/'+key.body.details.id,null,bob,'DELETE')).status,404);assert.equal((await call('/client-api/keys/'+key.body.details.id,null,alice,'DELETE')).status,200);assert.equal((await call('/client-api/portfolio',null,key.body.key)).status,401);
    await db.query("UPDATE subscription_grants SET starts_at=NOW()-INTERVAL '2 days',ends_at=NOW()-INTERVAL '1 day' WHERE user_id=$1",[alice]);
    assert.equal((await loadClientUser(db.query,alice)).tier,'free');assert.equal((await call('/portfolio',null,alice)).status,403);assert.equal((await call('/watchlist',null,alice)).body.watchlist.length,5);
  });
  await t.test('migration reruns never resurrect expired access from a stale cached tier',async()=>{await pg.exec(migration);assert.equal((await loadClientUser(db.query,alice)).tier,'free');assert.equal((await db.query('SELECT * FROM verified_payments')).rows.length,4);});
});
