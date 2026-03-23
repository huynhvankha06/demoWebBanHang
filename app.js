document.addEventListener('DOMContentLoaded', () => {
  const orderForm = document.getElementById('orderForm');
  const productForm = document.getElementById('productForm'); // Form của chủ
  const ordersTableBody = document
    .getElementById('ordersTable')
    .querySelector('tbody');
  const totalAmountEl = document.getElementById('totalAmount');
  const loadingEl = document.getElementById('loading');
  const toastEl = document.getElementById('toast');
  const toastMsgEl = document.getElementById('toastMsg');
  const selectProduct = document.getElementById('selectProduct'); // Ô chọn giày cho nhân viên

  let orders = [];

  // --- HÀM HỖ TRỢ GIAO DIỆN ---
  function showToast(message, type = 'success') {
    toastMsgEl.textContent = message;
    toastEl.className = `toast ${type} show`;
    setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3000);
  }

  function showLoading(show = true) {
    loadingEl.classList.toggle('show', show);
  }

  function renderOrders() {
    showLoading(false);
    if (orders.length === 0) {
      ordersTableBody.innerHTML =
        '<tr><td colspan="5" class="empty-state"><h3>Chưa có đơn hàng</h3></td></tr>';
      updateTotal();
      return;
    }
    ordersTableBody.innerHTML = orders
      .map(
        (order) => `
      <tr>
        <td>${order.id}</td>
        <td>${order.productName}</td>
        <td>${order.price.toLocaleString('vi-VN')} VNĐ</td>
        <td>${order.quantity}</td>
        <td class="thanh-tien">${(order.price * order.quantity).toLocaleString('vi-VN')} VNĐ</td>
        <td><button class="btn btn-danger" onclick="deleteOrder(${order.realId})">Xóa</button></td>
      </tr>
    `,
      )
      .join('');
    updateTotal();
  }

  function updateTotal() {
    const total = orders.reduce(
      (sum, order) => sum + order.price * order.quantity,
      0,
    );
    totalAmountEl.textContent = `Tổng: ${total.toLocaleString('vi-VN')} VNĐ`;
  }

  // --- KHU VỰC CHỦ CỬA HÀNG (ADMIN) ---
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('newName').value;
      const price = parseFloat(document.getElementById('newPrice').value);
      const stock = parseInt(document.getElementById('newStock').value);

      try {
        const response = await fetch('/add-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, price, stock }),
        });
        if (response.ok) {
          showToast('Chủ đã nhập hàng thành công!');
          productForm.reset();
          loadProductList(); // Cập nhật danh sách cho nhân viên thấy ngay
        }
      } catch (err) {
        showToast('Lỗi nhập hàng', 'error');
      }
    });
  }

  // Tải danh sách sản phẩm vào ô Select cho nhân viên
  async function loadProductList() {
    try {
      const response = await fetch('/products');
      const products = await response.json();
      if (selectProduct) {
        selectProduct.innerHTML =
          '<option value="">-- Chọn giày trong kho --</option>' +
          products
            .map(
              (p) =>
                `<option value="${p.id}" data-price="${p.price}">${p.name} (Giá: ${p.price.toLocaleString()} - Kho: ${p.stock})</option>`,
            )
            .join('');
      }
    } catch (err) {
      console.error('Lỗi tải kho hàng');
    }
  }

  // --- KHU VỰC NHÂN VIÊN BÁN HÀNG ---
  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectedOption = selectProduct.options[selectProduct.selectedIndex];

    if (!selectedOption.value) {
      showToast('Vui lòng chọn sản phẩm!', 'error');
      return;
    }

    const productId = selectedOption.value;
    const price = parseFloat(selectedOption.dataset.price); // MÁY TỰ LẤY GIÁ TỪ KHO
    const quantity = parseInt(document.getElementById('quantity').value);

    try {
      const response = await fetch('/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, price }),
      });

      if (response.ok) {
        showToast('Nhân viên đã chốt đơn!');
        orderForm.reset();
        loadOrders();
        loadProductList(); // Cập nhật lại số tồn kho hiển thị
      }
    } catch (err) {
      showToast('Lỗi kết nối', 'error');
    }
  });

  window.deleteOrder = async (realId) => {
    if (!confirm('Xóa đơn hàng này?')) return;
    await fetch(`/order/${realId}`, { method: 'DELETE' });
    loadOrders();
    loadProductList();
  };

  async function loadOrders() {
    showLoading(true);
    try {
      const response = await fetch('/orders');
      const data = await response.json();
      orders = data.map((o) => ({
        realId: o.id,
        id: `DH${String(o.id).padStart(3, '0')}`,
        productName: o.productName || 'Sản phẩm',
        price: o.price || 0,
        quantity: o.quantity,
      }));
      renderOrders();
    } catch (err) {
      showToast('Lỗi tải đơn hàng', 'error');
    }
  }

  // Khởi tạo ứng dụng
  loadProductList();
  loadOrders();
});
