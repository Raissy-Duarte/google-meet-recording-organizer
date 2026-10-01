/**
 * AUTOMAÇÃO: Organização e extração de gravações de reuniões
 * Descrição: Monitora o Gmail em busca de e-mails de gravações, identifica a reunião
 * no assunto via Regex, localiza a pasta correspondente no Google Drive e copia o vídeo 
 * evitando duplicidades.
 */

function automacaoGravacoesMeet() {
  // CONFIGURAÇÕES (Insira os seus dados aqui)
  var DRIVE_ID = "DRIVE_ID"; 
  var NOME_ETIQUETA = "Gravação Processada";
  
  // Cria a etiqueta no Gmail se ela ainda não existir
  var etiqueta = GmailApp.getUserLabelByName(NOME_ETIQUETA) || GmailApp.createLabel(NOME_ETIQUETA);
  
  var DIAS_PARA_BUSCAR = 2; 
  var dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - DIAS_PARA_BUSCAR);
  var dataCorte = Utilities.formatDate(dataInicio, Session.getScriptTimeZone(), "yyyy/MM/dd");
  
  // Busca e-mails do período com a palavra-chave de reunião e sem a etiqueta de processado
  var query = 'subject:(Anotações:) -label:"' + NOME_ETIQUETA + '" after:' + dataCorte;
  var threads = GmailApp.search(query, 0, 20);
  
  Logger.log("AUTOMAÇÃO INICIADA");
  Logger.log("Buscando e-mails a partir de: " + dataCorte);
  Logger.log("Novas reuniões encontradas: " + threads.length);
  
  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    var ultimaMensagem = messages[messages.length - 1];
    var assunto = ultimaMensagem.getSubject();
    var corpoHtml = ultimaMensagem.getBody(); 
    var dataMensagem = ultimaMensagem.getDate(); // Pega a data exata em que o e-mail foi recebido
    
    var textoCompletoEvento = extrairNomeEntreAspas(assunto);
    if (!textoCompletoEvento) continue;
    
    Logger.log("Processando item: " + textoCompletoEvento);
    var pastaCliente = buscarPastaPorNomeContido(textoCompletoEvento, DRIVE_ID);
    
    if (pastaCliente) {
      var linksDrive = extrairLinksDrive(corpoHtml);
      if (linksDrive.length === 0) continue;
      
      var sucessoCopia = false;
      for (var j = 0; j < linksDrive.length; j++) {
        try {
          var idFicheiro = linksDrive[j];
          var ficheiroOriginal = DriveApp.getFileById(idFicheiro);
          
          var dataFormatada = Utilities.formatDate(dataMensagem, Session.getScriptTimeZone(), "dd/MM/yyyy");
          var nomeArquivoEsperado = "Gravação Reunião - " + textoCompletoEvento + " - " + dataFormatada;
          
          // Prevenção de duplicidade
          var arquivosExistentes = pastaCliente.getFilesByName(nomeArquivoEsperado);
          if (arquivosExistentes.hasNext()) {
            Logger.log("Aviso: O arquivo '" + nomeArquivoEsperado + "' já existe na pasta. Cópia ignorada.");
            sucessoCopia = true;
            continue;
          }
          
          // Cópia para o Drive 
          var novaCopia = ficheiroOriginal.makeCopy(pastaCliente);
          novaCopia.setName(nomeArquivoEsperado);
          
          // Ajuste de permissão de visualização
          try {
            novaCopia.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch (e) {
            novaCopia.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
          }
          
          Logger.log("Vídeo '" + novaCopia.getName() + "' copiado com sucesso.");
          sucessoCopia = true;
        } catch (erro) {
          Logger.log("Erro no arquivo ID " + linksDrive[j] + ": " + erro.message);
        }
      }
      
      if (sucessoCopia) {
        threads[i].addLabel(etiqueta); 
        threads[i].markRead();        
        Logger.log("E-mail finalizado e etiquetado.");
      }
      
    } else {
      Logger.log("Aviso: Pasta para '" + textoCompletoEvento + "' não encontrada no Drive.");
    }
  }
  Logger.log("AUTOMAÇÃO CONCLUÍDA");
}

function extrairNomeEntreAspas(assunto) {
  var match = assunto.match(/"([^"]+)"/);
  return match ? match[1] : null;
}

function buscarPastaPorNomeContido(textoEvento, idDrive) {
  var driveCompartilhado = DriveApp.getFolderById(idDrive);
  var busca = driveCompartilhado.searchFolders("trashed = false");
  var textoEventoMinusculo = textoEvento.toLowerCase();
  
  var termosGenericos = ["checklist", "alinhamento", "reunião", "reuniao", "geral", "projeto"];
  
  var melhorPasta = null;
  var maiorComprimentoNome = 0;
  
  while (busca.hasNext()) {
    var pasta = busca.next();
    var nomeDaPastaMinusculo = pasta.getName().toLowerCase().trim();
    
    if (nomeDaPastaMinusculo.length <= 3 || termosGenericos.indexOf(nomeDaPastaMinusculo) !== -1) {
      continue; 
    }
    
    if (textoEventoMinusculo.indexOf(nomeDaPastaMinusculo) !== -1) {
      if (nomeDaPastaMinusculo.length > maiorComprimentoNome) {
        maiorComprimentoNome = nomeDaPastaMinusculo.length;
        melhorPasta = pasta;
      }
    }
  }
  return melhorPasta;
}

function extrairLinksDrive(html) {
  var ids = [];
  var regexStandard = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{25,50})/g;
  var regexOpenId = /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]{25,50})/g;
  
  var match;
  while ((match = regexStandard.exec(html)) !== null) {
    if (ids.indexOf(match[1]) === -1) ids.push(match[1]);
  }
  while ((match = regexOpenId.exec(html)) !== null) {
    if (ids.indexOf(match[1]) === -1) ids.push(match[1]);
  }
  
  return ids;
}
