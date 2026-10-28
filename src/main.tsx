import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import { AuthProvider } from './hooks/useAuth';
import { ContentProvider } from './hooks/useContent';
import './styles/globals.css';
import './styles/site.css';
import './styles/history.css';
import './styles/admin.css';

// Se o Supabase não aceitar o endereço de retorno, ele manda o link de recuperação para a página inicial (Site URL).
// Nesse caso, leva os códigos do link para /redefinir-senha, onde eles são lidos.
if (window.location.pathname !== '/redefinir-senha' && /(^|[#?&])type=recovery(&|$)/.test(window.location.hash + window.location.search)) {
  window.history.replaceState(null, '', `/redefinir-senha${window.location.search}${window.location.hash}`);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ContentProvider>
          <App />
        </ContentProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
