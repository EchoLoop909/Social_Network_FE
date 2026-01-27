import React from 'react';
import { 
  Home, Search, Compass, Clapperboard, MessageCircle, 
  Heart, PlusSquare, Menu, Settings, Grid, Bookmark, User, Camera 
} from 'lucide-react';

const ProfilePage = () => {
  return (
    <div className="flex min-h-screen bg-white text-black font-sans">
      
      {/* --- SIDEBAR (Cột bên trái) --- */}
      <div className="w-[245px] h-screen border-r border-gray-300 fixed left-0 top-0 px-3 py-8 flex flex-col justify-between hidden md:flex z-50 bg-white">
        <div>
          {/* Logo Instagram (Dạng text cho đơn giản) */}
          <div className="px-3 mb-8">
            <h1 className="text-2xl font-bold font-serif italic tracking-wider">Instagram</h1>
          </div>

          {/* Menu Items */}
          <nav className="space-y-2">
            <NavItem icon={<Home size={24} />} label="Trang chủ" />
            <NavItem icon={<Search size={24} />} label="Tìm kiếm" />
            <NavItem icon={<Compass size={24} />} label="Khám phá" />
            <NavItem icon={<Clapperboard size={24} />} label="Reels" />
            <NavItem icon={<MessageCircle size={24} />} label="Tin nhắn" />
            <NavItem icon={<Heart size={24} />} label="Thông báo" />
            <NavItem icon={<PlusSquare size={24} />} label="Tạo" />
            <NavItem 
              icon={<img src="https://via.placeholder.com/24" className="w-6 h-6 rounded-full border border-gray-300" alt="avatar" />} 
              label="Trang cá nhân" 
              active 
            />
          </nav>
        </div>

        {/* More Button */}
        <div className="px-3">
            <div className="flex items-center gap-4 p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition">
                <Menu size={24} />
                <span className="text-base">Xem thêm</span>
            </div>
        </div>
      </div>

      {/* --- MAIN CONTENT (Phần nội dung chính) --- */}
      <div className="flex-1 flex flex-col items-center">
        
        <div className="w-full max-w-[935px] px-5 py-8">
          
          {/* 1. Header Profile */}
          <header className="flex flex-col md:flex-row md:items-start mb-10 ">
            {/* Avatar */}
            <div className="flex-shrink-0 mr-0 md:mr-24 flex justify-center md:block mb-6 md:mb-0">
              <div className="w-[150px] h-[150px] rounded-full p-[2px] border border-gray-200 cursor-pointer overflow-hidden">
                 {/* Placeholder cho ảnh đại diện của bạn */}
                <img 
                  src="https://via.placeholder.com/150" 
                  alt="avatar" 
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>

            {/* Thông tin User */}
            <div className="flex-1 flex flex-col gap-5">
              
              {/* Dòng 1: Username + Buttons */}
              <div className="flex flex-col md:flex-row items-center gap-4">
                <span className="text-xl font-normal">hhiep_259</span>
                <div className="flex gap-2">
                  <button className="bg-[#efefef] px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">
                    Chỉnh sửa trang cá nhân
                  </button>
                  <button className="bg-[#efefef] px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">
                    Xem kho lưu trữ
                  </button>
                </div>
                <Settings className="cursor-pointer" size={24} />
              </div>

              {/* Dòng 2: Stats */}
              <div className="flex justify-center md:justify-start gap-10 text-base">
                <span><strong>0</strong> bài viết</span>
                <span><strong>44</strong> người theo dõi</span>
                <span>Đang theo dõi <strong>31</strong> người dùng</span>
              </div>

              {/* Dòng 3: Name & Bio */}
              <div className="text-sm">
                <div className="font-semibold">Hoàng Hiệp</div>
                <div className="bg-gray-100 w-fit px-2 py-0.5 rounded-full text-xs mt-1 text-gray-600 cursor-pointer">
                  @hhiep_259
                </div>
              </div>

            </div>
          </header>

          {/* 2. Highlights (Tin nổi bật) */}
          <div className="flex gap-4 mb-10 ml-10 md:ml-0 overflow-x-auto pb-4">
            <div className="flex flex-col items-center gap-2 cursor-pointer">
              <div className="w-[77px] h-[77px] rounded-full border border-gray-300 bg-gray-50 flex items-center justify-center">
                <PlusSquare className="text-gray-300" size={32} strokeWidth={1} />
              </div>
              <span className="text-xs font-semibold">Mới</span>
            </div>
          </div>

          {/* 3. Navigation Tabs (Bài viết, Đã lưu, Được gắn thẻ) */}
          <div className="border-t border-gray-300 flex justify-center gap-14 text-xs tracking-widest font-semibold uppercase">
            <TabItem icon={<Grid size={12} />} label="Bài viết" active />
            <TabItem icon={<Bookmark size={12} />} label="Đã lưu" />
            <TabItem icon={<User size={12} />} label="Được gắn thẻ" />
          </div>

          {/* 4. Content Area (Empty State - Giống trong ảnh) */}
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center mb-2">
               <Camera size={34} strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-extrabold">Chia sẻ ảnh</h2>
            <p className="text-sm text-center max-w-sm mb-4">
              Khi bạn chia sẻ ảnh, ảnh sẽ xuất hiện trên trang cá nhân của bạn.
            </p>
            <button className="text-sm font-semibold text-blue-500 hover:text-blue-700">
              Chia sẻ ảnh đầu tiên của bạn
            </button>
          </div>

          {/* 5. Footer (Chân trang) */}
          <footer className="mt-10 py-8 text-xs text-gray-500 flex flex-col items-center gap-4">
             <div className="flex flex-wrap justify-center gap-4">
                <a href="#" className="hover:underline">Meta</a>
                <a href="#" className="hover:underline">Giới thiệu</a>
                <a href="#" className="hover:underline">Blog</a>
                <a href="#" className="hover:underline">Việc làm</a>
                <a href="#" className="hover:underline">Trợ giúp</a>
                <a href="#" className="hover:underline">API</a>
                <a href="#" className="hover:underline">Quyền riêng tư</a>
                <a href="#" className="hover:underline">Điều khoản</a>
                <a href="#" className="hover:underline">Vị trí</a>
                <a href="#" className="hover:underline">Instagram Lite</a>
                <a href="#" className="hover:underline">Threads</a>
                <a href="#" className="hover:underline">Tải thông tin người liên hệ lên & người không phải người dùng</a>
                <a href="#" className="hover:underline">Meta đã xác minh</a>
             </div>
             <div>
                Tiếng Việt <span className="mx-1">∨</span> © 2026 Instagram from Meta
             </div>
          </footer>

        </div>
      </div>
    </div>
  );
};

// Component con cho Sidebar Item
const NavItem = ({ icon, label, active }) => (
  <div className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition group ${active ? 'font-bold' : 'hover:bg-gray-100'}`}>
    <div className={`group-hover:scale-105 transition-transform ${active ? 'scale-105' : ''}`}>
      {icon}
    </div>
    <span className={`text-base hidden md:block ${active ? 'font-bold' : ''}`}>{label}</span>
  </div>
);

// Component con cho Tab Item
const TabItem = ({ icon, label, active }) => (
  <div className={`flex items-center gap-1.5 py-4 cursor-pointer -mt-[1px] ${active ? 'border-t border-black text-black' : 'text-gray-400 border-t border-transparent'}`}>
    {icon}
    <span>{label}</span>
  </div>
);

export default ProfilePage;