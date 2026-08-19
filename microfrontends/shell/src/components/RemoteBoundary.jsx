import { Component, Suspense } from 'react';

/**
 * Boundary de erro + Suspense para isolar falhas de microfrontends remotos.
 * Se um remote estiver fora do ar, apenas a área dele mostra erro —
 * o restante da aplicação (header, navegação, outros MFEs) continua funcionando.
 * Esse isolamento de falhas é um dos benefícios da arquitetura de MFEs.
 */
export default class RemoteBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error(`[shell] Falha ao carregar ${this.props.name}:`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="state-msg error">
          <h2>Microfrontend indisponível</h2>
          <p>
            O módulo <strong>{this.props.name}</strong> não pôde ser carregado.
            Verifique se ele está rodando.
          </p>
        </div>
      );
    }

    return (
      <Suspense
        fallback={<p className="state-msg">Carregando {this.props.name}…</p>}
      >
        {this.props.children}
      </Suspense>
    );
  }
}
