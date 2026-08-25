---
number: 1
name: 'Somatic Guqin'
nameZh: '身若鸣弦'
title: 'Can an instrument answer a hand without asking it to perform?'
titleZh: '乐器能否回应一只手，而不要求它表演？'
date: 2026-06-30
lenses: [embodied-interaction, computational-media, contemplative-traditions]
evidence: built
status: 'Eleven versions built. Not evaluated.'
statusZh: '已完成十一版。尚未评估。'
video: /video/exp-01-guqin.mp4
poster: /image/exp-01-guqin.jpg
demo: /demos/guqin-forest/
demoNote: 'Uses your camera locally. Nothing is uploaded, nothing is stored.'
demoNoteZh: '在本机使用你的摄像头。不上传，不存储。'
stack: [MediaPipe Hands, Canvas 2D, Web Audio API]
summary: 'A bamboo landscape that sounds when a hand moves through it. Built to find out whether a responsive instrument can avoid turning its player into a performer.'
summaryZh: '一片会出声的竹林，手穿过它便有琴音。想弄清楚的是：一件会回应的乐器，能不能不把弹它的人变成表演者。'
lang: en
mechanism: "Implicit responsiveness"
mechanismZh: "隐性回应"
coreQuestion: "Can an environment perceive me without explicit command?"
coreQuestionZh: "环境能否在没有明确指令的情况下感知到我？"
humanQuestion: "Can we experience connection without explicit communication?"
humanQuestionZh: "人与环境之间，能否在没有明确沟通的情况下建立连接？"
researchQuestion: "Can subtle, implicit human gestures create a sense of being perceived and responded to by an environment?"
researchQuestionZh: "细微、非明确的身体动作，能否让人产生「自己正在被环境感知并回应」的体验？"
hypothesis: "When environmental responses are continuously coupled to subtle bodily gestures, participants will report greater perceived connection and agency than when interaction requires explicit commands."
hypothesisZh: "当环境持续响应人的细微身体动作时，相比依赖明确指令的交互，参与者将报告更强的连接感与能动感。"
builtPipeline: "gesture sensing → spatial sound → responsive visual environment"
builtPipelineZh: "手势感知 → 空间声音 → 响应式视觉环境"
researchTags: ['agency', 'responsiveness', 'connection']
researchTagsZh: ['能动性', '回应性', '连接']
fromAtlas: [jiangnan-sequencing]
process:
  - version: V01–V04
    note: 'Karplus–Strong plucked strings. Landscape sampled across only 60% of the canvas, leaving a hard vertical seam at wide viewports.'
  - version: V05
    note: 'Voice rebuilt from additive oscillator partials with convolution reverb — the Karplus–Strong tail was too percussive to sit inside a landscape.'
  - version: V06
    note: 'Ambient wind layer added. Sampling extended to full width; the seam goes.'
  - version: V07
    note: 'Wind layer deleted — it filled a silence that was doing work. Leaves reduced and moved to the branch tips.'
  - version: V08
    note: 'Modulated vibrato removed from every note and replaced with slight static detuning between partials. Shimmer without wobble.'
---

## 01 Question

Every instrument I have tried to learn began by telling me I was doing it
wrong. The feedback loop of practice is a loop of correction, and correction
is a performance frame: there is a right version of this, and you are not
it yet.

I wanted to know whether an instrument could respond to a hand
**without** setting up that frame. Not an easier instrument — an instrument
with no correct version.

## 02 Context

The question came from two places. One is the guqin itself, which occupies
an unusual position in Chinese musical culture: historically it was played
alone, or for one listener, and the literature around it is more concerned
with the state of the player than with the audience's judgment. The other is
[the atlas entry on spatial sequencing in Jiangnan gardens](/atlas/jiangnan-sequencing/) —
a garden also has no correct way to walk it.

## 03 What I built

A camera watches your hands. A bamboo landscape occupies the screen: distant
mountains, a water surface, bamboo in the near field. Moving a hand through
the frame disturbs the bamboo and sounds a note. There is no score, no target,
no scoring.

The sound is generated rather than sampled. Notes are quantised to a
pentatonic set at roughly 66 BPM, which means that whatever you do with your
hands, the result stays inside a mode — you cannot play a wrong note, because
wrong notes are not reachable.

Versions 2 to 4 used Karplus–Strong plucked-string synthesis. From version 5
I rebuilt the voice out of additive oscillator partials with convolution
reverb, because the Karplus–Strong tail was too percussive and too short to
sit inside a landscape.

## 04 Why I designed it this way

The central decision was **quantisation**. Constraining the output to a
pentatonic mode is the thing that removes the performance frame. It moves the
locus of judgment: you stop asking "did I play that correctly" and start
asking "do I like where this is going."

I rejected a scoring layer, a rhythm target, any streak or session count, and
any visible progress indicator. Not on aesthetic grounds — a visible metric
would have converted the piece into exactly the thing I was trying to find an
alternative to.

I also rejected sampled guqin recordings, which I had assumed I would use.
Samples carry a performance in them: someone else's touch, someone else's
decisions about phrasing. Synthesis sounds less authentic, and is emptier in a
way that turned out to matter.

## 05 What I observed

**Personal observation.** After the pentatonic quantisation went in, I stopped
watching my hands and started watching the bamboo. I do not know whether that
is a general effect or a fact about the person who built it and already knew
what it would do.

**Observation from other people: none recorded.** I have shown this to people
informally and did not keep notes, so there is nothing here I can honestly
report. This section stays empty until it isn't.

**Evaluation: not yet conducted.** No instruments, no measures, no pre/post
design, no participants, no data. There is no dataset behind this page.

## 06 What did not work

- **The first landscape had a visible seam.** Mountains and water were sampled
  across only 60% of the canvas width and then held; at wide viewports there was
  a hard vertical edge at 0.6w. It took until v4 to extend sampling to full
  width.
- **Electronic vibrato.** Every version through v6 had a modulated tail on each
  note. It read as synthetic in a way that broke the whole thing. I removed it
  and replaced it with slight static detuning between partials, which gives the
  shimmer without the wobble.
- **Bamboo leaves.** For several versions the leaves were too large and grew
  along the whole culm, which looks nothing like bamboo. They now grow only at
  the branch tips and are much smaller.
- **Wind noise.** I added an ambient wind layer and deleted it two versions
  later. It filled the silence, and the silence was doing work.
- **The conceptual mistake.** For the first three versions I was building an
  instrument that was easy to play. That is a different project. An easy
  instrument still has a correct version; it just lowers the cost of reaching
  it. The quantisation approach was not a simplification of the original idea,
  it was the abandonment of it.

## 07 What comes next

The unresolved question is whether the absence of a target is legible without
me standing next to the screen explaining it. Nothing in the piece announces
that there is no goal, and an interface that responds to you is normally an
interface that wants something from you.

Missing evidence: any measure of what a person's attention is actually doing
while they use this. I have none.

## Reflection

I built eight versions of this over four months, and the thing I kept
correcting was not the code. It was my own assumption that responsiveness is
generous. A system that answers every gesture immediately is not necessarily
attentive to you — it may simply be eager, and eagerness is its own kind of
demand.

The versions got quieter. The wind went, the vibrato went, the leaves got
smaller. I notice I cannot tell you whether the last version is better or
whether I have just spent enough hours with it to have stopped hearing it.
