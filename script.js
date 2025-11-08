/* ==========================================================
   SCRIPT.JS - LÓGICA FINAL (COM REMOÇÃO CORRETA DO CACHE)
   ========================================================== */

// --- 1. FUNÇÕES DE ARMAZENAMENTO (MEMÓRIA) ---

/**
 * Pega o carrinho salvo na memória do navegador.
 * @returns {Array} O array do carrinho.
 */
function getCarrinho() {
    const carrinhoJson = localStorage.getItem('carrinhoNaBrassa');
    try {
        return carrinhoJson ? JSON.parse(carrinhoJson) : [];
    } catch (e) {
        console.error("Erro ao ler o localStorage:", e);
        return [];
    }
}

/**
 * Salva o carrinho na memória do navegador e atualiza a tela.
 * @param {Array} carrinho O array do carrinho para salvar.
 */
function salvarCarrinho(carrinho) {
    localStorage.setItem('carrinhoNaBrassa', JSON.stringify(carrinho));
    atualizarContadorCarrinho();
    
    // Se estivermos na página do carrinho, recarrega a lista de itens
    if (document.body.classList.contains('page-carrinho')) {
        carregarCarrinhoNaPagina();
    }
}

// --- 2. FUNÇÕES DE PÁGINA (GERAL) ---

/**
 * Atualiza o contador (bolinha vermelha) em todos os ícones de carrinho.
 */
function atualizarContadorCarrinho() {
    const carrinho = getCarrinho();
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    
    const contadores = document.querySelectorAll('.cart-count'); 
    
    contadores.forEach(contador => {
        contador.textContent = totalItens;
        contador.style.display = totalItens > 0 ? 'block' : 'none';
    });
}

/**
 * (PÁGINA DE DETALHES) Altera a quantidade no input da página de detalhes.
 */
function mudarQuantidade(mudanca) {
    const input = document.getElementById('quantidade');
    if (!input) return;
    let quantidade = parseInt(input.value) || 1;
    quantidade += mudanca;
    if (quantidade < 1) {
        quantidade = 1;
    }
    input.value = quantidade;
}

/**
 * (PÁGINA DE DETALHES) Adiciona um item ao carrinho.
 */
function adicionarAoCarrinho(nome, preco) {
    const quantidadeInput = document.getElementById('quantidade');
    const quantidade = (quantidadeInput && quantidadeInput.value) ? parseInt(quantidadeInput.value) : 1;
    
    const precoFloat = parseFloat(preco);
    const carrinho = getCarrinho();
    const itemExistente = carrinho.find(item => item.nome === nome);

    if (itemExistente) {
        itemExistente.quantidade += quantidade;
    } else {
        carrinho.push({ 
            nome: nome, 
            preco: precoFloat, 
            quantidade: quantidade
        });
    }
    
    salvarCarrinho(carrinho);
    alert(`${quantidade}x ${nome} adicionado(s) ao carrinho!`);
}

// --- 3. FUNÇÕES DA PÁGINA DO CARRINHO ---

/**
 * (PÁGINA DO CARRINHO) Remove um item do carrinho (pelo índice).
 * ESTA É A LÓGICA QUE CORRIGE O BUG.
 */
function removerDoCarrinho(index) {
    if (!confirm("Tem certeza que deseja remover este item?")) {
        return;
    }
    const carrinho = getCarrinho(); // Pega o carrinho do cache
    carrinho.splice(index, 1); // Remove o item da lista
    salvarCarrinho(carrinho); // Salva a NOVA lista (sem o item) no cache
}

/**
 * (PÁGINA DO CARRINHO) Altera a quantidade de um item (pelo índice).
 * ESTA É A LÓGICA QUE CORRIGE O BUG.
 */
function alterarQuantidadeNoCarrinho(index, mudanca) {
    const carrinho = getCarrinho(); // Pega o carrinho do cache
    if (carrinho[index]) {
        carrinho[index].quantidade += mudanca;
        
        // Se a quantidade for 0 ou menos, remove o item
        if (carrinho[index].quantidade <= 0) {
            carrinho.splice(index, 1); 
        }
        salvarCarrinho(carrinho); // Salva a NOVA lista (atualizada) no cache
    }
}

