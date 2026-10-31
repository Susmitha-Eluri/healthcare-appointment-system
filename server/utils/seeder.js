const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Department = require('../models/Department');
const Room = require('../models/Room');
const Appointment = require('../models/Appointment');
const connectDB = require('../config/db');

dotenv.config();
connectDB();

const seedData = async () => {
    try {
        await User.deleteMany();
        await DoctorProfile.deleteMany();
        await Department.deleteMany();
        await Room.deleteMany();
        await Appointment.deleteMany();

        // 1. Create Admin
        const adminUser = await User.create({
            name: 'Hospital Admin',
            email: 'admin@hospital.com',
            password: 'password123',
            role: 'ADMIN',
            phone: '1234567890'
        });

        // 2. Create Departments
        const depts = [
            { name: 'Cardiology', description: 'Heart related issues' },
            { name: 'General Medicine', description: 'General checkups and illness' },
            { name: 'Dermatology', description: 'Skin related issues' },
            { name: 'ENT', description: 'Ear, Nose, Throat' },
            { name: 'Orthopedics', description: 'Bone and muscle issues' }
        ];
        const createdDepts = await Department.insertMany(depts);

        // 3. Create Doctors
        const doctorsData = [
            { name: 'Dr. John Smith', email: 'john@hospital.com', specialization: 'Cardiologist', dept: createdDepts[0]._id },
            { name: 'Dr. Emily Chen', email: 'emily@hospital.com', specialization: 'General Physician', dept: createdDepts[1]._id },
            { name: 'Dr. Michael Davis', email: 'michael@hospital.com', specialization: 'Dermatologist', dept: createdDepts[2]._id },
            { name: 'Dr. Sarah Wilson', email: 'sarah@hospital.com', specialization: 'ENT Specialist', dept: createdDepts[3]._id },
            { name: 'Dr. Robert Taylor', email: 'robert@hospital.com', specialization: 'Orthopedic Surgeon', dept: createdDepts[4]._id },
            { name: 'Dr. Jessica Martinez', email: 'jessica@hospital.com', specialization: 'Cardiologist', dept: createdDepts[0]._id },
            { name: 'Dr. William Anderson', email: 'william@hospital.com', specialization: 'General Physician', dept: createdDepts[1]._id },
            { name: 'Dr. Amanda Thomas', email: 'amanda@hospital.com', specialization: 'Pediatric Orthopedics', dept: createdDepts[4]._id }
        ];

        const doctorProfiles = [];
        for (const doc of doctorsData) {
            const user = await User.create({
                name: doc.name,
                email: doc.email,
                password: 'password123',
                role: 'DOCTOR',
                phone: '555-0000'
            });

            const profile = await DoctorProfile.create({
                user: user._id,
                department: doc.dept,
                specialization: doc.specialization,
                experience: Math.floor(Math.random() * 15) + 5,
                consultationDuration: 30,
                workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                startTime: '09:00',
                endTime: '17:00',
                breakStartTime: '13:00',
                breakEndTime: '14:00'
            });
            doctorProfiles.push(profile);
        }

        // 4. Create Patients
        const patients = [];
        for (let i = 1; i <= 15; i++) {
            const user = await User.create({
                name: `Patient ${i}`,
                email: `patient${i}@test.com`,
                password: 'password123',
                role: 'PATIENT',
                phone: `555-010${i}`
            });
            patients.push(user);
        }

        // 5. Create Rooms
        for (let i = 0; i < 5; i++) {
            await Room.create({
                roomNumber: `Room ${101 + i}`,
                department: createdDepts[i]._id,
                status: 'AVAILABLE'
            });
        }

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

seedData();
