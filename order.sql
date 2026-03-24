-- Tạo Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ProductDB')
BEGIN
    CREATE DATABASE ProductDB;
END
GO

USE ProductDB;
GO

-- Tạo bảng Products
CREATE TABLE Products (
    id INT IDENTITY PRIMARY KEY,
    name NVARCHAR(100),
    price FLOAT,
    stock INT
);
GO

-- Tạo bảng Orders
CREATE TABLE Orders (
    id INT IDENTITY PRIMARY KEY,
    productId INT,
    quantity INT,
    orderDate DATETIME DEFAULT GETDATE()
);
GO


-- Hàm tính tổng
CREATE FUNCTION fn_TotalPrice (@price FLOAT, @quantity INT)
RETURNS FLOAT
AS
BEGIN
    RETURN @price * @quantity;
END;


--Tạo Trigger tự động trừ kho khi có đơn hàng mới (từ code của bạn)
CREATE TRIGGER trg_CheckStock
ON Orders
AFTER INSERT
AS
BEGIN
    IF EXISTS (
        SELECT 1
        FROM Products p
        JOIN inserted i ON p.id = i.productId
        WHERE p.stock < i.quantity
    )
    BEGIN
        RAISERROR (N'Không đủ hàng trong kho', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;

-- Thêm sẵn một vài dữ liệu mẫu để test Web
INSERT INTO Products (name, price, stock) VALUES 
(N'Giày Nike Precision 5', 1500000, 50),
(N'Giày Nike Mamba Focus', 2200000, 30),
(N'Giày Nike LeBron Ambassador 13', 3500000, 20);
GO