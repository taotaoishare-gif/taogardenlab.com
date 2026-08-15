---
title: 'I made the clay respond faster and the piece got worse'
titleZh: '我让陶土反应更快，作品却更差了'
date: 2026-07-21
lenses: [embodied-interaction]
evidence: built
lang: en
experiment: cosmic-pottery
---

I tested [Cosmic Pottery](/experiments/cosmic-pottery/) with the shaping rate at
roughly three times its current value, because the slow version felt
unresponsive and unresponsive felt like a bug.

It failed, but not immediately — which is what made it hard to see. For the
first ninety seconds the fast version was clearly better: your hand moved, the
wall moved, the connection was obvious. Then there was nothing left to do. The
vessel had already been pushed to every shape it could reach, and the remaining
four minutes of the incense had no content.

I changed `SHAPE_RATE` to 1.15 — slower than the original slow version. The
first ninety seconds are now worse and the session is better.

Two things I want to keep from this. The first is that I was evaluating on the
wrong timescale: I judged the interaction by how it felt in the first few
seconds, which is the timescale a demo is judged on and not the timescale the
piece is for. The second is that responsiveness and depth traded against each
other directly here, and I had assumed they were independent.

Still unresolved: the slow rate makes the piece harder to show to someone in
thirty seconds, and I keep wanting to raise it before I show it to anyone. That
impulse is worth watching. It is the same pressure that puts a progress bar on
everything.
