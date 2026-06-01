const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
    { regex: /(?<!dark:)bg-white/g, replace: 'bg-white dark:bg-slate-900' },
    { regex: /(?<!dark:)bg-gray-50/g, replace: 'bg-gray-50 dark:bg-slate-800' },
    { regex: /(?<!dark:)bg-gray-100/g, replace: 'bg-gray-100 dark:bg-slate-800' },
    { regex: /(?<!dark:)text-gray-900/g, replace: 'text-gray-900 dark:text-gray-100' },
    { regex: /(?<!dark:)text-gray-800/g, replace: 'text-gray-800 dark:text-gray-200' },
    { regex: /(?<!dark:)text-gray-700/g, replace: 'text-gray-700 dark:text-gray-300' },
    { regex: /(?<!dark:)text-gray-600/g, replace: 'text-gray-600 dark:text-gray-400' },
    { regex: /(?<!dark:)text-gray-500/g, replace: 'text-gray-500 dark:text-gray-400' },
    { regex: /(?<!dark:)border-gray-200/g, replace: 'border-gray-200 dark:border-slate-700' },
    { regex: /(?<!dark:)border-gray-300/g, replace: 'border-gray-300 dark:border-slate-600' },
    { regex: /(?<!dark:)hover:bg-gray-50/g, replace: 'hover:bg-gray-50 dark:hover:bg-slate-800' },
    { regex: /(?<!dark:)hover:bg-gray-100/g, replace: 'hover:bg-gray-100 dark:hover:bg-slate-700' },
    { regex: /(?<!dark:)bg-blue-500/g, replace: 'bg-blue-500 dark:bg-blue-600' },
    { regex: /(?<!dark:)hover:bg-blue-600/g, replace: 'hover:bg-blue-600 dark:hover:bg-blue-500' }
];

function processFile(filePath) {
    if (!filePath.endsWith('.jsx')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // To prevent double adding if script is run multiple times,
    // we only replace if there's no dark: equivalent already attached to the same class in a naive way.
    // The negative lookbehind `(?<!dark:)` helps, but we should also check if `dark:bg-slate-900` is already in the string.
    // If the file already contains `dark:bg-slate-900`, it might have been processed.

    replacements.forEach(({ regex, replace }) => {
        content = content.replace(regex, (match) => {
            // Check if the match is already followed by the dark class (rough check)
            // It's safer to just let the negative lookbehind handle it, but what if it's "bg-white text-gray-900 dark:bg-slate-900"?
            // A simple regex might duplicate.
            // Let's refine: replace only standalone classes.
            return replace;
        });
    });

    // Cleanup potential duplicates like "bg-white dark:bg-slate-900 dark:bg-slate-900"
    content = content.replace(/dark:bg-slate-900\s+dark:bg-slate-900/g, 'dark:bg-slate-900');
    content = content.replace(/dark:bg-slate-800\s+dark:bg-slate-800/g, 'dark:bg-slate-800');
    content = content.replace(/dark:text-gray-100\s+dark:text-gray-100/g, 'dark:text-gray-100');
    content = content.replace(/dark:text-gray-200\s+dark:text-gray-200/g, 'dark:text-gray-200');
    content = content.replace(/dark:text-gray-300\s+dark:text-gray-300/g, 'dark:text-gray-300');
    content = content.replace(/dark:text-gray-400\s+dark:text-gray-400/g, 'dark:text-gray-400');
    content = content.replace(/dark:border-slate-700\s+dark:border-slate-700/g, 'dark:border-slate-700');
    content = content.replace(/dark:border-slate-600\s+dark:border-slate-600/g, 'dark:border-slate-600');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', filePath);
    }
}

function traverseDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDirectory(fullPath);
        } else {
            processFile(fullPath);
        }
    }
}

traverseDirectory(directoryPath);
console.log('Done replacing dark mode classes!');
