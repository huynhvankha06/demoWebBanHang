CREATE DATABASE ProductDB;
GO

USE ProductDB;
GO

CREATE TABLE Products (
    id INT IDENTITY PRIMARY KEY,
    name NVARCHAR(100),
    price FLOAT,
    stock INT
);

CREATE TABLE Orders (
    id INT IDENTITY PRIMARY KEY,
    productId INT,
    quantity INT,
    orderDate DATETIME DEFAULT GETDATE()
);
CREATE FUNCTION fn_TotalPrice (@price FLOAT, @quantity INT)
RETURNS FLOAT
AS
BEGIN
    RETURN @price * @quantity;
END;


CREATE TRIGGER trg_UpdateStock
ON Orders
AFTER INSERT
AS
BEGIN
    UPDATE Products
    SET stock = stock - i.quantity
    FROM Products p
    JOIN inserted i ON p.id = i.productId;
END;