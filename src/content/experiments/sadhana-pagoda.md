---
number: 4
name: 'Sand to Stupa'
nameZh: '聚沙成塔'
title: 'Can an environment help humans perceive their invisible inner states?'
titleZh: '一个环境，是否能够帮助人感知那些原本不可见的内在状态？'
date: 2026-08-11
lenses: [embodied-interaction, contemplative-traditions, computational-media]
evidence: built
status: 'Built. Simulated by default; wearable integrations implemented. Not evaluated.'
statusZh: '已造。默认使用模拟生理信号；已实现可穿戴设备接入。未做评估。'
video: /video/exp-06-sadhana.mp4
poster: /image/exp-06-sadhana.jpg
demo: /demos/sadhana/
demoNote: 'Runs with simulated biosignals by default. Pair standards-compliant wearables through Web Bluetooth, or use a companion Health integration for Apple Watch and closed consumer ecosystems. Nothing is uploaded or stored.'
demoNoteZh: '默认使用模拟生理信号。支持通过标准蓝牙接入兼容设备；Apple Watch 与封闭消费级生态可通过伴侣应用 / 健康协议转接。所有数据均不上传、不存储。'
stack: [Three.js, Tone.js, Web Bluetooth, Health integration, GLSL]
summary: 'Fifty thousand grains of sand gather into a Thai chedi and gild from the spire down as the sitter settles. The sitter, for now, is a model.'
summaryZh: '五万粒沙聚成一座泰式金塔，随打坐者安定下来，自塔尖向下鎏金。而目前，那位打坐者是一个模型。'
lang: en
mechanism: "Physiological feedback"
mechanismZh: "生理反馈"
coreQuestion: "Can an environment make my internal state perceptible?"
coreQuestionZh: "环境能否让我内在的状态变得可感知？"
humanQuestion: "Can seeing ourselves change how we inhabit ourselves?"
humanQuestionZh: "当我们真正「看见自己正在发生什么」，我们会不会开始以不同的方式存在？"
researchQuestion: "How does making otherwise invisible physiological states perceptible through a responsive environment affect bodily awareness and moment-to-moment self-regulation?"
researchQuestionZh: "将原本不可见的生理状态转化为环境反馈，是否能够增强身体觉察，并影响个体当下时刻的自我调节？"
hypothesis: "Real-time physiological contingency will increase perceived bodily awareness and engagement with breathing compared with non-contingent or no-feedback conditions."
hypothesisZh: "与无反馈或非生理关联的反馈相比，实时生理关联的环境反馈将增强个体的身体觉察以及对呼吸过程的参与。"
builtPipeline: "physiological sensing → environmental visual / audio feedback"
builtPipelineZh: "生理信号感知 → 环境视觉与听觉反馈"
researchTags: ['body awareness', 'biofeedback', 'self-regulation']
researchTagsZh: ['身体觉察', '生物反馈', '自我调节']
fromAtlas: [lanna-temple-thresholds, tea-as-timing]
followsFrom: [cosmic-pottery]
process:
  - version: V01
    note: 'Cohesion and gold remain independent drives. A scripted 205-second arc keeps the work demonstrable without hardware. Consumer wearables enter through standards-compliant Bluetooth or a companion Health bridge; both paths are protocol-tested, not yet evaluated with participants.'
