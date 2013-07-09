"use strict";

// Creating the application namespace
var directory = {
	models: {},
	views: {},
	utils: {},
	dao: {}
};

// -------------------------------------------------- Utilities ---------------------------------------------------- //

// The Template Loader. Used to asynchronously load templates located in separate .html files
directory.utils.templateLoader = {
	templates: {},

	load: function(names, callback) {
		var deferreds = [],
			self = this;

		$.each(names, function(index, name) {
			deferreds.push($.get('modules/templates/' + name + '.html', function(data) {
				self.templates[name] = data;
			}));
		});

		$.when.apply(null, deferreds).done(callback);
	},

	// Get template by name from hash of preloaded templates
	get: function(name) {
		return this.templates[name];
	}

};

// The Employee Data Access Object (DAO). Encapsulates logic (in this case SQL statements) to access employee data.
directory.dao.ParcoursDAO = function(db) {
	this.db = db;
};

_.extend(directory.dao.ParcoursDAO.prototype, {

	findByName: function(key, callback) {
		this.db.transaction(
			function(tx) {
				var sql = 
					'SELECT id, nom, latitude_centre, longitude_centre, fichier_carte ' +
					'FROM parcours ' +
					'WHERE nom LIKE ? ' +
					'ORDER BY nom';

				tx.executeSql(sql, ['%' + key + '%'], function(tx, results) {
					var len = results.rows.length,
						employees = [],
						i = 0;
					for (; i < len; i = i + 1) {
						employees[i] = results.rows.item(i);
					}
					callback(employees);
				});
			},
			function(tx, error) {
				alert('Transaction Error: ' + error);
			}
		);
	},

	findById: function(id, callback) {
		this.db.transaction(
			function(tx) {
				var sql = 
					'SELECT id, nom, latitude_centre, longitude_centre, fichier_carte, description, photos, ce_critere, est_commence ' +
					'FROM parcours ' +
					'WHERE id=:id_parcours';

				tx.executeSql(sql, [id], function(tx, results) {
					callback(results.rows.length === 1 ? results.rows.item(0) : null);
				});
			},
			function(tx, error) {
				alert('Transaction Error: ' + error);
				console.log('DB | Error processing SQL: ' + error.code, error);
			}
		);
	},

	findAll: function(callback) {
		this.db.transaction(
			function(tx) {
				var sql = 
					'SELECT id, nom, latitude_centre, longitude_centre, fichier_carte, description, photos ' +
					'FROM parcours';

				tx.executeSql(sql, [], function(tx, results) {
					callback(results.rows.item);
				});
			},
			function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
			}
		);
	},

	// Populate Employee table with sample data
	populate: function(callback) {
		directory.db.transaction(
			function(tx) {
				console.log('Dropping PARCOURS table');
				tx.executeSql('DROP TABLE IF EXISTS parcours');
				var sql =
					'CREATE TABLE IF NOT EXISTS parcours (' +
						'id INT NOT NULL ,' +
						'nom VARCHAR(255) NOT NULL ,' +
						'latitude_centre DECIMAL NULL ,' +
						'longitude_centre DECIMAL NULL ,' +
						'fichier_carte VARCHAR(255) NULL ,' +
						'photos VARCHAR(255) NULL ,' +
						'description TEXT NULL ,' +
						'est_commence BOOLEAN NULL , ' +
						'ce_critere INT NULL ,' +
					'PRIMARY KEY (id),' +
					'CONSTRAINT ce_critere ' +
						'FOREIGN KEY (ce_critere)' +
						'REFERENCES critere (id_critere)' + 
						'ON DELETE NO ACTION ' + 
						'ON UPDATE NO ACTION ' + 
					')';
				console.log('Creating PARCOURS table');
				tx.executeSql(sql);
			},
			function(error) {
				//alert('Transaction error ' + error);
				console.log('DB | Error processing SQL: ' + error.code, error);
			},
			function(tx) {	}
		);
		console.log('Inserting parcours');
		$.ajax({
			type: 'GET',
			url: './parcours.csv',
			dataType: 'text',
			success: function(fichier) { 
				var arr_lignes = fichier.split(/\r\n|\r|\n/),
				arr_sql = new Array(),
				max = arr_lignes.length - 1;
				for (var i = 1; i < max; i++) {
					var sql = '',
						arr_valeurs = arr_lignes[i].split(';');
					for (var j = 0; j < arr_valeurs.length; j++) {
						sql += arr_valeurs[j];
						if (j < (arr_valeurs.length - 1)) {
							sql += ',';
						}
					}
					arr_sql.push('INSERT INTO parcours '
						+ '(id, nom, latitude_centre, longitude_centre, fichier_carte, photos, description, ce_critere) '
						+ 'VALUES ('+sql+')');
				}
				//console.log(arr_sql);
				directory.db.transaction(function (tx) {
					for (var c = 0; c < arr_sql.length; c++) {
						tx.executeSql(arr_sql[c]);
					}
				});
			},
			error : function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus);
			}
		});
	}
});
_.extend(directory.dao.ParcoursDAO.prototype, directory.dao.baseDAOBD);

// The Employee Data Access Object (DAO). Encapsulates logic (in this case SQL statements) to access employee data.
directory.dao.EspeceDAO = function(db) {
	this.db = db;
};

_.extend(directory.dao.EspeceDAO.prototype, {

	findByName: function(key, callback) {
		this.db.transaction(
			function(tx) {
				var sql = 
					'SELECT num_nom, nom_sci, famille, nom_vernaculaire,  photos ' +
					'FROM espece ' + 
					"WHERE nom_sci || ' ' || nom_vernaculaire || ' ' || famille LIKE ? " +
					'ORDER BY nom_vernaculaire';

				tx.executeSql(sql, ['%' + key + '%'], function(tx, results) {
					var len = results.rows.length,
						employees = [],
						i = 0;
					for (; i < len; i = i + 1) {
						employees[i] = results.rows.item(i);
					}
					callback(employees);
				});
			},
			function(tx, error) {
				alert('Transaction Error: ' + error);
			}
		);
	},

	findById: function(id, callback) {
		this.db.transaction(
			function(tx) {
				var sql = 
					'SELECT num_nom, nom_sci, famille, nom_vernaculaire, description, photos, referentiel, famille, num_taxon ' +
					'FROM espece ' +
					'WHERE num_nom = :id_espece';

				tx.executeSql(sql, [id], function(tx, results) {
					callback(results.rows.length === 1 ? results.rows.item(0) : null);
				});
			},
			function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
			}
		);
	},

	findByParcours: function(id, callback) {
		this.db.transaction(
			function(tx) {
				var sql = 
					'SELECT e.num_nom, e.nom_sci, e.famille, e.nom_vernaculaire, e.photos, c.vue ' +
					'FROM espece e ' +
					'JOIN avoir_critere c ON e.num_nom = c.id_espece ' +
					'WHERE c.id_critere = :id_parcours ' + 
					'ORDER BY nom_vernaculaire';
				//console.log(sql);
				tx.executeSql(sql, [id], function(tx, results) {
					 var nbre = results.rows.length,
						especes = [],
						i = 0;
					for (; i < nbre; i = i + 1) {
						especes[i] = results.rows.item(i);
					}
					callback(especes);
				});
			},
			function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
			}
		);
	},

	findAll: function(callback) {
		this.db.transaction(
			function(tx) {

				var sql = 
					'SELECT num_nom, nom_sci, famille, nom_vernaculaire, photos ' +
					'FROM espece ' +
					'ORDER BY nom_vernaculaire';

				tx.executeSql(sql, [], function(tx, results) {
					 var nbre = results.rows.length,
						especes = [],
						i = 0;
					for (; i < nbre; i = i + 1) {
						especes[i] = results.rows.item(i);
					}
					callback(especes);
				});
			},
			function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
			}
		);
	},

	// Populate Employee table with sample data
	populate: function(callback) {
		directory.db.transaction(
			function(tx) {
				console.log('Dropping ESPECE table');
				tx.executeSql('DROP TABLE IF EXISTS espece');
				var sql =
					'CREATE TABLE IF NOT EXISTS espece (' +
						'num_nom INT NOT NULL ,' +
						'nom_sci VARCHAR(255) NOT NULL ,' +
						'famille VARCHAR(255) NULL ,' +
						'num_taxon INT NULL ,' +
						'referentiel VARCHAR(45) NOT NULL DEFAULT "bdtfx" ,' +
						'nom_vernaculaire VARCHAR(255) NULL ,' +
						'description TEXT NULL ,' +
						'photos VARCHAR(255) NULL ,' +
					'PRIMARY KEY (num_nom) )';
				console.log('Creating ESPECE table');
				tx.executeSql(sql);
			},
			function(error) {
				//alert('Transaction error ' + error);
				console.log('DB | Error processing SQL: ' + error.code, error);
			},
			function(tx) {	}
		);
		console.log('Inserting espece');
		$.ajax({
			type: 'GET',
			url: './espece.csv',
			dataType: 'text',
			success: function(fichier) { 
				var arr_lignes = fichier.split(/\r\n|\r|\n/),
					arr_sql = new Array(),
					max = arr_lignes.length - 1;
				for (var i = 1; i < max; i++) {
					var sql = '',
						arr_valeurs = arr_lignes[i].split(';');
					for (var j = 0; j < arr_valeurs.length; j++) {
						sql += arr_valeurs[j];
						if (j < (arr_valeurs.length - 1)) {
							sql += ',';
						}
					}
					arr_sql.push('INSERT INTO espece '
						+ '(nom_sci, num_nom, famille, num_taxon, nom_vernaculaire, description, photos, referentiel) '
						+ 'VALUES ('+sql+')');
				}
				//console.log(arr_sql);
				directory.db.transaction(function (tx) {
					for (var c = 0; c < arr_sql.length; c++) {
						tx.executeSql(arr_sql[c]);
					}
				}, 
				function(error) {
					//alert('Transaction error ' + error);
					console.log('DB | Error processing SQL: ' + error.code, error);
				},
				function(tx) {
					//callback();
				});
			},
			error : function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus);
			}
		});
	}
});
_.extend(directory.dao.EspeceDAO.prototype, directory.dao.baseDAOBD);


