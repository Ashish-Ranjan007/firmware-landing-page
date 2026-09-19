import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

import {
    ArrowRight, Check, ChevronDown, Zap, FileText, MessageSquare, ShieldCheck,
    Lock, ScrollText, Layers, Bell, FolderCheck, Users
} from "lucide-react";
import "./styles.css";

/* ------------------------------------------------------------------ */
/*  Motion helpers                                                     */
/* ------------------------------------------------------------------ */

const prefersReduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useInView(threshold = 0.2) {
    const ref = useRef(null);
    const [seen, setSeen] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setSeen(true); io.disconnect(); }
        }, { threshold });
        io.observe(el);
        return () => io.disconnect();
    }, [threshold]);
    return [ref, seen];
}

function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
    const [ref, seen] = useInView(0.12);
    return (
        <Tag ref={ref} className={`reveal${seen ? " in" : ""} ${className}`} style={{ "--d": `${delay}ms` }} {...rest}>
            {children}
        </Tag>
    );
}

function CountUp({ to, pad = 0, duration = 1300, delay = 0 }) {
    const [ref, seen] = useInView(0.3);
    const [n, setN] = useState(0);
    useEffect(() => {
        if (!seen) return;
        if (prefersReduced()) { setN(to); return; }
        let raf, start;
        const t = setTimeout(() => {
            const tick = (ts) => {
                if (!start) start = ts;
                const p = Math.min((ts - start) / duration, 1);
                setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
                if (p < 1) raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
        }, delay);
        return () => { clearTimeout(t); cancelAnimationFrame(raf); };
    }, [seen, to, duration, delay]);
    return <span ref={ref}>{String(n).padStart(pad, "0")}</span>;
}

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

const firmTypes = [
    "Chartered accountants", "Audit firms", "Tax practices", "Law firms",
    "Company secretaries", "Consultancies", "Advisory teams"
];

// [number, question, description, answer label, explorer tab it links to]
const problems = [
    ["01", "Where is the document?", "Stop digging through WhatsApp threads, email attachments and folders.", "Engagement folders and WhatsApp intake", 1],
    ["02", "Who is doing what?", "Give every engagement a clear owner, task list and deadline.", "Tasks and review queries", 2],
    ["03", "What's still pending?", "See missing documents and unfinished work before a client has to ask.", "Document requests and reminders", 1],
    ["04", "What's overdue?", "Put deadline-risk work in front of the right person at the right time.", "Team workload and deadlines", 3],
    ["05", "What happened?", "Create a shared operational record instead of relying on someone's memory.", "Activity log and timeline", 4]
];

const intakeSteps = [
    ["01", "Client sends it", "A photo, PDF or Excel file, on the WhatsApp thread they already use."],
    ["02", "Firmware matches it", "Client, engagement and the open request are identified."],
    ["03", "Renamed and filed", "Your naming convention, in the right folder. Nobody drags files around."],
    ["04", "Checklist updates", "The request is marked received and the right person is notified."]
];

const events = [
    [MessageSquare, "Sharma Industries sent BankStmt.pdf", "WhatsApp · filed to 02 Bank"],
    [FileText, "Das Trading Co. uploaded ITR_docs.zip", "Secure link · request marked received"],
    [Check, "Query #42 resolved", "Rao & Sons · closed by manager"],
    [Bell, "Reminder sent to Sharma Industries", "3 documents still pending"]
];

const faqs = [
    ["Is Firmware accounting software?", "No. Firmware sits above your existing professional tools. It coordinates people, documents, tasks and deadlines."],
    ["Do clients need an account?", "No. Clients can upload through a secure link, or simply send documents on WhatsApp."],
    ["How does WhatsApp intake work?", "Clients send files the way they already do. Firmware identifies the client, engagement and open request, renames the file to your firm's naming convention and files it in the right folder."],
    ["Who can see my clients' documents?", "Only people assigned to that engagement. Access is controlled by role and by engagement, and every upload and download is logged."],
    ["Where is our data stored?", "Firmware Cloud is the starting point. Running inside your own cloud account or on your own servers is planned for firms with stricter requirements."],
    ["Is this ready to buy?", "Not yet. This page is for early validation. We're speaking with firms first so the product is built around real workflows."],
    ["What happens after I register?", "We'll contact you for a short conversation about how your firm currently handles work. That's it."]
];

/* ------------------------------------------------------------------ */
/*  Hero: live toast                                                   */
/* ------------------------------------------------------------------ */

function LiveToast() {
    const [on, setOn] = useState(false);
    const [i, setI] = useState(0);
    useEffect(() => {
        if (prefersReduced()) return;
        const t = setTimeout(() => setOn(true), 2400);
        return () => clearTimeout(t);
    }, []);
    useEffect(() => {
        if (!on) return;
        const t = setInterval(() => setI((v) => (v + 1) % events.length), 3800);
        return () => clearInterval(t);
    }, [on]);
    if (!on) return null;
    const [Icon, title, sub] = events[i];
    return (
        <div className="toast" key={i} role="status">
            <Icon size={16} />
            <div><b>{title}</b><small>{sub}</small></div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Product explorer                                                   */
/* ------------------------------------------------------------------ */

function EngagementView() {
    return (
        <>
            <div className="v-head"><small>ABC Pvt Ltd</small><h4>Statutory Audit FY 2025–26</h4></div>
            <div className="v-people">
                {[["AR", "Partner"], ["SM", "Manager"], ["RK", "Senior"], ["AP", "Associate"]].map(([a, r], k) => (
                    <div key={a} style={{ "--i": k }}><span>{a}</span><small>{r}</small></div>
                ))}
                <div className="v-due" style={{ "--i": 4 }}><small>Deadline</small><b>30 Sep</b></div>
            </div>
            <div className="v-counts">
                {[["Documents", 24], ["Requests", 12], ["Tasks", 18], ["Review points", 7]].map(([l, n], k) => (
                    <div key={l}><small>{l}</small><strong><CountUp to={n} delay={k * 120} /></strong></div>
                ))}
            </div>
            <div className="vrow" style={{ "--i": 4 }}><Users size={14} />Client, partner, manager and team in one place<span className="pill ok">On track</span></div>
            <div className="vrow" style={{ "--i": 5 }}><FolderCheck size={14} />Other engagements for this client<span className="pill">GST · ITR</span></div>
        </>
    );
}

function DocsView() {
    const rows = [
        ["Bank statements", "Received", "ok"],
        ["GST returns", "Received", "ok"],
        ["Fixed asset register", "Pending", ""],
        ["Debtor confirmation", "Partial", "warn"],
        ["Loan statements", "Pending", ""]
    ];
    return (
        <>
            <div className="v-head"><small>Document requests</small><h4>ABC Pvt Ltd · Audit FY 2025–26</h4></div>
            <div className="v-meter"><div><span>2 of 5 received</span><span>Reminder due Friday</span></div><div className="meter"><i style={{ width: "40%" }} /></div></div>
            {rows.map(([n, s, c], k) => (
                <div className="vrow" key={n} style={{ "--i": k }}><FileText size={14} />{n}<span className={`pill ${c}`}>{s}</span></div>
            ))}
            <div className="callout"><Bell size={16} />Reminders go out by WhatsApp and email until the client responds.</div>
        </>
    );
}

function TasksView() {
    return (
        <>
            <div className="qcard">
                <small>Review query #42</small>
                <b>Why has revenue increased 27%?</b>
                <div className="stepper">
                    {["Open", "Assigned", "Response", "Review", "Resolved"].map((s, k) => <span key={s} style={{ "--i": k }}>{s}</span>)}
                </div>
            </div>
            {[["Revenue testing · R. Kumar", "In review", "warn"], ["Bank reconciliation · A. Patnaik", "In progress", ""], ["GST review · S. Mishra", "Blocked", ""], ["Fixed asset walkthrough · R. Kumar", "Completed", "ok"]].map(([n, s, c], k) => (
                <div className="vrow" key={n} style={{ "--i": k + 3 }}><Check size={14} />{n}<span className={`pill ${c}`}>{s}</span></div>
            ))}
        </>
    );
}

function WorkloadView() {
    const rows = [["S. Mishra", 82, "18 open"], ["R. Kumar", 61, "13 open"], ["A. Patnaik", 38, "8 open"], ["P. Iyer", 100, "24 open"]];
    return (
        <>
            <div className="v-head"><small>Team workload</small><h4>This week across all engagements</h4></div>
            {rows.map(([n, w, c], k) => (
                <div className={`wrow${w === 100 ? " over" : ""}`} key={n} style={{ "--i": k }}>
                    <b>{n}</b><div className="wbar"><i style={{ width: `${w}%` }} /></div><small>{c}</small>
                </div>
            ))}
            <div className="callout"><Users size={16} />New engagement starting Monday? R. Kumar and A. Patnaik have the lightest load.</div>
        </>
    );
}

function ActivityView() {
    const logs = [
        ["10:32", "R. Kumar uploaded BankStatement.pdf"],
        ["10:35", "S. Mishra assigned Query #42 to R. Kumar"],
        ["11:14", "Sharma Industries sent GST_Return.pdf on WhatsApp"],
        ["12:03", "R. Kumar responded to Query #42"],
        ["14:20", "Manager closed Query #42"]
    ];
    return (
        <>
            <div className="chips">
                {[["Client", "Loan statements · Fri"], ["Internal", "Revenue testing · Mon"], ["Engagement", "Audit sign-off · 30 Sep"]].map(([a, b], k) => (
                    <span className="chip" key={a} style={{ "--i": k }}><small>{a}</small>{b}</span>
                ))}
            </div>
            {logs.map(([t, x], k) => <div className="logrow" key={t} style={{ "--i": k }}><time>{t}</time><span>{x}</span></div>)}
        </>
    );
}

const TABS = [
    { label: "Engagements", title: "Every piece of work happens inside an engagement.", text: "The client, partner, manager, team, deadlines, documents, tasks and review points live together. A client can have many engagements, each with its own history.", View: EngagementView },
    { label: "Document requests", title: "Structured requests, not email chains.", text: "Send a checklist, see what's received, partial or missing, and let reminders chase the client. Files arrive by secure link or on WhatsApp, and land in the right folder.", View: DocsView },
    { label: "Tasks and review", title: "Work that moves, without becoming Jira.", text: "Simple tasks with an owner, due date and status. Review queries get assigned, answered with evidence and closed by the reviewer.", View: TasksView },
    { label: "Team workload", title: "See who has room before you assign.", text: "Workload comes from real assignments, not manual entry. Spot overloaded people early and put new work where there's capacity.", View: WorkloadView },
    { label: "Deadlines and activity", title: "A record that doesn't depend on memory.", text: "Client, internal and engagement deadlines, with reminders by email, in-app and WhatsApp. Every upload, assignment and sign-off lands in the activity log.", View: ActivityView }
];
const DURATION = 7500;

function Explorer({ tab, setTab }) {
    const [paused, setPaused] = useState(false);
    useEffect(() => {
        if (paused || prefersReduced()) return;
        const t = setTimeout(() => setTab((tab + 1) % TABS.length), DURATION);
        return () => clearTimeout(t);
    }, [tab, paused, setTab]);
    const Active = TABS[tab].View;
    return (
        <div className="explorer" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            <div className="tabs" role="tablist">
                {TABS.map((t, i) => (
                    <button key={t.label} role="tab" aria-selected={i === tab} className={"tab" + (i === tab ? " active" : "")} onClick={() => setTab(i)}>
                        {i === tab && !paused && <i className="prog" style={{ animationDuration: `${DURATION}ms` }} />}
                        <span className="tab-top"><b>{t.label}</b></span>
                        <span className="detail"><span className="inner"><strong>{t.title}</strong><span>{t.text}</span></span></span>
                    </button>
                ))}
            </div>
            <div className="stage">
                <div className="stage-bar"><div className="dots"><i /><i /><i /></div><span>firmware / {TABS[tab].label.toLowerCase().replace(/ /g, "-")}</span></div>
                <div className="stage-body" key={tab}><Active /></div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  WhatsApp intake demo                                               */
/* ------------------------------------------------------------------ */

function WhatsAppDemo() {
    const [ref, seen] = useInView(0.3);
    const [s, setS] = useState(0);
    useEffect(() => {
        if (!seen) return;
        if (prefersReduced()) { setS(6); return; }
        setS(1);
        const t = setInterval(() => setS((v) => (v >= 8 ? 0 : v + 1)), 1500);
        return () => clearInterval(t);
    }, [seen]);
    const c = (n) => "step-in" + (s >= n ? " show" : "");
    const tree = [
        ["hit", "Sharma Industries"],
        ["l1", "GST Filing FY 2025–26"],
        ["l2", "01 Client Documents"],
        ["l2 hit", "02 Bank"],
        ["l3", <span className="name">Sharma_BankStmt_Apr-Sep2025.pdf</span>],
        ["l2", "03 Revenue"]
    ];
    return (
        <div className="intake-flow" ref={ref}>
            <div className="chat" aria-label="WhatsApp conversation preview">
                <div className="chat-head"><div className="chat-avatar">SI</div>Sharma Industries<small>WhatsApp</small></div>
                <div className="chat-body">
                    <div className={c(1) + " bubble"}>Sir, sending the bank statement for April to September.<small>10:32</small></div>
                    <div className={c(2) + " bubble file"}><div className="file-icon"><FileText size={16} /></div><div><b>IMG_2291.pdf</b><small>1.8 MB · PDF</small></div></div>
                    <div className={c(3) + " bubble sys"}>
                        {s >= 4
                            ? <><FolderCheck size={13} /> Filed to GST Filing FY 2025–26</>
                            : <><span className="spin" /> Matching client, engagement and request…</>}
                    </div>
                </div>
            </div>

            <div className="filed" aria-label="Where the file ends up">
                <div className="filed-label">Filed as</div>
                <div className="tree">
                    {tree.map(([cls, content], k) => (
                        <div key={k} className={`${cls} ${c(4)}`} style={{ transitionDelay: s >= 4 ? `${k * 90}ms` : "0ms" }}>{content}</div>
                    ))}
                </div>
                <div className="mini-list">
                    <div><span>Bank statements</span><span className={"st-pill" + (s >= 5 ? " ok" : "")}>{s >= 5 ? "Received" : "Awaiting"}</span></div>
                    <div><span>GST returns</span><span className="st-pill ok">Received</span></div>
                    <div><span>Fixed asset register</span><span className="st-pill">Pending</span></div>
                </div>
                <div className="filed-results">
                    <div className={c(6)}><Bell size={14} /> Assigned staff notified</div>
                    <div className={c(6)}><ShieldCheck size={14} /> Visible only to people on this engagement</div>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Trust matrix                                                       */
/* ------------------------------------------------------------------ */

function TrustMatrix() {
    const [ref, seen] = useInView(0.3);
    const rows = [
        ["AR", "Partner A", "Partner", "Full access", "full"],
        ["SM", "Manager B", "Manager", "Full access", "full"],
        ["RK", "Senior C", "Senior", "Full access", "full"],
        ["AP", "Associate D", "Associate", "Assigned areas", "part"],
        ["EE", "Employee E", "Not on this engagement", "No access", "none"],
        ["CL", "ABC Pvt Ltd", "Client", "Upload link only", "part"]
    ];
    return (
        <div ref={ref} className={"matrix" + (seen ? " on" : "")}>
            <div className="matrix-head"><small>Who can open this engagement</small><h4>ABC Pvt Ltd · Statutory Audit FY 2025–26</h4></div>
            {rows.map(([a, n, r, acc, k], i) => (
                <div className={"mrow" + (k === "none" ? " locked" : "")} key={n} style={{ "--d": `${i * 110}ms` }}>
                    <span className="av">{a}</span>
                    <div><b>{n}</b><small>{r}</small></div>
                    <span className={`acc ${k}`}>{acc}</span>
                </div>
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */

function App() {
    const [open, setOpen] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [tab, setTab] = useState(0);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const today = new Date()
        .toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
        .toUpperCase();

    useEffect(() => {
        const onScroll = () => {
            const h = document.documentElement;
            const max = h.scrollHeight - h.clientHeight;
            h.style.setProperty("--sp", max > 0 ? String(h.scrollTop / max) : "0");
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setSending(true); setError("");
        const data = Object.fromEntries(new FormData(e.target));
        try {
            await addDoc(collection(db, "leads"), {
                ...data,
                createdAt: serverTimestamp(),
            });
            setSubmitted(true);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="site">
            <nav className="nav">
                <a className="brand" href="#">firmware<span>.</span></a>
                <div className="nav-links">
                    <a href="#why">Why Firmware</a>
                    <a href="#how">How it works</a>
                    <a href="#whatsapp">WhatsApp</a>
                    <a href="#trust">Security</a>
                    <a href="#vision">Vision</a>
                </div>
                <a className="nav-cta" href="#register">Join the pilot <ArrowRight size={15} /></a>
            </nav>

            <main>
                <section className="hero">
                    <div className="eyebrow"><span className="pulse" /> Early access · Built for professional services</div>
                    <h1>
                        <span className="line"><span>Your firm's work.</span></span>
                        <span className="line"><span><em>Under control.</em></span></span>
                    </h1>
                    <p className="hero-copy">
                        Firmware is the operations layer for CA, accounting, tax, audit and legal firms.
                        Engagements, documents, tasks, deadlines and team workload in one place, with clients who can send files on WhatsApp and never log in.
                    </p>
                    <div className="hero-actions">
                        <a className="button primary" href="#register">Join the pilot <ArrowRight size={17} /></a>
                        <a className="button secondary" href="#how">See how it works <ChevronDown size={16} /></a>
                    </div>
                    <div className="trust-line"><span>Designed for firms that currently run on</span><b>WhatsApp</b><i>+</i><b>Excel</b><i>+</i><b>memory</b></div>

                    <div className="dashboard-shell" aria-label="Firmware dashboard preview">
                        <div className="window-bar"><div className="dots"><i /><i /><i /></div><span>firmware / dashboard</span><div className="window-action"><i className="live" />Live workspace</div></div>
                        <div className="dashboard">
                            <aside>
                                <div className="mini-brand">firmware<span>.</span></div>
                                <div className="side-item active">Overview</div><div className="side-item">Engagements</div><div className="side-item">Clients</div><div className="side-item">Tasks</div><div className="side-item">Documents</div>
                                <div className="side-bottom">ACME & CO.<br /><small>Admin workspace</small></div>
                            </aside>
                            <div className="dash-main">
                                <div className="dash-head"><div><small>{today}</small><h3>Good morning.</h3></div><div className="avatar">AR</div></div>
                                <div className="stats">
                                    <div><small>ACTIVE</small><strong><CountUp to={42} /></strong><span>engagements</span></div>
                                    <div><small>PENDING</small><strong><CountUp to={18} delay={100} /></strong><span>documents</span></div>
                                    <div className="danger"><small>OVERDUE</small><strong><CountUp to={4} pad={2} delay={200} /></strong><span>items need attention</span></div>
                                    <div><small>MY TASKS</small><strong><CountUp to={11} delay={300} /></strong><span>3 due today</span></div>
                                </div>
                                <div className="dash-grid">
                                    <div className="panel"><div className="panel-title"><b>Needs attention</b><span>View all →</span></div>
                                        <div className="row"><span className="status-dot red" /><div><b>GST filing — Sharma Industries</b><small>3 documents missing</small></div><strong className="due">OVERDUE</strong></div>
                                        <div className="row"><span className="status-dot amber" /><div><b>Statutory audit — Rao & Sons</b><small>Partner review pending</small></div><strong className="due">TODAY</strong></div>
                                        <div className="row"><span className="status-dot" /><div><b>ITR — Das Trading Co.</b><small>Waiting on client</small></div><strong className="due">2 DAYS</strong></div>
                                    </div>
                                    <div className="panel workload"><div className="panel-title"><b>Team workload</b><span>This week</span></div>
                                        <div className="person"><span>SM</span><div><b>S. Mishra</b><div className="bar"><i style={{ width: "82%" }} /></div></div><small>18</small></div>
                                        <div className="person"><span>RK</span><div><b>R. Kumar</b><div className="bar"><i style={{ width: "61%" }} /></div></div><small>13</small></div>
                                        <div className="person"><span>AP</span><div><b>A. Patnaik</b><div className="bar"><i style={{ width: "38%" }} /></div></div><small>8</small></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <LiveToast />
                    </div>
                </section>

                <div className="marquee" aria-hidden="true">
                    <div className="marquee-track">
                        {[...firmTypes, ...firmTypes, ...firmTypes, ...firmTypes].map((f, i) => <span key={i}>{f}<i /></span>)}
                    </div>
                </div>

                <section id="why" className="section">
                    <Reveal className="section-label">01 / THE PROBLEM</Reveal>
                    <Reveal className="split-heading"><h2>Professional work is complex.<br /><span>Operations should not be.</span></h2><p>Most firms don't have an operations system. They have a collection of chats, spreadsheets, folders and people who know where everything is.</p></Reveal>
                    <div className="problem-grid">
                        {problems.map(([n, t, d, a, target], i) => (
                            <Reveal className="problem" key={n} delay={i * 90}>
                                <span>{n}</span><h3>{t}</h3><p>{d}</p>
                                <a className="ans" href="#how" onClick={() => setTab(target)}>{a} <ArrowRight size={11} /></a>
                            </Reveal>
                        ))}
                    </div>
                </section>

                <section id="how" className="section dark-section">
                    <Reveal className="section-label">02 / THE PRODUCT</Reveal>
                    <Reveal className="split-heading"><h2>One operational layer.<br /><span>Zero rip-and-replace.</span></h2><p>Keep using Tally, tax software, drafting tools and the systems your team already knows. Firmware coordinates the work around them.</p></Reveal>
                    <Reveal><Explorer tab={tab} setTab={setTab} /></Reveal>
                </section>

                <section id="whatsapp" className="section">
                    <Reveal className="section-label">03 / WHATSAPP INTAKE</Reveal>
                    <Reveal className="split-heading"><h2>Clients don't need to log in.<br /><span>They can just send it on WhatsApp.</span></h2><p>Most clients will never open a portal. Firmware meets them where they already are, and still puts every file in the right place.</p></Reveal>
                    <WhatsAppDemo />
                    <div className="step-grid">
                        {intakeSteps.map(([n, t, d], i) => (
                            <Reveal className="problem" key={n} delay={i * 90}><span>{n}</span><h3>{t}</h3><p>{d}</p></Reveal>
                        ))}
                    </div>
                    <Reveal className="intake-note"><MessageSquare size={14} /> Same checklist, same folders, same audit trail, whichever way the document arrives.</Reveal>
                </section>

                <section id="trust" className="section dark-section">
                    <Reveal className="section-label">04 / SECURITY</Reveal>
                    <Reveal className="split-heading"><h2>Built for confidential work.<br /><span>Not bolted on later.</span></h2><p>Professional firms hold sensitive client data. Firmware treats access and security as part of the product, and lets each firm choose where the data lives.</p></Reveal>
                    <div className="trust-grid">
                        <TrustMatrix />
                        <div className="principles">
                            {[
                                [ShieldCheck, "Access follows the engagement", "People see the work they're assigned to, not everything the firm holds. Roles decide what they can do inside it."],
                                [Lock, "Encrypted end to end", "Documents are encrypted in transit and at rest, backups included, with keys kept apart from the data."],
                                [ScrollText, "Every touch is logged", "Uploads, downloads and views are recorded, so you can always answer who opened what."],
                                [Layers, "Firms never mix", "Each firm's data is isolated from every other firm on the platform."]
                            ].map(([Icon, t, d], i) => (
                                <Reveal className="pr" key={t} delay={i * 90}>
                                    <div className="icon"><Icon size={18} /></div>
                                    <div><h4>{t}</h4><p>{d}</p></div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                    <div className="deploy">
                        {[
                            ["Available at launch", true, "Firmware Cloud", "We host everything. The simplest way to start, and the right fit for most small firms."],
                            ["Later", false, "Your cloud", "Run Firmware inside your own AWS or Azure account, so client data stays in your environment."],
                            ["Later", false, "On-premise", "Run the whole system on your own servers, for firms whose client data can't leave the building."]
                        ].map(([tag, now, t, d], i) => (
                            <Reveal className="dep" key={t} delay={i * 100}>
                                <small className={now ? "now" : ""}>{tag}</small><h3>{t}</h3><p>{d}</p>
                            </Reveal>
                        ))}
                    </div>
                </section>

                <Reveal as="section" className="quote-section">
                    <div className="quote-mark">“</div>
                    <blockquote>The goal isn't to give firms another tool.<br /><strong>It's to give them one place to run the work.</strong></blockquote>
                    <div className="quote-rule" />
                    <p>Firmware is being validated with professional services firms before development begins.</p>
                </Reveal>

                <section id="vision" className="section vision">
                    <Reveal className="section-label">05 / THE ROADMAP</Reveal>
                    <Reveal className="split-heading"><h2>Start simple.<br /><span>Earn the complexity.</span></h2><p>We're deliberately not building everything on day one. The product will grow from what real firms actually ask for.</p></Reveal>
                    <div className="roadmap">
                        <Reveal className="road active"><span>V1</span><div><b>Run the firm</b><p>Clients · Engagements · Document requests · WhatsApp intake · Tasks · Review queries · Deadlines · Activity log · Basic workload view</p></div><em>Now</em></Reveal>
                        <Reveal className="road" delay={100}><span>V2</span><div><b>Remember everything</b><p>Client portal · Templates · Time tracking and utilization · Reporting · Engagement timeline · Category permissions</p></div><em>After validation</em></Reveal>
                        <Reveal className="road" delay={200}><span>V3</span><div><b>Know what's next</b><p>Risk detection · Permission-aware search · Integrations · Private cloud and on-premise</p></div><em>Long term</em></Reveal>
                    </div>
                </section>

                <section id="register" className="register">
                    <div className="register-inner">
                        <Reveal><div className="section-label">EARLY ACCESS</div><h2>Help shape<br />Firmware.</h2><p>We're talking to owners, partners and managers at professional services firms before we build. Tell us about your firm and we'll reach out.</p><div className="small-note"><Zap size={15} /> No sales pitch. Just a 15-minute conversation.</div></Reveal>
                        {submitted ? <div className="success"><div className="success-icon"><Check /></div><h3>You're on the list.</h3><p>Thanks. We'll be in touch when we're ready for the next conversation.</p><button className="button secondary" onClick={() => setSubmitted(false)}>Submit another response</button></div> :
                            <Reveal as="form" delay={120} onSubmit={submit}>
                                <label>Firm / business name<input required name="firm" placeholder="e.g. Rao & Associates" /></label>
                                <div className="form-row"><label>Your name<input required name="name" placeholder="Your name" /></label><label>Role<select required name="role" defaultValue=""><option value="" disabled>Select role</option><option>Partner / Owner</option><option>Manager</option><option>Staff</option><option>Other</option></select></label></div>
                                <div className="form-row"><label>Phone / WhatsApp<input required name="phone" placeholder="+91 98765 43210" /></label><label>Firm size<select required name="size" defaultValue=""><option value="" disabled>Select size</option><option>1–5</option><option>6–15</option><option>16–30</option><option>31–50</option><option>50+</option></select></label></div>
                                <label>What's your biggest operational headache?<textarea name="pain" rows="3" placeholder="Documents, deadlines, staff coordination, client follow-ups..." /></label>
                                <button
                                    className="button primary submit"
                                    type="submit"
                                    disabled={sending}
                                >
                                    {sending ? (
                                        "Submitting..."
                                    ) : (
                                        <>
                                            Request early access <ArrowRight size={17} />
                                        </>
                                    )}
                                </button>

                                {error && <small className="form-error">{error}</small>}

                                <small className="privacy">
                                    By submitting, you agree to be contacted about the Firmware pilot. No spam.
                                </small>
                            </Reveal>}
                    </div>
                </section>

                <section className="faq">
                    <Reveal className="section-label">FAQ</Reveal>
                    {faqs.map(([q, a], i) => (
                        <div className={"faq-item" + (open === i ? " open" : "")} key={q} onClick={() => setOpen(open === i ? null : i)}>
                            <div><b>{q}</b><div className="faq-a"><div><p>{a}</p></div></div></div>
                            <ChevronDown size={18} />
                        </div>
                    ))}
                </section>
            </main>

            <footer><div className="brand">firmware<span>.</span></div><p>The operations layer for professional services.</p><span>© 2026 Firmware</span></footer>
        </div>
    );
}

createRoot(document.getElementById("root")).render(<App />);
