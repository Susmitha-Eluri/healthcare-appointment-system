import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Calendar, Clock, MapPin, Activity } from 'lucide-react';

const PatientDashboard = () => {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queueInfo, setQueueInfo] = useState(null);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/my');
      setAppointments(res.data);
      
      // If we have an active queue today
      const todayAppt = res.data.find(a => 
        (a.status === 'WAITING' || a.status === 'CHECKED_IN' || a.status === 'IN_PROGRESS') &&
        new Date(a.date).toDateString() === new Date().toDateString()
      );
      
      if (todayAppt) {
        // fetch current queue for that doctor to calculate wait time
        const queueRes = await api.get(`/queue/${todayAppt.doctor._id}`);
        const queueData = queueRes.data;
        
        // Find our position
        const ourIndex = queueData.findIndex(q => q._id === todayAppt._id);
        const currentServing = queueData.find(q => q.status === 'IN_PROGRESS');
        
        if (ourIndex !== -1) {
          const patientsAhead = queueData.filter((q, idx) => idx < ourIndex && q.status !== 'IN_PROGRESS').length;
          
          setQueueInfo({
            appointment: todayAppt,
            queueNumber: todayAppt.queueNumber,
            currentlyServing: currentServing ? currentServing.queueNumber : 'None',
            patientsAhead,
            estimatedWait: patientsAhead * 30 // assuming 30 min per patient
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();

    // Socket.io for queue updates
    const socket = io('http://localhost:5000');
    
    // In a real scenario we'd join the queue of the doctor we have an appointment with today
    // For simplicity, we can refetch if any queue updates
    // Actually we need to know which doctor. We can do it inside the fetchAppointments logic.
    
    // We'll set a generic listener after fetching if queueInfo exists
  }, []);

  const handleCheckIn = async (appointmentId) => {
    try {
      await api.post('/queue/check-in', { appointmentId });
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to check-in');
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status: 'CANCELLED' });
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const upcoming = appointments.filter(a => ['BOOKED', 'CHECKED_IN', 'WAITING'].includes(a.status));
  const history = appointments.filter(a => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
        <Link 
          to="/patient/book" 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium"
        >
          Book Appointment
        </Link>
      </div>

      {queueInfo && (
        <div className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden mb-8 relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="mr-2 h-6 w-6 text-blue-500 animate-pulse" />
              Live Queue Status
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium mb-1">Your Queue No.</p>
                <p className="text-3xl font-bold text-blue-800">{queueInfo.queueNumber}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 font-medium mb-1">Currently Serving</p>
                <p className="text-3xl font-bold text-gray-800">{queueInfo.currentlyServing}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-orange-600 font-medium mb-1">Patients Ahead</p>
                <p className="text-3xl font-bold text-orange-800">{queueInfo.patientsAhead}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium mb-1">Est. Wait</p>
                <p className="text-3xl font-bold text-green-800">{queueInfo.estimatedWait} min</p>
              </div>
            </div>
            {queueInfo.appointment.status === 'IN_PROGRESS' && (
              <div className="mt-4 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded text-center font-medium">
                The doctor is ready for you! Please enter the consultation room.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Upcoming Appointments</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {upcoming.length === 0 ? (
            <p className="p-6 text-gray-500 text-center">No upcoming appointments.</p>
          ) : (
            upcoming.map((appt) => (
              <div key={appt._id} className="p-6 hover:bg-gray-50 transition flex flex-col md:flex-row md:items-center justify-between">
                <div className="space-y-2 md:space-y-0 md:flex md:space-x-8">
                  <div>
                    <p className="text-sm font-medium text-gray-500 flex items-center">
                      <Calendar className="mr-1.5 h-4 w-4" /> Date
                    </p>
                    <p className="mt-1 text-base text-gray-900 font-medium">
                      {new Date(appt.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 flex items-center">
                      <Clock className="mr-1.5 h-4 w-4" /> Time
                    </p>
                    <p className="mt-1 text-base text-gray-900">{appt.startTime}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 flex items-center">
                      <MapPin className="mr-1.5 h-4 w-4" /> Doctor & Dept
                    </p>
                    <p className="mt-1 text-base text-gray-900">{appt.doctor?.name} <span className="text-sm text-gray-500">({appt.department?.name})</span></p>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex items-center space-x-3">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${appt.status === 'BOOKED' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                    {appt.status.replace('_', ' ')}
                  </span>
                  
                  {appt.status === 'BOOKED' && new Date(appt.date).toDateString() === new Date().toDateString() && (
                    <button 
                      onClick={() => handleCheckIn(appt._id)}
                      className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition"
                    >
                      Check In
                    </button>
                  )}
                  
                  {appt.status === 'BOOKED' && (
                    <button 
                      onClick={() => handleCancel(appt._id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
