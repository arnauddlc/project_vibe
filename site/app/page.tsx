'use client';

import styles from './page.module.css';
import { useEffect, useState } from 'react';
import SfMusic from '../components/SfMusic';
import ChatWidget from '../components/ChatWidget';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.subtitle}>Data & AI Strategy Leader</div>
        <h1 className={`${styles.title} glitch`} data-text="Arnaud de La Chaise">
          Arnaud de La Chaise
        </h1>
        <p className={styles.description}>
          Creative, pragmatic, and result-oriented. I lead inclusive and innovative teams towards a common vision, believing in sharing the complex through <b className="text-gradient">simple, elegant stories</b>. Bridging the gap between corporate strategy and cutting-edge Data & AI governance.
        </p>
        <div className={styles.ctaGrid}>
          <a href="#career" className={styles.primaryBtn}>
            Explore Journey
          </a>
          <a href="#portfolio" className={styles.secondaryBtn}>
            View Portfolio
          </a>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section container" style={{ padding: '4rem 0' }}>
        <h2 className={styles.sectionTitle}>
          <span>01</span> About Me
        </h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>✦</div>
            <h3 className={styles.cardTitle}>Visionary Leadership</h3>
            <p className={styles.cardDesc}>
              Evolving AI and D&A capabilities to unlock value. I specialize in aligning enterprise objectives with robust, innovative data strategies that empower teams and stakeholders.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>◆</div>
            <h3 className={styles.cardTitle}>Pragmatic Innovation</h3>
            <p className={styles.cardDesc}>
              Bridging the gap between conceptual strategy and tangible delivery. Finding the right tools, models, and governance to bring advanced analytics roadmaps to reality.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>❖</div>
            <h3 className={styles.cardTitle}>Global Expertise</h3>
            <p className={styles.cardDesc}>
              A background spanning Paris to Sydney, London to Havana. Diverse experience in FMCG, Public Sector, Airlines, and Top-tier Consulting, enabling culturally inclusive leadership.
            </p>
          </div>
        </div>
      </section>

      {/* Career Journey */}
      <section id="career" className="section container">
        <h2 className={styles.sectionTitle}>
          <span>02</span> Career Journey
        </h2>
        <div className={styles.timeline}>

          <div className={styles.timelineItem}>
            <div className={styles.timelineDot}></div>
            <div className={styles.timelineDate}>Jun 2024 - Present</div>
            <div className={styles.timelineContent}>
              <h3 className={styles.timelineRole}>Customer Data Strategy & Governance Leader</h3>
              <div className={styles.timelineCompany}>Qantas Loyalty | Sydney, Australia</div>
              <p className={styles.timelineDesc}>
                Evolving Data & Analytics and AI capabilities to unlock massive value for 15+ million members and partners globally. Directing the strategy that fuels one of the world's leading airline loyalty programs.
              </p>
            </div>
          </div>

          <div className={styles.timelineItem}>
            <div className={styles.timelineDot}></div>
            <div className={styles.timelineDate}>Dec 2022 - Mar 2024</div>
            <div className={styles.timelineContent}>
              <h3 className={styles.timelineRole}>Engagement Manager, Data Strategy</h3>
              <div className={styles.timelineCompany}>Transport for NSW | Sydney, Australia</div>
              <p className={styles.timelineDesc}>
                Designed the framework to build Divisional Data Strategies & Advanced Analytics Roadmaps. Facilitated workshops to articulate and collectively build data roadmaps that delivered clear business benefits.
              </p>
            </div>
          </div>

          <div className={styles.timelineItem}>
            <div className={styles.timelineDot}></div>
            <div className={styles.timelineDate}>Apr 2020 - Dec 2022</div>
            <div className={styles.timelineContent}>
              <h3 className={styles.timelineRole}>Strategy Manager</h3>
              <div className={styles.timelineCompany}>Woolworths Group (wiq) | Sydney, Australia</div>
              <p className={styles.timelineDesc}>
                Transformed the $6bn promotions business using advanced analytics. Led engagements with business areas to identify D&A opportunities, driving material financial benefits alongside a joint BCG and Quantium team.
              </p>
            </div>
          </div>

          <div className={styles.timelineItem}>
            <div className={styles.timelineDot}></div>
            <div className={styles.timelineDate}>May 2018 - Jan 2020</div>
            <div className={styles.timelineContent}>
              <h3 className={styles.timelineRole}>Senior Consultant | Client Lead</h3>
              <div className={styles.timelineCompany}>Quantium | Sydney, Australia</div>
              <p className={styles.timelineDesc}>
                Worked deeply with major FMCG suppliers and Woolworths Supermarkets to redesign process communications and drive highly impactful analytics models.
              </p>
            </div>
          </div>

          <div className={styles.timelineItem}>
            <div className={styles.timelineDot}></div>
            <div className={styles.timelineDate}>2012 - 2017</div>
            <div className={styles.timelineContent}>
              <h3 className={styles.timelineRole}>Consultant & Financial Modeller</h3>
              <div className={styles.timelineCompany}>Pernod Ricard / Schlumberger / Vinci</div>
              <p className={styles.timelineDesc}>
                Extensive international experience across Cuba, France, Argentina, and the UK. Ran industrial controlling, M&A strategy, and advanced financial modeling.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="section container" style={{ padding: '4rem 0' }}>
         <h2 className={styles.sectionTitle}>
          <span>03</span> Featured Portfolio
        </h2>
        <div className={styles.grid}>
          <div className={styles.card} style={{ border: '1px dashed var(--border-color)'}}>
            <h3 className={styles.cardTitle}>Project Alpha (Coming Soon)</h3>
            <p className={styles.cardDesc}>
              A comprehensive case study detailing the deployment of AI governance frameworks at scale. Stay tuned for insights on model monitoring and ethical AI deployment.
            </p>
          </div>
          <div className={styles.card} style={{ border: '1px dashed var(--border-color)'}}>
            <h3 className={styles.cardTitle}>Data Architecture Redux (Coming Soon)</h3>
            <p className={styles.cardDesc}>
              Exploring the evolution of modern data stacks from traditional monolithic warehouses to decentralized data mesh architectures.
            </p>
          </div>
        </div>
      </section>

      {/* Just For Fun Section */}
      <section id="fun" className="section container" style={{ padding: '4rem 0' }}>
        <h2 className={styles.sectionTitle}>
          <span>04</span> Just For Fun
        </h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>🍷</div>
            <h3 className={styles.cardTitle}>Oenophile & WSET 3</h3>
            <p className={styles.cardDesc}>
              My appreciation for wine goes beyond the glass. I study the terroirs, the vintages, and the scientific art of winemaking with the passion of a sommelier. Ask my Digital Twin about it!
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>✈️</div>
            <h3 className={styles.cardTitle}>Global Nomad</h3>
            <p className={styles.cardDesc}>
              Having lived and worked in Paris, London, Havana, Bali, and Sydney, my diverse cultural footprint shapes my unique perspective on global strategy.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>⛷️</div>
            <h3 className={styles.cardTitle}>Alpine Skier</h3>
            <p className={styles.cardDesc}>
              There's nothing quite like the rush of carving down a steep slope. I tackle black runs with the same calculated risk as my business ventures.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>🛟</div>
            <h3 className={styles.cardTitle}>Surf Life Saving</h3>
            <p className={styles.cardDesc}>
              Embracing the Australian coastal lifestyle, I dedicate time to keeping Sydney's beaches safe—proving that high performance extends beyond the boardroom.
            </p>
          </div>
        </div>
      </section>

      <SfMusic />
      <ChatWidget />

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Arnaud de La Chaise. All rights reserved.</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
          Built with <span style={{ color: "var(--accent)" }}>Next.js</span> & <span style={{ color: "var(--accent-edgy)" }}>Passion</span>
        </p>
      </footer>
    </main>
  );
}
