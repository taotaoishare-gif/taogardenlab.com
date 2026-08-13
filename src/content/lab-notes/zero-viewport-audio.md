---
title: 'NaN reaches an AudioParam and everything stops'
date: 2026-07-15
lenses: [computational-media]
evidence: built
lang: en
experiment: rain-curtain
---

I tested [Rain Curtain](/experiments/rain-curtain) in a background tab. It
failed to start, silently, with nothing in the console.

It failed because a hidden tab reports `innerWidth` as 0 and freezes
`requestAnimationFrame`. Zero width propagated into the layout maths, produced
`NaN`, and `NaN` was passed to an AudioParam, which throws. The throw happened
inside an event listener, and an exception thrown inside a listener does not
propagate back to whatever dispatched the event — so the click that started
everything returned normally, and the piece was simply dead.

I changed three things. Every resize, spatial-audio and note-playing path now
returns early on a zero viewport. I attached a `window` error listener during
development so that listener-internal exceptions become visible. And I stopped
testing interaction by dispatching synthetic clicks, because the failure mode I
was hunting was invisible to exactly that technique — I now drive the pipeline
functions directly with explicit time arguments.

The general lesson is not about audio. It is that I had two independent silent
failure modes stacked on each other, and each one was hiding the other.
