import { X, ShieldAlert, FileText, Check } from 'lucide-react';
import { useState } from 'react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
  isForceAccept?: boolean;
  onAccept?: () => void;
}

export function TermsModal({ isOpen, onClose, initialTab = 'terms', isForceAccept = false, onAccept }: TermsModalProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#0c0c0e] border border-[#2e2e34] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-300 font-sans animate-scaleIn">
        
        {/* Header */}
        <div className="p-6 border-b border-[#2e2e34] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeTab === 'terms' ? (
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <FileText className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                {activeTab === 'terms' ? 'Termos de Uso' : 'Política de Privacidade (LGPD)'}
              </h2>
              <p className="text-[10px] text-neutral-500 font-bold">GourmetOS — Sistema de Gestão Inteligente</p>
            </div>
          </div>
          {!isForceAccept && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#1a1a1e] rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-[#070709] border-b border-[#2e2e34] text-xs font-bold">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'border-emerald-500 text-white bg-emerald-500/5'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Termos de Uso da Plataforma
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-emerald-500 text-white bg-emerald-500/5'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Privacidade e Proteção de Dados (LGPD)
          </button>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-neutral-400">
          {activeTab === 'terms' ? (
            <div className="space-y-4 font-semibold">
              <p className="text-neutral-300">
                Seja bem-vindo ao <strong>GourmetOS</strong>. Ao cadastrar seu estabelecimento e utilizar nossos serviços, você concorda integralmente com estes Termos de Uso. Leia com atenção as diretrizes de funcionamento da nossa plataforma.
              </p>

              <div>
                <h3 className="text-white font-extrabold text-[13px] uppercase tracking-wide mb-1.5">1. Objeto do Serviço</h3>
                <p>
                  O GourmetOS é um software como serviço (SaaS) que fornece ferramentas para gerenciamento interno de restaurantes, incluindo controle de comandas, caixa (PDV), monitor de cozinha (KDS), mesas, funcionários e relatórios operacionais.
                </p>
              </div>

              <div>
                <h3 className="text-white font-extrabold text-[13px] uppercase tracking-wide mb-1.5">2. Responsabilidade do Cadastro</h3>
                <p>
                  Ao criar a conta de Administrador, o contratante declara ser o representante legal do estabelecimento ou possuir poderes para tal. A segurança das credenciais de acesso criadas para gerentes, operadores de caixa e garçons é de total responsabilidade do contratante.
                </p>
              </div>

              <div>
                <h3 className="text-white font-extrabold text-[13px] uppercase tracking-wide mb-1.5">3. Nível de Serviço (SLA) e Disponibilidade</h3>
                <p>
                  Garantimos um nível de disponibilidade da plataforma de 99,5% anual. Não nos responsabilizamos por indisponibilidades causadas por:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Falhas ou interrupções na conexão local de internet do restaurante;</li>
                  <li>Uso incorreto ou inadequado do navegador/dispositivo por parte dos operadores;</li>
                  <li>Manutenções preventivas programadas, que serão comunicadas previamente fora do horário de pico.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-extrabold text-[13px] uppercase tracking-wide mb-1.5">4. Propriedade Intelectual e de Dados</h3>
                <p>
                  O software, layout, algoritmos e marcas associadas ao GourmetOS são propriedade exclusiva do nosso sistema. Em contrapartida, <strong>todos os dados cadastrados</strong> (produtos, preços, histórico de vendas e dados de clientes) são de propriedade exclusiva do estabelecimento contratante, podendo ser exportados a qualquer momento antes do cancelamento da conta.
                </p>
              </div>

              <div>
                <h3 className="text-white font-extrabold text-[13px] uppercase tracking-wide mb-1.5">5. Limitação de Responsabilidade</h3>
                <p>
                  O GourmetOS funciona como ferramenta operacional de apoio. Não respondemos por prejuízos comerciais, perdas financeiras ou decisões administrativas incorretas tomadas com base nos relatórios gerados pelo sistema. Em consonância com a legislação brasileira, nossa responsabilidade civil limita-se ao valor correspondente aos últimos 3 meses da taxa de licenciamento contratada pelo estabelecimento.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 font-semibold">
              <p className="text-neutral-300">
                Nossa Política de Privacidade foi estruturada de acordo com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)</strong> e com o <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong>.
              </p>

              <div>
                <h3 className="text-white font-extrabold text-[13px] uppercase tracking-wide mb-1.5">1. Atribuição de Papéis na LGPD</h3>
                <p>
                  Para fins da legislação de privacidade:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li><strong>O Estabelecimento (Sua Empresa):</strong> Atua como <strong>Controlador</strong> dos dados pessoais. Vocês decidem quais dados dos seus clientes finais (como nome para comanda, e-mail para fidelidade ou CPF na nota) e funcionários coletar;</li>
                  <li><strong>O GourmetOS (Nossa Plataforma):</strong> Atua como <strong>Operadora</strong> dos dados pessoais. Nós processamos e armazenamos as informações sob as suas estritas ordens operacionais, sem dar destinação comercial ou repassar a terceiros.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-extrabold text-[13px] uppercase tracking-wide mb-1.5">2. Dados Coletados e Finalidade</h3>
                <p>
                  Coletamos os seguintes tipos de informações:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li><strong>Dados do Estabelecimento:</strong> Razão social, CNPJ, telefone, e-mail do administrador, para fins de faturamento e suporte técnico;</li>
                  <li><strong>Dados Operacionais:</strong> Nomes de garçons, gerentes e operadores para auditoria de ações (como logs de abertura/fechamento de caixas e lançamentos de comandas);</li>
                  <li><strong>Dados de Clientes do Restaurante:</strong> Eventuais nomes de identificação de mesas ou comandas, registrados estritamente para o bom andamento dos pedidos da cozinha e faturamento.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-extrabold text-[13px] uppercase tracking-wide mb-1.5">3. Segurança e Criptografia</h3>
                <p>
                  Implementamos medidas técnicas robustas de segurança, tais como criptografia TLS/HTTPS na transmissão de dados, autenticação de dois fatores opcional (2FA) e criptografia unilateral nos hashes de senhas (criptografados com scrypt antes de salvar no banco). Nenhuma senha é armazenada em texto limpo.
                </p>
              </div>

              <div>
                <h3 className="text-white font-extrabold text-[13px] uppercase tracking-wide mb-1.5">4. Exclusão e Portabilidade</h3>
                <p>
                  O contratante tem o direito de requisitar a exclusão completa de todos os dados operacionais e de cadastro de seus servidores a qualquer momento. Nós fornecemos scripts de limpeza profunda no banco de dados para garantir que nenhum resíduo de teste ou dado sensível seja mantido após o encerramento da conta.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#2e2e34] bg-[#070709] flex items-center justify-end gap-3">
          <button
            onClick={isForceAccept && onAccept ? onAccept : onClose}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>{isForceAccept ? 'Aceitar Termos e Acessar GourmetOS' : 'Li e Concordo'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
