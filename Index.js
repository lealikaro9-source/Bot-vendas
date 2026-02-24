const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType, PermissionsBitfield, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Collection } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers, // ESSENCIAL PARA DETECTAR ENTRADA
        GatewayIntentBits.GuildInvites  // ESSENCIAL PARA LER CONVITES
    ],
});

// === CONFIGURAÇÕES ===
const ID_CARGO_SUPORTE = "ID_DO_SUPORTE"; 
const ID_CARGO_ANALISTA = "ID_DO_ANALISTA"; 
const ID_DONO_SISTEMA = "SEU_ID_AQUI"; 
const TAXA_ADM = 0.10; 
const ID_CANAL_CONVITES = "ID_DO_CANAL_SEUS_CONVITES"; // <--- CERTIFIQUE-SE DE COLOCAR O ID AQUI

let filas = {}; 
let filaMediadores = []; 
let confirmacoesPartida = new Map(); 
let bancoDadosPix = new Map(); 
let ticketsAssumidos = new Map();
let mensagensAnuncio = []; 
const guildInvites = new Map(); // Armazena os convites

client.once('ready', async () => { 
    console.log('✅ SISTEMA AURA ATIVO!'); 
    
    // Mapeia convites de todos os servidores ao ligar
    for (const [guildId, guild] of client.guilds.cache) {
        try {
            const firstInvites = await guild.invites.fetch();
            guildInvites.set(guildId, new Map(firstInvites.map((invite) => [invite.code, invite.uses])));
        } catch (e) { console.log(`Erro ao carregar convites da guild ${guildId}`); }
    }

    setInterval(async () => {
        if (filaMediadores.length > 0) {
            for (const msg of mensagensAnuncio) {
                try { await msg.delete(); } catch (e) {}
            }
            mensagensAnuncio = [];
            const canaisFila = ['1v1-mobile', '1v1-emulador', '2v2-mobile', '2v2-emulador', 'tatico']; 
            client.channels.cache.forEach(async (canal) => {
                if (canaisFila.some(nome => canal.name.toLowerCase().includes(nome)) && canal.type === ChannelType.GuildText) {
                    try {
                        const msg = await canal.send('# 🟢 FILAS ON-LINE\n# ✅ MEDIADORES DISPONÍVEIS');
                        mensagensAnuncio.push(msg);
                    } catch (e) {}
                }
            });
        }
    }, 300000); 
});

// ATUALIZA QUANDO ALGUÉM ENTRA
client.on('guildMemberAdd', async (member) => {
    const cachedInvites = guildInvites.get(member.guild.id);
    const newInvites = await member.guild.invites.fetch();
    
    const invite = newInvites.find(i => i.uses > (cachedInvites.get(i.code) || 0));
    
    // Atualiza o cache para a próxima pessoa
    guildInvites.set(member.guild.id, new Map(newInvites.map((invite) => [invite.code, invite.uses])));

    if (invite) {
        const canalLog = member.guild.channels.cache.get(ID_CANAL_CONVITES);
        if (canalLog) {
            const embedInvite = new EmbedBuilder()
                .setTitle(`⚡ ENTROU NA ORG MILOKA ⚡`)
                .setColor('#ff9900')
                .setDescription(
                    `🔥 | Convidado: <@${member.id}>\n` +
                    `🔥 | Indicador: <@${invite.inviter.id}>\n` +
                    `🔥 | Indicou: ${invite.uses} invites.`
                );
            canalLog.send({ embeds: [embedInvite] });
        }
    }
});

// === FUNÇÕES DE EMBED (MANTIDAS) ===
function criarEmbedAdm() {
    const lista = filaMediadores.length > 0 ? filaMediadores.map((id, index) => `**${index + 1}º.** <@${id}>`).join('\n') : ' ';
    return new EmbedBuilder().setTitle('Entrar em espera...').setColor('#2b2d31').setDescription(`**Mediadores presentes:**\n${lista}`).setFooter({ text: 'Aura System' });
}

