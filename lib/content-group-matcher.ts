/**
 * Content Group Matcher
 * Evaluates URL patterns against content group conditions
 */

export interface ContentGroupCondition {
  field: "url" | "page";
  operator: "contains" | "startsWith" | "endsWith" | "equals" | "regex";
  value: string;
  caseSensitive?: boolean;
}

export interface ContentGroupRule {
  conditions: ContentGroupCondition[];
  logic: "AND" | "OR";
}

/**
 * Check if a URL matches a content group's conditions
 */
export function matchesContentGroup(
  url: string,
  rules: ContentGroupRule
): boolean {
  const { conditions, logic } = rules;

  if (logic === "AND") {
    return conditions.every((condition) => matchesCondition(url, condition));
  } else {
    return conditions.some((condition) => matchesCondition(url, condition));
  }
}

/**
 * Check if a URL matches a single condition
 */
function matchesCondition(
  url: string,
  condition: ContentGroupCondition
): boolean {
  const { operator, value, caseSensitive = false } = condition;

  const urlToCheck = caseSensitive ? url : url.toLowerCase();
  const valueToCheck = caseSensitive ? value : value.toLowerCase();

  switch (operator) {
    case "contains":
      return urlToCheck.includes(valueToCheck);

    case "startsWith":
      return urlToCheck.startsWith(valueToCheck);

    case "endsWith":
      return urlToCheck.endsWith(valueToCheck);

    case "equals":
      return urlToCheck === valueToCheck;

    case "regex":
      try {
        const flags = caseSensitive ? "" : "i";
        const regex = new RegExp(valueToCheck, flags);
        return regex.test(url);
      } catch (error) {
        console.error("Invalid regex pattern:", value, error);
        return false;
      }

    default:
      return false;
  }
}

/**
 * Get all content groups that match a URL
 */
export function getMatchingContentGroups(
  url: string,
  contentGroups: Array<{
    id: string;
    name: string;
    conditions: any;
  }>
): Array<{ id: string; name: string }> {
  return contentGroups
    .filter((group) => {
      try {
        return matchesContentGroup(url, group.conditions as ContentGroupRule);
      } catch (error) {
        console.error(`Error matching content group ${group.name}:`, error);
        return false;
      }
    })
    .map((group) => ({ id: group.id, name: group.name }));
}

/**
 * Validate content group conditions
 */
export function validateContentGroupConditions(
  rules: ContentGroupRule
): { valid: boolean; error?: string } {
  if (!rules || !rules.conditions || !Array.isArray(rules.conditions)) {
    return { valid: false, error: "Invalid conditions structure" };
  }

  if (rules.conditions.length === 0) {
    return { valid: false, error: "At least one condition is required" };
  }

  for (const condition of rules.conditions) {
    if (!condition.field || !condition.operator || !condition.value) {
      return {
        valid: false,
        error: "Each condition must have field, operator, and value",
      };
    }

    if (condition.operator === "regex") {
      try {
        new RegExp(condition.value);
      } catch (error) {
        return { valid: false, error: "Invalid regex pattern" };
      }
    }
  }

  return { valid: true };
}
