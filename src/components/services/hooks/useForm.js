import { useCallback, useState } from 'react';

export const useForm = ({ initialValues, validate, onSubmit }) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setValue = useCallback((name, value) => {
    setValues((previousValues) => ({ ...previousValues, [name]: value }));
    setErrors((previousErrors) => {
      if (!previousErrors[name]) {
        return previousErrors;
      }

      const nextErrors = { ...previousErrors };
      delete nextErrors[name];
      return nextErrors;
    });
  }, []);

  const handleChange = useCallback(
    (event) => {
      const { name, type, value, checked } = event.target;
      setValue(name, type === 'checkbox' ? checked : value);
    },
    [setValue],
  );

  const handleBlur = useCallback((event) => {
    const { name } = event.target;
    setTouched((previousTouched) => ({ ...previousTouched, [name]: true }));
  }, []);

  const reset = useCallback(
    (nextValues = initialValues) => {
      setValues(nextValues);
      setErrors({});
      setTouched({});
    },
    [initialValues],
  );

  const runValidation = useCallback(() => {
    const nextErrors = validate ? (validate(values) ?? {}) : {};
    setErrors(nextErrors);
    setTouched(
      Object.keys(values).reduce((accumulator, key) => ({ ...accumulator, [key]: true }), {}),
    );
    return nextErrors;
  }, [validate, values]);

  const handleSubmit = useCallback(
    async (event) => {
      event?.preventDefault?.();

      const nextErrors = runValidation();
      if (Object.keys(nextErrors).length > 0) {
        return false;
      }

      try {
        setSubmitting(true);
        await onSubmit?.(values);
        return true;
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmit, runValidation, values],
  );

  return {
    values,
    errors,
    touched,
    submitting,
    setValue,
    setValues,
    setErrors,
    handleChange,
    handleBlur,
    reset,
    handleSubmit,
  };
};
