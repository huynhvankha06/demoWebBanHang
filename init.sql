-- Kiểm tra và tạo database nếu chưa có
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ProductDB')
BEGIN
    CREATE DATABASE ProductDB;
END
GO

USE ProductDB;
GO

-- Bắt đầu dán code tạo bảng Products, Orders và Trigger của bạn vào dưới đây:
CREATE TABLE Products (
    p_id INT PRIMARY KEY,
    -- ... các cột khác
);
GO
-- ... (tiếp tục code của bạn)