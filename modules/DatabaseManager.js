const Config = require('./utils/Config');
const sql = require("sqlite");
sql.open("./modules/data/database.sqlite");

class DatabaseManager {

    /**
     * This function analyses the passed database and check if it is valid. if no : create the database
     * @param sql - a sqlite file.
     */
    checkDatabaseValidity(sql) {
        console.log('Checking Database ...');
        sql.get(`SELECT version FROM database`).catch(() => {
            this.createDatabase(sql);
        }).then(() => {
            console.log('... Database is valid !');
        })
    }

       /**
     * Allow to set the state of all the player to normal in order to allow them to play
     */
    setEverybodyAsUnOccupied() {
        console.log("Updating everybody ...");
        sql.run(`UPDATE entity SET effect = ":smiley:" WHERE effect = ":clock10:"`).catch(console.error);
        console.log("everybody updated !");
    }

    /**
     * This function create the database
     * @param sql - a sqlite file.
     */
    createDatabase(sql) {
        console.log("... Database is not valid !\nDatabase Generation ...");

        //table entity
        sql.run("CREATE TABLE IF NOT EXISTS entity (id TEXT, maxHealth INTEGER, health INTEGER, attack INTEGER, defense INTEGER, speed INTEGER, effect TEXT)").catch(console.error);
        //table player
        sql.run("CREATE TABLE IF NOT EXISTS player (discordId TEXT, score INTEGER, level INTEGER, experience INTEGER, money INTEGER, lastReport INTEGER, badges TEXT, tampon INTEGER, rank INTEGER)").then(() => {
            
            //trigger to calculate the score of all the users at any moment
            sql.run(`CREATE TRIGGER IF NOT EXISTS calcrank 
            AFTER UPDATE OF score ON player 
            BEGIN
            UPDATE player SET tampon = tampon +1 where score > 1;      
            END;`);
            sql.run(`CREATE TRIGGER IF NOT EXISTS calcrankbis 
            AFTER UPDATE OF tampon ON player 
            BEGIN 
            UPDATE player SET rank=(select (select count(*)+1
            from player as r
            where r.score > s.score) as rank
            from player as s WHERE discordId = old.discordId) WHERE discordId = old.discordId;
            END;`);

        }).catch(console.error);
        //table server
        sql.run("CREATE TABLE IF NOT EXISTS server (id TEXT, prefix TEXT, language TEXT)").catch(console.error);
        //table inventory
        sql.run("CREATE TABLE IF NOT EXISTS inventory (playerId TEXT, weaponId TEXT, armorId TEXT, potionId TEXT, objectId TEXT, backupItemId TEXT, lastDaily INTEGER)").catch(console.error);




        //table only used to store the version of the bot when the database was created
        sql.run("CREATE TABLE IF NOT EXISTS database (version TEXT)").then(() => {
            sql.run(`INSERT INTO database (version) VALUES (\"${Config.version}\")`).then(() => {
                console.log("... Generation Complete !");
            });
        });

    }
}

module.exports = DatabaseManager;