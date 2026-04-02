import { useState, useMemo, useEffect, useRef } from 'react';
import { Check, X, ListTree, Wrench } from 'lucide-react';
import { COMPANIES, GOLDEN, CLSDATA } from './filterData';
import TAX_DATA_JSON from '../../../static data/output.json';

const TAX_DATA: any[] = TAX_DATA_JSON;

const SCR_COUNTRIES = [
  'United States', 'United Kingdom', 'China', 'Japan', 'India', 'Germany', 'France', 'Canada', 'Australia', 'South Korea', 
  'Switzerland', 'Netherlands', 'Sweden', 'Singapore', 'Hong Kong', 'Italy', 'Spain', 'Brazil', 'Russia', 'Saudi Arabia', 
  'United Arab Emirates', 'South Africa', 'Mexico', 'Indonesia', 'Thailand', 'Malaysia', 'Taiwan', 'Israel', 'Denmark', 
  'Norway', 'Finland', 'Belgium', 'Austria', 'New Zealand', 'Poland', 'Turkey', 'Argentina', 'Afghanistan', 'Albania', 
  'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Armenia', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 
  'Barbados', 'Belarus', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brunei', 'Bulgaria', 
  'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Central African Republic', 'Chad', 'Chile', 'Colombia', 
  'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Djibouti', 'Dominica', 'Dominican Republic', 
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Gabon', 
  'Gambia', 'Georgia', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 
  'Hungary', 'Iceland', 'Iran', 'Iraq', 'Ireland', 'Jamaica', 'Jersey', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 
  'Madagascar', 'Malawi', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Micronesia', 'Moldova', 
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Nicaragua', 'Niger', 
  'Nigeria', 'North Korea', 'North Macedonia', 'Oman', 'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 
  'Philippines', 'Portugal', 'Qatar', 'Romania', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 
  'Samoa', 'San Marino', 'Sao Tome and Principe', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Slovakia', 'Slovenia', 
  'Solomon Islands', 'Somalia', 'South Sudan', 'Sri Lanka', 'Sudan', 'Suriname', 'Syria', 'Tajikistan', 'Tanzania', 'Timor-Leste', 
  'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'Uruguay', 'Uzbekistan', 
  'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

const Checkbox = ({ checked, indeterminate, onChange, ...props }: any) => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return <input type="checkbox" ref={ref} checked={checked} onChange={onChange} {...props} />;
};