// The Employee Data Access Object (DAO). Encapsulates logic (in this case SQL statements) to access employee data.
directory.dao.CritereDAO = function(db) {
	this.db = db;
};
_.extend(directory.dao.CritereDAO.prototype, {
	findAll: function(callback) {
		this.db.transaction(
			function(tx) {
				var sql = 
						"SELECT c.id_critere, intitule, url_img, ce_parent FROM critere c " +
						"WHERE ce_parent NOT IN ( " +
							"SELECT id_critere FROM critere " +
							"WHERE intitule LIKE '%parcours%' " + 
						") " + 
						"AND ce_parent NOT IN ( " +
							"SELECT id_critere FROM critere " +
							"WHERE intitule LIKE '%pheno%' " + 
						") " + 
						"AND intitule NOT LIKE '%parcours%' " +
						"AND intitule NOT LIKE '%pheno%' ";

				tx.executeSql(sql, [], function(tx, results) {
					var nbre = results.rows.length,
						criteres = [],
						i = 0;
					for (; i < nbre; i = i + 1) {
						criteres[i] = results.rows.item(i);
					}
					callback(criteres);
				});
			},
			function(error) {
				//alert('Transaction Error: ' + error);
				console.log('DB | Error processing SQL: ' + error.code, error);
			}
		);
	},
	
	// Populate Employee table with sample data
	populate: function(callback) {
		this.db.transaction(
			function(tx) {
				console.log('Dropping CRITERE table');
				tx.executeSql('DROP TABLE IF EXISTS critere');
				var sql =
					'CREATE TABLE IF NOT EXISTS critere (' +
						'id_critere INT NOT NULL ,' +
						'intitule VARCHAR(45) NOT NULL ,' +
						'url_img VARCHAR(45) NULL ,' +
						'ce_parent INT NULL ,' +
						'PRIMARY KEY (id_critere) ,' +
						'CONSTRAINT ce_parent ' +
							'FOREIGN KEY (ce_parent)' +
							'REFERENCES critere (id_critere)' + 
							'ON DELETE NO ACTION ' + 
							'ON UPDATE NO ACTION ' + 
					')';
				console.log('Creating CRITERE table');
				tx.executeSql(sql);
			},
			function(error) {
				//alert('Transaction error ' + error);
				console.log('DB | Error processing SQL: ' + error.code, error);
			},
			function(tx) {	}
		);
		console.log('Inserting critere');
		$.ajax({
			type: 'GET',
			url: './critere.csv',
			dataType: 'text',
			success: function(fichier) { 
				var arr_lignes = fichier.split(/\r\n|\r|\n/),
					arr_sql = new Array(),
					max = arr_lignes.length - 1;
				for (var i = 1; i < max; i++) {
					var sql = '',
						arr_valeurs = arr_lignes[i].split(';');
					for (var j = 0; j < arr_valeurs.length; j++) {
						sql += arr_valeurs[j];
						if (j < (arr_valeurs.length - 1)) {
							sql += ',';
						}
					}
					arr_sql.push(sql);
				}
				//console.log(arr_sql);
				directory.db.transaction(function (tx) {
					for (var c = 0; c < arr_sql.length; c++) {
						tx.executeSql("INSERT INTO critere (id_critere, intitule, url_img, ce_parent) VALUES ("+arr_sql[c]+")");
					}
				}, 
				function(error) {
					//alert('Transaction error ' + error);
					console.log('DB | Error processing SQL: ' + error.code, error);
				},
				function(tx) {
					//callback();
				});
			},
			error : function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus);
			}
		});
	}
});
_.extend(directory.dao.CritereDAO.prototype, directory.dao.baseDAOBD);


// The Employee Data Access Object (DAO). Encapsulates logic (in this case SQL statements) to access employee data.
directory.dao.AvoirCritereDAO = function(db) {
	this.db = db;
};
_.extend(directory.dao.AvoirCritereDAO.prototype, {
	// Populate Employee table with sample data
	populate: function(callback) {
		directory.db.transaction(
			function(tx) {
				console.log('Dropping AVOIR_CRITERE table');
				tx.executeSql('DROP TABLE IF EXISTS avoir_critere');
				var sql =
					'CREATE TABLE IF NOT EXISTS avoir_critere (' +
						'id_espece INT NOT NULL ,' +
						'id_critere INT NOT NULL ,' +
						'vue BOOLEAN NULL ,' +
						'PRIMARY KEY (id_espece, id_critere) , ' +
						'CONSTRAINT id_critere ' + 
							'FOREIGN KEY (id_critere)' +
							'REFERENCES critere (id_critere) ' +
							'ON DELETE NO ACTION ' +
							'ON UPDATE NO ACTION,' +
						'CONSTRAINT id_espece ' +
							'FOREIGN KEY (id_espece)' +
							'REFERENCES espece (num_nom)' +
							'ON DELETE NO ACTION ' + 
							'ON UPDATE NO ACTION ' + 
					')';
				console.log('Creating AVOIR_CRITERE table');
				tx.executeSql(sql);
			},
			function(error) {
				//alert('Transaction error ' + error);
				console.log('DB | Error processing SQL: ' + error.code, error);
			},
			function(tx) {	}
		);
		console.log('Inserting avoir_critere');
		$.ajax( {
			type: 'GET',
			url: './avoir_critere.csv',
			dataType: 'text',
			success: function(fichier) { 
				var arr_lignes = fichier.split(/\r\n|\r|\n/),
					arr_sql = new Array(),
					max = arr_lignes.length - 1;
				for (var i = 1; i < max; i++) {
					var sql = '',
						arr_valeurs = arr_lignes[i].split(';');
					if (arr_valeurs[1] != 'null') {
						for (var j = 0; j < arr_valeurs.length; j++) {
							sql += arr_valeurs[j];
							if (j < (arr_valeurs.length - 2)) {
								sql += ',';
							}
						}
						arr_sql.push(sql);
					}
				}
				//console.log(arr_sql);
				directory.db.transaction(function (tx) {
					for (var c = 0; c < arr_sql.length; c++) {
						tx.executeSql("INSERT INTO avoir_critere (id_espece, id_critere) VALUES ("+arr_sql[c]+")");
					}
				}, 
				function(error) {
					//alert('Transaction error ' + error);
					console.log('DB | Error processing SQL: ' + error.code, error);
				},
				function(tx) {
					//callback();
				});
			},
			error : function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus);
			}
		});
	}
});
_.extend(directory.dao.AvoirCritereDAO.prototype, directory.dao.baseDAOBD);



