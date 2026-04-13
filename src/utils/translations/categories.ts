
import { useTranslation } from 'react-i18next';

export const useCategoryTranslations = () => {
  const { t } = useTranslation();
  
  // All category keys used in the system
  const CATEGORY_KEYS = [
    'electronics', 'furniture', 'clothing', 'books', 'sports',
    'toys', 'home_garden', 'vehicles', 'kitchen', 'garden',
    'tools', 'household', 'food', 'kids', 'pets', 'bicycle',
    'health', 'art', 'music', 'mixed', 'other'
  ];

  // Build category map from keys + legacy English/Swedish names
  const categoryMap: Record<string, string> = {};
  CATEGORY_KEYS.forEach(key => {
    categoryMap[key] = t(`categories.${key}`);
  });
  // Legacy mappings for old data
  const legacyMap: Record<string, string> = {
    'Elektronik': 'electronics', 'Electronics': 'electronics',
    'Möbler': 'furniture', 'Furniture': 'furniture',
    'Kläder': 'clothing', 'Clothing': 'clothing',
    'Böcker': 'books', 'Books': 'books',
    'Sport': 'sports', 'Sports': 'sports',
    'Leksaker': 'toys', 'Toys': 'toys',
    'Hem & Trädgård': 'home_garden', 'Home & Garden': 'home_garden',
    'Fordon': 'vehicles', 'Vehicles': 'vehicles',
    'Musik': 'music', 'Music': 'music',
    'Kitchen': 'kitchen', 'Garden': 'garden',
    'Tools': 'tools', 'Other': 'other', 'Övrigt': 'other',
  };
  Object.entries(legacyMap).forEach(([legacy, key]) => {
    categoryMap[legacy] = t(`categories.${key}`);
  });

  const conditionMap: Record<string, string> = {
    'new': t('conditions.new'),
    'like_new': t('conditions.like_new'),
    'very_good': t('conditions.very_good'),
    'good': t('conditions.good'),
    'acceptable': t('conditions.acceptable'),
    'ok': t('conditions.ok', 'OK'),
    'fair': t('conditions.fair', t('conditions.acceptable')),
    'poor': t('conditions.poor'),
    // Legacy labels
    'Nytt': t('conditions.new'),
    'Som nytt': t('conditions.like_new'),
    'Mycket bra': t('conditions.very_good'),
    'Bra': t('conditions.good'),
    'Acceptabelt': t('conditions.acceptable'),
    'Dåligt': t('conditions.poor'),
    'New': t('conditions.new'),
    'Like New': t('conditions.like_new'),
    'Very Good': t('conditions.very_good'),
    'Good': t('conditions.good'),
    'Acceptable': t('conditions.acceptable'),
    'Poor': t('conditions.poor'),
  };

  const translateCategory = (category: string): string => {
    return categoryMap[category] || category;
  };

  const translateCondition = (condition: string): string => {
    return conditionMap[condition] || condition;
  };

  return {
    translateCategory,
    translateCondition,
    categoryMap,
    conditionMap
  };
};
