import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Check, X, Wrench, LogOut } from 'lucide-react';
import TAX_DATA_JSON from './../../static data/output.json';
import { BaseUrl } from '../../assets/entpoint';
import { postMethodApi, getMethodApi } from '../../utils/commonAxios';
import { clientSideLogout } from '../../utils/session';

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
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [taxSearch, setTaxSearch] = useState<string>('');
  const [coSearch, setCoSearch] = useState<string>('');
  
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRowData, setExpandedRowData] = useState<Record<number, any[]>>({});
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const [selL0, setSelL0] = useState<Set<string>>(new Set());
  const [selL1, setSelL1] = useState<Set<string>>(new Set());
  const [selL2, setSelL2] = useState<Set<string>>(new Set());
  const [taxExpanded, setTaxExpanded] = useState({ l0: new Set<string>(), l1: new Set<string>() });
  
  const [selCountry, setSelCountry] = useState<Set<string>>(new Set());
  const [selCls, setSelCls] = useState<Set<string>>(new Set());

  // Compute Taxonomy Map from nested TAX_DATA
  const taxMap = useMemo(() => {
    const map: any = {};
    TAX_DATA.forEach((l0: any) => {
      const l0c = String(l0.l0_code);
      if (!map[l0c]) map[l0c] = { n: l0.l0_name, l1s: {} };
      l0.l1_data?.forEach((l1: any) => {
        const l1c = String(l1.l1_code);
        if (!map[l0c].l1s[l1c]) map[l0c].l1s[l1c] = { n: l1.l1_name, l2s: new Map() };
        l1.l2_data?.forEach((l2: any) => {
          map[l0c].l1s[l1c].l2s.set(String(l2.l2_code), l2.l2_name);
        });
      });
    });
    return map;
  }, []);

  const handleTaxL0 = (l0c: string, checked: boolean) => {
    const newL0 = new Set(selL0);
    const newL1 = new Set(selL1);
    const newL2 = new Set(selL2);
    
    if (checked) newL0.add(l0c); else newL0.delete(l0c);
    
    const d0 = taxMap[l0c];
    if (d0) {
      Object.keys(d0.l1s).forEach(l1c => {
        if (checked) newL1.add(l1c); else newL1.delete(l1c);
        d0.l1s[l1c].l2s.forEach((_name: any, l2c: string) => {
          if (checked) newL2.add(l2c); else newL2.delete(l2c);
        });
      });
    }
    
    setSelL0(newL0); setSelL1(newL1); setSelL2(newL2);
  };

  const handleTaxL1 = (l1c: string, l0c: string, checked: boolean) => {
    const newL0 = new Set(selL0);
    const newL1 = new Set(selL1);
    const newL2 = new Set(selL2);

    if (checked) newL1.add(l1c); else newL1.delete(l1c);
    
    const d1 = taxMap[l0c]?.l1s[l1c];
    if (d1) {
      d1.l2s.forEach((_name: any, l2c: string) => {
        if (checked) newL2.add(l2c); else newL2.delete(l2c);
      });
    }

    // Update parent
    if (!checked) newL0.delete(l0c);
    else if (taxMap[l0c] && Object.keys(taxMap[l0c].l1s).every(l => newL1.has(l))) newL0.add(l0c);

    setSelL0(newL0); setSelL1(newL1); setSelL2(newL2);
  };

  const handleTaxL2 = (l2c: string, l1c: string, l0c: string, checked: boolean) => {
    const newL0 = new Set(selL0);
    const newL1 = new Set(selL1);
    const newL2 = new Set(selL2);

    if (checked) newL2.add(l2c); else newL2.delete(l2c);

    // Update theme
    if (!checked) newL1.delete(l1c);
    else if (taxMap[l0c]?.l1s[l1c] && [...taxMap[l0c].l1s[l1c].l2s.keys()].every(l => newL2.has(l))) newL1.add(l1c);

    // Update sector
    if (!checked) newL0.delete(l0c);
    else if (taxMap[l0c] && Object.keys(taxMap[l0c].l1s).every(l => newL1.has(l))) newL0.add(l0c);

    setSelL0(newL0); setSelL1(newL1); setSelL2(newL2);
  };

  const fetchMainTable = async () => {
    setLoading(true);
    try {
      const payload = {
        year: String(selectedYear),
        level1_code: [...selL1],
        level2_code: [...selL2],
        country: [...selCountry],
        revenue_class: [...selCls].map(c => c.toLowerCase().replace(' ', '_'))
      };
      const res = await postMethodApi(`${BaseUrl}/api/v1/company-top-themes/`, payload);
      const data = res.data;
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInternalTable = async (coId: number) => {
    try {
      const res = await getMethodApi(`${BaseUrl}/api/classifications/`, { company_id: coId, year: selectedYear });
      const data = res.data;
      setExpandedRowData(prev => ({ ...prev, [coId]: Array.isArray(data) ? data : [] }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchMainTable(); }, [selectedYear, selL1, selL2, selCountry, selCls]);

  const resetAll = () => {
    setSelL0(new Set()); setSelL1(new Set()); setSelL2(new Set());
    setSelCountry(new Set()); setSelCls(new Set());
  };

  const handleRowClick = (coId: number) => {
    setExpandedRows(prev => {
      const n = new Set(prev);
      if (n.has(coId)) n.delete(coId); else { n.add(coId); fetchInternalTable(coId); }
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
    for (const l0c of Object.keys(taxMap)) if (taxMap[l0c].l1s[l1c]) { handleTaxL1(l1c, l0c, false); return; }
  };

  const CountryList = useMemo(() => {
    const q = coSearch.toLowerCase();
    return SCR_COUNTRIES.filter(c => !q || c.toLowerCase().includes(q)).map(c => {
      const isSel = selCountry.has(c);
      return (
        <div key={c} className={`scr-opt ${isSel ? 'on' : ''}`} onClick={() => setSelCountry(p => { const n = new Set(p); if (n.has(c)) n.delete(c); else n.add(c); return n; })}>
          <span className="scr-ck">{isSel ? <Check size={12} strokeWidth={3} /> : ''}</span>{c}
        </div>
      );
    });
  }, [coSearch, selCountry]);

  const l0Keys = Object.keys(taxMap).sort((a,b) => taxMap[a].n.localeCompare(taxMap[b].n));

  return (
    <div className="scr-wrap">
      <div className="scr-fp">
        <div className="scr-fhd">
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--txt3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Wrench size={12} /> FILTERS
          </span>
          <button onClick={resetAll} style={{ fontSize: '11px', color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer' }}>Reset All</button>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label className="scr-flbl">Year</label>
          <select className="scr-sel" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
            {[2025, 2024, 2023, 2022, 2021, 2020].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label className="scr-flbl">Sector / Theme / Sub-Theme</label>
          <div className="scr-inp-wrap">
            <input type="text" className="scr-finp" placeholder="Search..." value={taxSearch} onChange={e => setTaxSearch(e.target.value)} />
          </div>
          <div className="scr-ms" style={{ maxHeight: '260px', marginTop: '8px' }}>
            {l0Keys.map(l0c => {
              const l0d = taxMap[l0c];
              const l1Keys = Object.keys(l0d.l1s).sort((a,b) => l0d.l1s[a].n.localeCompare(l0d.l1s[b].n));
              const l0All = l1Keys.every(l => selL1.has(l));
              const l0Some = !l0All && l1Keys.some(l => selL1.has(l));
              const l0Open = taxSearch ? true : taxExpanded.l0.has(l0c);
              if (taxSearch && !l0d.n.toLowerCase().includes(taxSearch.toLowerCase()) && !l1Keys.some(l1 => l0d.l1s[l1].n.toLowerCase().includes(taxSearch.toLowerCase()))) return null;

              return (
                <div key={l0c} className="tax-tree-node">
                  <div className="tax-tree-row tax-l0-row" onClick={() => toggleTaxNode('l0', l0c)}>
                    <span className={`tax-tree-toggle ${l0Open ? 'open' : ''}`}>►</span>
                    <Checkbox checked={l0All} indeterminate={l0Some} onChange={(e: any) => handleTaxL0(l0c, e.target.checked)} onClick={(e: any) => e.stopPropagation()} />
                    <span className="tax-tree-label">{l0d.n}</span>
                  </div>
                  {l0Open && <div className="tax-tree-children open">
                    {l1Keys.map(l1c => {
                      const l1d = l0d.l1s[l1c];
                      const l2Keys = [...l1d.l2s.keys()];
                      const l1All = selL1.has(l1c);
                      const l1Some = !l1All && l2Keys.some(l => selL2.has(l));
                      const l1Open = taxSearch ? true : taxExpanded.l1.has(l1c);
                      return (
                        <div key={l1c} className="tax-tree-node">
                          <div className="tax-tree-row tax-l1-row" onClick={() => toggleTaxNode('l1', l1c)}>
                            <span className={`tax-tree-toggle ${l1Open ? 'open' : ''}`}>{l2Keys.length > 0 ? '►' : ''}</span>
                            <Checkbox checked={l1All} indeterminate={l1Some} onChange={(e: any) => handleTaxL1(l1c, l0c, e.target.checked)} onClick={(e: any) => e.stopPropagation()} />
                            <span className="tax-tree-label">{l1d.n}</span>
                          </div>
                          {l1Open && <div className="tax-tree-children open">
                            {l2Keys.map(l2c => (
                              <div key={l2c} className="tax-tree-row tax-l2-row">
                                <Checkbox checked={selL2.has(l2c)} onChange={(e: any) => handleTaxL2(l2c, l1c, l0c, e.target.checked)} />
                                <span className="tax-tree-label">{l1d.l2s.get(l2c)}</span>
                              </div>
                            ))}
                          </div>}
                        </div>
                      );
                    })}
                  </div>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label className="scr-flbl">Country</label>
          <input type="text" className="scr-finp" value={coSearch} onChange={e => setCoSearch(e.target.value)} />
          <div className="scr-ms" style={{ maxHeight: '140px', marginTop: '8px' }}>{CountryList}</div>
        </div>

        <div>
          <label className="scr-flbl">Revenue Class</label>
          <div className="scr-ms" style={{ marginTop: '8px' }}>
            {['Pure Play', 'Quasi', 'Marginal'].map(c => (
              <div key={c} className={`scr-opt ${selCls.has(c) ? 'on' : ''}`} onClick={() => setSelCls(p => { const n = new Set(p); if (n.has(c)) n.delete(c); else n.add(c); return n; })}>
                <span className="scr-ck">{selCls.has(c) ? <Check size={12} strokeWidth={3} /> : ''}</span>{c}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="scr-rp">
        <div className="scr-rhd">
          <div style={{ fontSize: '16px' }}><strong>{results.length}</strong> companies found</div>
          <button 
            onClick={() => clientSideLogout(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: '#3b7eff', 
              border: '1px solid #3b7eff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              color: '#f3f3f3ff'
            }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>

        <div className="scr-chips">
          {[...selL1].map(c => {
             // Find name for the code
             let name = c;
             for (const l0 of Object.values(taxMap) as any[]) {
               if (l0.l1s[c]) { name = l0.l1s[c].n; break; }
             }
             return <span key={c} className="scr-chip">{name} <X size={10} onClick={() => removeChipL1(c)} /></span>;
          })}
        </div>

        {loading ? <div className="scr-loading">Loading...</div> : (
          <div className="scr-tbl-wrap">
            <table className="scr-tbl">
              <thead>
                <tr><th></th><th>COMPANY</th><th>COUNTRY</th><th>MCAP</th><th>SECTOR</th><th>TOP THEME</th><th>REV %</th><th>CLASS</th></tr>
              </thead>
              <tbody>
                {results.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--txt3)' }}>No results found. Adjust filters to search.</td></tr> : results.map(co => (
                  <React.Fragment key={co.id || co.company_id}>
                    <tr onClick={() => handleRowClick(co.id || co.company_id)}>
                      <td>{expandedRows.has(co.id || co.company_id) ? '▼' : '►'}</td>
                      <td>{co.company_name}</td>
                      <td>{co.country}</td>
                      <td>{co.mcap || '-'}</td>
                      <td>{co.l0_name || co.sector}</td>
                      <td>{co.top_theme}</td>
                      <td>{co.revenue_pct}%</td>
                      <td>{co.classification}</td>
                    </tr>
                    {expandedRows.has(co.id || co.company_id) && (
                      <tr className="scr-expanded">
                        <td colSpan={8}>
                          <div className="scr-nested">
                            <table className="scr-nested-tbl">
                              <thead>
                                <tr><th>Segment Name</th><th>Revenue %</th><th>Classification</th></tr>
                              </thead>
                              <tbody>
                                {expandedRowData[co.id || co.company_id]?.length ? expandedRowData[co.id || co.company_id].map((s:any, i:number) => (
                                  <tr key={i}>
                                    <td>{s.segment_name}</td>
                                    <td>{s.revenue_pct}%</td>
                                    <td>{s.classification}</td>
                                  </tr>
                                )) : <tr><td colSpan={3}>Loading classification data...</td></tr>}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Screener;