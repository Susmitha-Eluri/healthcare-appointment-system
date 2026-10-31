import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ChevronRight, Calendar as CalendarIcon, Clock, User as UserIcon } from 'lucide-react';

const BookAppointment = () => {
  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeptSelect = async (dept) => {
    setSelectedDept(dept);
    setLoading(true);
    try {
      const res = await api.get(`/doctors?department=${dept._id}`);
      setDoctors(res.data);
      setStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setStep(3);
  };

  const handleDateSelect = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (!date) return;
    
    setSlotsLoading(true);
    try {
      const res = await api.get(`/appointments/slots/${selectedDoctor.user._id}?date=${date}`);
      setAvailableSlots(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await api.post('/appointments', {
        doctor: selectedDoctor.user._id,
        department: selectedDept._id,
        date: selectedDate,
        startTime: selectedSlot
      });
      alert('Appointment booked successfully!');
      navigate('/patient');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Book an Appointment</h1>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 z-0"></div>
          <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-600 z-0 transition-all duration-500`} style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
          
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
              step >= item ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {item}
            </div>
          ))}
        </div>

        {/* Step 1: Department */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Select Department</h2>
            {loading ? <p>Loading departments...</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map(dept => (
                  <button
                    key={dept._id}
                    onClick={() => handleDeptSelect(dept)}
                    className="p-4 border border-gray-200 rounded-lg text-left hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 group-hover:text-blue-600">{dept.name}</span>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Doctor */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800">Select Doctor ({selectedDept?.name})</h2>
              <button onClick={() => setStep(1)} className="text-sm text-blue-600 hover:underline">Back</button>
            </div>
            
            {loading ? <p>Loading doctors...</p> : doctors.length === 0 ? <p className="text-gray-500">No doctors available in this department.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map(doc => (
                  <button
                    key={doc._id}
                    onClick={() => handleDoctorSelect(doc)}
                    className="p-5 border border-gray-200 rounded-lg text-left hover:border-blue-500 hover:shadow-md transition-all flex items-start space-x-4 group"
                  >
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600">{doc.user?.name}</p>
                      <p className="text-sm text-gray-500">{doc.specialization}</p>
                      <p className="text-xs text-gray-400 mt-1">{doc.experience} years exp.</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date & Time */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-800">Select Date & Time for {selectedDoctor?.user?.name}</h2>
              <button onClick={() => setStep(2)} className="text-sm text-blue-600 hover:underline">Back</button>
            </div>

            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" /> Choose Date
              </label>
              <input
                type="date"
                min={today}
                value={selectedDate}
                onChange={handleDateSelect}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" /> Available Time Slots
                </label>
                {slotsLoading ? (
                  <p className="text-gray-500 text-sm">Checking availability...</p>
                ) : availableSlots.length === 0 ? (
                  <div className="bg-orange-50 text-orange-700 p-4 rounded-md text-sm border border-orange-200">
                    No slots available on this date. The doctor might be off or fully booked. Please select another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => { setSelectedSlot(slot); setStep(4); }}
                        className="py-2 px-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700 transition"
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800">Confirm Appointment</h2>
              <button onClick={() => setStep(3)} className="text-sm text-blue-600 hover:underline">Back</button>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
              <div className="flex justify-between border-b pb-4">
                <span className="text-gray-500">Department</span>
                <span className="font-medium text-gray-900">{selectedDept?.name}</span>
              </div>
              <div className="flex justify-between border-b pb-4">
                <span className="text-gray-500">Doctor</span>
                <span className="font-medium text-gray-900">{selectedDoctor?.user?.name}</span>
              </div>
              <div className="flex justify-between border-b pb-4">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-900">{new Date(selectedDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-medium text-gray-900">{selectedSlot}</span>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-70"
            >
              {loading ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;
