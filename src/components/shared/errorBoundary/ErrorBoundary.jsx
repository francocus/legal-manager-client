import { Component } from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error inesperado de render:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <main className="error-boundary" role="alert">
          <section className="error-boundary__panel">
            <p className="error-boundary__eyebrow">Legal Manager</p>
            <h1 className="error-boundary__title">Algo salió mal</h1>
            <p className="error-boundary__copy">
              Ocurrió un error inesperado en la aplicación. Podés recargar la página para continuar.
            </p>
            <button type="button" className="error-boundary__button" onClick={this.handleReload}>
              Recargar página
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
