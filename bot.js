//var input =  ".roll -k20 + 2k6 + 64 - 2k12 + 13";
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

var configObj = require("./config.json");
var prefix = configObj.prefix;
var commands = configObj.commands;
var token = configObj.token;
var msg;

function smartRoll(facesNum, modifier){
    let dice = [];
    let message = "Result: ";
    let diceList = "Rolled: ";
    let result = 0;

    if(facesNum < 2){
         msg.reply("Please pick higher number!");
        return;
    }

    if(facesNum%2!=0){
        msg.reply("Note: Dice should have even number of faces");
    }

    //determine the dice set
    while(facesNum > 0){
        if(facesNum == 12 || facesNum%10 == 2){
            dice.push(12);
            facesNum -= 12;
        }
        else if(facesNum >= 10){
            dice.push(10);
            facesNum -= 10;
        }else{
            dice.push(facesNum);
            break;
        }
    }

    for(let i in dice){
        die = dice[i];
        temp = Math.floor(Math.random()*die)+1;
        result += temp;
        message += temp.toString() + " + ";
        diceList += "d" + die.toString() + ", "
    }
    diceList = diceList.slice(0,-2);
    message = message.slice(0,-3);
    
    if(modifier != 0){
        var sign;
        if(modifier <0){sign = '-';}
        else{sign = '+';}
        message += " " + sign + " " + Math.abs(modifier).toString();
        message += (" = " + (result + modifier).toString());
    }else if(dice.length > 1){
            message += (" = " + result.toString());
    }

    msg.reply(diceList + '\n' + message);
}



function setPrefix(newPrefix){

}

function parseRollData(data){
    var faces = 0;
    var modifier = 0;
    var sign = 1;
    var index = 0;
    var c = data[index];
    var s = data.length;

    //get faces number
    while(c >= '0' && c <= '9' && index < s){
        faces *= 10;
        faces += parseInt(c);
        index += 1;
        c = data[index];
    }

    //skip until a sign is found
    while(c != '+' && c != '-' && index < s){
        index += 1;
        c = data[index];
    }

    //get modifier's sign
    if(c == '-'){sign = -1;}
    while((c < '0' || c > '9') && index < s){
        index += 1;
        c = data[index];
    }

    //get the modifier
    while(c >= '0' && c <= '9' && index <s){
        modifier *= 10;
        modifier += parseInt(c);
        index += 1;
        c = data[index];
    }

    if(modifier != 0){
        modifier *= sign;
    }

    let ret = [faces, modifier];
    return ret;
}

function fullParse(data){
    var tokens = [];
    var num1 = null;
    var num2 = null;
    var currentToken = {type: "modifier", sign: 1, value: 0, number: 1};
    var dataSize = data.length;

    var index = 0;

    //get first sign
    while(index<dataSize){
        c= data[index];
        if(c=='-'){
            currentToken.sign = -1;
            index+=1;
            break;
        }
        if(c=='+'){
            index+=1;
            break;
        }
        if(c == 'k' || c == 'd' || (c>='0'&&c<='9')){
            break;
        }
        index +=1;
    }

    //parse tokens
    while(index < dataSize){
        c = data[index];
        
        //parse number
        if(c>='0' && c<='9'){
            var num = 0;
            while(c >= '0' && c <= '9' && index < dataSize){
                num *= 10;
                num += parseInt(c);
                index += 1;
                c = data[index];
            }

            if(num1 == null){num1 = num;}
            else if(num2 == null){num2 = num;}
        }

        if(c == 'd' || c == 'k'){
            currentToken.type = "die";
        }
        
        //end previous token, set up next one
        if(c=="+" || c == '-' || index >= (dataSize-1)){
            if(currentToken.type == "modifier" && num1 != null){
                currentToken.value = num1;
                tokens.push(currentToken);        
            }else{
                if(num1 != null){
                    if(num2 == null){
                        //one die
                        currentToken.number = 1;
                        currentToken.value = num1;
                    }else{
                        //multiple dice
                        currentToken.number = num1;
                        currentToken.value = num2;
                    }
                    
                    tokens.push(currentToken);
                }
            }
            currentToken = {type: "modifier", sign: 1, value: 0, number: 1};
            if(c=='-'){currentToken.sign = -1;}
            num1 = null; num2 = null;

        }
        
        index += 1;
    }
    return tokens;
}

function fullRoll(tokens){
    var result = 0;
    var message = "Rolled: ";

    for(let i in tokens){
        token = tokens[i];
        
        if(token.sign == -1){
            message += " - ";
        }else if(i > 0){
            message += " + ";
        }

        if(token.type == "modifier"){
            let finalValue = parseInt(token.value) * parseInt(token.sign);
            result += finalValue;
            message += token.value.toString();
        }else if(token.type == "die"){
            for(let j = 0; j < token.number; j++){
                if(j > 0){
                    if(token.sign == -1){  message += " - ";}
                    else if(j > 0){ message += " + "; }
                }
                var rollResult = Math.floor(Math.random()*parseInt(token.value))+1;
                result += rollResult*token.sign;
                message += rollResult.toString();
            }
        }
    }
    //message = message.slice(0,-3);
    message += " = " + result.toString();
    msg.reply(message);
}

function evaluate(command, data){
    let d;
    switch(command){
        
        case "k":
            d = parseRollData(data.toString());
            smartRoll(d[0],d[1]);
            break;
        case "d":
            d = parseRollData(data.toString());
            smartRoll(d[0], d[1]);
            break;
        case "roll":
            d = fullParse(data.toString());
            fullRoll(d);
            break;

        case "prefix":
            break;
        default:
            //command not found
            return false;
    }
    //command found
    return true;
}


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return false; 
  
  
    console.log(`Message from ${message.author.username}: ${message.content}`);
    msg = message;

    var input = message.content;
    if(input.slice(0,prefix.length) == prefix){
        //remove prefix
        input = input.slice(prefix.length);
        input = input.toLowerCase();

        let comandExists = false;

        for(let i in commands){
            comm = commands[i];
            if(input.startsWith(comm)){
                input = input.slice(comm.length);
                comandExists = evaluate(comm, input);
                break;
            }
        }

        if(!comandExists){
            msg.reply("Command existn't!");
        }


    }
});

client.login(token);