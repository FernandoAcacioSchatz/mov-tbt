import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function PrivacyPage() {
  useDocumentTitle('Política de Privacidade — Movimento TBT');
  return (
    <>
      <Header />
      <main id="conteudo" className="container page">
        <article className="prose">
          <p className="notice" role="note">Modelo inicial — revisar com orientação jurídica antes da publicação definitiva.</p>
          <h1>Política de Privacidade</h1>
          <p>O Movimento Temporada Blumenauense de Teatro (“TBT”) respeita a sua privacidade e trata dados pessoais conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).</p>

          <h2>1. Quais dados coletamos</h2>
          <p>Coletamos somente o que você informa no formulário de contato: nome, e-mail, assunto e mensagem. Também registramos a data e a hora do envio.</p>

          <h2>2. Para que usamos</h2>
          <p>Usamos esses dados exclusivamente para responder à sua mensagem e, quando for o caso, falar sobre a sua participação no movimento. Não vendemos nem compartilhamos seus dados para fins de publicidade.</p>

          <h2>3. Base legal</h2>
          <p>O tratamento se baseia no seu consentimento, dado ao marcar a caixa de aceite no formulário, e no legítimo interesse de responder a quem nos procura.</p>

          <h2>4. Com quem compartilhamos</h2>
          <p>Os dados ficam armazenados em provedor de infraestrutura contratado pelo movimento (banco de dados e hospedagem), com acesso restrito às pessoas autorizadas da coordenação. Esses provedores podem processar dados fora do Brasil, com medidas de segurança adequadas.</p>

          <h2>5. Por quanto tempo guardamos</h2>
          <p>Guardamos as mensagens pelo tempo necessário para o atendimento e, depois disso, podemos excluí-las. Você pode pedir a exclusão a qualquer momento.</p>

          <h2>6. Seus direitos</h2>
          <p>Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação dos dados e revogação do consentimento, conforme o art. 18 da LGPD.</p>

          <h2>7. Cookies e rastreadores</h2>
          <p>Este site não usa cookies de publicidade nem ferramentas de rastreamento. Para quem faz login na área administrativa, é usado armazenamento local do navegador apenas para manter a sessão.</p>

          <h2>8. Segurança</h2>
          <p>Adotamos conexão criptografada (HTTPS), controle de acesso por login, regras de segurança no banco de dados e registro de alterações administrativas.</p>

          <h2>9. Contato do responsável</h2>
          <p>Para exercer seus direitos, use o formulário de contato do site, escolhendo o assunto “Quero entrar em contato”.</p>

          <h2>10. Atualizações</h2>
          <p>Esta política pode ser atualizada. A versão em vigor é sempre a publicada nesta página.</p>
        </article>
      </main>
      <Footer />
    </>
  );
}
