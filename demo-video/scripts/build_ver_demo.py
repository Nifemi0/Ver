#!/usr/bin/env python3
"""
Ver Protocol animated demo builder.
- Copper/obsidian brand motion slides (multi-frame animation per scene)
- edge-tts VO
- xfade-ish cuts + ken-burns via frame sequences
- Captions + 40% ambient bed (final mux)
"""
from __future__ import annotations

import math
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path("/root/xlayer/demo-video")
PUBLIC = ROOT / "public"
OUT = ROOT / "out"
WORK = Path("/tmp/ver-demo-work")
WORK.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1280, 720
FPS = 30
PAD = 0.30

# Brand
BG = (11, 12, 14)          # obsidian
COPPER = (200, 122, 83)
COPPER_DIM = (67, 33, 17)
WHITE = (226, 232, 240)
MUTED = (148, 163, 184)
CARD = (18, 20, 24)
BORDER = (40, 44, 52)
VIOLET = (167, 139, 250)
GREEN = (52, 211, 153)
BLUE = (96, 165, 250)

SCENES = [
    {
        "audio": "v01-intro.mp3",
        "kicker": "X LAYER · OKX AI GENESIS",
        "title": "Ver Protocol",
        "subtitle": "Deterministic by design. Explainable by AI.",
        "mode": "hero",
        "chips": ["Protocol Graphs", "MCP", "Intent → Calldata"],
        "cues": [
            (0.02, 0.35, "Ver Protocol."),
            (0.32, 0.60, "Deterministic by design. Explainable by AI."),
            (0.58, 0.98, "X Layer contracts → Protocol Graphs\nagents can trust."),
        ],
    },
    {
        "audio": "v02-problem.mp3",
        "kicker": "THE PROBLEM",
        "title": "Agents guess ABIs",
        "mode": "cards",
        "cards": [
            ("!", "Hallucinated fns", "Free-text ABIs break tools"),
            ("!", "Wrong decimals", "Unsafe amounts in calldata"),
            ("!", "No simulation", "Sign first, pray later"),
        ],
        "cues": [
            (0.02, 0.40, "Agents and IDEs treat contract ABIs\nlike free text."),
            (0.38, 0.72, "Hallucinated functions. Wrong decimals."),
            (0.70, 0.98, "Unsafe calldata."),
        ],
    },
    {
        "audio": "v03-graph.mp3",
        "kicker": "PROTOCOL GRAPH",
        "title": "Compile chain facts",
        "mode": "pipeline",
        "steps": ["Bytecode / ABI", "Deterministic parser", "Protocol Graph", "MCP / API"],
        "cues": [
            (0.02, 0.40, "Bytecode + ABIs → deterministic\nProtocol Graph."),
            (0.38, 0.72, "Roles, events, privileges, structure."),
            (0.70, 0.98, "Facts from chain — not model guesses."),
        ],
    },
    {
        "audio": "v04-intent.mp3",
        "kicker": "INTENT COMPILER",
        "title": "NL → verified calldata",
        "mode": "intent",
        "intent": '“Transfer 10 USDT to 0x1111…1111”',
        "result": "exact EVM calldata + eth_call check",
        "cues": [
            (0.02, 0.40, "Natural language intent →"),
            (0.38, 0.72, "exact EVM calldata,"),
            (0.70, 0.98, "checked with static eth_call\nbefore anything is signed."),
        ],
    },
    {
        "audio": "v05-mcp.mp3",
        "kicker": "A2MCP SURFACE",
        "title": "One command for agents",
        "mode": "code",
        "code": "npx -y aic-mcp",
        "tools": ["Claude", "Cursor", "Hermes", "Onchain OS"],
        "cues": [
            (0.02, 0.35, "Ship it where agents live."),
            (0.33, 0.65, "npx -y aic-mcp"),
            (0.63, 0.98, "Claude · Cursor · Hermes · Onchain OS\ncall Ver as an MCP skill."),
        ],
    },
    {
        "audio": "v06-live.mp3",
        "kicker": "LIVE",
        "title": "Try it on X Layer",
        "mode": "links",
        "links": [
            ("Site", "verprotocol.vercel.app"),
            ("GitHub", "github.com/Nifemi0/Ver"),
            ("npm", "aic-mcp"),
            ("Chain", "X Layer"),
        ],
        "cues": [
            (0.02, 0.40, "Live on X Layer."),
            (0.38, 0.70, "Compile any verified contract\nat verprotocol.vercel.app"),
            (0.68, 0.98, "Open API · open source · npm aic-mcp"),
        ],
    },
    {
        "audio": "v07-close.mp3",
        "kicker": "#OKXAI",
        "title": "Ver Protocol",
        "subtitle": "Protocol Graphs for agents",
        "mode": "close",
        "tagline": "Facts from chain. AI only annotates.",
        "cues": [
            (0.02, 0.35, "Ver Protocol."),
            (0.32, 0.68, "Protocol Graphs for agents."),
            (0.66, 0.98, "Facts from chain. AI only annotates."),
        ],
    },
]


