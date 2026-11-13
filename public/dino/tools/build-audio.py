#!/usr/bin/env python3
"""Render the Dinosaur Universe score and effects to real audio files.

    python tools/build-audio.py                 everything
    python tools/build-audio.py --sfx           only the effects
    python tools/build-audio.py --music         only the score loops
    python tools/build-audio.py --ambient       only the world beds
    python tools/build-audio.py --only roar win --variants 2
    python tools/build-audio.py --selftest      a minute of checks, no bank

Everything the games play used to be synthesised live by fx/du-music.js and
fx/du-fx.js out of bare oscillators, which is why the collection sounds like a
calculator. This script renders the same tunes — the note tables are copied
from du-music.js on purpose, so a sampled theme is that theme and not a new
one — through an offline instrument-and-room model, and hands the result to
ffmpeg as MP3.

The engines prefer these files and fall back to the oscillators when a file
has not been fetched yet, so nothing here is load-bearing for sound to exist.

WHY EVERY CLIP IS MEASURED, NOT LISTENED TO
    Nobody at the keyboard can hear what this script produces, and "it is a
    real recording now" is not by itself an improvement: a badly gain-staged
    sample is worse than a clean beep. So each render is scored on peak, RMS,
    DC offset, clipped samples, spectral centroid, attack time and whether the
    loop actually joins, and tests/audio-audit.cjs fails the build when a
    number leaves the range a broadcast master would sit in. tools/audition.html
    puts the same numbers next to a play button so a human can do the one job
    a measurement cannot.
"""

import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import wave

import numpy as np

SR = 44100
TAU = 2 * math.pi
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
AUDIO = os.path.join(ROOT, "assets", "audio")
SFX_OUT = os.path.join(AUDIO, "sfx")
MUSIC_OUT = os.path.join(AUDIO, "music")
AMB_OUT = os.path.join(AUDIO, "amb")
REPORT = os.path.join(AUDIO, "report.json")

MAJOR = [0, 2, 4, 5, 7, 9, 11]
MINOR = [0, 2, 3, 5, 7, 8, 10]
SEMI = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}

# Same chord cycles and melody degrees as fx/du-music.js. Keep them in step
# with that file or the sampled version will be a different song.
#   kit : the world has a pulse underneath it (a chase, a countdown)
THEMES = {
    "park": dict(
        bpm=104, root=SEMI["C"], minor=False,
        chords=[[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]],
        bells=[0, None, 4, None, 7, None, 4, None, 2, None, 4, None, 0, None, None, None,
               7, None, 9, None, 11, None, 9, None, 7, None, 4, None, 2, None, 0, None],
        pluck=[0, 4, 7, 11], bass=[0, 2, 3, 1], pad=True, kit=True),
    "meadow": dict(
        bpm=78, root=SEMI["G"], minor=False,
        chords=[[0, 4, 7], [-3, 0, 4], [2, 5, 9], [4, 7, 11]],
        bells=[7, None, None, 4, None, None, 7, None, 9, None, None, None, 7, None, 4, None,
               5, None, None, 2, None, None, 5, None, 7, None, None, 4, None, None, None, None],
        pluck=[0, 2, 4, 7], bass=[0, 3, 1, 2], pad=True, kit=False),
    "drive": dict(
        bpm=126, root=SEMI["A"], minor=True,
        chords=[[0, 3, 7], [5, 8, 12], [3, 7, 10], [0, 3, 7]],
        bells=[0, None, 0, 3, None, 0, None, 7, 5, None, 5, 3, None, 0, None, None,
               7, None, 7, 9, None, 7, None, 3, 5, None, 3, 0, None, None, None, None],
        pluck=[0, 3, 5, 7], bass=[0, 0, 2, 3], pad=False, kit=True),
    "adventures": dict(
        bpm=92, root=SEMI["D"], minor=False,
        chords=[[0, 4, 7], [7, 11, 14], [5, 9, 12], [2, 5, 9]],
        bells=[4, None, 7, None, 11, None, 9, None, 7, None, None, 4, None, 5, None, None,
               9, None, 11, None, 14, None, 12, None, 11, None, None, 9, None, 7, None, None],
        pluck=[2, 4, 7, 9], bass=[0, 3, 1, 2], pad=True, kit=True),
    "night": dict(
        bpm=62, root=SEMI["E"], minor=True,
        chords=[[0, 3, 7], [-2, 2, 5], [3, 7, 10], [0, 3, 7]],
        bells=[7, None, None, None, 10, None, None, None, 7, None, 12, None, None, None, None, None,
               5, None, None, None, 7, None, None, None, 3, None, None, None, None, None, None, None],
        pluck=[0, 3, 7, 10], bass=[0, 1, 3, 1], pad=True, kit=False),
    "egg": dict(
        bpm=118, root=SEMI["F"], minor=False,
        chords=[[0, 4, 7], [7, 11, 14], [2, 5, 9], [4, 7, 11]],
        bells=[0, 4, 7, None, 4, None, 7, 11, 9, None, 7, None, 4, None, 0, None,
               2, 5, 9, None, 5, None, 9, 12, 11, None, 9, None, 7, None, 4, None],
        pluck=[0, 2, 4, 7], bass=[0, 3, 1, 2], pad=False, kit=True),
    "story": dict(
        bpm=70, root=SEMI["C"], minor=False,
        chords=[[0, 4, 7], [5, 9, 12], [9, 12, 16], [7, 11, 14]],
        bells=[0, None, None, None, 4, None, None, None, 7, None, None, None, 11, None, None, None,
               12, None, None, None, 11, None, None, None, 7, None, None, None, 4, None, None, None],
        pluck=[0, 4, 7, 11], bass=[0, 1, 3, 2], pad=True, kit=False),
    "intro": dict(
        bpm=56, root=SEMI["D"], minor=False,
        chords=[[0, 4, 7], [4, 7, 11], [5, 9, 12], [2, 5, 9]],
        bells=[7, None, None, None, None, None, 11, None, None, None, 12, None, None, None, None, None,
               9, None, None, None, None, None, 7, None, 4, None, None, None, None, None, None, None],
        pluck=[0, 4, 7, 11], bass=[0, 3, 1, 2], pad=True, kit=False),
}

# The 13 beds declared by fx/du-ambient.js. A theme that plays only drifting
# motes on screen had no weather; these are that weather.
AMBIENCE = ["meadow", "night", "volcano", "ocean", "snow", "desert", "space",
            "rain", "storm", "sun", "rainbow", "fog", "wind"]


def hz(theme, degree, oct=0):
    """du-music.js hz(): degrees count scale steps, and the clamp is the range a
    tablet speaker can actually reproduce."""
    scale = MINOR if theme["minor"] else MAJOR
    s = len(scale)
    idx = int(((degree % s) + s) % s)
    midi = 12 * (oct + 4 + int(math.floor(degree / s))) + theme["root"] + scale[idx]
    return float(np.clip(440.0 * 2.0 ** ((midi - 69) / 12.0), 58.0, 2800.0))


def midi_of(freq):
    return int(round(69 + 12 * math.log2(max(1e-6, freq) / 440.0)))


# ------------------------------------------------------------------ envelopes

def adsr(n, a, d, sus, r, curve=1.0):
    """A four-stage envelope over n samples, in 0..1."""
    n = max(4, int(n))
    a = max(1, int(a * SR)); d = max(1, int(d * SR)); r = max(1, int(r * SR))
    if a + r >= n:
        a = max(1, n // 6); r = max(1, n // 6)
    out = np.zeros(n)
    out[:a] = np.linspace(0, 1, a) ** curve
    hold = n - a - r
    if hold > 0:
        out[a:a + hold] = sus
        out[a + hold:] = sus * np.exp(-np.linspace(0, 3.4, r)) * np.linspace(1, 0, r)
    else:
        out[a:] = np.exp(-np.linspace(0, 4.2, n - a))
    return out


def dec(n, seconds):
    """A plain exponential ring-out to about -60 dB over `seconds`."""
    n = max(2, int(n))
    return np.exp(-np.linspace(0, 6.9, n) * (max(1, n) / SR) / max(0.01, seconds))


def vibrato(n, rate, depth, delay=0.0):
    """A fractional pitch deviation, arriving after `delay` seconds so the note
    starts true, the way a bowed string does."""
    t = np.arange(n) / SR
    ramp = np.clip((t - delay) / max(0.05, 1.0 - delay), 0, 1)
    return depth * ramp * np.sin(TAU * rate * t)


def cumphase(freq):
    """Phase from an instantaneous-frequency array, so sweeps and vibrato never
    break the waveform the way setValueAtTime ramps do."""
    freq = np.asarray(freq, dtype=np.float64)
    return np.cumsum(freq) / SR


# ------------------------------------------------------------------ filtering
# scipy is not installed here, and a per-sample Python loop over a 30-second
# pad is not a way to spend an afternoon. Every IIR in this file is therefore
# applied as its own (truncated) impulse response by FFT convolution, which is
# bit-for-bit the same filter for as long as the ring-out lasts.

_biq_cache = {}


def biq_coefs(kind, f, q=0.7071, gain_db=0.0):
    """RBJ Audio EQ Cookbook coefficients, normalised so a0 == 1."""
    f = min(max(float(f), 12.0), SR * 0.47)
    key = (kind, round(f, 2), round(q, 3), round(gain_db, 2))
    hit = _biq_cache.get(key)
    if hit is not None:
        return hit
    w = TAU * f / SR
    cw, sw = math.cos(w), math.sin(w)
    al = sw / (2.0 * q)
    A = 10.0 ** (gain_db / 40.0)
    s = 2.0 * math.sqrt(A) * al
    if kind == "lp":
        b0, b1, b2 = (1 - cw) / 2, 1 - cw, (1 - cw) / 2
        a0, a1, a2 = 1 + al, -2 * cw, 1 - al
    elif kind == "hp":
        b0, b1, b2 = (1 + cw) / 2, -(1 + cw), (1 + cw) / 2
        a0, a1, a2 = 1 + al, -2 * cw, 1 - al
    elif kind == "bp":
        b0, b1, b2 = al, 0.0, -al
        a0, a1, a2 = 1 + al, -2 * cw, 1 - al
    elif kind == "notch":
        b0, b1, b2 = 1.0, -2 * cw, 1.0
        a0, a1, a2 = 1 + al, -2 * cw, 1 - al
    elif kind == "peak":
        b0, b1, b2 = 1 + al * A, -2 * cw, 1 - al * A
        a0, a1, a2 = 1 + al / A, -2 * cw, 1 - al / A
    elif kind == "lowshelf":
        b0 = A * ((A + 1) - (A - 1) * cw + s)
        b1 = 2 * A * ((A - 1) - (A + 1) * cw)
        b2 = A * ((A + 1) - (A - 1) * cw - s)
        a0 = (A + 1) + (A - 1) * cw + s
        a1 = -2 * ((A - 1) + (A + 1) * cw)
        a2 = (A + 1) + (A - 1) * cw - s
    elif kind == "highshelf":
        b0 = A * ((A + 1) + (A - 1) * cw + s)
        b1 = -2 * A * ((A - 1) + (A + 1) * cw)
        b2 = A * ((A + 1) + (A - 1) * cw - s)
        a0 = (A + 1) - (A - 1) * cw + s
        a1 = 2.0 * ((A - 1) - (A + 1) * cw)
        a2 = (A + 1) - (A - 1) * cw - s
    else:
        raise ValueError("unknown filter " + kind)
    out = (np.array([b0, b1, b2]) / a0, np.array([1.0, a1 / a0, a2 / a0]))
    _biq_cache[key] = out
    return out


def _impulse(b, a, n):
    """The first n samples of the filter's response to a click."""
    b0, b1, b2 = b
    a1, a2 = a[1], a[2]
    if a2 >= 1.0:
        raise ValueError("unstable filter: a2=%.6f" % a2)
    h = np.zeros(n)
    h[0] = b0
    if n > 1:
        h[1] = b1 - a1 * h[0]
    if n > 2:
        # the click is still arriving at sample 2 through b2; leave it out and
        # the pole pair never cancels, which turns a shelf into a resonator
        h[2] = b2 - a1 * h[1] - a2 * h[0]
    for i in range(3, n):
        h[i] = -a1 * h[i - 1] - a2 * h[i - 2]
    if not np.isfinite(h).all():
        raise ValueError("filter diverged: a1=%.4f a2=%.4f" % (a1, a2))
    return h


_imp_cache = {}


def biquad(x, kind, f, q=0.7071, gain_db=0.0, taps=8192, ring=0):
    if x.ndim == 2:
        return np.stack([biquad(x[:, c], kind, f, q, gain_db, taps, ring)
                         for c in range(x.shape[1])], 1)
    b, a = biq_coefs(kind, f, q, gain_db)
    n = int(min(taps, max(64, x.shape[0] if x.ndim else x.size)))
    key = (kind, round(float(f), 2), round(q, 3), round(gain_db, 2), n)
    h = _imp_cache.get(key)
    if h is None:
        h = _impulse(b, a, n)
        _imp_cache[key] = h
    # `ring` filters a loop as though the bar before the first sample had
    # already happened; without it every shelf starts from cold and the seam
    # is a step in the tone, not just in the level.
    y = wrap_convolve(x, h) if ring else fftconvolve(x, h)
    return y[: x.shape[0]]


def lp(x, f, q=0.7071):
    return biquad(x, "lp", f, q)


def hp(x, f, q=0.7071):
    return biquad(x, "hp", f, q)


def bp(x, f, q=1.0):
    return biquad(x, "bp", f, q)


def tilt(x, low_db=0.0, high_db=0.0, ring=0):
    """Two shelves: the cheapest honest tonal control there is."""
    y = biquad(x, "lowshelf", 220.0, 0.7, low_db, ring=ring)
    return biquad(y, "highshelf", 3600.0, 0.7, high_db, ring=ring)


def dc_block(x, hz=20.0, ring=0):
    """Cut what no speaker reproduces anyway. A brown-noise burst or a pulse
    train that only ever points one way leaves a steady offset behind, and a
    normaliser will happily set its level off that offset instead of the sound,
    so the rumble a child actually hears arrives several dB too quiet."""
    return biquad(x, "hp", hz, 0.7071, ring=ring)


def fftconvolve(x, h):
    """Overlap-add convolution. A reverb tail longer than a block would
    otherwise be chopped off, and the room is most of what makes this sound
    recorded rather than generated."""
    x = np.asarray(x, dtype=np.float64)
    h = np.asarray(h, dtype=np.float64)
    if x.size == 0:
        return np.zeros(h.size)
    if h.size == 0:
        return x.copy()
    out = np.zeros(x.size + h.size - 1)
    block = 1 << int(math.ceil(math.log2(max(4096, min(1 << 20, 2 * h.size)))))
    hop = block - h.size + 1
    if hop <= 0:                       # an IR longer than any sane block: go direct
        n = 1 << int(math.ceil(math.log2(x.size + h.size - 1)))
        return np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(h, n), n)[: out.size]
    Hs = np.fft.rfft(h, block)
    for start in range(0, x.size, hop):
        seg = x[start:start + hop]
        if seg.size < block:
            seg = np.concatenate([seg, np.zeros(block - seg.size)])
        y = np.fft.irfft(np.fft.rfft(seg, block) * Hs, block)
        take = min(block, out.size - start)
        if take <= 0:
            break
        out[start:start + take] += y[:take]
    return out


def circular_convolve(x, h):
    """Convolution on a ring. Used for the loops: the tail of the room arrives
    back at bar one, which is what makes a repeat inaudible."""
    n = x.shape[0]
    h = h[:n]
    return np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(h, n), n)


# ------------------------------------------------------------------ noise & room