directory.dao.ObsDAO = function(db) {
	this.db = db;
};

_.extend(directory.dao.ObsDAO.prototype, {
	findById: function(id, callback) {
		this.db.transaction(
			function(tx) {
				var sql = 
					'SELECT num_nom, nom_sci, nom_vernaculaire, id_obs, date, commune, code_insee ' +
					'FROM espece e ' +
					'JOIN obs o ON e.num_nom = o.ce_espece ' +
					'WHERE id_obs = :id_obs';
				//console.log(sql, id);
				tx.executeSql(sql, [id], function(tx, results) {
					callback(results.rows.length === 1 ? results.rows.item(0) : null);
				});
			},
			function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
			}
		);
	},

	findAll: function(callback) {
		this.db.transaction(
			function(tx) {
				var sql = 
					'SELECT num_nom, nom_sci, nom_vernaculaire, id_obs, date, commune, code_insee ' +
					'FROM espece ' +
					'JOIN obs ON num_nom = ce_espece ' +
					'ORDER BY id_obs DESC';

				tx.executeSql(sql, [], function(tx, results) {
					 var nbre = results.rows.length,
						especes = [],
						i = 0;
					for (; i < nbre; i = i + 1) {
						especes[i] = results.rows.item(i);
					}
					callback(especes);
				});
			},
			function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
			}
		);
	},

	populate: function(callback) {
		directory.db.transaction(
			function(tx) {
				//console.log('Dropping OBS table');
				//tx.executeSql('DROP TABLE IF EXISTS obs');
				var sql =
					'CREATE TABLE IF NOT EXISTS obs (' +
						'id_obs INT NOT NULL ,'+
						'date DATE NOT NULL ,' +
						'latitude DECIMAL NULL ,' +
						'longitude DECIMAL NULL ,' +
						'commune VARCHAR(255) NULL ,' +
						'code_insee INT NULL ,' +
						'mise_a_jour TINYINT(1) NOT NULL DEFAULT 0 ,' +
						'ce_espece INT NOT NULL,' +
						'PRIMARY KEY (id_obs),' +
						'CONSTRAINT ce_espece ' +
							'FOREIGN KEY (ce_espece)' +
							'REFERENCES espece (num_nom)' +
							'ON DELETE NO ACTION ' +
							'ON UPDATE NO ACTION ' +
					')';
				console.log('Creating OBS table');
				tx.executeSql(sql);
			},
			function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
			},
			function(tx) {
				//callback();
			}
		);
	}
});
_.extend(directory.dao.ObsDAO.prototype, directory.dao.baseDAOBD);


directory.dao.PhotoDAO = function(db) {
	this.db = db;
};

_.extend(directory.dao.PhotoDAO.prototype, {
	findByObs: function(id, callback) {
		this.db.transaction(
			function(tx) {
				var sql = 
					'SELECT id_photo, chemin ' +
					'FROM photo ' +
					'WHERE ce_obs = :id_obs';

				tx.executeSql(sql, [id], function(tx, results) {
					 var nbre = results.rows.length,
						photos = [],
						i = 0;
					for (; i < nbre; i = i + 1) {
						photos[i] = results.rows.item(i);
					}
					callback(photos);
				});
			},
			function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
			}
		);
	},

	populate: function(callback) {
		directory.db.transaction(
			function(tx) {
				//console.log('Dropping PHOTO table');
				tx.executeSql('DROP TABLE IF EXISTS photo');
				var sql =
					'CREATE TABLE IF NOT EXISTS photo (' +
						'id_photo INT NOT NULL ,' +
						'chemin VARCHAR(255) NOT NULL ,' +
						'ce_obs INT NOT NULL ,' +
						'PRIMARY KEY (id_photo) ,' +
						'CONSTRAINT ce_obs ' +
							'FOREIGN KEY (ce_obs) ' +
							'REFERENCES obs (id_obs) ' +
							'ON DELETE NO ACTION ' + 
							'ON UPDATE NO ACTION ' +
					')';
				console.log('Creating PHOTO table');
				tx.executeSql(sql);
			},
			function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
			},
			function(tx) {
				//callback();
			}
		);
	}
});
_.extend(directory.dao.PhotoDAO.prototype, directory.dao.baseDAOBD);


// Overriding Backbone's sync method. Replace the default RESTful services-based implementation
// with a simple local database approach.
Backbone.sync = function(method, model, options) {
	var dao = new model.dao(directory.db);
	
	if (method === "read") {
		if (model.id) {
			dao.findById(model.id, function(data) {
				options.success(data);
			});
		} else {
			if (model.id_obs) {
				dao.findByObs(model.id_obs, function(data) {
					options.success(data);
				});
			} else {
				dao.findAll(function(data) {
					options.success(data);
				});
			}
		}
	}

};

// -------------------------------------------------- The Models ---------------------------------------------------- //

// The Employee Model
directory.models.Employee = Backbone.Model.extend({
	dao: directory.dao.ParcoursDAO,

	initialize: function() {
		//this.reports = new directory.models.EmployeeCollection();
		//this.reports.managerId = this.id;
	}

});

// The EmployeeCollection Model
directory.models.EmployeeCollection = Backbone.Collection.extend({
	dao: directory.dao.ParcoursDAO,
	model: directory.models.Employee,

	findByName: function(key) {
		var employeeDAO = new directory.dao.ParcoursDAO(directory.db),
			self = this;
		employeeDAO.findByName(key, function(data) {
			//console.log("EmployeeCollection " + data);
			self.reset(data);
		});
	},
	
	findAll: function() {
		var employeeDAO = new directory.dao.ParcoursDAO(directory.db),
			self = this;
		employeeDAO.findAll(function(data) {
			console.log("EmployeeCollection " + data);
			self.reset(data);
		});
	}

});


directory.models.Espece = Backbone.Model.extend({

	dao: directory.dao.EspeceDAO,

	initialize: function() {
		//this.reports = new directory.models.EmployeeCollection();
		//this.reports.managerId = this.id;
	}

});


directory.models.EspeceCollection = Backbone.Collection.extend({
	dao: directory.dao.EspeceDAO,
	model: directory.models.Espece,

	findByName: function(key) {
		var especeDAO = new directory.dao.EspeceDAO(directory.db),
			self = this;
		especeDAO.findByName(key, function(data) {
			console.log("EspeceCollection | findByName", data);
			self.reset(data);
		});
	}, 
	
	findById: function(key) {
		var especeDAO = new directory.dao.EspeceDAO(directory.db),
			self = this;
		especeDAO.findById(key, function(data) {
			console.log("EspeceCollection | findById", data);
			self.reset(data);
		});
	}, 
	
	findByParcours: function(key) {
		var especeDAO = new directory.dao.EspeceDAO(directory.db),
			self = this;
		especeDAO.findByParcours(key, function(data) {
			self.reset(data);
			//console.log("EspeceCollection | findByParcours ", data);
		});
	},
	
	findAll: function() {
		var especeDAO = new directory.dao.EspeceDAO(directory.db),
			self = this;
		especeDAO.findAll(function(data) {
			self.reset(data);
			//console.log("EspeceCollection | findAll ", data);
		});
	}

});


directory.models.Critere = Backbone.Model.extend({
	dao: directory.dao.ParcoursDAO,

	initialize: function() {
		//this.reports = new directory.models.EmployeeCollection();
		//this.reports.managerId = this.id;
	}

});


directory.models.CritereCollection = Backbone.Collection.extend({
	dao: directory.dao.CritereDAO,
	model: directory.models.Critere,

	findAll: function() {
		var critereDAO = new directory.dao.CritereDAO(directory.db),
			self = this;
		critereDAO.findAll(function(data) {
			//console.log("critereCollection ", data);
			self.reset(data);
		});
	}
});




directory.models.Obs = Backbone.Model.extend({
	dao: directory.dao.ObsDAO,

	initialize: function() {	}
});

