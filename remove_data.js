import fs from 'fs';
const content = fs.readFileSync('src/pages/Screener/screener.tsx', 'utf8');
const lines = content.split('\n');

const taxStart = lines.findIndex(l => l.includes('const TAX = { '));
const clsDataEnd = lines.findIndex((l, index) => index > taxStart && l.includes('declare global {'));

if (taxStart > -1 && clsDataEnd > -1) {
    const newLines = [
        ...lines.slice(0, taxStart),
        "import { TAX, COMPANIES, GOLDEN, CLSDATA } from './filterData';",
        ...lines.slice(clsDataEnd)
    ];
    fs.writeFileSync('src/pages/Screener/screener.tsx', newLines.join('\n'));
    console.log('Successfully replaced data with import statement.');
} else {
    console.log('Could not find start or end markers:', { taxStart, clsDataEnd });
}
