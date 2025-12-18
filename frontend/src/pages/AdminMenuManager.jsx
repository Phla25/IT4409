import React, { useState, useEffect } from 'react';
import API from '../api';
import './AdminMenuManager.css';

const AdminMenuManager = () => {
  const [activeTab, setActiveTab] = useState('base'); // Tab mặc định: Kho món

  return (
    <div className="admin-menu-container">
      <h1>👨‍🍳 Quản trị Ẩm thực</h1>

      {/* Navigation Tabs */}
      <div className="tabs-nav">
        <button 
          className={`tab-btn ${activeTab === 'base' ? 'active' : ''}`}
          onClick={() => setActiveTab('base')}
        >
          1. Kho Món Ăn (Base Dish)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          2. Thực Đơn Theo Quán (Menu)
        </button>
      </div>

      {/* Render nội dung Tab */}
      <div className="tab-content">
        {activeTab === 'base' ? <BaseDishPanel /> : <LocationMenuPanel />}
      </div>
    </div>
  );
};

// ==========================================
// COMPONENT 1: QUẢN LÝ KHO MÓN (HỆ THỐNG)
// ==========================================
const BaseDishPanel = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });

  const handleCreateBaseDish = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await API.post('/base-dishes', { name, description });
      setStatus({ type: 'success', msg: `✅ Đã thêm món "${name}" vào hệ thống!` });
      setName('');
      setDescription('');
    } catch (err) {
      setStatus({ type: 'error', msg: `❌ Lỗi: ${err.response?.data?.message || err.message}` });
    }
  };

  return (
    <div className="panel" style={{ maxWidth: '600px' }}>
      <h3>Thêm Món Mới Vào Hệ Thống</h3>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Đây là các món ăn gốc (VD: Phở Bò, Trà Chanh...). Sau khi tạo ở đây, bạn có thể gán nó vào menu của bất kỳ quán nào.
      </p>

      {status.msg && (
        <div style={{ 
            padding: '10px', 
            marginBottom: '15px', 
            borderRadius: '5px',
            background: status.type === 'success' ? '#d4edda' : '#f8d7da',
            color: status.type === 'success' ? '#155724' : '#721c24'
        }}>
          {status.msg}
        </div>
      )}

      <form onSubmit={handleCreateBaseDish}>
        <div className="form-group">
          <label>Tên món ăn (Chung):</label>
          <input 
            type="text" 
            placeholder="VD: Bún Đậu Mắm Tôm" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Mô tả mặc định:</label>
          <textarea 
            rows="3"
            placeholder="Mô tả ngắn về món ăn này..." 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-submit">Lưu vào Kho</button>
      </form>
    </div>
  );
};

