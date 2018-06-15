const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");

// s0m3 collections

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.events = new Discord.Collection();

// Utils & config requiring

const utils = require("./utils/utils")
const config = require("./utils/config.json");

// Handlers

fs.readdir("./events/", (err, files) => {
  if (err) return console.error(err);
  files.forEach(file => {
    let eventFunction = require(`./src/events/${file}`);
    let eventStart = eventFunction.run.bind(null, client);
    let eventName = file.split(".")[0];
    client.events.set(eventName, eventStart)
    client.on(eventName, (...args) => eventFunction.run(client, utils, ...args));
  });
});

fs.readdir('./src/commands/', (err, files) => {
    if (err)
        console.error(err);
    let jsfiles = files.filter(f => f.split('.').pop() === 'js');
    if (jsfiles.length <= 0) {
        utils.uCError('No commands found.')
    }
    jsfiles.forEach(f => {
        let props = require(`./src/commands/${ f }`);
        props.fileName = f;
        client.commands.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
            client.aliases.set(alias, props.help.name);
        });
    });
});

// Message Event (here because something could happen with event handler.)

client.on("message", message => {
  if (message.author.bot) return;
  if(message.content.indexOf(config.prefix) !== 0) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if(client.aliases.has(command)) command = client.commands.get(client.aliases.get(command))

  if(client.commands.get(command).config.restricted == true) {
    if(message.author.id !== config.ownerID) return utils.errorEmbed(message, ':warning: This command is restricted only to bot owners. :warning:')
  }

  if(client.commands.get(command).args == true) {
    if(!args[0]) return utils.errorEmbed(message, `Invalid arguments. Use: \`${config.prefix + client.commands.get(command).help.name + 'help'}\``)
  }

  try {
    let commandFile = require(`./src/commands/${command}.js`);
    commandFile.run(client, message, args, utils);
  } catch (err) {
    console.error(err);
  }
});


client.login(config.token /* If your token is stored in envorniment values use "process.env.TOKEN" */ );