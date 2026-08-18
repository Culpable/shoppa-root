/** Keep this list aligned with Lighthouse’s agent accessibility-tree audit. */
export const AGENT_ACCESSIBILITY_RULES = [
  'button-name', 'input-button-name', 'input-image-alt', 'label', 'link-name',
  'select-name', 'document-title', 'aria-allowed-attr', 'aria-allowed-role',
  'aria-command-name', 'aria-conditional-attr', 'aria-dialog-name',
  'aria-hidden-body', 'aria-hidden-focus', 'aria-input-field-name',
  'aria-prohibited-attr', 'aria-required-attr', 'aria-required-children',
  'aria-required-parent', 'aria-roles', 'aria-text', 'aria-toggle-field-name',
  'aria-tooltip-name', 'aria-treeitem-name', 'aria-valid-attr',
  'aria-valid-attr-value', 'duplicate-id-aria', 'definition-list',
  'table-duplicate-name', 'tabindex', 'autocomplete-valid',
  'presentation-role-conflict', 'svg-img-alt',
] as const;

if (AGENT_ACCESSIBILITY_RULES.length !== 33 || new Set(AGENT_ACCESSIBILITY_RULES).size !== 33) {
  throw new Error('The agent accessibility rule contract must contain 33 unique rules.');
}
