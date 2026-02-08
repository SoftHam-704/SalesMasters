# 🚀 GUIA RÁPIDO: Como Executar o Script no pgAdmin

**Data:** 28/01/2026  
**Tempo estimado:** 2 minutos  
**Dificuldade:** ⭐ Fácil

---

## 📋 **PASSO A PASSO**

### **1. Abrir o pgAdmin**

- Localize o ícone do **pgAdmin 4** no menu Iniciar ou desktop
- Clique para abrir

---

### **2. Conectar ao Servidor**

1. No painel esquerdo, expanda **Servers**
2. Localize o servidor **10.40.40.99** (ou o nome configurado)
3. Se pedir senha, digite a senha do usuário `postgres`

---

### **3. Selecionar o Banco de Dados**

1. Expanda o servidor conectado
2. Expanda **Databases**
3. Localize e clique em **basesales**

---

### **4. Abrir o Query Tool**

**Opção A:** Menu
- Menu superior: **Tools** → **Query Tool**

**Opção B:** Botão direito
- Clique com botão direito em **basesales**
- Selecione **Query Tool**

**Opção C:** Atalho
- Com **basesales** selecionado, pressione **Alt + Shift + Q**

---

### **5. Carregar o Script SQL**

**Opção A:** Arrastar e soltar (MAIS FÁCIL)
1. Localize o arquivo `FIX_SEQUENCES_CAD_PROD_ALL_SCHEMAS.sql` na pasta que abri
2. **Arraste** o arquivo para dentro do Query Tool
3. O conteúdo será carregado automaticamente

**Opção B:** Menu Arquivo
1. No Query Tool, clique no menu **File** → **Open**
2. Navegue até: `e:\Sistemas_ia\SalesMasters\scripts_bancodedados\`
3. Selecione: `FIX_SEQUENCES_CAD_PROD_ALL_SCHEMAS.sql`
4. Clique em **Open**

---

### **6. Executar o Script**

1. Com o script carregado no Query Tool
2. Clique no botão **▶ Execute/Refresh** (ou pressione **F5**)
3. Aguarde a execução (30-60 segundos)

---

### **7. Verificar Resultados**

Na parte inferior do Query Tool, você verá a aba **Messages**.

**✅ Resultado esperado:**

```
NOTICE:  
======================================================================
📊 DIAGNÓSTICO: Comparando MAX(pro_id) com valor atual da sequence
======================================================================

Schema          | MAX(pro_id) | Sequence Atual | Status
----------------|-------------|----------------|------------------
markpress       | 5234        | 5235           | ✅ OK
brasil_wl       | 3891        | 3450           | ❌ DESATUALIZADA!
public          | 7823        | 7100           | ❌ DESATUALIZADA!
...

======================================================================
🔧 AJUSTANDO SEQUENCES NOS SCHEMAS
======================================================================
...
✅ Sequence brasil_wl ajustada para: 3892
✅ Sequence public ajustada para: 7824
✅ Sequence rimef ajustada para: 2342
...
======================================================================
✅ PROCESSAMENTO CONCLUÍDO
======================================================================
```

---

### **8. Confirmar Sucesso**

No final da aba **Messages**, procure por:

```
✅ Script de ajuste de sequences executado com sucesso!
```

E/ou:

```
✅ PROCESSAMENTO CONCLUÍDO
```

---

## ⚠️ **POSSÍVEIS PROBLEMAS**

### Erro: "password authentication failed"
**Solução:** Verifique a senha do usuário `postgres`

### Erro: "database basesales does not exist"
**Solução:** Confirme o nome correto do banco de dados

### Erro: "permission denied"
**Solução:** Execute o pgAdmin como Administrador

### Script não carrega
**Solução:** 
- Copie todo o conteúdo do arquivo SQL
- Cole diretamente no Query Tool
- Execute com F5

---

## 🎯 **APÓS A EXECUÇÃO**

### O que aconteceu?

✅ Todas as sequences foram ajustadas para `MAX(pro_id) + 1`  
✅ Os schemas estão sincronizados com o modelo do markpress  
✅ Importações de produtos não terão mais erro de "duplicate key"  

### Próximo passo

Teste a importação de uma tabela de preços:
1. Abra o sistema SalesMasters
2. Vá para **Importação de Tabelas de Preço**
3. Selecione um arquivo
4. Clique em **Importar**
5. ✅ Deve funcionar sem erros!

---

## 📞 **PRECISA DE AJUDA?**

Se encontrar qualquer erro durante a execução:
1. **Copie** a mensagem de erro completa
2. **Tire um print** da tela
3. **Me informe** para que eu possa ajustar

---

**Boa sorte! 🚀**
