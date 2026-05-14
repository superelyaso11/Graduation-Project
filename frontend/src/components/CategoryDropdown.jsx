import { useState, useRef, useEffect } from 'react';

const CategoryDropdown = ({
  value,
  onChange,
  placeholder = 'Select a category',
  showAll = false,
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef();

  const CATEGORIES = [
    ...(showAll ? [{ value: '', label: 'All Categories', icon: '🔍' }] : []),
    { value: 'ELECTRONICS', label: 'Electronics', icon: '💻' },
    { value: 'CLOTHING', label: 'Clothing & Bags', icon: '👕' },
    { value: 'ACCESSORIES', label: 'Accessories', icon: '🔑' },
    { value: 'STATIONERY', label: 'Stationery', icon: '📚' },
    { value: 'ID_CARDS', label: 'ID Cards', icon: '🪪' },
    { value: 'SPORTS', label: 'Sports Equipment', icon: '⚽' },
    { value: 'OTHER', label: 'Other', icon: '📦' },
  ];

  //close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = CATEGORIES.find((c) => c.value === value); //find selected category object

  const handleSelect = (cat) => {
    onChange(cat.value); //notify parent with value
    setOpen(false); //close dropdown
  };

  return (
    <div ref={wrapRef} style={s.wrap}>
      {/* Trigger button */}
      <div
        style={{
          ...s.trigger,
          borderColor: open ? '#2563EB' : '#334155',
        }}
        onClick={() => setOpen(!open)}
      >
        <span style={s.triggerText}>
          {selected ? (
            `${selected.icon} ${selected.label}` // show selected
          ) : (
            <span style={{ color: '#94A3B8' }}>{placeholder}</span>
          )}
        </span>
        <span style={s.arrow}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={s.dropdown}>
          {CATEGORIES.map((cat) => (
            <div
              key={cat.value}
              style={{
                ...s.option,
                backgroundColor:
                  value === cat.value ? '#1E3A5F' : 'transparent',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = '#1E3A5F')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  value === cat.value ? '#1E3A5F' : 'transparent')
              }
              onClick={() => handleSelect(cat)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const s = {
  wrap: { position: 'relative', width: '100%' },
  trigger: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0D1B2E',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  triggerText: {
    fontSize: '0.95rem',
    color: '#F8FAFC',
    fontFamily: 'Sora, sans-serif',
  },
  arrow: { color: '#94A3B8', fontSize: '0.7rem', flexShrink: 0 },
  dropdown: {
    position: 'absolute',
    top: '110%',
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '10px',
    zIndex: 50,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    overflow: 'hidden',
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: '#F8FAFC',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
};

export default CategoryDropdown;