directory.models.ObsCollection = Backbone.Collection.extend({
	dao: directory.dao.ObsDAO,
	model: directory.models.Obs,

	findById: function(key) {
		var obs = new directory.dao.ObsDAO(directory.db),
			self = this;
		obs.findById(key, function(data) {
			//console.log("ObsCollection ", data);
			self.reset(data);
		});
	},
	
	findAll: function() {
		var obs = new directory.dao.ObsDAO(directory.db),
			self = this;
		obs.findAll(function(data) {
			//console.log("ObsCollection ", data);
			self.reset(data);
		});
	}

});


directory.models.Photo = Backbone.Model.extend({
	dao: directory.dao.PhotoDAO,

	initialize: function() {	}
});

directory.models.PhotoCollection = Backbone.Collection.extend({
	dao: directory.dao.PhotoDAO,
	model: directory.models.Photo,

	findByObs: function(key) {
		var photo = new directory.dao.PhotoDAO(directory.db),
			self = this;
		photo.findByObs(key, function(data) {
			//console.log("PhotoCollection | findByObs", data);
			self.reset(data);
		});
	}
});



// -------------------------------------------------- The Views ---------------------------------------------------- //

directory.views.SearchPage = Backbone.View.extend({
	templateLoader: directory.utils.templateLoader,
	EmployeeListView: directory.views.EmployeeListView,

	initialize: function() {
		this.template = _.template(this.templateLoader.get('search-page'));
		this.model.findByName('');
	},

	render: function(eventName) {
		$(this.el).html(this.template(this.model.toJSON()));
		this.listView = new directory.views.EmployeeListView({el: $('ul', this.el), model: this.model});
		this.listView.render();
		return this;
	}
});

directory.views.EmployeeListView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('reset', this.render, this);
	},

	render: function(eventName) {
		$(this.el).empty();
		_.each(this.model.models, function(employee) {
			$(this.el).append(new directory.views.EmployeeListItemView({model: employee}).render().el);
		}, this);
		return this;
	}

});

directory.views.EmployeeListItemView = Backbone.View.extend({
	tagName: 'li',

	initialize: function(data) {
		this.template = _.template(directory.utils.templateLoader.get('parcours-list-item'));
	},

	render: function(eventName) {
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	}

});

directory.views.ParcoursPage = Backbone.View.extend({
	initialize: function() {
		directory.liste = new Array();
		directory.criteria = new Array();
		directory.nbre_criteres = new Array();
		directory.nbre_especes = null;
		
		this.template = _.template(directory.utils.templateLoader.get('parcours-page'));
	},

	render: function(eventName) {
		var arr_photos = new Array();
		var temp_photos = this.model.attributes.photos.split(',');
		for (var i = 0; i < temp_photos.length; i++) {
			if (temp_photos[i] != '') {
				arr_photos.push(temp_photos[i]);
			}
		}
		this.model.attributes.photos = arr_photos;
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	}

});


directory.views.ListPage = Backbone.View.extend({
	templateLoader: directory.utils.templateLoader,
	
	initialize: function(data) {
		//console.log(data);		
		this.model = new directory.models.EspeceCollection();
		this.model.id = data.model.attributes.id;
		this.model.name = data.model.attributes.name;
		this.model.id_critere = data.model.attributes.id_critere;
		if (this.model.id == 0) {
			this.model.findAll();
		} else {
			this.model.findByParcours(this.model.id_critere);
		}
		this.template = _.template(this.templateLoader.get('list-page'));
	},

	render: function(eventName) {
		var lien = (this.model.id == 0) ? '' : '/'+this.model.id,
			json = {
			"nom_parcours" : this.model.name,
			"id_parcours" : this.model.id,
			"id_critere" : this.model.id_critere,
			"lien_parcours" : 'parcours'+lien
		};
		
		$(this.el).html(this.template(json));
		this.listView = new directory.views.EspeceListView({el: $('ul', this.el), model: this.model});
		this.listView.render();
		return this;
	}
});


directory.views.EspeceListView = Backbone.View.extend({

	initialize: function(data) {
		//console.log(data);
		this.ce_critere = data.model.id_critere;
		this.model.bind('reset', this.render, this);
	},

	render: function(eventName) {
		var arr_especes = new Array(),
			arr_temp = this.model.models,
			arr_ids = new Array(),
			nbre_triees = directory.liste.length;
			
		if (nbre_triees != 0 && directory.liste.total != 0) {
			console.log(arr_temp);
			console.log(directory.liste);
			console.log(directory.nbre_criteres);
			for (var pourcentage = directory.liste.total; pourcentage >= 0; pourcentage--) {
				for (var i = 0; i < arr_temp.length; i++) {
					if (directory.nbre_criteres[arr_temp[i].attributes.num_nom] == pourcentage) {
						arr_temp[i].attributes.pourcentage = pourcentage + '/' + directory.liste.total;
						arr_especes.push(arr_temp[i]);
					}
				}
			}
			
			for (var i = 0; i < arr_temp.length; i++) {
				var index_liste = $.inArray(arr_temp[i].attributes.num_nom, directory.liste),
					index_criteres = (typeof directory.nbre_criteres[arr_temp[i].attributes.num_nom] === 'undefined') ? -1 : 0;
				if (index_liste == -1 && index_criteres == -1) {
					arr_temp[i].attributes.pourcentage = 0 + '/' + directory.liste.total;
					arr_especes.push(arr_temp[i]);
				}
			}
			this.model.models = arr_especes;
		}
		
		//console.log(this.model.models);
		$(this.el).empty();
		_.each(this.model.models, function(espece) {
			espece.attributes.ce_critere = this.ce_critere;
			espece.attributes.action_vue = (espece.attributes.vue == 1) ? 'bleu' : 'blanc';
			$(this.el).append(new directory.views.EspeceListItemView({model: espece}).render().el);
		}, this);
		return this;
	}

});

directory.views.EspeceListItemView = Backbone.View.extend({
	tagName: 'li',

	initialize: function(data) {
		//console.log(data);
		this.template = _.template(directory.utils.templateLoader.get('espece-list-item'));
	},

	render: function(eventName) {
		var temp_photos = this.model.attributes.photos.split(',');
		if (temp_photos[0] != '') {
			this.model.attributes.photos = temp_photos[0];
		}
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	}

});


directory.views.EspecePage = Backbone.View.extend({
	templateLoader: directory.utils.templateLoader,
	
	initialize: function(data) {
		//console.log(data);
		this.template = _.template(this.templateLoader.get('espece-page'));
	},

	render: function(eventName) {
		var num_nom = this.model.attributes.id,
			ce_critere = this.model.attributes.ce_critere,
			arr_photos = new Array(),
			temp_photos = this.model.attributes.photos.split(',');
		for (var i = 0; i < temp_photos.length; i++) {
			if (temp_photos[i] != '') {
				arr_photos.push(temp_photos[i]);
			}
		}
		this.model.attributes.photos = arr_photos;
		$(this.el).html(this.template(this.model.toJSON()));
		
		directory.db.transaction(
			function(tx) {
				var sql =
					'SELECT vue ' +
					'FROM avoir_critere ' +
					'WHERE id_espece = :num_nom ' +
					'AND id_critere = :ce_critere ';
				tx.executeSql(sql, [num_nom, ce_critere], function(tx, results) {
					if (results.rows.length != 0) {
						if (results.rows.item(0).vue == 1) {
							$('#btn-vue-espece').html('Déjà vue !');
							$('#btn-vue-espece').addClass('bleu');
						}
					}
				});
			},
			function(error) {
				console.log('DB | Error processing SQL: ' + error.code, error);
			}
		);
		
		return this;
	}
});


