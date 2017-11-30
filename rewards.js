#!/usr/bin/env node
const program = require('commander');
const clear = require('clear');
const fs = require('fs');


const RewardsApi = require('./lib/rewards-api');
const rewardsApi = new RewardsApi();

let ERRORS = [];

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }

program
  .version('1.0')
  .option('-e, --email [value]', 'Specify your email address')
  .option('-l --list [file]', 'Specify a file')
  .option('-p, --password [value]', 'Specify the associated password')
  .option('--mobile', "Only mobile searches")
  .parse(process.argv);

if((!program.email || !program.list) && !program.password ) {
    ERRORS.push("Please provide valid email or list and password");
}

if(ERRORS.length > 0) {
    clear();
    console.log(ERRORS.join("\n"));
    return;    
}

if(program.mobile) {
    program.mobile = true;
}

if(program.list) {
    fs.readFile(program.list, function(err, data) {
        if(err) throw err;

        const makeRequest = async(account) => {
            await rewardsApi.getRewards(account, program.password, program.mobile);
        }

        const accounts = fs.readFileSync(program.list).toString().split("\n");
        
        asyncForEach(accounts, async(account) => {
            await makeRequest(account);
        });
    });
}

else {
    rewardsApi.getRewards(program.email, program.password, program.mobile)
    .catch(error => {
        console.log("An error occured");
        return;
    });
}
