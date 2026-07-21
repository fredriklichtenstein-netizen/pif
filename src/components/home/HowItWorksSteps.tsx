import { useTranslation } from "react-i18next";

const STEPS = [1, 2, 3, 4, 5];

export function HowItWorksSteps() {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {STEPS.map((step) => (
        <div key={step} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <span className="flex items-center justify-center h-7 w-7 rounded-full bg-green-500 text-white text-sm font-semibold shrink-0">
              {step}
            </span>
            <h3 className="font-semibold text-gray-800">{t(`home.how_it_works_step${step}_title`)}</h3>
          </div>
          <p className="text-sm text-gray-600">{t(`home.how_it_works_step${step}_description`)}</p>
        </div>
      ))}
    </div>
  );
}
