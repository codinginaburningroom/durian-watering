import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import Swal from 'sweetalert2';
import { Leaf, LayoutDashboard, History, Download, Edit2, Trash2, Plus, X, CloudRain, Thermometer, Wind, Droplets, Users, LogOut, Eye, EyeOff, Settings, MapPin } from 'lucide-react';

// Navigation Sidebar Component
function Sidebar({ user, onLogout, onEditProfile }) {
  const location = useLocation();
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <Leaf className="sidebar-icon" size={28} />
        </div>
        <h2>DurianFarm</h2>
      </div>
      <nav className="sidebar-nav">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <History size={20} />
          <span>บันทึก & ประวัติ</span>
        </Link>
        <Link to="/reports" className={`nav-link ${location.pathname === '/reports' ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>รายงานสรุป</span>
        </Link>
        <Link to="/weather" className={`nav-link ${location.pathname === '/weather' ? 'active' : ''}`}>
          <CloudRain size={20} />
          <span>สภาพอากาศ</span>
        </Link>
        {user?.role === 'admin' && (
          <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
            <Users size={20} />
            <span>จัดการผู้ใช้งาน</span>
          </Link>
        )}
      </nav>
      <div className="sidebar-footer" style={{padding: '20px'}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.05)', padding: '10px', borderRadius: '8px'}}>
          <span style={{fontWeight: 'bold', fontSize: '14px', textOverflow: 'ellipsis', overflow: 'hidden'}} title={user?.username}>👤 {user?.username}</span>
          <div style={{display: 'flex', gap: '10px'}}>
            <Settings size={18} style={{cursor: 'pointer', color: '#64748b'}} onClick={onEditProfile} title="ตั้งค่าโปรไฟล์" />
            <LogOut size={18} style={{cursor: 'pointer', color: '#ef4444'}} onClick={onLogout} title="ออกจากระบบ" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Records Page Component
function RecordsPage({ records, fetchRecords, fetchReports }) {
  const [formData, setFormData] = useState({
    timestamp: new Date().toISOString().slice(0, 16),
    duration_minutes: 30,
    liter_amount: 100,
    zone: 'โซน A',
    notes: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setFormData({
      timestamp: new Date().toISOString().slice(0, 16),
      duration_minutes: 30,
      liter_amount: 100,
      zone: 'โซน A',
      notes: ''
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    const d = new Date(record.timestamp);
    const tzoffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d - tzoffset)).toISOString().slice(0, 16);
    
    setFormData({
      timestamp: localISOTime,
      duration_minutes: record.duration_minutes,
      liter_amount: record.liter_amount,
      zone: record.zone,
      notes: record.notes || ''
    });
    setEditingId(record.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const isoTimestamp = new Date(formData.timestamp).toISOString();
      const payload = { ...formData, timestamp: isoTimestamp };

      if (editingId) {
        await axios.put(`/api/watering/${editingId}`, payload);
      } else {
        await axios.post('/api/watering/', payload);
      }
      setIsModalOpen(false);
      Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', showConfirmButton: false, timer: 1500 });
      fetchRecords();
      fetchReports();
    } catch (err) {
      console.error(err);
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'ต้องการลบข้อมูล?',
      text: "การดำเนินการนี้ไม่สามารถย้อนกลับได้!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53935',
      cancelButtonColor: '#9e9e9e',
      confirmButtonText: 'ลบทิ้ง',
      cancelButtonText: 'ยกเลิก'
    });
    if(result.isConfirmed) {
      try {
        await axios.delete(`/api/watering/${id}`);
        fetchRecords();
        fetchReports();
        Swal.fire({ icon: 'success', title: 'ลบสำเร็จ!', showConfirmButton: false, timer: 1500 });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) return Swal.fire('อ๊ะ!', 'ไม่มีข้อมูลสำหรับ Export', 'info');
    const headers = ['ID', 'วันเวลา', 'โซน', 'ระยะเวลา(นาที)', 'ปริมาณน้ำ(ลิตร)', 'หมายเหตุ'];
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
      headers.join(",") + "\n" + 
      records.map(r => [
        r.id, 
        new Date(r.timestamp).toLocaleString('th-TH').replace(/,/g, ''), 
        `"${r.zone}"`, 
        r.duration_minutes, 
        r.liter_amount, 
        `"${r.notes || ''}"`
      ].join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "watering_records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1>จัดการการให้น้ำ</h1>
          <p className="subtitle">บันทึกและแก้ไขประวัติการให้น้ำในแต่ละโซน</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExportCSV}>
            <Download size={18} /> Export CSV
          </button>
          <button className="btn-primary" onClick={openAddModal}>
            <Plus size={18} /> เพิ่มรายการใหม่
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>วันเวลา</th>
                <th>โซน</th>
                <th>เวลา (นาที)</th>
                <th>ปริมาณน้ำ (L)</th>
                <th>หมายเหตุ</th>
                <th className="text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => (
                <tr key={record.id}>
                  <td>{new Date(record.timestamp).toLocaleString('th-TH')}</td>
                  <td><span className="badge">{record.zone}</span></td>
                  <td>{record.duration_minutes}</td>
                  <td><strong>{record.liter_amount}</strong></td>
                  <td className="note-cell">{record.notes || '-'}</td>
                  <td className="action-cell">
                    <button className="btn-icon edit" onClick={() => openEditModal(record)} title="แก้ไข">
                      <Edit2 size={16} />
                    </button>
                    <button className="btn-icon delete" onClick={() => handleDelete(record.id)} title="ลบ">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <Leaf size={40} color="#c8e6c9" />
                    <p>ยังไม่มีประวัติการให้น้ำ</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal scale-in">
            <div className="modal-header">
              <h2>{editingId ? 'แก้ไขประวัติ' : 'เพิ่มประวัติการให้น้ำ'}</h2>
              <button className="btn-icon close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group-row">
                <div className="form-group">
                  <label>วันเวลา</label>
                  <input type="datetime-local" name="timestamp" value={formData.timestamp} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>โซนแปลง หรือ พันธุ์ทุเรียน</label>
                  <select name="zone" value={formData.zone} onChange={handleInputChange} required>
                    <option value="โซน A (หมอนทอง)">โซน A (หมอนทอง)</option>
                    <option value="โซน B (ก้านยาว)">โซน B (ก้านยาว)</option>
                    <option value="โซน C (ชะนี)">โซน C (ชะนี)</option>
                    <option value="โซน D (พวงมณี)">โซน D (พวงมณี)</option>
                    <option value="โซนเพาะกล้าใหม่">โซนเพาะกล้าใหม่</option>
                  </select>
                </div>
              </div>
              <div className="form-group-row">
                <div className="form-group">
                  <label>ระยะเวลา (นาที)</label>
                  <input type="number" name="duration_minutes" value={formData.duration_minutes} onChange={handleInputChange} required min="1" />
                </div>
                <div className="form-group">
                  <label>ปริมาณน้ำ (ลิตร)</label>
                  <input type="number" name="liter_amount" value={formData.liter_amount} onChange={handleInputChange} required min="0" step="0.1" />
                </div>
              </div>
              <div className="form-group">
                <label>หมายเหตุ</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" placeholder="ปุ๋ยเสริม, สภาพอากาศ, ฯลฯ"></textarea>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn-primary">{editingId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Reports Page Component
function ReportsPage({ reports }) {
  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1>รายงานสรุปการให้น้ำ</h1>
          <p className="subtitle">ติดตามข้อมูลการใช้น้ำของสวนทุเรียน</p>
        </div>
      </div>

      <div className="report-grid">
        <div className="card report-widget weekly">
          <div className="widget-icon"><History size={24} /></div>
          <h3>สัปดาห์ล่าสุด</h3>
          {reports.weekly.length > 0 ? (
            <>
              <div className="value">{reports.weekly[reports.weekly.length-1].total_liters} <span>Liters</span></div>
              <div className="sub-value">จำนวน {reports.weekly[reports.weekly.length-1].count} ครั้ง (สัปดาห์ {reports.weekly[reports.weekly.length-1].week})</div>
            </>
          ) : <p className="empty-val">ไม่มีข้อมูล</p>}
        </div>
        
        <div className="card report-widget monthly">
          <div className="widget-icon"><LayoutDashboard size={24} /></div>
          <h3>เดือนล่าสุด</h3>
          {reports.monthly.length > 0 ? (
            <>
              <div className="value">{reports.monthly[reports.monthly.length-1].total_liters} <span>Liters</span></div>
              <div className="sub-value">จำนวน {reports.monthly[reports.monthly.length-1].count} ครั้ง (รอบเดือน {reports.monthly[reports.monthly.length-1].month})</div>
            </>
          ) : <p className="empty-val">ไม่มีข้อมูล</p>}
        </div>

        <div className="card report-widget yearly">
          <div className="widget-icon"><Leaf size={24} /></div>
          <h3>ปีล่าสุด</h3>
          {reports.yearly.length > 0 ? (
            <>
              <div className="value">{reports.yearly[reports.yearly.length-1].total_liters} <span>Liters</span></div>
              <div className="sub-value">รอบปี {reports.yearly[reports.yearly.length-1].year}</div>
            </>
          ) : <p className="empty-val">ไม่มีข้อมูล</p>}
        </div>
      </div>

      <div className="card chart-card">
        <h2>ปริมาณน้ำรายเดือน (ลิตร)</h2>
        <div style={{ width: '100%', height: 350, marginTop: '20px' }}>
          <ResponsiveContainer>
            <BarChart data={reports.monthly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 13}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 13}} dx={-10} />
              <Tooltip 
                cursor={{fill: '#f1f8e9'}} 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.08)'}} 
              />
              <Legend wrapperStyle={{paddingTop: '20px'}} />
              <Bar dataKey="total_liters" fill="url(#colorLiters)" name="ปริมาณน้ำ (ลิตร)" radius={[6, 6, 0, 0]}>
              </Bar>
              <defs>
                <linearGradient id="colorLiters" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4caf50" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#2e7d32" stopOpacity={1}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Weather Page Component (Supplementary Function)
function WeatherPage() {
  const locations = [
    { name: 'จันทบุรี', lat: 12.6111, lng: 102.1039 },
    { name: 'ระยอง', lat: 12.6814, lng: 101.2816 },
    { name: 'ชุมพร', lat: 10.4930, lng: 99.1800 },
    { name: 'ตราด', lat: 12.2428, lng: 102.5175 },
    { name: 'ศรีสะเกษ', lat: 15.1186, lng: 104.3220 },
    { name: 'นครศรีธรรมราช', lat: 8.4351, lng: 99.9631 },
    { name: 'ยะลา', lat: 6.5411, lng: 101.2804 },
    { name: 'กรุงเทพมหานคร', lat: 13.7563, lng: 100.5018 },
  ];

  const getInitialLocation = () => {
    const saved = localStorage.getItem('durianFarmLocation');
    if (saved) {
      try { return JSON.parse(saved); } catch(e){}
    }
    return locations[0];
  };

  const [location, setLocation] = useState(getInitialLocation);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('durianFarmLocation', JSON.stringify(location));
    // Fetch from free Open-Meteo API specifically for chosen location
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FBangkok`);
        setWeather(res.data);
      } catch (error) {
        console.error("Error fetching weather:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [location]);

  const handleLocationChange = (e) => {
    const selected = locations.find(p => p.name === e.target.value);
    if(selected) setLocation(selected);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      return Swal.fire('ข้อผิดพลาด', 'เบราว์เซอร์ของคุณไม่รองรับการดึงตำแหน่ง (GPS)', 'error');
    }
    
    Swal.fire({ title: 'กำลังดึงพิกัดดาวเทียม...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
           const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=th`);
           let placeName = `📍 พิกัด GPS (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
           if (res.data && res.data.address) {
             const addr = res.data.address;
             const province = addr.state || addr.province || '';
             const district = addr.city_district || addr.town || addr.municipality || addr.county || addr.district || '';
             const subdistrict = addr.suburb || addr.subdistrict || addr.village || addr.township || addr.city || '';
             
             let parts = [];
             if (subdistrict && subdistrict !== province) parts.push(subdistrict);
             if (district && district !== subdistrict && district !== province) parts.push(district);
             if (province) parts.push(province);
             
             placeName = parts.length > 0 ? parts.join(', ') : `พิกัด GPS (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
           }

           const newLoc = { name: placeName, lat, lng };
           setLocation(newLoc);
           Swal.close();
           Swal.fire({ icon: 'success', title: 'ระบุตำแหน่งสำเร็จ!', text: `คุณอยู่ที่: ${placeName}`, footer: '<small style="color: #666">หมายเหตุ: พิกัดบนคอมพิวเตอร์อาจมีความคลาดเคลื่อนได้</small>', timer: 3500, showConfirmButton: false });
        } catch(err) {
           console.error("Reverse geocoding error", err);
           const newLoc = { name: `พิกัด GPS (${lat.toFixed(2)}, ${lng.toFixed(2)})`, lat, lng };
           setLocation(newLoc);
           Swal.close();
        }
      },
      (error) => {
        Swal.fire('การเข้าถึงถูกปฏิเสธ', 'กรุณาอนุญาต Location Permission ในเบราว์เซอร์ของคุณ', 'error');
      }
    );
  };

  const handleSearchLocation = async () => {
    const { value: query } = await Swal.fire({
      title: 'ค้นหาที่ตั้งสวน',
      input: 'text',
      inputLabel: 'พิมพ์ชื่ออำเภอ, จังหวัด หรือสถานที่',
      inputPlaceholder: 'เช่น ท่าใหม่ จันทบุรี...',
      showCancelButton: true,
      confirmButtonText: 'ค้นหา',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#2e7d32',
    });

    if (query) {
      Swal.fire({ title: 'กำลังค้นหา...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=th`);
        Swal.close();
        
        if (res.data && res.data.length > 0) {
          const options = res.data.reduce((acc, item) => {
            // Shorten the address for the dropdown list to prevent overflow
            const parts = item.display_name.split(',');
            const shortDisplayName = parts.slice(0, 3).join(',').trim();
            acc[item.place_id] = shortDisplayName;
            return acc;
          }, {});

          const { value: placeId } = await Swal.fire({
            title: 'เลือกสถานที่ที่ถูกต้อง',
            input: 'select',
            inputOptions: options,
            inputPlaceholder: 'เลือกจากรายการ...',
            showCancelButton: true,
            confirmButtonText: 'ตกลง',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#2e7d32',
          });

          if (placeId) {
            const selectedMatch = res.data.find(item => item.place_id.toString() === placeId.toString());
            const nameParts = selectedMatch.display_name.split(',');
            const shortName = nameParts.slice(0, 2).join(',').trim();
            
            const newLoc = {
              name: shortName,
              lat: parseFloat(selectedMatch.lat),
              lng: parseFloat(selectedMatch.lon)
            };
            setLocation(newLoc);
            Swal.fire({ icon: 'success', title: 'เปลี่ยนตำแหน่งสำเร็จ!', text: `ตำแหน่งใหม่: ${shortName}`, timer: 2000, showConfirmButton: false });
          }
        } else {
          Swal.fire('ไม่พบสถานที่', 'กรุณาลองระบุคำค้นหาให้ชัดเจนกว่าเดิม', 'info');
        }
      } catch (err) {
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อระบบค้นหาได้', 'error');
      }
    }
  };

  return (
    <div className="page-content fade-in">
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px'}}>
        <div>
          <h1>สภาพอากาศ & สิ่งแวดล้อม (API)</h1>
          <p className="subtitle">ระบบวิเคราะห์และแนะนำการให้น้ำตามสภาพอากาศจริง</p>
        </div>
        <div className="location-card-container">
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
             <label style={{marginRight: '12px', fontWeight: '600', color: '#2e7d32'}}>เลือกที่ตั้งสวน:</label>
             <select value={location.name} onChange={handleLocationChange} style={{flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px', outline: 'none', cursor: 'pointer', background: '#f1f8e9'}}>
               {locations.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
               {!locations.find(p => p.name === location.name) && <option value={location.name}>📍 {location.name}</option>}
             </select>
          </div>
          <div className="location-actions">
            <button className="btn-secondary" style={{flex: 1, fontSize: '13px', padding: '8px 12px', display: 'flex', justifyContent: 'center', borderColor: '#2196f3', color: '#1565c0', background: '#e3f2fd'}} onClick={handleUseMyLocation}>
              <MapPin size={16} /> GPS อัตโนมัติ
            </button>
            <button className="btn-secondary" style={{flex: 1, fontSize: '13px', padding: '8px 12px', display: 'flex', justifyContent: 'center', borderColor: '#4caf50', color: '#2e7d32', background: '#e8f5e9'}} onClick={handleSearchLocation}>
               <Settings size={16} /> ค้นหาสถานที่
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="empty-state"><p>กำลังโหลดข้อมูลพยากรณ์อากาศ...</p></div>
      ) : weather ? (
        <>
          <div className="report-grid">
            <div className="card report-widget" style={{background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)', borderColor: '#90caf9'}}>
              <div className="widget-icon" style={{color: '#1976d2', background: 'rgba(25,118,210,0.1)'}}><Thermometer size={24} /></div>
              <h3 style={{color: '#1565c0'}}>อุณหภูมิปัจจุบัน</h3>
              <div className="value" style={{color: '#0d47a1'}}>{weather.current.temperature_2m} <span>°C</span></div>
            </div>
            <div className="card report-widget" style={{background: 'linear-gradient(135deg, #e0f7fa, #b2ebf2)', borderColor: '#80deea'}}>
              <div className="widget-icon" style={{color: '#0097a7', background: 'rgba(0,151,167,0.1)'}}><Droplets size={24} /></div>
              <h3 style={{color: '#00838f'}}>ความชื้นสัมพัทธ์</h3>
              <div className="value" style={{color: '#006064'}}>{weather.current.relative_humidity_2m} <span>%</span></div>
            </div>
            <div className="card report-widget" style={{background: 'linear-gradient(135deg, #f3e5f5, #e1bee7)', borderColor: '#ce93d8'}}>
              <div className="widget-icon" style={{color: '#7b1fa2', background: 'rgba(123,31,162,0.1)'}}><Wind size={24} /></div>
              <h3 style={{color: '#6a1b9a'}}>ความเร็วลม</h3>
              <div className="value" style={{color: '#4a148c'}}>{weather.current.wind_speed_10m} <span>km/h</span></div>
            </div>
          </div>
          
          {/* AI Analysis Card */}
          <div className="card" style={{marginTop: '24px', background: '#fff8e1', borderLeft: '6px solid #ff9800', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
             <h3 style={{color: '#e65100', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
               <Leaf size={20} /> วิเคราะห์ความชื้นและคำแนะนำการให้น้ำอัจฉริยะ (AI Assistant)
             </h3>
             {weather.current.relative_humidity_2m < 40 ? (
                <div style={{fontSize: '15px', lineHeight: '1.6', color: '#424242'}}>
                  <p><strong style={{color: '#d84315'}}>สถานะ:</strong> ความชื้นสัมพัทธ์ในอากาศ <strong>({weather.current.relative_humidity_2m}%) ต่ำมาก (อากาศแห้งจัด)</strong></p>
                  <p><strong style={{color: '#2e7d32'}}>คำแนะนำระบบ:</strong> อากาศแห้งทำให้ดินคายน้ำเร็วเป็นพิเศษ ควรพิจารณา <strong>เพิ่มระยะเวลาหรือปริมาณการให้น้ำอีก 20-30%</strong> เพื่อรักษาความชุ่มชื้นให้รากทุเรียน ป้องกันใบไหม้</p>
                </div>
             ) : weather.current.relative_humidity_2m > 80 ? (
                <div style={{fontSize: '15px', lineHeight: '1.6', color: '#424242'}}>
                  <p><strong style={{color: '#0277bd'}}>สถานะ:</strong> ความชื้นสัมพัทธ์ในอากาศ <strong>({weather.current.relative_humidity_2m}%) สูงมาก (อากาศชื้นจัด)</strong></p>
                  <p><strong style={{color: '#2e7d32'}}>คำแนะนำระบบ:</strong> อากาศชื้นจัดเสี่ยงต่อการสะสมของเชื้อรา (เช่น โรครากเน่าโคนเน่าในทุเรียน) <strong>ควรงดการให้น้ำในช่วงเย็นหรือค่ำเด็ดขาด</strong> แนะนำให้รดน้ำเฉพาะช่วงเช้าเพื่อให้ใบแห้งทันก่อนค่ำ และสามารถลดปริมาณน้ำลง 10-20% ได้</p>
                </div>
             ) : (
                <div style={{fontSize: '15px', lineHeight: '1.6', color: '#424242'}}>
                  <p><strong style={{color: '#2e7d32'}}>สถานะ:</strong> ความชื้นสัมพัทธ์ในอากาศ <strong>({weather.current.relative_humidity_2m}%) อยู่ในเกณฑ์มาตรฐานที่เหมาะสม</strong></p>
                  <p><strong style={{color: '#2e7d32'}}>คำแนะนำระบบ:</strong> สภาพอากาศเอื้ออำนวยต่อการเจริญเติบโตของทุเรียน สามารถ <strong>ให้น้ำตามตารางหรือปริมาณปกติของสวน</strong> ได้เลยครับ</p>
                </div>
             )}
          </div>
          
          <div className="card" style={{marginTop: '24px'}}>
            <h2>พยากรณ์อากาศ 7 วันล่วงหน้า (โอกาสฝนตก)</h2>
            <div className="table-responsive" style={{marginTop: '15px'}}>
              <table>
                <thead>
                  <tr>
                    <th>วันที่</th>
                    <th>อุณหภูมิสูงสุด-ต่ำสุด</th>
                    <th>โอกาสเกิดฝน</th>
                    <th>คำแนะนำการให้น้ำ</th>
                  </tr>
                </thead>
                <tbody>
                  {weather.daily.time.map((date, index) => {
                    const rainProb = weather.daily.precipitation_probability_max[index];
                    return (
                      <tr key={date}>
                        <td>{new Date(date).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short' })}</td>
                        <td>{weather.daily.temperature_2m_min[index]}°C - {weather.daily.temperature_2m_max[index]}°C</td>
                        <td>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <div style={{ background: '#eee', flex: 1, height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                               <div style={{ background: '#4db6ac', width: `${rainProb}%`, height: '100%' }}></div>
                             </div>
                             <span style={{minWidth: '35px'}}>{rainProb}%</span>
                           </div>
                        </td>
                        <td>
                          {rainProb > 70 ? (
                            <span className="badge" style={{background: '#ffebee', color: '#c62828'}}>งดให้น้ำ (ฝนจะตก)</span>
                          ) : rainProb > 40 ? (
                            <span className="badge" style={{background: '#fff3e0', color: '#ef6c00'}}>ลดปริมาณน้ำ</span>
                          ) : (
                            <span className="badge" style={{background: '#e8f5e9', color: '#2e7d32'}}>ให้น้ำตามปกติ</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : <p>ไม่สามารถโหลดข้อมูลได้</p>}
    </div>
  );
}

// Admin Users Page Component
function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  
  const fetchData = async () => {
    try {
      const [resUsers, resGrowth] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/reports/users')
      ]);
      setUsers(resUsers.data);
      setGrowthData(resGrowth.data);
    } catch(err) { console.error(err); }
  }

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'ลบผู้ใช้งาน?',
      text: "ลบแล้วจะไม่สามารถกู้คืนบัญชีผู้ใช้นี้ได้อีก",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53935',
      cancelButtonColor: '#9e9e9e',
      confirmButtonText: 'ยืนยันการลบ',
      cancelButtonText: 'ยกเลิก'
    });
    if(result.isConfirmed) {
      await axios.delete(`/api/users/${id}`);
      fetchData();
      Swal.fire({ icon: 'success', title: 'ลบผู้ใช้สำเร็จ!', showConfirmButton: false, timer: 1500 });
    }
  }

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: editingUser.username,
        role: editingUser.role
      };
      if (editingUser.password && editingUser.password.trim() !== '') {
        payload.password = editingUser.password;
      }
      
      await axios.put(`/api/users/${editingUser.id}`, payload);
      setEditingUser(null);
      fetchData();
      Swal.fire({ icon: 'success', title: 'อัปเดตข้อมูลสำเร็จ!', showConfirmButton: false, timer: 1500 });
    } catch (err) {
      Swal.fire("ข้อผิดพลาด", err.response?.data?.detail || 'แก้ไขไม่สำเร็จ', "error");
    }
  }

  return (
     <div className="page-content fade-in">
        <div className="page-header">
           <div>
             <h1>การจัดการผู้ใช้งาน (Admin)</h1>
             <p className="subtitle">ดูระบบจัดการ Users ภายในระบบและการเติบโตของผู้ใช้ใหม่</p>
           </div>
        </div>
        
        <div className="card chart-card" style={{marginBottom: '24px'}}>
          <h2>📊 กราฟจำนวนผู้ใช้งานระบบ (User Growth)</h2>
          <div style={{ width: '100%', height: 350, marginTop: '20px' }}>
            <ResponsiveContainer>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                <Legend wrapperStyle={{paddingTop: '20px'}}/>
                <Line type="monotone" dataKey="total_users" stroke="#1565c0" name="ผู้ใช้งานสะสมรวม" strokeWidth={3} />
                <Line type="monotone" dataKey="new_users" stroke="#4caf50" name="ผู้ลงทะเบียนใหม่ (รายเดือน)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
           <h2 style={{marginBottom: '20px'}}>ตารางข้อมูลบัญชีผู้ใช้</h2>
           <div className="table-responsive">
             <table>
               <thead>
                 <tr>
                   <th>User ID</th>
                   <th>ชื่อผู้ใช้งาน (Username)</th>
                   <th>สิทธิ์ (Role)</th>
                   <th>วันที่สมัคร</th>
                   <th className="text-center">จัดการ</th>
                 </tr>
               </thead>
               <tbody>
                 {users.map(u => (
                   <tr key={u.id}>
                     <td>{u.id}</td>
                     <td><strong>{u.username}</strong></td>
                     <td><span className="badge" style={u.role==='admin' ? {background: '#e3f2fd', color: '#1565c0'} : {}}>{u.role.toUpperCase()}</span></td>
                     <td>{new Date(u.created_at).toLocaleString('th-TH')}</td>
                     <td className="action-cell">
                        <button className="btn-icon edit" onClick={() => setEditingUser({...u})} title="แก้ไขข้อมูล">
                          <Edit2 size={16}/>
                        </button>
                        <button className="btn-icon delete" onClick={() => handleDelete(u.id)} disabled={u.username==='admin'} title="ลบผู้ใช้">
                          <Trash2 size={16}/>
                        </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>

        {/* Edit User Modal */}
        {editingUser && (
          <div className="modal-overlay">
            <div className="modal scale-in" style={{maxWidth: '400px'}}>
              <div className="modal-header">
                <h2>✏️ แก้ไขข้อมูลผู้ใช้งาน</h2>
                <button className="btn-icon close-btn" onClick={() => setEditingUser(null)}><X size={24}/></button>
              </div>
              <form onSubmit={handleEditUser} className="modal-body">
                <div className="form-group">
                  <label>ชื่อผู้ใช้งาน (Username)</label>
                  <input type="text" value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} required/>
                </div>
                <div className="form-group">
                  <label>สิทธิ์การใช้งาน (Role)</label>
                  <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})} required>
                    <option value="user">User (ทั่วไป)</option>
                    <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>เปลี่ยนรหัสผ่านใหม่ (ไม่บังคับ)</label>
                  <input type="password" placeholder="(เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})}/>
                </div>
                <div className="modal-footer" style={{padding: '16px 24px', marginTop: '20px'}}>
                  <button type="button" className="btn-secondary" onClick={() => setEditingUser(null)}>ยกเลิก</button>
                  <button type="submit" className="btn-primary">บันทึกการแก้ไข</button>
                </div>
              </form>
            </div>
          </div>
        )}
     </div>
  );
}

// Profile Modal Component
function ProfileModal({ user, onClose, onUpdate }) {
  const [formData, setFormData] = useState({ username: user.username, password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      return Swal.fire({ icon: 'warning', title: 'รหัสผ่านไม่ตรงกัน', text: 'ยืนยันรหัสผ่านใหม่ให้ถูกต้อง', confirmButtonColor: '#ff9800' });
    }
    try {
      const payload = { username: formData.username };
      if (formData.password) payload.password = formData.password;
      
      const res = await axios.put(`/api/users/${user.id}`, payload);
      onUpdate(res.data);
      Swal.fire({ icon: 'success', title: 'อัปเดตข้อมูลสำเร็จ!', showConfirmButton: false, timer: 1500 });
      onClose();
    } catch (err) {
      Swal.fire("ข้อผิดพลาด", err.response?.data?.detail || 'แก้ไขไม่สำเร็จ', "error");
    }
  }

  return (
    <div className="modal-overlay" style={{zIndex: 2000}}>
      <div className="modal scale-in" style={{maxWidth: '400px'}}>
        <div className="modal-header">
          <h2>⚙️ ตั้งค่าโปรไฟล์ส่วนตัว</h2>
          <button className="btn-icon close-btn" onClick={onClose}><X size={24}/></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>ชื่อผู้ใช้งาน (Username)</label>
            <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required/>
          </div>
          <div className="form-group">
            <label>เปลี่ยนรหัสผ่านใหม่ (ไม่บังคับ)</label>
            <div style={{position: 'relative'}}>
              <input type={showPassword ? "text" : "password"} placeholder="เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{width: '100%', paddingRight: '40px'}}/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: 0}}>
                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>
          </div>
          {formData.password && (
            <div className="form-group">
              <label>ยืนยันรหัสผ่านใหม่</label>
              <input type={showPassword ? "text" : "password"} value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง" style={{width: '100%'}}/>
            </div>
          )}
          <div className="modal-footer" style={{padding: '16px 24px', marginTop: '20px'}}>
            <button type="button" className="btn-secondary" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn-primary">บันทึกข้อมูล</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Auth Page Component
function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await axios.post('/api/auth/login', { username: formData.username, password: formData.password });
        Swal.fire({
          icon: 'success', title: 'ล็อกอินสำเร็จ!', text: `ยินดีต้อนรับคุณ ${res.data.username}`,
          showConfirmButton: false, timer: 1500
        });
        onLogin(res.data);
      } else {
        if (formData.password !== formData.confirmPassword) {
          return Swal.fire({ icon: 'warning', title: 'รหัสผ่านไม่ตรงกัน', text: 'กรุณากรอกช่องรหัสผ่านและยืนยันรหัสผ่านให้ตรงกัน', confirmButtonColor: '#ff9800' });
        }
        await axios.post('/api/auth/register', { username: formData.username, password: formData.password, role: 'user' });
        await Swal.fire({
          icon: 'success', title: 'สมัครสมาชิกเรียบร้อย!', 
          text: 'สร้างบัญชีของคุณสำเร็จแล้ว กรุณาล็อกอินเข้าระบบด้วยรหัสผ่านใหม่',
          confirmButtonColor: '#4caf50'
        });
        setIsLogin(true);
        setFormData({ username: '', password: '', confirmPassword: '' });
        setShowPassword(false);
        setShowConfirmPassword(false);
      }
    } catch (err) {
      Swal.fire({
        icon: 'error', title: 'การเข้าสู่ระบบถูกปฏิเสธ',
        text: err.response?.data?.detail || 'รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง',
        confirmButtonColor: '#e53935'
      });
    }
  }

  return (
    <div style={{
        display: 'flex', minHeight: '100vh', flexDirection: 'column', 
        justifyContent: 'center', alignItems: 'center', 
        background: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=2000&auto=format&fit=crop') center/cover no-repeat"
    }}>
      <div className="glass-card scale-in" style={{width: '90%', maxWidth: '420px', padding: '40px', borderRadius: '24px'}}>
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
           <div style={{display: 'inline-flex', background: 'rgba(76, 175, 80, 0.15)', padding: '16px', borderRadius: '50%', marginBottom: '16px', border: '1px solid rgba(76, 175, 80, 0.3)'}}>
              <Leaf size={40} color="#81c784" />
           </div>
           <h2 style={{color: '#81c784', fontSize: '26px', margin: '0', fontWeight: 'bold', letterSpacing: '0.5px'}}>Smart Durian 4.0</h2>
           <p style={{color: 'rgba(255,255,255,0.7)', marginTop: '8px', fontSize: '14px'}}>ระบบจัดการและวิเคราะห์การให้น้ำอัจฉริยะ</p>
        </div>
        
        <h3 style={{textAlign: 'center', marginBottom: '24px', fontSize: '18px', fontWeight: '500', color: 'white'}}>{isLogin ? '— เข้าสู่ระบบ (Login) —' : '— สมัครสมาชิกใหม่ —'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{marginBottom: '16px'}}>
             <label style={{fontWeight: '500', display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.9)'}}>ชื่อผู้ใช้งาน (Username)</label>
             <input type="text" className="glass-input" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required placeholder="ระบุชื่อผู้ใช้งาน"/>
          </div>
          <div className="form-group" style={{marginBottom: isLogin ? '24px' : '16px'}}>
             <label style={{fontWeight: '500', display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.9)'}}>รหัสผ่าน (Password)</label>
             <div style={{position: 'relative'}}>
               <input type={showPassword ? "text" : "password"} className="glass-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required placeholder="••••••••"/>
               <button type="button" onClick={() => setShowPassword(!showPassword)} style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0}}>
                 {showPassword ? <EyeOff size={20} className="glass-toggle-icon"/> : <Eye size={20} className="glass-toggle-icon"/>}
               </button>
             </div>
          </div>
          
          {!isLogin && (
            <div className="form-group" style={{marginBottom: '24px'}}>
               <label style={{fontWeight: '500', display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.9)'}}>ยืนยันรหัสผ่าน (Confirm Password)</label>
               <div style={{position: 'relative'}}>
                 <input type={showConfirmPassword ? "text" : "password"} className="glass-input" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} required placeholder="••••••••"/>
                 <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0}}>
                   {showConfirmPassword ? <EyeOff size={20} className="glass-toggle-icon"/> : <Eye size={20} className="glass-toggle-icon"/>}
                 </button>
               </div>
            </div>
          )}

          <button type="submit" className="glass-btn" style={{width: '100%', padding: '14px', fontSize: '16px', marginTop: '10px'}}>
             {isLogin ? 'เข้าสู่ระบบเดี๋ยวนี้' : 'ยืนยันการสมัครสมาชิก'}
          </button>
        </form>
        
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '14px'}}>
          <span style={{color: 'rgba(255,255,255,0.6)'}}>{isLogin ? "ยังไม่มีบัญชีกับระบบเรา? " : "มีบัญชีอยู่แล้วใช่ไหม? "}</span>
          <button style={{background: 'none', border: 'none', color: '#81c784', cursor: 'pointer', fontWeight: '600', fontSize: '15px', marginTop: '8px', textDecoration: 'none'}} 
                  onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); setFormData({username: '', password: '', confirmPassword: ''}); setShowPassword(false); setShowConfirmPassword(false); }}>
             {isLogin ? "คลิกที่นี่เพื่อสมัครสมาชิกใหม่" : "กลับไปหน้าล็อกอิน"}
          </button>
        </div>
      </div>
    </div>
  )
}

