/* Interface strings only. Research entries are never routed through here —
   they stay in the language they were written in (see `lang` in the content
   schema). This dictionary covers navigation, buttons and section titles. */

export type Bilingual = { en: string; zh: string };

export const UI = {
  // navigation
  preface: { en: 'Preface', zh: '序' },
  research: { en: 'Research', zh: '研究' },
  experiments: { en: 'Experiments', zh: '实验' },
  atlas: { en: 'Atlas', zh: '田野图谱' },
  notes: { en: 'Notes', zh: '笔记' },
  about: { en: 'Why I am here', zh: '我为何在此' },
  index: { en: 'Index', zh: '总目' },
  contact: { en: 'Contact', zh: '联系' },

  // home
  enterResearch: { en: 'Enter the research', zh: '进入研究' },
  tryExperiment: { en: 'Try an experiment', zh: '试一个实验' },
  currentQuestion: { en: 'Current question', zh: '当前问题' },
  theHumanQuestion: { en: 'The human question', zh: '人的问题' },
  threeDomains: { en: 'Three domains', zh: '三个领域' },
  whatIBuilt: { en: 'What I built', zh: '我造了什么' },
  allExperiments: { en: 'All experiments', zh: '全部实验' },
  recent: { en: 'Recent', zh: '最近' },
  fullIndex: { en: 'Full index', zh: '全部条目' },
  growsLine: {
    en: 'This site grows as the work grows.',
    zh: '这个网站随工作生长。',
  },
  lastUpdated: { en: 'Last updated', zh: '最近更新' },

  // question ladder
  existential: { en: 'Existential', zh: '存在' },
  human: { en: 'Human', zh: '人类' },
  researchLevel: { en: 'Research', zh: '研究' },
  currentDesign: { en: 'Current design', zh: '当前设计' },

  // research page
  method: { en: 'Method', zh: '方法' },
  openQuestions: {
    en: 'Open questions I have not yet earned the right to answer',
    zh: '我还没有资格回答的问题',
  },
  workingQuestion: { en: 'Working question', zh: '暂定问题' },

  // experiment page
  builtWith: { en: 'Built with', zh: '技术栈' },
  lenses: { en: 'Lenses', zh: '透镜' },
  role: { en: 'Role', zh: '角色' },
  openDemo: { en: 'Open the demo', zh: '打开演示' },
  lineage: { en: 'Lineage', zh: '来路' },
  process: { en: 'Process', zh: '过程' },
  field: { en: 'Field', zh: '田野' },
  reading: { en: 'Reading', zh: '阅读' },
  experiment: { en: 'Experiment', zh: '实验' },

  // listings
  all: { en: 'All', zh: '全部' },
  observations: { en: 'Observations', zh: '观察' },
  readings: { en: 'Readings', zh: '阅读笔记' },
  labNotes: { en: 'Lab notes', zh: '实验室笔记' },
  writtenInChinese: { en: 'written in Chinese', zh: '中文' },
  leadsTo: { en: 'This entry led to', zh: '这条引出了' },
} satisfies Record<string, Bilingual>;

export type UIKey = keyof typeof UI;
