const { glob } = require("glob");
const { Perms } = require('../validation/perms')
const { promisify } = require("util");
const { Client } = require("discord.js");
const mongoose = require("mongoose");
const PG = promisify(glob);
const Ascii = require("ascii-table")



/**
 * @param {Client} client
 */
module.exports = async (client) => {
    

    const eventFiles = await PG(`${process.cwd()}/events/*.js`);
    eventFiles.map((value) => require(value));

    const Table = new Ascii("Command Loaded")
    const CommandsArray = [];
    (await PG(
        `${process.cwd()}/SlashCommands/*/*.js`
    )).map( async (file) => {
      const command = require(file);

        if (!command.name) return Table.addRow(file.split("/")[7], "❌ Failed", "Missing a name.");
        if (!command.description) return Table.addRow(command.name, "❌ Failed", "Missing a description.");
        if (command.userPermissions) {
            if (Perms.includes(command.userPermissions))
                command.defaultPermission = false;
                else
                return Table.addRow(command.name, "❌ Failed", "Invalid permissions supplied!")

        }
        


        client.commands.set(command.name, command);
       
        // const evalcmd = await client.commands.find(c => c.name === 'eval');
        // evalcmd.defaultPermission = false;
        
        CommandsArray.push(command);
      
        await Table.addRow(command.name, "✅ Successful")
    });
    console.log(Table.toString());


    client.on("ready", async () => {
        const MainGuild = client.guilds.cache
        .get("930503731974385694")
            
         MainGuild.commands.set(CommandsArray).then(async(command) => {
            
            const Roles = (commandName) => {
                const cmdPerms = CommandsArray.find((c) => c.name === commandName).userPermissions;
                if(!cmdPerms) return null;
                return MainGuild.roles.cache.filter(r => r.permissions.has(cmdPerms));
            };
            const fullPermissions = command.reduce((accumulator, r) => {
                const roles = Roles(r.name)
                if(!roles) return accumulator;

                const permissions = roles.reduce((a, r) => {
                    return [
                        ...a,
                        {
                            id: r.id,
                            type: "ROLE",
                            permission: true,
                        }
                    ]
                }, [])
                return [
                    ...accumulator,
                    {
                        id: r.id,
                        permissions,
                    }
                ]
            }, []);
          await  MainGuild.commands.permissions.set({ fullPermissions })
          
          
    
//           const ownerperms = [
//               {
//                   id: '593696963061481532',
//                   type: 'USER',
//                   permission: true,
//               },
//               {
//                   id: '689173890450194434',
//                   type: 'USER',
//                   permission: true,
//               }
//           ];
          
//    await evalcmd.permissions.set({ permissions: ownerperms });

        });
    });
    const mongooseConnectionString = process.env.mongo
    if (!mongooseConnectionString) return;
     mongoose.connect(mongooseConnectionString).then(() => console.log('Connected to mongodb'));
};
