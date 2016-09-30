var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');
var bcrypt = require('bcrypt');
var stripe = require("stripe")("SK_KEY_HERE"); //Put your key here
sqlite3.verbose();
var db = new sqlite3.Database('parkNgoDB.db');
db.run("PRAGMA foreign_keys=ON");

//login with credentials
router.post('/login', function(req, res) {
    var license_plate = req.body.license_plate;
    var password = req.body.password;

    var checkLogin = function(err, result) {
        if (err) {
            console.log("login error: " + err)
            res.send('Error');
        } else {
            if (result){
              //Check password against encryption    
              if(bcrypt.compareSync(password, result.password)){

                res.send('Success');
              } else {
                res.send('Error');
              }
            } else {
              res.send('Error');
            } 
        }
    }

    db.serialize(function() {
        db.get("select *\
                 from user\
                 where license_plate = ? ", license_plate, checkLogin);
    });
});


//newAccount POST
router.post('/newAccount', function(req, res) {
	console.log("New account with " + JSON.stringify(req.body));
    var license_plate = req.body.license_plate;
    var fname = req.body.fname;
    var email = req.body.email;
    var password = req.body.password;
    var stripeToken = req.body.stripeToken;

    var checkAccountCreated = function(err) {
        if (err) {
            console.log("checkAccountCreated error: " + err);
            res.send('Error');
        } else {
        	console.log("checkAccountCreated success");
            res.send('Success');
        }
    }

    //Check if plate has already been registered
    var checkPlate = function(err, result) {
    	console.log("in checkPlate");
        if (err) {
        	console.log("Failed to checkPlate" + err.message);
            res.send('Error');
        } else {
            if (result){
                var stat = "License plate already used!";
                res.send('Error');
            } else {
            	stripe.customers.create({
					source: stripeToken,
					email: email,
					description: fname
				}).then(function(customer) {
					console.log("Creating customer in DB");
                    //Encrypt password in DB
					var salt = bcrypt.genSaltSync(10);
	                var hash = bcrypt.hashSync(password, salt);
	                db.serialize(function() {
	                    db.run('insert into user values (?,?,?,?,?)',license_plate,fname,email,hash,customer.id,checkAccountCreated);
	                });
				});
            }
        }
    }

    //Get user based on plate
    db.serialize(function() {
        db.get("select * from user where license_plate = ?;", license_plate, checkPlate);
    });
    
});

//Route if user is parking
router.post('/parked', function(req, res) {
	var license_plate = req.body.license_plate;
    var spot_num = req.body.spot_num;

    var getUserResult = function(err, result) {
        if (err) {
            res.send('Error');
        } else {
            if (result){
                //Insert user parked at server time
            	var time_in = (new Date).getTime();
                db.run('insert into parking values (NULL,?,?,?,NULL,NULL,NULL)',license_plate,spot_num,time_in);
                res.send('Success');
            } else {
            	res.send('Error');
            }
        }
    }

	db.serialize(function() {
					db.get("select * from user where license_plate = ? ", license_plate, getUserResult);
                });

});

//Route to take when user has left the parking
router.post('/leftparking', function(req, res) {
	var license_plate = req.body.license_plate;
	var time_in = null;
	var parking_id = null;

	var getCustId = function(err, result) {
        if (err) {
            res.send('Error');
        } else {
            if (result){
            	var time_out = (new Date).getTime();
            	var total_min = Math.floor((time_out - time_in)/60000);
            	var total_charge = total_min*50;
            	var customerId = result.stripe_cust_id;

                //Stripe requires atleast 50 cents
            	if (total_charge > 50) {
	            	stripe.charges.create({
						amount: total_charge, // amount in cents, again
						currency: "cad",
						customer: customerId // Previously stored, then retrieved
					}, function(err, charge) {
						if (err) {
							res.send('Error');
							console.log("Error with charge: " + err.message);
						} else {
							db.run('update parking set time_out = ?, total_min = ?, total_charge = ? where parking_id = ?',time_out,total_min,total_charge,parking_id);
	                		res.send('Success,You have been charged: $' + total_charge/100);
	                		console.log("Success with charge: " + JSON.stringify(charge));
						}
	  
					});
            	} else {
            		db.run('update parking set time_out = ?, total_min = ?, total_charge = ? where parking_id = ?',time_out,total_min,total_charge,parking_id);
                    //Complimentary parking if less than 50 cents
            		res.send('Success,You have been charged: $0.00');
            	}
            } else {
            	res.send('Error');
            }
        }
    }

	var getUser = function(err, result) {
		console.log("Getting user");
        if (err) {
            res.send('Error');
        } else {
            if (result){
            	time_in = result.time_in;
            	parking_id = result.parking_id;
				db.get("select * from user where license_plate = ?", license_plate, getCustId);
            } else {
            	res.send('Error');
            }
        }
    }

	db.serialize(function() {
					db.get("select * from parking where license_plate = ? and time_out is null or time_out = ''", license_plate, getUser);
                });

});

//Route to take for list of parkings for a user
router.post('/listofparking', function(req, res) {
	var license_plate = req.body.license_plate;

    var getListParkingCB = function(err, rows) {
        if (err) {
            res.send('Error');
        } else {
            if (rows){
                res.send(rows);
            } else {
            	res.send('Error');
            }
        }
    }

	db.serialize(function() {
					db.all("select * from parking where license_plate = ? ", license_plate, getListParkingCB);
                });

});

module.exports = router;
