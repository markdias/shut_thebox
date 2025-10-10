let counter = 0;

export function createId(): string {
  counter += 1;
  const timePart = Date.now().toString(36);
  const counterPart = counter.toString(36);
  return `${timePart}-${counterPart}`;
}
