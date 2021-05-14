const program = require('commander');
const ethers = require('ethers');
const chalk = require('chalk');

async function validateOwners({ owners, required }) {
	owners = owners.split(',');

	const encodedConstructorParameters = _getEncodedConstructorParameters({ owners, required });

	if (_checkBytesAreSafeForOvm(encodedConstructorParameters)) {
		console.log(chalk.green('MultiSigWallet constructor parameters are safe ✅'));
	} else {
		console.log(chalk.red('MultiSigWallet constructor parameters are not safe!'));
	}
};

function _getEncodedConstructorParameters({ owners, required }) {
	return ethers.utils.defaultAbiCoder.encode(['address[]', 'uint256'], [owners, required]);
}

function _checkBytesAreSafeForOvm(bytes) {
	for (let i = 0; i < bytes.length; i += 2) {
		const curByte = bytes.substr(i, 2);
		const opNum = parseInt(curByte, 16);

		if (opNum >= 96 && opNum < 128) {
			i += 2 * (opNum - 95);
			continue;
		}

		if (curByte === '5b') {
			return false;
		}
	}

	return true;
}

module.exports = {
	validateOwners,
	cmd: program =>
		program
      .command('validate-owners')
      .description('Checks that an initial set of owner addresses are safe to be used as the constructor parameters of a multisig instance.')
			.option('--owners [values]', 'Comma separated list of owner addresses to be used in the multisig wallet instantiation')
			.option('--required <value>', 'Number of required signatures', parseInt, 1)
			.action(async (...args) => {
				try {
					await validateOwners(...args);
				} catch (err) {
					console.error(err);
					console.log(err.stack);
					process.exitCode = 1;
				}
			}),
};
