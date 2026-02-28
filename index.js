const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js'); // Ajustado para require

const client = new Client({ // Ajustado para new Client
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// ================== CONFIGURAÇÕES ==================
// IMPORTANTE: Deixe SEM ASPAS para o Railway puxar o segredo das Variables
const TOKEN = process.env.TOKEN; 
const SEU_ID_ADM = '1395856611658043576';
const FOTO_VORTEX = 'https://i.imgur.com/8N4N3u8.png';

const TABELA_PIX = {
    "7.00": "00020126420014BR.GOV.BCB.PIX0120lealikaro9@gmail.com52040000530398654047.005802BR5925Francisco Ikaro Leal Pess6009SAO PAULO62140510zbg8O0noZT630442E8",
    "19.00": "00020126420014BR.GOV.BCB.PIX0120lealikaro9@gmail.com520400005303986540519.005802BR5925Francisco Ikaro Leal Pess6009SAO PAULO62140510EseuSC4L2t6304E569",
    "45.00": "00020126420014BR.GOV.BCB.PIX0120lealikaro9@gmail.com520400005303986540545.005802BR5925Francisco Ikaro Leal Pess6009SAO PAULO62140510YQMtyfXQx16304DE61"
};

// ================== BOT ONLINE ==================
client.once('ready', () => console.log('✅ Bot Online! Francisco Ikaro Store Pronto.'));

// ================== PAINEL DE VENDAS E TICKETS ==================
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!painel') {
        const embedLoja = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🎁 Bot de Filas - Nulla Store')
            .setDescription('* Filas 1x1 a 5x5.\n* Sistema de mediador e Streamers.\n* Painel de Pix e perfil.')
            .setImage('https://i.imgur.com/vHqY7Z9.png')
            .setFooter({ text: 'Nulla Store' });

        const botaoCompra = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('comprar_bot').setLabel('Comprar').setEmoji('💸').setStyle(ButtonStyle.Success)
        );
        await message.channel.send({ embeds: [embedLoja], components: [botaoCompra] });
    }

    if (message.content === '!painel_ticket') {
        const embedTicket = new EmbedBuilder()
            .setColor(0xFFB400)
            .setTitle('🎫 Central de Atendimento')
            .setDescription('Precisa de ajuda? Escolha uma categoria abaixo para abrir um ticket.');

        const menuTicket = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('selecionar_ticket')
                .setPlaceholder('📋 Selecione o motivo do contato')
                .addOptions([
                    { label: '⚒️ Suporte técnico', value: 'suporte' },
                    { label: '💰 Dúvida sobre planos', value: 'duvida_planos' },
                    { label: '📄 Problema com pagamento', value: 'problema_pagamento' },
                    { label: '❓ Outro', value: 'outro' },
                ])
        );

        await message.channel.send({ embeds: [embedTicket], components: [menuTicket] });
    }
});

// ================== INTERACTIONS ==================
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'comprar_bot') {
        const menuPlanos = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('selecionar_plano')
                .setPlaceholder('📋 Escolha seu plano')
                .addOptions([
                    { label: 'Semanal - R$ 7,00', value: '7.00', emoji: '⏳' },
                    { label: 'Mensal - R$ 19,00', value: '19.00', emoji: '🗓️' },
                    { label: 'Trimestral - R$ 45,00', value: '45.00', emoji: '🏆' },
                ])
        );
        return interaction.reply({ content: 'Selecione o plano:', components: [menuPlanos], ephemeral: true });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'selecionar_plano') {
        await interaction.deferReply({ ephemeral: true });
        const valor = interaction.values[0];
        const pixCopiaECola = TABELA_PIX[valor];
        const nomePlano = valor === "7.00" ? "Semanal" : (valor === "19.00" ? "Mensal" : "Trimestral");
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(pixCopiaECola)}`;

        const channel = await interaction.guild.channels.create({
            name: `🛒-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: SEU_ID_ADM, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ],
        });

        const embedCheckout = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`🛒 Pagamento — Bot Completo ${nomePlano.toUpperCase()}`)
            .setThumbnail(FOTO_VORTEX)
            .setDescription(`Pagamento Instantâneo via PIX\n\n🧊 **Plano:** Orbital\n🕒 **Período:** ${nomePlano}\n💵 **Valor:** R$ ${valor.replace('.', ',')}\n\nCopie o código abaixo e cole no app do seu banco para pagar.`)
            .setImage(qrCodeUrl);

        const botoes = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('copy_pix').setLabel('Copiar Código PIX').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('confirmar_pagamento').setLabel('Confirmar Pagamento').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cancelar_compra').setLabel('Cancelar').setStyle(ButtonStyle.Danger)
        );

        const msgOriginal = await channel.send({ content: `${interaction.user}`, embeds: [embedCheckout], components: [botoes] });
        await interaction.editReply({ content: `✅ Carrinho criado: ${channel}` });

        const collector = msgOriginal.createMessageComponentCollector();
        collector.on('collect', async i => {
            if (i.customId === 'copy_pix' && i.user.id === interaction.user.id) {
                await i.reply({ content: `${pixCopiaECola}`, ephemeral: true });
            }
            if (i.customId === 'cancelar_compra' && i.user.id === interaction.user.id) {
                await channel.delete().catch(() => {});
            }
            if (i.customId === 'confirmar_pagamento' && i.user.id === SEU_ID_ADM) {
                await msgOriginal.delete().catch(() => {});
                await channel.send({ content: `✅ **Pagamento confirmado!** 🎉` });
            }
        });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'selecionar_ticket') {
        const channel = await interaction.guild.channels.create({
            name: `🎫-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: SEU_ID_ADM, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ],
        });
        await channel.send({ content: `${interaction.user} Ticket aberto! Aguarde suporte.` });
        await interaction.reply({ content: `✅ Ticket criado: ${channel}`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'cancel_ticket') {
        await interaction.channel.delete().catch(() => {});
    }
});

// FINAL: Sem aspas para pegar o valor real da variável
client.login("TOKEN");