// Main App Layout
function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('appUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [records, setRecords] = useState([]);
  const [reports, setReports] = useState({ weekly: [], monthly: [], yearly: [] });

  useEffect(() => {
    fetchRecords();
    fetchReports();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await axios.get('/api/watering/');
      setRecords(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    try {
      const [weekly, monthly, yearly] = await Promise.all([
        axios.get('/api/reports/weekly'),
        axios.get('/api/reports/monthly'),
        axios.get('/api/reports/yearly')
      ]);
      setReports({
        weekly: weekly.data,
        monthly: monthly.data,
        yearly: yearly.data
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('appUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('appUser');
  };

  const handleUpdateProfile = (updatedUser) => {
    const userToSave = { ...currentUser, ...updatedUser };
    setCurrentUser(userToSave);
    localStorage.setItem('appUser', JSON.stringify(userToSave));
  };

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar user={currentUser} onLogout={handleLogout} onEditProfile={() => setIsProfileModalOpen(true)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<RecordsPage records={records} fetchRecords={fetchRecords} fetchReports={fetchReports} />} />
            <Route path="/reports" element={<ReportsPage reports={reports} />} />
            <Route path="/weather" element={<WeatherPage />} />
            {currentUser.role === 'admin' && <Route path="/admin" element={<AdminUsersPage />} />}
            <Route path="*" element={<RecordsPage records={records} fetchRecords={fetchRecords} fetchReports={fetchReports} />} />
          </Routes>
        </main>
      </div>
      {isProfileModalOpen && <ProfileModal user={currentUser} onClose={() => setIsProfileModalOpen(false)} onUpdate={handleUpdateProfile} />}
    </Router>
  );
}

export default App;
