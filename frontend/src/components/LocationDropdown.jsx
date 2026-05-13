import { useState, useRef, useEffect } from 'react';

const LOCATIONS = [
  //ground floor
  ...Array.from({ length: 51 }, (_, i) => `Z${i}`), //Z0 to Z50

  //first floor
  ...Array.from({ length: 61 }, (_, i) => `Room ${100 + i}`), //Room 100 to Room 160

  //second floor
  ...Array.from({ length: 61 }, (_, i) => `Room ${200 + i}`), //Room 200 to Room 260

  //third floor
  ...Array.from({ length: 41 }, (_, i) => `Room ${300 + i}`), //Room 300 to Room 340

  //common areas
  'Library',
  'Sports Center',
  'Outside Coffee Shop',
  'Third Floor Coffee Shop',
  'Cafeteria',
  'Main Entrance',
  'Parking Lot',
];

const LocationDropdown = ({
  value,
  onChange,
  placeholder = 'Search for a location...',
}) => {
  const [search, setSearch] = useState(value || ''); //search input value
  const [open, setOpen] = useState(false); //dropdown open/close
  const wrapRef = useRef(null); //ref to detect outside clicks
  const filtered = search.trim()
    ? LOCATIONS.filter((loc) =>
        loc.toLowerCase().includes(search.toLowerCase())
      )
    : LOCATIONS; //compute filtered list directly

  //close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  //when user selects a location
  const handleSelect = (location) => {
    setSearch(location); //show selected input
    onChange(location); //notify parent component
    setOpen(false); //close dropdown
  };

  //when user clears the input
  const handleInputChange = (e) => {
    setSearch(e.target.value);
    onChange(''); //clear parent value until selection
    setOpen(true); //open dropdown when typing
  };

  return (
    <div ref={wrapRef} style={s.wrap}>
      {/* Search input */}
      <input
        style={{
          ...s.input,
          borderColor: open ? '#2563EB' : '#334155', // blue border when open
        }}
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)} // open on focus
      />

      {/* Dropdown arrow icon */}
      <span style={s.arrow}>{open ? '▲' : '▼'}</span>

      {/* Dropdown list */}
      {open && (
        <div style={s.dropdown}>
          {filtered.length === 0 ? (
            <div style={s.noResults}>No locations found</div>
          ) : (
            filtered.map((loc) => (
              <div
                key={loc}
                style={{
                  ...s.option,
                  backgroundColor: value === loc ? '#1E3A5F' : 'transparent', // highlight selected
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#1E3A5F')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    value === loc ? '#1E3A5F' : 'transparent')
                }
                onClick={() => handleSelect(loc)}
              >
                📍 {loc}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const s = {
  wrap: { position: 'relative', width: '100%' },
  input: {
    width: '100%',
    backgroundColor: '#0D1B2E',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '0.75rem 2.5rem 0.75rem 1rem',
    color: '#F8FAFC',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'Sora, sans-serif',
    boxSizing: 'border-box',
  },
  arrow: {
    position: 'absolute',
    right: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94A3B8',
    fontSize: '0.7rem',
    pointerEvents: 'none',
  },
  dropdown: {
    position: 'absolute',
    top: '110%',
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '10px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 50,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  option: {
    padding: '0.65rem 1rem',
    fontSize: '0.875rem',
    color: '#F8FAFC',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    borderRadius: '6px',
  },
  noResults: {
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: '#94A3B8',
    textAlign: 'center',
  },
};

export default LocationDropdown;
