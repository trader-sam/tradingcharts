import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const server = spawn('npm.cmd', ['run','dev','--','--host','127.0.0.1'], { stdio:'ignore', shell:true });
await new Promise(r=>setTimeout(r,1200));
try { const browser=await chromium.launch({headless:true}); const page=await browser.newPage({viewport:{width:1280,height:900}}); await page.goto('http://127.0.0.1:5173/benchmarks.html'); await page.waitForFunction(()=>typeof window.runBenchmarks==='function'); const result=await page.evaluate(async()=>await window.runBenchmarks()); await writeFile('benchmark-results.json',JSON.stringify({timestamp:new Date().toISOString(),...result},null,2)); console.log(JSON.stringify(result,null,2)); await browser.close(); } finally { server.kill(); }
