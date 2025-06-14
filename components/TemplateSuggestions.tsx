'use client';

import { useState, useEffect, useCallback } from 'react';
import { TemplateSuggestion } from '@/lib/models/TemplateSuggestion';

interface TemplateSuggestionsProps {
  initialSuggestions?: TemplateSuggestion[];
}

export default function TemplateSuggestions({ initialSuggestions = [] }: TemplateSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<TemplateSuggestion[]>(initialSuggestions);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<{
    status: string;
    category: string;
  }>({
    status: 'pending',
    category: 'all'
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchSuggestions = useCallback(async () => {
    if (!mounted) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filter.status,
        limit: '20'
      });
      
      if (filter.category !== 'all') {
        params.append('category', filter.category);
      }

      const response = await fetch(`/api/suggestions?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [filter.status, filter.category, mounted]);

  useEffect(() => {
    if (mounted && initialSuggestions.length === 0) {
      fetchSuggestions();
    }
  }, [filter, fetchSuggestions, initialSuggestions.length, mounted]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="w-full max-w-6xl p-6">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-light mb-2">Template Suggestions</h2>
          <p className="text-gray-600">Community suggestions for improving this Next.js + shadcn/ui template</p>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'component': return '🧩';
      case 'library': return '📚';
      case 'feature': return '⭐';
      case 'configuration': return '⚙️';
      default: return '💡';
    }
  };

  return (
    <div className="w-full max-w-6xl p-6">
              <div className="mb-8 text-center">
          <h2 className="text-3xl font-light mb-2">Template Suggestions</h2>
          <p className="text-gray-600">Community suggestions for improving this Next.js + shadcn/ui template</p>
        </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="implemented">Implemented</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={filter.category}
            onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="component">Component</option>
            <option value="library">Library</option>
            <option value="feature">Feature</option>
            <option value="configuration">Configuration</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Suggestions grid */}
      {!loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion._id}
              className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(suggestion.category)}</span>
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {suggestion.category}
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityBadgeColor(suggestion.priority)}`}>
                  {suggestion.priority}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {suggestion.title}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {suggestion.description}
              </p>

              {suggestion.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {suggestion.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>
                    By {suggestion.submitterName || 'Anonymous'}
                  </span>
                  <span>
                    {new Date(suggestion.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {suggestion.codeExample && (
                <details className="mt-4">
                  <summary className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800">
                    View Code Example
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                    <code>{suggestion.codeExample}</code>
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && suggestions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💡</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions yet</h3>
          <p className="text-gray-600">
            Be the first to suggest an improvement for this template!
          </p>
        </div>
      )}

      {/* Submit suggestion info */}
      <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Want to suggest something?</h3>
        <p className="text-blue-800 text-sm mb-4">
          Other developers can submit suggestions to this template by making POST requests to:
        </p>
        <code className="block p-3 bg-blue-100 rounded text-sm text-blue-900">
          POST {typeof window !== 'undefined' ? window.location.origin : ''}/api/suggestions
        </code>
        <p className="text-blue-700 text-xs mt-2">
          Required fields: title, description, category. Optional: submitterName, submitterUrl, codeExample, implementationNotes, priority, tags
        </p>
      </div>
    </div>
  );
} 