function criarEmbedFila(categoria, modo, valor) {
    const idFila = `${categoria}_${modo}_${valor}`;
    if (!filas[idFila]) filas[idFila] = [];
    const listaJogadores = filas[idFila].length > 0 ? filas[idFila].map((user, index) => `**${index + 1}º** <@${user.id}> | \`${user.modo}\``).join('\n') : '*Vazia*';
    return new EmbedBuilder().setTitle(`${modo} | ${categoria.toUpperCase()} | AURA`).setColor('#7000FF').addFields({ name: '💰 Valor:', value: `R$ ${valor}`, inline: true }, { name: '👤 Jogadores na Fila:', value: listaJogadores, inline: false });
}

// === COMANDO .AUX ===
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.toLowerCase() === '.aux') {
        if (!message.channel.isThread()) return;
        const rowAux = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_auxiliar')
                .setPlaceholder('Painel Auxiliar do Mediador')
                .addOptions([
                    { label: 'Escolher Vencedor', value: 'escolher_vencedor', emoji: '🏆' },
                    { label: 'Fechar Sala', value: 'fechar_sala_adm', emoji: '🗑️' }
                ])
        );
        await message.channel.send({ 
            embeds: [new EmbedBuilder().setTitle("O que deseja fazer?").setColor("#2b2d31")], 
            components: [rowAux] 
        });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isModalSubmit() && interaction.customId === 'modal_config_pix') {
        const dados = { chave: interaction.fields.getTextInputValue('chave_pix'), modelo: interaction.fields.getTextInputValue('modelo_pix'), nome: interaction.fields.getTextInputValue('nome_pix'), qrcode: interaction.fields.getTextInputValue('qr_pix') || "Não configurado" };
        bancoDadosPix.set(interaction.user.id, dados);
        return interaction.reply({ content: "✅ Seu PIX foi salvo!", ephemeral: true });
    }

    if (interaction.customId === 'verificar_status_pix') {
        const pix = bancoDadosPix.get(interaction.user.id);
        if (!pix) return interaction.reply({ content: "❌ você ainda não configurou seu PIX.", ephemeral: true });
        const embedStatus = new EmbedBuilder().setTitle('📌 Seus Dados Salvos').setColor('#2b2d31').setDescription(`Aqui estão os dados que os jogadores receberão:`).addFields({ name: '👤 Nome:', value: pix.nome, inline: true }, { name: '📂 Tipo:', value: pix.modelo, inline: true }, { name: '🔑 Chave:', value: `\`${pix.chave}\``, inline: false }, { name: '🖼️ QR Code:', value: pix.qrcode, inline: false });
        return interaction.reply({ embeds: [embedStatus], ephemeral: true });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_auxiliar') {
        const escolha = interaction.values[0];
        const dados = confirmacoesPartida.get(interaction.channel.id);
        if (escolha === 'fechar_sala_adm') {
            await interaction.reply("⚠️ Fechando sala em 3 segundos...");
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
        if (escolha === 'escolher_vencedor') {
            if (!dados) return interaction.reply({ content: "❌ Erro: Partida não registrada.", ephemeral: true });
            const rowVence = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`venceu_${dados.jogadores[0]}`).setLabel(`Vencedor: Jogador 1`).setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`venceu_${dados.jogadores[1]}`).setLabel(`Vencedor: Jogador 2`).setStyle(ButtonStyle.Success)
            );
            await interaction.reply({ content: "Quem venceu?", components: [rowVence], ephemeral: true });
        }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_atendimento') {
        await interaction.deferReply({ ephemeral: true });
        const tipoTicket = interaction.values[0]; 
        const canalAlvo = interaction.guild.channels.cache.find(c => c.name.toLowerCase().includes(tipoTicket.toLowerCase()) && c.type === ChannelType.GuildText);
        if (!canalAlvo) return interaction.editReply({ content: `❌ Canal não encontrado.` });
        const thread = await canalAlvo.threads.create({ name: `📩・${tipoTicket}-${interaction.user.username}`, autoArchiveDuration: 1440, type: ChannelType.PrivateThread });
        await thread.members.add(interaction.user.id);
        const rowBotoes = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('finalizar_ticket').setLabel('Finalizar ticket').setEmoji('✅').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('assumir_ticket').setLabel('Assumir Ticket').setEmoji('🛡️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('sair_ticket').setLabel('Sair Ticket').setEmoji('❌').setStyle(ButtonStyle.Danger)
        );
        await thread.send({ content: `# marque algum suporte ou dono @ikaro\n@suporte @analista`, embeds: [new EmbedBuilder().setTitle('PAINEL DE ATENDIMENTO | AURA').setColor('#2b2d31').setDescription(`Seja bem-vindo ao seu ticket de **${tipoTicket}**, o que deseja?`)], components: [rowBotoes] });
        return interaction.editReply({ content: `✅ Ticket aberto: ${thread}` });
    }

    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('venceu_')) {
        const vId = interaction.customId.split('_')[1];
        await interaction.channel.send(`# 🏆 VENCEDOR\nO jogador <@${vId}> foi o vencedor!`);
        return interaction.reply({ content: "Vencedor anunciado.", ephemeral: true });
    }

    if (interaction.customId === 'assumir_ticket') {
        const jaAssumido = ticketsAssumidos.get(interaction.channel.id);
        if (jaAssumido) return interaction.reply({ content: `❌ Este ticket já foi assumido por <@${jaAssumido}>`, ephemeral: true });
        ticketsAssumidos.set(interaction.channel.id, interaction.user.id);
        return interaction.reply({ content: `🛡️ <@${interaction.user.id}> assumiu este ticket.` });
    }

    if (interaction.customId === 'sair_ticket' || interaction.customId === 'finalizar_ticket') {
        await interaction.reply({ content: "👋 Fechando ticket..." });
        ticketsAssumidos.delete(interaction.channel.id);
        return setTimeout(() => interaction.channel.delete().catch(() => {}), 1500);
    }

    if (interaction.customId === 'cancelar_partida') {
        await interaction.reply({ content: "⚠️ Partida cancelada. Fechando sala..." });
        return setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
    }

    if (interaction.customId === 'confirmar_inicio') {
        let dados = confirmacoesPartida.get(interaction.channel.id);
        if (!dados || !dados.jogadores.includes(interaction.user.id)) return;
        if (dados.confirmados.includes(interaction.user.id)) return interaction.reply({ content: "✅ Já confirmou!", ephemeral: true });
        dados.confirmados.push(interaction.user.id);
        if (dados.confirmados.length === 2) {
            const mensagens = await interaction.channel.messages.fetch();
            await interaction.channel.bulkDelete(mensagens).catch(() => {});
            const pixM = bancoDadosPix.get(dados.mediador) || { chave: "Vazio", nome: "Vazio" };
            const vFinal = (parseFloat(dados.valor.replace(',', '.')) + TAXA_ADM).toFixed(2).replace('.', ',');
            const embedFinal = new EmbedBuilder().setTitle('Partida Confirmada!').setColor('#f1c40f').addFields({ name: '🎮 Modo:', value: `${dados.modo}`, inline: false }, { name: '💰 Valor:', value: `R$ ${vFinal}`, inline: false }, { name: '👤 Jogadores:', value: `<@${dados.jogadores[0]}> <@${dados.jogadores[1]}>`, inline: false }, { name: '↪️ Mediador:', value: `<@${dados.mediador}>`, inline: false });
            await interaction.channel.send({ content: `<@${dados.jogadores[0]}> <@${dados.jogadores[1]}> <@${dados.mediador}>`, embeds: [embedFinal] });
            await interaction.channel.send({ content: `**Valor a pagar: R$ ${vFinal}**\n**Nome: ${pixM.nome}**\n**Chave:** \`${pixM.chave}\`` });
        } else { await interaction.reply({ content: "✅ Você confirmou!", ephemeral: false }); }
    }

    if (interaction.customId === 'configurar_pix_btn') {
        const modal = new ModalBuilder().setCustomId('modal_config_pix').setTitle('🔑 – Configurar seu PIX');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('chave_pix').setLabel('Chave PIX').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('modelo_pix').setLabel('Tipo').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nome_pix').setLabel('Nome Completo').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('qr_pix').setLabel('Link QR Code').setStyle(TextInputStyle.Short).setRequired(false))
        );
        return await interaction.showModal(modal);
    }

    try {
        if (interaction.customId === 'entrar_mediacao' || interaction.customId === 'sair_mediacao') {
            if (interaction.customId === 'entrar_mediacao') { if (!filaMediadores.includes(interaction.user.id)) filaMediadores.push(interaction.user.id); }
            else { filaMediadores = filaMediadores.filter(id => id !== interaction.user.id); }
            return interaction.update({ embeds: [criarEmbedAdm()] });
        }
        const partes = interaction.customId.split('_');
        if (partes[0] === 'entrar' || partes[0] === 'sair') {
            const [acao, cat, mod, val] = partes; 
            const idF = `${cat}_${mod}_${val}`;
            if (!filas[idF]) filas[idF] = [];
            if (acao === 'entrar') {
                if (!filaMediadores.length) return interaction.reply({ content: "Sem Mediadores!", ephemeral: true });
                if (filas[idF].some(p => p.id === interaction.user.id)) return interaction.reply({ content: "Já está na fila!", ephemeral: true });
                filas[idF].push({ id: interaction.user.id, modo: mod });
                if (filas[idF].length >= 2) {
                    const jogs = [filas[idF][0].id, filas[idF][1].id]; 
                    filas[idF] = [];
                    await interaction.update({ embeds: [criarEmbedFila(cat, mod, val)] });
                    await criarSalaAposta(interaction, jogs, val, mod, cat);
                } else { await interaction.update({ embeds: [criarEmbedFila(cat, mod, val)] }); }
            } else if (acao === 'sair') {
                if (!filas[idF].some(p => p.id === interaction.user.id)) return interaction.reply({ content: "Você não está nesta fila!", ephemeral: true });
                filas[idF] = filas[idF].filter(p => p.id !== interaction.user.id);
                await interaction.update({ embeds: [criarEmbedFila(cat, mod, val)] });
            }
        }
    } catch (e) {}
});

