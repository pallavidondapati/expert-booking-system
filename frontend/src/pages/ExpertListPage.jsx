import React, { useState, useEffect, useCallback } from 'react';
import { expertAPI } from '../utils/api';
import ExpertCard from '../components/ExpertCard';
import './ExpertListPage.css';

const CATEGORIES = ['All', 'Technology', 'Finance', 'Healthcare', 'Legal', 'Marketing', 'Design', 'Entrepreneurship'];

const ExpertListPage = () => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 6, sortBy: 'rating', order: 'desc' };
      if (category !== 'All') params.category = category;
      if (search) params.search = search;
      const res = await expertAPI.getAll(params);
      setExperts(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, category, search]);

  useEffect(() => {
    fetchExperts();
  }, [fetchExperts]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPage(1);
  };

  return (
    <div className="expert-list-page">
      {/* Hero Header */}
      <header className="page-header">
        <div className="container">
          <div className="header-content">
            <div className="header-eyebrow">
              <span className="live-dot" />
              <span>Live Expert Network</span>
            </div>
            <h1>Find Your Expert</h1>
            <p>Connect with verified industry leaders. Book real-time sessions that transform your trajectory.</p>
          </div>

          <div className="search-bar-wrap">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by name or specialization..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="search-input"
              />
              {searchInput && (
                <button className="search-clear" onClick={() => { setSearchInput(''); }}>✕</button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Category Filter */}
        <div className="filter-section">
          <div className="category-pills">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-pill ${category === cat ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          {pagination && (
            <span className="result-count">
              {pagination.total} expert{pagination.total !== 1 ? 's' : ''} found
            </span>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="loading-overlay">
            <div className="spinner" style={{ width: 40, height: 40 }} />
            <p>Loading experts...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error" style={{ marginTop: 24 }}>
            ⚠️ {error}
            <button className="btn btn-ghost btn-sm" onClick={fetchExperts} style={{ marginLeft: 'auto' }}>
              Retry
            </button>
          </div>
        ) : experts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔭</div>
            <h3>No experts found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="experts-grid grid-3">
            {experts.map((expert, i) => (
              <ExpertCard
                key={expert._id}
                expert={expert}
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-ghost btn-sm"
              disabled={!pagination.hasPrev}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Previous
            </button>

            <div className="page-numbers">
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i + 1}
                  className={`page-num ${page === i + 1 ? 'active' : ''}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              className="btn btn-ghost btn-sm"
              disabled={!pagination.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertListPage;