study:
  subtitle:
    en: 'Responsive biofeedback environment for embodied awareness'
    zh: '面向具身觉察的响应式生物反馈环境'
  keywords:
    en: 'Embodied interaction · Biofeedback · Responsive environment · Contemplative practice'
    zh: '具身交互 · 生物反馈 · 响应式环境 · 观照实践'
  stage:
    en: 'Current research study · 2026 — ongoing'
    zh: '当前研究 · 2026 — 进行中'

  cultural:
    heading:
      en: 'Learning from contemplative environments'
      zh: '向观照性环境学习'
    question:
      en: 'How have Buddhist spaces cultivated attention, awareness and transformation?'
      zh: '佛教空间如何通过环境、声音、仪式与身体实践，培养注意力、觉察与转化？'
    sites:
      - image: /image/field/watpho-bangkok.jpg
        place: { en: 'Wat Pho, Bangkok', zh: '曼谷 · 卧佛寺' }
        date: '2025-10-18'
        caption:
          en: 'Four chedi in tiled ceramic, each one a stack of diminishing tiers. The form is additive: it is read from the base upward.'
          zh: '四座瓷片贴面的佛塔，每一座都是逐层收分的堆叠。这个形是加法做出来的——要从基座往上读。'
      - image: /image/field/chedi-chiangmai.jpg
        place: { en: 'Chiang Mai old city', zh: '清迈古城' }
        date: '2025-11-02'
        caption:
          en: 'A gilded chedi lit after dark, ringed by white spires. At night the tiers separate into bands of light and the structure reads as layers rather than as mass.'
          zh: '入夜后被打亮的金塔，四周环绕白色尖顶。夜里层与层分开成一道道光带，结构读起来是层叠，而不是体量。'
      - image: /image/field/doisuthep-chiangmai.jpg
        place: { en: 'Wat Phra That Doi Suthep, Chiang Mai', zh: '清迈 · 素贴山双龙寺' }
        date: '2025-11-10'
        caption:
          en: 'The chedi at dusk, with people circling it. The walking is what makes the visit take time; the building itself is small.'
          zh: '黄昏的佛塔，人们绕塔而行。让这趟停留变长的是那圈行走，塔本身并不大。'
    principles:
      - { en: 'Attention', zh: '注意' }
      - { en: 'Rhythm', zh: '节奏' }
      - { en: 'Embodiment', zh: '具身' }
      - { en: 'Transformation', zh: '转化' }
    observations:
      - n: '01'
        title:
          en: 'The stupa as a structure of accumulation'
          zh: '佛塔是一种累积的结构'
        observed:
          en: 'A stupa is not a static building. It is a form that records accumulation — of material, of merit, of repeated acts of building and regilding over centuries.'
          zh: '佛塔不是一座静止的建筑，而是一个记录累积的形式——材料的累积、功德的累积，以及几百年间反复修建与重新贴金这些行为的累积。'
        translation:
          en: 'The digital stupa is not a simulated building. It is a visualisation of attention accumulating.'
          zh: '数字佛塔不是在模拟一座建筑，而是注意力逐渐聚合这一过程的可视化。'
      - n: '02'
        title:
          en: 'Ritual produces attention through repetition'
          zh: '仪式通过重复产生注意'
        observed:
          en: 'Buddhist practice runs on repetition: breath, circumambulation, chanting, the struck bowl. The repetition is not decorative — it is the mechanism by which attention is held.'
          zh: '佛教实践大量依靠重复：呼吸、绕行、诵念、击钵。重复不是装饰，它正是注意力得以被维系的机制。'
        translation:
          en: 'Repetition and rhythm can themselves be interaction mechanisms. The breath input, the bowl tone and the particle motion in this piece come from that observation, not from an aesthetic preference.'
          zh: '重复与节奏本身可以成为交互机制。这件作品里的呼吸输入、钵音与粒子运动来自这个观察，而不是来自审美偏好。'
      - n: '03'
        title:
          en: 'Sacred space shapes behaviour before it is understood'
          zh: '神圣空间在被理解之前就已经在塑造行为'
        observed:
          en: 'Light, sound, spatial scale and circulation change how people move through a temple, and they work on visitors who have no idea what any of it means.'
          zh: '光线、声音、空间尺度与动线改变人在寺院中的移动方式；而且它们对那些完全不懂其含义的访客同样奏效。'
        translation:
          en: 'Environment is not a passive container. It is an active participant in experience — which is the proposition the whole practice rests on.'
          zh: '环境不是被动的容器，而是经验的主动参与者——这正是整个研究实践所依赖的命题。'
    ladder:
      - level: { en: 'Traditional practice', zh: '传统实践' }
        items:
          en: 'meditation · temple ritual · sound practice · contemplative space'
          zh: '禅修 · 寺院仪式 · 声音实践 · 观照空间'
      - level: { en: 'Human principles', zh: '人的原理' }
        items:
          en: 'attention · awareness · rhythm · embodiment'
          zh: '注意 · 觉察 · 节奏 · 具身'
      - level: { en: 'Design principles', zh: '设计原则' }
        items:
          en: 'feedback · responsiveness · environmental agency'
          zh: '反馈 · 回应性 · 环境的能动'
      - level: { en: 'Computational prototype', zh: '计算原型' }
        items: { en: 'Sand to Stupa', zh: '聚沙成塔' }

  human:
    question:
      en: 'Why do humans lose connection with themselves?'
      zh: '人类为什么容易失去与自身的连接？'
    body:
      en: 'Much of modern experience runs on divided attention, automatic behaviour, reduced bodily perception and emotional states that are hard to notice. Humans have nonetheless spent millennia training that perception — through meditation, ritual, breathing practice and contemplative environments.'
      zh: '现代经验大量发生在注意力分散、行为自动化、身体感知减弱、情绪状态难以觉察的状态里。而人类却用了几千年来训练这种感知——通过禅修、仪式、呼吸练习与观照性的环境。'
    ask:
      en: 'Can contemporary technology translate these practices into new forms of embodied interaction?'
      zh: '当代技术能否把这些实践转译为新的具身交互形式？'
    transform:
      - stage: { en: 'Invisible human state', zh: '不可见的身体状态' }
        items:
          en: 'breathing · heart rhythm · attention · arousal'
          zh: '呼吸 · 心律 · 注意 · 唤醒度'
      - stage: { en: 'Computational translation', zh: '计算转译' }
        items:
          en: 'sensor · signal processing · mapping'
          zh: '传感器 · 信号处理 · 映射'
      - stage: { en: 'Visible environment', zh: '可见的环境' }
        items:
          en: 'particles · sound · spatial change'
          zh: '粒子 · 声音 · 空间变化'

  rq:
    primary:
      en: 'How does making physiological states perceptible through a responsive environment influence bodily awareness and moment-to-moment self-regulation?'
      zh: '当身体状态通过响应式环境被可感知化时，它是否会影响人的身体觉察以及即时的自我调节？'
    secondary:
      - id: Q1
        q:
          en: "How does real-time biofeedback change a person's relationship with their own body?"
          zh: '实时身体反馈是否改变人与自身身体状态的关系？'
      - id: Q2
        q:
          en: 'Does an aesthetic and symbolic environment enhance engagement compared with abstract feedback?'
          zh: '相比单纯的数据反馈，具有文化意义的环境是否增强体验投入？'
      - id: Q3
        q:
          en: 'How can contemplative traditions inform future human–computer interaction?'
          zh: '传统观照实践如何启发未来的人机交互设计？'

  hypotheses:
    - id: H1
      body:
        en: 'When users can perceive the relationship between their physiological state and environmental change, they may develop greater awareness of their embodied state.'
        zh: '当用户能够察觉自身生理状态与环境变化之间的关系时，他们可能会对自己的具身状态产生更强的觉察。'
    - id: H2
      body:
        en: 'A meaningful symbolic environment may create deeper engagement than purely numerical biofeedback.'
        zh: '一个具有意义的象征性环境，可能比纯数值的生物反馈带来更深的投入。'
    - id: H3
      body:
        en: 'Closed-loop interaction may encourage users to actively regulate their breathing and attention.'
        zh: '闭环交互可能促使用户主动调节自己的呼吸与注意力。'

  prototype:
    tagline:
      en: 'From scattered particles to a formed structure'
      zh: '从散沙到成形的结构'
    metaphor:
      en: 'The stupa becomes a computational metaphor for the process of gathering attention.'
      zh: '佛塔成为一种计算隐喻，象征注意力逐渐聚合的过程。'
    calm:
      - { en: 'breath becomes slower', zh: '呼吸变慢' }
      - { en: 'physiological signals become more stable', zh: '生理信号趋于稳定' }
      - { en: 'particles gradually organise', zh: '粒子逐渐组织起来' }
      - { en: 'the stupa emerges', zh: '塔形浮现' }
    unstable:
      - { en: 'fluctuations in physiological signals increase', zh: '生理信号的波动增大' }
      - { en: 'the particle structure loses coherence', zh: '粒子结构失去凝聚' }
      - { en: 'the stupa dissolves', zh: '塔形消散' }

  architecture:
    - stage: { en: 'Input', zh: '输入' }
      items: { en: 'respiration · heart rate', zh: '呼吸 · 心率' }
    - stage: { en: 'Sensing', zh: '感知' }
      items:
        en: 'standard Bluetooth wearables · companion app / Health integration · simulated signals'
        zh: '标准蓝牙可穿戴设备 · 伴侣应用 / 健康数据集成 · 模拟信号'
    - stage: { en: 'Processing', zh: '处理' }
      items:
        en: 'signal extraction · feature calculation'
        zh: '信号提取 · 特征计算'
    - stage: { en: 'Mapping', zh: '映射' }
      items:
        en: 'breath rhythm · particle cohesion · sound response'
        zh: '呼吸节奏 · 粒子聚合 · 声音回应'
    - stage: { en: 'Output', zh: '输出' }
      items: { en: 'visual environment · spatial audio', zh: '视觉环境 · 空间音频' }
    - stage: { en: 'User', zh: '使用者' }
      items: { en: 'perception · breathing adjustment', zh: '感知 · 呼吸调整' }

  experiment:
    goal:
      en: 'To investigate whether responsive biofeedback environments influence bodily awareness, breathing attention and perceived presence.'
      zh: '研究响应式生物反馈环境是否影响身体觉察、对呼吸的注意，以及被感知到的在场感。'
    measuresOf:
      - { en: 'bodily awareness', zh: '身体觉察' }
      - { en: 'breathing attention', zh: '对呼吸的注意' }
      - { en: 'perceived presence', zh: '在场感' }
    conditions:
      - id: A
        name: { en: 'Breath practice only', zh: '仅呼吸练习' }
        user:
          en: 'Eyes closed, guided breathing. No visual feedback.'
          zh: '闭眼，呼吸引导，无视觉反馈。'
        purpose: { en: 'Establish a baseline.', zh: '建立基线。' }
      - id: B
        name: { en: 'Static environment', zh: '静态环境' }
        user:
          en: 'The same stupa environment, playing back without any coupling to the body.'
          zh: '同样的佛塔环境，但只是播放，不与身体产生任何耦合。'
        purpose:
          en: 'Separate the effect of the imagery from the effect of the coupling.'
          zh: '把画面本身的作用，与耦合的作用分开。'
      - id: C
        name: { en: 'Responsive biofeedback environment', zh: '响应式生物反馈环境' }
        user:
          en: 'Breath and heart rate drive the environment in real time.'
          zh: '呼吸与心率实时驱动环境。'
        purpose: { en: 'Test the closed loop itself.', zh: '检验闭环本身。' }

  measurement:
    - group: { en: 'Physiological', zh: '生理' }
      items:
        en: 'heart rate · heart rate variability (HRV) · respiration pattern'
        zh: '心率 · 心率变异性（HRV） · 呼吸模式'
    - group: { en: 'Behavioural', zh: '行为' }
      items:
        en: 'breathing consistency · interaction duration · adjustment behaviour'
        zh: '呼吸稳定性 · 互动时长 · 调整行为'
    - group: { en: 'Subjective', zh: '主观' }
      items:
        en: 'post-session questionnaire: perceived presence · bodily awareness · perceived connection'
        zh: '结束后问卷：在场感 · 身体觉察 · 连接感'

  status:
    built:
      - en: 'Particle-based environment generation — 50,000 particles, GPU vertex shader'
        zh: '基于粒子的环境生成——五万粒子，GPU 顶点着色器'
      - en: 'Audio-visual feedback — spatial drone, singing bowls, temple chimes'
        zh: '视听反馈——空间低频、颂钵、寺院钟磬'
      - en: 'Breath-guided interaction — a scripted 205-second arc that runs without a sensor attached'
        zh: '呼吸引导交互——一段 205 秒的脚本弧线，不接传感器也能运行'
      - en: 'Consumer wearable input through the standard Bluetooth Heart Rate Service or a companion Health-integration bridge — protocol-tested, not yet evaluated in a participant session'
        zh: '通过标准蓝牙 Heart Rate Service 或伴侣应用健康数据桥接入消费级可穿戴设备——已完成协议测试，尚未在参与者会话中评估'
    limitation:
      en: 'This prototype currently explores experiential possibilities. The physiology driving the running piece is a model, not a measurement: sliders set a simulated sitter’s capacity and a simulated breath decides how much of it is expressed. Further controlled studies are needed to evaluate measurable effects.'
      zh: '这个原型目前探索的是体验上的可能性。驱动运行中作品的生理是一个模型，而不是测量：滑杆设定被模拟者的容量，模拟的呼吸决定其中有多少被表达出来。要评估可测量的效果，还需要进一步的对照研究。'

  reflection:
    heading:
      en: 'What does this prototype investigate?'
      zh: '这个原型在研究什么？'
    body:
      en: 'Sand to Stupa explores a fundamental question: can technology move beyond displaying information and become a medium through which humans understand themselves?'
      zh: '聚沙成塔探索一个根本问题：技术是否可以超越信息展示，成为帮助人理解自身状态的媒介？'

  next:
    heading:
      en: 'From individual feedback to adaptive environment'
      zh: '从个体反馈走向自适应环境'
    items:
      - { en: 'multimodal sensing', zh: '多模态感知' }
      - { en: 'spatial computing', zh: '空间计算' }
      - { en: 'VR environment', zh: 'VR 环境' }
      - { en: 'longitudinal studies', zh: '长期追踪研究' }
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

