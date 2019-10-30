DROP DATABASE IF EXISTS bamazonDB;

CREATE DATABASE bamazonDB;

USE bamazonDB;

CREATE TABLE products
(
    id INT NOT NULL AUTO_INCREMENT,
    product_name VARCHAR(100) NOT NULL,
    dept VARCHAR(30),
    price DECIMAL(10,2) NOT NULL,
    stock INT,
    PRIMARY KEY (id)
);

SELECT * FROM products;