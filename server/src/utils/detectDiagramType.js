const databaseTerms = [
  "database",
  "db",
  "er diagram",
  "erd",
  "entity",
  "relationship",
  "schema",
  "student management",
  "tables"
];

const processTerms = [
  "process",
  "flow",
  "workflow",
  "steps",
  "pipeline",
  "approval",
  "onboarding"
];

const sequenceTerms = [
  "sequence",
  "interaction",
  "message passing",
  "chronological",
  "api call",
  "communication",
  "flow of messages",
  "actor",
  "protocol"
];

export function detectDiagramType(prompt) {
  const text = prompt.toLowerCase();

  if (sequenceTerms.some((term) => text.includes(term))) {
    return "sequence";
  }

  if (databaseTerms.some((term) => text.includes(term))) {
    return "er";
  }

  if (processTerms.some((term) => text.includes(term))) {
    return "flowchart";
  }

  return "architecture";
}