def coloured_noise(n, colour="white", seed=0):
    """Pink and brown by spectral shaping (a 1/f^k tilt of white noise), which
    is exact, vectorised and free of the recursion a Kellet filter needs."""
    n = max(4, int(n))
    rng = np.random.default_rng(seed)
    if colour == "white":
        x = rng.standard_normal(n)
        return x / (np.abs(x).max() + 1e-9)
    X = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1.0 / SR)
    f[0] = 1.0
    slope = {"pink": -0.5, "brown": -1.0, "blue": 0.5}[colour]
    X *= f ** slope
    # The DC bin sits at f=1.0 here only to survive the multiply; it must then
    # be thrown away. Kept, it is the loudest partial in a brown burst (every
    # other bin is divided by its frequency), which is a constant shove sideways
    # rather than a rumble, and it cost three one-shots their headroom.
    X[0] = 0.0
    x = np.fft.irfft(X, n)[: n]
    return x / (np.abs(x).max() + 1e-9)


EARLY = [(8.0, 0.62), (15.0, 0.44), (23.0, 0.38), (31.0, 0.30), (47.0, 0.22), (71.0, 0.15)]


def room_ir(seconds=1.6, decay=3.2, brightness=4600.0, seed=11, early=EARLY):
    """A stereo impulse response built from nothing: a few discrete early
    reflections, then diffuse noise whose high end dies before its low end,
    because air and upholstery absorb treble first.

    Both shortcuts here are audible. Smoothing the noise too much leaves a dull
    roar with nothing on top; leaving the early reflections as single-sample
    clicks puts a snare drum inside every sustained note, which is how a
    strings pad ends up measuring brighter than a hi-hat. A first reflection is
    a copy of the source, band-limited by the plaster that threw it."""
    n = max(256, int(seconds * SR))
    t = np.arange(n) / SR
    onset = 1 - np.exp(-t / 0.0035)
    ir = np.zeros((n, 2))
    for ch in range(2):
        rng = np.random.default_rng(seed + ch * 101)
        x = rng.standard_normal(n)
        tail = x * np.exp(-decay * t) * onset
        hf = biquad(tail, "hp", 1700.0, 0.7)
        lf = biquad(tail, "lp", 1700.0, 0.7)
        body = lf + hf * np.exp(-decay * 1.55 * t)
        if ch:
            body = np.roll(body, int(0.00055 * SR))     # the ears are not siblings
        ir[:, ch] = body
    for i, (ms, g) in enumerate(early or []):
        k = max(0, int(ms / 1000.0 * SR) - 48)
        if k >= n:
            continue
        m = min(97, n - k)
        u = np.hanning(97)[:m] * np.cos(TAU * (1000.0 + 620.0 * (i % 4))
                                        * np.arange(m) / SR)
        u = u / (np.abs(u).max() + 1e-9) * g * 0.34
        ir[k:k + m, 0] += u
        ir[k:k + m, 1] += u * (0.82 if i % 2 else 0.95)
    ir = biquad(ir, "hp", 110.0, 0.7)
    ir = biquad(ir, "lp", brightness, 0.6)
    return ir / math.sqrt(float((ir ** 2).mean()) + 1e-12)


_rooms = {}


def room(name):
    if name not in _rooms:
        _rooms[name] = {
            # A tiled concert hall: long, generous, the sound of an orchestra pit.
            "hall": room_ir(2.5, 2.55, 5200.0, 11),
            # Close and dry — a recording booth, for clicks and taps that must feel
            # like they happened on the glass in the child's hands.
            "chamber": room_ir(0.5, 7.5, 7000.0, 23),
            # The cavern under the volcano, and the outside of a cinema screen.
            "cave": room_ir(3.6, 1.65, 2600.0, 37, [(12, .7), (29, .5), (58, .42), (104, .3), (168, .2)]),
        }[name]
    return _rooms[name]


def verb(x, ir, mix=0.25, ring=0):
    """Dry plus a send. `ring` is the loop length: set it, and the room is
    convolved on a ring, so a bar that repeats joins with the same air it had
    the first time round instead of ending in a cliff."""
    dry = x if x.ndim == 2 else pan(x, 0.5)
    n = dry.shape[0]
    wet = np.zeros_like(dry)
    for ch in range(2):
        src = dry[:, ch]
        col = ir[:, ch]
        if ring:
            col = col[:ring]
            wet[:, ch] = circular_convolve(src, col)
        else:
            wet[:, ch] = fftconvolve(src, col)[:n]
    ratio = math.sqrt((float((dry ** 2).mean()) + 1e-9) / (float((wet ** 2).mean()) + 1e-9))
    return dry * 0.94 + wet * (mix * ratio)


def _fit(a, n):
    a = np.asarray(a)
    if a.shape[0] == n:
        return a
    out = np.zeros((n,) + a.shape[1:])
    out[: min(n, a.shape[0])] = a[: n]
    return out


def pan(x, at, width=0.25):
    """Constant-power placement, 0 hard left to 1 hard right, never a gain
    above unity. `width` keeps a little of both channels so a hard-panned tap
    does not vanish on a tablet held in one hand, and stays mono in mono."""
    at = float(np.clip(at, 0.0, 1.0))
    a = at * math.pi / 2
    l = math.cos(a) * (1 - width) + width * 0.7071
    r = math.sin(a) * (1 - width) + width * 0.7071
    return np.stack([x * l, x * r], 1)


def add(buf, at_sec, clip, level=1.0, at=0.5, ring=0):
    """Place a mono event on a stereo timeline. With `ring`, anything written
    past the end of the loop reappears at its start, which is how a long reverb
    tail survives a short bar without a hole where the bar used to join."""
    clip = np.asarray(clip)
    if clip.ndim == 1:
        clip = pan(clip, at)
    if level != 1.0:
        clip = clip * level
    n = buf.shape[0]
    start = int(round(at_sec * SR))
    if clip.shape[0] == 0 or start >= n:
        return buf
    if start < 0:
        clip = clip[-start:]
        start = 0
    if not ring:
        end = min(n, start + clip.shape[0])
        buf[start:end] += clip[: end - start]
        return buf
    span = min(clip.shape[0], n)
    s = start % n
    first = min(span, n - s)
    buf[s:s + first] += clip[:first]
    if first < span:
        buf[0: span - first] += clip[first:span]
    return buf


def softclip(x, ceiling=0.985):
    """tanh, scaled so anything under about -6 dBFS is untouched. Limiting is
    the last resort, so the mix upstream has to be honest first."""
    y = np.tanh(np.asarray(x, dtype=np.float64) / ceiling)
    return y * ceiling


def gain_db(x, db):
    return x * (10.0 ** (db / 20.0))


def peak_of(x):
    return float(np.abs(x).max()) if x.size else 0.0


def normalize(x, dbfs=-6.0):
    """Bring the loudest sample to dbfs. Deliberately not a limiter: if a mix
    needs squashing, the arrangement is too busy and should be fixed upstream."""
    p = peak_of(x)
    if p < 1e-7:
        return x
    return x * ((10.0 ** (dbfs / 20.0)) / p)