def font(size: int, bold: bool = False):
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in paths:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def dur(path: Path) -> float:
    return float(
        subprocess.check_output(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(path),
            ],
            text=True,
        ).strip()
    )


def lerp(a, b, t):
    return a + (b - a) * t


def ease(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def draw_bg(img: Image.Image, t: float, seed: int = 0):
    """Animated ambient orbs."""
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for i, (bx, by, r, col) in enumerate([
        (0.5, 0.25, 320, (*COPPER, 40)),
        (0.15, 0.75, 220, (80, 40, 30, 35)),
        (0.85, 0.7, 200, (40, 50, 80, 30)),
    ]):
        phase = t * 2 * math.pi + seed + i
        cx = int(W * (bx + 0.03 * math.sin(phase)))
        cy = int(H * (by + 0.02 * math.cos(phase * 0.8)))
        rr = int(r * (1 + 0.05 * math.sin(phase * 1.3)))
        od.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=col)
    blurred = overlay.filter(ImageFilter.GaussianBlur(radius=40))
    out = Image.alpha_composite(img.convert("RGBA"), blurred).convert("RGB")
    return out


def rounded(draw, xy, r, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)


def header(draw, kicker: str, progress: float):
    # progress bar
    draw.rectangle((0, 0, W, 3), fill=BORDER)
    draw.rectangle((0, 0, int(W * progress), 3), fill=COPPER)
    # brand
    rounded(draw, (40, 28, 88, 76), 10, COPPER)
    draw.text((54, 36), "V", font=font(26, True), fill=(11, 12, 14))
    draw.text((100, 32), "Ver", font=font(22, True), fill=WHITE)
    draw.text((100, 56), "Protocol Graphs for Agents", font=font(12), fill=MUTED)
    draw.text((W - 280, 42), kicker, font=font(13, True), fill=COPPER)


