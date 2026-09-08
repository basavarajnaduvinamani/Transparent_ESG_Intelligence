export interface WelcomeMessage {
  title: string;
  tease: string;
}

export const WELCOME_MESSAGES: WelcomeMessage[] = [
  {
    title: 'Back at it, Shivam',
    tease: 'Pick a FTSE100 name — I already have a hot take.',
  },
  {
    title: 'Morning, materialist.',
    tease: 'Company vs peers vs benchmark. Someone’s about to look exposed.',
  },
  {
    title: 'Ready when you are.',
    tease: 'Three bodies, one divergence. Let’s find the awkward bit.',
  },
  {
    title: 'Shivam’s on the clock.',
    tease: 'Type a ticker. I’ll do the polite version of judgement.',
  },
  {
    title: 'Let’s make Andrew nod.',
    tease: 'Conviction, peers, and a question that stings a little.',
  },
  {
    title: 'Another day, another delta.',
    tease: 'Burberry failed on signal — want to see who’s next?',
  },
  {
    title: 'Welcome back, detective.',
    tease: 'The spreadsheet is loaded. The narrative is not.',
  },
  {
    title: 'Hi Shivam — no small talk.',
    tease: 'Give me a company. I’ll give you the key question.',
  },
  {
    title: 'FTSE100 is waiting.',
    tease: 'Investor view or auditor view? Either way, interesting.',
  },
  {
    title: 'You + me + materiality.',
    tease: 'Peers look fine until you actually compare them.',
  },
  {
    title: 'Let’s poke the benchmark.',
    tease: 'Spoiler: the index is not as balanced as it looks.',
  },
  {
    title: 'Shivam, your copilot’s awake.',
    tease: 'One query away from a chart and an uncomfortable insight.',
  },
];

export function pickWelcomeMessage(): WelcomeMessage {
  return WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
}
