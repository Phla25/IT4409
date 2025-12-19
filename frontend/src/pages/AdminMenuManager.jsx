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
// COMPONENT 1: QUẢN LÝ KHO MÓN (HỆ THỐNG) - [ĐÃ NÂNG CẤP]
// ==========================================
const BaseDishPanel = () => {
  // State dữ liệu danh sách
  const [dishes, setDishes] = useState([]); 
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State cho Form
  const [formData, setFormData] = useState({ id: null, name: '', description: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  // 1. Load danh sách món từ Server
  const fetchDishes = async () => {
    try {
      // Gọi API lấy toàn bộ món (Bạn cần đảm bảo Backend đã có API này như hướng dẫn trước)
      const res = await API.get('/base-dishes');
      const data = res.data.data || [];
      setDishes(data);
      setFilteredDishes(data);
    } catch (err) {
      console.error("Lỗi load món:", err);
    }
  };

  useEffect(() => {
    fetchDishes();
  }, []);

  // 2. Xử lý tìm kiếm (Filter Client-side)
  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const results = dishes.filter(d => 
        d.name.toLowerCase().includes(lowerTerm) || 
        (d.description && d.description.toLowerCase().includes(lowerTerm))
    );
    setFilteredDishes(results);
  }, [searchTerm, dishes]);

  // 3. Xử lý Submit (Tạo mới hoặc Cập nhật)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (isEditing) {
        // --- CẬP NHẬT ---
        await API.put(`/base-dishes/${formData.id}`, { 
            name: formData.name, 
            description: formData.description 
        });
        setStatus({ type: 'success', msg: `✅ Đã cập nhật món "${formData.name}"` });
      } else {
        // --- TẠO MỚI ---
        await API.post('/base-dishes', { 
            name: formData.name, 
            description: formData.description 
        });
        setStatus({ type: 'success', msg: `✅ Đã thêm mới món "${formData.name}"` });
      }
      
      // Reset form và reload list
      handleCancelEdit();
      fetchDishes();

    } catch (err) {
      setStatus({ type: 'error', msg: `❌ Lỗi: ${err.response?.data?.message || err.message}` });
    }
  };

  // 4. Chế độ Sửa: Đổ dữ liệu vào form
  const handleEditClick = (dish) => {
    setFormData({ id: dish.id, name: dish.name, description: dish.description || '' });
    setIsEditing(true);
    setStatus({ type: '', msg: '' });
    // Cuộn lên đầu (nếu ở mobile)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 5. Hủy sửa
  const handleCancelEdit = () => {
    setFormData({ id: null, name: '', description: '' });
    setIsEditing(false);
    setStatus({ type: '', msg: '' });
  };

  return (
    <div className="menu-manager-grid">
      
      {/* --- CỘT TRÁI: FORM NHẬP/SỬA --- */}
      <div className="panel" style={{ height: 'fit-content' }}>
        <h3 style={{ borderBottom: isEditing ? '2px solid #f39c12' : '2px solid #27ae60', paddingBottom: 10, marginTop: 0 }}>
            {isEditing ? '✏️ Chỉnh Sửa Món Ăn' : '✨ Thêm Món Mới'}
        </h3>
        
        {/* Thông báo trạng thái */}
        {status.msg && (
            <div style={{ 
                padding: '10px', marginBottom: '15px', borderRadius: '5px',
                background: status.type === 'success' ? '#d4edda' : '#f8d7da',
                color: status.type === 'success' ? '#155724' : '#721c24'
            }}>
                {status.msg}
            </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên món ăn (Chung):</label>
            <input 
              type="text" 
              placeholder="VD: Bún Đậu Mắm Tôm" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Mô tả mặc định:</label>
            <textarea 
              rows="4"
              placeholder="Mô tả nguyên liệu, hương vị..." 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn-submit" 
                    style={{ background: isEditing ? '#f39c12' : '#27ae60', flex: 1 }}>
                {isEditing ? 'Lưu Thay Đổi' : 'Lưu vào Kho'}
            </button>
            
            {isEditing && (
                <button type="button" onClick={handleCancelEdit} 
                        style={{ background: '#95a5a6', color: 'white', border: 'none', borderRadius: 6, padding: '10px 15px', cursor: 'pointer' }}>
                    Hủy
                </button>
            )}
          </div>
        </form>
      </div>

      {/* --- CỘT PHẢI: DANH SÁCH MÓN --- */}
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <h3 style={{margin: 0}}>📋 Kho Món ({filteredDishes.length})</h3>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="form-group" style={{marginBottom: '15px'}}>
            <input 
                type="text" 
                placeholder="🔍 Tìm kiếm món ăn trong kho..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '20px' }}
            />
        </div>

        {/* Danh sách cuộn */}
        <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>
            {filteredDishes.length === 0 ? (
                <p style={{ color: '#777', fontStyle: 'italic', textAlign: 'center' }}>
                    {dishes.length === 0 ? "Kho đang trống. Hãy thêm món mới!" : "Không tìm thấy kết quả."}
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredDishes.map(dish => (
                        <div key={dish.id} 
                             style={{ 
                                 padding: '12px', border: '1px solid #eee', borderRadius: '8px', 
                                 background: isEditing && formData.id === dish.id ? '#fff3cd' : 'white', // Highlight món đang sửa
                                 display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                 transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                             }}>
                            <div style={{flex: 1, paddingRight: '10px'}}>
                                <strong style={{ color: '#2c3e50', fontSize: '1.05rem', display: 'block' }}>{dish.name}</strong>
                                <span style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
                                    {dish.description ? dish.description : <i>Chưa có mô tả</i>}
                                </span>
                            </div>
                            <button 
                                onClick={() => handleEditClick(dish)}
                                style={{ 
                                    background: '#3498db', color: 'white', border: 'none', 
                                    padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem',
                                    whiteSpace: 'nowrap'
                                }}>
                                ✏️ Sửa
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENT 2: QUẢN LÝ MENU CỦA QUÁN (GIỮ NGUYÊN)
// ==========================================
const LocationMenuPanel = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  // State form
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]); 
  const [selectedBaseDish, setSelectedBaseDish] = useState(null); 
  const [price, setPrice] = useState('');
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await API.get('/locations/nearby?lat=21&lng=105&radius=5000'); 
        setLocations(res.data.data || []);
      } catch (err) { console.error("Lỗi load quán:", err); }
    };
    fetchLocations();
  }, []);

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

  const handleSearchBaseDish = async (keyword) => {
    setSearchKeyword(keyword);
    setSelectedBaseDish(null);
    if (keyword.length < 2) {
        setSearchResults([]);
        return;
    }
    try {
        const res = await API.get(`/base-dishes/search?keyword=${keyword}`);
        setSearchResults(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleSelectDish = (dish) => {
    setSelectedBaseDish(dish);
    setSearchKeyword(dish.name);
    setCustomName(dish.name); 
    setSearchResults([]); 
  };

  const handleAddToMenu = async (e) => {
    e.preventDefault();
    if (!selectedBaseDish || !selectedLocationId) return alert("Thiếu thông tin!");
    try {
        await API.post(`/locations/${selectedLocationId}/menu`, {
            base_dish_id: selectedBaseDish.id,
            custom_name: customName,
            price: parseFloat(price),
            description: selectedBaseDish.description 
        });
        alert("Thêm món thành công!");
        setSearchKeyword(''); setSelectedBaseDish(null); setPrice('');
        const res = await API.get(`/locations/${selectedLocationId}/menu`);
        setMenuItems(res.data.data);
    } catch (err) {
        alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa món này?")) return;
    try {
        await API.delete(`/menu-items/${itemId}`);
        setMenuItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) { alert("Lỗi xóa món"); }
  };

  return (
    <div className="panel menu-manager-wrapper">
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
            <div className="add-menu-form" style={{ borderRight: '1px solid #eee', paddingRight: '20px' }}>
                <h4 style={{ borderBottom: '2px solid #27ae60', paddingBottom: '10px', marginTop: 0 }}>➕ Thêm Món Vào Menu</h4>
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
                        <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Giá bán (VNĐ):</label>
                        <input type="number" placeholder="VD: 45000" value={price} onChange={(e) => setPrice(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-submit" disabled={!selectedBaseDish}>Lưu vào Menu</button>
                </form>
            </div>

            <div className="current-menu-display">
                <h4 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px', marginTop: 0 }}>
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
                                <button className="btn-delete" onClick={() => handleDeleteItem(item.id)}>Xóa món</button>
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