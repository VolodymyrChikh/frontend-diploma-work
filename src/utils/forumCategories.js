export const FORUM_CATEGORY_NAMES = ["Навчання", "Події", "Поради", "FAQ", "Гумор"];
export const FORUM_CATEGORY_TYPE = "FORUM";

const forumCategoryOrder = new Map(
  FORUM_CATEGORY_NAMES.map((name, index) => [name, index]),
);

export function getForumCategories(categories = []) {
  if (!Array.isArray(categories)) {
    return [];
  }

  return categories
    .filter((category) => (
      category?.type
        ? category.type === FORUM_CATEGORY_TYPE
        : forumCategoryOrder.has(category?.name)
    ))
    .sort((left, right) => (
      getCategoryOrder(left) - getCategoryOrder(right)
    ));
}

export function getForumCategoryNames(categories = []) {
  return getForumCategories(categories).map((category) => category.name);
}

function getCategoryOrder(category) {
  return forumCategoryOrder.get(category.name) ?? Number(category.id ?? Number.MAX_SAFE_INTEGER);
}