directory.views.CriterePage = Backbone.View.extend({
	templateLoader: directory.utils.templateLoader,
	
	initialize: function(data) {
		//console.log(data);
		this.model = new directory.models.CritereCollection();
		this.model.id = data.model.attributes.id;
		this.model.nom = data.model.attributes.nom;
		this.model.ce_critere = data.model.attributes.ce_parcours;
		this.model.findAll(this.model.id);
		this.model.bind('reset', this.render, this);
		this.template = _.template(directory.utils.templateLoader.get('critere-list'));
	},

	render: function(eventName) {
		var arr_criteres = new Array(),
			models = this.model.models;
		for (var i = 0; i < models.length; i++) {
			var critere = models[i].attributes;
			if (critere.ce_parent == 'null') {
				arr_criteres[critere.id_critere] = new Array();
				arr_criteres[critere.id_critere].push(critere.intitule);
			} else {
				var valeur = critere.id_critere+';'+critere.intitule;
				valeur += (critere.url_img == '') ? '' : ';'+critere.url_img;
				arr_criteres[critere.ce_parent].push(valeur);
			}
		}		
		//console.log(arr_criteres);
		var arr_floraison = new Array(),
			arr_feuillaison = new Array(),
			arr_fructification = new Array();
			
		arr_floraison.push("La plante est-elle en fleur ?");
		arr_floraison.push("floraison;La plante est en fleur.;reports.png");
		
		arr_feuillaison.push("L'espèce est-elle en feuille ?");
		arr_feuillaison.push("feuillaison;L'espèce est en feuille.;reports.png");
		
		arr_fructification.push("Des fruits sont-ils présents ?");
		arr_fructification.push("fructification;Il y a des fruits.;reports.png");
		
		arr_criteres.push(arr_floraison);
		arr_criteres.push(arr_feuillaison);
		arr_criteres.push(arr_fructification);
		
		var json = {
			"id" : this.model.id,
			"nom" : this.model.nom,
			"ce_critere" : this.model.ce_critere,
			"criteres" : arr_criteres,
			"total": directory.nbre_especes
		};
		
		$(this.el).empty();
		$(this.el).html(this.template(json));
		 _.each(arr_criteres, function(criteres) {
			$('#criteres-liste').append(new directory.views.CritereListItemView({el: $('#criteres-liste', this.el), model: criteres}).render().el);
		}, this);
		return this;
	}
});

directory.views.CritereListItemView = Backbone.View.extend({
	initialize: function(data) {
		//console.log(data);
		this.template = _.template(directory.utils.templateLoader.get('critere-list-item'));
	},

	render: function(eventName) {
		var arr_valeurs = new Array(),
			arr_checked = new Array();
		for (var i = 1; i < this.model.length; i++) {
			arr_checked.push(directory.criteria[this.model[0]] == this.model[i]);
			arr_valeurs.push(this.model[i]);
		}
		
		var json = {
			"titre" : this.model[0],
			"valeurs" : arr_valeurs,
			"checked" : arr_checked
		};
		$(this.el).append(this.template(json));
		return this;
	}
});


directory.views.Accueil = Backbone.View.extend({
	templateLoader: directory.utils.templateLoader,
	
	initialize: function(data) {
		//console.log(data);
		this.template = _.template(this.templateLoader.get('accueil-page'));
	},

	render: function(eventName) {
		$(this.el).html(this.template());
		return this;
	}
});


directory.views.saisieObs = Backbone.View.extend({
	initialize: function() {
		geolocaliser();
		var date = new Date(),
			jour = date.getDate(),
			mois = date.getMonth() + 1,
			annee = date.getFullYear(),
			aujourdhui = 
				( (''+jour).length < 2 ? '0' : '') + jour + '/' +
				( (''+mois).length < 2 ? '0' : '') + mois + '/' +
				annee;
		this.model.attributes.date = aujourdhui;
		this.template = _.template(directory.utils.templateLoader.get('saisie-obs'));
	},

	render: function(eventName) {
		this.model.attributes.position = this.position;
		//console.log(this.model);
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	}
});

directory.views.ObsPage = Backbone.View.extend({
	initialize: function(data) {
		//console.log(data);
		this.data = data.model.attributes;
		this.model = new directory.models.PhotoCollection();
		this.model.findByObs(data.model.attributes.id_obs);
		this.model.bind('reset', this.render, this);
		this.template = _.template(directory.utils.templateLoader.get('obs-page'));
	},

	render: function(eventName) { 	
		console.log(this.model);
		var photos = new Array();
		for (var i = 0; i < this.model.models.length; i++) {
			photos.push(this.model.models[i].attributes);
		}
		
		var json = {
			'obs' : this.data,
			'photos' : photos
		}
		$(this.el).html(this.template(json));
		return this;
	}
});

directory.views.transmissionObs = Backbone.View.extend({
	initialize: function(data) {
		this.model = new directory.models.ObsCollection();
		this.model.findAll();
		this.model.bind('reset', this.render, this);
		this.template = _.template(directory.utils.templateLoader.get('obs-list'));
	},

	render: function(eventName) { 
		var json = {
			'taille' : this.model.models.length,
			'obs' : this.model.models
		}
		
		$(this.el).html(this.template(json));
		return this;
	}
});


directory.views.comptePage = Backbone.View.extend({
	initialize: function() {
		this.template = _.template(directory.utils.templateLoader.get('compte'));
	},

	render: function(eventName) {
		//console.log(this.model);
		
		$(this.el).html(this.template());
		return this;
	}
});


// ------------------------------------------------------ Globals ------------------------------------------------- //
directory.liste = new Array();
directory.criteria = new Array();
directory.pheno = new Object();
directory.pheno["floraison"] = new Array();
directory.pheno["feuillaison"] = new Array();
directory.pheno["fructification"] = new Array();
directory.pheno.liste = new Array();
directory.nbre_criteres = new Array();
directory.nbre_especes = null;


// ----------------------------------------------- The Application Router ------------------------------------------ //

