import { useEffect, useState } from 'react';
import { fetchGuidelines, getGuidelineCounts, getSectionsCount, getVersionsCount, getRecentGuidelines } from '../services/guidelineService';
import { fetchCategories } from '../services/categoryService';
import { supabase } from '../supabaseClient';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastSync = localStorage.getItem('lastSync') || 'Never';

  useEffect(() => {
    const load = async () => {
      try {
        const [counts, sections, versions, recentData, categories] = await Promise.all([
          getGuidelineCounts(),
          getSectionsCount(),
          getVersionsCount(),
          getRecentGuidelines(5),
          fetchCategories(),
        ]);

        // Count users (profiles)
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalGuidelines: counts.total,
          published: counts.published,
          draft: counts.draft,
          categories: categories.length,
          sections,
          versions,
          users: userCount || 0,
        });
        setRecent(recentData);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const refreshSync = () => {
    const now = new Date().toLocaleString();
    localStorage.setItem('lastSync', now);
    window.location.reload(); // quick refresh
  };

  if (loading) return <progress className="progress is-primary" max="100">Loading...</progress>;

  return (
    <div>
      <h1 className="title mb-4">Dashboard</h1>

      {/* Stat cards */}
      <div className="columns is-multiline">
        <div className="column is-6-mobile is-4-tablet is-3-desktop">
          <div className="card has-background-primary-light">
            <div className="card-content">
              <p className="title is-4 has-text-primary">{stats.totalGuidelines}</p>
              <p className="subtitle is-6">Total Guidelines</p>
            </div>
          </div>
        </div>
        <div className="column is-6-mobile is-4-tablet is-3-desktop">
          <div className="card has-background-success-light">
            <div className="card-content">
              <p className="title is-4 has-text-success">{stats.published}</p>
              <p className="subtitle is-6">Published</p>
            </div>
          </div>
        </div>
        <div className="column is-6-mobile is-4-tablet is-3-desktop">
          <div className="card has-background-warning-light">
            <div className="card-content">
              <p className="title is-4 has-text-warning">{stats.draft}</p>
              <p className="subtitle is-6">Drafts</p>
            </div>
          </div>
        </div>
        <div className="column is-6-mobile is-4-tablet is-3-desktop">
          <div className="card has-background-info-light">
            <div className="card-content">
              <p className="title is-4 has-text-info">{stats.categories}</p>
              <p className="subtitle is-6">Categories</p>
            </div>
          </div>
        </div>
        <div className="column is-6-mobile is-4-tablet is-3-desktop">
          <div className="card">
            <div className="card-content">
              <p className="title is-4">{stats.sections}</p>
              <p className="subtitle is-6">Sections</p>
            </div>
          </div>
        </div>
        <div className="column is-6-mobile is-4-tablet is-3-desktop">
          <div className="card">
            <div className="card-content">
              <p className="title is-4">{stats.versions}</p>
              <p className="subtitle is-6">Versions</p>
            </div>
          </div>
        </div>
        <div className="column is-6-mobile is-4-tablet is-3-desktop">
          <div className="card">
            <div className="card-content">
              <p className="title is-4">{stats.users}</p>
              <p className="subtitle is-6">Users</p>
            </div>
          </div>
        </div>
        <div className="column is-6-mobile is-4-tablet is-3-desktop">
          <div className="card">
            <div className="card-content">
              <p className="title is-6">{lastSync}</p>
              <button className="button is-small is-primary" onClick={refreshSync}>
                <span className="icon"><i className="fas fa-sync-alt"></i></span>
                <span>Sync Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card mt-5">
        <div className="card-header">
          <p className="card-header-title">Recent Guidelines</p>
        </div>
        <div className="card-content">
          {recent.length === 0 ? (
            <p>No guidelines yet.</p>
          ) : (
            <table className="table is-fullwidth">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((g, idx) => (
                  <tr key={idx}>
                    <td>{g.title}</td>
                    <td>{g.category?.name || '-'}</td>
                    <td>
                      <span className={`tag ${g.status === 'published' ? 'is-success' : 'is-warning'}`}>
                        {g.status}
                      </span>
                    </td>
                    <td>{new Date(g.updated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
