const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ==========================================
// 🚨 COLOQUE SEU TOKEN ABAIXO ENTRE AS ASPAS
// ==========================================
const MEU_TOKEN = 'COLE_SEU_TOKEN_AQUI'; 

client.once('ready', () => {
    console.log(`✅ BOT FORÇADO ONLINE: ${client.user.tag}`);
    console.log('🚀 Sistema de Vendas e Tickets Carregado!');
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Comando para gerar o painel principal
    if (message.content === '!setup') {
        const embed = new EmbedBuilder()
            .setTitle('🛒 Francisco Ikaro Store - Atendimento')
            .setDescription('Seja bem-vindo! Clique no botão abaixo para o que deseja:')
            .setColor('#2f3136')
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'Atendimento exclusivo Ikaro Store' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_comprar')
                    .setLabel('🛒 Comprar Produto')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('btn_ticket')
                    .setLabel('📩 Abrir Ticket / Suporte')
                    .setStyle(ButtonStyle.Primary)
            );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // Lógica de Compras
    if (interaction.customId === 'btn_comprar') {
        return interaction.reply({ 
            content: '💎 **Para comprar:** Me chame no privado ou aguarde um administrador marcar você aqui!', 
            ephemeral: true 
        });
    }

    // Lógica de Abrir Ticket
    if (interaction.customId === 'btn_ticket') {
        const nomeCanal = `ticket-${interaction.user.username}`;
        
        // Verifica se já tem um canal com esse nome
        const canalExiste = interaction.guild.channels.cache.find(c => c.name === nomeCanal);
        if (canalExiste) {
            return interaction.reply({ content: `❌ Você já tem um ticket aberto em ${canalExiste}`, ephemeral: true });
        }

        const canal = await interaction.guild.channels.create({
            name: nomeCanal,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
                },
            ],
        });

        const embedTicket = new EmbedBuilder()
            .setTitle('🎫 Novo Ticket de Suporte')
            .setDescription(`Olá ${interaction.user}, explique sua dúvida aqui e aguarde o suporte.`)
            .setColor('#5865F2')
            .setTimestamp();

        const btnFechar = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('fechar_ticket')
                .setLabel('Fechar Ticket')
                .setStyle(ButtonStyle.Danger)
        );

        await canal.send({ embeds: [embedTicket], components: [btnFechar] });
        await interaction.reply({ content: `✅ Seu ticket foi criado em ${canal}`, ephemeral: true });
    }

    // Fechar Ticket
    if (interaction.customId === 'fechar_ticket') {
        await interaction.reply('🔒 O ticket será fechado em 5 segundos...');
        setTimeout(() => interaction.channel.delete(), 5000);
    }
});

// LOGIN COM TRATAMENTO DE ERRO
client.login(MEU_TOKEN).catch(err => {
    console.error('❌ ERRO AO LOGAR NO DISCORD (TOKEN ERRADO):', err.message);
});
