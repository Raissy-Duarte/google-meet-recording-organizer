# Automação de gestão e Organização de gravações de reuniões

Solução em **Google Apps Script** para captura, organização e armazenamento automático de gravações de reuniões enviadas por e-mail no Gmail para pastas específicas no Google Drive.

---

## Problema resolvido

Em rotinas de vendas, negociações, aulas EAD e acompanhamento de projetos, é comum gravar reuniões para manter o histórico. No entanto, fazer a triagem dos e-mails, identificar a reunião e salvar manualmente o arquivo na pasta correta do Google Drive consome tempo operacional e é suscetível a esquecimentos.

Esta automação elimina esse trabalho manual e garante a centralização dos arquivos.

---

## Como funciona

1. **Varredura ativa:** O script consulta o Gmail em busca de e-mails com gravações de reuniões que ainda não foram processados.
2. **Extração via Regex:**
   - Captura o nome da reunião/projeto contido no assunto do e-mail.
   - Extrai o ID do arquivo de vídeo a partir dos links no corpo da mensagem.
3. **Mapeamento de pastas:** Realiza uma busca inteligente no Google Drive (*fuzzy matching*) para localizar a pasta correspondente.
4. **Prevenção de duplicidade:** Verifica se o vídeo daquela data já existe na pasta antes de realizar a cópia.
5. **Cópia e organização:** Copia o arquivo para a pasta de destino com nomenclatura padronizada e ajusta as permissões de acesso.
6. **Finalização:** Marca a mensagem como lida e aplica uma etiqueta (`Label`) de controle no Gmail.

---

## Tecnologias utilizadas

- **Linguagem:** JavaScript / Google Apps Script
- **APIs do Google Workspace:**
  - `GmailApp` (Busca, leitura e rotulagem de e-mails)
  - `DriveApp` (Busca de pastas, gestão de arquivos e permissões)
  - `Utilities` (Formatação de datas e fusos horários)
- **Técnicas:** Expressões Regulares (Regex) para extração de dados não estruturados.

---

## Como configurar

1. Acesse o [Google Apps Script](https://script.google.com/).
2. Crie um novo projeto e cole o código do arquivo `Code.gs`.
3. Substitua o valor da variável `DRIVE_ID` pelo ID da sua pasta raiz no Drive:
   ```javascript
   var DRIVE_ID = "SEU_DRIVE_ID_AQUI";
