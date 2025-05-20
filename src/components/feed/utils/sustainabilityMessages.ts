
/**
 * Sustainability-focused messages for empty states in the feed
 */

export const SUSTAINABILITY_FACTS = [
  "Did you know? The average item shared on PiF saves 5.6kg of CO₂ emissions.",
  "Every shared item reduces the need for new production, saving natural resources.",
  "Circular economy helps extend product lifecycles and reduces waste.",
  "Sharing locally reduces transportation emissions and strengthens communities.",
  "The most sustainable product is the one that already exists!"
];

export function getRandomSustainabilityFact(): string {
  const randomIndex = Math.floor(Math.random() * SUSTAINABILITY_FACTS.length);
  return SUSTAINABILITY_FACTS[randomIndex];
}

export function getEcoEmptyStateMessage(viewMode: string, hasFilters: boolean): string {
  if (hasFilters) {
    return "No eco-friendly items found matching your filters. Try different criteria to find sustainable alternatives!";
  }
  
  switch (viewMode) {
    case "saved":
      return "You haven't saved any items yet. Start bookmarking sustainable items that catch your interest!";
    case "myPifs":
      return "You haven't shared any items yet. Share your unused items and help reduce consumption!";
    case "archived":
      return "You don't have any archived items yet. Items you archive will appear here.";
    case "interested":
      return "You haven't shown interest in any items yet. Help extend the lifecycle of products by expressing interest!";
    default:
      return "No items found. Be the first to share and start the sustainable cycle in your community!";
  }
}
