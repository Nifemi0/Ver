const fs = require('fs');

let html = fs.readFileSync('interactive_graph.html', 'utf8');

// 1. Slow down the base particle drift (0.3 -> 0.08)
html = html.replace(/this\.vx = \(Math\.random\(\) - 0\.5\) \* 0\.3;/g, 'this.vx = (Math.random() - 0.5) * 0.08;');
html = html.replace(/this\.vy = \(Math\.random\(\) - 0\.5\) \* 0\.3;/g, 'this.vy = (Math.random() - 0.5) * 0.08;');

// 2. Reduce the mouse repulsion speed (1.0 -> 0.4)
html = html.replace(/this\.x -= forceDirectionX \* force \* 1\.0;/g, 'this.x -= forceDirectionX * force * 0.4;');
html = html.replace(/this\.y -= forceDirectionY \* force \* 1\.0;/g, 'this.y -= forceDirectionY * force * 0.4;');

// 3. Lower the edge opacities (0.25 -> 0.1, 0.5 -> 0.2, 0.8 -> 0.4)
html = html.replace(/opacityValue \* 0\.25\)/g, 'opacityValue * 0.10)');
html = html.replace(/opacityValue \* 0\.5\)/g, 'opacityValue * 0.20)');
html = html.replace(/opacityValue \* 0\.8\)/g, 'opacityValue * 0.40)');

fs.writeFileSync('interactive_graph.html', html);