async function criarSalaAposta(interaction, jogadores, valor, modo, categoria) {
    try {
        const canalDestino = interaction.guild.channels.cache.find(c => c.name.includes('sua-fila-aqui'));
        const mediador = filaMediadores.shift(); filaMediadores.push(mediador);
        const thread = await canalDestino.threads.create({ name: `AURA-${modo}-${valor}`, type: ChannelType.PrivateThread });
        confirmacoesPartida.set(thread.id, { jogadores: jogadores, confirmados: [], mediador: mediador, valor: valor, modo: modo });
        for (const id of jogadores) await thread.members.add(id);
        await thread.members.add(mediador);
        const vFinalSala = (parseFloat(valor.replace(',', '.')) + TAXA_ADM).toFixed(2).replace('.', ',');
        const embedSala = new EmbedBuilder().setTitle('SALA DE PARTIDA').setColor('#7000FF').addFields({ name: '🛡️ Mediador:', value: `<@${mediador}>` }, { name: '⚔️ Jogadores:', value: jogadores.map(id => `<@${id}>`).join(' vs ') }, { name: '💰 Valor cada:', value: `R$ ${vFinalSala}` });
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('confirmar_inicio').setLabel('Confirmar').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId('cancelar_partida').setLabel('Cancelar').setStyle(ButtonStyle.Danger));
        await thread.send({ content: `🔔 <@${mediador}>`, embeds: [embedSala], components: [row] });
    } catch (e) {}
}

client.login('MTQ3MzQwODMxOTQ1OTY4ODY4MQ.GS0Nej.9qMgdkO3vOyJRllLlC7g2Cf5fc3XdQA5Q47jqk');
