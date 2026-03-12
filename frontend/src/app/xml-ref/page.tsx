'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function XmlRefPage() {
  const [hovered, setHovered] = useState<string | null>(null);

  const cardStyle = (id: string) => ({
    ...styles.card,
    ...(hovered === id ? styles.cardHover : {}),
  });

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>XML Ref</h2>
      <p style={styles.subtitle}>
        Extract references into hardcoded XML tags. Choose your target format below.
      </p>

      <div style={styles.grid}>
        <Link
          href="/xml-ref/head-tail"
          style={cardStyle('head-tail')}
          onMouseEnter={() => setHovered('head-tail')}
          onMouseLeave={() => setHovered(null)}
        >
          <h3>Head and Tail</h3>
          <p>Extract document header and footer references.</p>
        </Link>

        <Link
          href="/xml-ref/docbook"
          style={cardStyle('docbook')}
          onMouseEnter={() => setHovered('docbook')}
          onMouseLeave={() => setHovered(null)}
        >
          <h3>DocBook</h3>
          <p>Standard XML format for technical documentation.</p>
        </Link>

        <Link
          href="/xml-ref/jats"
          style={cardStyle('jats')}
          onMouseEnter={() => setHovered('jats')}
          onMouseLeave={() => setHovered(null)}
        >
          <h3>JATS</h3>
          <p>Journal Article Tag Suite format.</p>
        </Link>

        <Link
          href="/xml-ref/bits"
          style={cardStyle('bits')}
          onMouseEnter={() => setHovered('bits')}
          onMouseLeave={() => setHovered(null)}
        >
          <h3>BITS</h3>
          <p>Book Interchange Tag Suite format.</p>
        </Link>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles: any = {
  page: {
    maxWidth: '1000px',
    margin: '40px auto',
    padding: '40px',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  },

  title: {
    fontSize: '28px',
    marginBottom: '8px',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: '15px',
    color: '#475569',
    marginBottom: '40px',
    textAlign: 'center',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '22px',
  },

  card: {
    padding: '26px',
    borderRadius: '16px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    textDecoration: 'none',
    color: '#020617',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
  },

  cardHover: {
    transform: 'translateY(-8px)',
    background: '#ecfeff',
    border: '1px solid #38bdf8',
    boxShadow: '0 16px 40px rgba(56, 189, 248, 0.45)',
  },
};
