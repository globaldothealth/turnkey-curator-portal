const indexes = [
  {
    name: 'byGenderAndCountry',
    key: {
      'demographics.gender': -1,
      'location.countryISO3': -1
    },
    collation: {
      locale: 'en_US',
      strength: 2,
    },
  }  
];

module.exports = {
  async up(db, client) {
    await db.command({
      createIndexes: 'cases',
      indexes: indexes,
    });
  },

  async down(db, client) {
    await db.command({
      dropIndexes: 'cases',
      index: ['byGenderAndCountry']
    });
  }
};
