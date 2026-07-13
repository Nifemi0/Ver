import re

with open("public/index.html", "r") as f:
    content = f.read()

# Typography
content = content.replace('family=Geist:wght@100..900&amp;family=Inter:wght@100..900', 'family=IBM+Plex+Mono:wght@400;500;600;700&amp;family=Inter:wght@100..900')
content = content.replace('"Geist"', '"IBM Plex Mono"')
content = content.replace('"jetbrainsMono"', '"IBM Plex Mono"')

# Colors - replace indigo/purple with terminal green #00FF41 or stark black/white
content = content.replace('#4f46e5', '#00FF41') # primary-container in tailwind config
content = content.replace('#4F46E5', '#00FF41') # canvas color accent
content = content.replace('bg-primary-container', 'bg-[#00FF41] text-black')
content = content.replace('text-primary-container', 'text-[#00FF41]')
content = content.replace('border-primary-container', 'border-[#00FF41]')
content = content.replace('ring-primary-container', 'ring-[#00FF41]')
content = content.replace('text-white font-label-md text-label-md rounded hover:bg-primary-container/90', 'text-black font-label-md text-label-md border-2 border-black hover:bg-[#00cc33]')

# Remove rounded corners
content = re.sub(r'rounded-(xl|lg|md|sm|full)', '', content)
content = content.replace('rounded', '')

# Brutalist shadows and borders
content = content.replace('shadow-ambient', 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]')
content = content.replace('shadow-sm', 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]')
content = content.replace('shadow-md', 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]')

# Remove glassmorphism
content = content.replace('bg-surface/80 backdrop-blur-xl dark:bg-surface-container-lowest/80', 'bg-white border-b-2 border-black')
content = content.replace('glass-panel', 'bg-white border-2 border-black')

with open("public/index.html", "w") as f:
    f.write(content)

print("Rewrote index.html for brutalist design")
