//displays a user's reputation badge based on their points
const ReputationBadge = ({ points = 0, showPoints = true, size = 'small' }) => {
  //determine badge tier based on points
  const getBadge = (pts) => {
    if (pts >= 100) return { icon: '🥇', label: 'Gold', color: '#F59E0B' };
    if (pts >= 50) return { icon: '🥈', label: 'Silver', color: '#94A3B8' };
    if (pts >= 10) return { icon: '🥉', label: 'Bronze', color: '#B45309' };
    return null; //no badge below 10 points
  };

  const badge = getBadge(points);

  //size variants
  const sizes = {
    small: {
      fontSize: '0.75rem',
      padding: '0.15rem 0.5rem',
      iconSize: '0.85rem',
    },
    medium: {
      fontSize: '0.875rem',
      padding: '0.25rem 0.75rem',
      iconSize: '1rem',
    },
    large: {
      fontSize: '1rem',
      padding: '0.5rem 1rem',
      iconSize: '1.25rem',
    },
  };

  const currentSize = sizes[size] || size.small;

  if (!badge && !showPoints) return null; //nothing to show

  return (
    <div style={s.wrap}>
      {/* Show badge if earned */}
      {badge && (
        <span
          style={{
            ...s.badge,
            backgroundColor: badge.color + '22',
            color: badge.color,
            border: `1px solid ${badge.color}44`,
            fontSize: currentSize.fontSize,
            padding: currentSize.padding,
          }}
        >
          <span style={{ fontSize: currentSize.iconSize }}>{badge.icon}</span>
          {badge.label}
        </span>
      )}

      {/* Show points */}
      {showPoints && <span style={s.points}>⭐ {points} pts</span>}
    </div>
  );
};

const s = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    flexWrap: 'wrap',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    borderRadius: '6px',
    fontWeight: '700',
    fontFamily: 'Sora, sans-serif',
  },
  points: { fontSize: '0.75rem', color: '#94A3B8', fontWeight: '500' },
};

export default ReputationBadge;
