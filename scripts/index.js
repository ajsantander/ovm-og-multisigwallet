const program = require('commander');

require('./verify-bytecode').cmd(program);
require('./validate-owners').cmd(program);

program.parse(process.argv);