def fade(x, fin=0.004, fout=0.012):
    """Every sample starts from silence and ends in it. Without the first, an
    MP3's encoder padding turns a click into a tick; without the last, a loop
    seam is a hairline crack you feel as a hum."""
    n = x.shape[0]
    a = min(int(fin * SR), n // 2)
    if a > 1:
        head = np.linspace(0, 1, a)
        if x.ndim == 2:
            x[:a] *= head[:, None]
        else:
            x[:a] *= head
    b = min(int(fout * SR), n // 2)
    if b > 1:
        tail = np.linspace(1, 0, b)
        if x.ndim == 2:
            x[n - b:] *= tail[:, None]
        else:
            x[n - b:] *= tail
    return x


# ------------------------------------------------------------------ wavetables
# A sustained note in a 30-second loop is a million samples. Summing twenty
# partials per sample costs a minute of CPU per voice; reading one period out
# of a 2048-point table costs almost nothing, and is the same band-limited
# wave as long as the pitch stays below a few kHz.

_wt_cache = {}


def wavetable(key, partials, size=2048):
    """partials: {harmonic: (amplitude, phase)}. Non-integer harmonics wrap and
    are a lie — keep those in modal()."""
    hit = _wt_cache.get((key, size))
    if hit is not None:
        return hit
    t = np.arange(size) / size
    x = np.zeros(size)
    for k, (a, ph) in partials.items():
        n = int(round(float(k)))
        if n < 1 or n >= size // 2 or abs(float(k) - n) > 1e-9:
            continue
        x += a * np.sin(TAU * n * t + ph)
    x /= (np.abs(x).max() + 1e-9)
    _wt_cache[(key, size)] = x
    return x


def osc(wave, freq, n=None, phase=0.0):
    """Read a wavetable at an instantaneous frequency. `freq` may be an array."""
    if np.ndim(freq) == 0:
        f = np.full(n, float(freq))
    else:
        f = np.asarray(freq, dtype=np.float64)
        n = f.shape[0]
    ph = (cumphase(f) + phase) % 1.0
    x = ph * (wave.size - 1)
    i = x.astype(np.int32)
    frac = x - i
    j = np.minimum(i + 1, wave.size - 1)
    return wave[i] * (1 - frac) + wave[j] * frac


def _partials(spec):
    return {k: (a, p) for k, (a, p) in spec.items()}


WAVES = {
    # A bowed string has a rich, slightly buzzy top end; a flute loses almost all
    # of it. These are the two ends of the family the score lives between.
    "saw20": {k: (1.0 / k ** 1.05, 0.0) for k in range(1, 21)},
    "saw10": {k: (1.0 / k ** 1.15, 0.0) for k in range(1, 11)},
    "tri": {k: ((-1) ** ((k - 1) // 2) / k ** 2, 0.0) for k in range(1, 15, 2)},
    "square": {k: (1.0 / k, 0.0) for k in range(1, 24, 2)},
    "reed": {k: (1.0 / k ** 0.75, (k * 0.7) % TAU) for k in range(1, 18)},
    "flute": {1: (1.0, 0.0), 2: (0.16, 1.1), 3: (0.05, 2.2), 4: (0.02, 0.4)},
    "organ": {1: (1.0, 0.0), 2: (0.55, 0.3), 3: (0.28, 1.4), 4: (0.34, 0.8),
              6: (0.14, 2.0), 8: (0.08, 0.2)},
    "soft": {1: (1.0, 0.0), 2: (0.22, 0.5), 3: (0.07, 1.9)},
}
for _k, _v in WAVES.items():
    wavetable(_k, _partials(_v))


# ------------------------------------------------------------------ voices
# Each voice is an object, not a waveform. What makes a marimba a marimba is
# that its bar rings at 2.76 and 5.4 times the fundamental and not at 2 and 3;
# what makes a struck plate metallic is that nothing lines up.

def modal(freq, dur, ratios, decays, seed=0, strike=0.0, strike_f=0.0,
          body=None, detune=0.0009, taper=1.0):
    """Sum of decaying inharmonic modes plus the sound of whatever hit it.
    Every bell, bar, plate, stone and token in this bank comes out of here."""
    n = max(32, int(dur * SR))
    t = np.arange(n) / SR
    rng = np.random.default_rng(seed)
    out = np.zeros(n)
    total = 0.0
    for r, d in zip(ratios, decays):
        f = freq * r
        if f >= SR * 0.45:
            continue
        # stiffness: the top of a bar or a plate rings progressively sharp
        f = f * (1.0 + detune * (f / 900.0))
        a = 1.0 / (1.0 + (r ** 1.35))
        dd = max(0.012, d * dur * taper)
        env = np.exp(-6.9 * t / dd)
        vib = 1.0 + 0.0006 * np.sin(TAU * rng.uniform(0.4, 1.7) * t + rng.uniform(0, TAU))
        out += a * env * np.sin(TAU * np.cumsum(f * vib) / SR + rng.uniform(0, TAU))
        total += a
    if total:
        out /= total
    if strike:
        m = max(16, int(strike * SR))
        s = rng.standard_normal(m) * np.exp(-np.linspace(0, 7.5, m))
        s = biquad(s, "bp", strike_f or min(9000, freq * 5.5), 1.4)
        s = s * (0.55 / (peak_of(s) + 1e-9))
        out[: m] += s
    for tap in (body or []):
        kind, f, q = tap[0], tap[1], tap[2]
        out = biquad(out, kind, f, q, tap[3] if len(tap) > 3 else 0.0)
    return out / (peak_of(out) + 1e-9)


RATIOS = {
    # glass / metal / wood / skin, from measured mode layouts
    "glock": ([0.5, 1, 2.42, 3.94, 5.6, 6.8, 8.9], [2.4, 1.7, 0.65, 0.34, 0.2, 0.13, 0.08]),
    "bell": ([0.5, 1, 1.2, 1.5, 2.02, 2.55, 3.06, 3.78, 4.6], [2.6, 2.1, 1.2, 0.9, 0.55, 0.36, 0.24, 0.16, 0.1]),
    "plate": ([1, 1.27, 1.62, 2.08, 2.63, 3.44, 4.21, 5.3], [1.5, 1.1, 0.8, 0.55, 0.4, 0.26, 0.17, 0.11]),
    "metal": ([1, 1.42, 1.88, 2.51, 3.26, 4.15, 5.4, 6.9], [1.1, 0.8, 0.62, 0.44, 0.3, 0.2, 0.13, 0.08]),
    "bar": ([1, 2.76, 5.4, 8.93], [1.5, 0.34, 0.13, 0.06]),
    "wood": ([1, 2.73, 5.4, 8.9, 11.6], [0.24, 0.1, 0.05, 0.03, 0.02]),
    "stone": ([1, 1.19, 1.72, 2.44, 3.31, 4.6], [0.7, 0.45, 0.3, 0.18, 0.11, 0.06]),
    "token": ([1, 1.53, 2.31, 3.14, 4.42, 5.9], [1.3, 0.95, 0.6, 0.4, 0.25, 0.15]),
    "skin": ([1, 1.59, 2.14, 2.92, 3.42], [0.5, 0.3, 0.18, 0.1, 0.06]),
    # a dry, hollow, slightly woody thing — a museum prop, not a bell
    "bone": ([1, 1.62, 2.91, 4.58, 6.24], [0.19, 0.10, 0.055, 0.03, 0.02]),
}


def v_bell(freq, dur=1.6, seed=0, kind="glock", bright=1.0, taper=1.0):
    ratios, decays = RATIOS[kind]
    x = modal(freq, dur, ratios, decays, seed=seed, strike=0.006,
              strike_f=min(12000, freq * 7 * bright),
              body=[("peak", min(9000, freq * 3.4), 1.2, 3.0 * bright)], taper=taper)
    return x


def v_marimba(freq, dur=1.0, seed=0, hard=0.5):
    ratios, decays = RATIOS["bar"]
    x = modal(freq, dur, ratios, decays, seed=seed, strike=0.004,
              strike_f=clamp_f(900 + freq * 2.6),
              body=[("peak", clamp_f(420), 1.1, 4.0 * hard), ("lp", clamp_f(7000), 0.7)])
    return x


def v_pluck(freq, dur=1.2, seed=0, damp=0.9975, bright=0.55, body_f=0.0):
    """Karplus-Strong: a string is a delay line that loses its treble on every
    trip round, which is exactly why plucked things go dull as they fade."""
    M = max(3, int(round(SR / clamp_f(freq))))
    total = max(M * 2, int(dur * SR))
    rng = np.random.default_rng(seed)
    buf = rng.uniform(-1.0, 1.0, M)
    buf = biquad(buf, "lp", clamp_f(freq * (2.0 + 9.0 * bright)), 0.7)
    buf /= (peak_of(buf) + 1e-9)
    passes = total // M + 2
    out = np.empty(passes * M)
    a = damp
    for p in range(passes):
        out[p * M:(p + 1) * M] = buf
        buf = a * 0.5 * (buf + np.roll(buf, -1))
    x = out[:total] * np.exp(-np.linspace(0, 1.1, total))
    if body_f:
        ring = modal(body_f, min(0.35, dur), RATIOS["wood"][0], [0.09] * 5, seed=seed + 5,
                     strike=0.002) * 0.22
        x[: ring.shape[0]] += ring[: x.shape[0]]
    return x / (peak_of(x) + 1e-9)


def v_piano(freq, dur=2.2, seed=0, soft=0.4):
    """Two or three strings per note, slightly detuned, hammer on the attack,
    a soundboard that takes the fizz away, and the low notes inharmonic."""
    rng = np.random.default_rng(seed)
    n = max(64, int(dur * SR))
    t = np.arange(n) / SR
    lo = freq < 200
    ratios = [1, 2, 3, 4.02, 5.05, 6.1, 7.2][: 7 if lo else 5]
    decays = [1.0, 0.62, 0.42, 0.28, 0.19, 0.12, 0.08][: len(ratios)]
    out = np.zeros(n)
    unison = 3 if lo else 2
    for r, d in zip(ratios, decays):
        f = freq * r * (1.0 + 0.0012 * (r * freq / 1000.0))      # stiff wire
        if f >= SR * 0.45:
            continue
        for u in range(unison):
            fu = f * (1.0 + rng.normal(0, 0.00055))
            env = np.exp(-6.9 * t / max(0.05, d * dur))
            out += (1.0 / (r ** 1.15)) * env * np.sin(TAU * cumphase(np.full(n, fu)) + rng.uniform(0, TAU))
    out /= (np.abs(out).max() + 1e-9)
    m = max(24, int(0.008 * SR))
    hit = rng.standard_normal(m) * np.exp(-np.linspace(0, 8, m))
    out[:m] += biquad(hit, "bp", clamp_f(1600 + freq * 1.8), 1.1) * (0.30 * (1 - soft))
    out = biquad(out, "lp", clamp_f(2600 + freq * 6), 0.7)
    out = biquad(out, "peak", clamp_f(220), 0.9, 2.6)
    return out


def v_strings(freq, dur=3.0, seed=0, voices=3, vib=0.0065):
    """A section: each player is a beat flat or sharp of the next, and nobody's
    vibrato arrives at the same moment. One oscillator is a violin; three are a
    string sound."""
    rng = np.random.default_rng(seed)
    n = max(128, int(dur * SR))
    out = np.zeros(n)
    wave = wavetable("saw10", _partials(WAVES["saw10"]))
    for v in range(voices):
        cents = (v - (voices - 1) / 2.0) * 4.5
        f0 = freq * 2.0 ** (cents / 1200.0)
        rate = 4.4 + 0.7 * v + rng.uniform(-0.2, 0.2)
        ph = rng.uniform(0, TAU) / TAU
        f = f0 * (1.0 + vibrato(n, rate, vib, 0.35 + 0.2 * v))
        out += osc(wave, f, n, ph)
    out /= voices
    bow = coloured_noise(n, "pink", seed + 3)
    out += biquad(bow, "hp", 3200, 0.7) * 0.012
    out *= adsr(n, 0.16, dur * 0.3, 0.82, 0.34, curve=1.7)
    return biquad(out, "lp", clamp_f(min(6400, 1200 + freq * 9)), 0.7)


def v_bass(freq, dur=0.9, seed=0, bright=0.5):
    n = max(64, int(dur * SR))
    wave = wavetable("tri", _partials(WAVES["tri"]))
    f = np.full(n, float(clamp_f(freq))) * (1.0 + 0.012 * np.exp(-np.linspace(0, 9, n)))
    x = osc(wave, f, n, 0.1 * seed)
    x += osc(wavetable("saw10", _partials(WAVES["saw10"])), f * 2.0, n) * 0.07 * bright
    x *= adsr(n, 0.006, dur * 0.42, 0.55, 0.24)
    x = biquad(x, "lowshelf", 130, 0.7, 2.5)
    return biquad(x, "lp", clamp_f(300 + freq * 7 * (0.4 + bright)), 0.9)


def v_brass(freq, dur=1.2, seed=0, growl=0.0):
    n = max(128, int(dur * SR))
    wave = wavetable("reed", _partials(WAVES["reed"]))
    f = np.full(n, float(clamp_f(freq)))
    if growl:
        f = f * (1.0 + growl * 0.02 * np.sin(TAU * 24 * np.arange(n) / SR))
    x = osc(wave, f, n, 0.2)
    x += osc(wave, f * 1.005, n, 0.7) * 0.7
    breath = biquad(coloured_noise(n, "white", seed + 1), "hp", 2400, 0.7)
    x += breath * 0.02
    x *= adsr(n, 0.055, dur * 0.3, 0.8, 0.16, curve=1.4)
    x = biquad(x, "peak", clamp_f(1150), 1.3, 5.0)
    x = biquad(x, "lp", clamp_f(4200), 0.7)
    return x / (peak_of(x) + 1e-9)


def v_kick(freq=52.0, dur=0.42, seed=0):
    n = max(64, int(dur * SR))
    f = freq * (1.0 + 3.4 * np.exp(-np.linspace(0, 26, n)))
    x = np.sin(TAU * cumphase(np.clip(f, 20, 400)))
    x *= np.exp(-np.linspace(0, 7.0, n))
    m = max(16, int(0.006 * SR))
    x[:m] += biquad(np.random.default_rng(seed).standard_normal(m), "lp", 3600, 0.7) * 0.35
    return x / (peak_of(x) + 1e-9)


def v_snare(dur=0.24, seed=0, tone=190.0):
    n = max(64, int(dur * SR))
    rng = np.random.default_rng(seed)
    x = biquad(rng.standard_normal(n), "bp", 1900, 0.9) * np.exp(-np.linspace(0, 7.5, n))
    t = np.sin(TAU * cumphase(np.full(n, tone))) * np.exp(-np.linspace(0, 13, n))
    y = x * 0.8 + t * 0.5
    y += biquad(coloured_noise(n, "pink", seed + 2), "hp", 6000, 0.7) * 0.05 * np.exp(-np.linspace(0, 22, n))
    return y / (peak_of(y) + 1e-9)


def v_hat(dur=0.09, seed=0, openness=0.0):
    n = max(32, int(dur * SR))
    rng = np.random.default_rng(seed)
    x = rng.standard_normal(n)
    for f in (11400, 8900, 7100, 6300):
        x = biquad(x, "hp", f, 0.8)
    decay = 9.0 + 26.0 * (1.0 - openness)
    x *= np.exp(-np.linspace(0, decay, n))
    return x / (peak_of(x) + 1e-9)


def clamp_f(f):
    return float(np.clip(f, 22.0, SR * 0.44))


# ------------------------------------------------------------------ layering

def lay(buf, at, clip, level=1.0, at_p=0.5):
    """Place a sound at a time offset. A stereo timeline accepts a mono clip
    and pans it, so the arrangers never have to think about channels."""
    n = buf.shape[0]
    s = int(round(at * SR))
    if clip.size == 0 or s >= n:
        return buf
    if s < 0:
        clip = clip[-s:]
        s = 0
    if clip.size == 0:
        return buf
    e = min(n, s + clip.shape[0])
    seg = clip[: e - s] * level
    if buf.ndim == 2 and seg.ndim == 1:
        seg = pan(seg, at_p)
    buf[s:e] += seg
    return buf


def bed(dur):
    return np.zeros(max(16, int(dur * SR)))


def sweep_filter(x, kind, f_from, f_to, q=1.0, hop=0.02):
    """A filter whose cutoff walks across the sound. An offline biquad cannot
    ramp, so this crossfades short Hann-windowed sections at 50% overlap, which
    sums flat and leaves no seam."""
    n = x.shape[0]
    H = max(128, int(hop * SR))
    out = np.zeros(n + H)
    w = np.hanning(2 * H + 1)[:H]
    w = w / (w.sum() * 2.0 / H)
    for s in range(0, n, H // 2):
        e = min(n, s + H)
        if e - s < 8:
            break
        u = ((s + e) * 0.5) / n
        f = f_from * (f_to / f_from) ** u if f_from > 0 and f_to > 0 else f_to
        seg = biquad(x[s:e], kind, clamp_f(f), q)
        out[s:s + seg.shape[0]] += seg * w[: seg.shape[0]]
    return out[:n]


def grain(x, count, spread, seed=0, curve=0.6):
    """Scatter a short sound into a handful of copies at random times and
    pitches — what a shake of chimes, a spill of pebbles or a shower of sparks
    actually is: one event, heard many times."""
    if x.shape[0] == 0:
        return x
    rng = np.random.default_rng(seed)
    unit = max(1, int(curve * SR))
    out = bed(spread + x.shape[0] / SR)
    for i in range(count):
        g = x
        st = rng.uniform(0.92, 1.12)
        if abs(st - 1) > 0.01:
            idx = np.clip((np.arange(g.shape[0]) * st).astype(int), 0, g.shape[0] - 1)
            g = g[idx]
        lay(out, rng.uniform(0, max(0.001, spread)), g, rng.uniform(0.35, 1.0))
    return out[: max(unit, out.shape[0])]


# ------------------------------------------------------------------ measurement

def db(v):
    return 20.0 * math.log10(max(1e-9, float(v)))


def centroid(x):
    """The brightness of a sound in one number, so "this click is darker than
    that one" can be checked by a test instead of argued about by ear."""
    y = np.asarray(x)
    if y.ndim == 2:
        y = y.mean(1)
    if y.shape[0] < 32:
        return 0.0
    m = np.abs(np.fft.rfft(y * np.hanning(y.shape[0])))
    f = np.fft.rfftfreq(y.shape[0], 1.0 / SR)
    tot = m.sum()
    return float((f * m).sum() / tot) if tot > 1e-9 else 0.0


def attack_ms(x):
    """How long the sound takes to arrive, measured on the running maximum so a
    percussive decay cannot masquerade as a slow swell. A tap should read well
    under 5 ms; anything a child perceives as late reads in the hundreds."""
    y = np.abs(np.asarray(x))
    if y.ndim == 2:
        y = y.max(1)
    if y.shape[0] < 64:
        return 0.0
    p = y.max()
    if p <= 1e-9:
        return 0.0
    run = np.maximum.accumulate(y)
    lo = int(np.searchsorted(run, 0.1 * p))
    hi = int(np.searchsorted(run, 0.9 * p))
    return (hi - lo) * 1000.0 / SR


def rms_of(x):
    return math.sqrt(float((np.asarray(x) ** 2).mean()) + 1e-12)


def stats(x, loop=False):
    y = np.asarray(x)
    s = dict(duration=round(y.shape[0] / SR, 4),
             peak_db=round(db(peak_of(y)), 2),
             rms_db=round(db(rms_of(y)), 2),
             dc=round(float(np.mean(y)), 6),
             clipped=int(int(np.sum(np.abs(y) > 0.999))),
             centroid_hz=round(centroid(y)),
             attack_ms=round(attack_ms(y), 2),
             crest=round(db(peak_of(y) / rms_of(y)), 2))
    if loop and y.shape[0] > 512:
        # A loop is periodic, so the sample before the first is the last one.
        # The seam is inaudible when that step is no bigger than the ordinary
        # step-to-step movement of the waveform either side of it.
        d = np.diff(y, axis=0) if y.ndim == 2 else np.diff(y)
        step = float(np.abs(d).mean()) + 1e-12
        seam = float(np.abs(y[0] - y[-1]).mean())
        s["join_ratio"] = round(seam / step, 3)
        w = min(2205, y.shape[0] // 4)          # 50 ms, not one waveform cycle
        a = y[-w:]
        b = y[:w]
        s["loudness_jump"] = round(db(rms_of(b) / (rms_of(a) + 1e-9)), 3)
    return s


# ------------------------------------------------------------------ the bank
# A sound effect in this collection is a recording of a thing, not a waveform
# with an envelope. The name the games ask for is unchanged; what answers it is
# now an object in a room. `peak` is the level the finished clip is normalised
# to, chosen from the rex-roar reference (-8.3 dBFS measured peak) and the
# number of times the name fires: the more often a sound plays, the quieter it
# has to be or the child turns the tablet face down.

SFX = {}


def effect(name, peak=-16.0, send=0.14, room="chamber", variants=3, loop=False):
    def deco(fn):
        SFX[name] = dict(build=fn, peak=peak, send=send, room=room,
                         variants=variants, loop=loop)
        return fn
    return deco


def note_hz(i, oct_up=0):
    """The exact twelve pitches fx/du-fx.js already promises for sfx.note(i)."""
    NOTES = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784]
    return NOTES[((i % 12) + 12) % 12] * (2.0 ** oct_up)


def _pad(a, n):
    if a.shape[0] >= n:
        return a[:n]
    return np.concatenate([a, np.zeros(n - a.shape[0])])


def plink(freq, dur, seed, hard=0.5):
    """The house sound of a correct answer: a wooden bar, warm and short."""
    a = v_marimba(freq, dur, seed=seed, hard=hard)
    b = v_piano(freq * 2, min(dur, 0.7), seed=seed + 1, soft=0.6) * 0.28
    n = max(a.shape[0], b.shape[0])
    return _pad(a, n) + _pad(b, n)


# ------------------------------------------------------------ interface taps
@effect("tap", peak=-15.0, send=0.10, variants=4)
def sfx_tap(seed):
    body = modal(2100 + seed * 90, 0.055, RATIOS["wood"][0], [0.05, 0.02, 0.012, 0.008, 0.005],
                 seed=seed, strike=0.0035, strike_f=5200,
                 body=[("peak", 2600, 2.2, 6.0), ("lp", 9000, 0.7)])
    skin = biquad(coloured_noise(0.02 * SR, "white", seed), "bp", 1500, 1.4)
    x = bed(0.075)
    lay(x, 0, body * 0.9)
    lay(x, 0.001, skin * 0.22)
    return x


@effect("ui", peak=-17.0, send=0.08)
def sfx_ui(seed):
    x = bed(0.09)
    lay(x, 0, v_hat(0.014, seed) * 0.35)
    lay(x, 0.002, modal(1400, 0.06, RATIOS["wood"][0], [0.05] * 5, seed=seed, strike=0.003) * 0.8)
    return x


@effect("tick", peak=-19.0, send=0.06)
def sfx_tick(seed):
    x = bed(0.05)
    lay(x, 0, biquad(coloured_noise(0.006 * SR, "white", seed), "bp", 3400, 2.4) * 0.7)
    lay(x, 0.004, modal(2700, 0.035, RATIOS["wood"][0], [0.02] * 5, seed=seed, strike=0.002) * 0.5)
    return x


@effect("pop", peak=-14.0, send=0.12)
def sfx_pop(seed):
    x = bed(0.24)
    f = 780.0 + seed * 55
    n = int(0.10 * SR)
    t = np.arange(n) / SR
    body = np.sin(TAU * cumphase(f * np.exp(-t * 9.0))) * np.exp(-t * 26)
    lay(x, 0, biquad(coloured_noise(int(0.012 * SR), "white", seed), "bp", 2100, 1.1) * 0.55)
    lay(x, 0.001, body * 0.95)
    lay(x, 0.03, v_hat(0.02, seed + 4, 0.4) * 0.10)
    return x


@effect("coin", peak=-15.0, send=0.20)
def sfx_coin(seed):
    x = bed(0.75)
    lay(x, 0, modal(3150, 0.34, RATIOS["token"][0], RATIOS["token"][1], seed=seed,
                    strike=0.004, strike_f=8000, body=[("peak", 5200, 2.0, 5.0)]) * 0.9)
    # a token does not stop at once: it wobbles on its edge, and the wobble is
    # the whole reason a coin sounds like money rather than a beep
    rng = np.random.default_rng(seed + 7)
    for i in range(7):
        f = 1900 + rng.uniform(-180, 260) + i * 90
        lay(x, 0.06 + i * 0.075 + rng.uniform(-0.008, 0.008),
            modal(f, 0.12, RATIOS["metal"][0], [0.06] * 8, seed=seed + i, strike=0.002) * (0.5 - i * 0.05))
    return x


@effect("star", peak=-15.0, send=0.34, room="hall")
def sfx_star(seed):
    x = bed(1.5)
    f = 1560 + seed * 70
    lay(x, 0, v_bell(f, 1.15, seed=seed, kind="glock", bright=1.15) * 0.8)
    shimmer = grain(modal(5200, 0.05, RATIOS["metal"][0], [0.05] * 8, seed=seed + 2, strike=0.002),
                    9, 0.4, seed=seed + 3) * 0.30
    lay(x, 0.01, shimmer)
    lay(x, 0.0, biquad(coloured_noise(int(0.25 * SR), "pink", seed), "hp", 6000, 0.7)
        * np.exp(-np.linspace(0, 5, int(0.25 * SR))) * 0.10)
    return x


@effect("sparkle", peak=-16.0, send=0.30, room="hall", variants=4)
def sfx_sparkle(seed):
    """75 games ask for this one. It is the most-heard sound in the collection,
    so it is built as a handful of glass grains in a hall rather than one bell:
    short enough to sit under a tap, long enough to feel like light."""
    rng = np.random.default_rng(seed)
    x = bed(1.15)
    for i in range(8):
        f = rng.uniform(2400, 6200)
        lay(x, rng.uniform(0, 0.28), v_bell(f, rng.uniform(0.25, 0.7), seed=seed + 11 * i,
                                           kind="glock", bright=1.3, taper=0.8) * rng.uniform(0.16, 0.5))
    lay(x, 0.0, biquad(coloured_noise(int(0.14 * SR), "white", seed), "hp", 7000, 0.8) * 0.06)
    return x


# ------------------------------------------------------------ right and wrong
@effect("good", peak=-14.0, send=0.22, room="hall")
def sfx_good(seed):
    x = bed(1.25)
    a, b = note_hz(0, 1), note_hz(4, 1)
    lay(x, 0, plink(a, 0.55, seed, 0.6) * 0.9)
    lay(x, 0.105, plink(b, 0.85, seed + 3, 0.55) * 0.95)
    lay(x, 0.105, v_bell(b * 2, 1.0, seed + 5, bright=1.2) * 0.16)
    return x


@effect("win", peak=-11.0, send=0.34, room="hall", variants=4)
def sfx_win(seed):
    """A win is the moment a child remembers, and 42 places in this collection
    ask for it. Two octaves of a pentatonic run on a piano with a string pad
    under it and one struck gong to close: Disney, not a video game."""
    rng = np.random.default_rng(seed)
    x = bed(2.9)
    seq = [note_hz(k, 0) for k in (0, 2, 4, 7)] + [note_hz(0, 1), note_hz(4, 1)]
    for i, f in enumerate(seq):
        lay(x, i * 0.105 + rng.uniform(-0.004, 0.004),
            v_piano(f, 1.5 if i == len(seq) - 1 else 0.9, seed=seed + 5 * i, soft=0.35) * 0.62)
    pad = v_strings(note_hz(0, 1), 2.2, seed=seed + 2, voices=3) * 0.22
    lay(x, 0.12, pad)
    lay(x, 0.52, v_bell(note_hz(4, 2), 1.9, seed=seed + 9, kind="bell", bright=1.1) * 0.30)
    crash = biquad(coloured_noise(int(1.1 * SR), "white", seed + 4), "hp", 3200, 0.7)
    crash *= np.exp(-np.linspace(0, 4.2, crash.shape[0]))
    swell = np.linspace(0.1, 1.0, int(0.09 * SR))
    crash[: swell.shape[0]] *= swell
    lay(x, 0.30, crash * 0.10)
    lay(x, 0.30, v_kick(58, 0.3, seed) * 0.30)
    return x


@effect("lose", peak=-17.0, send=0.26, room="hall")
def sfx_lose(seed):
    # Never a buzz. A small sad step down, and the room heard it.
    rng = np.random.default_rng(seed)
    x = bed(1.7)
    for i, k in enumerate([7, 3, 0]):
        lay(x, i * 0.17 + rng.uniform(-0.005, 0.005),
            v_piano(note_hz(k), 1.1, seed=seed + i, soft=0.65) * (0.62 - i * 0.04))
    lay(x, 0.0, v_strings(note_hz(0) * 0.5, 1.4, seed=seed + 6, voices=2) * 0.10)
    return x


@effect("fail", peak=-16.0, send=0.22, room="hall")
def sfx_fail(seed):
    rng = np.random.default_rng(seed)
    x = bed(1.5)
    for i, k in enumerate([0, -3, -7, -12]):
        f = note_hz(7) * 2.0 ** (k / 12.0)
        lay(x, i * 0.145 + rng.uniform(-0.004, 0.004), v_pluck(f, 0.75, seed=seed + i, damp=0.993) * 0.6)
    return x


@effect("bad", peak=-16.0, send=0.16)
def sfx_bad(seed):
    x = bed(0.62)
    lay(x, 0, v_kick(120, 0.20, seed) * 0.55)
    lay(x, 0.005, modal(330, 0.30, RATIOS["skin"][0], [0.16, 0.09, 0.05, 0.03, 0.02],
                        seed=seed + 1, strike=0.006, strike_f=900,
                        body=[("lp", 1400, 0.7)]) * 0.55)
    lay(x, 0.02, biquad(coloured_noise(int(0.12 * SR), "brown", seed), "lp", 900, 0.9) * 0.18)
    return x


@effect("hurt", peak=-15.0, send=0.20)
def sfx_hurt(seed):
    """The animal equivalent: air forced out of a chest. No voice, no pain."""
    x = bed(0.55)
    n = int(0.20 * SR)
    t = np.arange(n) / SR
    f = 190 * np.exp(-t * 2.6) * (1 + 0.05 * np.sin(TAU * 27 * t))
    g = osc(wavetable("reed", _partials(WAVES["reed"])), f, n) * np.exp(-t * 12)
    lay(x, 0, lp(g, 900) * 0.75)
    lay(x, 0.01, v_kick(96, 0.22, seed) * 0.5)
    return x


# ------------------------------------------------------------ movement
@effect("jump", peak=-16.0, send=0.16)
def sfx_jump(seed):
    """Cloth, then a push-off. A jump with no sound feels broken to a child,
    and a jump that sounds like a laser feels like a different game."""
    x = bed(0.42)
    air = sweep_filter(coloured_noise(int(0.20 * SR), "pink", seed), "bp",
                       320, 2600, 1.1, hop=0.012)
    env = np.sin(np.linspace(0, math.pi, air.shape[0])) ** 1.4
    lay(x, 0, air * env * 0.55)
    n = int(0.13 * SR)
    t = np.arange(n) / SR
    lay(x, 0.015, np.sin(TAU * cumphase(240 * np.exp(t * 4.6))) * np.exp(-t * 22) * 0.5)
    lay(x, 0, modal(1500, 0.05, RATIOS["wood"][0], [0.03] * 5, seed=seed, strike=0.003) * 0.35)
    return x


@effect("land", peak=-15.0, send=0.18)
def sfx_land(seed):
    x = bed(0.5)
    lay(x, 0, v_kick(72, 0.24, seed) * 0.7)
    lay(x, 0.004, biquad(coloured_noise(int(0.14 * SR), "brown", seed), "lp", 2600, 0.9)
        * np.exp(-np.linspace(0, 8, int(0.14 * SR))) * 0.6)
    lay(x, 0.05, grain(modal(2400, 0.04, RATIOS["stone"][0], [0.03] * 6, seed=seed + 2,
                             strike=0.002), 6, 0.20, seed=seed + 3) * 0.22)
    return x


@effect("thud", peak=-14.0, send=0.14)
def sfx_thud(seed):
    x = bed(0.55)
    lay(x, 0, v_kick(58 + seed * 2.5, 0.34, seed) * 0.85)
    lay(x, 0.003, modal(140, 0.22, RATIOS["skin"][0], [0.20, 0.10, 0.05, 0.03, 0.02],
                        seed=seed + 1, strike=0.005, strike_f=420,
                        body=[("lp", 900, 0.8)]) * 0.6)
    return x


@effect("whoosh", peak=-17.0, send=0.20, room="hall", variants=4)
def sfx_whoosh(seed):
    """Stereo on purpose: the air has to cross the child's head, since the
    screen is held in front of them. Builds two independent beds, because the
    left and right ears must never hear the same grain of noise."""
    rng = np.random.default_rng(seed)
    dur, tail = 0.40, 0.10
    chans = []
    for ch in range(2):
        x = bed(dur + tail)
        n = int(dur * SR)
        f = rng.uniform(170, 260)
        air = sweep_filter(coloured_noise(n, "pink", seed + 31 * ch), "bp",
                           f, 4300 if ch == 0 else 3300, 1.05, hop=0.018)
        lay(x, 0, air * np.sin(np.linspace(0, math.pi, n)) ** 1.6 * 0.9)
        crack = sweep_filter(coloured_noise(int(0.16 * SR), "white", seed + 8 + ch),
                             "bp", 5200, 1300, 1.4)
        lay(x, 0.15 + ch * 0.012, crack * 0.22)
        chans.append(x)
    return normalize(np.stack(chans, 1), -3.0)


@effect("boing", peak=-16.0, send=0.18)
def sfx_boing(seed):
    """A spring is a pitch that overshoots and comes back wobbling, so the
    frequency itself is what decays here."""
    n = int(0.46 * SR)
    t = np.arange(n) / SR
    f = 210 + 620 * np.exp(-t * 14) * np.cos(TAU * 8.5 * t)
    f = np.clip(f, 60, 1400)
    wave = wavetable("soft", _partials(WAVES["soft"]))
    x = osc(wave, f, n) * np.exp(-t * 6.5)
    return lp(lay(x, 0, v_hat(0.02, seed) * 0.10), 4200)


@effect("scrape", peak=-20.0, send=0.16)
def sfx_scrape(seed):
    """Bone on packed sand: a bow of noise whose resonances wander."""
    n = int(0.55 * SR)
    rng = np.random.default_rng(seed)
    x = coloured_noise(n, "pink", seed)
    y = sweep_filter(x, "bp", rng.uniform(900, 1500), rng.uniform(2400, 3600), 6.0, hop=0.014)
    y += sweep_filter(x, "bp", 260, 180, 9.0, hop=0.02) * 0.5
    env = np.hanning(n) ** 0.8
    z = bed(0.7)
    lay(z, 0.0, y * env * 0.9)
    lay(z, 0.30, grain(modal(3100, 0.03, RATIOS["stone"][0], [0.02] * 6, seed=seed + 1,
                             strike=0.0015), 5, 0.24, seed=seed + 4) * 0.18)
    return z


# ------------------------------------------------------------ creatures
@effect("chirp", peak=-17.0, send=0.24, room="chamber", variants=4)
def sfx_chirp(seed):
    """A hatchling. Small birds slide up and trill on the way down, and the
    trill is what stops it sounding like a doorbell."""
    rng = np.random.default_rng(seed)
    x = bed(0.5)
    for i in range(2):
        n = int((0.075 + rng.uniform(0, 0.03)) * SR)
        t = np.arange(n) / SR
        f0 = rng.uniform(2200, 2800)
        f = f0 * (1.35 - 0.5 * t / (n / SR))
        f = f * (1 + 0.055 * np.sin(TAU * (38 + rng.uniform(-6, 10)) * t))
        c = osc(wavetable("flute", _partials(WAVES["flute"])), f, n)
        c *= np.sin(np.linspace(0, math.pi, n)) ** 0.7
        lay(x, i * (0.10 + rng.uniform(0, 0.05)) + 0.01, c * 0.8)
    return x


@effect("chomp", peak=-13.0, send=0.20)
def sfx_chomp(seed):
    """Jaw: two hard clicks a hand's width apart, a gust of air between them and
    something heavier landing."""
    rng = np.random.default_rng(seed)
    x = bed(0.6)
    for i, at in enumerate([0.0, 0.075]):
        c = modal(rng.uniform(700, 1100), 0.09, RATIOS["bone"][0], RATIOS["bone"][1],
                  seed=seed + i, strike=0.005, strike_f=4200,
                  body=[("peak", 1800, 3.0, 6.0), ("lp", 7000, 0.7)])
        lay(x, at, c * 0.85)
        lay(x, at + 0.002, v_kick(150 - i * 40, 0.10, seed + i) * 0.4)
    lay(x, 0.01, sweep_filter(coloured_noise(int(0.09 * SR), "pink", seed), "bp",
                             1200, 300, 1.6) * 0.25)
    return x


@effect("roar", peak=-9.0, send=0.42, room="hall", variants=3)
def sfx_roar(seed):
    """The reference for this whole pass is the T-rex the collection already
    owns, and what makes it work is not the size of the sound but the beading:
    a loose vocal membrane flapping in the airstream, which puts a rough buzz
    inside the pitch and slides as the chest empties. Layers: chest, beads,
    breath, and a cave to say how large the animal is."""
    rng = np.random.default_rng(seed)
    dur = 1.55 + rng.uniform(0, 0.35)
    n = int(dur * SR)
    t = np.arange(n) / SR
    f0 = 132.0 + rng.uniform(-12, 18)
    slide = f0 * (1.0 + 0.42 * np.exp(-t * 3.2) - 0.55 * (t / dur) ** 1.6)
    beads = TAU * rng.uniform(52, 74) * t * (1 - 0.25 * t / dur)
    src = osc(wavetable("reed", _partials(WAVES["reed"])),
              np.clip(slide * (1 + 0.14 * np.sin(beads)), 30, 600), n)
    sub = osc(wavetable("soft", _partials(WAVES["soft"])), np.clip(slide * 0.5, 25, 400), n) * 0.85
    body = src * 0.9 + sub
    formant = sweep_filter(body, "peak", 620, 300, 2.2, hop=0.03)
    formant += sweep_filter(body, "peak", 1250, 700, 3.0, hop=0.03) * 0.6
    formant += sweep_filter(body, "peak", 2500, 1500, 4.0, hop=0.03) * 0.30
    breath = coloured_noise(n, "pink", seed + 5)
    gust = sweep_filter(breath, "bp", 500, 1700, 1.1, hop=0.03) * (0.30 + 0.35 * np.abs(np.sin(beads * 0.5)))
    rasp = lp(breath, 700) * 0.25
    x = formant * 0.85 + gust * 0.5 + rasp * 0.4
    swell = np.clip(t / 0.10, 0, 1) * np.exp(-np.linspace(0, 2.4, n))
    wob = 1 + 0.10 * np.sin(TAU * rng.uniform(3.4, 5.2) * t)
    x = x * swell * wob
    return normalize(lay(x, 0, v_kick(46, 0.5, seed) * 0.28), -3.0)


@effect("splash", peak=-14.0, send=0.28, room="hall")
def sfx_splash(seed):
    """Water is a broadband slap, then the surface remembering it was broken."""
    rng = np.random.default_rng(seed)
    x = bed(0.95)
    slap = coloured_noise(int(0.14 * SR), "white", seed)
    slap *= np.exp(-np.linspace(0, 6.5, slap.shape[0]))
    lay(x, 0, biquad(slap, "hp", 500, 0.8) * 0.85)
    body = sweep_filter(coloured_noise(int(0.34 * SR), "pink", seed + 2), "bp",
                        1700, 260, 1.3, hop=0.016)
    lay(x, 0.01, body * np.exp(-np.linspace(0, 3.0, body.shape[0])) * 0.9)
    for i in range(9):
        f = rng.uniform(700, 2600)
        n2 = int(0.03 * SR)
        t = np.arange(n2) / SR
        plop = np.sin(TAU * cumphase(f * np.exp(t * 5.5))) * np.exp(-t * 55)
        lay(x, rng.uniform(0.06, 0.55), plop * rng.uniform(0.10, 0.34))
    return x


@effect("drum-1", peak=-12.0, send=0.24, room="hall")
def sfx_drum1(seed):
    x = bed(0.7)
    lay(x, 0, v_kick(48, 0.42, seed) * 0.95)
    lay(x, 0.0, biquad(coloured_noise(int(0.05 * SR), "brown", seed), "lp", 300, 1.0) * 0.4)
    return x


@effect("drum-2", peak=-13.0, send=0.22, room="hall")
def sfx_drum2(seed):
    """A floor tom, tuned a fourth above the kick the arcades already use."""
    x = bed(0.5)
    lay(x, 0, modal(98, 0.38, RATIOS["skin"][0], [0.28, 0.16, 0.09, 0.05, 0.03],
                    seed=seed, strike=0.006, strike_f=300,
                    body=[("lp", 2200, 0.8), ("peak", 180, 1.6, 5.0)]) * 0.95)
    lay(x, 0.0, v_hat(0.05, seed + 3, 0.2) * 0.10)
    return x


@effect("drum-3", peak=-14.0, send=0.20, room="hall")
def sfx_drum3(seed):
    x = lay(bed(0.4), 0, v_snare(0.26, seed) * 0.9)
    return normalize(lay(x, 0, v_hat(0.05, seed + 1) * 0.12), -3.0)


@effect("drum-4", peak=-16.0, send=0.30, room="hall")
def sfx_drum4(seed):
    """A crash is a sheet of metal arguing with itself; two tokens a fifth
    apart, shaken, will do for a ride cymbal."""
    x = bed(1.1)
    lay(x, 0, modal(1180, 0.85, RATIOS["plate"][0], RATIOS["plate"][1], seed=seed,
                    strike=0.008, strike_f=9000, body=[("hp", 600, 0.7)]) * 0.55)
    lay(x, 0.0, v_hat(0.30, seed + 2, 0.85) * 0.4)
    return x


@effect("boom", peak=-8.0, send=0.46, room="cave", variants=3)
def sfx_boom(seed):
    """The volcano has an actual cue. Sub first, then the crack, then the
    rubble arriving a moment later because debris is never simultaneous."""
    rng = np.random.default_rng(seed)
    x = bed(2.6)
    n = int(1.1 * SR)
    t = np.arange(n) / SR
    sub = np.sin(TAU * cumphase(np.clip(92 * np.exp(-t * 2.4) + 26, 20, 300))) * np.exp(-t * 3.0)
    lay(x, 0, sub * 0.95)
    crack = coloured_noise(int(0.30 * SR), "white", seed)
    crack *= np.exp(-np.linspace(0, 11, crack.shape[0]))
    lay(x, 0.004, biquad(crack, "bp", 2400, 0.8) * 0.75)
    lay(x, 0.0, v_kick(70, 0.5, seed) * 0.55)
    fall = sweep_filter(coloured_noise(int(1.6 * SR), "brown", seed + 3), "lp", 1600, 200, 1.2, hop=0.05)
    lay(x, 0.12, fall * np.hanning(fall.shape[0]) * 0.34)
    lay(x, 0.20, grain(modal(1700, 0.05, RATIOS["stone"][0], [0.04] * 6, seed=seed + 5,
                             strike=0.002), 11, 1.1, seed=seed + 6) * 0.20)
    return normalize(x, -2.0)


@effect("engine", peak=-16.0, send=0.16, variants=2, loop=True)
def sfx_engine(seed):
    """A four-stroke at idle, rendered as a loop so the vehicles can hold it
    under a drive instead of re-firing a one-shot."""
    rng = np.random.default_rng(seed)
    dur = 1.1
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 46.0 + rng.uniform(-2, 3)
    firing = (np.sin(TAU * 4 * f * t) * 0.5 + 0.5) ** 6
    wave = wavetable("saw20", _partials(WAVES["saw20"]))
    x = osc(wave, f * (1 + 0.004 * np.sin(TAU * 0.9 * t)) * (1 + 0.02 * firing), n)
    x = lp(x, 900) * 0.8
    x += firing * 0.35
    x += coloured_noise(n, "brown", seed) * 0.10
    x = tilt(x, low_db=3.0, high_db=-6.0)
    return normalize(x, -3.0)


@effect("pick", peak=-16.0, send=0.22, room="hall")
def sfx_pick(seed):
    x = bed(0.85)
    for i, k in enumerate([0, 4, 7]):
        lay(x, i * 0.045, plink(note_hz(k, 2), 0.5, seed + 3 * i, 0.7) * 0.55)
    return x


@effect("chime", peak=-16.0, send=0.40, room="hall")
def sfx_chime(seed):
    x = bed(2.2)
    lay(x, 0, v_bell(1046, 1.6, seed=seed, kind="bell") * 0.7)
    lay(x, 0.11, v_bell(1568, 1.9, seed=seed + 2, kind="bell") * 0.5)
    return x


@effect("scuff", peak=-20.0, send=0.12)
def sfx_scuff(seed):
    return grain(modal(1800, 0.05, RATIOS["stone"][0], [0.03] * 6, seed=seed, strike=0.002),
                 5, 0.16, seed=seed + 1)


for _i in range(12):
    def _mk(_i=_i):
        @effect("note-%02d" % _i, peak=-15.0, send=0.26, room="hall", variants=2)
        def _sfx_note(seed, _i=_i):
            f = note_hz(_i)
            x = bed(1.4)
            lay(x, 0, v_piano(f, 1.2, seed=seed, soft=0.45) * 0.72)
            lay(x, 0, plink(f, 0.8, seed + 4, 0.55) * 0.34)
            return x
    _mk()


# DUMusic.mood() stingers — the score needs three one-shots of its own.
@effect("stinger-win", peak=-12.0, send=0.42, room="hall", variants=2)
def sfx_stinger_win(seed):
    x = bed(2.6)
    for i, k in enumerate([0, 4, 7, 12]):
        lay(x, i * 0.085, v_piano(note_hz(k, 1), 1.8, seed=seed + i, soft=0.3) * 0.6)
    lay(x, 0.02, v_strings(note_hz(12, 0), 2.2, seed=seed + 9) * 0.30)
    lay(x, 0.30, v_bell(note_hz(7, 2), 2.2, seed=seed + 4, kind="bell") * 0.34)
    return x


@effect("stinger-lose", peak=-16.0, send=0.34, room="hall", variants=2)
def sfx_stinger_lose(seed):
    x = bed(2.0)
    lay(x, 0, v_strings(note_hz(3) * 0.5, 1.8, seed=seed, voices=3) * 0.55)
    lay(x, 0.05, v_piano(note_hz(0), 1.5, seed=seed + 2, soft=0.7) * 0.45)
    return x


@effect("stinger-hush", peak=-20.0, send=0.5, room="hall", variants=2)
def sfx_stinger_hush(seed):
    x = bed(2.4)
    lay(x, 0, v_bell(note_hz(7, 2), 2.2, seed=seed, kind="glock", bright=0.8) * 0.45)
    lay(x, 0.4, v_strings(note_hz(12, 0), 1.9, seed=seed + 3, voices=2) * 0.22)
    return x


@effect("swell", peak=-15.0, send=0.45, room="cave", variants=2)
def sfx_swell(seed):
    """For the reveal of a thing that is very large. Inverse envelope: the room
    arrives before the object does."""
    rng = np.random.default_rng(seed)
    dur = 2.2
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = rng.uniform(58, 74)
    wave = wavetable("soft", _partials(WAVES["soft"]))
    x = osc(wave, np.full(n, f), n) * 0.7
    x += sweep_filter(coloured_noise(n, "brown", seed), "lp", 300, 1200, 1.1, hop=0.06) * 0.5
    x *= np.linspace(0.0, 1.0, n) ** 2.2
    hit = v_kick(60, 0.9, seed) * 0.9
    out = bed(dur + 0.9)
    lay(out, 0, x)
    lay(out, dur - 0.02, hit)
    return out


# ------------------------------------------------------------------ post


def wrap_convolve(x, h):
    """Convolution on a ring, done by folding the overflow back onto the head.
    Exactly circular, but through overlap-add, so the loop length does not have
    to be a power of two for the FFT to be quick."""
    n = x.shape[0]
    y = fftconvolve(x, h[:n])
    out = y[:n].copy()
    over = y.shape[0] - n
    if over > 0:
        out[:over] += y[n:]
    return out


def trim_edges(x, floor_db=-72, keep_head=0.002, keep_tail=0.30):
    """Drop the silence a rendered clip is born with, so a 30 ms tap does not
    carry two seconds of hall, but never cut a ring-out short."""
    y = np.asarray(x)
    a = np.abs(y)
    env = a.max(1) if a.ndim == 2 else a
    thr = 10.0 ** (floor_db / 20.0) * (peak_of(y) + 1e-9)
    idx = np.flatnonzero(env > thr)
    if idx.size == 0:
        return y[:8]
    s = max(0, int(idx[0] - keep_head * SR))
    e = min(y.shape[0], int(idx[-1] + keep_tail * SR))
    e = max(e, s + 8)
    return y[s:e] if y.ndim == 1 else y[s:e, :]


def post(clip, spec, seed=0):
    """Room, level, edges. Everything the games ask for goes through here, so
    one change to a bus level reaches the whole collection."""
    x = np.asarray(clip, dtype=np.float64)
    sustained = bool(spec.get("loop"))
    if x.ndim == 1:
        # the last 3 dB of a click's character is which ear it lands in
        x = pan(x, 0.5 + ((seed % 5) - 2) * 0.055 * spec.get("spread", 1.0))
    if spec.get("send", 0.0) > 0.0:
        x = verb(x, room(spec.get("room", "chamber")), spec["send"],
                 ring=x.shape[0] if sustained else 0)
    if not sustained:
        x = trim_edges(x)
    x = tilt(x, spec.get("low_db", 0.0), spec.get("high_db", 0.0),
             ring=x.shape[0] if sustained else 0)
    x = dc_block(x, ring=x.shape[0] if sustained else 0)
    # Shape first, level second. Fading in after normalising scales the very
    # samples the level was set by: a 1.5 ms ramp on a 70 ms interface tap
    # took it from -15 dBFS to -29, which is the difference between a click a
    # child hears and one nobody does. The ramp is also capped as a fraction of
    # the clip so a short sound is not mostly attack-smear.
    n = x.shape[0]
    fin = min(spec.get("fin", 0.0015), 0.05 * n / SR)
    x = fade(x, fin, 0.0 if sustained else spec.get("fout", 0.006))
    return normalize(x, spec.get("peak", -14.0))


# ------------------------------------------------------------------ the score
# du-music.js runs a 32-step grid (two 4/4 bars) and walks its four-chord cycle
# once every four passes, so a theme is really eight bars long before it
# repeats. The renderer walks the same grid with the same chord per pass, which
# is what makes the sampled park theme the park theme rather than new material.

def arrangement(name, T, bars=8, intensity=1.0, seed=0):
    spb = 60.0 / T["bpm"] / 4.0
    steps = int(bars * 16)                     # sixteenth notes; 16 to the bar
    loop_len = int(round(steps * spb * SR))
    buf = np.zeros((loop_len, 2))
    cache = {}

    def take(kind, freq, dur, **kw):
        key = (kind, midi_of(freq), round(dur, 3), tuple(sorted(kw.items())))
        hit = cache.get(key)
        if hit is None:
            hit = VOICES[kind](clamp_f(freq), dur, **kw)
            cache[key] = hit
        return hit

    for i in range(steps):
        t = i * spb
        pass_no = i // 32
        chord = T["chords"][(pass_no * 2 + (i // 16)) % len(T["chords"])]
        beat = i % 8
        # the pad is the only thing holding the harmony; it wants to be late
        # enough to arrive under the melody and long enough to overlap itself
        if T.get("pad") and beat == 0:
            for j, d in enumerate(chord):
                buf = add(buf, t, take("strings", hz(T, d, 0), spb * 15, seed=seed + j),
                          0.20, at=0.5 + (j - 1) * 0.22, ring=loop_len)
        if T.get("bass"):
            if beat == 0 or beat == 4 or (intensity > 0.6 and beat == 6):
                d = chord[T["bass"][(i // 8) % len(T["bass"])] % 3]
                buf = add(buf, t, take("bass", hz(T, d, -1), spb * 3.4, seed=seed),
                          0.46, ring=loop_len)
        if T.get("pluck") and intensity > 0.25 and beat % 2 == 0:
            step_in_chord = T["pluck"][((i // 2) % len(T["pluck"]))] % 3
            d = chord[step_in_chord] if step_in_chord < len(chord) else chord[0]
            buf = add(buf, t, take("harp", hz(T, d, 1), spb * 6, seed=seed + i),
                      0.20 * intensity, at=0.34 if (i // 2) % 2 else 0.66, ring=loop_len)
        mel = T["bells"][i % 32]
        if mel is not None and intensity > 0.12:
            f = hz(T, mel, 1)
            buf = add(buf, t, take("bell", f, max(1.1, spb * 5), seed=seed + 7 * i),
                      0.30, at=0.5 + 0.10 * math.sin(i * 0.7), ring=loop_len)
            if intensity > 0.72:
                buf = add(buf, t + spb * 0.5, take("bell", hz(T, mel, 2), 0.7, seed=seed + i),
                          0.075, at=0.62, ring=loop_len)
        if T.get("kit"):
            if beat == 0:
                buf = add(buf, t, take("kick", 50.0, 0.36, seed=seed), 0.5, ring=loop_len)
            if beat == 4:
                buf = add(buf, t, take("snare", 200.0, 0.22, seed=seed + 1), 0.24,
                          at=0.56, ring=loop_len)
            if i % 2 == 1:
                buf = add(buf, t, take("hat", 9000.0, 0.045 if beat != 6 else 0.11,
                                       seed=seed + i), 0.075,
                          at=0.68 if (i // 2) % 2 else 0.32, ring=loop_len)
        if T["bpm"] > 118 and beat == 2 and intensity > 0.5:
            buf = add(buf, t, take("tick", 7000.0, 0.04, seed=seed + i), 0.10, ring=loop_len)
    return buf, loop_len, steps * spb


VOICES = {
    "strings": lambda f, d, seed=0: v_strings(f, d, seed=seed),
    "bass": lambda f, d, seed=0: v_bass(f, d, seed=seed),
    "harp": lambda f, d, seed=0: v_pluck(f, d, seed=seed, damp=0.9985, bright=0.7),
    "bell": lambda f, d, seed=0: v_bell(f, d, seed=seed, kind="glock", bright=1.1),
    "marimba": lambda f, d, seed=0: v_marimba(f, d, seed=seed),
    "piano": lambda f, d, seed=0: v_piano(f, d, seed=seed),
    "brass": lambda f, d, seed=0: v_brass(f, d, seed=seed),
    "pad": lambda f, d, seed=0: v_strings(f, d, seed=seed, voices=2, vib=0.004),
    "kick": lambda f, d, seed=0: v_kick(f, d, seed=seed),
    "snare": lambda f, d, seed=0: v_snare(d, seed=seed, tone=f),
    "hat": lambda f, d, seed=0: v_hat(d, seed=seed),
    "tick": lambda f, d, seed=0: v_hat(d, seed=seed, openness=0.25),
}


MUSIC_RMS = -19.0


def master_bus(y, rms_db=MUSIC_RMS, ceiling_db=-2.0):
    """Level a long bed by loudness rather than by its loudest transient: peak
    normalising hands the whole mix to one hi-hat and leaves the strings
    inaudible. Then a soft ceiling, because a tablet speaker distorts long
    before a waveform does."""
    y = normalize_to(y, 10.0 ** (rms_db / 20.0))
    return softclip(y, 10.0 ** (ceiling_db / 20.0))


def music_chain(x, loop_len, name):
    """The master path for a score loop. Every step is taken on a ring so the
    room and the shelves are already at temperature when bar one arrives: with
    a linear highpass the loop opens with 30 Hz of rumble that was not there
    when it closed, which a child hears as a breath every twenty seconds."""
    T = THEMES[name]
    hall = room("cave" if name in ("night", "intro", "story") else "hall")
    mix = 0.30 if T.get("pad") else 0.20
    wet = np.stack([wrap_convolve(x[:, c], hall[:, c]) for c in range(2)], 1)
    y = x * 0.94 + normalize_to(wet, rms_of(x)) * mix
    y = biquad(y, "hp", 30.0, 0.7, ring=loop_len)
    y = tilt(y, low_db=1.2, high_db=-1.5, ring=loop_len)
    return master_bus(y)


def master_loop(name, T, bars=8, seed=0):
    x, loop_len, secs = arrangement(name, T, bars=bars, seed=seed)
    return music_chain(x, loop_len, name)


def normalize_to(x, target_rms):
    r = rms_of(x)
    return x if r < 1e-9 else x * (target_rms / r)


# ------------------------------------------------------------------ the world
# fx/du-ambient.js gives thirteen themes a moving backdrop and nothing to hear.
# An ambience bed is the opposite problem from a sound effect: it never stops,
# so it has to be inaudible as a loop and quiet enough to sit under the score
# and under a child talking over it. Everything below is built on a ring — the
# noise is one period of itself, every modulation is a whole number of cycles
# across the bed, events that run off the end come back on at the start, and
# the room is convolved circularly — so a bed can repeat for ten minutes
# without a seam, a hole or a hum.

AMB = {}


def amb(name, secs=30.0, rms_db=-26.0, send=0.0, room="hall", bitrate="112k"):
    def deco(fn):
        AMB[name] = dict(build=fn, secs=secs, rms=rms_db, send=send,
                         room=room, bitrate=bitrate)
        return fn
    return deco


def ring_noise(n, colour="white", seed=0):
    """Noise that is exactly one period of itself. Ordinary white noise has no
    such property: its last sample and its first have nothing to do with each
    other, which is a click once every loop."""
    n = max(64, int(n))
    rng = np.random.default_rng(seed)
    X = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1.0 / SR)
    f[0] = 1.0
    X *= f ** {"white": 0.0, "pink": -0.5, "brown": -1.0, "blue": 0.5}[colour]
    x = np.fft.irfft(X, n)[:n]
    return x / (np.abs(x).max() + 1e-9)


def wide(n, kind, f, q=0.7, gain_db=0.0, colour="pink", seeds=(1, 2), env=None,
         coupling=0.30):
    """A stereo texture from two independent periods of filtered noise, pushed
    apart by a cross-coupling. Identical noise in both ears is mono, and a mono
    wind bed played on a phone speaker is nothing at all."""
    ch = []
    for s in seeds:
        x = ring_noise(n, colour, s)
        x = biquad(x, kind, clamp_f(f), q, gain_db, ring=n)
        ch.append(x if env is None else x * env)
    c, m = math.cos(coupling), math.sin(coupling)
    return np.stack([ch[0] * c + ch[1] * m, ch[1] * c + ch[0] * m], 1)


def gusts(n, T, seed=0, cycles=4, depth=0.85, floor=0.20, power=1.7):
    """A slow loudness curve for wind, surf or rain. Only sinusoids that
    complete a whole number of cycles across the bed take part, so the
    envelope cannot disagree with itself at the seam."""
    rng = np.random.default_rng(seed)
    u = np.arange(n) / T                        # measured in loop revolutions
    e = np.zeros(n)
    wsum = 0.0
    for k in range(1, max(1, cycles) + 1):
        w = 1.0 / (k ** 0.85)
        e += w * np.sin(TAU * k * u + rng.uniform(0, TAU))
        wsum += w
    e = np.clip(0.5 + 0.5 * (e / (wsum * 0.62)), 0.0, 1.0) ** power
    e = floor + (1.0 - floor) * depth * e
    return e / (e.mean() + 1e-9)


def drone(n, T, freqs, seed=0, depth=0.35, cycles=2):
    """A held chord with nothing holding it: each partial is rounded to the
    nearest whole number of cycles across the bed, which is what lets a drone
    loop forever without beating against the join."""
    rng = np.random.default_rng(seed)
    out = np.zeros(n)
    for i, f in enumerate(freqs):
        k = max(1, int(round(f * T)))
        ph = rng.uniform(0, TAU)
        env = 1.0 + depth * gusts(n, T, seed + 17 + i, cycles=cycles,
                                  floor=0.35, power=1.2) - 0.5
        out += np.sin(TAU * k * np.arange(n) / SR + ph) * env / (1.0 + 0.35 * i)
    return out / (np.abs(out).max() + 1e-9)


def clocked(n, T, buf, clip, count, seed=0, level=(0.5, 1.0), pan=(0.10, 0.90),
            jitter=0.40, resample=0.0):
    """Scatter count events evenly around the loop. Even spacing is the point:
    a Poisson scatter leaves one lap of a bed sparse and the next crowded, and
    the child hears the repeat as a pattern rather than as weather."""
    rng = np.random.default_rng(seed)
    gap = T / max(1, count)
    for j in range(count):
        g = clip
        if resample:
            st = rng.uniform(1 - resample, 1 + resample)
            if abs(st - 1.0) > 0.01:
                idx = np.clip((np.arange(g.shape[0]) * st).astype(int), 0,
                              g.shape[0] - 1)
                g = g[idx]
        at = (j + rng.uniform(-jitter, jitter)) * gap
        buf = add(buf, at % T, g, rng.uniform(*level), rng.uniform(*pan), ring=n)
    return buf


def patter(n, T, buf, seed=0, count=180, f=(1400, 5200), level=(0.16, 0.5)):
    """Rain on a surface: not a hiss but hundreds of tiny hard impacts, each a
    band-limited click at a different pitch. The hiss underneath is added
    separately by the bed that calls this."""
    rng = np.random.default_rng(seed)
    m = max(16, int(0.012 * SR))
    gap = T / count
    for j in range(count):
        x = rng.standard_normal(m) * np.exp(-np.linspace(0, 9.0, m))
        x = biquad(x, "bp", rng.uniform(*f), rng.uniform(1.4, 3.2))
        buf = add(buf, (j + rng.uniform(-0.9, 0.9)) * gap % T, x,
                  rng.uniform(*level), rng.uniform(0.05, 0.95), ring=n)
    return buf


# --- the thirteen beds -------------------------------------------------------

@amb("meadow", secs=34, rms_db=-27, send=0.10, room="chamber")
def amb_meadow(n, T, seed):
    out = np.zeros((n, 2))
    out += 0.55 * wide(n, "lp", 780.0, 0.7, seeds=(seed + 1, seed + 2),
                       env=gusts(n, T, seed, cycles=5, floor=0.30))
    out += 0.16 * wide(n, "bp", 3400.0, 0.9, seeds=(seed + 9, seed + 10),
                       env=gusts(n, T, seed + 4, cycles=8, floor=0.05, power=2.4))
    bird = np.asarray(SFX["chirp"]["build"](seed + 77))
    out = clocked(n, T, out, bird, 26, seed + 31, level=(0.10, 0.26),
                  pan=(0.08, 0.92), resample=0.14)
    return out


@amb("night", secs=38, rms_db=-28, send=0.16, room="chamber")
def amb_night(n, T, seed):
    out = np.zeros((n, 2))
    out += 0.34 * wide(n, "lp", 460.0, 0.7, seeds=(seed + 3, seed + 4),
                       env=gusts(n, T, seed + 1, cycles=4, floor=0.45))
    m = max(24, int(0.030 * SR))
    rng = np.random.default_rng(seed + 5)
    chir = rng.standard_normal(m) * np.exp(-np.linspace(0, 5.5, m))
    chir = biquad(chir, "bp", 4700.0, 6.0)
    cricket = bed(0.42)
    for k in range(6):
        cricket = lay(cricket, k * 0.062, chir, 1.0)
    out = clocked(n, T, out, normalize(cricket, -3.0), 30, seed + 8,
                  level=(0.05, 0.13), pan=(0.05, 0.95), jitter=0.55)
    owl = v_bell(392.0, 0.9, seed=seed + 12, kind="wood", bright=0.35)
    out = clocked(n, T, out, owl, 5, seed + 19, level=(0.06, 0.14),
                  pan=(0.18, 0.82), jitter=0.45)
    return out


@amb("volcano", secs=30, rms_db=-25, send=0.22, room="cave")
def amb_volcano(n, T, seed):
    out = np.zeros((n, 2))
    tremor = gusts(n, T, seed, cycles=6, floor=0.35, power=2.1)
    out += 0.80 * wide(n, "lp", 88.0, 1.1, colour="brown",
                       seeds=(seed + 6, seed + 7), env=tremor)
    out += 0.14 * wide(n, "hp", 2600.0, 0.7, seeds=(seed + 11, seed + 12),
                       env=gusts(n, T, seed + 2, cycles=9, floor=0.0, power=3.0))
    gas = np.asarray(SFX["whoosh"]["build"](seed + 21))
    out = clocked(n, T, out, gas, 7, seed + 23, level=(0.05, 0.12),
                  pan=(0.15, 0.85), jitter=0.5)
    fall = np.asarray(SFX["thud"]["build"](seed + 31))
    out = clocked(n, T, out, grain(fall, 9, 1.1, seed + 41), 4, seed + 37,
                  level=(0.10, 0.22), pan=(0.05, 0.95), jitter=0.6)
    boom = np.asarray(SFX["boom"]["build"](seed + 51))
    out = clocked(n, T, out, boom, 3, seed + 53, level=(0.12, 0.24),
                  pan=(0.35, 0.65), jitter=0.45)
    return out


@amb("ocean", secs=32, rms_db=-26, send=0.06, room="hall")
def amb_ocean(n, T, seed):
    out = np.zeros((n, 2))
    swell = gusts(n, T, seed, cycles=3, floor=0.10, power=1.5)
    out += 0.62 * wide(n, "lp", 620.0, 0.9, colour="pink",
                       seeds=(seed + 13, seed + 14), env=swell)
    foam = gusts(n, T, seed + 5, cycles=3, floor=0.0, power=2.6)
    out += 0.22 * wide(n, "hp", 1500.0, 0.7, seeds=(seed + 15, seed + 16),
                       env=foam * swell)
    gull = np.asarray(SFX["chirp"]["build"](seed + 61))
    gull = biquad(gull, "bp", 2100.0, 1.4) * dec(gull.shape[0], 0.9)
    out = clocked(n, T, out, gull, 8, seed + 63, level=(0.06, 0.16),
                  pan=(0.05, 0.95), jitter=0.6, resample=0.20)
    return out


@amb("snow", secs=36, rms_db=-30, send=0.28, room="hall")
def amb_snow(n, T, seed):
    out = np.zeros((n, 2))
    out += 0.48 * wide(n, "lp", 1100.0, 0.7, seeds=(seed + 21, seed + 22),
                       env=gusts(n, T, seed + 3, cycles=5, floor=0.25))
    out += 0.05 * wide(n, "hp", 7000.0, 0.7, colour="blue",
                       seeds=(seed + 23, seed + 24),
                       env=gusts(n, T, seed + 8, cycles=7, floor=0.0, power=3.2))
    tick = np.asarray(SFX["scrape"]["build"](seed + 71))
    out = clocked(n, T, out, tick, 6, seed + 73, level=(0.03, 0.09),
                  pan=(0.1, 0.9), jitter=0.7, resample=0.22)
    return out


@amb("desert", secs=34, rms_db=-29, send=0.14, room="hall")
def amb_desert(n, T, seed):
    out = np.zeros((n, 2))
    out += 0.42 * wide(n, "lp", 240.0, 0.8, colour="brown",
                       seeds=(seed + 31, seed + 32),
                       env=gusts(n, T, seed + 1, cycles=3, floor=0.55))
    sand = gusts(n, T, seed + 6, cycles=6, floor=0.0, power=2.8)
    out += 0.20 * wide(n, "bp", 1700.0, 1.6, seeds=(seed + 33, seed + 34), env=sand)
    stone = np.asarray(SFX["thud"]["build"](seed + 81))
    out = clocked(n, T, out, grain(stone, 6, 0.8, seed + 83), 4, seed + 87,
                  level=(0.05, 0.14), pan=(0.1, 0.9), jitter=0.7)
    return out


@amb("space", secs=40, rms_db=-28, send=0.34, room="hall")
def amb_space(n, T, seed):
    out = np.zeros((n, 2))
    d = drone(n, T, [55.0, 82.5, 110.0, 164.8], seed=seed, depth=0.5, cycles=3)
    out += np.stack([d * 0.9, np.roll(d, int(0.004 * SR)) * 0.9], 1)
    out += 0.06 * wide(n, "bp", 900.0, 2.5, seeds=(seed + 41, seed + 42),
                       env=gusts(n, T, seed + 4, cycles=4, floor=0.1))
    ping = v_bell(1046.5, 1.5, seed=seed + 45, kind="glock", bright=0.7)
    out = clocked(n, T, out, ping, 5, seed + 47, level=(0.03, 0.08),
                  pan=(0.25, 0.75), jitter=0.65)
    return out


@amb("rain", secs=28, rms_db=-26, send=0.12, room="chamber")
def amb_rain(n, T, seed):
    out = np.zeros((n, 2))
    hiss_env = gusts(n, T, seed, cycles=4, floor=0.72, power=1.3)
    out += 0.50 * wide(n, "lp", 5200.0, 0.7, seeds=(seed + 51, seed + 52),
                       env=hiss_env)
    out += 0.18 * wide(n, "lp", 260.0, 0.8, colour="brown",
                       seeds=(seed + 53, seed + 54), env=0.8 + 0.2 * hiss_env)
    out = patter(n, T, out, seed + 55, count=210)
    return out


@amb("storm", secs=30, rms_db=-24, send=0.20, room="cave")
def amb_storm(n, T, seed):
    out = np.zeros((n, 2))
    gust = gusts(n, T, seed, cycles=6, floor=0.35, power=1.9)
    out += 0.46 * wide(n, "lp", 6400.0, 0.7, seeds=(seed + 61, seed + 62), env=gust)
    out += 0.30 * wide(n, "lp", 300.0, 0.9, colour="brown",
                       seeds=(seed + 63, seed + 64),
                       env=gusts(n, T, seed + 2, cycles=4, floor=0.4))
    out += 0.26 * wide(n, "bp", 420.0, 0.6, seeds=(seed + 65, seed + 66),
                       env=gusts(n, T, seed + 7, cycles=5, floor=0.0, power=2.2))
    out = patter(n, T, out, seed + 67, count=260, f=(1100, 6200),
                 level=(0.20, 0.62))
    bolt = np.asarray(SFX["boom"]["build"](seed + 71))
    out = clocked(n, T, out, bolt, 4, seed + 73, level=(0.20, 0.42),
                  pan=(0.2, 0.8), jitter=0.7)
    return out


@amb("sun", secs=32, rms_db=-29, send=0.18, room="hall")
def amb_sun(n, T, seed):
    out = np.zeros((n, 2))
    d = drone(n, T, [196.0, 294.0, 392.0], seed=seed + 91, depth=0.30, cycles=2)
    out += 0.16 * np.stack([d, np.roll(d, int(0.006 * SR))], 1)
    out += 0.30 * wide(n, "lp", 950.0, 0.7, seeds=(seed + 92, seed + 93),
                       env=gusts(n, T, seed + 90, cycles=4, floor=0.45))
    out += 0.06 * wide(n, "hp", 6200.0, 0.7, colour="blue",
                       seeds=(seed + 94, seed + 95),
                       env=gusts(n, T, seed + 96, cycles=9, floor=0.0, power=3.4))
    bird = np.asarray(SFX["chirp"]["build"](seed + 97))
    out = clocked(n, T, out, bird, 14, seed + 99, level=(0.05, 0.13),
                  pan=(0.1, 0.9), resample=0.16)
    return out


@amb("rainbow", secs=30, rms_db=-28, send=0.34, room="hall")
def amb_rainbow(n, T, seed):
    out = np.zeros((n, 2))
    out += 0.22 * wide(n, "lp", 1400.0, 0.7, seeds=(seed + 111, seed + 112),
                       env=gusts(n, T, seed + 110, cycles=5, floor=0.4))
    chime = v_bell(1318.5, 2.2, seed=seed + 113, kind="bell", bright=1.2)
    out = clocked(n, T, out, chime, 12, seed + 115, level=(0.04, 0.11),
                  pan=(0.05, 0.95), jitter=0.6, resample=0.10)
    spark = np.asarray(SFX["sparkle"]["build"](seed + 117))
    out = clocked(n, T, out, spark, 9, seed + 119, level=(0.03, 0.08),
                  pan=(0.15, 0.85), jitter=0.7)
    gliss = bed(2.6)
    for k, f in enumerate([523.3, 659.3, 784.0, 1046.5, 1318.5]):
        gliss = lay(gliss, k * 0.16, v_bell(f, 1.4, seed=seed + k, kind="glock"),
                    0.5, at_p=0.2 + 0.15 * k)
    out = clocked(n, T, out, gliss, 4, seed + 121, level=(0.04, 0.09),
                  pan=(0.3, 0.7), jitter=0.5)
    return out


@amb("fog", secs=36, rms_db=-30, send=0.40, room="cave")
def amb_fog(n, T, seed):
    out = np.zeros((n, 2))
    out += 0.52 * wide(n, "lp", 380.0, 0.9, seeds=(seed + 131, seed + 132),
                       env=gusts(n, T, seed + 130, cycles=3, floor=0.55))
    d = drone(n, T, [73.4, 110.0], seed=seed + 133, depth=0.45, cycles=2)
    out += 0.22 * np.stack([d, np.roll(d, int(0.011 * SR))], 1)
    horn = v_brass(146.8, 3.2, seed=seed + 135, growl=0.15)
    horn = biquad(horn, "lp", 700.0, 0.7)
    out = clocked(n, T, out, horn, 3, seed + 137, level=(0.05, 0.11),
                  pan=(0.3, 0.7), jitter=0.5)
    drip = np.asarray(SFX["splash"]["build"](seed + 139))
    out = clocked(n, T, out, drip, 9, seed + 141, level=(0.03, 0.09),
                  pan=(0.05, 0.95), jitter=0.8, resample=0.25)
    return out


@amb("wind", secs=28, rms_db=-26, send=0.10, room="hall")
def amb_wind(n, T, seed):
    out = np.zeros((n, 2))
    big = gusts(n, T, seed, cycles=7, floor=0.06, power=2.0)
    out += 0.66 * wide(n, "lp", 1500.0, 0.8, seeds=(seed + 151, seed + 152), env=big)
    out += 0.24 * wide(n, "bp", 560.0, 2.2, seeds=(seed + 153, seed + 154),
                       env=gusts(n, T, seed + 3, cycles=5, floor=0.0, power=2.6))
    whistle = sweep_filter(bed(4.0), "bp", 700.0, 2400.0, 4.0, hop=0.05)
    whistle = whistle * adsr(whistle.shape[0], 1.2, 1.0, 0.4, 1.4)
    out = clocked(n, T, out, whistle[: n], 5, seed + 157, level=(0.04, 0.10),
                  pan=(0.1, 0.9), jitter=0.6)
    return out


def ambience_post(x, spec, seed):
    n = x.shape[0]
    if spec["send"] > 0.0:
        x = verb(x, room(spec["room"]), spec["send"], ring=n)
    x = tilt(x, 0.8, -1.2, ring=n)
    return master_bus(x, rms_db=spec["rms"], ceiling_db=-3.0)


def make_loop(x, xf=0.35):
    """Fold the tail of a sustained clip across its head so the engine can set
    loop=true on the buffer. The loop becomes n-k samples: the first k are a
    crossfade in which the old lap's last k samples fade out as this lap's
    first k fade in, so the sample that follows the new end is the one the
    new start was built from. The games ask for a running engine sound, and a
    one-shot that ends is a machine that stops."""
    n = x.shape[0]
    k = min(n // 3, max(64, int(xf * SR)))
    ramp = np.linspace(0.0, 1.0, k)
    y = x.copy()
    if x.ndim == 2:
        ramp = ramp[:, None]
    y[:k] = x[n - k:n] * (1.0 - ramp) + x[:k] * ramp
    return y[:n - k]


# ------------------------------------------------------------------ files

FFMPEG = shutil.which("ffmpeg")


def write_wav(path, x):
    y = np.asarray(x, dtype=np.float64)
    if y.ndim == 1:
        y = np.stack([y, y], 1)
    pcm = np.clip(np.rint(y * 32767.0), -32768, 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def rel(path):
    p = os.path.abspath(path).replace("\\", "/")
    return "./" + p[len(ROOT.replace("\\", "/")) + 1:]


def encode(wav, mp3, bitrate="160k"):
    if not FFMPEG:
        raise SystemExit("ffmpeg not found on PATH: cannot write MP3")
    cmd = [FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", wav,
           "-vn", "-codec:a", "libmp3lame", "-b:a", bitrate,
           "-compression_level", "0", mp3]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError("ffmpeg failed on %s: %s"
                           % (os.path.basename(mp3), (r.stderr or "").strip()[-400:]))


def publish(tmp, tag, folder, x, bitrate="160k", loop=False, target=None, tol=0.6):
    """Master, encode and measure. The measurement is of the MP3, not of the
    float array, because the MP3 is what the games play and LAME moves the
    first millisecond of it around.

    That same loss is why a target is checked *after* the encode and paid back
    if it was missed: a transient scuff loses its peak in the codec's
    pre-ring and arrives 1.4 dB under the level it was built to, which is a
    sound a child hears as weaker than its neighbours for no reason at all.
    Scaling the float and re-encoding costs one pass, and the loss is
    repeatable, so the second measurement lands on the target."""
    out_dir = os.path.join(AUDIO, folder)
    os.makedirs(out_dir, exist_ok=True)
    src = os.path.join(tmp, tag + ".wav")
    dst = os.path.join(out_dir, tag + ".mp3")
    for attempt in range(2):
        write_wav(src, x)
        encode(src, dst, bitrate)
        y, _ = probe(dst)
        st = stats(y, loop=loop)
        if target is None or attempt:
            break
        kind, want = target
        got = st["peak_db"] if kind == "peak" else st["rms_db"]
        err = want - got
        if abs(err) <= tol:
            break
        if kind == "rms":
            # Loudness may be made up, but never by pushing the waveform into
            # the ceiling the report calls too loud.
            err = min(err, -1.0 - st["peak_db"])
        x = x * (10.0 ** (err / 20.0))
    st["file"] = rel(dst)
    st["bytes"] = os.path.getsize(dst)
    st["sr"] = y.shape[0]
    return st


def probe(path):
    """Decode what actually got written, so a bad encode cannot hide behind a
    good-looking array."""
    tmpd = tempfile.mkdtemp(prefix="duprobe")
    wav = os.path.join(tmpd, "p.wav")
    try:
        r = subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y",
                            "-i", path, "-acodec", "pcm_s16le", wav],
                           capture_output=True, text=True)
        if r.returncode:
            raise RuntimeError("probe failed: " + (r.stderr or "").strip()[-300:])
        with wave.open(wav, "rb") as w:
            n = w.getnframes()
            raw = w.readframes(n)
            y = np.frombuffer(raw, dtype="<i2").reshape(n, w.getnchannels())
            y = y.astype(np.float64) / 32768.0
        return y, n
    finally:
        shutil.rmtree(tmpd, ignore_errors=True)


# ------------------------------------------------------------------ drivers

def seed_for(name, k):
    h = sum(ord(c) * (i + 3) for i, c in enumerate(name))
    return 1009 + 7919 * k + 31 * (h % 8191)


def build_sfx(tmp, only=None, variants=None):
    rows = []
    for name in sorted(SFX):
        if only and name not in only:
            continue
        spec = SFX[name]
        nv = int(variants) if variants else int(spec["variants"])
        for k in range(nv):
            sd = seed_for(name, k)
            x = np.asarray(spec["build"](sd), dtype=np.float64)
            if x.ndim == 1:
                x = pan(x, 0.5)
            if spec["loop"]:
                x = make_loop(post(x, spec, sd), 0.35)
            else:
                x = post(x, spec, sd)
            tag = name if nv == 1 else "%s-%d" % (name, k + 1)
            st = publish(tmp, tag, "sfx", x, bitrate="160k",
                         loop=bool(spec["loop"]),
                         target=("peak", spec.get("peak", -14.0)))
            st["name"] = name
            st["kind"] = "sfx"
            st["loop"] = bool(spec["loop"])
            rows.append(st)
            print("  %-14s %6.2fs  peak %+6.1f  rms %+6.1f  crest %5.1f  "
                  "atk %6.2fms  cent %6d  %5.1f KB"
                  % (tag, st["duration"], st["peak_db"], st["rms_db"],
                     st["crest"], st["attack_ms"], st["centroid_hz"],
                     st["bytes"] / 1024.0))
    return rows


def seam_db(x, chain):
    """Proof that a loop is a loop, and the only honest one available without
    ears. Play the bed twice — literally the same samples twice — and master
    the pair with the ring set to the doubled length. If one lap is a real
    period, the second half of the pair is identical to the single lap, and
    the residual between them is exactly what a listener would hear at the
    join. Comparing y[0] with y[-1] instead is defeated by a downbeat: bar one
    is *supposed* to arrive with an attack."""
    n = x.shape[0]
    a = chain(x, n)
    b = chain(np.concatenate([_fit(x, n), _fit(x, n)], 0), 2 * n)
    m = min(a.shape[0], b.shape[0] - n)
    resid = b[n:n + m] - a[:m]
    return round(db(rms_of(resid) / (rms_of(a[:m]) + 1e-9)), 2)


def build_music(tmp, only=None, bars=8):
    rows = []
    for name in [n for n in THEMES if not only or n in only]:
        T = THEMES[name]
        x, loop_len, secs = arrangement(name, T, bars=bars)
        y = music_chain(x, loop_len, name)
        st = publish(tmp, name, "music", y, bitrate="192k", loop=True,
                     target=("rms", MUSIC_RMS))
        st["name"] = name
        st["kind"] = "music"
        st["bpm"] = T["bpm"]
        st["bars"] = bars
        st["seam_db"] = seam_db(x, lambda z, rl, nm=name: music_chain(z, rl, nm))
        rows.append(st)
        print("  %-12s %6.2fs  peak %+6.1f  rms %+6.1f  crest %5.1f  "
              "seam %+6.1f dB  cent %6d  %6.1f KB"
              % (name, st["duration"], st["peak_db"], st["rms_db"], st["crest"],
                 st["seam_db"], st["centroid_hz"], st["bytes"] / 1024.0))
    return rows


def build_ambient(tmp, only=None):
    rows = []
    for name in AMBIENCE:
        if only and name not in only:
            continue
        spec = AMB[name]
        n = int(round(spec["secs"] * SR))
        seed = seed_for(name, 0)
        raw = _fit(np.asarray(spec["build"](n, spec["secs"], seed), dtype=np.float64), n)
        y = ambience_post(raw, spec, seed)
        st = publish(tmp, name, "amb", y, bitrate=spec["bitrate"], loop=True,
                     target=("rms", spec["rms"]))
        st["name"] = name
        st["kind"] = "ambient"
        st["seam_db"] = seam_db(raw, lambda z, rl, sp=spec: ambience_post(z, sp, 0))
        rows.append(st)
        print("  %-9s %6.1fs  peak %+6.1f  rms %+6.1f  seam %+6.1f dB  "
              "cent %6d  %6.1f KB"
              % (name, st["duration"], st["peak_db"], st["rms_db"],
                 st["seam_db"], st["centroid_hz"], st["bytes"] / 1024.0))
    return rows


# ------------------------------------------------------------------ manifest

# The names the engines say versus the files that exist. Only genuinely the
# same sound is aliased: fx/du-fx.js has one `drum`, chapters/arcade/engine.js
# has `drum1`..`drum4`, and sfx.note(i) is pitched by index.
ALIAS = {
    "drum": "drum-1",
    "drum1": "drum-1", "drum2": "drum-2", "drum3": "drum-3", "drum4": "drum-4",
    "note": "note-00",
}

SW_BEGIN = "// BEGIN GENERATED AUDIO PRECACHE (tools/build-audio.py)"
SW_END = "// END GENERATED AUDIO PRECACHE"


def write_index(rows):
    idx = {
        "generated": "tools/build-audio.py",
        "sampleRate": SR,
        "format": "mp3",
        "reference": {"file": "./assets/rex/rex-roar.mp3",
                      "peak_db": -8.3,
                      "note": "the level and body the T-rex roar set"},
        "sfx": {}, "music": {}, "ambient": {},
        "alias": dict(ALIAS),
        "notes": [],
    }
    for r in rows:
        entry = {"file": r["file"], "duration": r["duration"],
                 "peak_db": r["peak_db"], "rms_db": r["rms_db"],
                 "bytes": r["bytes"], "loop": r.get("loop", False)}
        if r["kind"] == "sfx":
            slot = idx["sfx"].setdefault(r["name"], {"variants": [], "files": []})
            slot["variants"].append(entry)
            slot["files"].append(entry["file"])
            if r["name"].startswith("note-"):
                idx["notes"].append(entry["file"])
        elif r["kind"] == "music":
            entry["seam_db"] = r.get("seam_db")
            entry["bpm"] = r.get("bpm")
            idx["music"][r["name"]] = entry
        else:
            entry["seam_db"] = r.get("seam_db")
            idx["ambient"][r["name"]] = entry
    idx["notes"].sort()
    total = sum(r["bytes"] for r in rows)
    idx["totalBytes"] = total
    idx["count"] = len(rows)
    os.makedirs(AUDIO, exist_ok=True)
    with open(os.path.join(AUDIO, "index.json"), "w", encoding="utf-8") as fh:
        json.dump(idx, fh, indent=1, sort_keys=True)
        fh.write("\n")
    return idx


def patch_sw(rows):
    """Add the bank to the hub worker's precache. A generated block between
    markers, so the list is never edited by hand and never drifts from the
    files that exist."""
    path = os.path.join(ROOT, "sw.js")
    if not os.path.exists(path):
        print("  sw.js not found; skipping precache patch")
        return
    with open(path, encoding="utf-8") as fh:
        src = fh.read()
    urls = sorted({rel(os.path.join(ROOT, r["file"][2:])) for r in rows})
    # The audition page fetches both of these, and offline it gets nothing if
    # only the sounds are precached: the tables render empty and say nothing
    # about why.
    urls.insert(0, "./assets/audio/report.json")
    urls.insert(0, "./assets/audio/index.json")
    body = ",\n".join('    "%s"' % u for u in urls)
    block = "%s\nconst AUDIO_ASSETS = [\n%s\n];\n%s" % (SW_BEGIN, body, SW_END)
    if SW_BEGIN in src and SW_END in src:
        head, rest = src.split(SW_BEGIN, 1)
        _, tail = rest.split(SW_END, 1)
        src = head + block + tail
    else:
        anchor = "\nself.addEventListener('install'"
        if anchor not in src:
            print("  sw.js has no install listener; skipping precache patch")
            return
        src = src.replace(anchor, "\n" + block + anchor, 1)
    # Not addAll: one URL that 404s would fail the whole install and leave the
    # app with no offline cache at all. Add each one on its own so a single miss
    # costs one asset. If sw.js ever reverts to the addAll form, this puts it
    # back rather than quietly re-introducing the all-or-nothing install.
    src = src.replace(
        "await cache.addAll(ASSETS);",
        "await Promise.all(ASSETS.map((u) =>\n"
        "      cache.add(u).catch((e) => console.warn('precache missed', u, String((e && e.message) || e)))));", 1)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(src)
    print("  sw.js: %d audio URLs precached" % len(urls))


def write_report(rows, secs):
    os.makedirs(AUDIO, exist_ok=True)
    bad = []
    for r in rows:
        if r["clipped"]:
            bad.append((r["file"], "clipped=%d" % r["clipped"]))
        if r["peak_db"] > -1.0:
            bad.append((r["file"], "too loud %+.1f" % r["peak_db"]))
        if r["peak_db"] < -30.0:
            bad.append((r["file"], "silently quiet %+.1f" % r["peak_db"]))
        if abs(r["dc"]) > 0.004:
            bad.append((r["file"], "dc offset %.4f" % r["dc"]))
        if r.get("seam_db") is not None and r["seam_db"] > -28.0:
            bad.append((r["file"], "loop joins at only %+.1f dB" % r["seam_db"]))
    rep = {"seconds": round(secs, 1), "count": len(rows),
           "totalBytes": sum(r["bytes"] for r in rows),
           "failures": bad, "files": rows}
    # The windows are read back out of the specs, not typed in here, so an
    # outside test can hold this render to what it was actually asked for and
    # stays honest when a level is retuned. Score and world beds are loudness
    # beds at very different levels: one window cannot cover both.
    want = [s["peak"] for s in SFX.values()]
    beds = [s["rms"] for s in AMB.values()]
    rep["targets"] = {
        "sfx_peak_db": [round(min(want) - 1.0, 1), round(max(want) + 1.0, 1)],
        "music_rms_db": [MUSIC_RMS - 1.0, MUSIC_RMS + 1.0],
        "ambient_rms_db": [round(min(beds) - 1.5, 1), round(max(beds) + 1.5, 1)],
        "seam_db_max": -28.0,
    }
    with open(REPORT, "w", encoding="utf-8") as fh:
        json.dump(rep, fh, indent=1, sort_keys=True)
        fh.write("\n")
    return bad


# ------------------------------------------------------------------ selftest

def selftest():
    """Arithmetic checks on the DSP kit. Each one below failed at some point
    while this script was being written, which is the argument for keeping
    them: nobody can hear the output, so a wrong coefficient is silent."""
    fails = []
    nchecks = [0]

    def check(name, ok, detail=""):
        nchecks[0] += 1
        print("  %-34s %s %s" % (name, "ok " if ok else "FAIL", detail))
        if not ok:
            fails.append(name)

    def gain(kind, f, q, gd, hz_at):
        """|H| straight from the coefficients, at a real frequency."""
        b, a = biq_coefs(kind, f, q, gd)
        z = np.exp(-1j * TAU * min(max(hz_at, 0.0), SR * 0.5) / SR)
        return float(abs((b[0] + b[1] * z + b[2] * z ** 2) /
                         (a[0] + a[1] * z + a[2] * z ** 2)))

    # 1. every filter kind passes the band it claims and stops the one it does
    nyq = SR * 0.5
    for kind, f, pass_at, stop_at, stop_max in (
            ("lp", 1200.0, 60.0, nyq, 0.05),
            ("hp", 1200.0, nyq, 60.0, 0.05),
            # a second-order bandpass only rolls off at 6 dB per octave below
            # resonance, so 60 Hz is merely far away, not gone
            ("bp", 1200.0, 1200.0, 60.0, 0.12),
            ("notch", 1200.0, 60.0, 1200.0, 0.05)):
        gp = gain(kind, f, 0.7, 0.0, pass_at)
        gs = gain(kind, f, 0.7, 0.0, stop_at)
        check("%s passes %.0f Hz / stops %.0f Hz" % (kind, pass_at, stop_at),
              0.90 < gp < 1.12 and gs < stop_max,
              "%.4f / %.5f" % (gp, gs))

    # 1b. a peaking filter is unity outside its band and by the ask inside it
    check("peak is unity off-band",
          abs(gain("peak", 1200.0, 0.7, 6.0, 60.0) - 1.0) < 0.02 and
          abs(gain("peak", 1200.0, 0.7, 6.0, nyq) - 1.0) < 0.02)
    check("peak is +6 dB on-band",
          abs(gain("peak", 1200.0, 0.7, 6.0, 1200.0) - 1.9953) < 0.03,
          "%.4f" % gain("peak", 1200.0, 0.7, 6.0, 1200.0))

    # 2. a shelf lifts its own band and leaves the other side alone. Flip the
    #    sign of highshelf's a1 and the filter still passes a sum-of-coefficients
    #    self-consistency check while putting a resonator on top of every mix.
    for gd in (-6.0, -1.5, 3.0, 6.0):
        want = 10.0 ** (gd / 20.0)
        check("highshelf %+5.1f dB: below untouched" % gd,
              abs(gain("highshelf", 3600.0, 0.7, gd, 60.0) - 1.0) < 0.015,
              "%.4f" % gain("highshelf", 3600.0, 0.7, gd, 60.0))
        check("highshelf %+5.1f dB: above by the ask" % gd,
              abs(gain("highshelf", 3600.0, 0.7, gd, 14000.0) - want) < 0.03,
              "%.4f want %.4f" % (gain("highshelf", 3600.0, 0.7, gd, 14000.0), want))
        check("lowshelf %+5.1f dB: above untouched" % gd,
              abs(gain("lowshelf", 220.0, 0.7, gd, 12000.0) - 1.0) < 0.02,
              "%.4f" % gain("lowshelf", 220.0, 0.7, gd, 12000.0))
        check("lowshelf %+5.1f dB: below by the ask" % gd,
              abs(gain("lowshelf", 220.0, 0.7, gd, 40.0) - want) < 0.04,
              "%.4f want %.4f" % (gain("lowshelf", 220.0, 0.7, gd, 40.0), want))

    # 3. the truncated impulse response really is the filter
    b, a = biq_coefs("highshelf", 3600.0, 0.7, -1.5)
    h = _impulse(b, a, 1 << 13)
    check("impulse response matches the recursion",
          abs(h.sum() / (b.sum() / a.sum()) - 1.0) < 0.02,
          "DC %.5f vs %.5f" % (h.sum(), b.sum() / a.sum()))
    x = np.random.default_rng(5).standard_normal(4096)
    b, a = biq_coefs("lp", 900.0, 0.8)
    h = _impulse(b, a, 1 << 12)
    y1 = fftconvolve(x, h)[: x.shape[0]]
    y2 = np.zeros_like(x)
    x1 = x2 = y1p = y2p = 0.0
    for i in range(x.shape[0]):
        v = (b[0] * x[i] + b[1] * x1 + b[2] * x2
             - a[1] * y1p - a[2] * y2p)
        x2, x1 = x1, x[i]
        y2p, y1p = y1p, v
        y2[i] = v
    err = db(rms_of(y1 - y2) / rms_of(y2))
    check("fft biquad == direct form", err < -45.0, "residual %.1f dB" % err)

    # 4. circular convolution is periodic, not lossy
    n = 1 << 13
    y = np.sin(TAU * 110 * np.arange(n) / SR)
    z = wrap_convolve(y, h)
    check("wrap_convolve keeps the loop", abs(z[0] - z[-1]) < 0.05 * peak_of(z),
          "%.4f" % abs(z[0] - z[-1]))

    # 5. ring placement does not cut a tail off
    clip = v_bell(440.0, 1.4, seed=1)
    m = int(2.0 * SR)
    buf = np.zeros((m, 2))
    add(buf, 1.9, clip, 1.0, 0.5, ring=m)
    d = np.abs(np.diff(buf[:, 0]))
    check("ring placement joins", float(np.abs(buf[0, 0] - buf[-1, 0])) <
          8.0 * float(d.mean()), "seam/step %.2f" %
          (float(np.abs(buf[0, 0] - buf[-1, 0])) / (float(d.mean()) + 1e-12)))

    # 6. the room is not a snare drum: early reflections are band-limited
    ir = room("hall")
    c = centroid(ir)
    check("room IR is not a click", 900.0 < c < 5000.0, "centroid %.0f Hz" % c)

    # 7. attack measurement agrees with what the instrument is
    check("bell attacks fast", attack_ms(v_bell(880.0, 1.0, seed=2)) < 3.0,
          "%.2f ms" % attack_ms(v_bell(880.0, 1.0, seed=2)))
    check("strings attack slow", attack_ms(v_strings(220.0, 2.0, seed=2)) > 40.0,
          "%.2f ms" % attack_ms(v_strings(220.0, 2.0, seed=2)))

    # 8. the note table still matches what du-fx.js promises
    ok = all(abs(note_hz(i) - [262, 294, 330, 349, 392, 440, 494, 523, 587,
                               659, 698, 784][i]) < 1.0 for i in range(12))
    check("note table matches du-fx", ok)

    # 9. themes and beds are the names the engines actually ask for
    src = open(os.path.join(ROOT, "fx", "du-music.js"), encoding="utf-8").read()
    want = set(re.findall(r"^\s{4}(\w+):\s*\{\s*bpm", src, re.M))
    check("THEMES cover du-music.js", want <= set(THEMES),
          "missing %s" % sorted(want - set(THEMES)))
    asrc = open(os.path.join(ROOT, "fx", "du-ambient.js"), encoding="utf-8").read()
    beds = set(re.findall(r"ambient:\s*[\"']?(\w+)", asrc)) | \
        set(re.findall(r"^\s{2,4}(\w+):\s*\{", asrc, re.M))
    have = set(AMBIENCE)
    check("every ambient theme has a bed",
          bool(beds) and beds <= have, "missing %s" % sorted(beds - have))
    check("ambience registry matches the list", set(AMB) == have)

    # 10. no clip is silently empty, no loop is silent
    for name in ("tap", "win", "roar"):
        x = post(np.asarray(SFX[name]["build"](7)), SFX[name], 7)
        check("sfx %s has signal" % name, peak_of(x) > 0.05 and
              abs(np.mean(x)) < 0.01, "peak %.3f" % peak_of(x))
    y = master_loop("park", THEMES["park"])
    check("park loop has signal", rms_of(y) > 0.03, "rms %.4f" % rms_of(y))

    # 10b. the level an effect promises is the level it delivers. Normalising
    #      before the fade-in broke exactly this: a tap aimed at -15 dBFS
    #      arrived at -29, and every number in the log looked self-consistent.
    for name in ("tap", "star", "sparkle", "win", "roar", "chirp", "coin", "pop"):
        sp = SFX[name]
        x = post(np.asarray(sp["build"](seed_for(name, 0))), sp, 1)
        err = db(peak_of(x)) - sp["peak"]
        check("%s lands at its level" % name, abs(err) < 1.0,
              "%+.2f dB off %+.1f" % (err, sp["peak"]))

    # 10c. charge, not sound. A coloured-noise generator that leaves its DC bin
    #      in, or a pulse train that never goes negative, hands the normaliser an
    #      offset to set the level from. Six clips shipped a measurable sideways
    #      shove (up to 0.015 = -36 dBFS of pure DC) before this check existed,
    #      and every one of them looked correctly levelled in the log.
    for colour in ("pink", "brown", "blue"):
        d = max(abs(float(np.mean(coloured_noise(4800, colour, s))))
                for s in range(6))
        check("%s noise holds no charge" % colour, d < 0.002, "worst mean %.5f" % d)
    for name in ("drum-1", "bad", "fail", "engine", "thud"):
        sp = SFX[name]
        x = post(np.asarray(sp["build"](seed_for(name, 0))), sp, 1)
        d = float(np.abs(np.mean(x, axis=0)).max())
        check("%s sits on zero" % name, d < 0.002, "dc %.5f" % d)
    # An integer number of whole cycles, so the only thing the filter has to
    # remove is the charge itself and not the test signal's own rounding.
    k = np.arange(4800) / 4800.0
    tone = 0.5 * np.sin(TAU * 37 * k)
    step = dc_block(np.full(4800, 0.02))
    # The settled end of a 0.02 step is what a DC offset actually is; the first
    # third is the filter charging up, which is why the tail is what gets read.
    check("dc_block clears a 0.02 offset", abs(float(step[-800:].mean())) < 0.0002,
          "settled mean %.6f" % float(step[-800:].mean()))
    check("dc_block leaves a tone alone", abs(rms_of(dc_block(tone)) - rms_of(tone)) < 0.005 * rms_of(tone),
          "rms %.5f -> %.5f" % (rms_of(tone), rms_of(dc_block(tone))))

    # 11. the engine's one sustained effect really loops: the join must be no
    #     bigger than an ordinary step, and the fold must not leave a dip
    xe = post(np.asarray(SFX["engine"]["build"](3)), SFX["engine"], 3)
    xe = make_loop(xe, 0.35)
    step = float(np.median(np.abs(np.diff(xe, axis=0))))
    seam = float(np.abs(xe[0] - xe[-1]).mean())
    dip = db(rms_of(xe[: 2205]) / (rms_of(xe[-2205:]) + 1e-9))
    check("engine loop joins", seam < 6.0 * step and abs(dip) < 3.0,
          "seam/step %.2f  ends %.1f dB apart" % (seam / (step + 1e-12), dip))

    print("\n  %d checks, %d failures" % (nchecks[0], len(fails)))
    return 1 if fails else 0


# ------------------------------------------------------------------ main

def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--sfx", action="store_true", help="only the effects")
    ap.add_argument("--music", action="store_true", help="only the score")
    ap.add_argument("--ambient", action="store_true", help="only the beds")
    ap.add_argument("--only", nargs="*", default=None,
                    help="restrict to these names")
    ap.add_argument("--variants", type=int, default=None,
                    help="force a variant count per effect")
    ap.add_argument("--bars", type=int, default=8)
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--no-sw", action="store_true",
                    help="do not touch sw.js precaching")
    a = ap.parse_args(argv)
    t0 = time.time()
    if a.selftest:
        return selftest()
    picked = bool(a.sfx or a.music or a.ambient)
    todo = [k for k, on in (("sfx", a.sfx or not picked),
                            ("music", a.music or not picked),
                            ("amb", a.ambient or not picked)) if on]
    rows = []
    with tempfile.TemporaryDirectory(prefix="duaudio") as tmp:
        for kind in todo:
            print("\n=== %s ===" % kind)
            if kind == "sfx":
                rows += build_sfx(tmp, a.only, a.variants)
            elif kind == "music":
                rows += build_music(tmp, a.only, a.bars)
            else:
                rows += build_ambient(tmp, a.only)
    idx = write_index(rows)
    if not a.no_sw:
        patch_sw(rows)
    bad = write_report(rows, time.time() - t0)
    print("\n%d files, %.1f MB, %.1f s"
          % (len(rows), sum(r["bytes"] for r in rows) / 1e6, time.time() - t0))
    for f, why in bad:
        print("  !! %s: %s" % (f, why))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())

