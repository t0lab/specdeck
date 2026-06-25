import { Terminal } from "@/components/ui/terminal";

// Self-host walkthrough for the landing (SpecDeck is open source). Commands are
// illustrative mock — they type out and show canned output; no real shell runs.
// Sound is off (the component would otherwise fetch a /sounds asset we don't ship).
const COMMANDS = [
  "git clone https://github.com/specdeck/specdeck.git",
  "cd specdeck",
  "cp .env.example .env",
  "docker compose up -d",
];

const OUTPUTS: Record<number, string[]> = {
  0: ["Cloning into 'specdeck'...", "Resolving deltas: 100% (2417/2417), done."],
  2: ["Created .env — set your agent provider API keys."],
  3: [
    "✔ Started  postgres · redis · gateway · agent · web",
    "➜ SpecDeck ready at http://localhost:3000",
  ],
};

export function InstallTerminal() {
  return (
    <Terminal
      commands={COMMANDS}
      outputs={OUTPUTS}
      username="specdeck"
      enableSound={false}
      typingSpeed={42}
      delayBetweenCommands={900}
      className="max-w-full px-0"
    />
  );
}
