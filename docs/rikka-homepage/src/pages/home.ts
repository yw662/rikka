import { defineElement, css } from "@rikka/elements";
import {
  div,
  h1,
  h2,
  h3,
  h4,
  p,
  section,
  button,
  span,
  pre,
  a,
  code,
} from "@rikka/dom";
import { signal, computed } from "@rikka/signal";
import "@rikka/live-playground";
import { sharedStyles } from "../shared/styles";

const homeStyles = css`
  :host {
    display: block;
    color: var(--color-text-primary);
  }
  .home {
    padding: 0;
    max-width: 100%;
    margin: 0 auto;
    overflow-x: hidden;
  }

  /* ========== Hero ========== */
  .hero {
    position: relative;
    padding: 6rem 2rem 5rem;
    background:
      radial-gradient(
        ellipse 80% 60% at 50% 0%,
        var(--color-hero-glow-start) 0%,
        transparent 60%
      ),
      linear-gradient(
        180deg,
        var(--color-hero-bg-start) 0%,
        var(--color-hero-bg-end) 100%
      );
    overflow: hidden;
  }
  .hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(var(--color-hero-grid) 1px, transparent 1px),
      linear-gradient(90deg, var(--color-hero-grid) 1px, transparent 1px);
    background-size: 56px 56px;
    background-position: center;
    mask-image: radial-gradient(
      ellipse 70% 60% at 50% 30%,
      black 30%,
      transparent 75%
    );
    -webkit-mask-image: radial-gradient(
      ellipse 70% 60% at 50% 30%,
      black 30%,
      transparent 75%
    );
    pointer-events: none;
    opacity: 0.5;
  }
  .hero::after {
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 720px;
    height: 720px;
    background: radial-gradient(
      circle,
      var(--color-hero-orb) 0%,
      transparent 70%
    );
    pointer-events: none;
    filter: blur(40px);
    animation: heroFloat 12s ease-in-out infinite;
  }
  @keyframes heroFloat {
    0%,
    100% {
      transform: translateX(-50%) translateY(0) scale(1);
      opacity: 0.7;
    }
    50% {
      transform: translateX(-50%) translateY(-30px) scale(1.08);
      opacity: 1;
    }
  }
  .hero-inner {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
  }
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 1rem;
    background: var(--color-hero-badge-bg);
    border: 1px solid var(--color-hero-badge-border);
    border-radius: 9999px;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-primary-light);
    margin-bottom: 1.5rem;
    backdrop-filter: blur(8px);
  }
  .hero-badge .badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-success);
    box-shadow: 0 0 8px var(--color-success);
    animation: badgePulse 2s ease-in-out infinite;
  }
  @keyframes badgePulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
  .hero h1 {
    font-size: clamp(2.75rem, 7vw, 5.25rem);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.04em;
    margin: 0 0 1.25rem 0;
    background: var(--gradient-hero-title);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
  .hero .tagline {
    font-size: clamp(1.125rem, 2vw, 1.5rem);
    color: var(--color-tagline-text);
    margin-bottom: 1.5rem;
    font-weight: 500;
  }
  .hero .hero-desc {
    color: var(--color-text-secondary);
    font-size: clamp(1rem, 1.5vw, 1.2rem);
    margin: 0 auto 2.5rem;
    max-width: 700px;
    line-height: 1.7;
  }
  .cta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.875rem;
    justify-content: center;
    margin-bottom: 3.5rem;
  }
  .cta a {
    padding: 0.95rem 1.75rem;
    font-size: 0.95rem;
    font-weight: 600;
    border-radius: 0.625rem;
    cursor: pointer;
    transition: all var(--transition-normal);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: none;
  }
  .btn-primary {
    background: var(--gradient-primary);
    color: white;
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(99, 102, 241, 0.5);
  }
  .btn-secondary {
    background: var(--color-btn-secondary-bg);
    border: 1px solid var(--color-btn-secondary-border);
    color: var(--color-text-primary);
    backdrop-filter: blur(8px);
  }
  .btn-secondary:hover {
    border-color: var(--color-primary);
    background: var(--color-btn-secondary-hover-bg);
    transform: translateY(-2px);
  }

  .stats-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 3.5rem;
  }
  .stat-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.9rem;
    background: var(--color-stat-pill-bg);
    border: 1px solid var(--color-stat-pill-border);
    border-radius: 9999px;
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    backdrop-filter: blur(8px);
  }
  .stat-pill .pill-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  .pill-dot.purple {
    background: var(--color-primary);
  }
  .pill-dot.green {
    background: var(--color-success);
  }
  .pill-dot.pink {
    background: var(--color-accent);
  }
  .pill-dot.amber {
    background: var(--color-warning);
  }
  .stat-pill .pill-text {
    color: var(--color-text-primary);
    font-weight: 600;
  }

  /* ========== Hero code preview ========== */
  .hero-demo {
    position: relative;
    max-width: 760px;
    margin: 0 auto;
    border-radius: 0.875rem;
    overflow: hidden;
    background: var(--color-code-block-bg);
    border: 1px solid var(--color-code-block-border);
    box-shadow:
      0 30px 80px -20px rgba(99, 102, 241, 0.4),
      0 8px 24px -8px rgba(0, 0, 0, 0.4);
  }
  .hero-demo::before {
    content: "";
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    padding: 1px;
    background: var(--gradient-primary);
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0.4;
  }
  .hero-demo-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1rem;
    background: rgba(255, 255, 255, 0.04);
    border-bottom: 1px solid var(--color-code-block-border);
  }
  .hero-demo-bar .dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
  }
  .hero-demo-bar .dot.red {
    background: #f87171;
  }
  .hero-demo-bar .dot.amber {
    background: #fbbf24;
  }
  .hero-demo-bar .dot.green {
    background: #34d399;
  }
  .hero-demo-bar .file-name {
    margin-left: 0.5rem;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }
  .hero-demo-body {
    display: flex;
    min-height: 220px;
  }
  .hero-demo-code {
    flex: 1;
    padding: 1.25rem 1.5rem;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    line-height: 1.75;
    color: var(--color-code-block-text);
    background: transparent;
    margin: 0;
    white-space: pre;
    overflow-x: auto;
  }
  .hero-demo-code .kw {
    color: #c084fc;
  }
  .hero-demo-code .fn {
    color: #60a5fa;
  }
  .hero-demo-code .str {
    color: #86efac;
  }
  .hero-demo-code .cmt {
    color: #64748b;
    font-style: italic;
  }
  .hero-demo-code .num {
    color: #fbbf24;
  }
  .hero-demo-code .var {
    color: #f472b6;
  }
  .hero-demo-preview {
    flex: 0 0 220px;
    padding: 1.25rem 1.5rem;
    border-left: 1px solid var(--color-code-block-border);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
    background: rgba(255, 255, 255, 0.02);
  }
  .hero-demo-count {
    font-size: 1.875rem;
    font-weight: 700;
    color: var(--color-primary-light);
    font-family: var(--font-mono);
  }
  .hero-demo-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .hero-demo-buttons {
    display: flex;
    gap: 0.5rem;
  }
  .hero-demo-buttons button {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    cursor: pointer;
    border: none;
    border-radius: 0.5rem;
    color: white;
    transition: all var(--transition-fast);
  }
  .hero-demo-buttons .btn-dec {
    background: rgba(99, 102, 241, 0.25);
    color: #c7d2fe;
  }
  .hero-demo-buttons .btn-dec:hover {
    background: rgba(99, 102, 241, 0.5);
  }
  .hero-demo-buttons .btn-inc {
    background: var(--gradient-primary);
  }
  .hero-demo-buttons .btn-inc:hover {
    transform: scale(1.1);
  }

  /* ========== Section base ========== */
  .section {
    padding: 5rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  .section-eyebrow {
    display: block;
    text-align: center;
    color: var(--color-primary);
    font-size: 0.8125rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 0.75rem;
  }
  .section-title {
    text-align: center;
    font-size: clamp(1.875rem, 4vw, 2.5rem);
    color: var(--color-section-title);
    margin: 0 0 0.875rem 0;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .section-subtitle {
    text-align: center;
    color: var(--color-section-subtitle);
    font-size: 1.0625rem;
    margin: 0 auto 3rem;
    max-width: 640px;
    line-height: 1.6;
  }

  /* ========== Features grid ========== */
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
  }
  .feature-card {
    position: relative;
    background: var(--color-card-bg);
    border: 1px solid var(--color-card-border);
    border-radius: 1rem;
    padding: 1.75rem;
    transition: all var(--transition-normal);
    overflow: hidden;
  }
  .feature-card::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: var(--gradient-primary);
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--transition-normal);
  }
  .feature-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px -10px rgba(99, 102, 241, 0.25);
  }
  .feature-card:hover::after {
    opacity: 0.5;
  }
  .feature-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-feature-icon-bg);
    border-radius: 0.75rem;
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }
  .feature-card h3 {
    font-size: 1.125rem;
    color: var(--color-text-primary);
    margin: 0 0 0.5rem 0;
    font-weight: 600;
  }
  .feature-card p {
    color: var(--color-text-secondary);
    font-size: 0.9375rem;
    margin: 0;
    line-height: 1.65;
  }

  /* ========== Demo section (always dark) ========== */
  .demo-section {
    background: var(--color-demo-section-bg);
    padding: 5rem 2rem;
    position: relative;
    overflow: hidden;
  }
  .demo-section::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 60% 40% at 50% 0%,
      rgba(99, 102, 241, 0.2) 0%,
      transparent 70%
    );
    pointer-events: none;
  }
  .demo-section .section-title {
    color: var(--color-section-title);
  }
  .demo-section .section-subtitle {
    color: var(--color-section-subtitle);
  }
  .demo-section .section-eyebrow {
    color: var(--color-primary-light);
  }
  .demo-container {
    position: relative;
    z-index: 1;
    max-width: 1000px;
    margin: 0 auto;
  }

  /* ========== Advantages section (always dark for code examples) ========== */
  .advantages-section {
    background: var(--color-demo-section-bg);
    padding: 5rem 2rem;
    position: relative;
    overflow: hidden;
  }
  .advantages-section::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(
        ellipse 50% 40% at 80% 20%,
        rgba(168, 85, 247, 0.15) 0%,
        transparent 60%
      ),
      radial-gradient(
        ellipse 50% 40% at 20% 80%,
        rgba(99, 102, 241, 0.15) 0%,
        transparent 60%
      );
    pointer-events: none;
  }
  .advantages-section .section-title {
    color: var(--color-section-title);
  }
  .advantages-section .section-subtitle {
    color: var(--color-section-subtitle);
  }
  .advantages-section .section-eyebrow {
    color: var(--color-primary-light);
  }
  .advantages-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  .advantage-card {
    background: var(--color-surface);
    backdrop-filter: blur(12px);
    border: 1px solid var(--color-card-border);
    border-radius: 1rem;
    padding: 1.75rem;
    transition: all var(--transition-normal);
    display: flex;
    flex-direction: column;
  }
  .advantage-card:hover {
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 12px 32px -8px rgba(99, 102, 241, 0.3);
  }
  .advantage-card h3 {
    color: var(--color-text-primary);
    font-size: 1.2rem;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.625rem;
    font-weight: 600;
    flex-shrink: 0;
  }
  .advantage-card h3::before {
    content: "✓";
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    background: var(--gradient-primary);
    border-radius: 50%;
    font-size: 0.875rem;
    font-weight: 700;
    color: white;
  }
  .advantage-card p {
    color: var(--color-text-secondary);
    line-height: 1.65;
    margin: 0 0 1.25rem 0;
    font-size: 0.9375rem;
    flex-shrink: 0;
    min-height: 4.95rem; /* ~3 lines × 1.65 line-height */
  }
  .advantage-card .code-snippet {
    background: var(--color-code-block-bg);
    border: 1px solid var(--color-code-block-border);
    border-radius: 0.5rem;
    padding: 0.875rem 1rem;
    padding-top: 2.25rem;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    line-height: 1.6;
    color: var(--color-text-primary);
    position: relative;
    word-wrap: break-word;
    white-space: pre-wrap;
    -moz-tab-size: 2;
    tab-size: 2;
    margin: 0;
    flex: 1;
  }
  .advantage-card .code-snippet .kw {
    color: #c084fc;
  }
  .advantage-card .code-snippet .fn {
    color: #60a5fa;
  }
  .advantage-card .code-snippet .str {
    color: #86efac;
  }
  .advantage-card .code-snippet .cmt {
    color: #64748b;
    font-style: italic;
  }
  .advantage-card .code-snippet .num {
    color: #fbbf24;
  }
  .advantage-card .code-snippet::before {
    content: "Rikka";
    position: absolute;
    top: 0.5rem;
    right: 0.625rem;
    font-size: 0.625rem;
    color: #818cf8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* ========== Comparison table ========== */
  .comparison-section {
    max-width: 1100px;
    margin: 4rem auto 0;
    position: relative;
    z-index: 1;
  }
  .comparison-table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .comparison-title {
    text-align: center;
    font-size: 1.25rem;
    color: var(--color-section-title);
    margin: 0 0 1.25rem 0;
    font-weight: 600;
  }
  .comparison-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.875rem;
    background: var(--color-surface);
    backdrop-filter: blur(12px);
    border: 1px solid var(--color-card-border);
    border-radius: 0.875rem;
    overflow: hidden;
  }
  .comparison-table thead {
    background: rgba(99, 102, 241, 0.04);
  }
  .comparison-table th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-border);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .comparison-table th:first-child {
    color: var(--color-text-muted);
  }
  .comparison-table th.rikka-col {
    color: var(--color-primary-light);
    background: rgba(99, 102, 241, 0.08);
  }
  .comparison-table td {
    padding: 0.7rem 1rem;
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-border-subtle);
  }
  .comparison-table td:first-child {
    color: var(--color-text-primary);
    font-weight: 500;
  }
  .comparison-table td.rikka-col {
    color: var(--color-primary-light);
    font-weight: 600;
    background: rgba(99, 102, 241, 0.06);
  }
  .comparison-table tbody tr:last-child td {
    border-bottom: none;
  }
  .comparison-table .check {
    color: #4ade80;
  }
  .comparison-table .cross {
    color: #f87171;
  }
  .comparison-caption {
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.75rem;
    margin-top: 0.875rem;
  }

  /* ========== Tags / Everything You Need ========== */
  .tags-section {
    padding: 4.5rem 2rem;
    text-align: center;
    background: var(--color-tags-section-bg);
  }
  .tags-cloud {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.6rem;
    max-width: 900px;
    margin: 0 auto;
  }
  .tag {
    padding: 0.5rem 1rem;
    background: var(--color-tag-bg);
    border: 1px solid var(--color-tag-border);
    border-radius: 9999px;
    font-size: 0.875rem;
    color: var(--color-tag-text);
    font-weight: 500;
    transition: all var(--transition-fast);
  }
  .tag:hover {
    background: var(--color-tag-bg-hover);
    border-color: var(--color-primary);
    transform: translateY(-2px);
  }

  /* ========== Quick start ========== */
  .quick-start {
    padding: 5rem 2rem;
    max-width: 880px;
    margin: 0 auto;
  }
  .install-cmd {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.125rem;
    background: var(--color-code-block-bg);
    border: 1px solid var(--color-code-block-border);
    border-radius: 0.625rem;
    margin-bottom: 2.5rem;
    font-family: var(--font-mono);
    font-size: 0.875rem;
    color: var(--color-code-block-text);
    position: relative;
  }
  .install-cmd .cmd-prefix {
    color: var(--color-text-muted);
    user-select: none;
  }
  .copy-btn {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    padding: 0.3rem 0.7rem;
    font-size: 0.7rem;
    background: var(--color-tag-bg);
    border: 1px solid var(--color-tag-border);
    color: var(--color-text-muted);
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .copy-btn:hover {
    background: var(--color-tag-bg-hover);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  .cdn-code-block {
    margin-bottom: 0;
    padding-right: 4rem;
  }
  .steps {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-bottom: 2.5rem;
  }
  .step {
    display: flex;
    gap: 1.25rem;
    align-items: flex-start;
    padding: 1.5rem;
    background: var(--color-card-bg);
    border: 1px solid var(--color-card-border);
    border-radius: 0.875rem;
    transition: all var(--transition-normal);
  }
  .step:hover {
    border-color: var(--color-primary);
    transform: translateX(4px);
  }
  .step-number {
    flex-shrink: 0;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    background: var(--gradient-primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1rem;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
  }
  .step-content h4 {
    color: var(--color-text-primary);
    margin: 0 0 0.4rem 0;
    font-size: 1.1rem;
    font-weight: 600;
  }
  .step-content p {
    color: var(--color-text-secondary);
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.6;
  }
  .step-content code {
    background: var(--color-step-code-bg);
    padding: 0.15rem 0.45rem;
    border-radius: 0.25rem;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--color-step-code-text);
  }

  /* ========== Packages section (always dark for code aesthetic) ========== */
  .packages-section {
    padding: 5rem 2rem;
    background: var(--color-surface);
    position: relative;
    overflow: hidden;
  }
  .packages-section::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 60% 40% at 50% 100%,
      rgba(99, 102, 241, 0.18) 0%,
      transparent 60%
    );
    pointer-events: none;
  }
  .packages-section > * {
    position: relative;
    z-index: 1;
  }
  .packages-section .section-title {
    color: var(--color-section-title);
  }
  .packages-section .section-subtitle {
    color: var(--color-section-subtitle);
  }
  .packages-section .section-eyebrow {
    color: var(--color-primary-light);
  }
  .package-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
    max-width: 1100px;
    margin: 0 auto;
  }
  .package-card {
    position: relative;
    background: var(--color-surface);
    backdrop-filter: blur(12px);
    border: 1px solid var(--color-card-border);
    border-radius: 1rem;
    padding: 1.75rem;
    transition: all var(--transition-normal);
    overflow: hidden;
  }
  .package-card::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 50%;
    height: 3px;
    background: var(--gradient-primary);
    border-radius: 2px;
    opacity: 0;
    transition: opacity var(--transition-normal);
  }
  .package-card:hover {
    border-color: var(--color-primary);
    transform: translateY(-3px);
    box-shadow: 0 12px 32px -8px rgba(99, 102, 241, 0.3);
  }
  .package-card:hover::after {
    opacity: 1;
  }
  .package-card h3 {
    font-size: 1.25rem;
    color: var(--color-primary-light);
    margin: 0 0 0.875rem 0;
    font-weight: 600;
    font-family: var(--font-mono);
  }
  .package-card p {
    color: var(--color-text-secondary);
    font-size: 0.9375rem;
    margin: 0 0 1.5rem 0;
    line-height: 1.65;
  }
  .package-card .npm {
    padding: 0.65rem 0.875rem;
    background: var(--color-code-block-bg);
    border-radius: 0.5rem;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--color-npm-text);
    border: 1px solid var(--color-code-block-border);
  }
  .package-card .npm::before {
    content: "$ ";
    color: #64748b;
  }

  /* ========== Footer ========== */
  .footer {
    padding: 4rem 2rem 2rem;
    background: var(--color-footer-bg);
    border-top: 1px solid var(--color-footer-border);
    color: var(--color-footer-text);
  }
  .footer-inner {
    max-width: 1200px;
    margin: 0 auto;
  }
  .footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 3rem;
    margin-bottom: 3rem;
  }
  .footer-brand-section .footer-logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-primary);
    text-decoration: none;
    display: inline-block;
    margin-bottom: 0.75rem;
  }
  .footer-brand-section .footer-logo:hover {
    color: var(--color-primary-light);
  }
  .footer-brand-desc {
    color: var(--color-footer-text);
    font-size: 0.875rem;
    line-height: 1.6;
    margin: 0;
    max-width: 280px;
  }
  .footer-built-with {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 1rem;
    padding: 0.3rem 0.7rem;
    background: var(--color-tag-bg);
    border: 1px solid var(--color-tag-border);
    border-radius: 9999px;
    font-size: 0.7rem;
    color: var(--color-primary-light);
  }
  .footer-column-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
  }
  .footer-links {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .footer-links a {
    color: var(--color-footer-link);
    text-decoration: none;
    font-size: 0.875rem;
    transition: color var(--transition-fast);
  }
  .footer-links a:hover {
    color: var(--color-text-primary);
  }
  .footer-bottom {
    padding-top: 2rem;
    border-top: 1px solid var(--color-footer-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--color-footer-text-muted);
    font-size: 0.8rem;
  }
  .footer-bottom-links {
    display: flex;
    gap: 1.5rem;
  }
  .footer-bottom-links a {
    color: var(--color-footer-text-muted);
    text-decoration: none;
    transition: color var(--transition-fast);
  }
  .footer-bottom-links a:hover {
    color: var(--color-text-secondary);
  }

  /* ========== Responsive ========== */
  @media (max-width: 900px) {
    .feature-grid,
    .package-grid {
      grid-template-columns: 1fr;
    }
    .advantages-grid {
      grid-template-columns: 1fr;
    }
    .hero-demo-body {
      flex-direction: column;
    }
    .hero-demo-preview {
      flex: none;
      border-left: none;
      border-top: 1px solid var(--color-code-block-border);
    }
    .comparison-table-wrapper {
      margin: 0 -2rem;
      padding: 0 2rem;
    }
    .comparison-table {
      font-size: 0.75rem;
      min-width: 600px;
    }
    .comparison-table th,
    .comparison-table td {
      padding: 0.5rem;
    }
    .footer-grid {
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    .footer-brand-section {
      grid-column: 1 / -1;
    }
    .step {
      flex-direction: column;
      text-align: center;
      align-items: center;
    }
  }

  @media (max-width: 600px) {
    .hero {
      padding: 4rem 1.25rem 3rem;
    }
    .section {
      padding: 3.5rem 1.25rem;
    }
    .stats-row {
      gap: 0.4rem;
    }
    .stat-pill {
      font-size: 0.75rem;
      padding: 0.4rem 0.7rem;
    }
    .comparison-table-wrapper {
      margin: 0 -1.25rem;
      padding: 0 1.25rem;
    }
    .comparison-table {
      min-width: 500px;
    }
    .footer-grid {
      grid-template-columns: 1fr;
    }
    .footer-bottom {
      flex-direction: column;
      gap: 0.75rem;
      text-align: center;
    }
  }
`;

