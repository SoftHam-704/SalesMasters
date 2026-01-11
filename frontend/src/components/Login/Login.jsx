import React, { useState, useEffect, useRef } from 'react';


import './Login.css';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

import iconeMasters2025 from '@/assets/icone_masters_2025.png';

const Login = () => {
  // ============================================================================
  // ⚠️  ATENÇÃO: CÓDIGO PROTEGIDO - NÃO ALTERAR! 🛡️
  // ============================================================================
  // Estados iniciais DEVEM ser FALSE para que a vinheta apareça ANTES do login
  // Se alterar para TRUE, o formulário aparece antes da vinheta (ERRADO!)
  // 
  // Data da última correção: 06/01/2026
  // Motivo: Estado inicial errado causava formulário aparecer antes da vinheta
  // ============================================================================
  const videoRef = useRef(null);
  const [showIntro, setShowIntro] = useState(false);  // ⚠️ NÃO MUDAR PARA TRUE!
  const [showLogin, setShowLogin] = useState(false);  // ⚠️ NÃO MUDAR PARA TRUE!
  const [formData, setFormData] = useState({
    cnpj: '',
    nome: '',
    sobrenome: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // ⚠️ URL DA VINHETA - NÃO ALTERAR! ⚠️
  // Esta URL é oficial e testada. Tempo de exibição: 10 segundos
  const VINHETA_URL = 'https://www.softham.com.br/vinheta.mp4';

  useEffect(() => {
    const initVinheta = async () => {
      console.log('Login component mounted');
      document.body.classList.add('login-page-body');

      // Lógica da Vinheta: Só tenta rodar se houver internet E o recurso estiver acessível
      if (navigator.onLine) {
        console.log('🌐 Internet detectada. Verificando disponibilidade da vinheta...');

        try {
          // Probe rápido de 2 segundos para evitar espera infinita ou erros de DNS não tratados
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          await fetch(VINHETA_URL, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          console.log('✅ Vinheta acessível. Iniciando...');
          setShowIntro(true);
          setShowLogin(false);
        } catch (error) {
          console.log('❌ Vinheta inacessível (Offline/DNS/Timeout). Pulando para o login.');
          setShowIntro(false);
          setShowLogin(true);
        }
      } else {
        console.log('🔌 Sem conexão. Pulado vinheta diretamente para o login.');
        setShowIntro(false);
        setShowLogin(true);
      }
    };

    initVinheta();

    return () => {
      document.body.classList.remove('login-page-body');
    };
  }, []);

  useEffect(() => {
    // Carregar dados salvos para facilitar o re-login
    const savedCnpj = localStorage.getItem('login_cnpj');
    const savedNome = localStorage.getItem('login_nome');
    const savedSobrenome = localStorage.getItem('login_sobrenome');

    if (savedCnpj || savedNome || savedSobrenome) {
      setFormData(prev => ({
        ...prev,
        cnpj: savedCnpj || '',
        nome: savedNome || '',
        sobrenome: savedSobrenome || ''
      }));
    }


    // ⚠️ TIMER DE SEGURANÇA - PROTEGIDO! ⚠️
    // Duração: 10 segundos (10000ms) - Tempo suficiente para vinheta carregar
    // NÃO reduzir para menos de 10s ou aumentar muito (usuários vão reclamar)
    const safetyTimer = setTimeout(() => {
      if (showIntro) {
        console.log('Safety timer: Pulando intro por demora no carregamento.');
        setShowIntro(false);
        setShowLogin(true);
      }
    }, 10000);  // ⚠️ 10 segundos - NÃO ALTERAR!

    // Criar partículas após o login aparecer
    if (showLogin) {
      const particleInterval = setInterval(() => {
        createParticle();
      }, 1200);

      return () => {
        clearInterval(particleInterval);
        clearTimeout(safetyTimer);
      };
    }

    return () => clearTimeout(safetyTimer);
  }, [showLogin, showIntro]);

  const handleVideoEnd = () => {
    console.log('Vinheta terminou.');
    setShowIntro(false);
    setShowLogin(true);
  };

  const handleVideoError = () => {
    console.log('Erro ao carregar vídeo, pulando para login...');
    setShowIntro(false);
    setTimeout(() => {
      setShowLogin(true);
    }, 500);
  };

  const createParticle = () => {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 8 + 's';
    particle.style.animationDuration = (Math.random() * 5 + 5) + 's';
    document.body.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 13000);
  };

  const formatCNPJ = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'cnpj') {
      const numbers = value.replace(/\D/g, '').slice(0, 14);
      setFormData(prev => ({ ...prev, [name]: formatCNPJ(numbers) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleInputFocus = (e) => {
    e.target.parentElement.classList.add('focused');
  };

  const handleInputBlur = (e) => {
    if (!e.target.value) {
      e.target.parentElement.classList.remove('focused');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Attempting login...', formData);
    setIsLoading(true);

    // Persistir os dados básicos IMEDIATAMENTE antes de tentar o login (estilo .ini)
    localStorage.setItem('login_cnpj', formData.cnpj);
    localStorage.setItem('login_nome', formData.nome);
    localStorage.setItem('login_sobrenome', formData.sobrenome);

    try {
      const response = await fetch(getApiUrl(NODE_API_URL, '/api/auth/master-login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Login success:', data);

        // Armazenar as informações de Multi-tenant CRÍTICAS (Apenas para esta sessão)
        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('tenantConfig', JSON.stringify(data.tenantConfig));

        // SALVAR TOKEN DE SESSÃO DO EQUIPAMENTO (Segurança)
        if (data.token) {
          localStorage.setItem('session_token', data.token);
        }

        // Limpar qualquer lixo legado do localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('tenantConfig');

        // Redirecionar para o dashboard
        window.location.href = '/';
      } else {
        alert(data.message || 'Falha na autenticação');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Erro ao conectar com o servidor. Verifique se o backend está rodando.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Deseja realmente cancelar?')) {
      setFormData({
        cnpj: '',
        nome: '',
        sobrenome: '',
        password: ''
      });
    }
  };

  return (
    <>
      {/* INTRO VINHETA */}
      {showIntro && (
        <div id="introScreen">
          <video
            id="introVideo"
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={handleVideoEnd}
            onError={handleVideoError}
          >
            <source src={VINHETA_URL} type="video/mp4" />
          </video>

        </div>
      )}

      {/* TELA DE LOGIN */}
      {showLogin && (
        <div id="loginScreen" className="show">
          <div className="login-card">
            {/* LOGO */}
            <div className="login-logo">
              <img src={iconeMasters2025} alt="SalesMasters Logo" />
              <div className="logo-text">SalesMasters</div>
              <div className="logo-version">PROFESSIONAL V2.5</div>
            </div>

            {/* WELCOME */}
            <div className="welcome">
              <h2>Bem-vindo</h2>
              <p>Entre com suas credenciais para acessar</p>
            </div>

            {/* FORM */}
            <form id="loginForm" onSubmit={handleSubmit} autoComplete="off">
              <label className="login-label" htmlFor="cnpj">CNPJ da Empresa</label>
              <input
                className="login-input"
                type="text"
                id="cnpj"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="00.000.000/0000-00"
                required
                autoComplete="off"
              />

              <div className="login-row">
                <div>
                  <label className="login-label" htmlFor="nome">Nome</label>
                  <input
                    className="login-input"
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="Seu nome"
                    required
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="login-label" htmlFor="sobrenome">Sobrenome</label>
                  <input
                    className="login-input"
                    type="text"
                    id="sobrenome"
                    name="sobrenome"
                    value={formData.sobrenome}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="Sobrenome"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>

              <label className="login-label" htmlFor="password">Senha de Acesso</label>
              <input
                className="login-input"
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />

              <div className="login-actions">
                <button type="button" className="btn-clear" onClick={handleCancel}>
                  LIMPAR
                </button>
                <button type="submit" className="btn-login" disabled={isLoading}>
                  {isLoading ? 'ACESSANDO...' : 'ENTRAR NO SISTEMA'}
                </button>
              </div>
            </form>

            <div className="login-footer">
              © 2026 SoftHam Sistemas. Todos os direitos reservados.
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
