/**
 * Safe {{variable}} interpolation for follow-up and manual messages.
 * Plain-text only: no HTML, no eval, unknown variables are left as literal text.
 */
export function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key: string) => {
    return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : match;
  });
}
