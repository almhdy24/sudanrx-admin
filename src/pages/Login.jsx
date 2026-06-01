import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="hero is-fullheight" aria-labelledby="login-heading">
      <div className="hero-body">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-4">
              <div className="box">
                <h1 id="login-heading" className="title has-text-centered">SudanRx Admin Login</h1>
                {error && <div className="notification is-danger" role="alert">{error}</div>}
                <form onSubmit={handleSubmit} noValidate>
                  <div className="field">
                    <label htmlFor="login-email" className="label">Email</label>
                    <div className="control has-icons-left">
                      <input
                        id="login-email"
                        className="input"
                        type="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        aria-required="true"
                      />
                      <span className="icon is-left"><i className="fas fa-envelope" aria-hidden="true"></i></span>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="login-password" className="label">Password</label>
                    <div className="control has-icons-left">
                      <input
                        id="login-password"
                        className="input"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        aria-required="true"
                      />
                      <span className="icon is-left"><i className="fas fa-lock" aria-hidden="true"></i></span>
                    </div>
                  </div>
                  <div className="field">
                    <button className="button is-primary is-fullwidth" type="submit">
                      <span className="icon"><i className="fas fa-sign-in-alt" aria-hidden="true"></i></span>
                      <span>Login</span>
                    </button>
                  </div>
                </form>
                <p className="mt-3 has-text-centered">
                  Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
