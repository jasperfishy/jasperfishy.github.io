#!/usr/bin/env python3
"""Render the opening cinematic's narration to MP3 files with word timings.

The cinematic is spoken, not synthesised-by-robot, so a real neural voice is
recorded once here and shipped as ordinary audio files. Nothing at runtime
needs a network or an API key.

    python tools/build-intro-audio.py            # render anything missing
    python tools/build-intro-audio.py --force    # re-render everything
    python tools/build-intro-audio.py --only b07

Requires: pip install edge-tts   (Microsoft's neural voices, no key needed)
"""

import argparse
import asyncio
import json
import subprocess
import sys
from pathlib import Path

try:
    import edge_tts
except ImportError:
    sys.exit("edge-tts is missing. Install it with:  pip install edge-tts")

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "assets" / "cinema" / "script.json"
OUTDIR = ROOT / "assets" / "cinema" / "voice"

# Younger listeners need a slower, warmer read than a news anchor.
DEFAULTS = {
    "narrator": {"rate": "-8%", "pitch": "-2Hz"},
    "rex": {"rate": "-4%", "pitch": "+8Hz"},
}


def ffprobe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-hide_banner", "-loglevel", "error", "-show_entries",
         "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


async def render(text: str, voice: str, rate: str, pitch: str, tries: int = 4):
    """Return (mp3 bytes, [(start_s, dur_s, word), ...]).

    The voice endpoint intermittently answers with an empty stream, so a
    failure here means retry rather than wrong parameters.
    """
    last = None
    for attempt in range(tries):
        try:
            speak = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch,
                                         boundary="WordBoundary")
            audio = bytearray()
            words = []
            async for chunk in speak.stream():
                if chunk["type"] == "audio":
                    audio.extend(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    # Offsets arrive in 100-nanosecond ticks from the start of the stream.
                    words.append((round(chunk["offset"] / 1e7, 3),
                                  round(chunk["duration"] / 1e7, 3),
                                  chunk["text"]))
            if audio:
                return bytes(audio), words
            last = "empty stream"
        except Exception as exc:
            last = f"{type(exc).__name__}: {exc}"
        await asyncio.sleep(2 * (attempt + 1))
    raise SystemExit(f"the voice service would not answer ({last})")


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--only", metavar="ID", help="render one beat id only")
    args = ap.parse_args()

    script = json.loads(SCRIPT.read_text(encoding="utf-8"))
    voices = script["voices"]
    OUTDIR.mkdir(parents=True, exist_ok=True)

    index_path = OUTDIR / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8")) if index_path.exists() else {"beats": {}}
    index.setdefault("beats", {})

    for beat in script["beats"]:
        bid = beat["id"]
        if args.only and bid != args.only:
            continue
        speaker = beat.get("speaker", "narrator")
        voice = voices[speaker]
        opts = DEFAULTS.get(speaker, {})
        rate = beat.get("rate", opts.get("rate", "+0%"))
        pitch = beat.get("pitch", opts.get("pitch", "+0Hz"))
        target = OUTDIR / f"{bid}.mp3"

        if target.exists() and not args.force:
            print(f"  {bid}  kept")
            continue

        audio, words = await render(beat["text"], voice, rate, pitch)
        target.write_bytes(audio)
        duration = ffprobe_duration(target)
        index["beats"][bid] = {
            "file": f"{bid}.mp3",
            "speaker": speaker,
            "voice": voice,
            "rate": rate,
            "pitch": pitch,
            "duration": round(duration, 3),
            "words": [{"t": t, "d": d, "w": w} for t, d, w in words],
        }
        print(f"  {bid}  {speaker:<8} {duration:5.1f}s  {len(words)} words")

    index["voiceNames"] = voices
    index_path.write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")),
                          encoding="utf-8")
    print(f"wrote {index_path.relative_to(ROOT)}")


asyncio.run(main())
