import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('contributor');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      // Sign up and attach role as user metadata
      const { data, error: signUpError } = await supabase.auth.signUp(
        { email, password },
        { data: { role } }   // metadata
      );
      if (signUpError) throw signUpError;

      if (data?.user && data.session) {
        // If email confirmations are disabled, user is logged in immediately
        setSuccess('Account created! You are now logged in.');
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        // Email confirmation is required
        setSuccess('Account created! Please check your email to confirm, then log in.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="hero is-fullheight">
      <div className="hero-body">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-4">
              <div className="box">
                <h1 className="title has-text-centered">Create Account</h1>
                {error && <div className="notification is-danger" role="alert">{error}</div>}
                {success && <div className="notification is-success" role="alert">{success}</div>}
                <form onSubmit={handleSubmit} noValidate>
                  <div className="field">
                    <label htmlFor="signup-email" className="label">Email</label>
                    <div className="control has-icons-left">
                      <input id="signup-email" className="input" type="email" placeholder="admin@example.com"
                        value={email} onChange={e => setEmail(e.target.value)} required />
                      <span className="icon is-left"><i className="fas fa-envelope"></i></span>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="signup-password" className="label">Password</label>
                    <div className="control has-icons-left">
                      <input id="signup-password" className="input" type="password" placeholder="At least 6 characters"
                        value={password} onChange={e => setPassword(e.target.value)} required />
                      <span className="icon is-left"><i className="fas fa-lock"></i></span>
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Role</label>
                    <div className="control">
                      <div className="select is-fullwidth">
                        <select value={role} onChange={e => setRole(e.target.value)}>
                          <option value="contributor">Contributor (can write content)</option>
                          <option value="reviewer">Reviewer (read only)</option>
                        </select>
                      </div>
                    </div>
                    <p className="help">
                      <span className="icon"><i className="fas fa-info-circle"></i></span>
                      Reviewers can view; Contributors can create and edit guidelines.
                    </p>
                  </div>
                  <div className="field">
                    <button className="button is-primary is-fullwidth" type="submit">
                      <span className="icon"><i className="fas fa-user-plus"></i></span>
                      <span>Sign Up</span>
                    </button>
                  </div>
                </form>
                <p className="mt-3 has-text-centered">
                  Already have an account? <Link to="/login">Log in</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
