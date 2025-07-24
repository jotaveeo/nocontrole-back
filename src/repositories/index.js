const userRepository = require('./userRepository');
const categoryRepository = require('./categoryRepository');
const transactionRepository = require('./transactionRepository');
const goalRepository = require('./goalRepository');
const cardRepository = require('./cardRepository');
const wishlistRepository = require('./wishlistRepository');

const debtRepository = require('./debtRepository');

const categoryLimitRepository = require('./categoryLimitRepository');
const piggyBankRepository = require('./piggyBankRepository');

module.exports = {
  userRepository,
  categoryRepository,
  transactionRepository,
  goalRepository,
  cardRepository,
  wishlistRepository,
  debtRepository,
  piggyBankRepository,
  categoryLimitRepository,
};

