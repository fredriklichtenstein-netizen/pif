
import { useTranslation } from 'react-i18next';

export const useCategoryTranslations = () => {
  const { t } = useTranslation();
  
  const categoryMap: Record<string, string> = {
    'Elektronik': t('categories.electronics'),
    'Möbler': t('categories.furniture'),
    'Kläder': t('categories.clothing'),
    'Böcker': t('categories.books'),
    'Sport': t('categories.sports'),
    'Leksaker': t('categories.toys'),
    'Hem & Trädgård': t('categories.home_garden'),
    'Fordon': t('categories.vehicles'),
    'Musik': t('categories.music'),
    'Övrigt': t('categories.other'),
    // English categories
    'Electronics': t('categories.electronics'),
    'Furniture': t('categories.furniture'),
    'Clothing': t('categories.clothing'),
    'Books': t('categories.books'),
    'Sports': t('categories.sports'),
    'Toys': t('categories.toys'),
    'Home & Garden': t('categories.home_garden'),
    'Vehicles': t('categories.vehicles'),
    'Music': t('categories.music'),
    'Other': t('categories.other')
  };

  const conditionMap: Record<string, string> = {
    // Swedish labels
    'Nytt': t('conditions.new'),
    'Som nytt': t('conditions.like_new'),
    'Mycket bra': t('conditions.very_good'),
    'Bra': t('conditions.good'),
    'Acceptabelt': t('conditions.acceptable'),
    'Dåligt': t('conditions.poor'),
    // English labels
    'New': t('conditions.new'),
    'Like New': t('conditions.like_new'),
    'Very Good': t('conditions.very_good'),
    'Good': t('conditions.good'),
    'Acceptable': t('conditions.acceptable'),
    'Poor': t('conditions.poor'),
    // Database snake_case keys
    'new': t('conditions.new'),
    'like_new': t('conditions.like_new'),
    'very_good': t('conditions.very_good'),
    'good': t('conditions.good'),
    'acceptable': t('conditions.acceptable'),
    'ok': t('conditions.ok', 'OK'),
    'fair': t('conditions.acceptable'),
    'poor': t('conditions.poor'),
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
