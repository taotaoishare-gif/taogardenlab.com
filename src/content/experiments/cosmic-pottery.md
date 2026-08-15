---
number: 3
name: 'Cosmic Pottery'
nameZh: '星河拉坯'
title: 'What happens if the material resists a hurried hand?'
titleZh: '如果材料会抗拒一只着急的手，会发生什么？'
date: 2026-07-19
lenses: [embodied-interaction, computational-media, contemplative-traditions]
evidence: built
status: 'Built. Not evaluated.'
statusZh: '已造。未做评估。'
video: /video/exp-05-pottery.mp4
poster: /image/exp-05-pottery.jpg
demo: /demos/cosmic-pottery/
demoNote: 'Uses your camera locally. Nothing is uploaded, nothing is stored.'
demoNoteZh: '在本机使用你的摄像头。不上传，不存储。'
stack: [MediaPipe Hands, Canvas 2D, Web Audio API]
summary: 'Take a planet from the river of stars, light an incense stick to set the time, then throw a pot with your hands in the air. Clay that wobbles when you rush.'
summaryZh: '从星河里掬一颗星球，点一炷香定下时长，然后隔空拉坯。你一急，坯就晃。'
lang: en
mechanism: "Computational resistance"
mechanismZh: "计算材料阻力"
coreQuestion: "Can environmental resistance change my tempo?"
coreQuestionZh: "环境的阻力能否改变我的节奏？"
humanQuestion: "Can embodied hand movement become an interface for focused attention?"
humanQuestionZh: "手的动作本身，能否成为一个让注意力凝聚的界面？"
researchQuestion: "Can computational material resistance alter the user's tempo of action and cultivate greater awareness of movement and interaction?"
researchQuestionZh: "计算生成的「材料阻力」能否改变人的行动节奏，并增强其对自身动作与互动过程的觉察？"
hypothesis: "Responsive resistance to hurried movement will encourage slower, more attentive interaction."
hypothesisZh: "当系统对急促动作产生响应式阻力时，用户将倾向于放慢动作，并表现出更高的互动觉察。"
builtPipeline: "motion sensing → particle material → responsive resistance"
builtPipelineZh: "动作感知 → 粒子材料 → 响应式阻力"
researchTags: ['tempo', 'agency', 'material perception']
researchTagsZh: ['节奏', '能动性', '材料知觉']
fromAtlas: [dehua-white-porcelain]
fromReadings: [yuanye-ji-cheng]
followsFrom: [phoenix-crown]
process:
  - version: V01 · 19 July
    note: 'Imperial gold with a red seal. Initial form a cylinder, so the star-to-clay transition read as a scene change. One hand owned the whole vessel. Shaping fast and satisfying for ninety seconds, then empty.'
  - version: V01.1 · 21 July
    note: 'Rebuilt in celadon on near-black with a lattice-window mark — the gold version looked like it was selling something. Initial form changed to a sphere so both objects are round and the transition has no cut. Two hands act independently at their own heights. Shaping rate lowered to 1.15.'
---

## 01 Question

On a wheel, clay punishes hurry directly. Push too fast and the wall goes
thin, the form goes off-centre, and you can feel it happening before you can
see it. No one has to tell you. The material is the feedback.

I wanted to know whether a simulated material could do the same thing —
and, more specifically, whether resistance is a better teacher than
instruction.

## 02 Context

I spent time around ceramics in Dehua, where white porcelain is the local
material and the making is a trade rather than a therapy. See
[the atlas entry on Dehua](/atlas/dehua-white-porcelain/).

It is also a direct answer to something I got wrong earlier. In a previous
piece, moving faster changed only the *sound*. Here it changes the *object you
are left with*, which is much harder to ignore.

## 03 What I built

Five stages:

1. **Select.** Thirteen planetary bodies drift past in a river of stars, each
   with its own glaze colour and its own classical name. Hover for 1.15 seconds
   and one comes to rest in your hand.
