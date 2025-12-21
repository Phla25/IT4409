import React, { useState, useEffect } from 'react';
import API from '../api';
import './AdminMenuManager.css';

const AdminMenuManager = () => {
  // ✨ SỬA: Lấy trạng thái từ bộ nhớ tạm (nếu có)
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('admin_menu_active_tab') || 'base';
  });

  // ✨ SỬA: Mỗi khi đổi tab, lưu lại vào bộ nhớ
  useEffect(() => {
    sessionStorage.setItem('admin_menu_active_tab', activeTab);
  }, [activeTab]);

  return (
    <div className="admin-menu-container">
      <h1>👨‍🍳 Quản trị Ẩm thực</h1>

      {/* Navigation Tabs */}
      <div className="tabs-nav">
        <button 
          className={`tab-btn ${activeTab === 'base' ? 'active' : ''}`}
          onClick={() => setActiveTab('base')}
        >
          🍔 1. Kho Món Ăn (Base Dish)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          🏪 2. Thực Đơn Theo Quán (Menu)
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
  const [dishes, setDishes] = useState([]); 
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ id: null, name: '', description: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  const fetchDishes = async () => {
    try {
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

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const results = dishes.filter(d => 
        d.name.toLowerCase().includes(lowerTerm) || 
        (d.description && d.description.toLowerCase().includes(lowerTerm))
    );
    setFilteredDishes(results);
  }, [searchTerm, dishes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (isEditing) {
        await API.put(`/base-dishes/${formData.id}`, { 
            name: formData.name, 
            description: formData.description 
        });
        setStatus({ type: 'success', msg: `✅ Đã cập nhật món "${formData.name}"` });
      } else {
        await API.post('/base-dishes', { 
            name: formData.name, 
            description: formData.description 
        });
        setStatus({ type: 'success', msg: `✅ Đã thêm mới món "${formData.name}"` });
      }
      handleCancelEdit();
      fetchDishes();
    } catch (err) {
      setStatus({ type: 'error', msg: `❌ Lỗi: ${err.response?.data?.message || err.message}` });
    }
  };

  const handleEditClick = (dish) => {
    setFormData({ id: dish.id, name: dish.name, description: dish.description || '' });
    setIsEditing(true);
    setStatus({ type: '', msg: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setFormData({ id: null, name: '', description: '' });
    setIsEditing(false);
    setStatus({ type: '', msg: '' });
  };

  return (
    <div className="menu-manager-grid">
      <div className="panel" style={{ height: 'fit-content', position: 'sticky', top: '20px' }}>
        <h3 style={{ borderBottom: isEditing ? '2px solid #f39c12' : '2px solid #27ae60', paddingBottom: 10, marginTop: 0, color: isEditing ? '#e67e22' : '#27ae60' }}>
            {isEditing ? '✏️ Chỉnh Sửa Món Ăn' : '✨ Thêm Món Mới'}
        </h3>
        
        {status.msg && (
            <div style={{ 
                padding: '12px', marginBottom: '20px', borderRadius: '8px',
                background: status.type === 'success' ? '#d4edda' : '#f8d7da',
                color: status.type === 'success' ? '#155724' : '#721c24',
                border: `1px solid ${status.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
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
                    style={{ background: isEditing ? 'linear-gradient(135deg, #f39c12, #e67e22)' : 'linear-gradient(135deg, #27ae60, #2ecc71)', flex: 1 }}>
                {isEditing ? '💾 Lưu Thay Đổi' : '➕ Lưu vào Kho'}
            </button>
            {isEditing && (
                <button type="button" onClick={handleCancelEdit} className="btn-cancel">Hủy</button>
            )}
          </div>
        </form>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{margin: 0, color: '#34495e'}}>📋 Kho Món ({filteredDishes.length})</h3>
        </div>
        <div className="form-group" style={{marginBottom: '20px'}}>
            <input 
                type="text" 
                placeholder="🔍 Tìm kiếm món ăn trong kho..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '12px 20px', borderRadius: '30px', border: '1px solid #ddd', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
            />
        </div>
        <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '5px' }}>
            {filteredDishes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#95a5a6' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🍽️</div>
                    <p>{dishes.length === 0 ? "Kho đang trống. Hãy thêm món mới!" : "Không tìm thấy kết quả phù hợp."}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredDishes.map(dish => (
                        <div key={dish.id} className={`dish-list-item ${isEditing && formData.id === dish.id ? 'editing' : ''}`}>
                            <div style={{flex: 1, paddingRight: '15px'}}>
                                <strong style={{ color: '#2c3e50', fontSize: '1.1rem', display: 'block', marginBottom: '4px' }}>{dish.name}</strong>
                                <span style={{ fontSize: '0.9rem', color: '#7f8c8d', lineHeight: '1.4', display: 'block' }}>
                                    {dish.description ? dish.description : <em style={{color:'#ccc'}}>Chưa có mô tả</em>}
                                </span>
                            </div>
                            <div className="action-btn-group">
                                <button className="btn-icon btn-edit" onClick={() => handleEditClick(dish)} title="Chỉnh sửa món này">✏️</button>
                            </div>
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
// COMPONENT 2: QUẢN LÝ MENU CỦA QUÁN
// ==========================================
const LocationMenuPanel = () => {
  const [locations, setLocations] = useState([]);
  
  // ✨ SỬA: Khởi tạo state từ sessionStorage để nhớ quán đang chọn
  const [selectedLocationId, setSelectedLocationId] = useState(() => {
    return sessionStorage.getItem('admin_menu_selected_location_id') || '';
  });

  const [menuItems, setMenuItems] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  // State form
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]); 
  const [selectedBaseDish, setSelectedBaseDish] = useState(null); 
  const [price, setPrice] = useState('');
  const [customName, setCustomName] = useState('');

  // ✨ SỬA: Lưu lại ID quán mỗi khi thay đổi
  useEffect(() => {
    if (selectedLocationId) {
        sessionStorage.setItem('admin_menu_selected_location_id', selectedLocationId);
    }
  }, [selectedLocationId]);

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
        // Reload menu
        const res = await API.get(`/locations/${selectedLocationId}/menu`);
        setMenuItems(res.data.data);
    } catch (err) {
        alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa món này khỏi menu?")) return;
    try {
        await API.delete(`/menu-items/${itemId}`);
        setMenuItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) { alert("Lỗi xóa món"); }
  };

  return (
    <div className="panel menu-manager-wrapper">
      <div className="form-group" style={{ background: '#e3f2fd', padding: '25px', borderRadius: '12px', border: '1px solid #bbdefb', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <label style={{color: '#1565c0', fontSize: '1.2rem', marginBottom: '15px', display: 'block', fontWeight: 'bold'}}>
            🏠 Chọn địa điểm để quản lý thực đơn:
        </label>
        
        <div className="location-select-wrapper">
            <select 
                className="location-select"
                value={selectedLocationId} 
                onChange={(e) => setSelectedLocationId(e.target.value)}
            >
            <option value="">-- Vui lòng chọn quán --</option>
            {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name} - {loc.district}</option>
            ))}
            </select>
        </div>
      </div>

      {selectedLocationId && (
        <div className="menu-manager-grid" style={{ marginTop: '30px' }}>
            {/* Form thêm món */}
            <div className="add-menu-form" style={{ background: '#fff', padding: '0 20px 0 0', borderRight: '1px solid #eee' }}>
                <h4 style={{ borderBottom: '2px solid #27ae60', paddingBottom: '10px', marginTop: 0, color: '#27ae60', fontSize: '1.2rem' }}>➕ Thêm Món Vào Menu</h4>
                <form onSubmit={handleAddToMenu}>
                    <div className="form-group search-wrapper">
                        <label>Tìm món (Từ kho hệ thống):</label>
                        <input 
                            type="text" 
                            placeholder="Gõ tên món (VD: Phở...)"
                            value={searchKeyword}
                            onChange={(e) => handleSearchBaseDish(e.target.value)}
                            required
                            style={{ borderRadius: '20px' }}
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
                        {selectedBaseDish && <div style={{marginTop: 5, padding: '5px 10px', background: '#d4edda', color: '#155724', borderRadius: '4px', fontSize: '0.9rem'}}>✅ Đã chọn: <strong>{selectedBaseDish.name}</strong></div>}
                    </div>
                    <div className="form-group">
                        <label>Tên hiển thị tại quán:</label>
                        <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Giá bán (VNĐ):</label>
                        <input type="number" placeholder="VD: 45000" value={price} onChange={(e) => setPrice(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-submit" disabled={!selectedBaseDish} style={{width: '100%'}}>
                        📥 Thêm vào Menu
                    </button>
                </form>
            </div>

            {/* Danh sách món hiện tại */}
            <div className="current-menu-display">
                <h4 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px', marginTop: 0, color: '#3498db', fontSize: '1.2rem' }}>
                    📜 Thực Đơn Hiện Tại ({menuItems.length} món)
                </h4>
                {isLoadingMenu ? <p style={{color: '#7f8c8d'}}>⏳ Đang tải dữ liệu...</p> : (
                    <div className="current-menu-list">
                        {menuItems.length === 0 && (
                            <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '10px'}}>
                                <p style={{color:'#888', fontStyle:'italic'}}>Quán này chưa có món nào trong thực đơn.</p>
                            </div>
                        )}
                        {menuItems.map(item => (
                            <div key={item.id} className="menu-card">
                                <div>
                                    <h4>{item.custom_name || item.base_dish_name}</h4>
                                    <div className="price">{Number(item.price).toLocaleString()} đ</div>
                                    <div className="desc">
                                        {item.description ? item.description : 'Không có mô tả'}
                                    </div>
                                </div>
                                <button className="btn-delete-card" onClick={() => handleDeleteItem(item.id)}>
                                    🗑️ Xóa món
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