/**
 * (PÁGINA DO CARRINHO) Carrega os itens da memória e os desenha na tela.
 */
function carregarCarrinhoNaPagina() {
    
    const listaContainer = document.getElementById('itens-do-carrinho');
    const totalElemento = document.getElementById('cart-total');
    const carrinhoVazioContainer = document.getElementById('carrinho-vazio-container'); 
    const finalizarBtn = document.getElementById('finalizar-pedido-btn'); 

    if (!listaContainer) return; 

    const carrinho = getCarrinho();
    listaContainer.innerHTML = ''; 
    let totalGeral = 0;

    if (carrinho.length === 0) {
        carrinhoVazioContainer.style.display = 'block'; 
        totalElemento.textContent = formatarBRL(0);
        finalizarBtn.disabled = true;
        finalizarBtn.textContent = 'Carrinho Vazio';
    } else {
        carrinhoVazioContainer.style.display = 'none'; 
        finalizarBtn.disabled = false;
        finalizarBtn.textContent = 'Finalizar Pedido';

        carrinho.forEach((item, index) => {
            const itemTotal = item.preco * item.quantidade;
            totalGeral += itemTotal;
            
            const precoUnitarioFormatado = formatarBRL(item.preco);
            const subTotalFormatado = formatarBRL(itemTotal);

            const itemHTML = `
                <div class="cart-item">
                    <div class="item-details-cart">
                        <h3>${item.nome}</h3>
                        <p style="font-size: 0.9em; color: #666;">Preço Unitário: <span>${precoUnitarioFormatado}</span></p>
                        <p>Total: <span class="discount-price" data-item-total>${subTotalFormatado}</span></p>
                        
                        <div class="quantity-control">
                            <button class="qty-btn" onclick="alterarQuantidadeNoCarrinho(${index}, -1)">-</button>
                            <input type="text" value="${item.quantidade}" class="qty-input" readonly>
                            <button class="qty-btn" onclick="alterarQuantidadeNoCarrinho(${index}, 1)">+</button>
                        </div>
                    </div>
                    
                    <button class="remove-item-btn" onclick="removerDoCarrinho(${index})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            listaContainer.innerHTML += itemHTML;
        });
    }
    
    totalElemento.textContent = formatarBRL(totalGeral);
}

/**
 * (PÁGINA DO CARRINHO) Função para finalizar o pedido (WhatsApp).
 */
function finalizarPedido() {
    const carrinho = getCarrinho();
    const totalGeralText = document.getElementById('cart-total').textContent;
    
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    let listaItens = '';
    carrinho.forEach((item, index) => {
        const totalItem = formatarBRL(item.preco * item.quantidade);
        listaItens += `${index + 1}. (${item.quantidade}x) ${item.nome} - Total: ${totalItem}%0A`;
    });

    const mensagemBase = 
        ` NOVO PEDIDO - NA BRASA 🚨` +
        `*Cliente:* [DIGITE SEU NOME]` +
        `*Turma:* [DIGITE SUA TURMA / APENAS SE FOR DA ESCOLA]` +
        `*Telefone:* [DIGITE SEU TELEFONE]` +
        `*--- ITENS DO PEDIDO ---*` +
        `${listaItens}` +
        `*TOTAL GERAL: ${totalGeralText}*` +
        `Obrigado por comprar conosco!`;

   
    const numeroTelefone = '31989502228'; 
    
    const linkWhatsApp = `https://wa.me/${numeroTelefone}?text=${mensagemBase}`;
    
    window.open(linkWhatsApp, '_blank');
}


// --- 4. INICIALIZAÇÃO (Roda quando a página carrega) ---

document.addEventListener('DOMContentLoaded', () => {
    
    // Atualiza a bolinha vermelha em todas as páginas
    atualizarContadorCarrinho();
    
    // Se estiver na página do carrinho, carrega os itens
    if (document.body.classList.contains('page-carrinho')) {
        carregarCarrinhoNaPagina();
    }
});

// Função utilitária para formatar BRL (necessária no script global)
function formatarBRL(valor) {
    return 'R$' + valor.toFixed(2).replace('.', ',');
}