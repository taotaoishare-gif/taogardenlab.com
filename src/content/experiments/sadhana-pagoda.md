---
number: 4
name: 'Sadhana'
nameZh: '聚沙成塔'
title: 'What is a biofeedback loop when there is no body attached to it?'
titleZh: '当没有身体接在上面时，生物反馈还剩下什么？'
date: 2026-08-11
lenses: [embodied-interaction, contemplative-traditions, computational-media]
evidence: built
status: 'Built. Simulated physiology. Not evaluated.'
statusZh: '已造。生理为模拟。未做评估。'
video: /video/exp-06-sadhana.mp4
poster: /image/exp-06-sadhana.jpg
thumb: /image/exp-06-sadhana-thumb.jpg
demo: /demos/sadhana/
demoNote: 'Runs in the browser with a simulated body. The chest-strap path needs Web Bluetooth — Chromium only, not Safari or Firefox. Nothing is uploaded or stored either way.'
demoNoteZh: '可在浏览器里用模拟的身体运行。胸带那条链路需要 Web Bluetooth——仅 Chromium，Safari 与 Firefox 不支持。两种方式都不上传、不存储任何数据。'
stack: [Three.js, Tone.js, Web Bluetooth, GLSL]
summary: 'Fifty thousand grains of sand gather into a Thai chedi and gild from the spire down as the sitter settles. The sitter, for now, is a model.'
summaryZh: '五万粒沙聚成一座泰式金塔，随打坐者安定下来，自塔尖向下鎏金。而目前，那位打坐者是一个模型。'
lang: en
fromAtlas: [lanna-temple-thresholds, tea-as-timing]
followsFrom: [cosmic-pottery]
process:
  - version: V01
    note: 'Cohesion and gold as two independent drives, so that gathering and gilding can disagree. Scripted 205-second guided arc so the piece can be shown without a body attached. Web Bluetooth ingest written against the standard Heart Rate Service, tested against the protocol rather than against a person.'
---

## 01 Question

I have wanted to build a physiological instrument for two years, and I have
been putting it off, because the honest version needs a sensor, participants,
and a control condition, and I have none of those.

So I built the thing without the body, to find out what remains. If a
biofeedback piece is compelling while it is being driven by a simulation, then
whatever is compelling about it is **not the biofeedback** — and I would
rather know that before I spend four months on hardware.

## 02 Context

Fifty thousand grains of sand lie scattered on a dark plain and gather into a
Thai chedi. The form comes from the temple compounds in
[the Chiang Mai entry](/atlas/lanna-temple-thresholds/); the pacing comes from
[tea](/atlas/tea-as-timing/) — a duration nobody has to enforce.

It also comes directly out of what
[Cosmic Pottery](/experiments/cosmic-pottery/) got wrong. There, the reward for
being unhurried could be obtained by not moving. Breath is harder to fake by
doing nothing.

## 03 What I built

Two scalars drive the whole piece:

| | from | drives |
|---|---|---|
| `cohesion` | arousal and breath depth | sand gathering into the chedi, drone level, bowl strikes |
| `goldIndex` | beat-to-beat variability | sand turning to gold, chime density |

They are deliberately independent, so the piece can be gathered but not gilded,
or gilded but still loose. A single "calm score" would have collapsed that into
one number, and one number is a score.

The architecture keeps the three subsystems apart: only scalars cross between
the sensor model, the Three.js scene and the Tone.js audio. No geometry ever
reaches the audio, no audio node ever reaches the visuals.

There are two ways to drive it. A **chest strap** over Web Bluetooth, reading
RR intervals from the standard Heart Rate Service. Or the **guided arc**: a
scripted 205-second descent from agitation to stillness, which is what runs on
entry, and what you see in the recording above.

## 04 Why I designed it this way

The single most important decision is that **the piece never punishes**. It is
a one-way ratchet: good moments advance the state, bad moments hold it where it
is. Nothing ever gets worse because you did badly.

That is not a kindness, it is a correctness argument. A system that degrades
when a person is agitated will make an agitated person more agitated, and
whatever it then measures is a measurement of its own feedback.

The gilding runs from the spire **downward**, which is the wrong way round for
a building and the right way round for a reward: the top lights first, so the
finished state is legible long before it is reached.

I did not build a session summary, a history, or a comparison across days.

## 05 What I observed

**Personal observation.** The guided arc is more affecting than I expected, and
that is the finding. Nothing is being measured during it. Whatever the piece is
doing to me, it is doing with pacing, sound and light — not with my nervous
system.

That should be an uncomfortable result for the whole direction, and I want it
recorded here rather than discovered later by someone else.

**Observation from other people: none recorded.**

**Evaluation: not yet conducted.** No participants, no dataset, no control
condition, no sham. The comparison that matters — responsive versus a
non-responsive recording of the same thing — is exactly what I have not run.

## 06 What did not work

- **The physiology is a model, not a measurement.** The sliders set a
  simulated sitter's capacity and a simulated breath decides how much of it is
  expressed. It is built on a real and well-documented relationship — breathing
  near six breaths a minute drives respiratory sinus arrhythmia into resonance
  with the baroreflex and inflates beat-to-beat variability — but **that
  relationship is something I have read, not something I have measured.** The
  numbers on screen are outputs of my model of a body. They are not readings
  from one.
- **The Bluetooth path is tested against the protocol, not against a person.**
  The code reads the standard Heart Rate Service correctly. Whether the
  resulting values behave sensibly on a real chest over twenty minutes is
  unknown.
- **Chromium only.** Web Bluetooth does not exist in Safari or Firefox, so on
  an iPhone this piece can only ever be the simulation. That is a real limit on
  a piece meant to be entered rather than watched.
- **It needs a server.** ES modules will not load from `file://`, so unlike
  every other experiment here this one cannot be opened by double-clicking.
- **"Cohesion" is doing suspicious work.** It blends arousal and breath depth
  with fixed weights I chose by eye. There is no justification for 0.6 and 0.4
  beyond that they looked right.

## 07 What comes next

The next step is not a better simulation. It is one chest strap, one room, and
a sham condition — the same visuals and sound, not coupled to anything — so
that the question "is it the biofeedback, or is it just a beautiful pagoda"
can actually be answered.

Until that exists, nothing here is evidence about bodies. It is evidence about
what I can build.

## Reflection

I set out to test whether I could design a physiological interface, and what I
found out is that I can build one that works without any physiology at all.

I am not sure yet whether that is a success or the discovery of a problem. It
might mean the aesthetics are strong enough to carry the piece. It might mean
the biofeedback was never the load-bearing part, and that I have been planning
four months of hardware to add something the work does not need.

Both readings are alive. The reason I am writing this down now, before I have
the strap, is that once the hardware exists I will want the first reading to
be true.