def scene_frame(scene: dict, local_t: float, scene_idx: int, n_scenes: int) -> Image.Image:
    """local_t in [0,1] within scene."""
    e = ease(min(1.0, local_t * 1.4))  # entrance
    img = Image.new("RGB", (W, H), BG)
    img = draw_bg(img, local_t + scene_idx * 0.37, seed=scene_idx)
    draw = ImageDraw.Draw(img)
    progress = (scene_idx + local_t) / n_scenes
    header(draw, scene["kicker"], progress)

    mode = scene["mode"]
    title_y = int(lerp(160, 130, e))

    # title — pure white, no blending, no backdrops
    title = scene["title"]
    
    # Shadow for readability (2px offset, dark)
    if e > 0.05:
        draw.text((47, title_y - 1), title, font=font(44, True), fill=(0, 0, 0, 120))
        draw.text((49, title_y + 1), title, font=font(44, True), fill=(0, 0, 0, 120))
    draw.text((48, title_y), title, font=font(44, True), fill=(255, 255, 255))

    if scene.get("subtitle"):
        st = scene["subtitle"]
        sty = title_y + 58
        if e > 0.05:
            draw.text((47, sty - 1), st, font=font(22), fill=(0, 0, 0, 100))
            draw.text((49, sty + 1), st, font=font(22), fill=(0, 0, 0, 100))
        draw.text((48, sty), st, font=font(22), fill=(226, 232, 240))

    # ink helper for card/chip backgrounds (not text)
    def ink(c, a):
        return tuple(int(c[i] * a + BG[i] * (1 - a)) for i in range(3))

    if mode == "hero":
        chips = scene.get("chips", [])
        x = 48
        y = 280
        for i, chip in enumerate(chips):
            pe = ease(max(0, min(1, (local_t - 0.15 - i * 0.08) * 3)))
            tw = draw.textlength(chip, font=font(16, True))
            yy = int(y + (1 - pe) * 30)
            rounded(draw, (x, yy, x + tw + 36, yy + 42), 21, ink(CARD, pe), outline=ink(BORDER, pe))
            draw.text((x + 18, yy + 11), chip, font=font(16, True), fill=ink(COPPER, pe))
            x += int(tw + 50)

        # animated graph nodes
        cy = 480
        nodes = [(280, cy), (520, cy - 40), (760, cy + 20), (1000, cy - 10)]
        for i in range(len(nodes) - 1):
            pe = ease(max(0, min(1, (local_t - 0.25 - i * 0.08) * 4)))
            if pe <= 0:
                continue
            x1, y1 = nodes[i]
            x2, y2 = nodes[i + 1]
            x2i = int(lerp(x1, x2, pe))
            y2i = int(lerp(y1, y2, pe))
            draw.line((x1, y1, x2i, y2i), fill=ink(COPPER, 0.7 * pe), width=3)
        for i, (nx, ny) in enumerate(nodes):
            pe = ease(max(0, min(1, (local_t - 0.2 - i * 0.07) * 4)))
            r = int(14 * pe)
            if r > 0:
                draw.ellipse((nx - r, ny - r, nx + r, ny + r), fill=ink(COPPER, pe))

    elif mode == "cards":
        cards = scene["cards"]
        n = len(cards)
        gap = 20
        margin = 48
        cw = (W - margin * 2 - gap * (n - 1)) // n
        for i, (badge, head, body) in enumerate(cards):
            pe = ease(max(0, min(1, (local_t - 0.12 - i * 0.1) * 3)))
            x0 = margin + i * (cw + gap)
            y0 = int(260 + (1 - pe) * 40)
            rounded(draw, (x0, y0, x0 + cw, y0 + 220), 18, ink(CARD, pe), outline=ink(BORDER, pe), width=2)
            rounded(draw, (x0 + 20, y0 + 22, x0 + 62, y0 + 58), 8, ink((60, 30, 24), pe), outline=ink(COPPER, pe))
            draw.text((x0 + 32, y0 + 28), badge, font=font(18, True), fill=ink(COPPER, pe))
            draw.text((x0 + 20, y0 + 80), head, font=font(22, True), fill=ink(WHITE, pe))
            draw.text((x0 + 20, y0 + 120), body, font=font(16), fill=ink(MUTED, pe))

    elif mode == "pipeline":
        steps = scene["steps"]
        n = len(steps)
        for i, step in enumerate(steps):
            pe = ease(max(0, min(1, (local_t - 0.1 - i * 0.12) * 3)))
            y = 250 + i * 85
            x_shift = int((1 - pe) * 50)
            # connector
            if i > 0:
                ce = ease(max(0, min(1, (local_t - 0.1 - (i - 1) * 0.12) * 3)))
                draw.line((78, y - 20, 78, y + 10), fill=ink(COPPER, ce * 0.8), width=3)
            rounded(draw, (48 + x_shift, y, 108 + x_shift, y + 52), 12, ink(CARD, pe), outline=ink(COPPER, pe))
            draw.text((68 + x_shift, y + 14), f"{i+1:02d}", font=font(16, True), fill=ink(COPPER, pe))
            draw.text((128 + x_shift, y + 12), step, font=font(24, True), fill=ink(WHITE, pe))

    elif mode == "intent":
        pe = ease(max(0, min(1, (local_t - 0.1) * 2.5)))
        rounded(draw, (48, 250, W - 48, 360), 16, ink(CARD, pe), outline=ink(BORDER, pe), width=2)
        draw.text((72, 270), "INTENT", font=font(12, True), fill=ink(MUTED, pe))
        draw.text((72, 300), scene["intent"], font=font(22), fill=ink(GREEN, pe))

        # arrow animation
        ae = ease(max(0, min(1, (local_t - 0.35) * 3)))
        if ae > 0:
            cy = 400
            draw.polygon(
                [(W // 2 - 16, cy - int(10 * ae)), (W // 2 + 16, cy - int(10 * ae)), (W // 2, cy + int(14 * ae))],
                fill=ink(COPPER, ae),
            )

        re = ease(max(0, min(1, (local_t - 0.5) * 2.5)))
        rounded(draw, (48, 440, W - 48, 550), 16, ink(CARD, re), outline=ink(COPPER, re), width=2)
        draw.text((72, 460), "OUTPUT", font=font(12, True), fill=ink(MUTED, re))
        draw.text((72, 490), scene["result"], font=font(22, True), fill=ink(BLUE, re))
        # fake hex crawl
        if re > 0.3:
            hexline = "0x" + "".join(f"{(int(local_t*100)+i*7)%16:x}" for i in range(40))
            draw.text((72, 522), hexline, font=font(14), fill=ink(VIOLET, re * 0.9))

    elif mode == "code":
        pe = ease(max(0, min(1, (local_t - 0.1) * 2.5)))
        rounded(draw, (48, 250, W - 48, 380), 16, ink((14, 16, 20), pe), outline=ink(BORDER, pe), width=2)
        draw.text((72, 270), "$ terminal", font=font(14), fill=ink(MUTED, pe))
        # typewriter
        code = scene["code"]
        chars = int(len(code) * ease(max(0, min(1, (local_t - 0.2) * 2.2))))
        shown = code[:chars] + ("▌" if local_t < 0.85 and int(local_t * 10) % 2 == 0 else "")
        draw.text((72, 310), shown, font=font(36, True), fill=ink(GREEN, pe))

        tools = scene.get("tools", [])
        x = 48
        for i, tool in enumerate(tools):
            te = ease(max(0, min(1, (local_t - 0.45 - i * 0.08) * 3)))
            tw = draw.textlength(tool, font=font(16, True))
            yy = 440
            rounded(draw, (x, yy, x + tw + 32, yy + 40), 12, ink(CARD, te), outline=ink(BORDER, te))
            draw.text((x + 16, yy + 10), tool, font=font(16, True), fill=ink(COPPER, te))
            x += int(tw + 44)

    elif mode == "links":
        links = scene["links"]
        for i, (lab, val) in enumerate(links):
            pe = ease(max(0, min(1, (local_t - 0.1 - i * 0.08) * 3)))
            y = 240 + i * 90
            xoff = int((1 - pe) * 40)
            rounded(draw, (48 + xoff, y, W - 48 + xoff // 3, y + 72), 14, ink(CARD, pe), outline=ink(BORDER, pe))
            draw.text((72 + xoff, y + 14), lab, font=font(14, True), fill=ink(COPPER, pe))
            draw.text((72 + xoff, y + 36), val, font=font(24, True), fill=ink(WHITE, pe))

    elif mode == "close":
        pe = ease(max(0, min(1, local_t * 2)))
        # center mark
        r = int(50 * pe)
        cx, cy = W // 2, 340
        if r > 0:
            draw.rounded_rectangle((cx - r, cy - r, cx + r, cy + r), radius=16, fill=ink(COPPER, pe))
            draw.text((cx - 14, cy - 22), "V", font=font(40, True), fill=ink(BG, pe))
        draw.text((W // 2 - 200, 420), scene.get("tagline", ""), font=font(22), fill=ink(MUTED, pe))
        draw.text((W // 2 - 160, 470), "verprotocol.vercel.app", font=font(18, True), fill=ink(COPPER, pe))
        draw.text((W // 2 - 80, 510), "npx -y aic-mcp", font=font(16), fill=ink(GREEN, pe))

    return img


def render_scene_video(scene: dict, scene_idx: int, n_scenes: int, out_path: Path) -> float:
    audio = PUBLIC / scene["audio"]
    ad = dur(audio)
    length = ad + PAD
    n_frames = max(1, int(length * FPS))

    # Write frames to a temp directory of PNGs, then ffmpeg encode
    frame_dir = WORK / f"f_{scene_idx:02d}"
    frame_dir.mkdir(parents=True, exist_ok=True)

    for fi in range(n_frames):
        local_t = fi / max(1, n_frames - 1)
        frame = scene_frame(scene, local_t, scene_idx, n_scenes)
        frame.save(frame_dir / f"f{fi:06d}.png", "PNG", optimize=True)

    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", f"{frame_dir}/f%06d.png",
        "-i", str(audio),
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-shortest",
        "-movflags", "+faststart",
        str(out_path),
    ]
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # clean up frames
    import shutil
    shutil.rmtree(frame_dir, ignore_errors=True)
    return length


def ts(sec: float) -> str:
    sec = max(0.0, sec)
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = int(sec % 60)
    ms = int(round((sec - int(sec)) * 1000))
    if ms >= 1000:
        s += 1
        ms = 0
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def build_srt(path: Path, timeline: list[float]) -> None:
    """timeline[i] = start time of scene i"""
    lines = []
    idx = 1
    for si, scene in enumerate(SCENES):
        t0 = timeline[si]
        ad = dur(PUBLIC / scene["audio"])
        for a, b, text in scene["cues"]:
            start = t0 + a * ad
            end = t0 + min(b * ad, ad - 0.05)
            if end <= start:
                continue
            lines.append(f"{idx}\n{ts(start)} --> {ts(end)}\n{text}\n")
            idx += 1
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def make_bg(path: Path, length: float) -> None:
    length = max(5.0, float(length))
    fade_out = max(0.5, length - 2.5)
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"sine=frequency=55:sample_rate=44100:duration={length}",
        "-f", "lavfi", "-i", f"sine=frequency=82.4:sample_rate=44100:duration={length}",
        "-f", "lavfi", "-i", f"sine=frequency=110:sample_rate=44100:duration={length}",
        "-f", "lavfi", "-i", f"anoisesrc=color=pink:amplitude=0.018:sample_rate=44100:duration={length}",
        "-filter_complex",
        (
            "[0:a]volume=0.13[a0];[1:a]volume=0.09[a1];[2:a]volume=0.05[a2];"
            "[3:a]volume=0.22,lowpass=f=450[a3];"
            "[a0][a1][a2][a3]amix=inputs=4:duration=first:dropout_transition=0,"
            f"lowpass=f=1300,highpass=f=30,afade=t=in:st=0:d=2,afade=t=out:st={fade_out:.3f}:d=2"
        ),
        "-t", f"{length:.3f}", "-ac", "2", "-c:a", "libmp3lame", "-q:a", "4",
        str(path),
    ]
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    parts = []
    starts = []
    t = 0.0
    n = len(SCENES)
    for i, scene in enumerate(SCENES):
        print(f"animating scene {i+1}/{n}: {scene['title']}")
        part = WORK / f"part_{i:02d}.mp4"
        length = render_scene_video(scene, i, n, part)
        parts.append(part)
        starts.append(t)
        t += length

    # concat
    lst = WORK / "concat.txt"
    lst.write_text("".join(f"file '{p}'\n" for p in parts))
    bare = WORK / "bare.mp4"
    subprocess.check_call(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(bare)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )

    srt = WORK / "captions.en.srt"
    build_srt(srt, starts)
    bg = WORK / "bg.mp3"
    print("ambient bed…")
    make_bg(bg, t + 1)

    srt_esc = str(srt).replace("\\", "\\\\").replace(":", "\\:").replace("'", r"\'")
    vf = (
        f"subtitles={srt_esc}:force_style='"
        "FontName=DejaVu Sans,FontSize=18,PrimaryColour=&H00E2E8F0,"
        "BackColour=&H990B0C0E,BorderStyle=4,Outline=0,Shadow=0,"
        "MarginV=40,Alignment=2,Bold=1'"
    )
    out = OUT / "ver-protocol-demo.mp4"
    print("mux captions + 40% bg…")
    cmd = [
        "ffmpeg", "-y",
        "-i", str(bare),
        "-i", str(bg),
        "-filter_complex",
        "[0:a]volume=1.0,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[vo];"
        "[1:a]volume=0.40,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[bg];"
        "[vo][bg]amix=inputs=2:duration=first:dropout_transition=2:normalize=0[a]",
        "-map", "0:v", "-map", "[a]",
        "-vf", vf,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k",
        "-movflags", "+faststart", "-shortest",
        str(out),
    ]
    subprocess.check_call(cmd)
    (OUT / "ver-protocol-demo.en.srt").write_text(srt.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"OK {out}  {out.stat().st_size/1e6:.2f} MB  ~{dur(out):.1f}s")


if __name__ == "__main__":
    main()
