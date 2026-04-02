import fs from 'fs';

let content = fs.readFileSync('src/pages/Screener/filterData.tsx', 'utf8');

// Fix duplicate qcBy
content = content.replace(/qcBy:\s*'',\s*qcBy:\s*''/g, "qcBy: ''");

// Avoid unused generic vars
content = content.replace('const YEARS =', 'export const YEARS =');
content = content.replace('let darkMode =', 'export let darkMode =');
content = content.replace('let currentPage =', 'export let currentPage =');
content = content.replace('let currentParams =', 'export let currentParams =');
content = content.replace('let currentRole =', 'export let currentRole =');
content = content.replace('let currentUser =', 'export let currentUser =');
content = content.replace('const ROLE_DEF =', 'export const ROLE_DEF =');
content = content.replace('const ROLE_USERS =', 'export const ROLE_USERS =');
content = content.replace('let WORKBENCH = [', 'export let WORKBENCH: any[] = [');

// Fix the typed vars
content = content.replace('let COMPANIES = [', 'let COMPANIES: any[] = [');
content = content.replace('let GOLDEN = [', 'let GOLDEN: any[] = [');
content = content.replace('let CLSDATA = {', 'let CLSDATA: Record<string, any> = {');
content = content.replace('const TAX = {', 'const TAX: any = {');

fs.writeFileSync('src/pages/Screener/filterData.tsx', content);
console.log('Fixed filterData.tsx');
