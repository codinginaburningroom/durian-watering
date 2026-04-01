import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Leaf, LayoutDashboard, History, Download, Edit2, Trash2, Plus, X } from 'lucide-react';

// Navigation Sidebar Component
function Sidebar() {
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
      </nav>
      <div className="sidebar-footer">
        <p>ระบบการให้น้ำอัจฉริยะ</p>
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
      fetchRecords();
      fetchReports();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('ต้องการลบข้อมูลนี้หรือไม่?')) {
      try {
        await axios.delete(`/api/watering/${id}`);
        fetchRecords();
        fetchReports();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) return alert('ไม่มีข้อมูลสำหรับ Export');
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
                  <label>โซนแปลง (Zone)</label>
                  <input type="text" name="zone" value={formData.zone} onChange={handleInputChange} placeholder="เช่น โซน A, ท้ายสวน" required />
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

// Main App Layout
function App() {
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

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<RecordsPage records={records} fetchRecords={fetchRecords} fetchReports={fetchReports} />} />
            <Route path="/reports" element={<ReportsPage reports={reports} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