directory.Router = Backbone.Router.extend({
	routes: {
		"" : "accueil",
		"parcours" : "list",
		"parcours/:id_parcours" : "employeeDetails",
		"liste/:id_parcours/:nom_parcours/:id_critere" : "listeEspeces",
		"espece/:id_espece/:ce_parcours" : "especeDetails",
		"clef/:id_parcours/:nom_parcours/:ce_parcours" : "clefByParcours", 
		"obs/:id_espece/:nom_sci" : "nouvelleObs",
		"observation/:id_obs" : "detailsObs",
		"transmission" : "transmissionObs",
		"compte" : "compteUtilisateur"
	},

	initialize: function() {
		var self = this;


		directory.db.transaction(function (tx) {
			tx.executeSql("INSERT INTO photo (id_photo, chemin, ce_obs) VALUES (1, 'img/51162.jpg', 1)");
			tx.executeSql("INSERT INTO photo (id_photo, chemin, ce_obs) VALUES (2, 'img/61872.jpg', 1)");
			tx.executeSql("INSERT INTO photo (id_photo, chemin, ce_obs) VALUES (3, 'img/62318.jpg', 1)");
			tx.executeSql("INSERT INTO photo (id_photo, chemin, ce_obs) VALUES (4, 'img/87533.jpg', 1)");
			tx.executeSql("INSERT INTO photo (id_photo, chemin, ce_obs) VALUES (5, 'img/90094.jpg', 1)");
		});
		
		directory.db.transaction(function (tx) {
			var sql = 
				"SELECT id_critere, intitule FROM critere  " +
				"WHERE intitule LIKE '%feuillaison%' ";
			tx.executeSql(sql, [], function(tx, results) {
				var nbre = results.rows.length,
					i = 0;
				for (; i < nbre; i = i + 1) {
					var critere = results.rows.item(i);
					if (critere.intitule.indexOf("debut") != -1) {
						directory.pheno["feuillaison"]["debut"] = critere.id_critere;
					} else {
						directory.pheno["feuillaison"]["fin"] = critere.id_critere;
					}
				}
			});
		});
		directory.db.transaction(function (tx) {
			var sql = 
				"SELECT id_critere, intitule FROM critere  " +
				"WHERE intitule LIKE '%floraison%' ";

			tx.executeSql(sql, [], function(tx, results) {
				var nbre = results.rows.length,
					i = 0;
				for (; i < nbre; i = i + 1) {
					var critere = results.rows.item(i);
					if (critere.intitule.indexOf("debut") != -1) {
						directory.pheno["floraison"]["debut"] = critere.id_critere;
					} else {
						directory.pheno["floraison"]["fin"] = critere.id_critere;
					}
				}
			});
		});
		directory.db.transaction(function (tx) {
			var sql = 
				"SELECT id_critere, intitule FROM critere  " +
				"WHERE intitule LIKE '%fructification%' ";

			tx.executeSql(sql, [], function(tx, results) {
				var nbre = results.rows.length,
					i = 0;
				for (; i < nbre; i = i + 1) {
					var critere = results.rows.item(i);
					if (critere.intitule.indexOf("debut") != -1) {
						directory.pheno["fructification"]["debut"] = critere.id_critere;
					} else {
						directory.pheno["fructification"]["fin"] = critere.id_critere;
					}
				}
			});
		});
		
		
	
		// Keep track of the history of pages (we only store the page URL). Used to identify the direction
		// (left or right) of the sliding transition between pages.
		this.pageHistory = [];
		
		// Register event listener for back button troughout the app
		$('#content').on('click', '.header-back-button', function(event) {
			window.history.back();
			return false;
		});

		$('body').on('click', '#modalReset', function(event) {
			var id = event.currentTarget.attributes.id.value;
			var hash = window.location.hash,
				arr_hash = hash.split('/'),
				id = arr_hash[arr_hash.length-1];
			directory.db.transaction(
				function(tx) {
					var sql =
						'UPDATE parcours ' +
						'SET est_commence = 0 ' +
						'WHERE id = :id_parcours';
					tx.executeSql(sql, [id]);
					
					sql =
						'UPDATE avoir_critere ' +
						'SET vue = 0 ' +
						'WHERE id_critere = ' +
							'(SELECT ce_critere ' +
							'FROM parcours ' +
							'WHERE id = :id_parcours)';
					tx.executeSql(sql, [id]);
				},
				function(error) {
					console.log('DB | Error processing SQL: ' + error.code, error);
				}
			);
			$('#myModal').modal('hide');
		});
		
		$('#content').on('click', '.choix-parcours', function(event) {
			var id = this.id;
			directory.db.transaction(
				function(tx) {
					var sql =
						'SELECT est_commence ' +
						'FROM parcours ' +
						'WHERE id = :id_parcours';
					tx.executeSql(sql, [id], function(tx, results) {
						if (results.rows.item(0).est_commence == 1) {
							$('#myModal').modal('show');	
						}
					});
				},
				function(error) {
					console.log('DB | Error processing SQL: ' + error.code, error);
				}
			);
			directory.db.transaction(
				function(tx) {
					var sql =
						'UPDATE parcours ' +
						'SET est_commence = 1 ' +
						'WHERE id = :id_parcours';
					tx.executeSql(sql, [id]);
				},
				function(error) {
					console.log('DB | Error processing SQL: ' + error.code, error);
				}
			);
		});
		
		$('#content').on('click', '.vue-espece', function(event) {
			var hash = window.location.hash,
				arr_hash = hash.split('/'),
				num_nom = arr_hash[arr_hash.length - 2],
				ce_critere = arr_hash[arr_hash.length - 1];
				
			directory.db.transaction(
				function(tx) {
					var sql =
						'UPDATE avoir_critere ' +
							'SET vue = 1 ' +
							'WHERE id_espece = :num_nom ' +
							'AND id_critere = :ce_critere';
					tx.executeSql(sql, [num_nom, ce_critere]);
				},
				function(error) {
					console.log('DB | Error processing SQL: ' + error.code, error);
				}
			);
			
			$('#vue-modal').modal('show');
			window.history.back();
		});
		
		$('#content').on('click', '.criterium', function(event) {
			var sql_select = '',
				sql_and = '',
				sql_where = '',
				sql_order_by = '',
				arr_ids = new Array(),
				nbre_choix = 0,
				hash = window.location.hash,
				arr_hash = hash.split('/'),
				id_parcours = arr_hash[arr_hash.length - 1],
				parent = document.getElementById('criteres-liste'),
				inputs = document.getElementsByTagName('input', parent);
			
			if (id_parcours != 0) {
				sql_where = 
					"WHERE num_nom IN ( " +
						"SELECT num_nom " +
						"FROM espece e " +  
						"JOIN avoir_critere a ON a.id_espece = e.num_nom " +
						"WHERE id_critere = :ce_parcours " +
					" ) ";
				arr_ids.push(id_parcours);
			} else {
				sql_where = "";
			}

			directory.pheno.liste = new Array();
			for (var i = 0; i < inputs.length; i++) {
				$('#img_'+inputs[i].id).removeClass('selection-critere');
				if (inputs[i].checked) {
					if (directory.criteria[inputs[i].name] == this.value) {
						inputs[i].checked = false;
						delete directory.criteria[inputs[i].name];
					} else {
						$('#img_'+inputs[i].id).addClass('selection-critere');
						directory.criteria[inputs[i].name] = inputs[i].value;
						nbre_choix++;
						var id = inputs[i].value.split(';')[0];
						if (id % 1 === 0) {		//id est un nombre ?
							arr_ids.push(id);
						} else {
							directory.pheno.liste.push(id);
						}
					}
				}
			}
			//console.log(directory.criteria);
			//console.log(arr_ids, directory.pheno.liste);
			
			var sql_conditions = '',
				index = (id_parcours == 0) ? 0 : 1; 
			for (var i = index; i < arr_ids.length; i++) {
				sql_conditions += '?';
				if (i <= arr_ids.length - 2) {
					sql_conditions += ', ';
				}
			}
			if (arr_ids.length != 0) {
				if (id_parcours != 0 && arr_ids.length == 1) {
					sql_select = ", COALESCE(NULL, 0) AS count ";
				} else {
					sql_select = ", count(num_nom) AS count ";
				}
				
				if (id_parcours != 0 && arr_ids.length > 1 || id_parcours == 0) {
					sql_and = (sql_where == "") ? "WHERE" : "AND";
					sql_and += 
					" id_critere IN (" +
						sql_conditions + 
					") ";
				}
				sql_order_by = "count DESC, ";
			}
			
			
			var i = 0,
				criteres = [];
			directory.nbre_especes = 0;
			for (var index in directory.nbre_criteres) {
				directory.nbre_criteres[index] = 0;
			}
			directory.db.transaction(
				function(ta) {
					var sql =
						"SELECT num_nom " + sql_select + 
						"FROM espece e " +
						"JOIN avoir_critere a ON a.id_espece = e.num_nom " +
						sql_where + 
						sql_and + 
						"GROUP BY num_nom " +
						"ORDER BY " + sql_order_by + "nom_vernaculaire ASC " ;
					console.log(sql, arr_ids);
					ta.executeSql(sql, arr_ids, function(tx, results) {
						var nbre = results.rows.length,
							arr_pheno = directory.pheno.liste;
						//console.log('Total rows : ' + nbre);
						if (nbre == 0) {
							$('#resultats-recherche').html(' ' + nbre + ' ');
						}
						for (i = 0; i < nbre; i = i + 1) {	
							criteres[i] = results.rows.item(i).num_nom;
							console.log(results.rows.item(i));
							if (results.rows.item(i).count !== undefined) {
								directory.nbre_criteres[criteres[i]] = results.rows.item(i).count;
							} else {
								directory.nbre_criteres[criteres[i]] = 0;
							}
							
							if (directory.nbre_criteres[criteres[i]] == nbre_choix) {
								directory.nbre_especes++;
							}
							directory.liste = criteres;
							directory.liste.total = nbre_choix;
							console.log(directory.liste);
							console.log(directory.nbre_criteres, nbre_choix);
							$('#resultats-recherche').html(' ' + directory.nbre_especes + ' ');

						}
						
						
						var j = 0;
						for (; j < arr_pheno.length; j++) {
							var sql_where_pheno = 
								"WHERE id_espece IN ( " +
									"SELECT num_nom " +
									"FROM espece e " +  
									"JOIN avoir_critere a ON a.id_espece = e.num_nom " +
									"WHERE id_critere = " + id_parcours + 
								" ) ",
								sql_parent = (sql_where == '') ? "WHERE " : sql_where_pheno+"AND ",
								parametres = new Array(),
								sql = 
									"SELECT id_espece, intitule, ce_parent, " + 
									"COALESCE(NULL, NULL, ?) AS tour_boucle " +
									"FROM critere c " +
									"JOIN avoir_critere ac ON c.id_critere = ac.id_critere " +
									sql_parent + " ce_parent IN ( ?, ? )";
							parametres.push(j);
							parametres.push(directory.pheno[arr_pheno[j]]["debut"]); 
							parametres.push(directory.pheno[arr_pheno[j]]["fin"]);
							//console.log(sql, parametres);
							ta.executeSql(sql, parametres, function(tx, results) {
								var debut = -1,
									fin = -1,
									tour = -1,
									nbre = results.rows.length,
									k = 0;
								for (; k < nbre; k = k + 1) {
									tour += 1;
									//console.log(results.rows.item(k));
									var num_nom = results.rows.item(k).id_espece;
									for (var m = 0; m < directory.pheno.liste.length; m++) {
										if (results.rows.item(k).ce_parent == directory.pheno[directory.pheno.liste[m]]["debut"]) {
											debut = results.rows.item(k).intitule;
										} 
										if (results.rows.item(k).ce_parent == directory.pheno[directory.pheno.liste[m]]["fin"]) {
											fin = results.rows.item(k).intitule;
										}
									}
									
									if (tour == 1) {
										tour = -1;
										if (moisPhenoEstCouvert(debut, fin)) {
											if ($.inArray(num_nom, directory.liste) == -1) {
												directory.liste.push(num_nom);
											}
											if (directory.nbre_criteres[num_nom] === undefined) {
												directory.nbre_criteres[num_nom] = 0;
											}
											directory.nbre_criteres[num_nom]++;
										}
									}	
								}
								
								if (results.rows.item(k-1).tour_boucle == arr_pheno.length-1) {
									for (var l = 0; l < criteres.length; l++) {
										var index = criteres[l];
										if (directory.nbre_criteres[index] == nbre_choix) {
											directory.nbre_especes++;
										}
									}
									$('#resultats-recherche').html(' ' + directory.nbre_especes + ' ');
								}
								directory.liste = criteres;
								directory.liste.total = nbre_choix;
								console.log(directory.liste);
								console.log(directory.nbre_criteres, nbre_choix);
								//console.log(directory.nbre_criteres, nbre_choix);
							});
						}
					});
				},
				function(error) {
					console.log('DB | Error processing SQL: ' + error.code, error);
				}
			);	
		});
		
		
		$('#content').on('click', '#criteres-reset', function(event) {			
			var parent = document.getElementById('criteres-liste'),
				inputs = document.getElementsByTagName('input', parent);
				
			for (var i = 0; i < inputs.length; i++) {
				inputs[i].checked = false;
			}
			directory.liste = new Array();
			directory.criteria = new Array();
			directory.nbre_criteres = new Array();
			directory.nbre_especes = null;
			$('#resultats-recherche').html('');
		});
		
		
		$('#content').on('click', '#geolocaliser', geolocaliser);
		$('#content').on('click', '#sauver-obs', function(event) {
			directory.db.transaction(
				function(tx) {
					var sql =
						'SELECT id_obs ' +
						'FROM obs ' + 
						'ORDER BY id_obs DESC';
					tx.executeSql(sql, [], function(tx, results) {
						var obs = new Array(),
							id = (results.rows.length == 0) ? 1 : results.rows.item(0).id_obs+1;
							sql =
								'INSERT INTO obs ' +
								'(id_obs, date, latitude, longitude, commune, code_insee, mise_a_jour, ce_espece) VALUES ' + 
								'(?, ?, ?, ?, ?, ?, ?, ?) ';
							
						obs.push(id);
						obs.push($('#date').html());
						obs.push($('#lat').html());
						obs.push($('#lng').html());
						obs.push($('#location').html());
						obs.push($('#code_insee').val());
						obs.push(($('#code_insee').val() == 0) ? 0 : 1);
						obs.push($('#num_nom_select').val());
						
						tx.executeSql(sql, obs);
						self.transmissionObs();
					});
				},
				function(error) {
					console.log('DB | Error processing SQL: ' + error.code, error);
				}
			);
			//console.log(obs);
		});
		
		
		$('#content').on('click', '.ajouter-photos', function(event) {
			var options = null;
			if (this.id = "chercher-photos") {
				options = { sourceType: pictureSource.PHOTOLIBRARY };
			}
			navigator.camera.getPicture(
			onPhotoSuccess, 
			function(message){
				alert('Erreur camera: ' + message);
				console.log('CAMERA failed because: ' + message);
			},
			options);
		});
		
		
		$('#content').on('blur', '#courriel', requeterIdentite);
		$('#content').on('keypress', '#courriel', function(event) {
			if (event.which == 13) {
				requeterIdentite(event);
			}
		});
		$('#content').on('click', '#valider_courriel', requeterIdentite);
		
		
		// Check of browser supports touch events...
		if (document.documentElement.hasOwnProperty('ontouchstart')) {
			// ... if yes: register touch event listener to change the "selected" state of the item
			$('#content').on('touchstart', 'a', function(event) {
				self.selectItem(event);
			});
			$('#content').on('touchend', 'a', function(event) {
				self.deselectItem(event);
			});
		} else {
			// ... if not: register mouse events instead
			$('#content').on('mousedown', 'a', function(event) {
				self.selectItem(event);
			});
			$('#content').on('mouseup', 'a', function(event) {
				self.deselectItem(event);
			});
		}

		// We keep a single instance of the SearchPage and its associated Employee collection throughout the app
		this.searchResults = new directory.models.EmployeeCollection();
		this.searchPage = new directory.views.SearchPage({model: this.searchResults});
		this.searchPage.render();
		$(this.searchPage.el).attr('id', 'searchPage');
	},
	
	accueil: function() {
		var self = this;
		self.slidePage(new directory.views.Accueil().render());
	},
			
	selectItem: function(event) {
		$(event.target).addClass('tappable-active');
	},

	deselectItem: function(event) {
		$(event.target).removeClass('tappable-active');
	},

	list: function() {
		var self = this;
		this.slidePage(this.searchPage);
	},

	employeeDetails: function(id) {
		var employee = new directory.models.Employee({id: id}),
			self = this;
		employee.fetch({
			success: function(data) {
				self.slidePage(new directory.views.ParcoursPage({model: data}).render());
			}
		});
	},
	
	listeEspeces: function(id, nom, critere) {
		var espece = new directory.models.Espece({id: id, name: nom, id_critere: critere}),
			self = this;
		espece.fetch({
			success: function(data) {
				//console.log(data); //viens fumer un joint
				self.slidePage(new directory.views.ListPage({model: data}).render());
			}
		});
	},
	
	especeDetails: function(id, ce_critere) {
		var espece = new directory.models.Espece({id: id, ce_critere: ce_critere}),
			self = this;
		espece.fetch({
			success: function(data) {
				//console.log(data);
				self.slidePage(new directory.views.EspecePage({model: data}).render());
			}
		});
	},
	
	clefByParcours: function(id, nom, ce_parcours) {
		var critere = new directory.models.Critere({id: id, nom: nom, ce_parcours: ce_parcours}),
			self = this;
		critere.fetch({
			success: function(data) {
				//console.log(data);
				self.slidePage(new directory.views.CriterePage({model: data}).render());
			}
		});
	},
	
	nouvelleObs: function(num_nom, nom_sci) {
		var obs = new directory.models.Obs({ id: num_nom, nom_sci: nom_sci }),
			self = this;
			
		directory.liste = new Array();
		directory.criteria = new Array();
		obs.fetch({
			success: function(data) {
				//console.log(data);
				self.slidePage(new directory.views.saisieObs({model: data}).render());
				//window.history.back();
			}
		});
	},
	
	detailsObs: function(id_obs) {
		var obs = new directory.models.Obs({ id: id_obs }),
			self = this;
			
		obs.fetch({
			success: function(data) {
				//console.log(data);
				self.slidePage(new directory.views.ObsPage({model: data}).render());
			}
		});
	},
	
	transmissionObs: function(data) {
		this.slidePage(new directory.views.transmissionObs().render());
	},
	
	compteUtilisateur: function(data) {
		this.slidePage(new directory.views.comptePage().render());
	},
	

	slidePage: function(page) {
		var slideFrom,
			self = this;

		// If there is no current page (app just started) -> No transition: Position new page in the view port
		if (!this.currentPage) {
			$(page.el).attr('class', 'page stage-center');
			$('#content').append(page.el);
			this.pageHistory = [window.location.hash];
			this.currentPage = page;
			return;
		}

		// Cleaning up: remove old pages that were moved out of the viewport
		$('.stage-right, .stage-left').not('#searchPage').remove();

		if (page === this.searchPage) {
			// Always apply a Back (slide from left) transition when we go back to the search page
			slideFrom = "left";
			$(page.el).attr('class', 'page stage-left');
			// Reinitialize page history
			this.pageHistory = [window.location.hash];
		} else if (this.pageHistory.length > 1 && window.location.hash === this.pageHistory[this.pageHistory.length - 2]) {
			// The new page is the same as the previous page -> Back transition
			slideFrom = "left";
			$(page.el).attr('class', 'page stage-left');
			this.pageHistory.pop();
		} else {
			// Forward transition (slide from right)
			slideFrom = "right";
			$(page.el).attr('class', 'page stage-right');
			this.pageHistory.push(window.location.hash);
		}

		$('#content').html(page.el);

		// Wait until the new page has been added to the DOM...
		setTimeout(function() {
			// Slide out the current page: If new page slides from the right -> slide current page to the left, and vice versa
			$(self.currentPage.el).attr('class', 'page transition ' + (slideFrom === "right" ? 'stage-left' : 'stage-right'));
			// Slide in the new page
			$(page.el).attr('class', 'page stage-center transition');
			self.currentPage = page;
		});

	}

});

