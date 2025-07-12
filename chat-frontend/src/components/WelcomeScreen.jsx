import React from 'react'

const WelcomeScreen = () => {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-icon">🔒</div>
        <div className="welcome-title">Chat Encriptado E2E</div>
        <div className="welcome-text">
          Bem-vindo ao chat com criptografia end-to-end. 
          Suas mensagens são encriptadas no seu dispositivo e 
          só podem ser lidas pelo destinatário.
        </div>
        <div className="welcome-features">
          <h4>Recursos de Segurança:</h4>
          <ul>
            <li>Criptografia libsodium (NaCl)</li>
            <li>Chaves geradas localmente</li>
            <li>Mensagens armazenadas localmente</li>
            <li>Servidor não pode ler mensagens</li>
            <li>Identificação anônima</li>
            <li>Sistema de amigos por ID</li>
            <li>Nomes de usuário personalizados</li>
          </ul>
        </div>
        <div className="welcome-instructions">
          <h4>Como usar:</h4>
          <ol>
            <li>Defina seu nome de usuário usando o botão ✏️</li>
            <li>Copie seu ID usando o botão 👁️‍🗨️</li>
            <li>Compartilhe seu ID com amigos</li>
            <li>Adicione amigos usando o botão "👥 Adicionar Amigo"</li>
            <li>Clique em um amigo online para conversar</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default WelcomeScreen 