function highlightCode(code: string): string {
  const tokens: { type: string; value: string }[] = [];
  const re =
    /(\/\/[^\n]*)|(`[^`]*`|'[^']*'|"[^"]*")|(\b(?:const|let|var|function|return|if|else|import|from|as|new)\b)|(\b(?:signal|computed|effect|div|button|span|document)\b)|(\b\d+\b)|([^\s\w]+)|(\w+)|\s+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    if (m[1]) tokens.push({ type: "cmt", value: m[1] });
    else if (m[2]) tokens.push({ type: "str", value: m[2] });
    else if (m[3]) tokens.push({ type: "kw", value: m[3] });
    else if (m[4]) tokens.push({ type: "fn", value: m[4] });
    else if (m[5]) tokens.push({ type: "num", value: m[5] });
    else if (m[6]) tokens.push({ type: "op", value: m[6] });
    else if (m[7]) tokens.push({ type: "id", value: m[7] });
    else if (m[0]) tokens.push({ type: "ws", value: m[0] });
  }
  return tokens
    .map((t) => {
      const safe = t.value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      if (t.type === "ws" || t.type === "op" || t.type === "id") return safe;
      return `<span class="${t.type}">${safe}</span>`;
    })
    .join("");
}

const counterCode = `// Try editing this code!
const count = signal(0);
const doubled = computed(() => count.get() * 2);

const app = div(
  { class: 'counter' },
  span({ class: 'count' }, count),
  span({ class: 'label' }, 'doubled: ', doubled),
);
container.appendChild(app);`;

const HomePage = defineElement("rikka-home", {
  styles: homeStyles,
  render() {
    const demoCount = signal(0);
    const demoDoubled = computed(() => demoCount.get() * 2);

    const heroDemo = div(
      { class: "hero-demo" },
      div(
        { class: "hero-demo-bar" },
        span({ class: "dot red" }),
        span({ class: "dot amber" }),
        span({ class: "dot green" }),
        span({ class: "file-name" }, "counter.ts"),
      ),
      div(
        { class: "hero-demo-body" },
        (() => {
          const codeEl = document.createElement("pre");
          codeEl.className = "hero-demo-code";
          codeEl.innerHTML = highlightCode(counterCode);
          return codeEl;
        })(),
        div(
          { class: "hero-demo-preview" },
          div({ class: "hero-demo-label" }, "Live Preview"),
          div(
            { class: "hero-demo-count" },
            "Count: ",
            demoCount,
            " (×2: ",
            demoDoubled,
            ")",
          ),
          div(
            { class: "hero-demo-buttons" },
            button(
              {
                class: "btn-dec",
                onclick: () => demoCount.set(demoCount.get() - 1),
              },
              "−",
            ),
            button(
              {
                class: "btn-inc",
                onclick: () => demoCount.set(demoCount.get() + 1),
              },
              "+",
            ),
          ),
        ),
      ),
    );

    const features = [
      {
        icon: "⚡",
        title: "Fine-Grained Reactivity",
        desc: "Signals drive surgical DOM updates. No virtual DOM diffing, no re-renders — just the minimal changes, instantly.",
      },
      {
        icon: "🧠",
        title: "LLM-Friendly",
        desc: "Native HTML/CSS/JS patterns are more predictable for AI code generation than complex framework abstractions.",
      },
      {
        icon: "📦",
        title: "Zero Runtime Tax",
        desc: "No framework runtime in your bundle. Direct browser APIs with tree-shakeable packages.",
      },
      {
        icon: "✂️",
        title: "Template System",
        desc: [
          code("css``"),
          " and ",
          code("h``"),
          " tag templates with slots. Declarative, reactive, and type-safe styling.",
        ],
      },
      {
        icon: "🔒",
        title: "Type Safe",
        desc: "Full TypeScript inference for signals and DOM helpers. Catch errors at compile time, not at runtime.",
      },
      {
        icon: "🌐",
        title: "Web Standards",
        desc: "Built on Custom Elements, Shadow DOM, and the TC39 Signals proposal. Future-proof by design.",
      },
    ];

    const advantages = [
      {
        title: "No Hook Rules",
        desc: "Signals work anywhere — inside loops, conditionals, callbacks, or even outside components. No more hook ordering restrictions.",
        code: "// ✅ Rikka: Use signals freely\nif (condition) {\n  const count = signal(0);\n}\n\nfunction helper() {\n  const data = signal(null);  // OK!\n}\n\n// ❌ React: Hook rules violation\nif (condition) {\n  const [count, setCount] = useState(0); // Error!\n}",
      },
      {
        title: "No Build Step",
        desc: "h() function calls work directly in the browser. No JSX compiler, no webpack config, no transpilation needed.",
        code: "// ✅ Rikka: Runs in browser\nconst btn = button(\n  { onclick: () => alert('Hi!') },\n  'Click me',\n);\ndocument.body.appendChild(btn);\n\n// ❌ React: Requires build step\n// Must compile JSX → React.createElement()\n// Needs bundler (webpack/vite)",
      },
      {
        title: "Smaller Bundle",
        desc: "Tree-shakeable packages with zero runtime overhead. Only ship what you use — no virtual DOM algorithm included.",
        code: "// ✅ Rikka: Measured live from npm\n// Total: ~16KB (all 3 packages, min+gzip)\nimport { signal }       from '@rikka/signal';       // ~2KB\nimport { div, button }  from '@rikka/dom';          // ~6KB\nimport { defineElement } from '@rikka/elements';     // ~3KB\n\n// ❌ React: ~42KB (min+gzip)\n// + ReactDOM: ~130KB\n// Total: ~172KB minimum (10x larger!)",
      },
      {
        title: "Fine-Grained Updates",
        desc: "Signals update only the exact DOM nodes that changed. No component re-renders, no virtual DOM diffing — surgical precision.",
        code: "// ✅ Rikka: Updates single text node\nconst name = signal('Alice');\nspan({}, 'Hello ', name);\n// Only this text node updates on change\n\n// ❌ React: Re-renders entire component\n// Virtual DOM diff → patch → commit\n// Even for simple text changes",
      },
    ];

    const tags = [
      "Signals",
      "Computed",
      "Effects",
      "Custom Elements",
      "Shadow DOM",
      "Templates",
      "Fine-Grained Updates",
      "TypeScript",
      "Decorators",
      "Reactive Lists",
      "No VDOM",
      "Tree Shakable",
    ];

    return div(
      { class: "home" },
      section(
        { class: "hero" },
        div(
          { class: "hero-inner" },
          div(
            { class: "hero-badge" },
            span({ class: "badge-dot" }),
            "TC39 Signals",
            span({ style: { color: "var(--color-border)" } }, "·"),
            "Zero VDOM",
            span({ style: { color: "var(--color-border)" } }, "·"),
            "Zero Runtime",
          ),
          h1("Rikka"),
          div({ class: "tagline" }, "Native Reactivity for the Web"),
          p(
            { class: "hero-desc" },
            "Build Web Components with fine-grained signals. No virtual DOM, no framework overhead — just standards-based, LLM-friendly code that runs once and updates surgically.",
          ),
          div(
            { class: "cta" },
            a({ href: "#/docs", class: "btn-primary" }, "Get Started →"),
            a({ href: "#/examples", class: "btn-secondary" }, "View Examples"),
          ),
          div(
            { class: "stats-row" },
            span(
              { class: "stat-pill" },
              span({ class: "pill-dot purple" }),
              "~16KB ",
              span({ class: "pill-text" }, "All packages (gzip)"),
            ),
            span(
              { class: "stat-pill" },
              span({ class: "pill-dot green" }),
              "0 ",
              span({ class: "pill-text" }, "Virtual DOM overhead"),
            ),
            span(
              { class: "stat-pill" },
              span({ class: "pill-dot pink" }),
              "TC39 ",
              span({ class: "pill-text" }, "Standards based"),
            ),
            span(
              { class: "stat-pill" },
              span({ class: "pill-dot amber" }),
              "100% ",
              span({ class: "pill-text" }, "TypeScript"),
            ),
          ),
          heroDemo,
        ),
      ),
      section(
        { class: "section" },
        span({ class: "section-eyebrow" }, "Why Rikka"),
        h2({ class: "section-title" }, "Built for the modern web"),
        p(
          { class: "section-subtitle" },
          "Simple primitives, predictable mental model, and surgical updates — no framework tax.",
        ),
        div(
          { class: "feature-grid" },
          ...features.map((f) =>
            div(
              { class: "feature-card" },
              div({ class: "feature-icon" }, f.icon),
              h3(f.title),
              p(f.desc),
            ),
          ),
        ),
      ),
      section(
        { class: "demo-section" },
        div(
          { class: "demo-container" },
          span({ class: "section-eyebrow" }, "Try It Live"),
          h2({ class: "section-title" }, "Edit code. See results instantly."),
          p(
            { class: "section-subtitle" },
            "A real, working playground — no compilation, no build step. Just type and run.",
          ),
          sharedStyles.createPlayground(counterCode, "300", "Live Counter"),
        ),
      ),
      section(
        { class: "advantages-section" },
        span({ class: "section-eyebrow" }, "Comparison"),
        h2({ class: "section-title" }, "Why Choose Rikka Over React?"),
        p(
          { class: "section-subtitle" },
          "Same power, fewer rules, smaller bundles, and a much friendlier mental model.",
        ),
        div(
          { class: "advantages-grid" },
          ...advantages.map((a) =>
            div(
              { class: "advantage-card" },
              h3(a.title),
              p(a.desc),
              (() => {
                const el = document.createElement("pre");
                el.className = "code-snippet";
                el.innerHTML = highlightCode(a.code);
                return el;
              })(),
            ),
          ),
        ),
        div(
          { class: "comparison-section" },
          h3({ class: "comparison-title" }, "Framework Comparison"),
          div(
            { class: "comparison-table-wrapper" },
            (() => {
              const table = document.createElement("table");
              table.className = "comparison-table";
              const thead = table.createTHead();
              const headRow = thead.insertRow();
              for (const h of [
                "",
                "Rikka",
                "React",
                "Vue 3",
                "Svelte",
                "Solid",
                "Lit",
              ]) {
                const th = document.createElement("th");
                if (h === "Rikka") th.className = "rikka-col";
                th.textContent = h;
                headRow.appendChild(th);
              }
              const tbody = table.createTBody();
              const rows: [
                string,
                (string | { icon: string; cls: string })[],
              ][] = [
                [
                  "Runtime (gzip)",
                  ["~16KB", "~172KB", "~33KB", "~2KB*", "~7KB", "~5KB"],
                ],
                [
                  "Virtual DOM",
                  [
                    { icon: "✗", cls: "check" },
                    { icon: "✓", cls: "cross" },
                    { icon: "✓", cls: "cross" },
                    { icon: "✗", cls: "check" },
                    { icon: "✗", cls: "check" },
                    { icon: "✗", cls: "check" },
                  ],
                ],
                [
                  "Reactivity",
                  [
                    "Signals",
                    "Hooks",
                    "Proxy",
                    "Compiled",
                    "Signals",
                    "Properties",
                  ],
                ],
                [
                  "Build Step",
                  [
                    "Optional",
                    "Required",
                    "Required",
                    "Required",
                    "Required",
                    "Optional",
                  ],
                ],
                [
                  "Web Standards",
                  [
                    { icon: "✓", cls: "check" },
                    { icon: "✗", cls: "cross" },
                    { icon: "✗", cls: "cross" },
                    { icon: "✗", cls: "cross" },
                    { icon: "✗", cls: "cross" },
                    { icon: "✓", cls: "check" },
                  ],
                ],
                [
                  "Type Safe",
                  [
                    { icon: "✓", cls: "check" },
                    { icon: "✓", cls: "check" },
                    "Partial",
                    "Partial",
                    { icon: "✓", cls: "check" },
                    "Partial",
                  ],
                ],
              ];
              for (const [label, cells] of rows) {
                const tr = tbody.insertRow();
                const tdLabel = document.createElement("td");
                tdLabel.textContent = label;
                tr.appendChild(tdLabel);
                cells.forEach((cell, i) => {
                  const td = document.createElement("td");
                  if (i === 0) td.className = "rikka-col";
                  if (typeof cell === "string") {
                    td.textContent = cell;
                  } else {
                    td.textContent = cell.icon;
                    td.classList.add(cell.cls);
                  }
                  tr.appendChild(td);
                });
              }
              return table;
            })(),
          ),
          p(
            { class: "comparison-caption" },
            "*Svelte has a tiny runtime but requires a compiler at build time.",
          ),
        ),
      ),
      section(
        { class: "tags-section" },
        span({ class: "section-eyebrow" }, "All in one"),
        h2({ class: "section-title" }, "Everything You Need"),
        p(
          { class: "section-subtitle" },
          "A complete toolkit for building modern, reactive Web Components.",
        ),
        div(
          { class: "tags-cloud" },
          ...tags.map((t) => span({ class: "tag" }, t)),
        ),
      ),
      section(
        { class: "quick-start" },
        span({ class: "section-eyebrow" }, "Get started"),
        h2({ class: "section-title" }, "Three steps. Zero config."),
        p(
          { class: "section-subtitle" },
          "Install once, write your UI, and let signals handle the rest.",
        ),
        div(
          { class: "steps" },
          div(
            { class: "step" },
            div({ class: "step-number" }, "1"),
            div(
              { class: "step-content" },
              h4("Install"),
              p(
                "Choose your preferred method — npm, a ",
                code("<script>"),
                " tag, or ES module import:",
              ),
              (() => {
                const codes: Record<string, string> = {
                  npm: "npm install @rikka/elements @rikka/dom @rikka/signal",
                  iife: '<script src="https://yw662.github.io/rikka/cdn/rikka.js"><\/script>',
                  esm: `import { signal, div, button } from 'https://yw662.github.io/rikka/cdn/rikka.esm.js';`,
                };
                const prefixes: Record<string, string> = {
                  npm: "$ ",
                  iife: "HTML  ",
                  esm: "JS   ",
                };
                const labels: Record<string, string> = {
                  npm: "npm",
                  iife: "<script>",
                  esm: "ESM",
                };
                const tab = signal<keyof typeof codes>("npm");
                const currentCode = computed(() => codes[tab.get()]);
                const currentPrefix = computed(() => prefixes[tab.get()]);
                const keys = Object.keys(codes);
                return div(
                  {
                    class: "cdn-picker",
                    style: { marginTop: "0.75rem" },
                  },
                  // tab bar
                  div(
                    {
                      class: "cdn-tabs",
                      style: {
                        display: "flex",
                        gap: 0,
                        marginBottom: "-1px",
                        position: "relative",
                        zIndex: 1,
                      },
                    },
                    keys.map((key, i) => {
                      const isActiveColor = computed(() =>
                        tab.get() === key
                          ? "var(--color-primary)"
                          : "var(--color-text-muted)",
                      );
                      const isActiveBgColor = computed(() =>
                        tab.get() === key
                          ? "var(--color-card-bg)"
                          : "transparent",
                      );
                      return button(
                        {
                          class: "cdn-tab",
                          style: {
                            padding: "0.375rem 1rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            fontFamily: "var(--font-mono)",
                            color: isActiveColor,
                            background: isActiveBgColor,
                            border: "1px solid var(--color-code-block-border)",
                            borderRight:
                              i < keys.length - 1 ? "none" : undefined,
                            borderRadius:
                              i === 0
                                ? "0.5rem 0 0 0"
                                : i === keys.length - 1
                                  ? "0 0.5rem 0 0"
                                  : undefined,
                            cursor: "pointer",
                            transition: "all var(--transition-fast)",
                          },
                          onclick: () => tab.set(key),
                        },
                        labels[key],
                      );
                    }),
                  ),
                  // code block (reuse .install-cmd styles)
                  div(
                    { class: "install-cmd cdn-code-block" },
                    span({ class: "cmd-prefix" }, currentPrefix),
                    currentCode,
                    button(
                      {
                        class: "copy-btn",
                        onclick: () =>
                          navigator.clipboard.writeText(codes[tab.get()]),
                      },
                      "Copy",
                    ),
                  ),
                );
              })(),
            ),
          ),
          div(
            { class: "step" },
            div({ class: "step-number" }, "2"),
            div(
              { class: "step-content" },
              h4("Write"),
              p(
                "Use ",
                code("h()"),
                ", ",
                code("div()"),
                ", and signals to build your UI. ",
                code("defineElement"),
                " for reusable components (optional).",
              ),
            ),
          ),
          div(
            { class: "step" },
            div({ class: "step-number" }, "3"),
            div(
              { class: "step-content" },
              h4("Render"),
              p(
                "h() runs once — Signals handle all DOM updates automatically. No re-renders, no diffing.",
              ),
            ),
          ),
        ),
        sharedStyles.createPlayground(
          `import { signal, computed } from '@rikka/signal';
import { div, span, button } from '@rikka/dom';

const count = signal(0);
const text = computed(() => \`Count: \${count.get()}\`);

const app = div(
  { style: { display: 'inline-flex', alignItems: 'center', gap: '12px', fontFamily: 'system-ui' } },
  span({ style: { fontSize: '18px', color: '#e2e8f0' } }, text),
  button({
    onclick: () => count.set(count.get() + 1),
    style: { padding: '6px 14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }
  }, '+')
);

container.appendChild(app);`,
          "220",
          "Quick Example",
        ),
      ),
      section(
        { class: "packages-section" },
        span({ class: "section-eyebrow" }, "Packages"),
        h2(
          { class: "section-title" },
          "Three Packages, Infinite Possibilities",
        ),
        p(
          { class: "section-subtitle" },
          "Pick what you need. Each package is independently useful and tree-shakeable.",
        ),
        div(
          { class: "package-grid" },
          div(
            { class: "package-card" },
            h3("@rikka/elements"),
            p(
              "Define Custom Elements with Shadow DOM, attributes, events, and styles.",
            ),
            div({ class: "npm" }, "npm install @rikka/elements"),
          ),
          div(
            { class: "package-card" },
            h3("@rikka/dom"),
            p(
              "Type-safe h() and tag factories. For() for reactive lists. Signals as children for fine-grained updates.",
            ),
            div({ class: "npm" }, "npm install @rikka/dom"),
          ),
          div(
            { class: "package-card" },
            h3("@rikka/signal"),
            p(
              "TC39 Signals polyfill. signal(), computed(), and effect() for reactivity. Standards-based primitives.",
            ),
            div({ class: "npm" }, "npm install @rikka/signal"),
          ),
        ),
      ),
    );
  },
});

export { HomePage };
