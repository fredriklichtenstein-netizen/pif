
export function getEmptyStateMessage(viewMode: string, hasFilters: boolean): string {
  if (hasFilters) {
    return "No items found matching your filters";
  }
  
  switch (viewMode) {
    case "saved":
      return "You haven't saved any items yet";
    case "myPifs":
      return "You haven't posted any items yet";
    case "archived":
      return "You don't have any archived items yet";
    case "interested":
      return "You haven't shown interest in any items yet";
    default:
      return "No items found";
  }
}
