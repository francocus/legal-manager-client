import { useMemo } from 'react';
import { LEGAL_SPECIALTIES } from '../../services/consts/specialties';
import './SpecialtiesSelector.css';

const parseSelected = (val) => {
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

export const SpecialtiesSelector = ({
  selected = [],
  onChange,
  isInvalid = false,
  disabled = false,
  options = LEGAL_SPECIALTIES,
  returnAsString = false,
}) => {
  const currentList = useMemo(() => parseSelected(selected), [selected]);

  const handleToggle = (item) => {
    if (disabled) return;
    const exists = currentList.includes(item);
    const nextList = exists
      ? currentList.filter((s) => s !== item)
      : [...currentList, item];

    if (returnAsString) {
      onChange?.(nextList.join(', '));
    } else {
      onChange?.(nextList);
    }
  };

  return (
    <div className={`specialties-selector ${isInvalid ? 'is-invalid' : ''}`}>
      <div className="specialties-selector__chips">
        {options.map((option) => {
          const isSelected = currentList.includes(option);
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              className={`specialties-chip ${isSelected ? 'specialties-chip--selected' : ''}`}
              onClick={() => handleToggle(option)}
              aria-pressed={isSelected}
            >
              {isSelected && <span className="specialties-chip__check">✓</span>}
              <span>{option}</span>
            </button>
          );
        })}
      </div>
      {currentList.length === 0 && (
        <span className="specialties-selector__hint">
          Seleccioná una o más opciones haciendo clic en cada una.
        </span>
      )}
    </div>
  );
};

export default SpecialtiesSelector;
