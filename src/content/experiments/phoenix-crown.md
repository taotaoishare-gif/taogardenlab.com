---
number: 4
name: 'Phoenix Crown'
nameZh: '凤冠流苏'
title: 'Can a museum object be handled without being touched?'
date: 2026-07-15
lenses: [ritual, embodied-interaction, computational-media]
evidence: built
status: 'Built. Not evaluated.'
video: /video/exp-04-phoenix.mp4
poster: /image/exp-04-phoenix.jpg
demo: /demos/phoenix-crown/
demoNote: 'Uses your camera locally. Nothing is uploaded, nothing is stored.'
stack: [MediaPipe Hands, Canvas 2D, Web Audio API]
summary: 'A phoenix crown drawn in gold line, with tassels of jade beads and poem characters hanging from it. A hand passing through sets the strands swinging and sounding.'
lang: en
fromAtlas: [phoenix-crown-object]
followsFrom: [rain-curtain]
---

## 01 Question

Behind museum glass, a phoenix crown is a silhouette. The thing that made it
remarkable to the person who wore it — the weight of it, the fact that it
sounds when you move, that it constrains how you can hold your head — is
exactly what the vitrine removes.

I wanted to know whether the *behaviour* of such an object could be restored
without the object, and whether restoring behaviour is a form of access or a
form of falsification.

## 02 Context

Chinese has a phrase for the sound of hanging ornaments: 环佩玎珰. It is a
sound that means someone is moving. Wedding poetry uses it as a way of saying
a body is present without describing the body.

This continues a thread from [Rain Curtain](/experiments/rain-curtain/) — both
are hanging strands that a hand passes through. I built them a day apart. The
difference is that rain is a material and a crown is an artefact, which turns
out to matter a great deal.

## 03 What I built

A phoenix crown rendered as abstract gold line-work against a dark field of
drifting particles: kingfisher-blue floral clusters, paired phoenixes, side
panels, a step-shake hairpin. From the base of the crown hang tassels — jade
beads, and characters in small regular script from the bridal-preparation
passage of 《孔雀东南飞》.

Each tassel is a Verlet chain (16 px segments, three constraint iterations,
gravity 1500). Your hand enters as a 34-px collision body that injects
velocity into the beads. The whole simulation costs about 0.8 ms a frame.

The sound is synthesised, not sampled. The jade chime is a cluster of
inharmonic partials at ratios 1 / 2.756 / 5.404 / 8.933 — the ratios of a
struck stone chime rather than a string — tuned to a pentatonic set in the
D5–B7 range, with no vibrato. A fast sweep across several strands triggers a
zheng arpeggio that rises or falls depending on the direction of your hand.
Underneath there is a night-air floor: a low warm tone and a faint 4.4 kHz
shimmer, with a distant chime every 16 to 34 seconds.

After eight seconds of stillness, a small breeze moves the tassels on its own.

## 04 Why I designed it this way

I drew the crown as line-work rather than modelling or photographing a real
one, because a photorealistic replica makes a claim about a specific object in
a specific collection, and I would then be responsible for its accuracy. Line
drawing is visibly an interpretation.

Synthesis over sampling, for the same reason as
[Guqin Forest](/experiments/guqin-forest/): a sample of a real chime is a
recording of a real object, and I did not want to imply I had access to one.

The idle breeze exists because this was built to survive being left running in
a room — an exhibition condition, not a research one. I am noting that because
it is a design decision made for a purpose other than the research question,
and those are the ones that quietly bend a piece.

## 05 What I observed

**Personal observation.** The inharmonic partial ratios matter more than the
physics. An early build with accurate bead physics and a harmonic bell tone
felt like a toy; the same physics with stone-chime ratios felt like an object.
I would not have predicted that ordering.

**Observation from other people: none recorded.** No structured feedback has
been collected.

**Evaluation: not yet conducted.** No comparison against a still image of a
crown, which is the obvious control and the one I should run.

## 06 What did not work

- **Characters on the side panels were unreadable.** I originally hung poem
  characters from the 博鬓 (side wings) as well as the main curtain. At any
  angle the two layers of text overlapped into visual noise. The side panels
  are now plain beads and the characters are confined to the front curtain. It
  is a worse idea aesthetically and a much better one legibly.
- **Harmonic bell tones were wrong** and I could not hear why for some hours.
  The problem was not timbre quality, it was that a harmonic spectrum sounds
  like metal and the reference object is stone and jade.
- **Verlet chains explode** if you push a collision body through them faster
  than the constraint solver can converge. I clamped the injected velocity,
  which means a very fast hand is quietly ignored — the piece silently lies
  about what your hand did.
- **The unresolved conceptual problem.** I have restored a behaviour and
  removed a context. A phoenix crown is a wedding object, and the poem the
  characters come from is about a marriage that ends in two suicides. I have
  taken the ornament and the sound and left the grief, and I do not think
  "it's an interaction study" fully answers that. See step 05 of
  [the atlas entry on this](/atlas/phoenix-crown-object/).

## 07 What comes next

The control condition — a still image of the same crown, no interaction — is
cheap to build and I have not built it. Until I do, I cannot say anything about
whether the behaviour restores anything.

## Reflection

Making this changed what I think a museum object is. I had assumed the object
was the thing and the behaviour was a property of it. Building the behaviour
first, and drawing the object as barely more than an outline, produced
something that felt more like the artefact than a careful rendering would
have.

Which raises a question I cannot answer: if the behaviour carries the object,
what exactly is behind the glass?
