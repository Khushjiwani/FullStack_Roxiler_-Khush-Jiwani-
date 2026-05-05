import { useEffect, useMemo, useState } from "react";
import { fetchProfile, fetchStores, getDashboard, getOwnerDashboard, getUserRatings, login, signup, submitRating } from "./api";
import { DashboardData, OwnerDashboard, Role, StoreSummary, UserProfile } from "./types";

const initialForm = { email: "", password: "", name: "", address: "" };

function App() {
  const [page, setPage] = useState("login");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [query, setQuery] = useState("");
  const [addressFilter, setAddressFilter] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [ownerDashboard, setOwnerDashboard] = useState<OwnerDashboard | null>(null);
  const [ratings, setRatings] = useState<any[]>([]);

  const token = useMemo(() => localStorage.getItem("authToken"), []);

  useEffect(() => {
    if (token) {
      fetchProfile()
        .then(setProfile)
        .catch(() => logout());
    }
  }, [token]);

  useEffect(() => {
    if (profile?.role === "ADMIN") {
      getDashboard().then(setDashboard).catch((err) => setMessage(err.message));
    }
    if (profile?.role === "OWNER") {
      getOwnerDashboard().then(setOwnerDashboard).catch((err) => setMessage(err.message));
    }
    if (profile?.role === "USER") {
      fetchStores().then(setStores).catch((err) => setMessage(err.message));
      getUserRatings().then(setRatings).catch(() => null);
    }
  }, [profile]);

  const handleChange = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const logout = () => {
    localStorage.removeItem("authToken");
    setProfile(null);
    setPage("login");
  };

  const handleLogin = async () => {
    try {
      const result = await login(form.email, form.password);
      localStorage.setItem("authToken", result.token);
      setProfile(result.user);
      setPage("dashboard");
      setMessage(null);
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  const handleSignup = async () => {
    try {
      await signup(form.name, form.email, form.address, form.password);
      setMessage("Registration successful. Please login.");
      setPage("login");
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  const loadStores = () => {
    fetchStores(query, addressFilter).then(setStores).catch((err) => setMessage(err.message));
  };

  const handleRate = async (storeId: number, score: number) => {
    try {
      await submitRating(storeId, score);
      setMessage("Rating submitted.");
      loadStores();
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  if (!profile) {
    return (
      <div className="container">
        <h1>Fullstack Intern Challenge</h1>
        {page === "login" ? (
          <div className="card">
            <h2>Login</h2>
            <input placeholder="Email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
            <input type="password" placeholder="Password" value={form.password} onChange={(e) => handleChange("password", e.target.value)} />
            <button onClick={handleLogin}>Login</button>
            <p>
              Don’t have an account? <button className="link" onClick={() => setPage("signup")}>Sign up</button>
            </p>
          </div>
        ) : (
          <div className="card">
            <h2>Sign Up</h2>
            <input placeholder="Name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
            <input placeholder="Email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
            <input placeholder="Address" value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
            <input type="password" placeholder="Password" value={form.password} onChange={(e) => handleChange("password", e.target.value)} />
            <button onClick={handleSignup}>Register</button>
            <p>
              Already registered? <button className="link" onClick={() => setPage("login")}>Login</button>
            </p>
          </div>
        )}
        {message && <div className="flash">{message}</div>}
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>Welcome, {profile.name}</h1>
          <p>{profile.role} dashboard</p>
        </div>
        <button onClick={logout}>Logout</button>
      </header>
      {message && <div className="flash">{message}</div>}

      {profile.role === "ADMIN" && dashboard && (
        <div className="grid">
          <div className="card">
            <h2>Total Users</h2>
            <p>{dashboard.totalUsers}</p>
          </div>
          <div className="card">
            <h2>Total Stores</h2>
            <p>{dashboard.totalStores}</p>
          </div>
          <div className="card">
            <h2>Total Ratings</h2>
            <p>{dashboard.totalRatings}</p>
          </div>
        </div>
      )}

      {profile.role === "OWNER" && ownerDashboard && (
        <div className="card">
          <h2>{ownerDashboard.store.name}</h2>
          <p>{ownerDashboard.store.address}</p>
          <p>Average Rating: {ownerDashboard.store.averageRating}</p>
          <h3>Ratings submitted</h3>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Score</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {ownerDashboard.submissions.map((item) => (
                <tr key={item.id}>
                  <td>{item.user.name}</td>
                  <td>{item.score}</td>
                  <td>{new Date(item.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {profile.role === "USER" && (
        <div>
          <div className="filters">
            <input placeholder="Search name" value={query} onChange={(e) => setQuery(e.target.value)} />
            <input placeholder="Search address" value={addressFilter} onChange={(e) => setAddressFilter(e.target.value)} />
            <button onClick={loadStores}>Search</button>
          </div>
          <div className="stores">
            {stores.map((store) => (
              <div key={store.id} className="card store-card">
                <h3>{store.name}</h3>
                <p>{store.address}</p>
                <p>Overall rating: {store.overallRating}</p>
                <div className="rating-buttons">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button key={score} onClick={() => handleRate(store.id, score)}>{score}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
