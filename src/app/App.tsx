import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { PrivacyPage } from '../pages/PrivacyPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RequireAdmin } from './RequireAdmin';
import { NoIndex } from './NoIndex';

// Páginas administrativas carregam sob demanda: o visitante comum não baixa esse código.
const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const AdminMessagesPage = lazy(() => import('../pages/AdminMessagesPage').then((m) => ({ default: m.AdminMessagesPage })));
const AdminUsersPage = lazy(() => import('../pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const passwords = () => import('../pages/PasswordPages');
const RecoverPasswordPage = lazy(() => passwords().then((m) => ({ default: m.RecoverPasswordPage })));
const ResetPasswordPage = lazy(() => passwords().then((m) => ({ default: m.ResetPasswordPage })));
const AdminHistoryPage = lazy(() => import('../pages/AdminHistoryPage').then((m) => ({ default: m.AdminHistoryPage })));
// História: carrega só quando alguém abre /historia.
const history = () => import('../pages/HistoryPages');
const HistoryIndexPage = lazy(() => history().then((m) => ({ default: m.HistoryIndexPage })));
const HistoryYearPage = lazy(() => history().then((m) => ({ default: m.HistoryYearPage })));
const HistoryPostsPage = lazy(() => history().then((m) => ({ default: m.HistoryPostsPage })));
const HistoryPostPage = lazy(() => history().then((m) => ({ default: m.HistoryPostPage })));
const HistoryFlyersPage = lazy(() => history().then((m) => ({ default: () => <m.HistoryGalleryPage kind="filipetas" /> })));
const HistoryClippingsPage = lazy(() => history().then((m) => ({ default: () => <m.HistoryGalleryPage kind="clipagens" /> })));
// A HomePage já está no pacote principal; o código do painel de edição dela é que carrega sob demanda.
const AdminHome = () => <HomePage admin />;

export function App() {
  return (
    <Suspense fallback={<p className="status" role="status">Carregando…</p>}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/privacidade" element={<PrivacyPage />} />
      <Route path="/historia" element={<HistoryIndexPage />} />
      <Route path="/historia/:ano" element={<HistoryYearPage />} />
      <Route path="/historia/:ano/postagens" element={<HistoryPostsPage />} />
      <Route path="/historia/:ano/postagens/:slug" element={<HistoryPostPage />} />
      <Route path="/historia/:ano/filipetas" element={<HistoryFlyersPage />} />
      <Route path="/historia/:ano/clipagens" element={<HistoryClippingsPage />} />
      <Route path="/login" element={<><NoIndex /><LoginPage /></>} />
      <Route path="/recuperar-senha" element={<><NoIndex /><RecoverPasswordPage /></>} />
      <Route path="/redefinir-senha" element={<><NoIndex /><ResetPasswordPage /></>} />
      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<><NoIndex /><AdminHome /></>} />
        <Route path="/admin/mensagens" element={<><NoIndex /><AdminMessagesPage /></>} />
        <Route path="/admin/administradores" element={<><NoIndex /><AdminUsersPage /></>} />
        <Route path="/admin/historia" element={<><NoIndex /><AdminHistoryPage /></>} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
}
