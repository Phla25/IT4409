class MenuItem {
  constructor({ id, location_id, base_dish_id, custom_name, price, description, is_available, base_dish_name }) {
    this.id = id;
    this.location_id = location_id;
    this.base_dish_id = base_dish_id;
    this.custom_name = custom_name;
    this.price = price;
    this.description = description;
    this.is_available = is_available;
    // Có thể thêm các trường join từ bảng khác để tiện hiển thị
    this.base_dish_name = base_dish_name || null; 
  }
}
module.exports = MenuItem;