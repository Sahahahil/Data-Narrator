import { useState, useMemo } from 'react';
import { DashboardTemplate, findMatchingTemplates } from './DashboardTemplates';

interface DashboardTemplatePickerProps {
  availableColumns: string[];
  onApplyTemplate: (template: DashboardTemplate) => void;
}

export function DashboardTemplatePicker({ availableColumns, onApplyTemplate }: DashboardTemplatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  type CategoryFilter = DashboardTemplate['category'] | 'all';
const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  const matchingTemplates = useMemo(
    () => findMatchingTemplates(availableColumns),
    [availableColumns]
  );

  const filteredTemplates = matchingTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) as DashboardTemplate[];

  const categories: CategoryFilter[] = ['all', 'general', 'sales', 'marketing', 'product', 'finance'];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-secondary"
        aria-label="Open dashboard templates"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span className="hidden sm:inline ml-1">Templates</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-surface rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in" data-taste-skill-ignore="shadow">
            <div className="flex items-center justify-between p-4">
              <h3 className="text-lg font-semibold text-text">Dashboard Templates</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="input w-64"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="btn btn-ghost btn-sm"
                  aria-label="Close templates"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Category Sidebar */}
              <div className="w-36 bg-raised/50 p-3 overflow-y-auto">
                <nav>
                  <ul className="space-y-1">
                    {categories.map(cat => (
                      <li key={cat}>
                        <button
                          onClick={() => setSelectedCategory(cat)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedCategory === cat
                              ? 'bg-accent-soft text-accent-ink'
                              : 'text-muted hover:bg-raised hover:text-text'
                          }`}
                        >
                          {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              {/* Template Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {filteredTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted">
                    <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium">No templates found</p>
                    <p className="text-sm">Try a different search or category</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => {
                          onApplyTemplate(template);
                        }}
                        className="group bg-surface rounded-xl p-4 hover:bg-raised transition-colors duration-200 flex flex-col h-full"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl" role="img" aria-label={template.category} dangerouslySetInnerHTML={{ __html: template.icon }} />
                          <span className="px-2 py-0.5 text-xs font-medium bg-raised rounded-full text-muted">
                            {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                          </span>
                        </div>
                        <h4 className="font-semibold text-text mb-1 group-hover:text-accent transition-colors">{template.name}</h4>
                        <p className="text-sm text-muted mb-4 flex-1">{template.description}</p>
                        <div className="flex items-center justify-between pt-3">
                          <span className="text-xs text-muted">{template.widgets.length} widgets</span>
                          <span className="text-xs font-medium text-accent">Apply →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}