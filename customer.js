//NOTE: using 'exit' to return to main() from second inquirer prompt causes memory leak and multiple instances of inquirer to display.
//npm packages
var inquirer = require('inquirer');
var mysql = require('mysql');
var cTable = require('console.table');

//Making connection to server.
var connection = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'acmilan10',
    database: 'bamazonDB'
});

connection.connect(function (err) {
    if (err) throw (err);

    console.log('Connection ID: ' + connection.threadId + '\n');
    main();
});

//main control function.
function main() {

    //query server for item list and  print for user.
    var query = connection.query('SELECT * FROM products', function (err, res) {

        if (err) throw (err);

        var resultArray = [];
        var idCheckArray = [];
        var amount = 0;
        var id = 0;

        //resultArray = formatted for console.table. idCheckArray = integer version of ids to check against.
        for (var i = 0; i < res.length; i++) {

            resultArray[i] = [res[i].id, res[i].product_name, res[i].dept, res[i].price, res[i].stock];
            idCheckArray[i] = parseInt(res[i].id);

        }

        console.log('\n');
        console.table(['ID', 'Product Name', 'Department', 'Price', 'Stock'], resultArray);

        //prompts user for item id and amount to be purchased.
        inquirer.prompt([
            {
                name: 'itemid',
                type: 'input',
                message: 'Please enter the ID number of the item you wish to purchase. (type "exit" to close the program)',
                validate(answer) {

                    var valid = false;
                    var exit = answer.toLowerCase();

                    //exits program if user submits 'exit'
                    if (exit == "exit") {
                        process.exit();
                    }

                    //checks validity of user input against idCheckArray.
                    for (var j = 0; j < idCheckArray.length; j++) {

                        if (answer == idCheckArray[j]) {

                            valid = true;

                        } else {
                        }
                    }

                    if (valid === true && exit != "exit") {

                        return (true);

                    } else {

                        return ("Item ID does not exist. Please enter a valid ID.");
                    }
                }
            },
            {
                name: 'amount',
                type: 'input',
                message: 'Please enter the amount you wish to purchase. (type "exit" to return to main menu)',
                validate(answer) {

                    //gets amount and converts to integer
                    amount = parseInt(answer);
                    var exit = answer.toLowerCase();
                    

                    if (exit == "exit") {
                        return main();
                    }

                    //Checks to make sure the user entered a valid number.
                    if (isNaN(amount)) {

                        return ('Please enter a valid quantity.');

                    } else {

                        return (true);
                    }
                }
            }
        ])
            .then(function (answer) {

                //ensures id and amount and integers and calls orderCompletion function.
                id = parseInt(answer.itemid);
                amount = parseInt(amount);
                orderCompletion(id, amount);
            });
    });
};

function orderCompletion(id, amount) {

    //Query server for product info of desired item id.
    connection.query('SELECT * FROM products WHERE id=?', id, function(err, res) {

        if(err) throw(err);

        //ensures price and stock recieved from server are proper type. int/float.
        var stock = parseInt(res[0].stock);
        var price = parseFloat(res[0].price);
     
        //ensures stock is greater then the amount ordered, if not user is notified and main is called.
        if(stock > amount) {

            //performs calculations and ensures monetary values are to 2 decimal places.
            var newAmount = stock - amount;
            var total = price * amount;
            total = total.toFixed(2);
            var product = res[0].product_name;

            //Query server to update stock amount.
            connection.query('UPDATE products SET stock = ? WHERE id = ?',[newAmount, id], function(err, res){

                if(err) throw(err);

                //notifies user of their order information.
                console.log('\nYour order is complete! Product: ' + product + ' Quantity: ' + amount + ' Total: $' + total);
                main();
 
            });
        
        }else{
            console.log('\nInsufficient quantity!');
            return main();
        }

    });

};