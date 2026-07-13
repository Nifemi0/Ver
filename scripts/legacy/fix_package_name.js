const fs = require('fs');

const files = ['index.html', 'docs.html'];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, 'utf8');
    
    // Replace @hashgraph/sdk with @hashkey/hashgraph-sdk
    html = html.replace(/@hashgraph\/sdk/g, '@hashkey/hashgraph-sdk');
    
    // Replace @hashgraph/cli with @hashkey/hashgraph-cli
    html = html.replace(/@hashgraph\/cli/g, '@hashkey/hashgraph-cli');
    
    // Replace @hashgraph/mcp-server with @hashkey/hashgraph-mcp
    html = html.replace(/@hashgraph\/mcp-server/g, '@hashkey/hashgraph-mcp');
    
    fs.writeFileSync(file, html);
}
