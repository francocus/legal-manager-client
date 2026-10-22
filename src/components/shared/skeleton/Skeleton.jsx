import './Skeleton.css';

export const Skeleton = ({ variant = 'text', width, height, className = '' }) => (
  <span
    className={`skeleton skeleton--${variant} ${className}`.trim()}
    style={{ width, height }}
    aria-hidden="true"
  />
);

export const SkeletonRows = ({ rows = 4 }) => (
  <div className="skeleton-rows" aria-hidden="true">
    {Array.from({ length: rows }, (_, index) => (
      <Skeleton key={index} variant="block" height="48px" />
    ))}
  </div>
);

export default Skeleton;
