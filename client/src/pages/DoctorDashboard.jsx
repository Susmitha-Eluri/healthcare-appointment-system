import React, { useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { User, Clock, CheckCircle, XCircle, PlayCircle } from 'lucide-react';

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ today: 0, completed: 0, noShow: 0, waiting: 0 });
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const res = await api.get(`/queue/${user._id}`);
      setQueue(res.data);
      
      const resStats = await api.get('/appointments/doctor', { params: { date: new Date().toISOString() } });
      const apps = resStats.data;
      setStats({
        today: apps.length,
        completed: apps.filter(a => a.status === 'COMPLETED').length,
        noShow: apps.filter(a => a.status === 'NO_SHOW').length,
        waiting: res.data.filter(a => a.status === 'WAITING').length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    
    const socket = io('http://localhost:5000');
    socket.emit('join_doctor_queue', user._id);
    
    socket.on('queue_updated', () => {
      fetchQueue();
    });

    return () => socket.disconnect();
  }, [user._id]);

  const updateStatus = async (id, action) => {
    try {
      await api.put(`/queue/${id}/${action}`);
      // Socket will trigger re-fetch, but optimistic UI update can be done here
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading queue...</div>;

  const currentPatient = queue.find(q => q.status === 'IN_PROGRESS');
  const waitingPatients = queue.filter(q => q.status === 'WAITING' || q.status === 'CHECKED_IN');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Today's Appointments</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.today}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Waiting Patients</dt>
          <dd className="mt-1 text-3xl font-semibold text-orange-600">{stats.waiting}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
          <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.completed}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-5">
          <dt className="text-sm font-medium text-gray-500 truncate">No Shows</dt>
          <dd className="mt-1 text-3xl font-semibold text-red-600">{stats.noShow}</dd>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Current Patient */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 h-full border-t-4 border-t-blue-500">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="mr-2 h-5 w-5 text-blue-500" />
              Current Patient
            </h2>
            
            {currentPatient ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-blue-500 font-semibold uppercase tracking-wider mb-1">Queue Number</p>
                  <p className="text-4xl font-bold text-blue-700">{currentPatient.queueNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Patient Name</p>
                  <p className="text-lg font-medium text-gray-900">{currentPatient.patient?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time Slot</p>
                  <p className="text-md text-gray-900">{currentPatient.startTime} - {currentPatient.endTime}</p>
                </div>
                
                <div className="pt-4 flex space-x-3">
                  <button
                    onClick={() => updateStatus(currentPatient._id, 'complete')}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex justify-center items-center font-medium"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Complete
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No patient currently in consultation.</p>
                {waitingPatients.length > 0 && (
                  <button
                    onClick={() => updateStatus(waitingPatients[0]._id, 'start')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition inline-flex items-center"
                  >
                    <PlayCircle className="mr-2 h-4 w-4" /> Start Next Patient
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Waiting Queue */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-gray-500" />
                Waiting Queue
              </h2>
            </div>
            
            {waitingPatients.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {waitingPatients.map((apt, idx) => (
                  <li key={apt._id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center border-2 border-orange-200">
                          <span className="text-orange-700 font-bold">{apt.queueNumber}</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{apt.patient?.name}</p>
                          <p className="text-sm text-gray-500">Slot: {apt.startTime}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {idx === 0 && !currentPatient && (
                           <button
                             onClick={() => updateStatus(apt._id, 'start')}
                             className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                           >
                             <PlayCircle className="mr-1 h-3.5 w-3.5" /> Start
                           </button>
                        )}
                        <button
                          onClick={() => updateStatus(apt._id, 'no-show')}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" /> No Show
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No patients waiting in the queue.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
