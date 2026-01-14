'use client';

import { useState, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'range' | 'text';
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface FilterValues {
  [key: string]: string | string[] | { from: string; to: string } | { min: number; max: number } | undefined;
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  filters: FilterOption[];
  values: FilterValues;
  onApply: (values: FilterValues) => void;
  onReset: () => void;
}

export function FilterDrawer({
  isOpen,
  onClose,
  title = 'Filters',
  filters,
  values,
  onApply,
  onReset,
}: FilterDrawerProps) {
  const [localValues, setLocalValues] = useState<FilterValues>(values);

  useEffect(() => {
    setLocalValues(values);
  }, [values, isOpen]);

  const handleChange = (id: string, value: any) => {
    setLocalValues(prev => ({ ...prev, [id]: value }));
  };

  const handleApply = () => {
    onApply(localValues);
    onClose();
  };

  const handleReset = () => {
    const resetValues: FilterValues = {};
    filters.forEach(f => {
      if (f.type === 'multiselect') resetValues[f.id] = [];
      else if (f.type === 'daterange') resetValues[f.id] = { from: '', to: '' };
      else if (f.type === 'range') resetValues[f.id] = { min: f.min || 0, max: f.max || 100000 };
      else resetValues[f.id] = '';
    });
    setLocalValues(resetValues);
    onReset();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    Object.entries(localValues).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) count++;
      else if (typeof value === 'object' && value !== null) {
        const obj = value as any;
        if ((obj.from && obj.from !== '') || (obj.to && obj.to !== '')) count++;
        if (obj.min !== undefined && obj.max !== undefined) {
          const filter = filters.find(f => f.id === key);
          if (filter && (obj.min !== filter.min || obj.max !== filter.max)) count++;
        }
      }
      else if (value && value !== '') count++;
    });
    return count;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {getActiveFilterCount() > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                {getActiveFilterCount()} active
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {filters.map((filter) => (
            <div key={filter.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {filter.label}
              </label>

              {/* Select */}
              {filter.type === 'select' && (
                <select
                  value={(localValues[filter.id] as string) || ''}
                  onChange={(e) => handleChange(filter.id, e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">{filter.placeholder || 'Select...'}</option>
                  {filter.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {/* Multi-select */}
              {filter.type === 'multiselect' && (
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {filter.options?.map((opt) => {
                    const selected = ((localValues[filter.id] as string[]) || []).includes(opt.value);
                    return (
                      <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            const current = (localValues[filter.id] as string[]) || [];
                            if (e.target.checked) {
                              handleChange(filter.id, [...current, opt.value]);
                            } else {
                              handleChange(filter.id, current.filter(v => v !== opt.value));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                        />
                        <span className="text-sm text-gray-700">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Date */}
              {filter.type === 'date' && (
                <input
                  type="date"
                  value={(localValues[filter.id] as string) || ''}
                  onChange={(e) => handleChange(filter.id, e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              )}

              {/* Date Range */}
              {filter.type === 'daterange' && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input
                      type="date"
                      value={(localValues[filter.id] as any)?.from || ''}
                      onChange={(e) => handleChange(filter.id, {
                        ...(localValues[filter.id] as any),
                        from: e.target.value
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input
                      type="date"
                      value={(localValues[filter.id] as any)?.to || ''}
                      onChange={(e) => handleChange(filter.id, {
                        ...(localValues[filter.id] as any),
                        to: e.target.value
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                </div>
              )}

              {/* Range (number) */}
              {filter.type === 'range' && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Min</label>
                    <input
                      type="number"
                      value={(localValues[filter.id] as any)?.min ?? filter.min ?? 0}
                      onChange={(e) => handleChange(filter.id, {
                        ...(localValues[filter.id] as any),
                        min: Number(e.target.value)
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Max</label>
                    <input
                      type="number"
                      value={(localValues[filter.id] as any)?.max ?? filter.max ?? 100000}
                      onChange={(e) => handleChange(filter.id, {
                        ...(localValues[filter.id] as any),
                        max: Number(e.target.value)
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                </div>
              )}

              {/* Text */}
              {filter.type === 'text' && (
                <input
                  type="text"
                  value={(localValues[filter.id] as string) || ''}
                  onChange={(e) => handleChange(filter.id, e.target.value)}
                  placeholder={filter.placeholder}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 space-y-3">
          <button
            onClick={handleApply}
            className="w-full py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800"
          >
            Apply Filters
          </button>
          <button
            onClick={handleReset}
            className="w-full py-3 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