There are three ways to drive it. A **standards-compliant consumer wearable**
can connect directly over Web Bluetooth when it exposes the Heart Rate Service.
A **companion app / Health integration** can relay data from devices such as
Apple Watch that do not expose those readings directly to the browser. Or the
**guided arc** can run a scripted 205-second descent from agitation to stillness,
which is what runs on entry, and what you see in the recording above.

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

- **The default physiology is a model, not a measurement.** When no wearable is
  connected, the sliders set a
  simulated sitter's capacity and a simulated breath decides how much of it is
  expressed. It is built on a real and well-documented relationship — breathing
  near six breaths a minute drives respiratory sinus arrhythmia into resonance
  with the baroreflex and inflates beat-to-beat variability — but **that
  relationship is something I have read, not something I have measured.** The
  numbers on screen are outputs of my model of a body. They are not readings
  from one.
- **The wearable paths are tested against protocols, not against participants.**
  The code reads the standard Heart Rate Service and accepts normalized health
  samples from a companion bridge. Behaviour across different watches, bands,
  rings and heart-rate monitors over a full session remains untested.
- **Direct Web Bluetooth remains browser-dependent.** Chromium browsers can use
  the direct path; Safari, Apple Watch and devices that keep health data inside
  their native ecosystems require the companion-app bridge. That bridge must be
  supplied by the host installation or mobile app.
- **It needs a server.** ES modules will not load from `file://`, so unlike
  every other experiment here this one cannot be opened by double-clicking.
- **"Cohesion" is doing suspicious work.** It blends arousal and breath depth
  with fixed weights I chose by eye. There is no justification for 0.6 and 0.4
  beyond that they looked right.

## 07 What comes next

The next step is not a better simulation. It is one everyday wearable, one
room, and a sham condition — the same visuals and sound, not coupled to anything
— so that the question "is it the biofeedback, or is it just a beautiful
pagoda" can actually be answered.

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
completed a live-device participant session, is that once that evidence exists
I will want the first reading to be true.
