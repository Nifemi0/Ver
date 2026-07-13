const fs = require('fs');

if (fs.existsSync('interactive_graph.html')) {
    fs.renameSync('interactive_graph.html', 'index.html');
}

const files = ['index.html', 'docs.html', 'explorer.html'];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, 'utf8');

    // Make the logo click through to index.html
    const oldNavLeftRegex = /<div id="navLeft" class="flex items-center gap-2 w-1\/3 transition-all duration-300 px-4 py-2 rounded-full border border-transparent">/;
    const newNavLeft = `<a href="index.html" id="navLeft" class="flex items-center gap-2 w-1/3 transition-all duration-300 px-4 py-2 rounded-full border border-transparent hover:bg-gray-50/50 cursor-pointer">`;
    html = html.replace(oldNavLeftRegex, newNavLeft);
    // Wait, since I replaced <div id="navLeft"> with <a id="navLeft">, I need to make sure there's no closing </div> for navLeft that needs to become </a>.
    // navLeft looks like:
    /*
        <div id="navLeft" ...>
            <span class="material-symbols-outlined ...>hexagon</span>
            <span class="font-serif ...>HashGraph</span>
        </div>
    */
    // This regex replaces the opening tag and the closing tag.
    html = html.replace(
        /(<a href="index.html" id="navLeft"[\s\S]*?<\/span>\s*)<\/div>/,
        '$1</a>'
    );
    
    // In index.html specifically, we have the footer logo too
    const footerLogoRegex = /<div class="flex items-center gap-2 text-gray-900">\s*<span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">hexagon<\/span>\s*<span class="font-serif font-bold text-lg">HashGraph<\/span>\s*<\/div>/g;
    const newFooterLogo = `<a href="index.html" class="flex items-center gap-2 text-gray-900 hover:text-black transition-colors">
                <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">hexagon</span>
                <span class="font-serif font-bold text-lg">HashGraph</span>
            </a>`;
    html = html.replace(footerLogoRegex, newFooterLogo);

    fs.writeFileSync(file, html);
}