// Bootstrap the application
directory.db = window.openDatabase("ParcoursDAO", "1.0", "Employee Demo DB", 200000);
var employeeDAO = new directory.dao.ParcoursDAO(directory.db);
var especeDAO = new directory.dao.EspeceDAO(directory.db);
var critereDAO = new directory.dao.CritereDAO(directory.db);
var avr_critereDAO = new directory.dao.AvoirCritereDAO(directory.db);
especeDAO.populate();
employeeDAO.populate();
critereDAO.populate();
avr_critereDAO.populate();
(new directory.dao.ObsDAO(directory.db)).populate();
(new directory.dao.PhotoDAO(directory.db)).populate();
//(new directory.dao.UtilisateurDAO(directory.db)).populate();

$().ready(function() {
	directory.utils.templateLoader.load(
		['search-page', 'accueil-page', 'parcours-page', 'parcours-list-item', 
		 'espece-list-item', 'list-page', 'espece-page', 'critere-list-item', 'critere-list', 
		 'saisie-obs', 'compte', 'obs-list', 'obs-page'],
		function() {
			directory.app = new directory.Router();
			Backbone.history.start();
		});
});


function moisPhenoEstCouvert( debut, fin) {
	var mois_actuel = new Date().getMonth() + 1,
		flag = false;
	//console.log(mois_actuel, debut, fin);
	
	if (debut != -1 && fin != -1) {
		if (debut <= fin) {
			flag = (mois_actuel >= debut && mois_actuel <= fin);
		}
		if (debut == fin) {
			flag = (mois_actuel == debut);
		}
		if (debut >= fin) {
			flag = (mois_actuel >= debut && mois_actuel <= 12 || mois_actuel >= 1 && mois_actuel <= fin);
		}
	}
	
	return(flag);
}


