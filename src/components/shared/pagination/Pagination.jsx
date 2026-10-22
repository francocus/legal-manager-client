import { Pagination as BootstrapPagination } from 'react-bootstrap';
import './Pagination.css';

const getPageNumbers = (page, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, page, page - 1, page + 1]);

  return [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
};

const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getPageNumbers(page, totalPages);

  return (
    <BootstrapPagination className="app-pagination" size="sm">
      <BootstrapPagination.Prev disabled={page === 1} onClick={() => onChange(page - 1)} />
      {pages.map((pageNumber, index) => (
        <BootstrapPagination.Item
          key={pageNumber}
          active={pageNumber === page}
          onClick={() => onChange(pageNumber)}
        >
          {index > 0 && pageNumber - pages[index - 1] > 1 ? `… ${pageNumber}` : pageNumber}
        </BootstrapPagination.Item>
      ))}
      <BootstrapPagination.Next disabled={page === totalPages} onClick={() => onChange(page + 1)} />
    </BootstrapPagination>
  );
};

export default Pagination;
