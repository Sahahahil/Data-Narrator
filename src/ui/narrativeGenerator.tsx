export const generateNarrative = (description: string): JSX.Element => (
  <div className="prose prose-slate max-w-none mt-4">
    <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
  </div>
);