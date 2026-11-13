import { Form } from 'react-bootstrap';

const UsersSearch = ({ onSearch, placeholder = 'Buscar usuario...', ariaLabel = 'Buscar usuario' }) => {
  return (
    <Form.Group controlId="searchUser">
      <Form.Control
        className="users-search"
        type="text"
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(event) => onSearch(event.target.value)}
      />
    </Form.Group>
  );
};

export default UsersSearch;
