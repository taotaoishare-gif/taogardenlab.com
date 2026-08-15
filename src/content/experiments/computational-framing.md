---
number: 2
name: 'Computational Framing'
nameZh: '數字框景'
title: 'What is a garden window doing that a window is not?'
date: 2026-07-01
lenses: [gardens, embodied-interaction, computational-media]
evidence: built
status: 'Built. Not evaluated.'
video: /video/exp-02-window.mp4
poster: /image/exp-02-window.jpg
demo: /demos/computational-framing/
demoNote: 'Uses your camera locally. Nothing is uploaded, nothing is stored.'
stack: [MediaPipe Hands, Canvas 2D, Web Audio API]
summary: 'An octagonal lattice window you can break with one hand and set ringing with the other. Built to test whether the frame, rather than the view, is what holds a person still.'
lang: en
fromAtlas: [framing-borrowed-scenery]
followsFrom: [guqin-forest]
---

## 01 Question

In a Jiangnan garden, the lattice window (漏窗) frames a view that is often
unremarkable in itself — a few stalks of bamboo, a piece of rock, a section of
wall. The framing is elaborate; the content is not.

I wanted to know what the frame is doing. If the view is ordinary, then
whatever holds a person at that window for a moment is a property of the
framing, not of what is behind it.

## 02 Context

This follows directly from
[the atlas entry on framing and borrowed scenery](/atlas/framing-borrowed-scenery/).
It is also the first experiment where I tried to isolate one garden principle
rather than build an atmosphere. The previous piece,
[Guqin Forest](/experiments/guqin-forest/), had a whole landscape in it, and I
could not tell which part of it was doing the work.

## 03 What I built

An octagonal lattice window, drawn in thin jade lines against near-black.
Behind it, a field of drifting points. Two hands do two different things:

- **Right hand — shatter the lattice.** A sweep breaks the window's tracery
  into fragments that scatter and slowly reassemble.
- **Left hand — tremble to resonate.** A small vibrating motion makes the
  remaining lattice ring, like a finger on the edge of a bowl.

The asymmetry is the point. One hand destroys the frame, the other plays it.
You cannot do both at once.

## 04 Why I designed it this way

I chose an octagon because it is the most common漏窗 geometry in Suzhou and
because it is not a rectangle — a rectangle reads as a screen or a photograph,
and I wanted the frame to be noticed as a made object rather than as a
default.

I deliberately made the thing behind the window almost nothing: drifting
points, no scenery, no image. If the framing hypothesis is wrong, this piece
should be boring. That was the intended risk.

I rejected an approach where the window opens onto a rendered landscape.
It would have been prettier and would have told me nothing, because any
attention it held could have come from the landscape.

## 05 What I observed

**Personal observation.** The reassembly is what I look at, not the breaking.
I built the shattering as the primary interaction and find myself using it as a
way to get to the reassembly.

**Observation from other people: none recorded.** No structured feedback has
been collected on this piece.

**Evaluation: not yet conducted.** No measures of attention were taken. I have
no data on whether anyone stays with this longer than with a blank screen,
which is the actual question and remains unanswered.

## 06 What did not work

- **The left-hand gesture is almost certainly undiscoverable.** Nothing on
  screen suggests that the two hands do different things, and an interface that
  assigns different verbs to the left and the right hand is borrowing a
  convention from instruments people spend years learning. I have not tested
  this; I am confident about it anyway, which is worth flagging as exactly the
  kind of confidence that should be tested.
- **Breaking is more satisfying than framing**, which cuts against the whole
  hypothesis. I built a piece to argue that the frame holds attention, and the
  most compelling thing in it is destroying the frame. I have not resolved this
  and I am not going to pretend the piece supports the hypothesis.
- **The near-black background makes the camera almost useless in a dim room.**
  Hand tracking degrades badly at low light and I did not add a fallback, so in
  the evening the piece simply stops responding, with no explanation on screen.
- **The conceptual problem I did not see coming**: an octagonal lattice on a
  screen is not a window. A window in a garden has a wall around it, a body of
  yours on one side, and a real distance on the other. I removed the wall, the
  body and the distance, and kept the tracery — which may be the least
  important of the four.

## 07 What comes next

If the frame is doing the work, the missing element is the wall — the
occlusion, the fact that most of the view is denied. A screen-sized window is
all window. The next version of this idea would need to give back most of the
screen to something solid.

Unresolved: whether "framing holds attention" is a claim about geometry at
all, or a claim about walking, bodies and denial of view, in which case a flat
display is the wrong instrument for asking.

## Reflection

This is the experiment I would most like to say worked, and it did not. It
produced a clearer question than the one it started with, which I am told is
the normal outcome, but which does not feel like much when you have spent a
day on it.

What I actually learned is that I had been treating garden principles as
visual motifs — a shape I could lift. The octagon is not the principle. The
principle involves a wall I did not build.