function onPhotoSuccess(imageData){
	$('#obs-photos-info').append(imageData);			
	directory.db.transaction(
		function(tx) {
			var hash = window.location.hash,
				sql =
					'SELECT id_photo ' +
					'FROM photo ' + 
					'ORDER BY id_obs DESC';
			tx.executeSql(sql, [], function(tx, results) {
				var photo = new Array(),
					id = (results.rows.length == 0) ? 1 : results.rows.item(0).id_photo + 1;
					sql =
						'INSERT INTO photo ' +
						'(id_photo, chemin, ce_obs) VALUES ' + 
						'(?, ?, ?) ';
					
				photo.push(id);
				photo.push(imageData);
				photo.push(hash[hash.length - 1]);
				
				tx.executeSql(sql, photo);
				//self.transmissionObs();
			});
		},
		function(error) {
			alert('DB | Error processing SQL: ' + error.code, error);
			console.log('DB | Error processing SQL: ' + error.code, error);
		}
	);
}



/*

		directory.db.transaction(function (tx) {
		var arr_pheno = new Array("feuillaison", "floraison", "fructification");
			for(var i = 0; i < arr_pheno.length; i++) {
				var sql = 
					"SELECT id_critere, intitule FROM critere  " +
					"WHERE intitule LIKE '%" + arr_pheno[i] + "%' ";

				tx.executeSql(sql, [], function(tx, results) {
					var nbre = results.rows.length,
						j = 0;
					for (; j < nbre; j = j + 1) {
						var critere = results.rows.item(j);
						if (critere.intitule.indexOf("debut") != -1) {
							directory.pheno[arr_pheno[i]]["debut"] = critere.id_critere;
						} else {
							directory.pheno[arr_pheno[i]]["fin"] = critere.id_critere;
						}
					}
				});
			}
		});
*/


function geolocaliser() {
	$('#geo-infos').html('Calcul en cours...');
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(surSuccesGeoloc, surErreurGeoloc);
	} else {
		$('#geo-infos').html('Calcul impossible.');
		var erreur = { code: '0', message: 'Géolocalisation non supportée par le navigateur'};
		surErreurGeoloc(erreur);
	}
}
function surSuccesGeoloc(position) {
	var TEXTE_HORS_LIGNE = 'Aucune connexion.',
		SERVICE_NOM_COMMUNE_URL = 'http://www.tela-botanica.org/service:eflore:0.1/osm/nom-commune?lon={lon}&lat={lat}';
	
	if (position) {
		var lat = position.coords.latitude;
		var lng = position.coords.longitude;
		$('#lat').html(lat);
		$('#lng').html(lng);

		console.log('Geolocation SUCCESS');
		var url_service = SERVICE_NOM_COMMUNE_URL;
		var urlNomCommuneFormatee = url_service.replace('{lat}', lat).replace('{lon}', lng);
		var jqxhr = $.getJSON(urlNomCommuneFormatee, function(data) {
			console.log('NOM_COMMUNE found.');
			$('#location').html(data['nom']);
			$('#code_insee').val(data['codeINSEE']);
		})
		.complete(function() { 
			$('#geo-infos').html('');
			//var texte = ($('#location').html() == '') ? TEXTE_HORS_LIGNE : $('#location').html();
			//$('#location').html(texte);
		})
		;
	}
}
function surErreurGeoloc(error){
	$('#geo-infos').html('Calcul impossible.');
	console.log('Echec de la géolocalisation, code: ' + error.code + ' message: '+ error.message);
}



function requeterIdentite() {
	var SERVICE_ANNUAIRE = "http://www.tela-botanica.org/client/annuaire_nouveau/actuelle/jrest/utilisateur/identite-par-courriel/";
	var courriel = $('#courriel').val();
	if (courriel != '') {
		$('#utilisateur-infos').html('Vérification en cours...');
		//miseAJourCourriel();
		var urlAnnuaire = SERVICE_ANNUAIRE + courriel;
		$.ajax({
			url : urlAnnuaire,
			type : 'GET', 
			success : function(data, textStatus, jqXHR) {
				$('#utilisateur-infos').html(data[courriel]);
				console.log('Annuaire SUCCESS : ' + textStatus);
				if (data != undefined && data[courriel] != undefined) {
					var infos = data[courriel];
					$('#id_utilisateur').val(infos.id);
					$('#prenom_utilisateur').val(infos.prenom);
					$('#nom_utilisateur').val(infos.nom);
					$('#courriel_confirmation').val(courriel);
					$('#prenom_utilisateur, #nom_utilisateur, #courriel_confirmation').attr('disabled', 'disabled');
				} else {
					surErreurCompletionCourriel();
				}
			},
			error : function(jqXHR, textStatus, errorThrown) {
				$('#utilisateur-infos').html('Vérification impossible.');
				console.log('Annuaire ERREUR : ' + textStatus);
				surErreurCompletionCourriel();
			},
			complete : function(jqXHR, textStatus) {
				console.log('Annuaire COMPLETE : ' + textStatus);
				$('#zone_prenom_nom').removeClass('hide');
				$('#zone_courriel_confirmation').removeClass('hide');
			}
		});
	}
}

function surErreurCompletionCourriel() {
	$('#prenom_utilisateur, #nom_utilisateur, #courriel_confirmation').val('');
	$('#prenom_utilisateur, #nom_utilisateur, #courriel_confirmation').removeAttr('disabled');
}