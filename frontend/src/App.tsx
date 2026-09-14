import { useState } from "react";
import { Link, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import FoundationHealthCheck from "./components/FoundationHealthCheck";
import {
ArrowRight,
Bot,
CheckCircle2,
ChevronRight,
Clock3,
Code2,
FileText,
LayoutDashboard,
Menu,
MessageSquare,
Play,
ShieldCheck,
Sparkles,
Target,
Users,
X,
Zap,
} from "lucide-react";

const agents = [
{
icon: Target,
title: "Task Planner",
description:
"Break large goals into clear, actionable tasks automatically.",
status: "Active",
},
{
icon: Bot,
title: "AI Assistant",
description:
"Get intelligent answers, ideas and recommendations instantly.",
status: "Ready",
},
{
icon: FileText,
title: "Content Agent",
description:
"Create professional documents, summaries and project content.",
status: "Ready",
},
{
icon: Code2,
title: "Developer Agent",
description:
"Analyze code, find issues and help you build faster.",
status: "Active",
},
];

const features = [
{
icon: Bot,
title: "AI-Powered Workflow",
text: "Let intelligent agents handle repetitive work and keep your projects moving.",
},
{
icon: LayoutDashboard,
title: "One Smart Workspace",
text: "Manage projects, tasks, activity and productivity from one beautiful dashboard.",
},
{
icon: Users,
title: "Team Collaboration",
text: "Keep your team aligned with shared tasks, updates and real-time progress.",
},
{
icon: ShieldCheck,
title: "Secure by Design",
text: "Authentication and protected application routes keep your workspace safe.",
},
];

const activities = [
{
icon: CheckCircle2,
title: "Website redesign completed",
time: "2 min ago",
},
{
icon: Bot,
title: "AI generated project plan",
time: "18 min ago",
},
{
icon: FileText,
title: "Project report created",
time: "42 min ago",
},
{
icon: Users,
title: "New team member joined",
time: "1 hr ago",
},
];

function LandingPage() {
const [mobileMenu, setMobileMenu] = useState(false);

return ( <div className="app-shell">
{/* Background */} <div className="background-grid" /> <div className="background-orb orb-purple" /> <div className="background-orb orb-cyan" />

  {/* ================= NAVBAR ================= */}
  <header className="navbar">
    <div className="container nav-inner">
      <Link to="/" className="brand">
        <div className="brand-logo">
          <Sparkles size={21} />
        </div>

        <span>
          WorkPilot<span className="brand-ai"> AI</span>
        </span>
      </Link>

      <nav className={`nav-links ${mobileMenu ? "mobile-open" : ""}`}>
        <Link to="/dashboard" onClick={() => setMobileMenu(false)} className="text-amber-400 font-semibold">
          Dashboard
        </Link>

        <a href="#features" onClick={() => setMobileMenu(false)}>
          Features
        </a>

        <a href="#agents" onClick={() => setMobileMenu(false)}>
          AI Agents
        </a>

        <a href="#workspace" onClick={() => setMobileMenu(false)}>
          Workspace
        </a>

        <a href="#about" onClick={() => setMobileMenu(false)}>
          About
        </a>

        <div className="mobile-auth">
          <Link to="/dashboard" className="nav-login text-amber-400 font-medium">
            Dashboard
          </Link>

          <Link to="/login" className="nav-login">
            Login
          </Link>

          <Link to="/register" className="nav-register">
            Get Started
          </Link>
        </div>
      </nav>

      <div className="nav-actions">
        <Link to="/dashboard" className="nav-login text-amber-400 font-semibold hover:text-amber-300">
          Dashboard
        </Link>

        <Link to="/login" className="nav-login">
          Login
        </Link>

        <Link to="/register" className="nav-register">
          Get Started
          <ArrowRight size={16} />
        </Link>
      </div>

      <button
        className="mobile-menu-button"
        onClick={() => setMobileMenu(!mobileMenu)}
        aria-label="Toggle menu"
      >
        {mobileMenu ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  </header>

  <main>
    <div className="container" style={{ paddingTop: "20px" }}>
      <FoundationHealthCheck />
    </div>

    {/* ================= HERO ================= */}
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-content">
          <div className="announcement">
            <span className="announcement-dot" />
            AI-powered work management
            <ChevronRight size={15} />
          </div>

          <h1>
            Work smarter.
            <br />
            <span className="gradient-text">Move faster.</span>
          </h1>

          <p className="hero-description">
            WorkPilot AI brings intelligent agents, project management
            and productivity tools together in one powerful workspace.
          </p>

          <div className="hero-buttons">
            <Link to="/dashboard" className="primary-button">
              Launch Dashboard
              <ArrowRight size={18} />
            </Link>

            <a href="#workspace" className="secondary-button">
              <Play size={16} fill="currentColor" />
              Explore workspace
            </a>
          </div>

          <div className="hero-trust">
            <div className="avatar-stack">
              <span>R</span>
              <span>A</span>
              <span>S</span>
              <span>M</span>
            </div>

            <div>
              <div className="stars">★★★★★</div>
              <p>Built for modern teams</p>
            </div>
          </div>
        </div>

        {/* HERO VISUAL */}
        <div className="hero-visual">
          <div className="visual-glow" />

          <div className="dashboard-window">
            <div className="window-top">
              <div className="window-dots">
                <span />
                <span />
                <span />
              </div>

              <div className="window-title">
                WorkPilot AI
              </div>

              <div className="window-status">
                <span />
                Online
              </div>
            </div>

            <div className="dashboard-body">
              <aside className="mini-sidebar">
                <div className="mini-logo">
                  <Sparkles size={15} />
                </div>

                <div className="mini-nav active">
                  <LayoutDashboard size={16} />
                </div>

                <div className="mini-nav">
                  <CheckCircle2 size={16} />
                </div>

                <div className="mini-nav">
                  <Bot size={16} />
                </div>

                <div className="mini-nav">
                  <MessageSquare size={16} />
                </div>
              </aside>

              <div className="mini-content">
                <div className="mini-header">
                  <div>
                    <p className="mini-label">
                      Good morning 👋
                    </p>
                    <h3>Welcome back, Rizvaan</h3>
                  </div>

                  <div className="mini-profile">
                    R
                  </div>
                </div>

                <div className="mini-stat-grid">
                  <div className="mini-stat purple">
                    <span>Tasks</span>
                    <strong>24</strong>
                    <small>+12% this week</small>
                  </div>

                  <div className="mini-stat cyan">
                    <span>Projects</span>
                    <strong>08</strong>
                    <small>3 active now</small>
                  </div>

                  <div className="mini-stat green">
                    <span>Productivity</span>
                    <strong>92%</strong>
                    <small>Excellent</small>
                  </div>
                </div>

                <div className="mini-panels">
                  <div className="mini-chart">
                    <div className="panel-heading">
                      <span>Productivity</span>
                      <small>This week</small>
                    </div>

                    <div className="chart-area">
                      <div className="chart-line">
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                      </div>

                      <div className="chart-bars">
                        <span style={{ height: "35%" }} />
                        <span style={{ height: "55%" }} />
                        <span style={{ height: "42%" }} />
                        <span style={{ height: "70%" }} />
                        <span style={{ height: "62%" }} />
                        <span style={{ height: "88%" }} />
                        <span style={{ height: "78%" }} />
                      </div>
                    </div>
                  </div>

                  <div className="mini-ai-card">
                    <div className="ai-icon">
                      <Bot size={19} />
                    </div>

                    <span>AI Assistant</span>

                    <p>
                      Your productivity is up 18% this week.
                    </p>

                    <button>
                      View insights
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="floating-card floating-ai">
            <div className="floating-icon">
              <Bot size={18} />
            </div>

            <div>
              <strong>AI Agent active</strong>
              <span>Planning your workflow...</span>
            </div>

            <div className="pulse-dot" />
          </div>

          <div className="floating-card floating-task">
            <CheckCircle2 size={20} />

            <div>
              <strong>Task completed</strong>
              <span>Project milestone</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ================= LOGO STRIP ================= */}
    <section className="trusted-section">
      <div className="container">
        <p>ONE WORKSPACE. INFINITE POSSIBILITIES.</p>

        <div className="trusted-line">
          <span>PRODUCTIVITY</span>
          <span>PROJECTS</span>
          <span>AI AUTOMATION</span>
          <span>TEAMWORK</span>
          <span>SMART WORK</span>
        </div>
      </div>
    </section>

    {/* ================= FEATURES ================= */}
    <section id="features" className="section">
      <div className="container">
        <div className="section-heading">
          <div className="section-badge">
            <Zap size={15} />
            Powerful features
          </div>

          <h2>
            Everything you need to
            <span className="gradient-text"> get work done.</span>
          </h2>

          <p>
            Replace scattered tools with one intelligent workspace
            designed to help you focus on what actually matters.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div className="feature-card" key={feature.title}>
                <div className="feature-icon">
                  <Icon size={23} />
                </div>

                <h3>{feature.title}</h3>

                <p>{feature.text}</p>

                <a href="#workspace">
                  Explore
                  <ArrowRight size={15} />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    {/* ================= AI AGENTS ================= */}
    <section id="agents" className="section agents-section">
      <div className="container">
        <div className="agents-layout">
          <div className="agents-copy">
            <div className="section-badge">
              <Bot size={15} />
              Your AI workforce
            </div>

            <h2>
              Intelligent agents
              <br />
              <span className="gradient-text">
                working for you.
              </span>
            </h2>

            <p>
              WorkPilot AI gives you specialized AI agents that
              understand your workflow and help you complete work
              faster.
            </p>

            <div className="agent-benefits">
              <div>
                <CheckCircle2 size={18} />
                Automate repetitive tasks
              </div>

              <div>
                <CheckCircle2 size={18} />
                Generate ideas instantly
              </div>

              <div>
                <CheckCircle2 size={18} />
                Improve team productivity
              </div>
            </div>

            <Link to="/register" className="primary-button">
              Create your workspace
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="agents-grid">
            {agents.map((agent) => {
              const Icon = agent.icon;

              return (
                <div className="agent-card" key={agent.title}>
                  <div className="agent-card-top">
                    <div className="agent-icon">
                      <Icon size={22} />
                    </div>

                    <span className="agent-status">
                      <i />
                      {agent.status}
                    </span>
                  </div>

                  <h3>{agent.title}</h3>

                  <p>{agent.description}</p>

                  <div className="agent-footer">
                    <span>AI Agent</span>
                    <ArrowRight size={15} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>

    {/* ================= WORKSPACE ================= */}
    <section id="workspace" className="section workspace-section">
      <div className="container">
        <div className="workspace-card">
          <div className="workspace-copy">
            <div className="section-badge">
              <LayoutDashboard size={15} />
              Unified workspace
            </div>

            <h2>
              See everything.
              <br />
              <span className="gradient-text">
                Control anything.
              </span>
            </h2>

            <p>
              Your projects, tasks, AI agents and team activity are
              organized into a single clean command center.
            </p>

            <Link to="/dashboard" className="primary-button">
              Launch workspace
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="workspace-preview">
            <div className="preview-header">
              <div>
                <span>WORKSPACE OVERVIEW</span>
                <h3>Today's productivity</h3>
              </div>

              <div className="preview-date">
                Today
              </div>
            </div>

            <div className="progress-card">
              <div className="progress-info">
                <div>
                  <span>Daily goal</span>
                  <strong>78%</strong>
                </div>

                <small>6h 14m focused</small>
              </div>

              <div className="progress-track">
                <div className="progress-fill" />
              </div>
            </div>

            <div className="activity-list">
              {activities.map((activity) => {
                const Icon = activity.icon;

                return (
                  <div
                    className="activity-item"
                    key={activity.title}
                  >
                    <div className="activity-icon">
                      <Icon size={16} />
                    </div>

                    <div className="activity-content">
                      <strong>{activity.title}</strong>
                      <span>{activity.time}</span>
                    </div>

                    <ChevronRight size={16} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ================= STATS ================= */}
    <section className="stats-section">
      <div className="container stats-grid">
        <div className="stat-item">
          <strong>10x</strong>
          <span>Faster workflows</span>
        </div>

        <div className="stat-item">
          <strong>24/7</strong>
          <span>AI assistance</span>
        </div>

        <div className="stat-item">
          <strong>100%</strong>
          <span>Focused workspace</span>
        </div>

        <div className="stat-item">
          <strong>∞</strong>
          <span>Possibilities</span>
        </div>
      </div>
    </section>

    {/* ================= CTA ================= */}
    <section id="about" className="cta-section">
      <div className="container">
        <div className="cta-card">
          <div className="cta-glow" />

          <div className="cta-icon">
            <Sparkles size={27} />
          </div>

          <h2>
            Ready to work
            <span className="gradient-text">
              smarter?
            </span>
          </h2>

          <p>
            Create your WorkPilot AI workspace and start turning
            ideas into completed work.
          </p>

          <div className="cta-buttons">
            <Link to="/register" className="primary-button">
              Get started free
              <ArrowRight size={18} />
            </Link>

            <Link to="/login" className="secondary-button">
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    </section>
  </main>

  {/* ================= FOOTER ================= */}
  <footer className="footer">
    <div className="container footer-inner">
      <div className="footer-brand">
        <div className="brand-logo">
          <Sparkles size={18} />
        </div>

        <div>
          <strong>WorkPilot AI</strong>
          <span>Intelligent work management</span>
        </div>
      </div>

      <p>
        © {new Date().getFullYear()} WorkPilot AI. Built for
        smarter work.
      </p>

      <div className="footer-links">
        <a href="#features">Features</a>
        <a href="#agents">AI Agents</a>
        <a href="#workspace">Workspace</a>
      </div>
    </div>
  </footer>
</div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
