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
    console.log(`✅ BOT ONLINE: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!setup') {
        const embed = new EmbedBuilder()
            .setTitle('🛒 Francisco Ikaro Store')
            .setDescription('Escolha uma opção abaixo para atendimento:')
            .setColor('#2f3136')
            .setThumbnail(client.user.displayAvatarURL());

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_comprar')
                .setLabel('🛒 Comprar Produto')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('btn_ticket')
                .setLabel('📩 Abrir Ticket')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'btn_comprar') {
        return interaction.reply({ content: '💎 Aguarde um vendedor entrar em contato!', ephemeral: true });
    }

    if (interaction.customId === 'btn_ticket') {
        const channelName = `ticket-${interaction.user.username}`;
        const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
        });

        const btnClose = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger)
        );

        await channel.send({ content: `🎫 Olá ${interaction.user}, suporte em breve!`, components: [btnClose] });
        await interaction.reply({ content: `✅ Ticket criado em ${channel}`, ephemeral: true });
    }

    if (interaction.customId === 'close_ticket') {
        await interaction.reply('🔒 Fechando em 5 segundos...');
        setTimeout(() => interaction.channel.delete(), 5000);
    }
});

client.login(MEU_TOKEN);