const Screener = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [taxSearch, setTaxSearch] = useState<string>('');
  const [coSearch, setCoSearch] = useState<string>('');
  
  const [selL0, setSelL0] = useState<Set<string>>(new Set());
  const [selL1, setSelL1] = useState<Set<string>>(new Set());
  const [selL2, setSelL2] = useState<Set<string>>(new Set());
  const [taxExpanded, setTaxExpanded] = useState({ l0: new Set<string>(), l1: new Set<string>() });
  
  const [selCountry, setSelCountry] = useState<Set<string>>(new Set());
  const [mcapMin, setMcapMin] = useState<number | ''>('');
  const [mcapMax, setMcapMax] = useState<number | ''>('');
  const [selCls, setSelCls] = useState<Set<string>>(new Set());
  const [minPct, setMinPct] = useState<number | ''>('');

  // Compute Taxonomy Map from nested TAX_DATA and supplement with actual data
  const taxMap = useMemo(() => {
    const map: any = {};
    
    // 1. Initialize from nested JSON (Taxonomy)
    TAX_DATA.forEach((l0: any) => {
      const l0c = String(l0.l0_code);
      if (!map[l0c]) map[l0c] = { n: l0.l0_name, l1s: {} };
      l0.l1_data?.forEach((l1: any) => {
        const l1c = String(l1.l1_code);
        if (!map[l0c].l1s[l1c]) map[l0c].l1s[l1c] = { n: l1.l1_name, l2s: new Set() };
        l1.l2_data?.forEach((l2: any) => {
          map[l0c].l1s[l1c].l2s.add(JSON.stringify({ c: String(l2.l2_code), n: l2.l2_name }));
        });
      });
    });

    // 2. Add from GOLDEN, mapping each segment theme to its NATIVE parent sector
    GOLDEN.filter(g => !g.invalidated).forEach(g => {
      const cls = CLSDATA[g.coId]?.[selectedYear];
      if (!cls) return;

      cls.segments.forEach((s: any) => {
        const l1c = String(s.l1);
        // Derive L0 from the first 2 digits of the theme code (e.g., 25 from 2501)
        const l0c = l1c.length >= 2 ? l1c.substring(0, 2) : String(cls.l0);
        
        if (!map[l0c]) map[l0c] = { n: s.l0n || g.l0Name || l0c, l1s: {} };
        if (!map[l0c].l1s[l1c]) map[l0c].l1s[l1c] = { n: s.l1n || l1c, l2s: new Set() };
        
        const l2c = String(s.l2);
        map[l0c].l1s[l1c].l2s.add(JSON.stringify({ c: l2c, n: s.l2n || l2c }));
      });
    });
    return map;
  }, [selectedYear]);


  const handleTaxL0 = (l0c: string, checked: boolean) => {
    setSelL0(prev => {
      const n = new Set(prev);
      if (checked) n.add(l0c); else n.delete(l0c);
      return n;
    });
    setSelL1(prev => {
      const next = new Set(prev);
      if (taxMap[l0c]) {
        Object.keys(taxMap[l0c].l1s).forEach(l1c => {
          if (checked) next.add(l1c); else next.delete(l1c);
        });
      }
      return next;
    });
    setSelL2(prev => {
      const next = new Set(prev);
      if (taxMap[l0c]) {
        Object.values(taxMap[l0c].l1s).forEach((l1d: any) => {
          [...l1d.l2s].map((j: string) => JSON.parse(j).c).forEach(l2c => {
            if (checked) next.add(l2c); else next.delete(l2c);
          });
        });
      }
      return next;
    });
  };

  const handleTaxL1 = (l1c: string, l0c: string, checked: boolean) => {
    setSelL1(prev => { const n = new Set(prev); if (checked) n.add(l1c); else n.delete(l1c); return n; });
    setSelL2(prev => {
      const n = new Set(prev);
      if (taxMap[l0c]?.l1s[l1c]) {
        [...taxMap[l0c].l1s[l1c].l2s].map((j: string) => JSON.parse(j).c).forEach(l2c => {
          if (checked) n.add(l2c); else n.delete(l2c);
        });
      }
      return n;
    });
    setSelL0(prev => {
      const n = new Set(prev);
      if (!checked) n.delete(l0c);
      else if (taxMap[l0c] && Object.keys(taxMap[l0c].l1s).every(l1 => l1 === l1c || selL1.has(l1))) n.add(l0c);
      return n;
    });
  };

  const handleTaxL2 = (l2c: string, l1c: string, l0c: string, checked: boolean) => {
    setSelL2(prev => { const n = new Set(prev); if (checked) n.add(l2c); else n.delete(l2c); return n; });
    setSelL1(prev => {
      const n = new Set(prev);
      if (!checked) n.delete(l1c);
      else if (taxMap[l0c]?.l1s[l1c]) {
        const allL2 = [...taxMap[l0c].l1s[l1c].l2s].map((j: string) => JSON.parse(j).c);
        if (allL2.every(c => c === l2c || selL2.has(c))) n.add(l1c);
      }
      return n;
    });
    setSelL0(prev => {
      const n = new Set(prev);
      if (!checked) n.delete(l0c);
      else if (taxMap[l0c] && Object.keys(taxMap[l0c].l1s).every(l1 => l1 === l1c || selL1.has(l1))) n.add(l0c);
      return n;
    });
  };

  const toggleTaxNode = (level: 'l0' | 'l1', key: string) => {
    setTaxExpanded(prev => {
      const n = new Set(prev[level]);
      if (n.has(key)) n.delete(key); else n.add(key);
      return { ...prev, [level]: n };
    });
  };

  const removeChipL1 = (l1c: string) => {
    for (const l0c of Object.keys(taxMap)) {
      if (taxMap[l0c].l1s[l1c]) { handleTaxL1(l1c, l0c, false); return; }
    }
  };

  const removeChipL2 = (l2c: string) => {
    for (const l0c of Object.keys(taxMap)) {
      for (const l1c of Object.keys(taxMap[l0c].l1s)) {
        const l2s = [...taxMap[l0c].l1s[l1c].l2s].map((j: string) => JSON.parse(j).c);
        if (l2s.includes(l2c)) { handleTaxL2(l2c, l1c, l0c, false); return; }
      }
    }
  };

  const resetAll = () => {
    setSelL0(new Set()); setSelL1(new Set()); setSelL2(new Set());
    setSelCountry(new Set()); setSelCls(new Set());
    setTaxExpanded({ l0: new Set(), l1: new Set() });
    setSelectedYear(2025); setMinPct(''); setTaxSearch(''); setCoSearch('');
    setMcapMin(''); setMcapMax('');
  };

  const CountryList = useMemo(() => {
    const q = coSearch.toLowerCase();
    const inData = new Set(GOLDEN.filter(g => !g.invalidated).map(g => {
      const co = COMPANIES.find(c => c.id === g.coId);
      return co ? co.country : '';
    }).filter(Boolean));
    const all = [...SCR_COUNTRIES];
    inData.forEach(c => { if (!all.includes(c)) all.push(c); });
    return all.filter(c => !q || c.toLowerCase().includes(q)).map(c => {
      const hasData = inData.has(c);
      const isSel = selCountry.has(c);
      return (
        <div key={c} className={`scr-opt ${isSel ? 'on' : ''}`} onClick={() => setSelCountry(p => { const n = new Set(p); if(n.has(c)) n.delete(c); else n.add(c); return n; })} style={{ opacity: !hasData ? 0.45 : 1 }}>
          <span className="scr-ck">{isSel ? <Check size={12} strokeWidth={3} /> : ''}</span>
          {c}
          {!hasData && <span style={{ fontSize: '8px', color: 'var(--txt4)', marginLeft: '2px' }}>—</span>}
        </div>
      );
    });
  }, [coSearch, selCountry]);

  const l0Keys = Object.keys(taxMap).sort((a, b) => taxMap[a].n.localeCompare(taxMap[b].n));

  return (
    <div className="scr-wrap">
      {/* Sidebar Panel */}
      <div className="scr-fp">
        <div className="scr-fhd">
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--txt3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Wrench size={12} /> FILTERS
          </span>
          <button onClick={resetAll} style={{ fontSize: '11px', color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>Reset All</button>
        </div>
        
        <div>
          <label className="scr-flbl">Year</label>
          <select className="scr-sel" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value, 10))}>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>

        <div>
          <label className="scr-flbl">Sector / Theme / Sub-Theme</label>
          <input type="text" className="scr-finp" placeholder="Search sectors, themes, sub-themes..." value={taxSearch} onChange={e => setTaxSearch(e.target.value)} style={{ marginBottom: '4px' }} />
          <div className="scr-ms" style={{ maxHeight: '260px', padding: 0 }}>
            {l0Keys.map(l0c => {
              const l0d = taxMap[l0c];
              const l1Keys = Object.keys(l0d.l1s).sort((a, b) => l0d.l1s[a].n.localeCompare(l0d.l1s[b].n));
              const l0Match = !taxSearch || l0d.n.toLowerCase().includes(taxSearch.toLowerCase());
              const visL1 = l1Keys.filter(l1c => {
                if (!taxSearch || l0Match) return true;
                if (l0d.l1s[l1c].n.toLowerCase().includes(taxSearch.toLowerCase())) return true;
                return [...l0d.l1s[l1c].l2s].some((j: string) => JSON.parse(j).n.toLowerCase().includes(taxSearch.toLowerCase()));
              });
              if (taxSearch && !l0Match && visL1.length === 0) return null;

              const allL2inL0 = l1Keys.flatMap(l1c => [...l0d.l1s[l1c].l2s].map((j: string) => JSON.parse(j).c));
              const l0All = l1Keys.every(l1c => selL1.has(l1c)) && allL2inL0.every(l2c => selL2.has(l2c));
              const l0Some = !l0All && (selL0.has(l0c) || l1Keys.some(l1c => selL1.has(l1c)) || allL2inL0.some(l2c => selL2.has(l2c)));
              const l0Open = taxSearch ? true : taxExpanded.l0.has(l0c);

              return (
                <div className="tax-tree-node" key={l0c}>
                  <div className="tax-tree-row tax-l0-row" onClick={() => toggleTaxNode('l0', l0c)}>
                    <span className={`tax-tree-toggle ${l0Open ? 'open' : ''}`}>►</span>
                    <Checkbox className="tax-tree-cb" checked={l0All} indeterminate={l0Some} onChange={(e: any) => handleTaxL0(l0c, e.target.checked)} onClick={(e: any) => e.stopPropagation()} />
                    <span className="tax-tree-label l0-label">{l0d.n} <span style={{ fontSize: '9px', color: 'var(--txt3)', fontFamily: 'var(--mono)', marginLeft: '4px', opacity: 0.7 }}>{l0c}</span></span>
                    <span className="tax-tree-count">{l1Keys.length}</span>
                  </div>
                  <div className={`tax-tree-children ${l0Open ? 'open' : ''}`}>
                    {visL1.map(l1c => {
                      const l1d = l0d.l1s[l1c];
                      const l2Arr = [...l1d.l2s].map((j: string) => JSON.parse(j)).sort((a: any, b: any) => a.n.localeCompare(b.n));
                      const l1Match = !taxSearch || l0Match || l1d.n.toLowerCase().includes(taxSearch.toLowerCase());
                      const visL2 = l2Arr.filter((l2: any) => (!taxSearch || l0Match || l1Match) ? true : l2.n.toLowerCase().includes(taxSearch.toLowerCase()));
                      const l1All = selL1.has(l1c) || (l2Arr.length > 0 && l2Arr.every((l2: any) => selL2.has(l2.c)));
                      const l1Some = !l1All && l2Arr.some((l2: any) => selL2.has(l2.c));
                      const l1Open = taxSearch ? true : taxExpanded.l1.has(l1c);

                      return (
                        <div className="tax-tree-node" key={l1c}>
                          <div className="tax-tree-row tax-l1-row" onClick={() => toggleTaxNode('l1', l1c)}>
                            <span className={`tax-tree-toggle ${l2Arr.length===0 ? 'leaf' : ''} ${l1Open ? 'open' : ''}`}>{l2Arr.length > 0 ? '►' : <span style={{width: 12}}></span>}</span>
                            <Checkbox className="tax-tree-cb" checked={l1All} indeterminate={l1Some} onChange={(e: any) => handleTaxL1(l1c, l0c, e.target.checked)} onClick={(e: any) => e.stopPropagation()} />
                            <span className="tax-tree-label l1-label">{l1d.n} <span style={{ fontSize: '9px', color: 'var(--txt3)', fontFamily: 'var(--mono)', marginLeft: '4px', opacity: 0.7 }}>{l1c}</span></span>
                            <span className="tax-tree-count">{l2Arr.length}</span>
                          </div>
                          <div className={`tax-tree-children ${l1Open ? 'open' : ''}`}>
                            {visL2.map((l2: any) => (
                              <div className="tax-tree-row tax-l2-row" key={l2.c}>
                                <span className="tax-tree-toggle leaf" style={{width: 12}}></span>
                                <Checkbox className="tax-tree-cb" checked={selL2.has(l2.c)} onChange={(e: any) => handleTaxL2(l2.c, l1c, l0c, e.target.checked)} onClick={(e: any) => e.stopPropagation()} />
                                <span className="tax-tree-label l2-label">{l2.n} <span style={{ fontSize: '9px', color: 'var(--txt3)', fontFamily: 'var(--mono)', marginLeft: '4px', opacity: 0.7 }}>{l2.c}</span></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="scr-flbl">Country</label>
          <input type="text" className="scr-finp" placeholder="Search countries..." value={coSearch} onChange={e => setCoSearch(e.target.value)} />
          <div className="scr-ms" style={{ marginTop: '4px', maxHeight: '140px' }}>{CountryList}</div>
        </div>

        <div>
           <label className="scr-flbl">MCap (Bn USD)</label>
           <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
             <input type="number" className="scr-finp" placeholder="Min" min="0" value={mcapMin} onChange={e => setMcapMin(e.target.value ? parseFloat(e.target.value) : '')} style={{ width: '50%', flex: 1 }} />
             <span style={{ color: 'var(--txt3)', fontSize: '12px' }}>&mdash;</span>
             <input type="number" className="scr-finp" placeholder="Max" min="0" value={mcapMax} onChange={e => setMcapMax(e.target.value ? parseFloat(e.target.value) : '')} style={{ width: '50%', flex: 1 }} />
           </div>
        </div>

        <div>
          <label className="scr-flbl">Revenue Class</label>
          <div className="scr-ms">
            {['Pure Play', 'Quasi', 'Marginal'].map(c => (
              <div key={c} className={`scr-opt ${selCls.has(c) ? 'on' : ''}`} onClick={() => setSelCls(p => { const n = new Set(p); if (n.has(c)) n.delete(c); else n.add(c); return n; })}>
                <span className="scr-ck">{selCls.has(c) ? <Check size={12} strokeWidth={3} /> : ''}</span>{c}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="scr-flbl">Min Revenue %</label>
          <input type="number" className="scr-finp" placeholder="0" min="0" max="100" value={minPct} onChange={e => setMinPct(e.target.value ? parseFloat(e.target.value) : '')} style={{ width: '100%' }} />
        </div>
      </div>

      {/* Main Panel */}
      <div className="scr-rp">
        <div className="scr-rhd">
          <div style={{ fontSize: '13px', color: 'var(--txt2)' }}>Golden Copy Screening</div>
        </div>

        {/* Filter Chips Layer */}
        {(selL0.size > 0 || selL1.size > 0 || selL2.size > 0 || selCountry.size > 0 || selCls.size > 0) && (
          <div className="scr-chips">
            {[...selL0].map(c => <span className="scr-chip" key={`0-${c}`}>{taxMap[c]?.n || c} <span className="scr-chip-x" onClick={() => handleTaxL0(c, false)}><X size={10} strokeWidth={3} /></span></span>)}
            {[...selL1].map(c => { 
                let n = c;
                for(const l0 of Object.values(taxMap) as any[]) { if(l0.l1s[c]) { n = l0.l1s[c].n; break; } }
                return <span className="scr-chip" key={`1-${c}`}>{n} <span className="scr-chip-x" onClick={() => removeChipL1(c)}><X size={10} strokeWidth={3} /></span></span>; 
            })}
            {[...selL2].map(c => { 
                let n = c;
                for(const l0 of Object.values(taxMap) as any[]) { 
                    for(const l1 of Object.values(l0.l1s) as any[]) {
                        const l2d = [...l1.l2s].map(j => JSON.parse(j));
                        const l2m = l2d.find((x:any) => x.c === c);
                        if(l2m) { n = l2m.n; break; }
                    }
                }
                return <span className="scr-chip" key={`2-${c}`}>{n} <span className="scr-chip-x" onClick={() => removeChipL2(c)}><X size={10} strokeWidth={3} /></span></span>; 
            })}
            {[...selCountry].map(c => <span className="scr-chip" key={`c-${c}`}>{c} <span className="scr-chip-x" onClick={() => setSelCountry(p => { const n = new Set(p); n.delete(c); return n; })}><X size={10} strokeWidth={3} /></span></span>)}
            {[...selCls].map(c => <span className="scr-chip" key={`cls-${c}`}>{c} <span className="scr-chip-x" onClick={() => setSelCls(p => { const n = new Set(p); n.delete(c); return n; })}><X size={10} strokeWidth={3} /></span></span>)}
          </div>
        )}

        <div className="scr-empty-state" style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: 'var(--txt3)', 
          background: 'var(--bg2)', borderRadius: '12px', border: '1px dashed var(--brdr)', marginTop: '24px' 
        }}>
          <ListTree size={48} strokeWidth={1} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--txt2)' }}>Data Integration in Progress</div>
          <p style={{ fontSize: '13px', textAlign: 'center', maxWidth: '300px', marginTop: '8px' }}>
            The screening results table is being connected to the new ITICS taxonomy API. Use the filters on the left to explore the taxonomy structure.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Screener;