// ==========================================
// COMPONENT 2: QUẢN LÝ MENU CỦA QUÁN
// ==========================================
const LocationMenuPanel = () => {
  // State chọn quán
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  
  // State hiển thị menu
  const [menuItems, setMenuItems] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  // State form thêm món
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]); // List món tìm được
  const [selectedBaseDish, setSelectedBaseDish] = useState(null); // Món đã chọn để thêm
  const [price, setPrice] = useState('');
  const [customName, setCustomName] = useState('');

  // 1. Load danh sách quán (Admin View)
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // Gọi API lấy tất cả quán (Nếu chưa có API admin getAll, dùng tạm nearby bán kính lớn)
        const res = await API.get('/locations/nearby?lat=21&lng=105&radius=5000'); 
        setLocations(res.data.data || []);
      } catch (err) { console.error("Lỗi load quán:", err); }
    };
    fetchLocations();
  }, []);

  // 2. Load Menu khi chọn quán
  useEffect(() => {
    if (!selectedLocationId) {
        setMenuItems([]);
        return;
    }
    const fetchMenu = async () => {
      setIsLoadingMenu(true);
      try {
        const res = await API.get(`/locations/${selectedLocationId}/menu`);
        setMenuItems(res.data.data || []);
      } catch (err) { console.error("Lỗi load menu:", err); }
      finally { setIsLoadingMenu(false); }
    };
    fetchMenu();
  }, [selectedLocationId]);

  // 3. Xử lý tìm kiếm món gốc (Base Dish)
  const handleSearchBaseDish = async (keyword) => {
    setSearchKeyword(keyword);
    setSelectedBaseDish(null); // Reset nếu gõ lại

    if (keyword.length < 2) {
        setSearchResults([]);
        return;
    }

    try {
        const res = await API.get(`/base-dishes/search?keyword=${keyword}`);
        setSearchResults(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  // 4. Chọn một món từ gợi ý
  const handleSelectDish = (dish) => {
    setSelectedBaseDish(dish);
    setSearchKeyword(dish.name);
    setCustomName(dish.name); // Mặc định tên riêng = tên gốc
    setSearchResults([]); // Ẩn dropdown
  };

  // 5. Submit thêm món vào Menu
  const handleAddToMenu = async (e) => {
    e.preventDefault();
    if (!selectedBaseDish || !selectedLocationId) return alert("Thiếu thông tin!");

    try {
        await API.post(`/locations/${selectedLocationId}/menu`, {
            base_dish_id: selectedBaseDish.id,
            custom_name: customName,
            price: parseFloat(price),
            description: selectedBaseDish.description // Mặc định lấy mô tả gốc
        });

        alert("Thêm món thành công!");
        // Reset form
        setSearchKeyword('');
        setSelectedBaseDish(null);
        setPrice('');
        
        // Reload menu
        const res = await API.get(`/locations/${selectedLocationId}/menu`);
        setMenuItems(res.data.data);

    } catch (err) {
        alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  // 6. Xóa món
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa món này?")) return;
    try {
        await API.delete(`/menu-items/${itemId}`);
        setMenuItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) { alert("Lỗi xóa món"); }
  };

  return (
    <div className="panel menu-manager-wrapper">
      {/* 1. Select Quán */}
      <div className="form-group" style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px' }}>
        <label>🏠 Chọn địa điểm để quản lý thực đơn:</label>
        <select 
            value={selectedLocationId} 
            onChange={(e) => setSelectedLocationId(e.target.value)}
            style={{ fontSize: '1.1rem', color: '#2c3e50' }}
        >
          <option value="">-- Vui lòng chọn quán --</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name} - {loc.district}</option>
          ))}
        </select>
      </div>

      {selectedLocationId && (
        <div className="menu-manager-grid" style={{ marginTop: '20px' }}>
            
            {/* CỘT TRÁI: FORM THÊM MÓN */}
            <div className="add-menu-form" style={{ borderRight: '1px solid #eee', paddingRight: '20px' }}>
                <h4 style={{ borderBottom: '2px solid #27ae60', paddingBottom: '10px' }}>➕ Thêm Món Vào Menu</h4>
                
                <form onSubmit={handleAddToMenu}>
                    <div className="form-group search-wrapper">
                        <label>Tìm món (Từ kho hệ thống):</label>
                        <input 
                            type="text" 
                            placeholder="Gõ tên món (VD: Phở...)"
                            value={searchKeyword}
                            onChange={(e) => handleSearchBaseDish(e.target.value)}
                            required
                        />
                        {/* Dropdown gợi ý */}
                        {searchResults.length > 0 && (
                            <div className="search-results-dropdown">
                                {searchResults.map(dish => (
                                    <div key={dish.id} className="search-item" onClick={() => handleSelectDish(dish)}>
                                        <strong>{dish.name}</strong>
                                    </div>
                                ))}
                            </div>
                        )}
                        {selectedBaseDish && <small style={{color:'green'}}>✅ Đã chọn: {selectedBaseDish.name}</small>}
                    </div>

                    <div className="form-group">
                        <label>Tên hiển thị tại quán:</label>
                        <input 
                            type="text" 
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                        />
                        <small style={{color:'#888'}}>Có thể đặt tên khác (VD: Phở Đặc Biệt)</small>
                    </div>

                    <div className="form-group">
                        <label>Giá bán (VNĐ):</label>
                        <input 
                            type="number" 
                            placeholder="VD: 45000"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-submit" disabled={!selectedBaseDish}>
                        Lưu vào Menu
                    </button>
                </form>
            </div>

            {/* CỘT PHẢI: DANH SÁCH MÓN HIỆN TẠI */}
            <div className="current-menu-display">
                <h4 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
                    📜 Thực Đơn Hiện Tại ({menuItems.length} món)
                </h4>
                
                {isLoadingMenu ? <p>Đang tải menu...</p> : (
                    <div className="current-menu-list">
                        {menuItems.length === 0 && <p style={{fontStyle:'italic', color:'#888'}}>Quán chưa có món nào.</p>}
                        
                        {menuItems.map(item => (
                            <div key={item.id} className="menu-card">
                                <div>
                                    <h4>{item.custom_name || item.base_dish_name}</h4>
                                    <div className="price">{Number(item.price).toLocaleString()}đ</div>
                                    <div className="desc">{item.description}</div>
                                </div>
                                <button className="btn-delete" onClick={() => handleDeleteItem(item.id)}>
                                    Xóa món
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenuManager;