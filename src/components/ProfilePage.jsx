import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom'; // Quan trọng để đồng bộ với Sidebar
import { Settings, Grid, Bookmark, User, Camera } from 'lucide-react';

const ProfilePage = () => {
  const { setMyInfo } = useOutletContext(); // Nhận hàm từ MainLayout
  const [userData, setUserData] = useState({
    username: "", surname: "", firstname: "", lastname: "",
    photo: null, description: "", postsCount: 0, followers: 44, following: 31
  });
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Lấy dữ liệu cá nhân
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const payload = JSON.parse(window.atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        const res = await axios.get("http://localhost:1234/auth/getuser?pageIdx=1&pageSize=100", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const myInfo = res.data.Object.find(u => u.keycloakId === payload.sub);
        if (myInfo) setUserData(myInfo);
      } catch (e) { console.error("Profile fetch error:", e); }
    };
    fetchProfile();
  }, []);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const token = localStorage.getItem("token");
    setLoadingAvatar(true);

    try {
      // 1. Upload Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await axios.post("http://localhost:1234/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${token}` }
      });
      const newUrl = uploadRes.data;

      // 2. Update DB
      await axios.post("http://localhost:1234/auth/updaloadimg", null, {
        params: { url: newUrl },
        headers: { "Authorization": `Bearer ${token}` }
      });

      // 3. Đồng bộ giao diện
      setUserData(prev => ({ ...prev, photo: newUrl }));
      setMyInfo(prev => ({ ...prev, photo: newUrl })); // CẬP NHẬT SIDEBAR NGAY LẬP TỨC
      alert("Đã cập nhật ảnh đại diện!");
    } catch (e) {
      alert("Lỗi khi upload ảnh!");
    } finally {
      setLoadingAvatar(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      
      <div className="w-full max-w-[935px] px-5 py-8">
        <header className="flex flex-col md:flex-row md:items-start mb-10">
          <div className="flex-shrink-0 mr-0 md:mr-24 flex justify-center md:block mb-6 md:mb-0">
            <div className="w-[150px] h-[150px] rounded-full p-[2px] border border-gray-200 cursor-pointer overflow-hidden relative group" onClick={() => fileInputRef.current.click()}>
              {loadingAvatar && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 animate-pulse">
                  <div className="text-white text-xs">Đang tải...</div>
                </div>
              )}
              <img src={userData.photo || "https://via.placeholder.com/150"} alt="avatar" className="w-full h-full rounded-full object-cover" />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-5">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <span className="text-xl font-normal">{userData.username || "Tên người dùng"}</span>
              <div className="flex gap-2">
                <button className="bg-[#efefef] px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">Chỉnh sửa</button>
              </div>
              <Settings size={24} className="cursor-pointer" />
            </div>
            
            <div className="flex justify-center md:justify-start gap-10 text-base">
              <span><strong>0</strong> bài viết</span>
              <span><strong>{userData.followers}</strong> người theo dõi</span>
              <span>Đang theo dõi <strong>{userData.following}</strong> người dùng</span>
            </div>

            <div className="text-sm">
              <div className="font-semibold">{`${userData.firstname || ''} ${userData.lastname || ''}`}</div>
              <div className="bg-gray-100 w-fit px-2 py-0.5 rounded-full text-xs mt-1 text-gray-600">@{userData.surname}</div>
              <div className="whitespace-pre-line mt-2 text-gray-700">{userData.description}</div>
            </div>
          </div>
        </header>

        <div className="border-t border-gray-300 flex justify-center gap-14 text-xs tracking-widest font-semibold uppercase">
          <TabItem icon={<Grid size={12} />} label="Bài viết" active />
          <TabItem icon={<Bookmark size={12} />} label="Đã lưu" />
          <TabItem icon={<User size={12} />} label="Được gắn thẻ" />
        </div>

        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center mb-2">
             <Camera size={34} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-extrabold">Chia sẻ ảnh</h2>
          <p className="text-sm text-gray-500 max-w-sm">Ảnh của bạn sẽ xuất hiện tại đây sau khi bạn đăng bài.</p>
        </div>
      </div>
    </div>
  );
};

const TabItem = ({ icon, label, active }) => (
  <div className={`flex items-center gap-1.5 py-4 cursor-pointer border-t ${active ? 'border-black text-black' : 'border-transparent text-gray-400'}`}>
    {icon}<span>{label}</span>
  </div>
);

export default ProfilePage;