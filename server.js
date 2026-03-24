const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Abc123@123',
  server: process.env.DB_SERVER || 'db',
  database: process.env.DB_NAME || 'ProductDB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function connectWithRetry(maxRetries = 20, delayMs = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await sql.connect(config);
      console.log('✅ Connected to DB');
      return;
    } catch (err) {
      console.log(
        `🔄 Connect attempt ${i + 1}/${maxRetries} failed: ${err.message}`,
      );
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw new Error('Max retries reached. Cannot connect to DB.');
}

connectWithRetry();

// --- KHU VỰC CỦA CHỦ CỬA HÀNG (ADMIN) ---

// 1. Thêm sản phẩm mới hoặc nhập thêm hàng vào kho
app.post('/add-product', async (req, res) => {
  try {
    let { name, price, stock } = req.body;
    await sql.query`
        INSERT INTO Products(name, price, stock)
        VALUES(${name}, ${price}, ${stock})
    `;
    res.json({ success: true, message: 'Nhập hàng vào kho thành công' });
  } catch (err) {
    console.error('Add product error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Lấy danh sách sản phẩm để hiển thị cho nhân viên bán
app.get('/products', async (req, res) => {
  try {
    const result = await sql.query(
      'SELECT * FROM Products WHERE stock > 0 ORDER BY id DESC',
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- KHU VỰC CỦA NHÂN VIÊN BÁN HÀNG ---

// 3. Tạo đơn hàng (Đã thêm logic kiểm tra tồn kho)
app.post('/order', async (req, res) => {
  try {
    let { productId, quantity, price } = req.body;

    // Lấy số lượng tồn kho hiện tại của sản phẩm
    const checkStockResult =
      await sql.query`SELECT stock FROM Products WHERE id = ${productId}`;

    // Kiểm tra xem sản phẩm có tồn tại không
    if (checkStockResult.recordset.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: 'Sản phẩm không tồn tại.' });
    }

    const currentStock = checkStockResult.recordset[0].stock;

    // Kiểm tra số lượng khách mua có vượt quá tồn kho không
    if (quantity > currentStock) {
      // Nếu vượt quá, trả về mã lỗi 400 và thông báo ngay lập tức, chặn không cho lưu Database
      return res.status(400).json({
        success: false,
        error: `Hàng không đủ! Trong kho chỉ còn ${currentStock} sản phẩm.`,
      });
    }

    // Nếu đủ hàng thì mới lưu đơn hàng vào Database
    await sql.query`
        INSERT INTO Orders(productId, quantity, price)
        VALUES(${productId}, ${quantity}, ${price})
    `;

    res.json({ success: true, message: 'Chốt đơn thành công' });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Xem danh sách đơn hàng đã bán
app.get('/orders', async (req, res) => {
  try {
    const result = await sql.query(`
      SELECT o.id, o.quantity, o.price, p.name AS productName
      FROM Orders o
      JOIN Products p ON o.productId = p.id
      ORDER BY o.id DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Xóa đơn hàng lỗi
app.delete('/order/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await sql.query`DELETE FROM Orders WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
});
