import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Sync() {
  const [lastSync, setLastSync] = useState(localStorage.getItem('lastSync') || 'Never');
  const [syncing, setSyncing] = useState(false);

  const handleForceSync = async () => {
    setSyncing(true);
    // Simulate a sync timestamp; in real life you'd pull updates from Supabase.
    const now = new Date().toLocaleString();
    localStorage.setItem('lastSync', now);
    setLastSync(now);
    setTimeout(() => setSyncing(false), 800);
  };

  return (
    <>
      <h1 className="title">Sync Control</h1>
      <div className="box">
        <p className="mb-3"><strong>Last sync timestamp:</strong> {lastSync}</p>
        <button className={`button is-primary ${syncing ? 'is-loading' : ''}`} onClick={handleForceSync}>
          <span className="icon"><i className="fas fa-sync-alt"></i></span>
          <span>Force Sync Now</span>
        </button>
      </div>
    </>
  );
}
