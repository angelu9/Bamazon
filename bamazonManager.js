//NOTE: using 'exit' to return to main() from addInvntory() or newProduct() causes memory leak and multiple instances of inquirer to run when reinvoking those functions.

//npm packages
var inquirer = require('inquirer');
var mysql = require('mysql');
var cTable = require('console.table');

//makes connection to server
var connection = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: '',
    password: '',
    database: 'bamazonDB'
});

connection.connect(function (err) {
    if (err) throw (err);

    console.log('Connection ID: ' + connection.threadId + '\n');
    main();
});

//controls main flow
function main() {

    console.log('\n');

    //prompts user for task they wish to perform
    inquirer.prompt({
        name: 'option',
        type: 'list',
        message: 'Please select an option.',
        choices: ['View Products for Sale', 'View Low Inventory', 'Add to Inventory', 'Add New Product', 'Exit']
    })
        .then(function (answer) {
            
            //Calls appropriate function based on user selection.
            switch (answer.option) {

                case ('View Products for Sale'):

                    viewProducts();
                    break;

                case ('View Low Inventory'):

                    lowInventory();
                    break;

                case ('Add to Inventory'):

                    addInventory();
                    break;

                case ('Add New Product'):

                    newProduct();
                    break;

                case ('Exit'):

                    process.exit();
            }
        });
};

//Recieves server query responses from other functions and creates/logs info in table format then invokes main() again.
function constructTable(res) {

    var resultArray = [];

    for (var i = 0; i < res.length; i++) {

        resultArray[i] = [res[i].id, res[i].product_name, res[i].dept, res[i].price, res[i].stock];

    }

    console.log('\n');
    console.table(['ID', 'Product Name', 'Department', 'Price', 'Stock'], resultArray);

    main();
};

//Query server for all products and passes response to constructTable().
function viewProducts() {

    var query = connection.query('SELECT * FROM products ORDER BY dept', function (err, res) {

        if (err) throw (err);

        console.log("\nAll Products: (By Department)");
        console.log("------------------------------------------------------------------------");
        constructTable(res);
    });
};

//Query server for all products with stock < 5 and passes response to constructTable().
function lowInventory() {

    var query = connection.query('SELECT * FROM products WHERE stock<5', function (err, res) {

        if (err) throw (err);

        console.log("\nLow Inventory Report:");
        console.log("------------------------------------------------------------------------");
        constructTable(res);
    });

};

//Adds stock amount to product
function addInventory() {

    //Query server for list of products and prints table for user. Creates idCheckArray for use in validation.
    var query = connection.query('SELECT * FROM products ORDER BY id', function (err, res) {

        if (err) throw (err);

        var resultArray = [];
        var idCheckArray = [];
        var amount = 0;
        var id = 0;

        for (var i = 0; i < res.length; i++) {

            resultArray[i] = [res[i].id, res[i].product_name, res[i].dept, res[i].price, res[i].stock];
            idCheckArray[i] = parseInt(res[i].id);

        }

        console.log('\n');
        console.table(['ID', 'Product Name', 'Department', 'Price', 'Stock'], resultArray);

        //Requests product id from user.
         
            {   //requests amount user wishes to add.
                name: 'amount',
                type: 'input',
                message: 'How many would you like to add? (type "exit" to return to main menu',
                validate(answer) {

                    //Ensures user entered a valid number, if 'exit' is entered, returns to main().
                    var exit = answer.toLowerCase();

                    if (exit == "exit") {
                        return main();
                    }

                    amount = parseInt(answer);

                    if (isNaN(amount)) {

                        return ("Please enter a valid quatity.");

                    } else {

                        return (true);

                    }
                }
            }
        ])
            .then(function (answer) {

                //Asks user to verify information.
                inquirer.prompt({
                    type: 'confirm',
                    name: 'verify',
                    message: amount + " will be added to the quatity of product ID " + id + ". Is this correct?",
                    default: 'false'
                })
                    .then(function (answer) {

                        //if user verifys information, database is updated and main() is called. If info is incorrect, addInventory() calls itslef.
                        if (answer.verify === true) {

                            connection.query("UPDATE products SET stock = stock + ? WHERE id =?", [amount, id], function (err, res) {

                                if (err) throw (err);

                                console.log("\nItem ID: " + id + " -  stock succesfully updated.\n");
                                main();
                            });

                        } else {
                            addInventory();
                        }

                    });


            });

    });

};

//Creates new product.
function newProduct() {

    //Requests product info from user.
    inquirer.prompt([
        {
            name: 'itemName',
            type: 'input',
            message: 'Enter Product Name: ',
            validate(answer) {
                var answer = answer.toLowerCase();

                if (answer == 'exit') {

                    main();
                    this.rl.output.end();
                } else {

                    if (answer && answer != 'exit') {
                        return (true);
                    } else {
                        return ('Please enter a product name.')
                    }
                }
            }
        },
        {
            name: 'dept',
            type: 'input',
            message: 'Enter a department (optional): ',
            validate(answer) {
                var answer = answer.toLowerCase();

                if (answer === 'exit') {
                    return main();
                } else {
                    return (true);
                }
            }
        },
        {
            name: 'price',
            type: 'input',
            message: 'Please enter a price: $',
            validate(answer) {
                var price = parseFloat(answer);
                var exit = answer.toLowerCase();

                if (exit === 'exit') {
                    return main();
                } else {

                    if (isNaN(price)) {
                        return ('Please enter a valid price.')
                    } else {
                        return (true);
                    }
                }
            }
        },
        {
            name: 'stock',
            type: 'input',
            message: 'Please enter the initial stock amount: ',
            validate(answer) {
                var stock = parseInt(answer);
                var exit = answer.toLowerCase();

                if (exit === 'exit') {
                    return main();
                } else {

                    if (isNaN(answer)) {
                        return ('Please enter a valid amount.');
                    } else {
                        return (true);
                    }
                }
            }
        }
    ]).then(function (answer) {

        //stores infor collected in variables and ensure proper type.
        var itemName = answer.itemName;
        var dept = answer.dept;
        var price = parseFloat(answer.price);
        var stock = parseInt(answer.stock);

        //prompts user to confirm information.
        inquirer.prompt({
            type: 'confirm',
            name: 'verify',
            message: 'Please confirm you wish to add: ' + itemName + ' Price: $' + price + ' Stock: ' + stock,
            default: false
        }).then(function (answer) {

            //if user confirms, database is updated with new product and main() is called. If info in invalid, newProduct() calls itself to collect new info.
            if (answer.verify == true) {
                var query = connection.query('INSERT INTO products (product_name, dept, price, stock) VALUES (?,?,?,?)',
                    [itemName, dept, price, stock],
                    function (err, res) {

                        if (err) throw (err);

                        console.log('Item added successfully.');
                        main();
                    });

            } else {
                newProduct();
            }


        });
    });

};
