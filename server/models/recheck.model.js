// models/recheck.model.js
module.exports = (sequelize, Sequelize) => {
  const Recheck = sequelize.define("recheck", {
    reNo: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    reObsDate: {
      type: Sequelize.DATEONLY,
      allowNull: false
    },
    reObsStatus: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    reObs: {
      type: Sequelize.STRING(2000)
    },
    reTreadDepth: {
      type: Sequelize.STRING(20)
    },
    reObsNo: {
      type: Sequelize.STRING(50),
      allowNull: false
    }
  });

  return Recheck;
};