2. **Duration.** You light an incense stick — one, three, or five minutes. The
   incense is the session length. There is no clock.
3. **Throw.** The planet shrinks and a spherical lump of clay fades in at the
   same moment, both round, so the transition has no cut. Two hands shape it
   independently, each acting at its own height, so you can thin one part of
   the wall while widening another. Lifting a hand against the wall makes the
   vessel taller; pressing down makes it squatter. Narrowing sounds a stone
   chime; widening sounds a low guqin note.
4. **Rest.** When the incense burns out, the vessel is finished.
5. **The poster.** The piece composes a still image of what you made, with a
   short line of text generated from the shape you actually pulled, its glaze,
   its planet, and how steady your hands were.

The steadiness measure is an exponential moving average of hand speed. When it
rises, the vessel flushes red, wobbles, and slips. It is not a score and it is
never shown as a number — it is a property of the clay.

## 04 Why I designed it this way

`SHAPE_RATE` is 1.15, which is slow — deliberately slower than feels
responsive. Early builds shaped at three or four times that rate and were much
more satisfying for about ninety seconds, after which there was nothing left to
do because the vessel had already been pushed to every extreme.

I used **incense rather than a timer** because a stick of incense is a duration
you cannot check. You can see roughly how much is left; you cannot see
`3:41`. That difference is the entire reason it is there.

The wobble is the one place I let the system evaluate you, and I put the
evaluation in the clay instead of in the interface. There is no calm score, no
streak, no history across sessions, no comparison to other people. The poster
describes what you made, not how well you did.

## 05 What I observed

**Personal observation.** The slow shaping rate was the correct call and I
resisted it for two days. Fast shaping feels better and produces worse pots.

**Observation from other people: none recorded.** No structured feedback has
been collected.

**Evaluation: not yet conducted.** The steadiness measure records an early and
a late segment for each session, so the data structure for a within-session
comparison exists. I have not collected, stored or analysed any of it, and no
one has consented to anything of the sort. There is no dataset.

## 06 What did not work

- **Hand tracking jitter.** A five-joint palm centroid still jumps when
  MediaPipe loses a finger, and a jumping centroid pushes the clay. It took
  adaptive smoothing — heavier when still, lighter when moving — to make the
  wheel usable, and the smoothing adds lag that I can feel.
- **The star-to-clay transition was a cut.** The first version replaced the
  planet with a cylinder, which looked like a scene change. Making the initial
  clay a *sphere* so both objects are round, and cross-fading them, removed the
  seam. Trivial fix, disproportionate effect.
- **Two-handed independent shaping broke constantly** during development,
  because both hands wanted to own the vessel height. Resolving that took
  longer than the entire rest of the throwing model.
- **The visual identity was wrong for two versions.** I had it in imperial gold
  with a red seal, which reads as national-heritage branding. I rebuilt it in
  celadon green on near-black with a lattice-window mark. This is not a
  technical failure but it is the failure I think mattered most: the first
  version looked like it was selling something.
- **The wobble can be gamed.** If you hold still and do nothing, the clay is
  perfectly calm. A person optimising for a smooth pot learns to move less,
  which is superficially the desired behaviour and is not at all the same
  thing as being unhurried.

## 07 What comes next

The gaming problem is the real one: I have built a system where the reward for
not-rushing can be obtained by not-moving. Those are different states in a
person and identical states in my measurement, which tells me the measurement
is wrong rather than the person.

Missing: any evidence that the session changes anything after the session
ends. The poster is designed to be kept, on the hypothesis that an object
carries something out of the experience with you. That is a hypothesis. I have
no evidence for it.

## Reflection

I have made pots on a real wheel badly, and the thing this captures is not
the skill. It is the specific feeling of the material telling you something
about your own state that you had not noticed yet.

What I did not expect is how much of that feeling survived the translation and
how much did not. The wobble survived. The weight did not, and the weight may
have been most of it.
